import React, { useState } from 'react';

interface OnboardingModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_SLIDES = [
  {
    step: 'STEP 1',
    icon: 'photo_camera',
    title: 'Point your camera at the world',
    description:
      'Position your phone forward naturally as you move. The assistant continuously scans your path and objects.',
  },
  {
    step: 'STEP 2',
    icon: 'hearing',
    title: 'Vision Copilot watches and stays quiet',
    description:
      'No constant chatter. The AI remains passive and respectful until direct hazards or context require voice alerts.',
  },
  {
    step: 'STEP 3',
    icon: 'record_voice_over',
    title: 'It speaks up only when something matters',
    description:
      'Immediate, high-contrast audio guidance for curbs, approaching doors, signs, or unexpected obstacles.',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-[#ffffff] flex flex-col justify-between max-w-md mx-auto px-6 py-6 overflow-y-auto">
      {/* Top Bar Header: Brand Identity & Skip Action */}
      <header className="w-full flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a]">
            <span className="material-symbols-outlined text-[26px]">visibility</span>
          </div>
          <span className="text-[24px] font-bold tracking-tight text-[#1a1a1a]">Vision Copilot</span>
        </div>
        <button
          onClick={onSkip}
          aria-label="Skip onboarding walkthrough"
          className="text-[16px] font-semibold text-[#2f2f2f] px-3 py-1.5 rounded-26 hover:bg-[#f5f5f5] transition-colors"
        >
          Skip
        </button>
      </header>

      {/* Main Card */}
      <main className="w-full flex-1 flex flex-col justify-center my-4">
        <article className="w-full flex flex-col rounded-26 bg-[#f5f5f5] p-6 sm:p-8">
          {/* Card Media Inset Container */}
          <div className="w-full aspect-[4/3] rounded-26 bg-[#e8e8e8] flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-26 bg-[#ffffff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[56px] text-[#1a1a1a]">
                {slide.icon}
              </span>
            </div>
          </div>

          {/* Card Text Content */}
          <div className="flex flex-col space-y-2">
            <span className="text-[13px] font-bold text-[#747878] tracking-wider uppercase">
              {slide.step}
            </span>
            <h1 className="text-[28px] font-bold text-[#1a1a1a] leading-tight tracking-tight">
              {slide.title}
            </h1>
            <p className="text-[18px] font-normal text-[#2f2f2f] pt-2 leading-relaxed">
              {slide.description}
            </p>
          </div>
        </article>

        {/* High Contrast Progress Dots */}
        <nav aria-label="Onboarding page indicator" className="flex items-center justify-center gap-2 mt-6">
          {ONBOARDING_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-3 transition-all duration-200 rounded-full ${
                index === currentSlide
                  ? 'w-10 bg-[#1a1a1a]'
                  : 'w-3 bg-[#c4c7c7] hover:bg-[#747878]'
              }`}
            />
          ))}
        </nav>
      </main>

      {/* Bottom Action CTA */}
      <footer className="w-full pt-2 pb-2">
        <button
          onClick={handleNext}
          className="w-full min-h-[56px] rounded-26 bg-[#2f2f2f] text-[#ffffff] text-[20px] font-semibold flex items-center justify-center space-x-2 hover:bg-[#1a1a1a] active:scale-[0.98] transition-all"
        >
          <span>{currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}</span>
          <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
};
