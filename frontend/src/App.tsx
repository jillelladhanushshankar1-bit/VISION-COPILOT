/**
 * Vision Copilot - Interactive Assistive Spatial AI Prototype
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScreenState,
  AwarenessState,
  ActiveOverlay,
  VisionEvent,
  AppSettings,
  MemoryItem,
  CameraFacing,
  EventCategory,
} from './types';
import { INITIAL_MOCK_EVENTS } from './data/mockEvents';
import { INITIAL_MOCK_MEMORIES } from './data/mockMemories';
import { speakText, stopSpeaking } from './utils/speech';
import {
  playAwarenessStartedEarcon,
  playAwarenessStoppedEarcon,
  playConnectionLostEarcon,
  playConnectionRestoredEarcon,
  triggerHaptic,
} from './utils/earcons';
import {
  startCameraStream,
  stopCameraStream,
  captureVideoFrame,
  captureSingleFrame,
  checkIsSecureContext,
} from './utils/camera';
import {
  sendFrameForAnalysis,
  checkBackendHealth,
} from './utils/backendApi';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { SplashWelcomeScreen } from './components/SplashWelcomeScreen';
import { AuthScreen } from './components/AuthScreen';
import { HomeIdleView } from './components/HomeIdleView';
import { QuietActiveView } from './components/QuietActiveView';
import { EventActiveView } from './components/EventActiveView';
import { AskOverlay } from './components/AskOverlay';
import { OcrOverlay } from './components/OcrOverlay';
import { EventFeedDrawer } from './components/EventFeedDrawer';
import { MemoryListView } from './components/MemoryListView';
import { SettingsModal } from './components/SettingsModal';
import { ScreenSwitcherBar, ScreenStateKey, ViewportWidthOption } from './components/ScreenSwitcherBar';
import { CameraPermissionModal } from './components/CameraPermissionModal';

const DEFAULT_SETTINGS: AppSettings = {
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

export default function App() {
  // Navigation & Screen States
  const [screen, setScreen] = useState<ScreenState>(() => {
    try {
      return localStorage.getItem('vision_copilot_session') === 'active' ? 'app' : 'splash';
    } catch {
      return 'splash';
    }
  });
  const [isTransitioningSplashToAuth, setIsTransitioningSplashToAuth] = useState(false);
  const [awarenessState, setAwarenessState] = useState<AwarenessState>('idle');
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<ViewportWidthOption>('responsive');

  // Camera Facing: Always defaults to 'back' (rear camera) on launch and app restart
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('back');

  // Real MediaStream & Camera state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraModalMode, setCameraModalMode] = useState<'explain' | 'denied' | 'insecure' | null>(null);
  const [cameraModalContext, setCameraModalContext] = useState<'awareness' | 'ask' | 'ocr'>('awareness');
  const [cameraPermissionAcknowledged, setCameraPermissionAcknowledged] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vision_copilot_camera_acknowledged') === 'true';
    } catch {
      return false;
    }
  });

  // Backend observation state
  const [isSendingFrame, setIsSendingFrame] = useState(false);
  const [lastObservationStatus, setLastObservationStatus] = useState('Clear Path');
  const [awarenessError, setAwarenessError] = useState<string | null>(null);
  const [showHazardOverrideToast, setShowHazardOverrideToast] = useState(false);
  const mockCycleIndexRef = useRef(0);
  const lastSpokenResponseRef = useRef<string>('');

  // Exact 3 mock responses specified in test group 3
  const MOCK_CYCLE_RESPONSES = [
    {
      response: 'There are stairs directly ahead.',
      priority: 'high' as const,
      event_type: 'hazard' as const,
      speak: true,
      distance: '5ft ahead',
      label: 'Stairs · 5ft',
      direction: 'ahead',
      image: '/src/assets/images/stairs_ahead_view_1790251109611.jpg',
    },
    {
      response: 'A person is moving across your path from the right.',
      priority: 'high' as const,
      event_type: 'motion' as const,
      speak: true,
      distance: '8ft right',
      label: 'Person · 8ft',
      direction: 'right',
      image: '/src/assets/images/person_crossing_path_1790251132821.jpg',
    },
    {
      response: 'The robotics workshop is Friday at 5 PM in Block C.',
      priority: 'normal' as const,
      event_type: 'ocr' as const,
      speak: true,
      distance: '6ft ahead',
      label: 'Notice · 6ft',
      direction: 'ahead',
      image: '/src/assets/images/robotics_workshop_flyer_1790251142738.jpg',
    },
  ];

  // Frame captured for Ask AI and Read Text (OCR)
  const [askFrame, setAskFrame] = useState<string | null>(null);
  const [ocrFrame, setOcrFrame] = useState<string | null>(null);
  const lastCapturedFrameRef = useRef<string | null>(null);

  // Hidden persistent video element for reliable frame capture from active stream
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Sync hidden video element with active stream
  useEffect(() => {
    const video = hiddenVideoRef.current;
    if (video) {
      if (cameraStream) {
        video.srcObject = cameraStream;
        video.play().catch(() => {});
      } else {
        video.srcObject = null;
      }
    }
  }, [cameraStream]);

  // Handle Camera Flip (toggle front/back)
  const handleToggleCameraFacing = useCallback(async () => {
    const nextFacing: CameraFacing = cameraFacing === 'back' ? 'front' : 'back';
    setCameraFacing(nextFacing);

    // If camera stream is currently running, re-request with new facing constraint
    if (cameraStream) {
      stopCameraStream(cameraStream);
      try {
        const newStream = await startCameraStream(nextFacing);
        setCameraStream(newStream);
      } catch (err) {
        console.warn('Failed to switch camera stream facing constraint:', err);
      }
    }
  }, [cameraFacing, cameraStream]);

  // Audio / Mute state
  const [isMuted, setIsMuted] = useState(false);

  // Settings state (persisted in localStorage)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('vision_copilot_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Events history (accumulated most recent first)
  const [eventHistory, setEventHistory] = useState<VisionEvent[]>(() => INITIAL_MOCK_EVENTS);
  const [currentEvent, setCurrentEvent] = useState<VisionEvent | null>(() => INITIAL_MOCK_EVENTS[0]);

  // Personal Memories List state (persisted in localStorage)
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('vision_copilot_memories');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, createdAt: new Date(m.createdAt) }));
      }
    } catch {
      // fallback
    }
    return INITIAL_MOCK_MEMORIES;
  });

  // Event cycling index
  const nextEventIndexRef = useRef(0);
  const [secondsUntilNextEvent, setSecondsUntilNextEvent] = useState(4);
  const observationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings helper
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('vision_copilot_settings', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  // Save memories helper
  const saveMemories = (newMemories: MemoryItem[]) => {
    setMemories(newMemories);
    try {
      localStorage.setItem('vision_copilot_memories', JSON.stringify(newMemories));
    } catch {
      // ignore
    }
  };

  const handleToggleMemoryActive = (id: string) => {
    saveMemories(
      memories.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const handleAddMemory = (newMem: Omit<MemoryItem, 'id' | 'createdAt'>) => {
    const item: MemoryItem = {
      ...newMem,
      id: `mem-${Date.now()}`,
      createdAt: new Date(),
    };
    saveMemories([item, ...memories]);
  };

  const handleDeleteMemory = (id: string) => {
    saveMemories(memories.filter((m) => m.id !== id));
  };

  // Toggle Mute Audio
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopSpeaking();
      }
      return next;
    });
  };

  // Trigger speech helper
  const handleSpeak = useCallback(
    (text: string, isHazardOverride: boolean = false) => {
      speakText(text, isMuted, settings.speechRate, isHazardOverride);
    },
    [isMuted, settings.speechRate]
  );

  // Trigger a specific mock event
  const triggerMockEvent = useCallback(
    (templateIndex?: number) => {
      const idx =
        templateIndex !== undefined ? templateIndex : nextEventIndexRef.current % INITIAL_MOCK_EVENTS.length;
      nextEventIndexRef.current = (idx + 1) % INITIAL_MOCK_EVENTS.length;

      const template = INITIAL_MOCK_EVENTS[idx];
      const newEvent: VisionEvent = {
        ...template,
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date(),
      };

      setCurrentEvent(newEvent);
      setAwarenessState('event_active');

      // Accumulate into feed, most recent first
      setEventHistory((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);

      const isHazard =
        newEvent.priority === 'high' ||
        newEvent.type === 'Hazard' ||
        newEvent.eventType === 'hazard';

      if (isHazard) {
        triggerHaptic('hazard');
        if (isMuted) {
          setShowHazardOverrideToast(true);
          setTimeout(() => setShowHazardOverrideToast(false), 3500);
        }
        handleSpeak(newEvent.message, true); // Overrides mute!
      } else {
        triggerHaptic('routine');
        if (!isMuted && settings.autoAnnounce) {
          handleSpeak(newEvent.message, false);
        }
      }
    },
    [handleSpeak, isMuted, settings.autoAnnounce]
  );

  // Helper to extract current frame base64 from active stream
  const getCurrentFrameBase64 = useCallback((): string | null => {
    if (hiddenVideoRef.current && cameraStream) {
      return captureVideoFrame(hiddenVideoRef.current);
    }
    return lastCapturedFrameRef.current;
  }, [cameraStream]);

  // Real Backend Frame Capture & Observation for active Awareness loop
  const captureAndObserve = useCallback(async () => {
    const frame = getCurrentFrameBase64();
    if (frame) {
      lastCapturedFrameRef.current = frame;
    }

    // In Mock Mode, stop real network calls completely and cycle through the three exact mock responses
    if (settings.mockMode) {
      setIsSendingFrame(true);
      const mockItem = MOCK_CYCLE_RESPONSES[mockCycleIndexRef.current % MOCK_CYCLE_RESPONSES.length];
      mockCycleIndexRef.current = (mockCycleIndexRef.current + 1) % MOCK_CYCLE_RESPONSES.length;

      setTimeout(() => {
        setLastObservationStatus(mockItem.label);
        setAwarenessError(null);
        setIsSendingFrame(false);

        if (mockItem.speak) {
          const newEvent: VisionEvent = {
            id: `evt-mock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: mockItem.event_type === 'hazard' ? 'Hazard' : mockItem.event_type === 'motion' ? 'Motion' : 'General',
            eventType: mockItem.event_type,
            priority: mockItem.priority,
            message: mockItem.response,
            confidence: 'High confidence',
            distance: mockItem.distance,
            label: mockItem.label,
            direction: mockItem.direction,
            image: mockItem.image,
            imageAlt: mockItem.response,
            reticle: {
              width: '50%',
              height: '35%',
              label: mockItem.label,
              color: mockItem.event_type === 'hazard' ? '#ff5406' : mockItem.event_type === 'motion' ? '#00a9dd' : '#00af3d',
            },
            timestamp: new Date(),
          };

          setCurrentEvent(newEvent);
          setAwarenessState('event_active');
          setEventHistory((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);

          const isHazard =
            newEvent.priority === 'high' ||
            newEvent.type === 'Hazard' ||
            newEvent.eventType === 'hazard';

          if (isHazard) {
            triggerHaptic('hazard');
            if (isMuted) {
              setShowHazardOverrideToast(true);
              setTimeout(() => setShowHazardOverrideToast(false), 3500);
            }
            handleSpeak(mockItem.response, true); // Overrides mute!
          } else {
            triggerHaptic('routine');
            if (!isMuted && settings.autoAnnounce) {
              handleSpeak(mockItem.response, false);
            }
          }
        }
      }, 300);
      return;
    }

    // Use live frame if available, or generate a minimal valid jpeg placeholder
    const payloadImage = frame || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    setIsSendingFrame(true);

    try {
      const result = await sendFrameForAnalysis(payloadImage);
      if (!result.ok) {
        throw new Error(result.error);
      }

      const data = result.data;
      if (awarenessError) {
        playConnectionRestoredEarcon();
      }
      setAwarenessError(null);
      setLastObservationStatus(data.event_type || 'Clear Path');

      // SELECTIVE COMMUNICATION:
      // Only surface an event card and audio speech if data.speak === true!
      // If path is clear (speak: false), UI remains in quiet state with no interruptions.
      if (data.speak === true) {
        const newEvent: VisionEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: data.priority === 'high' ? 'Hazard' : data.priority === 'medium' ? 'Motion' : 'General',
          eventType:
            data.event_type?.toLowerCase() === 'hazard'
              ? 'hazard'
              : data.event_type?.toLowerCase() === 'motion'
              ? 'motion'
              : 'general',
          message: data.response,
          confidence: 'High confidence',
          distance: 'Nearby',
          label: data.event_type || 'Observation',
          image: frame && frame.length > 500
            ? frame
            : (cameraFacing === 'back'
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuALFIk5uJqQOPihmOs0cXQ7zD7egILajN5HSm5-_DrJi5B5fRhJ6AW34iW6edR9KKvnrcXrkDaCa2d4dE3g4G82JIl0MgUTHCJjgAK0SNGVT81TW0g4Pc-soM_wDMjSrthkOa7qtRNFBQLeXucCLfAuoyOb-vfC6R4oxvozYJVCZ2-da3HReGzc-2_8rYbyDa3r24fEOV7pAan1UUiaEzi-ATfUg-3bQin7meNGmi-Kd6GT6SY3UDrk'
                : '/src/assets/images/remembered_sister_portrait_1790251837150.jpg'),
          imageAlt: data.response,
          reticle: {
            width: '50%',
            height: '35%',
            label: data.event_type || 'Caution',
            color: data.priority === 'high' ? '#ff5406' : '#00a9dd',
          },
          timestamp: new Date(),
        };

        setCurrentEvent(newEvent);
        setAwarenessState('event_active');
        setEventHistory((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);

        const isHazard =
          newEvent.priority === 'high' ||
          newEvent.type === 'Hazard' ||
          newEvent.eventType === 'hazard';

        // Client-side duplicate cooldown: skip speech for identical back-to-back responses
        const isDuplicate = data.response === lastSpokenResponseRef.current;

        if (isHazard) {
          triggerHaptic('hazard');
          if (!isDuplicate) {
            lastSpokenResponseRef.current = data.response;
            if (isMuted) {
              setShowHazardOverrideToast(true);
              setTimeout(() => setShowHazardOverrideToast(false), 3500);
            }
            handleSpeak(data.response, true); // Overrides mute!
          }
        } else {
          triggerHaptic('routine');
          if (!isDuplicate && !isMuted && settings.autoAnnounce) {
            lastSpokenResponseRef.current = data.response;
            handleSpeak(data.response, false);
          }
        }
      }
    } catch (err: any) {
      console.warn('Observe API error:', err);
      playConnectionLostEarcon();
      setAwarenessError(err.message || 'Backend not connected');
      handleSpeak('Backend not connected', false);
    } finally {
      setIsSendingFrame(false);
    }
  }, [awarenessError, cameraFacing, getCurrentFrameBase64, handleSpeak, isMuted, settings.autoAnnounce, settings.mockMode]);

  // Clear timers helper
  const clearObservationTimers = useCallback(() => {
    if (observationIntervalRef.current) {
      clearInterval(observationIntervalRef.current);
      observationIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Check backend connectivity on app load
  useEffect(() => {
    if (screen !== 'app') return;
    checkBackendHealth().then((result) => {
      if (!result.ok) {
        setAwarenessError(result.error);
      } else {
        setAwarenessError(null);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Periodic capture interval while awareness is quiet (every 3.5 seconds)
  useEffect(() => {
    // Suspend polling if OCR overlay is active so it doesn't talk over the guidance
    if (awarenessState === 'quiet' && activeOverlay !== 'ocr') {
      clearObservationTimers();
      setSecondsUntilNextEvent(4);

      countdownIntervalRef.current = setInterval(() => {
        setSecondsUntilNextEvent((prev) => (prev > 1 ? prev - 1 : 4));
      }, 1000);

      observationIntervalRef.current = setInterval(() => {
        captureAndObserve();
      }, 3500);
    } else {
      clearObservationTimers();
    }

    return () => clearObservationTimers();
  }, [awarenessState, activeOverlay, captureAndObserve, clearObservationTimers]);

  // Execute continuous camera request for Start Awareness
  const executeStartCamera = async () => {
    setCameraModalMode(null);

    if (!checkIsSecureContext()) {
      setCameraModalMode('insecure');
      return;
    }

    try {
      const stream = await startCameraStream(cameraFacing);
      setCameraStream(stream);
      setAwarenessState('quiet');
      playAwarenessStartedEarcon();
      try {
        localStorage.setItem('vision_copilot_camera_acknowledged', 'true');
        setCameraPermissionAcknowledged(true);
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.warn('Camera request error:', err);
      if (err?.type === 'NotAllowedError') {
        setCameraModalMode('denied');
      } else {
        // Fallback into quiet mode if no hardware is present
        setAwarenessState('quiet');
      }
    }
  };

  // Standalone single-frame capture for Ask AI when Awareness is NOT active
  const executeSingleFrameAsk = async () => {
    setCameraModalMode(null);

    if (!checkIsSecureContext()) {
      setCameraModalMode('insecure');
      return;
    }

    try {
      const frame = await captureSingleFrame(cameraFacing);
      setAskFrame(frame);
      lastCapturedFrameRef.current = frame;
      try {
        localStorage.setItem('vision_copilot_camera_acknowledged', 'true');
        setCameraPermissionAcknowledged(true);
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.warn('Single-frame camera capture error for Ask AI:', err);
      if (err?.type === 'NotAllowedError') {
        setCameraModalMode('denied');
        return;
      }
      setAskFrame(null);
    }

    // Open Ask AI overlay while remaining in current state (idle or as-is)
    // No continuous interval loop is ever started
    setActiveOverlay('ask');
  };

  // Start live camera stream for Read Text (OCR) aiming view (no instant capture)
  const executeStartOcrSession = async () => {
    setCameraModalMode(null);
    setOcrFrame(null); // Clear any old frame so it opens in live aiming view

    if (!checkIsSecureContext()) {
      setActiveOverlay('ocr');
      return;
    }

    try {
      if (!cameraStream) {
        const stream = await startCameraStream(cameraFacing);
        setCameraStream(stream);
      }
      try {
        localStorage.setItem('vision_copilot_camera_acknowledged', 'true');
        setCameraPermissionAcknowledged(true);
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.warn('Camera stream request for OCR aiming error:', err);
      // Gracefully continue so user can use simulated camera aiming mode
    }

    setActiveOverlay('ocr');
  };

  // Open Ask AI handler (tappable at any time from Home Idle, Awareness, etc.)
  const handleOpenAsk = () => {
    // If Awareness is already running mid-session:
    if (awarenessState === 'quiet' || awarenessState === 'event_active') {
      let frame = lastCapturedFrameRef.current;
      if (!frame && hiddenVideoRef.current && cameraStream) {
        frame = captureVideoFrame(hiddenVideoRef.current);
        lastCapturedFrameRef.current = frame;
      }
      setAskFrame(frame);
      setActiveOverlay('ask');
      return;
    }

    // If Awareness is NOT running (e.g. from Home Idle):
    setCameraModalContext('ask');
    if (!cameraPermissionAcknowledged) {
      setCameraModalMode('explain');
    } else {
      executeSingleFrameAsk();
    }
  };

  // Open Read Text (OCR) handler - Opens live audio-guided aiming view
  const handleOpenOcr = () => {
    // Cancel any in-progress Awareness speech immediately so OCR guidance can start
    stopSpeaking();
    
    // Clear any previous captured frame so aiming mode opens live
    setOcrFrame(null);

    // If Awareness is already running mid-session, cameraStream is already active
    if (awarenessState === 'quiet' || awarenessState === 'event_active') {
      setActiveOverlay('ocr');
      return;
    }

    // If Awareness is NOT running (e.g. from Home Idle):
    setCameraModalContext('ocr');
    if (!cameraPermissionAcknowledged) {
      setCameraModalMode('explain');
    } else {
      executeStartOcrSession();
    }
  };

  // Ask About It clicked from inside OCR result screen
  const handleAskAboutText = (_detectedText: string, frame: string | null) => {
    // Reuse the already-captured OCR frame without re-capturing camera
    setAskFrame(frame || ocrFrame || lastCapturedFrameRef.current);
    setActiveOverlay('ask');
  };

  // Start Awareness button clicked:
  // ONLY requests continuous camera when tapped, and shows pre-prompt explanation before native browser dialog
  const handleStartAwareness = () => {
    setCameraModalContext('awareness');
    if (!cameraPermissionAcknowledged) {
      setCameraModalMode('explain');
    } else {
      executeStartCamera();
    }
  };

  // Return from Event Active to Quiet State
  const handleReturnToQuiet = () => {
    stopSpeaking();
    setAwarenessState('quiet');
  };

  // Stop Awareness completely:
  // Releases camera stream (track.stop(), turning off camera light) and clears interval
  const handleStopAwareness = () => {
    stopSpeaking();
    clearObservationTimers();
    if (cameraStream) {
      stopCameraStream(cameraStream);
      setCameraStream(null);
    }
    setAwarenessState('idle');
    playAwarenessStoppedEarcon();
  };

  // HARDWARE BUTTON ACTIVATION (Volume Button Long-Press ~1s):
  // Long-press Volume Up (~1s) toggles Awareness (start if idle, stop if active).
  // Long-press Volume Down (~1s) triggers Ask AI (opens overlay and begins listening immediately).
  // Normal short volume presses (<1s) do NOT trigger app action, preserving normal OS volume adjustment.
  useEffect(() => {
    let volumeTimer: NodeJS.Timeout | null = null;
    let longPressTriggered = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore OS auto-repeat

      const isVolUp =
        e.key === 'AudioVolumeUp' ||
        e.key === 'VolumeUp' ||
        e.code === 'AudioVolumeUp' ||
        e.key === 'PageUp';

      const isVolDown =
        e.key === 'AudioVolumeDown' ||
        e.key === 'VolumeDown' ||
        e.code === 'AudioVolumeDown' ||
        e.key === 'PageDown';

      if (!isVolUp && !isVolDown) return;

      longPressTriggered = false;
      if (volumeTimer) clearTimeout(volumeTimer);

      volumeTimer = setTimeout(() => {
        longPressTriggered = true;
        if (isVolUp) {
          if (awarenessState === 'idle') {
            handleStartAwareness();
          } else {
            handleStopAwareness();
          }
        } else if (isVolDown) {
          handleOpenAsk();
        }
      }, 1000);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isVolUp =
        e.key === 'AudioVolumeUp' ||
        e.key === 'VolumeUp' ||
        e.code === 'AudioVolumeUp' ||
        e.key === 'PageUp';

      const isVolDown =
        e.key === 'AudioVolumeDown' ||
        e.key === 'VolumeDown' ||
        e.code === 'AudioVolumeDown' ||
        e.key === 'PageDown';

      if (!isVolUp && !isVolDown) return;

      if (volumeTimer) {
        clearTimeout(volumeTimer);
        volumeTimer = null;
      }
      longPressTriggered = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (volumeTimer) clearTimeout(volumeTimer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [awarenessState, handleOpenAsk, handleStartAwareness, handleStopAwareness]);

  // Handle smooth transition from Splash to Sign In screen
  const handleGetStartedFromSplash = useCallback(() => {
    setIsTransitioningSplashToAuth(true);
    setTimeout(() => {
      setScreen('auth');
      setIsTransitioningSplashToAuth(false);
    }, 350);
  }, []);

  // Compute active screen key for the Screen Showcase Navigator
  const computeCurrentScreenKey = (): ScreenStateKey => {
    if (screen === 'splash') return 'splash';
    if (screen === 'auth') return 'auth';
    if (showOnboarding) return 'onboarding';
    if (activeOverlay === 'settings') return 'settings';
    if (activeOverlay === 'feed') return 'feed';
    if (activeOverlay === 'memory') return 'memory';
    if (activeOverlay === 'ocr') return 'ocr';
    if (activeOverlay === 'ask') return 'ask';
    if (awarenessState === 'event_active') return 'event_active';
    if (awarenessState === 'quiet') return 'quiet';
    return 'idle';
  };

  // Direct selection of any screen for Showcase Navigator
  const handleSelectScreen = (key: ScreenStateKey) => {
    stopSpeaking();
    clearObservationTimers();

    switch (key) {
      case 'splash':
        setScreen('splash');
        setShowOnboarding(false);
        setActiveOverlay(null);
        break;
      case 'auth':
        setScreen('auth');
        setShowOnboarding(false);
        setActiveOverlay(null);
        break;
      case 'onboarding':
        setScreen('app');
        setShowOnboarding(true);
        setActiveOverlay(null);
        break;
      case 'idle':
        setScreen('app');
        setShowOnboarding(false);
        setActiveOverlay(null);
        handleStopAwareness();
        break;
      case 'quiet':
        setScreen('app');
        setShowOnboarding(false);
        setActiveOverlay(null);
        setAwarenessState('quiet');
        break;
      case 'event_active':
        setScreen('app');
        setShowOnboarding(false);
        setActiveOverlay(null);
        if (!currentEvent) {
          setCurrentEvent(INITIAL_MOCK_EVENTS[0]);
        }
        setAwarenessState('event_active');
        break;
      case 'ask':
        setScreen('app');
        setShowOnboarding(false);
        handleOpenAsk();
        break;
      case 'ocr':
        setScreen('app');
        setShowOnboarding(false);
        handleOpenOcr();
        break;
      case 'feed':
        setScreen('app');
        setShowOnboarding(false);
        setActiveOverlay('feed');
        break;
      case 'memory':
        setScreen('app');
        setShowOnboarding(false);
        setActiveOverlay('memory');
        break;
      case 'settings':
        setScreen('app');
        setShowOnboarding(false);
        setActiveOverlay('settings');
        break;
    }
  };

  const currentScreenKey = computeCurrentScreenKey();

  return (
    <div className="w-full min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-start select-none font-['DM Sans']">
      {/* Hidden persistent video element for reliable frame capture from stream */}
      <video
        ref={hiddenVideoRef}
        autoPlay
        playsInline
        muted
        className="hidden pointer-events-none"
        aria-hidden="true"
      />

      {/* Camera Permission Pre-Prompt / Denied Modal */}
      {cameraModalMode && (
        <CameraPermissionModal
          mode={cameraModalMode}
          context={cameraModalContext}
          onConfirm={() => {
            if (cameraModalContext === 'ocr') {
              executeStartOcrSession();
            } else if (cameraModalContext === 'ask') {
              executeSingleFrameAsk();
            } else {
              executeStartCamera();
            }
          }}
          onCancel={() => setCameraModalMode(null)}
          onRetry={() => {
            if (cameraModalContext === 'ocr') {
              executeStartOcrSession();
            } else if (cameraModalContext === 'ask') {
              executeSingleFrameAsk();
            } else {
              executeStartCamera();
            }
          }}
        />
      )}

      {/* SCREEN SHOWCASE NAVIGATOR */}
      <ScreenSwitcherBar
        currentScreenKey={currentScreenKey}
        onSelectScreen={handleSelectScreen}
        viewportWidth={viewportWidth}
        onSelectViewportWidth={setViewportWidth}
      />

      {/* Phone Screen Canvas Shell (Paper White Canvas) */}
      <div
        style={
          viewportWidth !== 'responsive'
            ? { width: `${viewportWidth}px`, maxWidth: `${viewportWidth}px` }
            : undefined
        }
        className="w-full max-w-md min-h-screen bg-[#ffffff] flex flex-col justify-between relative pb-[88px] overflow-x-hidden border-x border-[#e2e2e2]"
      >
        {/* Top Header */}
        <Header
          onOpenSettings={() => setActiveOverlay('settings')}
          onOpenFeed={() => setActiveOverlay('feed')}
          onOpenMemory={() => setActiveOverlay('memory')}
          feedCount={eventHistory.length}
          memoryCount={memories.length}
        />

        {/* Hazard Override Toast (appears only when audio is muted but a critical hazard overrides) */}
        {showHazardOverrideToast && (
          <div
            role="status"
            aria-live="assertive"
            className="mx-4 mt-2 p-3 bg-[#ba1a1a] text-[#ffffff] rounded-26 text-[13px] font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">volume_up</span>
              <span>Hazard override — audio unmuted for this alert</span>
            </div>
            <button
              onClick={() => setShowHazardOverrideToast(false)}
              className="text-white hover:opacity-80 p-0.5"
              aria-label="Dismiss toast"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Dynamic Main Body Content */}
        <main className="flex-1 flex flex-col justify-start">
          {awarenessState === 'idle' && (
            <HomeIdleView
              onStartAwareness={handleStartAwareness}
              onReadTextClick={handleOpenOcr}
              onAskClick={handleOpenAsk}
              cameraFacing={cameraFacing}
              onToggleCameraFacing={handleToggleCameraFacing}
              cameraStream={cameraStream}
            />
          )}

          {awarenessState === 'quiet' && (
            <QuietActiveView
              onStopAwareness={handleStopAwareness}
              onReadTextClick={handleOpenOcr}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onOpenFeed={() => setActiveOverlay('feed')}
              recentEvents={eventHistory}
              onTriggerNextMockEvent={() => triggerMockEvent()}
              secondsUntilNextEvent={secondsUntilNextEvent}
              cameraFacing={cameraFacing}
              onToggleCameraFacing={handleToggleCameraFacing}
              cameraStream={cameraStream}
              isSendingFrame={isSendingFrame}
              lastObservationStatus={lastObservationStatus}
              awarenessError={awarenessError}
              onRetryAwareness={() => captureAndObserve()}
            />
          )}

          {awarenessState === 'event_active' && currentEvent && (
            <EventActiveView
              event={currentEvent}
              isMuted={isMuted}
              onReplayAudio={() => handleSpeak(currentEvent.message)}
              onAskDetails={handleOpenAsk}
              onReturnToQuiet={handleReturnToQuiet}
              durationSeconds={7}
              cameraFacing={cameraFacing}
              onToggleCameraFacing={handleToggleCameraFacing}
              cameraStream={cameraStream}
            />
          )}
        </main>

        {/* Global Bottom Navigation Bar */}
        <BottomNav
          onAskClick={handleOpenAsk}
          onReadTextClick={handleOpenOcr}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          activeItem={activeOverlay === 'ask' ? 'ask' : activeOverlay === 'ocr' ? 'ocr' : null}
        />
      </div>

      {/* OVERLAY 1: Ask Voice Assistant Overlay */}
      {activeOverlay === 'ask' && (
        <AskOverlay
          onClose={() => {
            setActiveOverlay(null);
            setAskFrame(null);
          }}
          currentEvent={currentEvent}
          isMuted={isMuted}
          onSpeak={handleSpeak}
          capturedFrame={askFrame}
          getCurrentFrameBase64={() => lastCapturedFrameRef.current}
          mockMode={settings.mockMode}
        />
      )}

      {/* OVERLAY 2: Read Text (OCR) Overlay */}
      {activeOverlay === 'ocr' && (
        <OcrOverlay
          onClose={() => {
            setActiveOverlay(null);
            setOcrFrame(null);
            if (awarenessState === 'idle' && cameraStream) {
              stopCameraStream(cameraStream);
              setCameraStream(null);
            }
          }}
          isMuted={isMuted}
          onSpeak={handleSpeak}
          onAskAboutText={handleAskAboutText}
          capturedFrame={ocrFrame}
          cameraStream={cameraStream}
          mockMode={settings.mockMode}
        />
      )}

      {/* OVERLAY 3: Recent Observations Feed Screen */}
      {activeOverlay === 'feed' && (
        <EventFeedDrawer
          events={eventHistory}
          onClose={() => setActiveOverlay(null)}
          onReplayAudio={(evt) => handleSpeak(evt.message)}
          onTriggerEvent={(templateIdx) => {
            setAwarenessState('event_active');
            triggerMockEvent(templateIdx);
          }}
          onClearFeed={() => setEventHistory([])}
        />
      )}

      {/* OVERLAY 4: Personal Memories List Screen (Plum #bd4be5) */}
      {activeOverlay === 'memory' && (
        <MemoryListView
          memories={memories}
          onClose={() => setActiveOverlay(null)}
          onToggleActive={handleToggleMemoryActive}
          onAddMemory={handleAddMemory}
          onSpeak={handleSpeak}
          onDeleteMemory={handleDeleteMemory}
        />
      )}

      {/* OVERLAY 5: Settings Screen */}
      {activeOverlay === 'settings' && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setActiveOverlay(null)}
          onSignOut={() => {
            try {
              localStorage.removeItem('vision_copilot_session');
            } catch {}
            setActiveOverlay(null);
            setScreen('splash');
          }}
        />
      )}

      {/* OVERLAY 0: Splash / Welcome Hero Screen */}
      {(screen === 'splash' || isTransitioningSplashToAuth) && (
        <div
          className={`fixed inset-0 z-50 bg-[#ffffff] overflow-y-auto overflow-x-hidden transition-opacity duration-350 ease-in-out ${
            isTransitioningSplashToAuth ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <SplashWelcomeScreen
            onGetStarted={handleGetStartedFromSplash}
            isExiting={isTransitioningSplashToAuth}
          />
        </div>
      )}

      {/* OVERLAY 6: Auth Screen */}
      {screen === 'auth' && (
        <div className="fixed inset-0 z-50 bg-[#ffffff] overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <AuthScreen
            onSuccess={(userEmail, isNewUser) => {
              handleSaveSettings({ ...settings, userEmail });
              try {
                localStorage.setItem('vision_copilot_session', 'active');
              } catch {}
              if (isNewUser) {
                setShowOnboarding(true);
              }
              setScreen('app');
            }}
            onOpenOnboarding={() => setShowOnboarding(true)}
          />
        </div>
      )}

      {/* OVERLAY 7: Onboarding Walkthrough */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
