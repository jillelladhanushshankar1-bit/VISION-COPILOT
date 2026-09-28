import React from 'react';
import { CameraFacing } from '../types';
import { LiveVideoViewport } from './LiveVideoViewport';

interface HomeIdleViewProps {
  onStartAwareness: () => void;
  onReadTextClick: () => void;
  onAskClick: () => void;
  cameraFacing: CameraFacing;
  onToggleCameraFacing: () => void;
  cameraStream: MediaStream | null;
}

export const HomeIdleView: React.FC<HomeIdleViewProps> = ({
  onStartAwareness,
  onReadTextClick,
  onAskClick,
  cameraFacing,
  onToggleCameraFacing,
  cameraStream,
}) => {
  return (
    <div className="flex-1 flex flex-col space-y-4 px-6 pt-2 pb-6">
      {/* Camera Preview Card (Large inset card, Fog surface, 26px radius) */}
      <section className="relative w-full aspect-[4/3] rounded-26 bg-[#f5f5f5] overflow-hidden flex flex-col justify-between p-3 select-none border border-[#e2e2e2]">
        {/* Viewport: Live Camera Feed or Purpose-Built Contained Empty State */}
        {cameraStream ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <LiveVideoViewport
              stream={cameraStream}
              cameraFacing={cameraFacing}
              fallbackAlt="Live camera feed"
              fallbackImage=""
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 z-0 overflow-hidden flex flex-col items-center justify-center p-3 pointer-events-none select-none bg-[#f5f5f5]"
            aria-label="Camera is off"
          >
            {/* Contained Viewfinder Corner Reticles */}
            <div className="absolute inset-3 border border-[#1a1a1a]/10 rounded-[20px] pointer-events-none">
              <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#1a1a1a]/40"></div>
              <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#1a1a1a]/40"></div>
              <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#1a1a1a]/40"></div>
              <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#1a1a1a]/40"></div>
            </div>

            {/* Purpose-Built Empty-State Illustration: Fully contained inside card padding, centered behind camera-off icon */}
            <div className="relative flex flex-col items-center justify-center z-10">
              {/* Decorative Blue Blob/Cloud Backdrop with Contained Accent Dots */}
              <div className="relative w-28 h-28 min-[360px]:w-32 min-[360px]:h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                {/* Organic Blue/Cyan Cloud-Blob Shape with soft gradient */}
                <div
                  className="absolute inset-1 rounded-[42%_58%_65%_35%/45%_55%_45%_55%] bg-gradient-to-tr from-[#00a9dd]/20 via-[#00a9dd]/12 to-[#84d9f5]/25"
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(0, 169, 221, 0.12))',
                  }}
                />

                {/* Secondary soft layer for subtle organic depth */}
                <div className="absolute inset-3 rounded-[55%_45%_38%_62%/50%_60%_40%_50%] bg-[#00a9dd]/10" />

                {/* Carefully placed scattered accent dots - strictly contained inside blob bounding box, well away from card boundaries */}
                <span className="absolute top-1 left-3 w-2 h-2 rounded-full bg-[#00a9dd]/50" />
                <span className="absolute top-2.5 right-4 w-2.5 h-2.5 rounded-full bg-[#00a9dd]/40" />
                <span className="absolute bottom-2.5 left-5 w-2 h-2 rounded-full bg-[#00a9dd]/45" />
                <span className="absolute bottom-1 right-5 w-1.5 h-1.5 rounded-full bg-[#00a9dd]/55" />
                <span className="absolute top-1/2 left-0 w-1.5 h-1.5 rounded-full bg-[#00a9dd]/35" />
                <span className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-[#00a9dd]/40" />

                {/* Center Camera-Off Icon Badge - elevated on top of the blue blob */}
                <div className="relative z-10 w-13 h-13 min-[360px]:w-14 min-[360px]:h-14 sm:w-15 sm:h-15 rounded-2xl bg-[#ffffff] border border-[#e2e2e2] shadow-sm flex items-center justify-center text-[#2f2f2f]">
                  <span className="material-symbols-outlined text-[26px] min-[360px]:text-[28px] sm:text-[30px] text-[#2f2f2f]">
                    videocam_off
                  </span>
                </div>
              </div>

              {/* Informative Micro-Copy */}
              <div className="text-center mt-1 space-y-0.5 z-10">
                <span className="block text-[13px] sm:text-[14px] font-bold text-[#1a1a1a] tracking-tight">
                  Camera is off
                </span>
                <span className="block text-[11px] text-[#444748] font-medium max-w-[190px]">
                  Start Vision Copilot to observe
                </span>
              </div>
            </div>
          </div>
        )}

        {/* High-Contrast Viewfinder Crosshair Overlays - Shown when camera is streaming */}
        {cameraStream && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center p-4"
          >
            {/* Outer Viewfinder Grid Bounds */}
            <div className="w-full h-full border border-[#1a1a1a]/25 rounded-[20px] relative flex items-center justify-center">
              {/* Center Crosshair Reticle */}
              <div className="w-8 h-8 relative flex items-center justify-center">
                <span className="absolute w-full h-0.5 bg-[#1a1a1a]/50"></span>
                <span className="absolute h-full w-0.5 bg-[#1a1a1a]/50"></span>
              </div>
              {/* Corner Brackets */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#1a1a1a]/70"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#1a1a1a]/70"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#1a1a1a]/70"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#1a1a1a]/70"></div>
            </div>
          </div>
        )}

        {/* Top Inset Overlay: Mode Badge & Camera Flip Button */}
        <div className="relative z-20 flex justify-between items-center gap-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffffff]/90 rounded-26 border border-[#c4c7c7]">
            <span className="material-symbols-outlined text-[18px] text-[#1a1a1a]">
              {cameraStream ? 'videocam' : 'videocam_off'}
            </span>
            <span className="text-[13px] text-[#1a1a1a] font-bold">
              {cameraStream ? 'Live Feed' : 'Preview Feed'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden min-[360px]:inline-flex items-center gap-1 px-2.5 py-1 bg-[#ffffff]/90 rounded-26 border border-[#c4c7c7]">
              <span className="text-[12px] text-[#2f2f2f] font-semibold">1080p • 60 FPS</span>
            </div>

            {/* Camera Flip Control (Pill-shaped icon button matching existing overlay badges) */}
            <button
              type="button"
              onClick={onToggleCameraFacing}
              aria-label={cameraFacing === 'back' ? 'Switch to front camera' : 'Switch to back camera'}
              title={cameraFacing === 'back' ? 'Switch to front camera' : 'Switch to back camera'}
              className="h-7 px-2 sm:h-8 sm:px-2.5 rounded-26 bg-[#ffffff]/95 hover:bg-[#ffffff] active:scale-95 transition-all border border-[#c4c7c7] flex items-center gap-1 text-[#1a1a1a] cursor-pointer shadow-none"
            >
              <span className="material-symbols-outlined text-[17px] sm:text-[18px] text-[#1a1a1a]">
                flip_camera_ios
              </span>
              <span className="text-[11px] font-bold hidden min-[390px]:inline">
                {cameraFacing === 'back' ? 'Rear' : 'Front'}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Inset Overlay: Camera Spatial Orientation Hint */}
        <div className="relative z-20 self-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffffff]/95 rounded-26 border border-[#c4c7c7]">
            <span className="material-symbols-outlined text-[18px] text-[#2f2f2f]">
              {cameraFacing === 'back' ? 'explore' : 'face'}
            </span>
            <span className="text-[13px] text-[#2f2f2f] font-semibold">
              {cameraFacing === 'back' ? 'Forward Facing View' : 'Front Camera (Selfie View)'}
            </span>
          </div>
        </div>
      </section>

      {/* System Status Label Card */}
      <section
        aria-live="polite"
        className="w-full bg-[#f3f3f3] rounded-26 p-4 flex items-center justify-between border border-[#e2e2e2]"
        role="status"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-26 bg-[#ffffff] flex items-center justify-center border border-[#c4c7c7]">
            <span className="material-symbols-outlined text-[#2f2f2f] text-[22px]">sensors</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] text-[#444748] font-bold uppercase tracking-wider">
              System State
            </span>
            <span className="text-[18px] text-[#1a1a1a] font-bold">
              System Idle • Ready to observe
            </span>
          </div>
        </div>
        <div className="w-3 h-3 rounded-full bg-[#c4c7c7]"></div>
      </section>

      {/* Primary Action: Start Awareness (64px height, 26px radius, Verdant Green fill) */}
      <section className="w-full pt-1">
        <button
          onClick={onStartAwareness}
          aria-label="Start Awareness Feed"
          className="w-full min-h-[64px] bg-[#00af3d] hover:bg-[#009433] active:scale-95 transition-all duration-150 rounded-26 px-6 py-3 flex items-center justify-center gap-3 text-[#ffffff] font-bold text-[20px] focus:outline-none focus:ring-4 focus:ring-[#1a1a1a] cursor-pointer"
        >
          <span className="material-symbols-outlined material-symbols-fill text-[30px]">
            play_circle
          </span>
          <span className="tracking-normal">Start Awareness</span>
        </button>
      </section>

      {/* Secondary Quick Actions (Fog #f5f5f5 surface, 26px radius, Graphite text) */}
      <section className="w-full grid grid-cols-2 gap-3 pt-1">
        {/* Read Text (OCR) Action */}
        <button
          onClick={onReadTextClick}
          aria-label="Read Text with OCR"
          className="min-h-[76px] bg-[#f3f3f3] hover:bg-[#e8e8e8] active:scale-95 transition-all duration-150 rounded-26 p-3.5 flex flex-col items-start justify-center text-left border border-[#e2e2e2] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-26 bg-[#ffffff] flex items-center justify-center mb-1 text-[#1a1a1a]">
            <span className="material-symbols-outlined text-[20px]">document_scanner</span>
          </div>
          <span className="text-[15px] text-[#1a1a1a] font-bold leading-tight">
            Read Text (OCR)
          </span>
          <span className="text-[13px] text-[#444748] font-medium mt-0.5">Instant Speech</span>
        </button>

        {/* Ask Assistant Action */}
        <button
          onClick={onAskClick}
          aria-label="Ask Voice Assistant"
          className="min-h-[76px] bg-[#f3f3f3] hover:bg-[#e8e8e8] active:scale-95 transition-all duration-150 rounded-26 p-3.5 flex flex-col items-start justify-center text-left border border-[#e2e2e2] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-26 bg-[#ffffff] flex items-center justify-center mb-1 text-[#1a1a1a]">
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </div>
          <span className="text-[15px] text-[#1a1a1a] font-bold leading-tight">
            Ask Assistant
          </span>
          <span className="text-[13px] text-[#444748] font-medium mt-0.5">Voice Query</span>
        </button>
      </section>
    </div>
  );
};
