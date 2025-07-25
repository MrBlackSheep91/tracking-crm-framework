import { v4 as uuidv4 } from 'uuid';
import { 
  SessionData, 
  DeviceInfo,
  SessionEndReason,
  IPLocation,
  // UserBehavior no utilizado actualmente pero se mantendrá para futura implementación
  // UserBehavior
} from './sessionTypes.js';
import { getStructuredUtmParams, getBrowserFingerprint } from './sessionTypes.js';

import { getOrCreateVisitorId } from './sessionUtils.js';
import { startActivityMonitoring, stopActivityMonitoring } from './activityMonitor.js';
import { startScrollTracking, stopScrollTracking, getMaxScrollPercentage, getScrollAttentionMap, getVisibleScrollZones } from './scrollTracker.js';

// Importar configuración centralizada
import { 
  API_ENDPOINTS, 
  TRACKING_CONFIG, 
  trackingLog, 
  trackingError,
  ENVIRONMENT_INFO
} from '../../config/tracking-config.js';

// Browser environment check
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Configuración desde archivo centralizado
const HEARTBEAT_INTERVAL = TRACKING_CONFIG.heartbeatInterval;
const INACTIVITY_TIMEOUT = TRACKING_CONFIG.inactivityTimeout;
const WEBHOOK_URL = API_ENDPOINTS.track;

// Global state
let currentSession: SessionData | null = null;
let sessionStartTime: number | null = null;
let lastActivityTime: number | null = null;
let inactivityTimer: number | null = null;
let heartbeatInterval: number | null = null;
let startEventTimeout: number | null = null;
let eventHistory: Record<string, any>[] = []; // Búfer para todos los eventos de la sesión
let cleanupListeners: (() => void) | null = null; // Función para limpiar listeners

// Estado para controlar si una sesión terminó por inactividad y podría reiniciarse
export let sessionEndedByInactivity = false; // Variable de control para sesiones inactivas
let globalActivityListener: ((e: Event) => void) | null = null;

// Helper functions for logging (usando configuración centralizada)
function logWithTime(module: string, message: string, data?: any): void {
  trackingLog(module, message, data);
}

function logWithError(module: string, message: string, error: any): void {
  trackingError(module, message, error);
}

// Almacena un evento en el búfer de la sesión en lugar de enviarlo inmediatamente.
export function trackEvent(eventType: string, eventName: string, eventData: Record<string, any> = {}): void {
  if (!isBrowser || !currentSession) return;

  const event = {
    eventType,
    eventName,
    eventData,
    createdAt: new Date().toISOString(), // Asignar timestamp en el momento de la creación
    pageUrl: window.location.href, // Forzar siempre la URL actual para cada evento
  };

  eventHistory.push(event);
  logWithTime('Tracker Event Buffered', `${eventType} - ${eventName}`, event);
  
  // Solo ciertos eventos deben reiniciar el temporizador de inactividad
  // Los heartbeats no representan actividad real del usuario
  if ((eventType === 'user_activity' && eventName !== 'heartbeat') || 
      eventType === 'user_interaction' || 
      eventType === 'interaction') {
    updateLastActivity();
    logWithTime('Activity', `Detectada actividad real del usuario: ${eventType} - ${eventName}`);
  }
}

