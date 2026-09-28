# Vision Copilot

A real-time assistive AI for blind and visually impaired users. It uses a webcam and a browser to describe the user's surroundings aloud, and reads text on demand.

**Demo video:** [PASTE DEMO VIDEO LINK]

## How it works

```
Webcam (browser) -> YOLO11n object detection -> scene JSON -> fine-tuned Llama 3.2 3B (Ollama) -> spoken response
                                                             \-> PaddleOCR (on demand "read this") -> spoken text
```

1. The browser captures a camera frame every few seconds and sends it to the FastAPI backend (`POST /analyze`).
2. YOLO11n detects objects. Detections below 0.5 confidence are dropped and at most 5 objects are kept.
3. The detections are converted into a compact scene JSON and sent to `vision-copilot-v3`, a Llama 3.2 3B model fine-tuned with QLoRA and served locally by Ollama.
4. The model returns `{response, priority, event_type, speak}`. It is trained to prioritise hazards, obstacles, movement, navigation information, people, then text, and to express uncertainty when confidence is low.
5. The frontend speaks the response with the Web Speech API. A cooldown avoids repeating the same description.
6. "Read this" sends a frame to `POST /read-text`, which runs PaddleOCR and returns the text to be read aloud.

Everything runs locally, so no camera data is sent to a cloud API.

## Repository layout

- `backend/` - FastAPI server (`main.py`), `requirements.txt`, and `Modelfile_v3_fixed` for recreating the model in Ollama
- `frontend/` - React + Vite website (camera capture, speech, OCR overlay)

## Setup

**Model weights are not included** in this repository because of their size (about 1.9 GB). The Modelfile expects a file named `vision-copilot-v3-q4.gguf` next to it. The backend needs this model to produce scene descriptions.

Backend:

```
cd backend
pip install -r requirements.txt
ollama create vision-copilot-v3 -f Modelfile_v3_fixed   # requires the GGUF file
uvicorn main:app --host 0.0.0.0 --port 8000
```

YOLO weights (`yolo11n.pt`) and PaddleOCR models download automatically on first run.

Frontend:

```
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000`. Endpoints: `GET /health`, `POST /analyze`, `POST /read-text`.

## Model training

- Base model: Llama 3.2 3B Instruct (Meta)
- Method: QLoRA (4-bit NF4, LoRA rank 16, alpha 32) with TRL `SFTTrainer`, 3 epochs, on Kaggle
- Dataset: programmatically generated scene-description examples (about 1,500 training examples in v3) covering spatial, motion, approaching, hazard, multi-object, low-confidence, OCR and no-event cases
- The merged model was converted to GGUF (Q4_K_M) for Ollama

Notable fixes during development:
- The model is sensitive to whitespace in the scene JSON, so it is sent in compact form.
- The Ollama Modelfile originally used a bare `{{ .Prompt }}` template that did not match the Llama 3 chat format used in training. Replacing it with the proper template (see `backend/Modelfile_v3_fixed`) fixed wrong answers on clearly detected objects.

## Existing code, models and assets (disclosure)

- Ultralytics YOLO11n (AGPL-3.0), pretrained COCO weights, used unmodified for detection
- Llama 3.2 3B Instruct by Meta, used under the Llama 3.2 Community License; the fine-tuned model is a derivative
- PaddleOCR (Apache-2.0)
- FastAPI, OpenCV, React, Vite and other open-source libraries listed in `requirements.txt` and `package.json`
- The frontend was built by a teammate. Images under `frontend/public` and `frontend/src/assets` are [DESCRIBE SOURCE OF IMAGES]. Legacy Gemini-based code paths remain in the frontend but are not used by the integrated flow.

## Before vs. during the event

- Before the event: [LIST WHAT EXISTED BEFORE, for example the frontend design or dataset generator; write "nothing" if it applies]
- During the event: the FastAPI backend, YOLO and OCR integration, dataset versions v1 to v3, model fine-tuning and export, the Modelfile fix, and frontend-backend integration

## Limitations

- YOLO11n detects only the 80 COCO classes, so there is no stairs, door or hazard-sign detection
- The nano model can misclassify objects
- The LLM runs locally through Ollama, so a live hosted demo needs a GPU host
- The login screen is a demo that stores credentials in the browser

## License

MIT