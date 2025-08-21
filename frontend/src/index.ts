export { createInnovaTracker, createDevelopmentTracker } from './tracker/factory';
export { InnovaTracker } from './tracker/InnovaTracker';
export { ActivityMonitor } from './tracker/ActivityMonitor';
export { DataService } from './tracker/DataService';
export { ScrollTracker } from './tracker/ScrollTracker';
export { SessionManager } from './tracker/SessionManager';

// Config
export { DEFAULT_CONFIG } from './config/defaults';

// Types
export type { TrackerConfig, TrackingEvent, SessionData } from './types';

// Utils
export { generateUUID as generateVisitorId } from './utils/uuid';
export { getDeviceInfo } from './utils/deviceInfo';
export { generateFingerprint } from './utils/fingerprint';
