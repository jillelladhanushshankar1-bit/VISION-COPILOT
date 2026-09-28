import React, { useState, useEffect } from 'react';
import { VisionEvent, CameraFacing } from '../types';
import { LiveVideoViewport } from './LiveVideoViewport';

interface EventActiveViewProps {
  event: VisionEvent;
  isMuted: boolean;
  onReplayAudio: () => void;
  onAskDetails: () => void;
  onReturnToQuiet: () => void;
  durationSeconds?: number;
  cameraFacing: CameraFacing;
  onToggleCameraFacing: () => void;
  cameraStream: MediaStream | null;
}

export const EventActiveView: React.FC<EventActiveViewProps> = ({
  event,
  isMuted,
  onReplayAudio,
  onAskDetails,
  onReturnToQuiet,
  durationSeconds = 7,
  cameraFacing,
  onToggleCameraFacing,
  cameraStream,
}) => {
  const [isSpeakingPaused, setIsSpeakingPaused] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);

  // Auto-countdown to return to quiet state
  useEffect(() => {
    if (isSpeakingPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onReturnToQuiet();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSpeakingPaused, onReturnToQuiet]);

  // Determine normalized event type (hazard, motion, general, ocr)
  const normalizedType = (
    event.eventType ||
    (event.type === 'Hazard' ? 'hazard' : event.type === 'Motion' ? 'motion' : 'general')
  ).toLowerCase();

  // Extract or infer direction for motion events
  const detectedDirection =
    event.direction ||
    (event.message.toLowerCase().includes('right')
      ? 'right'
      : event.message.toLowerCase().includes('left')
      ? 'left'
      : event.message.toLowerCase().includes('ahead')
      ? 'ahead'
      : null);

  const getVariantStyles = () => {
    switch (normalizedType) {
      case 'hazard':
        return {
          bg: 'bg-[#ff5406]',
          border: 'border-[#ff5406]',
          cardBorder: 'border-4 border-[#ff5406] shadow-sm',
          text: 'text-[#ffffff]',
          icon: 'warning',
          badgeText: '⚠️ CRITICAL HAZARD',
          textWeight: 'font-black tracking-tight text-[22px] sm:text-[24px]',
          ariaRole: 'Hazard alert: critical obstacle detected',
        };
      case 'motion':
        return {
          bg: 'bg-[#00a9dd]',
          border: 'border-[#00a9dd]',
          cardBorder: 'border-2 border-[#00a9dd] border-dashed shadow-xs',
          text: 'text-[#ffffff]',
          icon: 'directions_walk',
          badgeText: '🚶 MOTION DETECTED',
          textWeight: 'font-bold text-[20px] sm:text-[22px]',
          ariaRole: 'Motion alert: dynamic obstacle or person moving',
        };
      case 'ocr':
      case 'general':
      default:
        return {
          bg: 'bg-[#00af3d]',
          border: 'border-[#00af3d]',
          cardBorder: 'border border-[#747878]/30 shadow-none',
          text: 'text-[#ffffff]',
          icon: normalizedType === 'ocr' ? 'description' : 'info',
          badgeText: normalizedType === 'ocr' ? '📄 TEXT DETECTED (OCR)' : 'ℹ️ GENERAL NOTICE',
          textWeight: 'font-semibold text-[19px] sm:text-[21px]',
          ariaRole: 'General awareness update',
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <div className="flex-1 flex flex-col space-y-4 px-6 pt-1 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Upper Section: Active Camera Feed Container */}
      <section
        aria-label="Active camera feed with spatial tracking overlay"
        className="relative w-full h-64 sm:h-72 rounded-26 bg-[#f5f5f5] overflow-hidden flex-shrink-0"
      >
        {/* Live Camera Viewport Video or Image */}
        <LiveVideoViewport
          stream={cameraStream}
          cameraFacing={cameraFacing}
          fallbackAlt={event.imageAlt}
          fallbackImage={event.image}
        />

        {/* Optical Guidance Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none p-3.5 flex flex-col justify-between">
          {/* Feed Status Header Overlay */}
          <div className="flex justify-between items-center w-full">
            <div className="h-8 px-3 rounded-26 bg-[#2f2f2f] text-[#ffffff] flex items-center space-x-1.5 text-[13px] font-bold">
              <span className="material-symbols-outlined text-[16px] text-[#ff5406]">sensors</span>
              <span>Awareness Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="hidden min-[360px]:flex h-8 px-3 rounded-26 bg-[#2f2f2f]/85 text-[#ffffff] items-center space-x-1 text-[13px] font-semibold">
                <span className="material-symbols-outlined text-[16px]">videocam</span>
                <span>{cameraStream ? 'Live Video' : '1080p · 60fps'}</span>
              </div>
              <button
                type="button"
                onClick={onToggleCameraFacing}
                aria-label={cameraFacing === 'back' ? 'Switch to front camera' : 'Switch to back camera'}
                title={cameraFacing === 'back' ? 'Switch to front camera' : 'Switch to back camera'}
                className="h-8 px-2 sm:px-2.5 rounded-26 bg-[#ffffff]/95 hover:bg-[#ffffff] active:scale-95 transition-all border border-[#c4c7c7] flex items-center gap-1 text-[#1a1a1a] cursor-pointer shadow-none pointer-events-auto"
              >
                <span className="material-symbols-outlined text-[18px] text-[#1a1a1a]">
                  flip_camera_ios
                </span>
                <span className="text-[11px] font-bold hidden min-[390px]:inline">
                  {cameraFacing === 'back' ? 'Rear' : 'Front'}
                </span>
              </button>
            </div>
          </div>

          {/* Bounding Reticle identifying the detected obstacle */}
          <div
            className={`self-center border-[3px] rounded-26 flex flex-col justify-end p-2 ${variant.border}`}
            style={{
              width: event.reticle.width || '52%',
              height: event.reticle.height || '36%',
              backgroundColor: `${
                normalizedType === 'hazard'
                  ? 'rgba(255, 84, 6, 0.14)'
                  : normalizedType === 'motion'
                  ? 'rgba(0, 169, 221, 0.14)'
                  : 'rgba(0, 175, 61, 0.14)'
              }`,
            }}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[12px] font-bold text-[#ffffff] px-2.5 py-0.5 rounded-full self-start ${variant.bg}`}
              >
                {event.label || event.distance}
              </span>

              {/* In-reticle directional indicator if motion */}
              {detectedDirection && (
                <span className="bg-[#1a1a1a] text-[#ffffff] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-[#00a9dd]">
                    {detectedDirection === 'right'
                      ? 'east'
                      : detectedDirection === 'left'
                      ? 'west'
                      : 'north'}
                  </span>
                  <span className="capitalize">{detectedDirection}</span>
                </span>
              )}
            </div>
          </div>

          {/* Directional Horizon Cue Indicator with Arrow for Motion */}
          <div className="flex justify-center items-center">
            {detectedDirection === 'right' ? (
              <div
                data-testid="directional-indicator"
                className="bg-[#2f2f2f]/90 text-[#ffffff] px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1 border border-[#00a9dd]"
              >
                <span>Moving path right</span>
                <span className="material-symbols-outlined text-[16px] text-[#00a9dd] animate-pulse">
                  arrow_forward
                </span>
              </div>
            ) : detectedDirection === 'left' ? (
              <div
                data-testid="directional-indicator"
                className="bg-[#2f2f2f]/90 text-[#ffffff] px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1 border border-[#00a9dd]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#00a9dd] animate-pulse">
                  arrow_back
                </span>
                <span>Moving path left</span>
              </div>
            ) : (
              <div className="h-2 w-16 bg-[#ffffff]/80 rounded-full"></div>
            )}
          </div>
        </div>
      </section>

      {/* Middle Section: Active Event Notification Card */}
      <section
        role="region"
        aria-live="assertive"
        aria-atomic="true"
        aria-label={`${variant.ariaRole}: ${event.message}`}
        className={`w-full bg-[#f3f3f3] rounded-26 p-5 flex flex-col space-y-3 ${variant.cardBorder}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {/* Multi-attribute Badge (Icon + Text + Shape + Weight) */}
            <span
              className={`px-3 py-1 rounded-26 text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${variant.bg} ${variant.text}`}
            >
              <span className="material-symbols-outlined text-[17px]">{variant.icon}</span>
              <span>{variant.badgeText}</span>
            </span>

            {/* Movement Direction Indicator Badge */}
            {detectedDirection && (
              <span
                data-testid="motion-direction-badge"
                className="px-2.5 py-1 rounded-26 text-[12px] font-extrabold bg-[#1a1a1a] text-[#ffffff] flex items-center gap-1 border border-[#00a9dd]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#00a9dd]">
                  {detectedDirection === 'right'
                    ? 'arrow_forward'
                    : detectedDirection === 'left'
                    ? 'arrow_back'
                    : 'arrow_upward'}
                </span>
                <span className="capitalize">{detectedDirection} side</span>
              </span>
            )}

            <span className="text-[13px] text-[#444748] font-semibold">
              {event.confidence}
            </span>
          </div>

          <span className="text-[14px] text-[#444748] font-bold">
            {event.distance}
          </span>
        </div>

        {/* Primary Spoken Announcement Headline - Font weight & sizing tuned per variant */}
        <h1 className={`${variant.textWeight} text-[#1a1a1a] leading-tight`}>
          "{event.message}"
        </h1>

        {/* Audio Replay & Controls Strip */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={onReplayAudio}
              aria-label="Replay audio announcement"
              className="h-10 px-3.5 rounded-26 bg-[#ffffff] text-[#1a1a1a] border border-[#c4c7c7] font-bold text-[14px] flex items-center space-x-1.5 hover:bg-[#e8e8e8] active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">volume_up</span>
              <span>Replay Voice</span>
            </button>

            <button
              onClick={() => setIsSpeakingPaused(!isSpeakingPaused)}
              aria-label={isSpeakingPaused ? 'Resume countdown' : 'Pause countdown'}
              className="h-10 w-10 rounded-26 bg-[#ffffff] text-[#444748] border border-[#c4c7c7] flex items-center justify-center hover:bg-[#e8e8e8] active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSpeakingPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>
          </div>

          <div className="text-[12px] text-[#444748] font-bold bg-[#ffffff] px-2.5 py-1 rounded-full border border-[#e2e2e2]">
            Quiet in {secondsRemaining}s
          </div>
        </div>
      </section>

      {/* Bottom Actions: Reachable Two-Up Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Ask Details Button */}
        <button
          onClick={onAskDetails}
          aria-label="Ask Voice Assistant for details"
          className="h-14 rounded-26 bg-[#00a9dd] hover:bg-[#0094c4] text-[#ffffff] text-[16px] font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">mic</span>
          <span>Ask Details</span>
        </button>

        {/* Dismiss / Return to Quiet Button */}
        <button
          onClick={onReturnToQuiet}
          aria-label="Dismiss event and return to quiet monitoring"
          className="h-14 rounded-26 bg-[#f3f3f3] hover:bg-[#e8e8e8] text-[#1a1a1a] text-[16px] font-bold flex items-center justify-center space-x-2 border-2 border-[#1a1a1a] active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">check</span>
          <span>Dismiss (Clear)</span>
        </button>
      </div>
    </div>
  );
};
