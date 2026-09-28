/**
 * Web Speech Recognition Helper
 * Supports standard SpeechRecognition and webkitSpeechRecognition fallback.
 */

// Declare window speech recognition types for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class VoiceRecognizer {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindow;
      const RecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (RecognitionClass) {
        this.recognition = new RecognitionClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  public start(handlers: SpeechRecognitionHandlers): boolean {
    if (!this.recognition) {
      if (handlers.onError) {
        handlers.onError('Speech recognition is not supported in this browser. You can type your question.');
      }
      return false;
    }

    if (this.isListening) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      handlers.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      const text = (finalTranscript || interimTranscript).trim();
      if (text && handlers.onResult) {
        handlers.onResult(text, Boolean(finalTranscript));
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      const error = event.error;
      let userFriendlyMessage = 'Could not capture voice input.';
      if (error === 'not-allowed' || error === 'permission-denied') {
        userFriendlyMessage = 'Microphone permission was denied. You can continue typing your question below.';
      } else if (error === 'no-speech') {
        userFriendlyMessage = 'No speech detected. Please try speaking again.';
      } else if (error === 'network') {
        userFriendlyMessage = 'Speech recognition network connection interrupted.';
      }
      handlers.onError?.(userFriendlyMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      handlers.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      handlers.onError?.(err?.message || 'Failed to start speech recognition.');
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }

  public abort(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }
}