// Envía el historial completo de la sesión al backend.
async function sendSessionHistory(reason: 'beacon' | 'fetch'): Promise<void> {
  if (!currentSession || eventHistory.length === 0) {
    logWithTime('Session', 'No events to send or session not started.');
    return;
  }

  // Crear copia del historial de eventos para enviar
  const eventsToSend = [...eventHistory];
  
  // Asegurarse de que la sesión tiene todos los campos críticos
  if (!currentSession.visitorId) {
    currentSession.visitorId = getOrCreateVisitorId();
    logWithTime('Session', 'Added missing visitorId to session');
  }
  
  if (!currentSession.businessId && configuredBusinessId) {
    currentSession.businessId = configuredBusinessId;
    logWithTime('Session', 'Added missing businessId to session');
  }
  
  // Asegurar que la sesión tiene timestamps correctos
  if (!currentSession.endTime && sessionStartTime) {
    currentSession.endTime = Date.now();
    currentSession.duration = (currentSession.endTime - sessionStartTime) / 1000;
    logWithTime('Session', `Calculated session duration: ${currentSession.duration}s`);
  }

  // Crear objeto estructurado para la API que espera n8n
  const sessionPayload = {
    session: {
      // Identificadores esenciales
      sessionId: currentSession.sessionId,
      visitorId: currentSession.visitorId,
      businessId: currentSession.businessId,
      fingerprint: currentSession.fingerprint,
      
      // Timestamps
      startedAt: new Date(currentSession.startTime).toISOString(),
      endedAt: currentSession.endTime ? new Date(currentSession.endTime).toISOString() : new Date().toISOString(),
      
      // Información del dispositivo
      deviceInfo: currentSession.deviceInfo || getDeviceInfo(),
      
      // Localización
      ipLocation: currentSession.location || {
        ip: '127.0.0.1',
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'UTC'
      },
      
      // Información de página
      pageInfo: {
        url: window.location.href,
        title: document.title,
        referrer: currentSession.referrer || document.referrer
      },
      
      // Comportamiento del usuario
      userBehavior: currentSession.userBehavior || {}
    },
    
    // Normalizar todos los eventos para asegurar consistencia
    events: eventsToSend.map(event => ({
      eventType: event.eventType || 'session_event',
      metadata: event.eventData || event.metadata || {},
      createdAt: event.createdAt || new Date().toISOString(),
      pageUrl: event.pageUrl || window.location.href
    }))
  };

  logWithTime('Session', `Preparando envío de ${eventsToSend.length} eventos. Motivo: ${reason}`);
  logWithTime('Session Payload', 'Contenido del payload', sessionPayload);

  // Si es una petición final por cierre de página, usar sendBeacon
  if (reason === 'beacon' && navigator.sendBeacon) {
    try {
      const payloadString = JSON.stringify(sessionPayload);
      const blob = new Blob([payloadString], { type: 'application/json' });
      const success = navigator.sendBeacon(WEBHOOK_URL, blob);
      logWithTime('Session', `Datos finales enviados via sendBeacon. Éxito: ${success}. Eventos: ${eventsToSend.length}`);
      if (!success) {
        throw new Error('navigator.sendBeacon returned false');
      }
    } catch (error) {
      logWithError('Session', 'Error al enviar sesión via sendBeacon', error);
      // Si el envío falla, conservar los eventos para el próximo intento
      return;
    }
  } else {
    try {
      const payloadString = JSON.stringify(sessionPayload);
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadString,
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`¡Error HTTP! estado: ${response.status}`);
      }

      logWithTime('Session', `Se enviaron correctamente ${eventsToSend.length} eventos via fetch.`);
    } catch (error) {
      logWithError('Session', 'Error al enviar historial de sesión', error);
      return; // Mantener eventos en caso de error
    }
  }
  
  // Limpiar el historial de eventos sólo después de un envío exitoso
  eventHistory = [];
}

// Device detection helpers
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (window.matchMedia) {
    if (window.matchMedia('(max-width: 767px)').matches) return 'mobile';
    if (window.matchMedia('(max-width: 1024px)').matches) return 'tablet';
  }
  const isMobile = /iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(userAgent);
  const isTablet = /ipad|android 3|sch-i800|playbook|tablet|kindle|gt-p1000|sgh-t849|shw-m180s|a510|a511|a100|dell streak|silk/i.test(userAgent);
  return isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
}

function getOS(): string {
  if (!isBrowser) return 'unknown';
  const userAgent = window.navigator.userAgent;
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iOS|iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  return 'unknown';
}

function getBrowser(): string {
  if (!isBrowser) return 'unknown';
  const userAgent = window.navigator.userAgent;
  if (/Edg/i.test(userAgent)) return 'Edge';
  if (/Chrome/i.test(userAgent)) return 'Chrome';
  if (/Firefox/i.test(userAgent)) return 'Firefox';
  if (/Safari/i.test(userAgent)) return 'Safari';
  if (/Opera|OPR/i.test(userAgent)) return 'Opera';
  return 'unknown';
}

export function getDeviceInfo(): DeviceInfo {
  // Valores por defecto para entorno no-browser
  const defaultDevice: DeviceInfo = { 
    type: 'desktop', 
    os: 'unknown', 
    browser: 'unknown', 
    screenResolution: '0x0', 
    viewportSize: '0x0', 
    userAgent: '',
    language: 'unknown',
    timezone: 'UTC'
  };
  
  if (!isBrowser) return defaultDevice;
  
  // Obtener dimensiones del viewport
  const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  
  // Detectar timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  
  // Construir objeto completo con datos reales
  return { 
    type: getDeviceType(), 
    os: getOS(), 
    browser: getBrowser(), 
    screenResolution: `${window.screen.width}x${window.screen.height}`, 
    viewportSize: `${viewportWidth}x${viewportHeight}`, 
    userAgent: navigator.userAgent,
    language: navigator.language || 'unknown',
    timezone: timezone
  };
}

