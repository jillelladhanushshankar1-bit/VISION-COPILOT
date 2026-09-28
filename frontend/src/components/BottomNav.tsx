import React from 'react';

interface BottomNavProps {
  onAskClick: () => void;
  onReadTextClick: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeItem?: 'ask' | 'ocr' | 'mute' | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onAskClick,
  onReadTextClick,
  isMuted,
  onToggleMute,
  activeItem = null,
}) => {
  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-3 bg-[#eeeeee] border-t border-[#e2e2e2]/60"
    >
      <div className="max-w-md w-full mx-auto flex justify-between items-center px-2 gap-2">
        {/* Item 1: Ask AI (Primary CTA for Voice / Spatial Assistant) */}
        <button
          onClick={onAskClick}
          aria-current={activeItem === 'ask' ? 'page' : undefined}
          aria-label="Ask AI Assistant with Voice"
          className={`flex-1 flex flex-col items-center justify-center min-h-[56px] rounded-26 px-3 py-1.5 font-bold transition-all duration-150 active:scale-95 ${
            activeItem === 'ask'
              ? 'bg-[#00a9dd] text-[#ffffff]'
              : 'bg-[#1a1a1a] text-[#ffffff] hover:bg-[#2f2f2f]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">mic</span>
          <span className="text-[13px] font-bold mt-0.5 tracking-tight">Ask AI</span>
        </button>

        {/* Item 2: Read Text (OCR) */}
        <button
          onClick={onReadTextClick}
          aria-current={activeItem === 'ocr' ? 'page' : undefined}
          aria-label="Scan and Read Text with Camera"
          className={`flex-1 flex flex-col items-center justify-center min-h-[56px] rounded-26 px-3 py-1.5 transition-all duration-150 active:scale-95 ${
            activeItem === 'ocr'
              ? 'bg-[#1a1a1a] text-[#ffffff]'
              : 'bg-[#ffffff] text-[#1a1a1a] hover:bg-[#f5f5f5]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">document_scanner</span>
          <span className="text-[13px] font-semibold mt-0.5 tracking-tight">Read Text</span>
        </button>

        {/* Item 3: Mute Audio */}
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`flex-1 flex flex-col items-center justify-center min-h-[56px] rounded-26 px-3 py-1.5 transition-all duration-150 active:scale-95 ${
            isMuted
              ? 'bg-[#e2e2e2] text-[#ff5406] border-2 border-[#ff5406]'
              : 'bg-[#ffffff] text-[#444748] hover:bg-[#f5f5f5]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
          <span className="text-[13px] font-semibold mt-0.5 tracking-tight">
            {isMuted ? 'Muted' : 'Mute Audio'}
          </span>
        </button>
      </div>
    </nav>
  );
};
