/**
 * Backend API Helper — Vision Copilot
 *
 * Bridges the frontend (base64 camera frames) to the FastAPI backend
 * (multipart/form-data UploadFile endpoints).
 *
 * Backend endpoints:
 *   POST /analyze    — YOLO detection → Ollama scene narration
 *   POST /read-text  — PaddleOCR → extracted text response
 *   GET  /health     — simple health check
 *
 * All functions return a discriminated union so callers can handle
 * errors (e.g. speak "Backend not connected") without try/catch.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Base URL of the FastAPI backend. Change if running on a different host/port. */
export const BACKEND_URL = 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/** Shape returned by both /analyze and /read-text */
export interface BackendResponse {
  response: string;
  priority: string;   // "high" | "medium" | "low"
  event_type: string; // e.g. "hazard", "text_read", "no_text_found"
  speak: boolean;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string; // human-readable, safe to speak aloud
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Convert a base64 data-URL (e.g. "data:image/jpeg;base64,/9j/4AAQ…")
 * into a Blob suitable for FormData upload.
 *
 * If the string has no data-URL prefix, it is treated as raw base64 JPEG.
 */
function base64ToBlob(dataUrl: string): Blob {
  let mime = 'image/jpeg';
  let base64 = dataUrl;

  // Strip the data-URL prefix if present
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mime = match[1];
    base64 = match[2];
  }

  const byteChars = atob(base64);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mime });
}

/**
 * Build a FormData payload with a single file field named "frame",
 * matching the FastAPI `frame: UploadFile = File(...)` parameter.
 */
function buildFrameFormData(base64: string): FormData {
  const blob = base64ToBlob(base64);
  const fd = new FormData();
  fd.append('frame', blob, 'frame.jpg');
  return fd;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * POST /analyze — send a camera frame for YOLO + Ollama scene analysis.
 *
 * @param base64Frame  Base64 data-URL from canvas.toDataURL() or captureVideoFrame()
 * @returns            Typed result with the backend JSON or an error string
 */
export async function sendFrameForAnalysis(
  base64Frame: string,
): Promise<ApiResult<BackendResponse>> {
  try {
    const res = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      body: buildFrameFormData(base64Frame),
      // Do NOT set Content-Type — the browser sets the correct
      // multipart boundary automatically when body is FormData.
    });

    if (!res.ok) {
      return { ok: false, error: `Backend returned HTTP ${res.status}` };
    }

    const data: BackendResponse = await res.json();
    return { ok: true, data };
  } catch (err: any) {
    console.warn('[backendApi] /analyze fetch failed:', err);
    return { ok: false, error: 'Backend not connected' };
  }
}

/**
 * POST /read-text — send a camera frame for PaddleOCR text extraction.
 *
 * @param base64Frame  Base64 data-URL
 * @returns            Typed result with the backend JSON or an error string
 */
export async function sendFrameForOcr(
  base64Frame: string,
): Promise<ApiResult<BackendResponse>> {
  try {
    const res = await fetch(`${BACKEND_URL}/read-text`, {
      method: 'POST',
      body: buildFrameFormData(base64Frame),
    });

    if (!res.ok) {
      return { ok: false, error: `Backend returned HTTP ${res.status}` };
    }

    const data: BackendResponse = await res.json();
    return { ok: true, data };
  } catch (err: any) {
    console.warn('[backendApi] /read-text fetch failed:', err);
    return { ok: false, error: 'Backend not connected' };
  }
}

/**
 * GET /health — lightweight connectivity check.
 *
 * @returns  `{ ok: true, data: { status: "ok" } }` on success,
 *           `{ ok: false, error: "..." }` on failure.
 */
export async function checkBackendHealth(): Promise<ApiResult<{ status: string }>> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
    });

    if (!res.ok) {
      return { ok: false, error: `Backend returned HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, data };
  } catch (err: any) {
    console.warn('[backendApi] /health fetch failed:', err);
    return { ok: false, error: 'Backend not connected' };
  }
}