let cachedIPLocation: IPLocation | null = null;
const IP_CACHE_KEY = 'ipLocationCache';
const IP_CACHE_EXPIRY = 24 * 60 * 60 * 1000;

function getIPCache(): { data: IPLocation, timestamp: number } | null {
  try {
    const cachedData = localStorage.getItem(IP_CACHE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp) < IP_CACHE_EXPIRY) return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error leyendo caché de IP:', error);
    return null;
  }
}

function saveIPCache(ipLocation: IPLocation) {
  try {
    const cacheData = { data: ipLocation, timestamp: Date.now() };
    localStorage.setItem(IP_CACHE_KEY, JSON.stringify(cacheData));
    cachedIPLocation = ipLocation;
  } catch (error) {
    console.error('Error guardando caché de IP:', error);
  }
}

async function getIPLocation(): Promise<IPLocation> {
  // Usar caché si existe
  if (cachedIPLocation) return cachedIPLocation;
  const cachedData = getIPCache();
  if (cachedData) {
    cachedIPLocation = cachedData.data;
    return cachedData.data;
  }
  
  // Obtener valores predeterminados del navegador para ser usados como fallback
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  
  try {
    // Lista de APIs de geolocalización por IP (en orden de preferencia)
    const apis = [
      { url: 'https://ipapi.co/json/', headers: {} },
      { url: 'https://ip-api.com/json/', headers: {} },
      { url: 'https://ipinfo.io/json', headers: {} }
    ];
    
    // Intentar cada API hasta que una funcione
    for (const api of apis) {
      try {
        logWithTime('IP Location', `Intentando obtener IP desde ${api.url}`);
        const response = await fetch(api.url, { cache: 'no-cache', headers: api.headers });
        
        if (response.ok) {
          const data = await response.json();
          
          // Extraer campos relevantes con fallbacks
          const ipLocation: IPLocation = { 
            ip: data.ip || data.query || '127.0.0.1', 
            country: data.country_name || data.country || 'Unknown', 
            region: data.region || data.regionName || data.state || 'Unknown', 
            city: data.city || 'Unknown', 
            timezone: data.timezone || browserTimezone,
            latitude: data.latitude || data.lat || 0,
            longitude: data.longitude || data.lon || 0
          };
          
          logWithTime('IP Location', 'Ubicación IP obtenida exitosamente', ipLocation);
          saveIPCache(ipLocation);
          cachedIPLocation = ipLocation;
          return ipLocation;
        }
      } catch (error) { 
        logWithError('IP Location', `Error con API ${api.url}`, error);
        /* continuar con la siguiente API */ 
      }
    }
    
    // Si todas las APIs fallan, usar valores predeterminados más descriptivos
    logWithTime('IP Location', 'Todas las APIs fallaron, usando valores predeterminados');
    const defaultLocation: IPLocation = { 
      ip: '127.0.0.1', 
      country: 'Unknown', 
      region: 'Unknown', 
      city: 'Unknown', 
      timezone: browserTimezone,
      latitude: 0,
      longitude: 0
    };
    
    saveIPCache(defaultLocation);
    cachedIPLocation = defaultLocation;
    return defaultLocation;
  } catch (error) {
    logWithError('IP Location', 'Error general obteniendo ubicación por IP', error);
    
    // En caso de error general, usar valores predeterminados
    const defaultLocation: IPLocation = { 
      ip: '127.0.0.1', 
      country: 'Unknown', 
      region: 'Unknown', 
      city: 'Unknown', 
      timezone: browserTimezone,
      latitude: 0,
      longitude: 0
    };
    
    saveIPCache(defaultLocation);
    cachedIPLocation = defaultLocation;
    return defaultLocation;
  }
}

// Session management
export function updateLastActivity(): void {
  lastActivityTime = Date.now();
  if (currentSession) currentSession.lastActivity = lastActivityTime;
  
  // 🎯 ACTUALIZAR TRACKER_DATA EN LOCALSTORAGE
  // Mantener sincronizado con la sesión actual
  try {
    const existingTrackerData = localStorage.getItem('tracker_data');
    if (existingTrackerData) {
      const trackerData = JSON.parse(existingTrackerData);
      trackerData.lastActivity = lastActivityTime;
      localStorage.setItem('tracker_data', JSON.stringify(trackerData));
    }
  } catch (error) {
    logWithError('Session', 'Error actualizando tracker_data:', error);
  }
  
  resetInactivityTimer();
}

