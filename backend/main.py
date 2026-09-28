from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from paddleocr import PaddleOCR
import numpy as np
import cv2
import requests
import json
import time
import tempfile
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

yolo_model = YOLO("yolo11n.pt")
ocr_model = PaddleOCR(lang="en")

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "vision-copilot-v3"

CONFIDENCE_THRESHOLD = 0.5   # ignore detections below this confidence
MAX_OBJECTS = 5              # cap how many objects go to the LLM, even after filtering

SYSTEM_PROMPT = (
    "You are Vision Copilot. You assist a user by describing important "
    "information about their surroundings. Prioritize: 1. Hazards 2. Obstacles "
    "3. Meaningful movement 4. Navigation-relevant information 5. People 6. Text. "
    "Do not invent information. Do not claim intentions that cannot be observed. "
    "If confidence is low, communicate uncertainty. Keep responses concise because "
    "they may be spoken aloud. Respond only with valid JSON in the format: "
    '{"response": "...", "priority": "high|medium|low", "event_type": "...", "speak": true|false}'
)

# --- Cooldown / event engine state ---
COOLDOWN_SECONDS = 4
MIN_INTERVAL_SECONDS = 1

last_call_time = 0
last_scene_signature = None
last_result = {
    "response": "",
    "priority": "low",
    "event_type": "no_event",
    "speak": False
}


def get_scene_signature(detected_objects):
    return tuple(sorted(obj["type"] for obj in detected_objects))


def yolo_to_scene(detected_objects):
    objects = []
    for i, obj in enumerate(detected_objects):
        objects.append({
            "id": i + 1,
            "type": obj["type"],
            "position": "center",
            "movement": "stationary",
            "approaching": False,
            "confidence": obj["confidence"]
        })
    return {"objects": objects, "ocr": ""}


@app.post("/analyze")
async def analyze(frame: UploadFile = File(...)):
    global last_call_time, last_scene_signature, last_result

    contents = await frame.read()
    np_arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    print(f"Image shape: {img.shape if img is not None else 'IMAGE IS NONE'}")

    results = yolo_model(img)
    detected_objects = []
    for box in results[0].boxes:
        class_id = int(box.cls[0])
        class_name = yolo_model.names[class_id]
        confidence = float(box.conf[0])
        detected_objects.append({"type": class_name, "confidence": round(confidence, 2)})

    # Filter out low-confidence noise before it ever reaches the LLM
    filtered_objects = [
        obj for obj in detected_objects if obj["confidence"] >= CONFIDENCE_THRESHOLD
    ]

    # Sort by confidence, highest first, and cap the count sent to the LLM
    filtered_objects.sort(key=lambda o: o["confidence"], reverse=True)
    filtered_objects = filtered_objects[:MAX_OBJECTS]

    print(f"Raw detections: {detected_objects}")
    print(f"Filtered detections (>= {CONFIDENCE_THRESHOLD}, max {MAX_OBJECTS}): {filtered_objects}")

    scene_signature = get_scene_signature(filtered_objects)
    now = time.time()
    time_since_last_call = now - last_call_time
    scene_changed = scene_signature != last_scene_signature

    should_call_llm = False
    if scene_changed and time_since_last_call >= MIN_INTERVAL_SECONDS:
        should_call_llm = True
    elif not scene_changed and time_since_last_call >= COOLDOWN_SECONDS:
        should_call_llm = True

    if not should_call_llm:
        print(f"Skipping LLM call (scene_changed={scene_changed}, time_since_last_call={time_since_last_call:.2f}s)")
        return last_result

    scene = yolo_to_scene(filtered_objects)
    user_content = f"SCENE: {json.dumps(scene, separators=(',', ':'))}\nQUESTION: What's ahead?"

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ],
        "stream": False,
        "format": "json"
    }

    print("Sending to Ollama:")
    print(json.dumps(payload, indent=2))

    ollama_response = requests.post(OLLAMA_URL, json=payload)

    print("Ollama raw response:")
    print(ollama_response.text)

    llm_output_text = ollama_response.json()["message"]["content"]

    try:
        parsed = json.loads(llm_output_text)
    except json.JSONDecodeError:
        parsed = {
            "response": llm_output_text,
            "priority": "medium",
            "event_type": "unknown",
            "speak": True
        }

    last_call_time = now
    last_scene_signature = scene_signature
    last_result = parsed

    return parsed


@app.post("/read-text")
async def read_text(frame: UploadFile = File(...)):
    contents = await frame.read()

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = ocr_model.predict(tmp_path)

        detected_lines = []
        for res in result:
            detected_lines.extend(res["rec_texts"])

    finally:
        os.remove(tmp_path)

    if not detected_lines:
        return {
            "response": "No text detected.",
            "priority": "low",
            "event_type": "no_text_found",
            "speak": True
        }

    full_text = " ".join(detected_lines)

    return {
        "response": f"Text reads: {full_text}",
        "priority": "medium",
        "event_type": "text_read",
        "speak": True
    }


@app.get("/health")
async def health():
    return {"status": "ok"}