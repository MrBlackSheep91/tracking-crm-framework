/**
 * Punto de entrada para el sistema modular de tracking de sesiones.
 * Re-exporta las funciones y tipos principales para uso externo.
 */

// Exportar todos los tipos para que estén disponibles para los consumidores del servicio.
export * from './sessionTypes';
import { SessionEndReason } from './sessionTypes';

// Exportar las funciones públicas principales del gestor de sesiones.
// Estas son las funciones que se usarán para iniciar, detener y gestionar el seguimiento.
export {
  startSession,
  endSession,
  trackEvent,
  getDeviceInfo,
  updateLastActivity
} from './sessionManager';

// Re-exportar la función init desde sessionManager para compatibilidad con código existente
export { init } from './sessionManager';

// Exportar el tracking de botones
export { initButtonTracking } from './buttonTracker';

// Exportar funciones de utilidad que pueden ser útiles externamente.
export { getOrCreateVisitorId } from './sessionUtils';



// --- Default Export --- 
// Para mantener la compatibilidad o para una importación más sencilla,
// también se puede proporcionar un export por defecto con todas las funciones públicas.

import {
  startSession,
  endSession,
  trackEvent,
  getDeviceInfo,
  updateLastActivity,
} from './sessionManager';

import { initButtonTracking } from './buttonTracker';
import { getOrCreateVisitorId } from './sessionUtils';

// Variable para almacenar la función de limpieza del tracking de botones
let buttonTrackingCleanup: (() => void) | null = null;

// Importar init de sessionManager para usar dentro de initTracker
import { init } from './sessionManager';

// Función para obtener el estado actual (necesitamos acceso a las variables internas)
function getCurrentSessionState() {
  try {
    // Intentar obtener datos del localStorage como alternativa
    const trackerData = localStorage.getItem('tracker_data');
    return trackerData ? JSON.parse(trackerData) : null;
  } catch (e) {
    return null;
  }
}

// Función para inicializar todo el sistema de tracking
export function initTracker(businessId: string): void {
  console.log('🚀 [initTracker] Iniciando sistema de tracking...');
  console.log('📋 [initTracker] Business ID:', businessId);
  
  try {
  // Inicializar el tracker con el businessId
    console.log('🔧 [initTracker] Llamando init()...');
  init(businessId);
  
  // Inicializar la sesión
    console.log('📡 [initTracker] Llamando startSession()...');
    startSession().then(() => {
      console.log('✅ [initTracker] Sesión iniciada exitosamente');
    }).catch((error) => {
      console.error('❌ [initTracker] Error iniciando sesión:', error);
    });
  
  // Inicializar el tracking de botones
    console.log('🖱️ [initTracker] Iniciando tracking de botones...');
  buttonTrackingCleanup = initButtonTracking();
    
    console.log('🎉 [initTracker] Sistema de tracking inicializado completamente');
  } catch (error) {
    console.error('💥 [initTracker] Error crítico:', error);
  }
}

// Función para limpiar todo el sistema de tracking
export function cleanupTracker(reason: SessionEndReason = 'user_close'): void {
  // Limpiar el tracking de botones
  if (buttonTrackingCleanup) {
    buttonTrackingCleanup();
    buttonTrackingCleanup = null;
  }
  
  // Finalizar la sesión
  endSession(reason);
}

// Función para verificar el estado del tracking (útil para debug)
export function getTrackingStatus(): any {
  const sessionData = getCurrentSessionState();
  const status = {
    sessionActive: sessionData !== null,
    sessionData: sessionData,
    visitorId: getOrCreateVisitorId(),
    localStorage: {
      tracker_data: localStorage.getItem('tracker_data'),
      tracking_events_buffer: localStorage.getItem('tracking_events_buffer'),
      last_activity_time: localStorage.getItem('last_activity_time')
    }
  };
  
  console.log('📊 [Tracking Status]', status);
  return status;
}

// Hacer disponible globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).getTrackingStatus = getTrackingStatus;
  (window as any).initTracker = initTracker;
  (window as any).startSession = startSession;
  (window as any).trackEvent = trackEvent;
}

const sessionTracker = {
  // Funciones principales de la sesión
  startSession,
  endSession,
  trackEvent,
  initTracker,
  cleanupTracker,
  initButtonTracking,

  // Funciones de utilidad
  getDeviceInfo,
  updateLastActivity,
  getOrCreateVisitorId,
};

export default sessionTracker;
