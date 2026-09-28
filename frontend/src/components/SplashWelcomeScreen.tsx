import React from 'react';
import { SPLASH_HERO_IMAGE_BASE64 } from '../assets/embeddedImages';

const SPLASH_HERO_IMAGE = SPLASH_HERO_IMAGE_BASE64;

interface SplashWelcomeScreenProps {
  onGetStarted: () => void;
  isExiting?: boolean;
}

export const SplashWelcomeScreen: React.FC<SplashWelcomeScreenProps> = ({
  onGetStarted,
  isExiting = false,
}) => {
  return (
    <div
      role="region"
      aria-label="Welcome to Vision Copilot"
      className={`w-full min-h-screen sm:min-h-full bg-[#ffffff] flex flex-col justify-between max-w-md mx-auto px-4 sm:px-6 py-3 sm:py-4 select-none transition-all duration-350 ease-in-out ${
        isExiting ? 'opacity-0 -translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
      style={{ opacity: isExiting ? 0 : 1 }}
    >
      {/* Top Header Bar - Compact vertical footprint */}
      <header className="w-full pt-1 pb-1 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a]">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </div>
          <span className="text-[14px] sm:text-[15px] font-bold tracking-tight text-[#1a1a1a]">
            Vision Copilot
          </span>
        </div>
        <span className="text-[11px] sm:text-[12px] font-semibold text-[#00a9dd] bg-[#00a9dd]/10 px-2.5 py-0.5 rounded-full">
          Assistive AI
        </span>
      </header>

      {/* Hero Visual & Messaging Area - Compact & Responsive */}
      <main className="flex-1 flex flex-col justify-center items-center my-auto py-2">
        {/* Prominent Image 1 with full opacity, no blend mode, responsive height for small screens */}
        <div className="w-auto h-[180px] min-[360px]:h-[210px] min-[375px]:h-[235px] sm:h-[270px] max-h-[38vh] aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#ffffff] border border-[#e8e8e8] relative flex items-center justify-center flex-shrink-0 shadow-none">
          <img
            src={SPLASH_HERO_IMAGE}
            alt="Vision Copilot - Spatial awareness visual perception"
            className="w-full h-full object-cover"
            style={{
              opacity: 1,
              mixBlendMode: 'normal',
              filter: 'none',
            }}
          />
        </div>

        {/* Branding & Tagline Content with tight, polished vertical rhythm */}
        <div className="mt-3 min-[375px]:mt-4 text-center space-y-1 px-2 flex-shrink-0">
          <h1 className="text-[26px] min-[360px]:text-[28px] min-[375px]:text-[32px] sm:text-[36px] font-bold text-[#1a1a1a] tracking-tight leading-tight">
            Vision Copilot
          </h1>
          <p className="text-[16px] min-[360px]:text-[17px] min-[375px]:text-[19px] sm:text-[20px] font-semibold text-[#00a9dd] tracking-wide">
            See Beyond Sight
          </p>
          <p className="text-[12px] min-[360px]:text-[13px] min-[375px]:text-[14px] text-[#444748] max-w-xs mx-auto pt-0.5 leading-snug">
            Real-time assistive spatial awareness, obstacle perception, and intelligent voice guidance.
          </p>
        </div>
      </main>

      {/* Bottom Action Area - Guaranteed visible and accessible */}
      <footer className="w-full pt-2 pb-2 sm:pb-3 flex-shrink-0">
        <button
          type="button"
          onClick={onGetStarted}
          aria-label="Get Started with Vision Copilot"
          className="w-full min-h-[50px] min-[375px]:min-h-[54px] rounded-26 bg-[#1a1a1a] text-[#ffffff] font-bold text-[16px] min-[375px]:text-[18px] flex items-center justify-center gap-2 hover:bg-[#2f2f2f] active:scale-[0.98] transition-all cursor-pointer shadow-none"
        >
          <span>Get Started</span>
          <span className="material-symbols-outlined text-[20px] min-[375px]:text-[22px]">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
};
