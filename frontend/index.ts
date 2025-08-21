/**
 * 🚀 TRACKING CRM FRAMEWORK - FRONTEND CONSOLIDADO
 * Versión unificada que combina la robustez del backend original 
 * con las mejoras avanzadas del sistema Innova Tracking
 */

import { createInnovaTracker } from './src/tracker/factory';
import { TrackerConfig } from './src/types';

export { InnovaTracker } from './src/tracker/InnovaTracker';
export { createInnovaTracker } from './src/tracker/factory';

// Exportar módulos individuales para uso avanzado
export { SessionManager } from './src/tracker/SessionManager';
export { DataService } from './src/tracker/DataService';
export { ActivityMonitor } from './src/tracker/ActivityMonitor';
export { ScrollTracker } from './src/tracker/ScrollTracker';

// Exportar tipos y configuraciones
export * from './src/types';
export { DEFAULT_CONFIG } from './src/config/defaults';
export { CRITICAL_EVENTS_CONFIG } from './src/config/criticalEvents';

// Exportar utilidades
export {
  generateUUID,
  generateFingerprint,
  getDeviceInfo,
  getUTMParams,
  getEventPriority,
  isCriticalEvent
} from './src/utils';

// API de conveniencia para inicialización rápida
export const initTracking = (config?: Partial<TrackerConfig>) => {
  return createInnovaTracker(config);
};

// Validar compatibilidad de versiones
export const VERSION = '2.0.0-consolidated';
export const COMPATIBILITY = {
  backend: '>=1.0.0',
  prisma: '>=5.0.0',
  node: '>=18.0.0'
};
