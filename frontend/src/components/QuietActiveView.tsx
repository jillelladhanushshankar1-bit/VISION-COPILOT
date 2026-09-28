import React from 'react';
import { VisionEvent, CameraFacing } from '../types';
import { LiveVideoViewport } from './LiveVideoViewport';

interface QuietActiveViewProps {
  onStopAwareness: () => void;
  onReadTextClick: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenFeed: () => void;
  recentEvents: VisionEvent[];
  onTriggerNextMockEvent: () => void;
  secondsUntilNextEvent: number;
  cameraFacing: CameraFacing;
  onToggleCameraFacing: () => void;
  cameraStream: MediaStream | null;
  isSendingFrame?: boolean;
  lastObservationStatus?: string;
  awarenessError?: string | null;
  onRetryAwareness?: () => void;
}

export const QuietActiveView: React.FC<QuietActiveViewProps> = ({
  onStopAwareness,
  onReadTextClick,
  isMuted,
  onToggleMute,
  onOpenFeed,
  recentEvents,
  onTriggerNextMockEvent,
  secondsUntilNextEvent,
  cameraFacing,
  onToggleCameraFacing,
  cameraStream,
  isSendingFrame = false,
  lastObservationStatus = 'Clear Path',
  awarenessError = null,
  onRetryAwareness,
}) => {
  return (
    <div className="flex-1 flex flex-col space-y-3.5 px-6 pt-1 pb-6">
      {/* High-Affordance Calm Indicator Badge */}
      <section
        aria-live="polite"
        className="w-full bg-[#f3f3f3] rounded-26 p-3.5 border-2 border-[#eeeeee] flex items-center justify-between"
        role="status"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9">
            <span className="absolute w-9 h-9 rounded-full bg-[#00af3d]/25 animate-ping"></span>
            <span className="w-4 h-4 rounded-full bg-[#00af3d] ring-4 ring-[#ffffff]"></span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[16px] text-[#1a1a1a] font-bold leading-snug">
                Awareness Active
              </span>
              {isSendingFrame && (
                <span className="px-1.5 py-0.2 bg-[#00a9dd]/20 text-[#00a9dd] text-[10px] font-bold rounded-full animate-pulse">
                  Analyzing
                </span>
              )}
            </div>
            <span className="text-[13px] text-[#444748] font-medium">
              Live Monitoring ({cameraStream ? 'Camera Active' : 'Simulated'})
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-[#00af3d] text-[26px]">
          check_circle
        </span>
      </section>

      {/* Graceful Network Error / Unreachable Banner */}
      {awarenessError && (
        <div
          role="alert"
          aria-live="assertive"
          className="w-full bg-[#fff4f2] border-2 border-[#ba1a1a] rounded-26 p-3.5 flex items-center justify-between gap-3 text-[#ba1a1a] animate-in fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-[22px] flex-shrink-0">
              cloud_off
            </span>
            <p className="text-[13px] font-bold leading-tight truncate">
              {awarenessError}
            </p>
          </div>
          {onRetryAwareness && (
            <button
              onClick={onRetryAwareness}
              aria-label="Retry observation connection"
              className="px-3.5 py-1.5 bg-[#ba1a1a] text-[#ffffff] text-[12px] font-bold rounded-full hover:bg-[#93000a] active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Inset Live Feed Camera Card */}
      <div className="w-full bg-[#eeeeee] rounded-26 p-2 relative overflow-hidden flex flex-col">
        <div className="relative w-full aspect-[4/3] rounded-26 overflow-hidden bg-[#1a1a1a]">
          <LiveVideoViewport
            stream={cameraStream}
            cameraFacing={cameraFacing}
            fallbackAlt={
              cameraFacing === 'back'
                ? 'A clean point-of-view perspective of a quiet modern living room and hallway flooded with soft daylight'
                : 'Front camera perspective of user monitoring personal surroundings'
            }
            fallbackImage={
              cameraFacing === 'back'
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuALFIk5uJqQOPihmOs0cXQ7zD7egILajN5HSm5-_DrJi5B5fRhJ6AW34iW6edR9KKvnrcXrkDaCa2d4dE3g4G82JIl0MgUTHCJjgAK0SNGVT81TW0g4Pc-soM_wDMjSrthkOa7qtRNFBQLeXucCLfAuoyOb-vfC6R4oxvozYJVCZ2-da3HReGzc-2_8rYbyDa3r24fEOV7pAan1UUiaEzi-ATfUg-3bQin7meNGmi-Kd6GT6SY3UDrk'
                : '/src/assets/images/remembered_sister_portrait_1790251837150.jpg'
            }
          />

          {/* Non-intrusive Overlay Grid Anchors */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-[#2f2f2f]/85 px-3 py-1 rounded-26 text-[#ffffff] z-10">
            <span className="material-symbols-outlined text-[15px] text-[#47c8fe]">
              {cameraStream ? 'videocam' : 'sensors'}
            </span>
            <span className="text-[13px] font-semibold text-[#ffffff]">
              {cameraFacing === 'back' ? 'Live Optical Feed' : 'Front Optical Feed'}
            </span>
          </div>

          {/* Top-Right Control Group: Network/Interval Badge & Camera Flip Button */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            <div className="bg-[#1a1a1a]/75 text-white/90 text-[11px] px-2.5 py-1 rounded-26 font-medium hidden min-[360px]:block">
              {isSendingFrame ? 'Sending frame…' : `Scan in ${secondsUntilNextEvent}s`}
            </div>
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

          <div className="absolute bottom-3 right-3 bg-[#2f2f2f]/85 px-3 py-1 rounded-26 text-[#ffffff] flex items-center gap-1.5 z-10">
            <span className="material-symbols-outlined text-[15px] text-[#00af3d]">
              {cameraFacing === 'back' ? 'verified_user' : 'face'}
            </span>
            <span className="text-[13px] font-bold">
              {cameraFacing === 'back' ? (lastObservationStatus || 'Clear Path') : 'Front Camera (Clear View)'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Assist Primary and Reachable Actions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* OCR / Text Reader Button */}
        <button
          onClick={onReadTextClick}
          aria-label="Read Text with OCR"
          className="h-14 rounded-26 bg-[#eeeeee] text-[#1a1a1a] text-[16px] font-bold flex items-center justify-center gap-2 border-2 border-[#1a1a1a] active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">document_scanner</span>
          <span>Read Text</span>
        </button>

        {/* Toggle Audio Feedback / Mute Button */}
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Audio Muted' : 'Audio On'}
          className={`h-14 rounded-26 text-[16px] font-bold flex items-center justify-center gap-2 border-2 transition-transform active:scale-95 cursor-pointer ${
            isMuted
              ? 'bg-[#e2e2e2] text-[#ff5406] border-[#ff5406]'
              : 'bg-[#eeeeee] text-[#1a1a1a] border-[#eeeeee] hover:bg-[#e8e8e8]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
          <span>{isMuted ? 'Audio Muted' : 'Audio On'}</span>
        </button>

        {/* Full-Width Stop Awareness Control */}
        <div className="col-span-2">
          <button
            onClick={onStopAwareness}
            aria-label="Stop Awareness"
            className="w-full h-14 rounded-26 bg-[#2f2f2f] text-[#ffffff] text-[16px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-[#1a1a1a] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">pause_circle</span>
            <span>Stop Awareness</span>
          </button>
        </div>
      </div>

      {/* Collapsed Observations Drawer Strip */}
      <div
        onClick={onOpenFeed}
        aria-label="Recent observations summary"
        className="w-full bg-[#eeeeee] rounded-26 p-4 border border-[#c4c7c7] flex flex-col gap-2 cursor-pointer active:scale-[0.98] transition-all hover:bg-[#e8e8e8]"
        role="button"
        tabIndex={0}
      >
        <div className="w-12 h-1.5 bg-[#c4c7c7] rounded-full mx-auto mb-0.5"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1a1a1a] text-[22px]">history</span>
            <span className="text-[16px] text-[#1a1a1a] font-bold">
              Recent observations ({recentEvents.length})
            </span>
          </div>
          <span className="px-2.5 py-0.5 bg-[#ffffff] text-[#00af3d] text-[13px] font-bold rounded-26 border border-[#00af3d]">
            All clear
          </span>
        </div>
        <p className="text-[14px] text-[#444748] flex items-center justify-between pt-0.5 font-medium">
          <span>{lastObservationStatus ? `Status: ${lastObservationStatus}` : 'No hazards detected'}</span>
          <span className="text-[13px] font-bold text-[#1a1a1a] flex items-center gap-1">
            <span>Swipe up to expand</span>
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
          </span>
        </p>
      </div>

      {/* Manual Instant Trigger for Testing */}
      <div className="pt-0.5 flex justify-center">
        <button
          onClick={onTriggerNextMockEvent}
          className="text-[13px] font-bold text-[#2f2f2f] hover:text-[#00a9dd] flex items-center gap-1.5 py-1 px-3 bg-[#f5f5f5] rounded-full active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-[#ff5406]">bolt</span>
          <span>Trigger Next Mock Event Now</span>
        </button>
      </div>
    </div>
  );
};
