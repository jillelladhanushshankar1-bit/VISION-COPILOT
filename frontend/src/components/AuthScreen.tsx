import React, { useState, useEffect } from 'react';
import { VISION_COPILOT_LOGO_BASE64 } from '../assets/embeddedImages';

const VISION_COPILOT_LOGO = VISION_COPILOT_LOGO_BASE64;

interface AuthScreenProps {
  onSuccess: (email: string, isNewUser?: boolean) => void;
  onOpenOnboarding: () => void;
  isEntering?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onOpenOnboarding,
  isEntering = false,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('user@visioncopilot.ai');
  const [password, setPassword] = useState('••••••••');
  const [fullName, setFullName] = useState('Alex Morgan');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when mode or inputs change
  useEffect(() => {
    setError(null);
  }, [mode, email, password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase() || 'user@visioncopilot.ai';
    
    // Fetch registered users from localStorage
    let users: Record<string, string> = {};
    try {
      const storedUsers = localStorage.getItem('vision_copilot_users');
      if (storedUsers) {
        users = JSON.parse(storedUsers);
      }
    } catch {
      // ignore
    }

    if (mode === 'signup') {
      if (users[normalizedEmail]) {
        setError('An account with this email already exists.');
        return;
      }
      // Save new user
      users[normalizedEmail] = password;
      try {
        localStorage.setItem('vision_copilot_users', JSON.stringify(users));
      } catch {}
      onSuccess(normalizedEmail, true); // true = new user
    } else {
      // Sign In
      if (!users[normalizedEmail]) {
        setError('No account found with this email.');
        return;
      }
      if (users[normalizedEmail] !== password) {
        setError('Incorrect password. Please try again.');
        return;
      }
      onSuccess(normalizedEmail, false); // false = existing user
    }
  };

  const handleGuestEntry = () => {
    onSuccess('guest.pilot@visioncopilot.ai', false);
  };

  return (
    <div
      role="region"
      aria-label="Sign in to Vision Copilot"
      className={`w-full min-h-full sm:min-h-screen bg-[#ffffff] flex flex-col justify-between max-w-md mx-auto px-5 sm:px-6 py-3 sm:py-5 select-none transition-all duration-350 ease-in-out ${
        isEntering ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
      }`}
      style={{ opacity: isEntering ? 0 : 1 }}
    >
      {/* Top Header */}
      <header className="w-full pt-2 pb-1 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a]">
              <span className="material-symbols-outlined text-[26px]">visibility</span>
            </div>
            <div className="text-[24px] sm:text-[26px] font-bold tracking-tight text-[#1a1a1a] flex items-baseline">
              <span>Vision</span>
              <span className="text-[#2f2f2f] font-semibold ml-1">Copilot</span>
            </div>
          </div>
          <button
            onClick={onOpenOnboarding}
            className="text-[14px] font-bold text-[#00a9dd] hover:underline px-2 py-1"
          >
            How it works
          </button>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex flex-col justify-center my-2 sm:my-3 space-y-4">
        {/* Image 2 (Logo) centered horizontally above Welcome back - sized 104px-116px (in 96-120px range), full opacity, no blend mode */}
        <div className="flex justify-center items-center pt-1 pb-1 sm:pt-2 sm:pb-2 flex-shrink-0">
          <div className="w-[104px] h-[104px] sm:w-[116px] sm:h-[116px] rounded-2xl overflow-hidden bg-[#ffffff] border border-[#e2e2e2] flex items-center justify-center p-2 shadow-none">
            <img
              src={VISION_COPILOT_LOGO}
              alt="Vision Copilot Logo"
              className="w-full h-full object-contain"
              style={{
                opacity: 1,
                mixBlendMode: 'normal',
                filter: 'none',
              }}
            />
          </div>
        </div>

        <div className="space-y-1 text-center sm:text-left flex-shrink-0">
          <h1 className="text-[30px] sm:text-[32px] font-bold text-[#1a1a1a] tracking-tight leading-tight">
            {mode === 'signin' ? 'Welcome back' : 'Get started'}
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#444748] leading-relaxed">
            {mode === 'signin'
              ? 'Sign in to access your spatial awareness profile.'
              : 'Create an account to calibrate your assistive voice assistant.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="w-full p-1 bg-[#f5f5f5] rounded-26 flex">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 min-h-[46px] rounded-26 text-[15px] font-bold transition-all ${
              mode === 'signin'
                ? 'bg-[#1a1a1a] text-[#ffffff]'
                : 'text-[#444748] hover:text-[#1a1a1a]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 min-h-[46px] rounded-26 text-[15px] font-bold transition-all ${
              mode === 'signup'
                ? 'bg-[#1a1a1a] text-[#ffffff]'
                : 'text-[#444748] hover:text-[#1a1a1a]'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[14px] font-bold text-[#2f2f2f] px-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full min-h-[56px] px-5 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] text-[16px] font-medium border border-[#e2e2e2] focus:border-[#1a1a1a] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[14px] font-bold text-[#2f2f2f] px-1">Email address</label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className={`w-full min-h-[56px] px-5 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] text-[16px] font-medium border ${error && error.includes('email') ? 'border-[#ba1a1a]' : 'border-[#e2e2e2]'} focus:border-[#1a1a1a] focus:outline-none transition-colors`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[14px] font-bold text-[#2f2f2f]">Password</label>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full min-h-[56px] px-5 pr-14 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] text-[16px] font-medium border ${error && (error.includes('password') || error.includes('Incorrect')) ? 'border-[#ba1a1a]' : 'border-[#e2e2e2]'} focus:border-[#1a1a1a] focus:outline-none transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 p-2 text-[#747878] hover:text-[#1a1a1a]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          
          {error && (
            <div className="px-2 text-[14px] font-medium text-[#ba1a1a]">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[56px] mt-2 rounded-26 bg-[#1a1a1a] text-[#ffffff] text-[18px] font-bold flex items-center justify-center space-x-2 hover:bg-[#2f2f2f] active:scale-[0.98] transition-all"
          >
            <span>{mode === 'signin' ? 'Sign In to Copilot' : 'Create & Launch'}</span>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#e2e2e2]"></div>
          <span className="flex-shrink mx-4 text-[#747878] text-[13px] font-medium">or</span>
          <div className="flex-grow border-t border-[#e2e2e2]"></div>
        </div>

        {/* 1-Tap Prototype Demo Access */}
        <button
          type="button"
          onClick={handleGuestEntry}
          className="w-full min-h-[56px] rounded-26 bg-[#f5f5f5] text-[#2f2f2f] text-[16px] font-bold border-2 border-[#1a1a1a] flex items-center justify-center space-x-2 hover:bg-[#e8e8e8] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[22px] text-[#00b33f]">bolt</span>
          <span>Instant Prototype Mode (1-Tap)</span>
        </button>
      </main>

      <footer className="w-full text-center py-2">
        <p className="text-[13px] text-[#747878]">
          Assistive Prototype Demonstration · WCAG AAA High Contrast
        </p>
      </footer>
    </div>
  );
};
