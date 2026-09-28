import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  onSignOut: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  onSignOut,
}) => {
  const [formData, setFormData] = useState<AppSettings>({
    ...settings,
    mockMode: settings.mockMode ?? false,
    ollamaUrl: settings.ollamaUrl ?? 'http://localhost:11434',
    geminiApiKey: settings.geminiApiKey ?? '',
  });
  const [showToast, setShowToast] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    const defaults: AppSettings = {
      speechRate: 1.0,
      voice: 'Nova (Warm)',
      verbosity: 'Concise',
      hazardSensitivity: 'Medium',
      warningDistance: '6 ft',
      autoAnnounce: true,
      hapticFeedback: true,
      highContrastReticles: true,
      soundCues: true,
      userName: 'Alex Morgan',
      userEmail: 'user@visioncopilot.ai',
      emergencyContact: 'Dr. Sarah Vance · +1 (555) 234-8901',
      mockMode: false,
      ollamaUrl: 'http://localhost:11434',
      geminiApiKey: '',
    };
    setFormData(defaults);
    onSave(defaults);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#ffffff] flex flex-col justify-between max-w-md mx-auto select-none overflow-hidden animate-in slide-in-from-bottom duration-200">
      {/* Header */}
      <header className="w-full bg-[#ffffff] pt-4 pb-3 px-6 border-b border-[#e2e2e2] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            aria-label="Back to home"
            className="w-10 h-10 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8e8e8] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-[#1a1a1a] leading-tight">Settings</h1>
            <p className="text-[13px] text-[#747878] font-medium">Local preferences & model backend</p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          className="text-[13px] font-bold text-[#747878] hover:text-[#1a1a1a] px-2 py-1"
        >
          Reset
        </button>
      </header>

      {/* Settings Form Body */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {showToast && (
          <div className="w-full bg-[#00af3d] text-[#ffffff] p-3 rounded-26 text-center text-[14px] font-bold animate-in fade-in">
            ✓ Preferences saved successfully in local storage
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 0: Developer & Model Backend Configuration */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#747878] uppercase tracking-wider">
                Developer & Vision Backend
              </h2>
              {formData.mockMode && (
                <span className="bg-[#ff5406] text-[#ffffff] text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Dev Mode Active
                </span>
              )}
            </div>

            {/* Mock Mode Toggle */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] flex items-center justify-between">
              <div className="pr-2">
                <span className="text-[15px] font-bold text-[#1a1a1a] block">Mock Mode</span>
                <span className="text-[12px] text-[#747878]">
                  Offline simulation with sample responses (stops real network calls)
                </span>
              </div>
              <button
                type="button"
                id="mock-mode-toggle"
                aria-label="Toggle Mock Mode offline simulation"
                onClick={() => handleChange('mockMode', !formData.mockMode)}
                className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 cursor-pointer flex-shrink-0 ${
                  formData.mockMode ? 'bg-[#00af3d] justify-end' : 'bg-[#c4c7c7] justify-start'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-[#ffffff] shadow-sm"></span>
              </button>
            </div>

            {/* Ollama URL Field */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] space-y-1.5">
              <label htmlFor="ollama-url-input" className="text-[14px] font-bold text-[#1a1a1a] block">
                Ollama URL
              </label>
              <input
                id="ollama-url-input"
                name="ollamaUrl"
                type="text"
                placeholder="http://localhost:11434"
                value={formData.ollamaUrl}
                onChange={(e) => handleChange('ollamaUrl', e.target.value)}
                className="w-full h-11 px-3 rounded-26 bg-[#ffffff] text-[#1a1a1a] text-[14px] font-medium border border-[#e2e2e2] focus:border-[#1a1a1a] focus:outline-none"
              />
              <span className="text-[11px] text-[#747878] block">
                Endpoint for local edge vision/LLM inference
              </span>
            </div>

            {/* Gemini API Key Field */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="gemini-key-input" className="text-[14px] font-bold text-[#1a1a1a]">
                  Gemini API Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] font-bold text-[#00a9dd] hover:underline"
                >
                  {showApiKey ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <input
                id="gemini-key-input"
                name="geminiApiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={formData.geminiApiKey}
                onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                className="w-full h-11 px-3 rounded-26 bg-[#ffffff] text-[#1a1a1a] text-[14px] font-mono border border-[#e2e2e2] focus:border-[#1a1a1a] focus:outline-none"
              />
              <span className="text-[11px] text-[#747878] block">
                Stored locally in browser for Gemini 2.5 Flash visual intelligence
              </span>
            </div>
          </section>

          {/* SECTION 1: Audio & Voice */}
          <section className="space-y-3">
            <h2 className="text-[14px] font-bold text-[#747878] uppercase tracking-wider">
              Audio & Speech Guidance
            </h2>

            {/* Speech Rate */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[15px] font-bold text-[#1a1a1a]">Speech Rate</label>
                <span className="text-[14px] font-bold text-[#00a9dd]">
                  {formData.speechRate}x
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleChange('speechRate', rate)}
                    className={`min-h-[40px] rounded-26 text-[13px] font-bold transition-all ${
                      formData.speechRate === rate
                        ? 'bg-[#1a1a1a] text-[#ffffff]'
                        : 'bg-[#ffffff] text-[#444748] hover:bg-[#e8e8e8]'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Profile */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] space-y-2">
              <label className="text-[15px] font-bold text-[#1a1a1a]">Voice Persona</label>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['Nova (Warm)', 'Atlas (Crisp)', 'Echo (Clear)'] as const).map((voice) => (
                  <button
                    key={voice}
                    type="button"
                    onClick={() => handleChange('voice', voice)}
                    className={`min-h-[42px] px-2 rounded-26 text-[12px] font-bold transition-all ${
                      formData.voice === voice
                        ? 'bg-[#1a1a1a] text-[#ffffff]'
                        : 'bg-[#ffffff] text-[#444748] hover:bg-[#e8e8e8]'
                    }`}
                  >
                    {voice.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Cues Toggle */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] flex items-center justify-between">
              <div>
                <span className="text-[15px] font-bold text-[#1a1a1a] block">Spatial Sound Cues</span>
                <span className="text-[12px] text-[#747878]">Gentle chimes prior to hazard alerts</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('soundCues', !formData.soundCues)}
                className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 ${
                  formData.soundCues ? 'bg-[#00af3d] justify-end' : 'bg-[#c4c7c7] justify-start'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-[#ffffff]"></span>
              </button>
            </div>
          </section>

          {/* SECTION 2: Detection & Safety */}
          <section className="space-y-3">
            <h2 className="text-[14px] font-bold text-[#747878] uppercase tracking-wider">
              Safety & Detection
            </h2>

            {/* Hazard Sensitivity */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] space-y-2">
              <label className="text-[15px] font-bold text-[#1a1a1a]">Detection Sensitivity</label>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['High', 'Medium', 'Low'] as const).map((sens) => (
                  <button
                    key={sens}
                    type="button"
                    onClick={() => handleChange('hazardSensitivity', sens)}
                    className={`min-h-[40px] rounded-26 text-[13px] font-bold transition-all ${
                      formData.hazardSensitivity === sens
                        ? 'bg-[#1a1a1a] text-[#ffffff]'
                        : 'bg-[#ffffff] text-[#444748] hover:bg-[#e8e8e8]'
                    }`}
                  >
                    {sens}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Distance */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] space-y-2">
              <label className="text-[15px] font-bold text-[#1a1a1a]">Warning Trigger Distance</label>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['3 ft', '6 ft', '10 ft'] as const).map((dist) => (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => handleChange('warningDistance', dist)}
                    className={`min-h-[40px] rounded-26 text-[13px] font-bold transition-all ${
                      formData.warningDistance === dist
                        ? 'bg-[#1a1a1a] text-[#ffffff]'
                        : 'bg-[#ffffff] text-[#444748] hover:bg-[#e8e8e8]'
                    }`}
                  >
                    {dist}
                  </button>
                ))}
              </div>
            </div>

            {/* Haptic Feedback Toggle */}
            <div className="bg-[#f5f5f5] p-4 rounded-26 border border-[#e2e2e2] flex items-center justify-between">
              <div>
                <span className="text-[15px] font-bold text-[#1a1a1a] block">Haptic Vibrations</span>
                <span className="text-[12px] text-[#747878]">Vibrate phone on imminent hazards</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('hapticFeedback', !formData.hapticFeedback)}
                className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 ${
                  formData.hapticFeedback ? 'bg-[#00af3d] justify-end' : 'bg-[#c4c7c7] justify-start'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-[#ffffff]"></span>
              </button>
            </div>
          </section>

          {/* SECTION 3: User Profile & Emergency Contact */}
          <section className="space-y-3">
            <h2 className="text-[14px] font-bold text-[#747878] uppercase tracking-wider">
              Profile & Emergency Contact
            </h2>

            <div className="space-y-2">
              <label className="text-[14px] font-bold text-[#1a1a1a] px-1">Your Name</label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => handleChange('userName', e.target.value)}
                className="w-full min-h-[50px] px-4 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] text-[15px] font-semibold border border-[#e2e2e2] focus:border-[#1a1a1a] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[14px] font-bold text-[#1a1a1a] px-1">Email</label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) => handleChange('userEmail', e.target.value)}
                className="w-full min-h-[50px] px-4 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] text-[15px] font-semibold border border-[#e2e2e2] focus:border-[#1a1a1a] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[14px] font-bold text-[#1a1a1a] px-1">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => handleChange('emergencyContact', e.target.value)}
                className="w-full min-h-[50px] px-4 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] text-[15px] font-semibold border border-[#e2e2e2] focus:border-[#1a1a1a] focus:outline-none"
              />
            </div>
          </section>

          {/* Sign Out Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onSignOut}
              className="w-full min-h-[48px] rounded-26 bg-[#f5f5f5] text-[#ba1a1a] text-[14px] font-bold border border-[#ba1a1a]/30 hover:bg-[#ffdad6]/20 active:scale-95 transition-all"
            >
              Sign Out / Switch User
            </button>
          </div>
        </form>
      </main>

      {/* Bottom Save Action */}
      <footer className="w-full bg-[#ffffff] p-4 border-t border-[#e2e2e2]">
        <button
          onClick={handleSubmit}
          className="w-full min-h-[56px] rounded-26 bg-[#1a1a1a] text-[#ffffff] font-bold text-[18px] flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-[#2f2f2f]"
        >
          <span>Save Preferences</span>
        </button>
      </footer>
    </div>
  );
};
