/**
 * Lightweight Real-Time Optical Text Aiming Heuristic for Blind / Low-Vision Users
 * Analyzes video frame for high-frequency edge transitions in the center of view.
 */

let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

export function analyzeImageForText(source: CanvasImageSource): number {
  if (typeof document === 'undefined') return 0.5;

  try {
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = 120;
      offscreenCanvas.height = 90;
      offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }

    if (!offscreenCtx) return 0.5;

    // Render downscaled image
    offscreenCtx.drawImage(source, 0, 0, 120, 90);

    // Examine center 60% of frame where user is aiming
    const startX = 24;
    const startY = 18;
    const width = 72;
    const height = 54;

    const imgData = offscreenCtx.getImageData(startX, startY, width, height);
    const data = imgData.data;

    let edgeCount = 0;
    let totalSamples = 0;
    let sumLuma = 0;
    const lumas: number[] = new Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        lumas[y * width + x] = luma;
        sumLuma += luma;
      }
    }

    const meanLuma = sumLuma / (width * height);
    let varianceSum = 0;

    // Horizontal & vertical difference / edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const curr = lumas[y * width + x];
        const right = lumas[y * width + x + 1];
        const bottom = lumas[(y + 1) * width + x];

        const gradX = Math.abs(curr - right);
        const gradY = Math.abs(curr - bottom);

        // High contrast edge typical of letter glyphs
        if (gradX > 28 || gradY > 28) {
          edgeCount++;
        }
        totalSamples++;
        varianceSum += (curr - meanLuma) * (curr - meanLuma);
      }
    }

    const edgeDensity = totalSamples > 0 ? edgeCount / totalSamples : 0;
    const lumaVariance = Math.sqrt(varianceSum / totalSamples);

    // Text documents have high edge density (~0.12 - 0.40) and good contrast variance (>35)
    // Blank walls have very low edge density (<0.05) and low variance (<15)
    if (edgeDensity < 0.04 && lumaVariance < 20) {
      return 0.05; // blank wall
    }

    const normalizedEdgeScore = Math.min(1.0, edgeDensity / 0.28);
    const normalizedContrastScore = Math.min(1.0, lumaVariance / 60);

    return Math.min(1.0, Math.max(0.05, normalizedEdgeScore * 0.7 + normalizedContrastScore * 0.3));
  } catch (err) {
    console.warn('Frame analysis for text aiming heuristic failed:', err);
    return 0.5;
  }
}
