import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenFeed?: () => void;
  onOpenMemory?: () => void;
  feedCount?: number;
  memoryCount?: number;
  currentScreenTitle?: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenFeed,
  onOpenMemory,
  feedCount = 0,
  memoryCount = 0,
  currentScreenTitle,
  onBack,
}) => {
  return (
    <header className="w-full bg-[#ffffff] pt-2.5 sm:pt-3.5 pb-2 px-2.5 sm:px-3.5 flex-shrink-0 z-20">
      <div className="flex justify-between items-center w-full max-w-md mx-auto gap-1 sm:gap-2">
        {/* Leading: Logo and Brand Name or Back Button */}
        {currentScreenTitle ? (
          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Go back"
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8e8e8] active:scale-95 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">arrow_back</span>
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[16px] sm:text-[19px] font-bold text-[#1a1a1a] tracking-tight leading-tight truncate">
                {currentScreenTitle}
              </span>
              <span className="text-[11px] font-medium text-[#747878]">Vision Copilot</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a] flex-shrink-0">
              <span className="material-symbols-outlined text-[19px] sm:text-[21px]">visibility</span>
            </div>
            <div className="text-[16px] sm:text-[19px] font-bold tracking-tight text-[#1a1a1a] flex items-baseline flex-shrink-0">
              <span>Vision</span>
              <span className="text-[#2f2f2f] font-semibold ml-1 hidden min-[360px]:inline">Copilot</span>
            </div>
          </div>
        )}

        {/* Trailing: Connected Badge & Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {!currentScreenTitle && (
            <div
              aria-label="Device status: Connected"
              className="h-8 sm:h-8.5 px-2 sm:px-2.5 bg-[#00b33f] text-[#ffffff] rounded-26 flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-semibold flex-shrink-0"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ffffff] animate-pulse flex-shrink-0"></span>
              <span className="hidden min-[360px]:inline">Connected</span>
              <span className="inline min-[360px]:hidden text-[10px]">Live</span>
            </div>
          )}

          {onOpenMemory && !currentScreenTitle && (
            <button
              onClick={onOpenMemory}
              aria-label={`View ${memoryCount} saved memories`}
              className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-26 bg-[#fcf8ff] border border-[#bd4be5]/30 flex items-center justify-center text-[#bd4be5] hover:bg-[#f6ebff] active:scale-95 transition-all flex-shrink-0"
              title="Personal Memories"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">psychology</span>
              {memoryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#bd4be5] text-white text-[10px] font-bold flex items-center justify-center pointer-events-none">
                  {memoryCount}
                </span>
              )}
            </button>
          )}

          {onOpenFeed && !currentScreenTitle && (
            <button
              onClick={onOpenFeed}
              aria-label={`View ${feedCount} recent observations`}
              className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8e8e8] active:scale-95 transition-all flex-shrink-0"
              title="Recent Observations"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">history</span>
              {feedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff5406] text-white text-[10px] font-bold flex items-center justify-center pointer-events-none">
                  {feedCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8e8e8] active:scale-95 transition-all flex-shrink-0"
            title="Settings"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
