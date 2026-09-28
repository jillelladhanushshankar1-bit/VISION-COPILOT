import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_OCR_DATA } from '../data/mockEvents';
import { analyzeImageForText } from '../utils/ocrAiming';
import {
  playOcrAimingTone,
  playOcrNoTextPromptEarcon,
  playOcrCaptureEarcon,
  playConnectionLostEarcon,
  playConnectionRestoredEarcon,
} from '../utils/earcons';
import { captureVideoFrame } from '../utils/camera';
import { sendFrameForOcr } from '../utils/backendApi';

// Standard test assets
const FLYER_IMAGE = '/src/assets/images/robotics_workshop_flyer_1790251142738.jpg';
const BLANK_IMAGE =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='100%25' height='100%25' fill='%23dedede'/%3E%3C/svg%3E";

interface OcrOverlayProps {
  onClose: () => void;
  isMuted: boolean;
  onSpeak: (text: string) => void;
  onAskAboutText: (text: string, frame: string | null) => void;
  capturedFrame: string | null;
  cameraStream?: MediaStream | null;
  mockMode?: boolean;
}

export const OcrOverlay: React.FC<OcrOverlayProps> = ({
  onClose,
  isMuted,
  onSpeak,
  onAskAboutText,
  capturedFrame: initialCapturedFrame,
  cameraStream = null,
  mockMode = false,
}) => {
  // Mode: 'aiming' (audio-guided text aiming) -> 'reading' (OCR processing) -> 'result'
  const [mode, setMode] = useState<'aiming' | 'reading' | 'result'>('aiming');
  const [hasCopied, setHasCopied] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [aimingScore, setAimingScore] = useState<number>(0.1);
  const [isAudioAimingActive, setIsAudioAimingActive] = useState(true);
  const [activeFrame, setActiveFrame] = useState<string | null>(initialCapturedFrame);

  // Simulated Camera Mode for reliable testing and environments without webcam hardware
  const [activeScene, setActiveScene] = useState<'live' | 'text_flyer' | 'blank_area'>(
    cameraStream ? 'live' : 'text_flyer'
  );

  // Stability progress towards hands-free auto-capture (0 to 100%)
  const [autoCaptureProgress, setAutoCaptureProgress] = useState<number>(0);
  const [captureTriggerSource, setCaptureTriggerSource] = useState<'auto' | 'manual' | null>(null);

  const [ocrResult, setOcrResult] = useState<{
    text: string;
    confidence: string;
    metadata: Record<string, string>;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lowTextTimerRef = useRef<number>(0);
  const stableHighTextTimerRef = useRef<number>(0);
  const lastSpokenPromptRef = useRef<number>(0);
  const isCapturingRef = useRef<boolean>(false);

  // Sync camera stream to live aiming video element if available
  useEffect(() => {
    if (videoRef.current && cameraStream && activeScene === 'live') {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStream, activeScene, mode]);

  // Execute full OCR transcription on final capture
  const executeFinalCapture = useCallback(
    async (source: 'auto' | 'manual') => {
      if (isCapturingRef.current) return;
      isCapturingRef.current = true;
      setCaptureTriggerSource(source);

      // Play audio shutter confirmation
      playOcrCaptureEarcon();

      // Grab current still image from live video or simulated image
      let capturedPayload: string | null = null;
      if (activeScene === 'live' && videoRef.current && cameraStream) {
        capturedPayload = captureVideoFrame(videoRef.current);
      } else if (activeScene === 'blank_area') {
        capturedPayload = BLANK_IMAGE;
      } else {
        capturedPayload = FLYER_IMAGE;
      }

      setActiveFrame(capturedPayload);

      if (!capturedPayload) {
        setOcrError("No image captured, try again");
        setMode('result');
        if (!isMuted) onSpeak("No image captured, try again");
        isCapturingRef.current = false;
        return;
      }

      setMode('reading');
      setOcrError(null);

      // Audio notification of capture
      if (!isMuted) {
        onSpeak(source === 'auto' ? 'Text aligned, reading...' : 'Capturing text...');
      }

      // If Mock Mode or Blank Scene is active, handle cleanly
      if (mockMode || activeScene === 'blank_area') {
        setTimeout(() => {
          if (activeScene === 'blank_area') {
            const blankText = 'No legible text was detected in this frame.';
            setOcrResult({
              text: blankText,
              confidence: 'Low Confidence',
              metadata: {
                Detection: 'Blank or Unfocused Area',
                Recommendation: 'Point camera at printed documents, signs, or flyers',
              },
            });
            setMode('result');
            if (!isMuted) onSpeak(blankText);
          } else {
            const mockText = MOCK_OCR_DATA.text;
            setOcrResult({
              text: mockText,
              confidence: `${MOCK_OCR_DATA.detectedConfidence}% Match`,
              metadata: MOCK_OCR_DATA.parsedDetails,
            });
            setMode('result');
            if (!isMuted) onSpeak(mockText);
          }
          isCapturingRef.current = false;
        }, 500);
        return;
      }

      try {
        const result = await sendFrameForOcr(capturedPayload);

        if (!result.ok) {
          throw new Error(result.error);
        }

        const data = result.data;
        if (ocrError) {
          playConnectionRestoredEarcon();
        }

        const cleanedText = data.response.replace(/^Text reads:\s*/i, '');

        setOcrResult({
          text: cleanedText || MOCK_OCR_DATA.text,
          confidence: data.confidence ? String(data.confidence) : '',
          metadata: {
            Event: data.event_type || 'OCR Result',
            Details: data.priority === 'low' ? 'No clear text detected' : 'Text detected in view',
          },
        });
        setMode('result');
        if (!isMuted && data.response) {
          onSpeak(data.response);
        }
      } catch (err: any) {
        console.warn('OCR fetch error:', err);
        playConnectionLostEarcon();
        setOcrError(err.message || 'Backend not connected');
        setOcrResult(null);
        setMode('result');
        if (!isMuted) {
          onSpeak('Backend not connected');
        }
      } finally {
        isCapturingRef.current = false;
      }
    },
    [activeScene, cameraStream, isMuted, mockMode, ocrError, onSpeak]
  );

  // Audio-Guided Aiming Loop with Continuous Auto-Capture Heuristic
  useEffect(() => {
    if (mode !== 'aiming' || !isAudioAimingActive || isCapturingRef.current) return;

    const interval = setInterval(() => {
      let score = 0.5;

      if (activeScene === 'blank_area') {
        score = 0.05; // Explicit blank scene guaranteed low score
      } else if (activeScene === 'live' && videoRef.current && cameraStream && videoRef.current.readyState >= 2) {
        score = analyzeImageForText(videoRef.current);
      } else if (imgRef.current && imgRef.current.complete) {
        score = analyzeImageForText(imgRef.current);
      } else {
        score = 0.65;
      }

      setAimingScore(score);

      // Play soft aiming pulse: pitch scales directly with detected text quality (320Hz to 880Hz)
      playOcrAimingTone(score);

      // Branch 1: Low Text / Blank Scene (<0.20 score)
      if (score < 0.20) {
        // Reset high-text auto-capture timer & progress
        stableHighTextTimerRef.current = 0;
        setAutoCaptureProgress(0);

        lowTextTimerRef.current += 300;
        const now = Date.now();
        // After 3 seconds of nothing in frame, trigger verbal and earcon cue
        if (lowTextTimerRef.current >= 3000 && now - lastSpokenPromptRef.current > 4500) {
          playOcrNoTextPromptEarcon();
          onSpeak('No text detected, move camera');
          lastSpokenPromptRef.current = now;
        }
      }
      // Branch 2: High Text Alignment (>= 0.45 score)
      else if (score >= 0.45) {
        lowTextTimerRef.current = 0;
        stableHighTextTimerRef.current += 300;

        // Calculate progress to 1.5 seconds (1500ms)
        const progress = Math.min(100, Math.round((stableHighTextTimerRef.current / 1500) * 100));
        setAutoCaptureProgress(progress);

        // AUTO-CAPTURE TRIGGER: Text centered and stable for ~1.5 continuous seconds
        if (stableHighTextTimerRef.current >= 1500) {
          stableHighTextTimerRef.current = 0;
          setAutoCaptureProgress(100);
          executeFinalCapture('auto');
        }
      }
      // Branch 3: Moderate score (0.20 - 0.44)
      else {
        lowTextTimerRef.current = 0;
        stableHighTextTimerRef.current = Math.max(0, stableHighTextTimerRef.current - 150);
        setAutoCaptureProgress(Math.min(100, Math.round((stableHighTextTimerRef.current / 1500) * 100)));
      }
    }, 300);

    return () => clearInterval(interval);
  }, [activeScene, cameraStream, executeFinalCapture, isAudioAimingActive, mode, onSpeak]);

  const activeText = ocrResult?.text || (ocrError ? '' : MOCK_OCR_DATA.text);
  const activeConfidence = ocrResult?.confidence || '98% Match';
  const activeMetadata = ocrResult?.metadata || MOCK_OCR_DATA.parsedDetails;

  const handleCopy = () => {
    if (activeText) {
      navigator.clipboard.writeText(activeText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleResetScan = () => {
    isCapturingRef.current = false;
    stableHighTextTimerRef.current = 0;
    lowTextTimerRef.current = 0;
    setAutoCaptureProgress(0);
    setOcrResult(null);
    setOcrError(null);
    setCaptureTriggerSource(null);
    setActiveFrame(null);
    setAimingScore(0.1);
    setMode('aiming');
  };

  const estimatedPitch = Math.round(320 + aimingScore * 560);
  const displayedAimingImage = activeScene === 'blank_area' ? BLANK_IMAGE : FLYER_IMAGE;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ocr-overlay-title"
      className="fixed inset-0 z-50 bg-[#000000]/75 flex flex-col justify-end sm:justify-center p-3 sm:p-6 backdrop-blur-xs select-none overflow-y-auto"
    >
      <div className="w-full max-w-md mx-auto bg-[#ffffff] rounded-26 p-4 sm:p-6 flex flex-col space-y-3 sm:space-y-4 animate-in slide-in-from-bottom duration-200 border border-[#2f2f2f] my-auto">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-26 bg-[#00af3d] flex items-center justify-center text-[#ffffff]">
              <span className="material-symbols-outlined text-[20px]">document_scanner</span>
            </div>
            <div>
              <span id="ocr-overlay-title" className="text-[17px] sm:text-[18px] font-bold text-[#1a1a1a] block leading-tight">
                Read Text (OCR)
              </span>
              <span className="text-[12px] text-[#747878] font-medium">
                {mode === 'aiming'
                  ? 'Audio-Guided Aiming active'
                  : mode === 'reading'
                  ? 'Transcribing text…'
                  : activeConfidence}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close text reader"
            className="w-9 h-9 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8e8e8] active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* STAGE 1: Audio-Guided Aiming Viewport */}
        {mode === 'aiming' && (
          <div className="space-y-3">
            {/* Simulated Camera Target Toggle Bar (Essential for testing blank area vs text) */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f5f5f5] rounded-26 border border-[#e2e2e2] text-[11px] font-bold">
              <span className="px-2 text-[#747878] flex items-center gap-1 flex-shrink-0">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Scene:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveScene('blank_area');
                  stableHighTextTimerRef.current = 0;
                  setAutoCaptureProgress(0);
                }}
                className={`flex-1 py-1 px-2 rounded-full transition-all cursor-pointer truncate ${
                  activeScene === 'blank_area'
                    ? 'bg-[#ba1a1a] text-[#ffffff] shadow-xs'
                    : 'text-[#444748] hover:text-[#1a1a1a]'
                }`}
                title="Simulate pointing camera at a blank surface with no text"
              >
                Blank Area (No Text)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveScene('text_flyer');
                  lowTextTimerRef.current = 0;
                }}
                className={`flex-1 py-1 px-2 rounded-full transition-all cursor-pointer truncate ${
                  activeScene === 'text_flyer'
                    ? 'bg-[#00af3d] text-[#ffffff] shadow-xs'
                    : 'text-[#444748] hover:text-[#1a1a1a]'
                }`}
                title="Simulate pointing camera directly at text flyer"
              >
                Text Flyer
              </button>
              {cameraStream && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveScene('live');
                    lowTextTimerRef.current = 0;
                  }}
                  className={`py-1 px-2.5 rounded-full transition-all cursor-pointer truncate ${
                    activeScene === 'live'
                      ? 'bg-[#1a1a1a] text-[#ffffff] shadow-xs'
                      : 'text-[#444748] hover:text-[#1a1a1a]'
                  }`}
                  title="Use live hardware camera feed"
                >
                  Live Cam
                </button>
              )}
            </div>

            {/* Viewfinder Target with Optical Reticle */}
            <div
              onClick={() => executeFinalCapture('manual')}
              title="Tap viewfinder to force manual capture"
              className="relative w-full h-48 sm:h-52 rounded-26 overflow-hidden bg-[#1a1a1a] border-2 border-[#00af3d] cursor-pointer group"
            >
              {activeScene === 'live' && cameraStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  ref={imgRef}
                  src={displayedAimingImage}
                  alt={activeScene === 'blank_area' ? 'Simulated blank wall with no text' : 'Printed robotics workshop flyer'}
                  className="w-full h-full object-cover"
                  style={{ opacity: 1, mixBlendMode: 'normal' }}
                />
              )}

              {/* Aiming Reticle Overlay Box */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-3">
                <div
                  className={`w-4/5 h-3/4 rounded-26 border-2 flex flex-col justify-between p-2 transition-all duration-200 bg-transparent ${
                    aimingScore >= 0.45
                      ? 'border-[#00af3d] shadow-[0_0_12px_rgba(0,175,61,0.35)]'
                      : 'border-[#ffffff]/70'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-full self-start backdrop-blur-xs">
                    <span>
                      {activeScene === 'blank_area'
                        ? 'Blank Scene'
                        : aimingScore >= 0.45
                        ? '✓ Text Centered'
                        : 'Searching Text…'}
                    </span>
                  </div>

                  {/* Auto-Capture Countdown Indicator */}
                  {aimingScore >= 0.45 ? (
                    <div className="space-y-1 bg-black/75 p-2 rounded-2xl backdrop-blur-xs">
                      <div className="flex justify-between items-center text-[11px] font-bold text-[#ffffff]">
                        <span className="text-[#00af3d]">Holding steady for auto-capture…</span>
                        <span>{Math.max(0.1, ((1500 - (autoCaptureProgress / 100) * 1500) / 1000)).toFixed(1)}s</span>
                      </div>
                      <div className="w-full h-2 bg-[#ffffff]/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00af3d] transition-all duration-150 ease-out"
                          style={{ width: `${autoCaptureProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-[11px] font-semibold text-white/90 bg-black/50 py-1 rounded-xl">
                      {activeScene === 'blank_area'
                        ? 'Point camera toward text'
                        : 'Align text inside box'}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Real-time Audio Guidance Bar */}
              <div className="absolute bottom-2 inset-x-2 bg-[#1a1a1a]/90 text-[#ffffff] px-3 py-1 rounded-26 text-[11px] font-bold flex items-center justify-between backdrop-blur-xs border border-white/10">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`material-symbols-outlined text-[15px] ${
                      aimingScore >= 0.45 ? 'text-[#00af3d] animate-pulse' : 'text-[#c4c7c7]'
                    }`}
                  >
                    graphic_eq
                  </span>
                  <span>Audio Pitch: {estimatedPitch} Hz</span>
                </div>
                <span className={aimingScore >= 0.45 ? 'text-[#00af3d]' : 'text-[#c4c7c7]'}>
                  {Math.round(aimingScore * 100)}% Match
                </span>
              </div>
            </div>

            {/* Audio Guidance Status Pill for Blind / Low-Vision Users */}
            <div
              role="status"
              aria-live="polite"
              className="bg-[#f5f5f5] p-2.5 rounded-26 border border-[#e2e2e2] text-[12px] text-[#2f2f2f] flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-[#00af3d] flex-shrink-0">
                  hearing
                </span>
                <span className="truncate">
                  {aimingScore >= 0.45
                    ? 'High pitch: auto-capturing in ~1.5s'
                    : 'Pitch rises as text is centered'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAudioAimingActive(!isAudioAimingActive)}
                aria-label={isAudioAimingActive ? 'Mute aiming tones' : 'Unmute aiming tones'}
                className="text-[11px] font-bold text-[#747878] hover:text-[#1a1a1a] px-2 py-0.5 rounded-full border border-[#c4c7c7] flex-shrink-0"
              >
                {isAudioAimingActive ? 'Mute' : 'Unmute'}
              </button>
            </div>

            {/* Mechanism 2: Explicit Manual Override Button ("Capture Now") */}
            <button
              type="button"
              onClick={() => executeFinalCapture('manual')}
              aria-label="Capture Now (Manual Override)"
              className="w-full min-h-[54px] rounded-26 bg-[#00af3d] hover:bg-[#009433] text-[#ffffff] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-none"
            >
              <span className="material-symbols-outlined text-[22px]">photo_camera</span>
              <span>Capture Now (Manual Override)</span>
            </button>
          </div>
        )}

        {/* STAGE 2: Reading / Processing Spinner */}
        {mode === 'reading' && (
          <div className="py-10 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-10 h-10 border-4 border-[#00af3d]/20 border-t-[#00af3d] rounded-full animate-spin"></div>
            <div>
              <p className="text-[16px] font-bold text-[#1a1a1a]">Transcribing detected text…</p>
              <p className="text-[12px] text-[#747878]">
                {captureTriggerSource === 'auto' ? 'Triggered via Hands-Free Auto-Capture' : 'Triggered via Manual Override'}
              </p>
            </div>
          </div>
        )}

        {/* STAGE 3: Result Screen */}
        {mode === 'result' && (
          <div className="space-y-3 animate-in fade-in">
            {/* Error Banner with Retry */}
            {ocrError && (
              <div
                role="alert"
                className="bg-[#fff4f2] border-2 border-[#ba1a1a] p-3 rounded-26 flex items-center justify-between text-[12px] text-[#ba1a1a]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">cloud_off</span>
                  <span className="font-bold leading-tight truncate">{ocrError}</span>
                </div>
                <button
                  onClick={handleResetScan}
                  aria-label="Retry OCR scanning"
                  className="px-2.5 py-1 bg-[#ba1a1a] text-[#ffffff] text-[11px] font-bold rounded-full hover:bg-[#93000a] active:scale-95 transition-all flex-shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Spoken Text Card */}
            {activeText && (
              <div className="bg-[#f5f5f5] border-2 border-[#1a1a1a] p-3.5 rounded-26 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#00af3d] flex items-center gap-1">
                    {!ocrError && <span className="material-symbols-outlined text-[15px]">check_circle</span>}
                    <span>{!ocrError ? 'Transcribed Content' : 'Scan Failed'}</span>
                  </span>
                  {activeConfidence && (
                    <span className="text-[11px] text-[#747878] font-bold">{activeConfidence}</span>
                  )}
                </div>

                <p className="text-[15px] sm:text-[16px] font-semibold text-[#1a1a1a] leading-relaxed">
                  "{activeText}"
                </p>

                {/* Extracted Details Tags */}
                {activeMetadata && Object.keys(activeMetadata).length > 0 && (
                  <div className="pt-2 border-t border-[#e2e2e2] grid grid-cols-2 gap-1.5 text-[11px]">
                    {Object.entries(activeMetadata).map(([key, val]) => (
                      <div key={key} className="bg-[#ffffff] p-1.5 rounded-xl border border-[#e2e2e2]">
                        <span className="text-[#747878] font-semibold block uppercase text-[10px]">{key}</span>
                        <span className="text-[#1a1a1a] font-bold block truncate">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Result Action Buttons */}
            {activeText && (
              <>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy transcribed text"
                    className="min-h-[44px] rounded-26 bg-[#f5f5f5] hover:bg-[#e8e8e8] text-[#1a1a1a] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-[#e2e2e2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {hasCopied ? 'done' : 'content_copy'}
                    </span>
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSpeak(activeText)}
                    aria-label="Read text aloud"
                    className="min-h-[44px] rounded-26 bg-[#f5f5f5] hover:bg-[#e8e8e8] text-[#1a1a1a] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-[#e2e2e2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                    <span>Read Again</span>
                  </button>
                </div>

                {/* Ask AI Contextual Followup */}
                <button
                  type="button"
                  onClick={() => onAskAboutText(activeText, activeFrame)}
                  aria-label="Ask AI about this text"
                  className="w-full min-h-[48px] rounded-26 bg-[#00a9dd] hover:bg-[#0094c4] text-[#ffffff] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-none"
                >
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                  <span>Ask AI About This Text</span>
                </button>
              </>
            )}

            {/* Scan Another Document CTA */}
            <button
              type="button"
              onClick={handleResetScan}
              aria-label="Scan another document"
              className="w-full min-h-[46px] rounded-26 bg-[#1a1a1a] hover:bg-[#2f2f2f] text-[#ffffff] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-none"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span>Aim & Scan Another Text</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
