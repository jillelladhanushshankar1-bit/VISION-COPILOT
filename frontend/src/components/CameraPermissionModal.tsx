import React from 'react';

interface CameraPermissionModalProps {
  mode: 'explain' | 'denied' | 'insecure';
  context?: 'awareness' | 'ask' | 'ocr';
  onConfirm: () => void;
  onCancel: () => void;
  onRetry?: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  mode,
  context = 'awareness',
  onConfirm,
  onCancel,
  onRetry,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-permission-title"
      className="fixed inset-0 z-50 bg-[#000000]/70 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-sm bg-[#ffffff] rounded-26 p-6 shadow-2xl border border-[#e2e2e2] flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {mode === 'explain' && (
          <>
            <div className="w-12 h-12 rounded-26 bg-[#00af3d]/15 text-[#00af3d] flex items-center justify-center self-start">
              <span className="material-symbols-outlined text-[28px]">videocam</span>
            </div>
            <div className="space-y-1.5">
              <h2 id="camera-permission-title" className="text-[20px] font-bold text-[#1a1a1a]">
                Camera Access Needed
              </h2>
              <p className="text-[14px] text-[#444748] leading-relaxed">
                {context === 'ocr' ? (
                  <>Vision Copilot needs your camera to read the text in front of you — tap <strong>Allow</strong> on the next prompt.</>
                ) : context === 'ask' ? (
                  <>Vision Copilot needs your camera to observe what you&apos;re asking about — tap <strong>Allow</strong> on the next prompt to capture your surroundings.</>
                ) : (
                  <>Vision Copilot needs your camera to observe your surroundings — tap <strong>Allow</strong> on the next prompt to start real-time spatial awareness.</>
                )}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={onConfirm}
                className="w-full h-12 rounded-26 bg-[#00af3d] hover:bg-[#009433] text-[#ffffff] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span>Continue & Allow</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full h-11 rounded-26 bg-[#f5f5f5] hover:bg-[#e8e8e8] text-[#1a1a1a] font-semibold text-[15px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {mode === 'denied' && (
          <>
            <div className="w-12 h-12 rounded-26 bg-[#ff5406]/15 text-[#ff5406] flex items-center justify-center self-start">
              <span className="material-symbols-outlined text-[28px]">videocam_off</span>
            </div>
            <div className="space-y-1.5">
              <h2 id="camera-permission-title" className="text-[20px] font-bold text-[#1a1a1a]">
                Camera Access Denied
              </h2>
              <p className="text-[14px] text-[#444748] leading-relaxed">
                Vision Copilot cannot observe your path or alert you to obstacles without camera access.
              </p>
            </div>
            <div className="bg-[#f5f5f5] p-3 rounded-26 border border-[#e2e2e2] text-[13px] text-[#444748] space-y-1">
              <div className="font-bold text-[#1a1a1a] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>How to enable:</span>
              </div>
              <p>
                Click the lock or site settings icon next to your browser’s URL bar, set <strong>Camera</strong> to <strong>Allow</strong>, and tap Try Again.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={onRetry || onConfirm}
                className="w-full h-12 rounded-26 bg-[#1a1a1a] hover:bg-[#2f2f2f] text-[#ffffff] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full h-11 rounded-26 bg-[#f5f5f5] hover:bg-[#e8e8e8] text-[#1a1a1a] font-semibold text-[15px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </>
        )}

        {mode === 'insecure' && (
          <>
            <div className="w-12 h-12 rounded-26 bg-[#ff5406]/15 text-[#ff5406] flex items-center justify-center self-start">
              <span className="material-symbols-outlined text-[28px]">lock_open</span>
            </div>
            <div className="space-y-1.5">
              <h2 id="camera-permission-title" className="text-[20px] font-bold text-[#1a1a1a]">
                HTTPS Required
              </h2>
              <p className="text-[14px] text-[#444748] leading-relaxed">
                Browsers restrict camera and microphone access to secure HTTPS or localhost origins. Please open this app over HTTPS.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full h-11 rounded-26 bg-[#1a1a1a] text-[#ffffff] font-semibold text-[15px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