function resetInactivityTimer(): void {
  logWithTime('Inactivity', 'Timer reset'); // Log para depuración
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = window.setTimeout(() => {
    logWithTime('Inactivity', 'Session timed out due to inactivity');
    endSession('inactivity');
  }, INACTIVITY_TIMEOUT);
}

function startHeartbeat(): void {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = window.setInterval(() => {
    const timeOnPage = sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : 0;
    const scrollPercentage = getMaxScrollPercentage();
    const scrollAttentionMap = getScrollAttentionMap();

    trackEvent('user_activity', 'heartbeat', { 
      scrollPercentage,
      scrollAttentionMap,
      timeOnPage,
    });

    logWithTime('Heartbeat', `Session heartbeat. Time on page: ${timeOnPage.toFixed(2)}s`);
  }, HEARTBEAT_INTERVAL);
}

function handlePageLeave(): void {
  logWithTime('Session', 'Page leave detected, ending session.');
  endSession('page_leave');
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    logWithTime('Session', 'Tab became hidden');
    trackEvent('visibility_change', 'tab_hidden');
  } else {
    logWithTime('Session', 'Tab became visible');
    updateLastActivity();
    trackEvent('visibility_change', 'tab_visible');
  }
}

let configuredBusinessId: string | null = null;

export function init(businessId: string): void {
  if (!businessId) {
    console.error('Business ID is required for session tracking.');
    return;
  }
  configuredBusinessId = businessId;
  logWithTime('Session', `Tracker initialized for Business ID: ${businessId}`);
}

