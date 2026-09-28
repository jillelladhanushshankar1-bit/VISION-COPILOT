/**
 * Camera Utility for Vision Copilot
 * Handles camera permissions, stream acquisition, facing mode switching, frame capture, and stream release.
 */

export interface CameraError {
  type: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'InsecureContextError' | 'UnknownError';
  message: string;
}

export function checkIsSecureContext(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext === true || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/**
 * Request camera access with specified facing mode.
 * Defaults to environment (back) camera on mobile, or default webcam on laptop.
 */
export async function startCameraStream(facing: 'back' | 'front'): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access API (getUserMedia) is not supported in this environment.');
  }

  if (!checkIsSecureContext()) {
    throw new Error('Camera access requires a secure HTTPS or localhost context.');
  }

  // Back camera uses ideal: 'environment' so laptops with only a front webcam don't crash on overconstrained constraints
  const videoConstraints: MediaTrackConstraints = facing === 'front'
    ? { facingMode: 'user' }
    : { facingMode: { ideal: 'environment' } };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        ...videoConstraints,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false, // NEVER request audio here; microphone is requested separately!
    });
    return stream;
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      const error: CameraError = {
        type: 'NotAllowedError',
        message: 'Camera permission was denied. Vision Copilot requires camera access to observe your path and hazards.',
      };
      throw error;
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      const error: CameraError = {
        type: 'NotFoundError',
        message: 'No camera hardware found on this device.',
      };
      throw error;
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      const error: CameraError = {
        type: 'NotReadableError',
        message: 'Camera is currently in use by another application or tab.',
      };
      throw error;
    }
    throw err;
  }
}

/**
 * Stop and release all tracks in a MediaStream.
 * This turns off the hardware camera indicator light.
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (err) {
    console.warn('Error stopping camera stream tracks:', err);
  }
}

/**
 * Capture a still frame from an HTMLVideoElement as a base64 JPEG data URL.
 */
export function captureVideoFrame(video: HTMLVideoElement | null): string | null {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    // Scale moderately for optimal bandwidth & low latency (max dimension 640px)
    const maxDim = 640;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch (err) {
    console.warn('Failed to capture frame from video:', err);
    return null;
  }
}

/**
 * Capture a single still frame without keeping the camera running.
 * Requests camera stream, grabs a single JPEG frame, and IMMEDIATELY stops all tracks.
 * Does not leave any stream or interval running.
 */
export async function captureSingleFrame(facing: 'back' | 'front'): Promise<string | null> {
  const stream = await startCameraStream(facing);
  try {
    const video = document.createElement('video');
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 1500);
      video.onloadedmetadata = () => {
        video.play().then(() => {
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 150);
        }).catch(() => {
          clearTimeout(timeout);
          resolve();
        });
      };
      video.onerror = () => {
        clearTimeout(timeout);
        resolve();
      };
    });

    const frame = captureVideoFrame(video);
    return frame;
  } finally {
    // Guarantees the temporary stream is stopped immediately so camera hardware light turns off
    stopCameraStream(stream);
  }
}
