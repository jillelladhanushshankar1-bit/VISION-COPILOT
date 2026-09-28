import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VisionEvent } from '../types';
import { VoiceRecognizer, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import {
  playListeningStartedEarcon,
  playConnectionLostEarcon,
  playConnectionRestoredEarcon,
} from '../utils/earcons';

interface AskOverlayProps {
  onClose: () => void;
  currentEvent?: VisionEvent | null;
  isMuted: boolean;
  onSpeak: (text: string) => void;
  capturedFrame?: string | null;
  getCurrentFrameBase64?: () => string | null;
  mockMode?: boolean;
}

export const AskOverlay: React.FC<AskOverlayProps> = ({
  onClose,
  isMuted,
  onSpeak,
  capturedFrame,
  getCurrentFrameBase64,
  mockMode = false,
}) => {
  // Check if mic permission was previously acknowledged
  const [hasPromptedMic, setHasPromptedMic] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vision_copilot_mic_acknowledged') === 'true';
    } catch {
      return false;
    }
  });

  const [phase, setPhase] = useState<'permission_prompt' | 'listening' | 'thinking' | 'answered'>(() => {
    try {
      if (localStorage.getItem('vision_copilot_mic_acknowledged') === 'true') {
        return 'listening';
      }
    } catch {
      // ignore
    }
    return 'permission_prompt';
  });

  // Real transcribed question & received backend answer (initially empty)
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  // Determine frame to use: captured standalone frame or most recent from active awareness
  const resolvedFrame = capturedFrame || (getCurrentFrameBase64 ? getCurrentFrameBase64() : null);

  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  // Send question and camera frame to backend /api/ask
  const sendQuestionToBackend = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      const cleanQuestion = q.trim();
      setPhase('thinking');
      setBackendError(null);
      setLastFailedQuestion(null);
      setQuestion(cleanQuestion);

      if (mockMode) {
        setTimeout(() => {
          let mockAnswer = 'The walkway directly ahead is clear with approximately 8 feet of open walking room.';
          const lower = cleanQuestion.toLowerCase();
          if (lower.includes('stairs') || lower.includes('steps')) {
            mockAnswer = 'There are no stairs directly ahead; the floor remains flat and level.';
          } else if (lower.includes('door')) {
            mockAnswer = 'An interior doorway is visible approximately 6 feet to your right.';
          } else if (lower.includes('who') || lower.includes('person')) {
            mockAnswer = 'The path in front of you is open with no pedestrians directly blocking your way.';
          } else if (lower.includes('text') || lower.includes('read') || lower.includes('workshop')) {
            mockAnswer = 'The robotics workshop is Friday at 5 PM in Block C.';
          }
          setAnswer(mockAnswer);
          setPhase('answered');
          if (!isMuted) {
            onSpeak(mockAnswer);
          }
        }, 350);
        return;
      }

      try {
        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: cleanQuestion,
            image_base64: resolvedFrame,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        const replyText = data.response || 'The path ahead is clear.';
        if (backendError) {
          playConnectionRestoredEarcon();
        }
        setAnswer(replyText);
        setPhase('answered');

        if (data.speak !== false && !isMuted) {
          onSpeak(replyText);
        }
      } catch (err: any) {
        console.warn('Backend ask error:', err);
        playConnectionLostEarcon();
        setBackendError('Unable to reach Vision Copilot assistant. Check connection and retry.');
        setLastFailedQuestion(cleanQuestion);
        setPhase('answered');
      }
    },
    [backendError, isMuted, mockMode, onSpeak, resolvedFrame]
  );

  // Start speech recognition
  const startListening = useCallback(() => {
    setMicErrorMessage(null);
    setLiveTranscript('');

    if (!isSpeechRecognitionSupported()) {
      setMicErrorMessage('Voice recognition is not supported in this browser. You can type your question.');
      setPhase('answered');
      return;
    }

    if (!recognizerRef.current) {
      recognizerRef.current = new VoiceRecognizer();
    }

    setPhase('listening');
    playListeningStartedEarcon();

    const started = recognizerRef.current.start({
      onStart: () => {
        setLiveTranscript('');
        playListeningStartedEarcon();
      },
      onResult: (transcript, isFinal) => {
        setLiveTranscript(transcript);
        setQuestion(transcript);
        if (isFinal && transcript.trim().length > 2) {
          recognizerRef.current?.stop();
          sendQuestionToBackend(transcript.trim());
        }
      },
      onError: (errMsg) => {
        setMicErrorMessage(errMsg);
        // If error occurred (e.g. denied or no speech), fall back gracefully to answered phase
        setTimeout(() => {
          setPhase('answered');
        }, 1200);
      },
      onEnd: () => {
        // If user stopped talking and had captured something
        setLiveTranscript((prev) => {
          if (prev.trim().length > 2) {
            sendQuestionToBackend(prev.trim());
          }
          return prev;
        });
      },
    });

    if (!started) {
      setPhase('answered');
    }
  }, [sendQuestionToBackend]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    };
  }, []);

  // When overlay opens and mic was previously acknowledged, start listening automatically
  useEffect(() => {
    if (hasPromptedMic) {
      startListening();
    }
  }, [hasPromptedMic, startListening]);

  // User accepts the pre-prompt mic explanation
  const handleConfirmMicPermission = () => {
    try {
      localStorage.setItem('vision_copilot_mic_acknowledged', 'true');
    } catch {
      // ignore
    }
    setHasPromptedMic(true);
    startListening();
  };

  const handleSelectSuggested = (newQ: string) => {
    if (recognizerRef.current) {
      recognizerRef.current.abort();
    }
    sendQuestionToBackend(newQ);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const q = customInput.trim();
    setCustomInput('');
    sendQuestionToBackend(q);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-overlay-title"
      className="fixed inset-0 z-50 bg-[#000000]/75 flex flex-col justify-end p-4 sm:p-6 backdrop-blur-xs select-none"
    >
      <div className="w-full max-w-md mx-auto bg-[#ffffff] rounded-26 p-6 flex flex-col space-y-4 animate-in slide-in-from-bottom duration-200 border border-[#2f2f2f]">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-26 bg-[#00a9dd] flex items-center justify-center text-[#ffffff]">
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </div>
            <span id="ask-overlay-title" className="text-[18px] font-bold text-[#1a1a1a]">
              Ask Assistant
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close assistant overlay"
            className="w-9 h-9 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8e8e8] active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Captured Camera Frame Indicator */}
        {resolvedFrame && (
          <div className="bg-[#f5f5f5] border border-[#e2e2e2] rounded-26 p-2 flex items-center gap-3">
            <img
              src={resolvedFrame}
              alt="Current camera capture for question"
              className="w-12 h-12 object-cover rounded-xl border border-[#c4c7c7] flex-shrink-0"
            />
            <div className="flex flex-col text-[12px]">
              <span className="font-bold text-[#1a1a1a] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#00af3d]">check_circle</span>
                <span>Visual Context Attached</span>
              </span>
              <span className="text-[#444748]">
                {capturedFrame ? 'Single frame captured for this query' : 'Latest frame from active awareness'}
              </span>
            </div>
          </div>
        )}

        {/* Permission Explanation Step (Shown before native browser mic prompt) */}
        {phase === 'permission_prompt' && (
          <div className="py-4 flex flex-col space-y-4">
            <div className="w-12 h-12 rounded-26 bg-[#00a9dd]/15 text-[#00a9dd] flex items-center justify-center self-start">
              <span className="material-symbols-outlined text-[28px]">mic</span>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[20px] font-bold text-[#1a1a1a]">Microphone Access</h2>
              <p className="text-[14px] text-[#444748] leading-relaxed">
                Vision Copilot needs microphone access to listen to your voice questions — tap <strong>Allow</strong> on the next prompt.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmMicPermission}
                className="w-full h-12 rounded-26 bg-[#00a9dd] hover:bg-[#0094c4] text-[#ffffff] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">mic</span>
                <span>Allow & Speak</span>
              </button>
              <button
                type="button"
                onClick={() => setPhase('answered')}
                className="w-full h-11 rounded-26 bg-[#f5f5f5] hover:bg-[#e8e8e8] text-[#1a1a1a] font-semibold text-[15px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                Type Question Instead
              </button>
            </div>
          </div>
        )}

        {/* Listening State */}
        {phase === 'listening' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
            {/* Pulsing Voice Ripple */}
            <div className="relative flex items-center justify-center w-24 h-24">
              <span className="absolute w-24 h-24 rounded-full bg-[#00a9dd]/20 animate-ping"></span>
              <span className="absolute w-18 h-18 rounded-full bg-[#00a9dd]/30 animate-pulse"></span>
              <div className="w-14 h-14 rounded-full bg-[#00a9dd] text-[#ffffff] flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-[28px]">mic</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-[22px] font-bold text-[#1a1a1a]">Listening…</h2>
              <p className="text-[14px] text-[#444748]">
                {liveTranscript ? `"${liveTranscript}"` : 'Speak your question about your surroundings'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {liveTranscript && (
                <button
                  type="button"
                  onClick={() => {
                    recognizerRef.current?.stop();
                    sendQuestionToBackend(liveTranscript);
                  }}
                  className="px-4 py-2 bg-[#00a9dd] text-white rounded-26 font-bold text-[14px] active:scale-95 cursor-pointer"
                >
                  Ask Now
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  recognizerRef.current?.stop();
                  setPhase('answered');
                }}
                className="px-4 py-2 bg-[#f5f5f5] text-[#1a1a1a] rounded-26 font-semibold text-[14px] border border-[#c4c7c7] active:scale-95 cursor-pointer"
              >
                Cancel Voice
              </button>
            </div>
          </div>
        )}

        {/* Thinking / Backend Processing State */}
        {phase === 'thinking' && (
          <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-10 h-10 border-4 border-[#00a9dd]/20 border-t-[#00a9dd] rounded-full animate-spin"></div>
            <div className="space-y-1">
              <h3 className="text-[18px] font-bold text-[#1a1a1a]">Analyzing view…</h3>
              <p className="text-[13px] text-[#444748]">"{question}"</p>
            </div>
          </div>
        )}

        {/* Answered / Typing State */}
        {phase === 'answered' && (
          <div className="flex flex-col space-y-4">
            {/* Microphone Warning/Denial Banner (if mic failed) */}
            {micErrorMessage && (
              <div className="bg-[#ff5406]/10 border border-[#ff5406]/30 p-3 rounded-26 flex items-start gap-2 text-[13px] text-[#1a1a1a]">
                <span className="material-symbols-outlined text-[18px] text-[#ff5406] mt-0.5">
                  mic_off
                </span>
                <div className="flex-1">
                  <span className="font-bold">Voice input unavailable: </span>
                  <span>{micErrorMessage}</span>
                </div>
              </div>
            )}

            {/* Backend Offline / Retry Banner */}
            {backendError && (
              <div className="bg-[#fff4e5] border border-[#ffb74d] p-3 rounded-26 flex items-center justify-between text-[13px] text-[#1a1a1a]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#f57c00]">
                    cloud_off
                  </span>
                  <span>{backendError}</span>
                </div>
                {lastFailedQuestion && (
                  <button
                    onClick={() => sendQuestionToBackend(lastFailedQuestion)}
                    className="px-2.5 py-1 bg-[#ffffff] text-[#1a1a1a] font-bold rounded-full border border-[#c4c7c7] text-[12px] active:scale-95"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* Real Transcribed Question Bubble (if asked) */}
            {question && (
              <div className="self-end bg-[#2f2f2f] text-[#ffffff] px-4 py-3 rounded-26 max-w-[85%] text-[15px] font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#00a9dd]">account_circle</span>
                <span>"{question}"</span>
              </div>
            )}

            {/* Real Backend Answer Bubble (if answered) */}
            {answer && (
              <div className="self-start bg-[#f5f5f5] border border-[#e2e2e2] text-[#1a1a1a] p-4 rounded-26 w-full space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[#00a9dd] text-[13px] font-bold">
                    <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    <span>Copilot Guidance</span>
                  </div>
                  <button
                    onClick={() => onSpeak(answer)}
                    aria-label="Replay speech"
                    className="flex items-center gap-1 text-[13px] font-bold text-[#1a1a1a] bg-[#ffffff] px-2.5 py-1 rounded-26 border border-[#c4c7c7] active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">volume_up</span>
                    <span>Play</span>
                  </button>
                </div>

                <p className="text-[17px] font-bold text-[#2f2f2f] leading-snug">
                  "{answer}"
                </p>
              </div>
            )}

            {/* Suggested Queries */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[11px] font-bold text-[#747878] uppercase tracking-wider px-1">
                Suggested questions:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSelectSuggested("Are there stairs directly ahead?")}
                  className="text-[13px] font-semibold text-[#1a1a1a] bg-[#f5f5f5] hover:bg-[#e8e8e8] px-3 py-1.5 rounded-26 border border-[#e2e2e2] active:scale-95 cursor-pointer"
                >
                  "Are there stairs?"
                </button>
                <button
                  onClick={() => handleSelectSuggested("Is the floor flat?")}
                  className="text-[13px] font-semibold text-[#1a1a1a] bg-[#f5f5f5] hover:bg-[#e8e8e8] px-3 py-1.5 rounded-26 border border-[#e2e2e2] active:scale-95 cursor-pointer"
                >
                  "Is the floor flat?"
                </button>
                <button
                  onClick={() => handleSelectSuggested("Is there an obstacle near me?")}
                  className="text-[13px] font-semibold text-[#1a1a1a] bg-[#f5f5f5] hover:bg-[#e8e8e8] px-3 py-1.5 rounded-26 border border-[#e2e2e2] active:scale-95 cursor-pointer"
                >
                  "Any obstacles?"
                </button>
              </div>
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type a question..."
                className="flex-1 min-h-[46px] px-4 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] text-[15px] border border-[#e2e2e2] focus:border-[#00a9dd] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Send query"
                className="min-h-[46px] px-4 rounded-26 bg-[#1a1a1a] text-white flex items-center justify-center font-bold active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={startListening}
                className="flex-1 min-h-[50px] rounded-26 bg-[#00a9dd] text-[#ffffff] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">mic</span>
                <span>Ask by Voice</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[50px] px-5 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] font-bold text-[16px] border border-[#c4c7c7] active:scale-95 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