export async function startSession(): Promise<void> {
  if (!isBrowser || currentSession) {
    if (currentSession) {
      logWithTime('Session', 'Session already started.');
    }
    return;
  }

  logWithTime('Session', 'Starting new session...');

  // Obtener la IP una vez al inicio de la sesión
  const ipLocation = await getIPLocation();
  logWithTime('Session', 'IP Location data:', ipLocation);

  if (!configuredBusinessId) {
    // Si no se ha inicializado, usar un ID por defecto en lugar de mostrar error
    configuredBusinessId = '00000000-0000-0000-0000-000000000001';
    logWithTime('Session', `Using default business ID: ${configuredBusinessId}`);
  }

  const now = Date.now();
  sessionStartTime = now;
  lastActivityTime = now;
  eventHistory = []; // Limpiar historial de eventos anteriores
  
  // Garantizar que tenemos un visitorId
  const visitorId = getOrCreateVisitorId();
  logWithTime('Session', `Visitor ID: ${visitorId}`);
  
  // Obtener información completa del dispositivo
  const deviceInfo = getDeviceInfo();
  logWithTime('Session', 'Device Info:', deviceInfo);

  currentSession = {
    // Core IDs - Fundamentales para seguimiento
    businessId: configuredBusinessId,
    sessionId: uuidv4(),
    visitorId: visitorId,
    fingerprint: getBrowserFingerprint(),

    // Timestamps & State
    startTime: now,
    lastActivity: now,
    timestamp: new Date(now).toISOString(),
    pageViews: 1, // Initial page view
    history: [], // Initialize event history
    userBehavior: {
      sessionStartTime: new Date(now).toISOString(),
      referrer: document.referrer || 'direct',
      initialUrl: window.location.href,
      initialTitle: document.title
    }, // Enhanced user behavior

    // Context - Información de contexto enriquecida
    referrer: document.referrer || 'direct',
    userAgent: navigator.userAgent,
    deviceInfo: deviceInfo,
    location: ipLocation,
    utmParams: getStructuredUtmParams(),
  };

  // 🎯 GUARDAR TRACKER_DATA EN LOCALSTORAGE PARA LEADSERVICE
  // Esto permite que el leadService lea el sessionId correcto
  const trackerData = {
    sessionId: currentSession.sessionId,
    visitorId: currentSession.visitorId,
    businessId: currentSession.businessId,
    startTime: currentSession.startTime,
    deviceInfo: currentSession.deviceInfo,
    ipLocation: currentSession.location,
    utmParams: currentSession.utmParams,
    referrer: currentSession.referrer,
    pageUrl: window.location.href, // Forzar siempre la URL actual para cada evento
    timestamp: currentSession.timestamp
  };

  try {
    localStorage.setItem('tracker_data', JSON.stringify(trackerData));
    logWithTime('Session', '✅ Tracker data guardado en localStorage:', trackerData);
  } catch (error) {
    logWithError('Session', 'Error guardando tracker_data en localStorage:', error);
  }

  // El evento de inicio de sesión se retrasa para evitar registrar sesiones muy cortas
  startEventTimeout = window.setTimeout(() => {
    trackEvent('session_event', 'session_start');
    startEventTimeout = null; // Marcar que el evento de inicio ya se envió
  }, 100);

  // Setup listeners
  window.addEventListener('beforeunload', handlePageLeave);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  cleanupListeners = () => {
    window.removeEventListener('beforeunload', handlePageLeave);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  startHeartbeat();
  resetInactivityTimer();
  startScrollTracking();
  const activityTracker = (eventType: string, eventData: Record<string, any>) => 
    trackEvent('user_activity', eventType, eventData);

  startActivityMonitoring(
    activityTracker,
    () => sessionStartTime!,
    getVisibleScrollZones,
    getMaxScrollPercentage
  );
}

export async function endSession(reason: SessionEndReason): Promise<void> {
  // Si un evento de session_start está pendiente, cancélalo.
  if (startEventTimeout) {
    clearTimeout(startEventTimeout);
    startEventTimeout = null;
    logWithTime('Session', 'End of session ignored (too short).');
    return; // No rastrear sesiones que son demasiado cortas.
  }

  if (!currentSession || !sessionStartTime) return;

  logWithTime('Session', `Ending session due to: ${reason}`);

  // Detener todos los temporizadores y el seguimiento
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (cleanupListeners) cleanupListeners();
  stopScrollTracking();
  stopActivityMonitoring();

  // Añadir el evento final al historial y enviar el lote completo
  trackEvent('session_event', 'session_end', { 
    reason: reason, 
    finalAttentionMap: getScrollAttentionMap(),
    duration: (Date.now() - (sessionStartTime || 0)) / 1000,
    scrollPercentage: getMaxScrollPercentage(),
  });

  // Forzar el envío de todos los eventos restantes de forma síncrona 
  // Enviar el historial de la sesión
  // Usar 'beacon' si es por cierre de página, 'fetch' en otros casos
  const sendMethod = reason === 'page_leave' ? 'beacon' : 'fetch';
  await sendSessionHistory(sendMethod);

  // 🎯 LIMPIAR TRACKER_DATA DE LOCALSTORAGE
  // Cuando la sesión termina, limpiar los datos para evitar conflictos
  try {
    localStorage.removeItem('tracker_data');
    logWithTime('Session', '🧹 Tracker data limpiado de localStorage');
  } catch (error) {
    logWithError('Session', 'Error limpiando tracker_data:', error);
  }

  // Restablecer el estado
  currentSession = null;
  sessionStartTime = null;
  heartbeatInterval = null;
  inactivityTimer = null;
  cleanupListeners = null;
  // El historial de eventos ya se limpia en sendSessionHistory
  
  // Si la sesión terminó por inactividad, prepararse para una posible nueva sesión
  // cuando el usuario vuelva a interactuar
  if (reason === 'inactivity') {
    logWithTime('Session', 'Esperando nueva actividad para reiniciar sesión');
    sessionEndedByInactivity = true;
    
    // Eliminar listeners globales anteriores si existen
    if (globalActivityListener) {
      document.removeEventListener('click', globalActivityListener);
      document.removeEventListener('keydown', globalActivityListener);
      document.removeEventListener('mousemove', globalActivityListener);
      document.removeEventListener('touchstart', globalActivityListener);
      document.removeEventListener('scroll', globalActivityListener);
    }
    
    // Crear un nuevo listener global para detectar cualquier interacción
    globalActivityListener = () => {
      logWithTime('Session', 'Nueva actividad detectada después de inactividad, reiniciando sesión');
      // Eliminar este listener global ya que la sesión se reiniciará
      document.removeEventListener('click', globalActivityListener!);
      document.removeEventListener('keydown', globalActivityListener!);
      document.removeEventListener('mousemove', globalActivityListener!);
      document.removeEventListener('touchstart', globalActivityListener!);
      document.removeEventListener('scroll', globalActivityListener!);
      
      // Reiniciar la sesión
      sessionEndedByInactivity = false;
      globalActivityListener = null;
      startSession();
    };
    
    // Agregar listeners para detectar cualquier interacción
    document.addEventListener('click', globalActivityListener);
    document.addEventListener('keydown', globalActivityListener);
    document.addEventListener('mousemove', globalActivityListener);
    document.addEventListener('touchstart', globalActivityListener);
    document.addEventListener('scroll', globalActivityListener);
  }
}