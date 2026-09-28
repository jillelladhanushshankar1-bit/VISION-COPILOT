export type EventCategory = 'Hazard' | 'Motion' | 'General';

export interface VisionEvent {
  id: string;
  type: EventCategory;
  message: string;
  confidence: 'High confidence' | 'Low confidence';
  distance: string;
  label: string;
  image: string;
  imageAlt: string;
  reticle: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    width: string;
    height: string;
    label: string;
    color: string;
  };
  timestamp: Date;
  timeAgo?: string;
  details?: string;
  direction?: 'right' | 'left' | 'ahead' | 'center' | string;
  priority?: 'high' | 'normal' | 'low';
  eventType?: 'hazard' | 'motion' | 'ocr' | 'general';
}

export interface AppSettings {
  speechRate: number;
  voice: 'Nova (Warm)' | 'Atlas (Crisp)' | 'Echo (Clear)';
  verbosity: 'Concise' | 'Detailed';
  hazardSensitivity: 'High' | 'Medium' | 'Low';
  warningDistance: '3 ft' | '6 ft' | '10 ft';
  autoAnnounce: boolean;
  hapticFeedback: boolean;
  highContrastReticles: boolean;
  soundCues: boolean;
  userName: string;
  userEmail: string;
  emergencyContact: string;
  mockMode: boolean;
  ollamaUrl: string;
  geminiApiKey: string;
}

export type ScreenState = 'splash' | 'onboarding' | 'auth' | 'app';
export type AwarenessState = 'idle' | 'quiet' | 'event_active';
export type ActiveOverlay = null | 'ask' | 'ocr' | 'settings' | 'feed' | 'memory';
export type CameraFacing = 'back' | 'front';

export type MemoryCategory = 'Person' | 'Object' | 'Place';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  name: string;
  relationshipOrTag: string;
  description: string;
  image: string;
  lastSeen?: string;
  notificationSpoken: string;
  createdAt: Date;
  active: boolean;
}
