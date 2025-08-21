/**
 * 🔧 UTILIDADES CONSOLIDADAS - TRACKING CRM FRAMEWORK v2.0
 * Funciones auxiliares para identificación, device info, UTM params y más
 */

export { generateUUID } from './uuid';
export { generateFingerprint } from './fingerprint';
export { getDeviceInfo } from './deviceInfo';
export { getUTMParams } from './utmParams';
export { getEventPriority, isCriticalEvent } from '../config/criticalEvents';

// Re-exportar todo para facilidad de uso
export * from './uuid';
export * from './fingerprint';
export * from './deviceInfo';
export * from './utmParams';
