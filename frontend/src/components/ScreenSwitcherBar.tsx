import React, { useState } from 'react';

export type ScreenStateKey =
  | 'splash'
  | 'auth'
  | 'onboarding'
  | 'idle'
  | 'quiet'
  | 'event_active'
  | 'ask'
  | 'ocr'
  | 'feed'
  | 'memory'
  | 'settings';

export type ViewportWidthOption = 'responsive' | 320 | 375 | 430;

interface ScreenSwitcherBarProps {
  currentScreenKey: ScreenStateKey;
  onSelectScreen: (key: ScreenStateKey) => void;
  viewportWidth: ViewportWidthOption;
  onSelectViewportWidth: (width: ViewportWidthOption) => void;
}

const SCREENS: { key: ScreenStateKey; title: string; badge: string; color: string }[] = [
  { key: 'splash', title: 'Splash / Welcome Hero', badge: '1/11', color: '#00a9dd' },
  { key: 'auth', title: 'Sign In / Sign Up', badge: '2/11', color: '#1a1a1a' },
  { key: 'onboarding', title: 'Onboarding (3 Steps)', badge: '3/11', color: '#2f2f2f' },
  { key: 'idle', title: 'Home Idle (1080p Viewfinder)', badge: '4/11', color: '#747878' },
  { key: 'quiet', title: 'Awareness: Quiet Monitoring', badge: '5/11', color: '#00af3d' },
  { key: 'event_active', title: 'Awareness: Event Card Alert', badge: '6/11', color: '#ff5406' },
  { key: 'ask', title: 'Ask AI Voice Overlay', badge: '7/11', color: '#00a9dd' },
  { key: 'ocr', title: 'Optical Text Reader (OCR)', badge: '8/11', color: '#006687' },
  { key: 'feed', title: 'Recent Observations Feed', badge: '9/11', color: '#2f2f2f' },
  { key: 'memory', title: 'Personal Memory List', badge: '10/11', color: '#bd4be5' },
  { key: 'settings', title: 'Settings & Preferences', badge: '11/11', color: '#1a1a1a' },
];

export const ScreenSwitcherBar: React.FC<ScreenSwitcherBarProps> = ({
  currentScreenKey,
  onSelectScreen,
  viewportWidth,
  onSelectViewportWidth,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentIndex = SCREENS.findIndex((s) => s.key === currentScreenKey);
  const current = SCREENS[currentIndex] || SCREENS[2];

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + SCREENS.length) % SCREENS.length;
    onSelectScreen(SCREENS[nextIdx].key);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % SCREENS.length;
    onSelectScreen(SCREENS[nextIdx].key);
  };

  return (
    <aside
      aria-label="Screen and state prototype switcher"
      className="w-full bg-[#1a1a1a] text-[#ffffff] px-2.5 sm:px-4 py-2 border-b border-[#2f2f2f] z-50 select-none"
    >
      <div className="max-w-md mx-auto flex flex-col space-y-1.5">
        {/* Main Navigation Row */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            aria-label="Previous screen"
            className="h-8 px-2 sm:px-2.5 rounded-26 bg-[#2f2f2f] hover:bg-[#3d3d3d] text-white flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-[12px] font-bold active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">chevron_left</span>
            <span className="hidden min-[360px]:inline">Prev</span>
          </button>

          {/* Current Screen Selector Pill */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 h-8 px-2.5 rounded-26 bg-[#2f2f2f] hover:bg-[#383838] flex items-center justify-between text-left transition-all active:scale-98 min-w-0"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: current.color }}
              ></span>
              <span className="text-[11px] sm:text-[12px] font-bold text-[#ffffff] truncate">
                {current.badge}: {current.title}
              </span>
            </div>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#c4c7c7] ml-1 flex-shrink-0">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            aria-label="Next screen"
            className="h-8 px-2 sm:px-2.5 rounded-26 bg-[#2f2f2f] hover:bg-[#3d3d3d] text-white flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-[12px] font-bold active:scale-95 transition-all flex-shrink-0"
          >
            <span className="hidden min-[360px]:inline">Next</span>
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">chevron_right</span>
          </button>
        </div>

        {/* Viewport Width Preset Row (Explicitly sets width to 320px, 375px, 430px, or Auto) */}
        <div className="flex items-center justify-between bg-[#262626] p-1 rounded-26 text-[10px] sm:text-[11px] font-bold">
          <span className="text-[#8e9192] px-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">devices</span>
            <span className="hidden min-[340px]:inline">Viewport:</span>
          </span>
          <div className="flex items-center gap-1">
            {([
              { width: 320, label: '320px' },
              { width: 375, label: '375px' },
              { width: 430, label: '430px' },
              { width: 'responsive', label: 'Auto' },
            ] as const).map(({ width, label }) => (
              <button
                key={label}
                onClick={() => onSelectViewportWidth(width)}
                aria-pressed={viewportWidth === width}
                className={`px-2 py-0.5 rounded-full transition-all active:scale-95 ${
                  viewportWidth === width
                    ? 'bg-[#00af3d] text-[#ffffff] font-extrabold'
                    : 'text-[#c4c7c7] hover:bg-[#333333]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Menu of All Screens */}
        {isOpen && (
          <div className="p-2 bg-[#262626] rounded-26 border border-[#3d3d3d] grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-in fade-in max-h-72 overflow-y-auto">
            {SCREENS.map((s, idx) => (
              <button
                key={s.key}
                onClick={() => {
                  onSelectScreen(s.key);
                  setIsOpen(false);
                }}
                className={`p-2 rounded-xl text-left text-[12px] font-bold flex items-center justify-between transition-all ${
                  s.key === currentScreenKey
                    ? 'bg-[#ffffff] text-[#1a1a1a]'
                    : 'text-[#c4c7c7] hover:bg-[#333333] hover:text-[#ffffff]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  ></span>
                  <span className="truncate">{s.title}</span>
                </div>
                <span className="text-[10px] opacity-70 ml-1">{idx + 1}/{SCREENS.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
