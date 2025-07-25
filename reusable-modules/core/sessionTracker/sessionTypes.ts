/**
 * Tipos compartidos para el sistema de tracking de sesiones
 */

export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

// ==================== TIPOS BÁSICOS ====================

export type SessionEndReason = 
  | 'user_close'     // Usuario cierra explícitamente la pestaña/navegador
  | 'inactivity'     // Inactividad prolongada
  | 'navigation'     // Navegación a otra URL
  | 'tab_close'      // Pestaña cerrada o cambiada
  | 'page_hide'      // Página oculta (pero no necesariamente cerrada)
  | 'page_leave'     // El usuario está a punto de abandonar la página (beforeunload)
  | 'session_expired' // Sesión expirada
  | 'page_refresh'   // Recarga de página (F5)
  | 'navigation_back' // Navegación atrás/adelante
  | 'browser_restore' // Restauración de sesión del navegador
  | 'unknown';        // Razón desconocida

// ==================== INTERFACES ====================


/**
 * Información del dispositivo del usuario
 */
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screenResolution: string;
  viewportSize: string;
  userAgent: string;
  language: string;
  timezone: string;
}

/**
 * Estructura de información de geolocalización por IP
 */
export interface IPLocation {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  country_name?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Estructura para datos de comportamiento de usuario
 */
export interface UserBehavior {
  referrer?: string;
  timeOnPageSeconds?: number;
  scrollPercentage?: number;
  inactiveTimeSeconds?: number;
  clickCount?: number;
  formInteractions?: number;
  lastUpdateAt?: string;
  scrollCheckpoints?: Record<string, string>;
  scrollTimeBetweenCheckpoints?: Record<string, number>;
  sessionStartTime?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Tipos de eventos de sesión
 */
export type SessionEventType = 'session_start' | 'session_end' | 'heartbeat';

/**
 * Estructura para datos de evento de sesión
 */
export interface SessionEvent {
  timestamp: number;
  event: string;
  data?: unknown;
}

/**
 * Estructura para datos de sesión históricos
 */
export interface SessionHistoryEntry {
  timestamp: number;
  event: string;
  data?: unknown;
}

/**
 * Estructura completa de datos de sesión
 */
export interface SessionData {
  businessId: string;
  sessionId: string;
  leadId?: string;
  visitorId?: string;
  fingerprint: string;
  startTime: number;
  lastActivity: number;
  lastActivityTime?: number;
  endTime?: number;
  endReason?: SessionEndReason;
  timestamp: string;
  pageViews: number;
  referrer: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  location?: IPLocation;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  userBehavior: UserBehavior;
  history: SessionHistoryEntry[];

  metadata?: {
    os?: string;
    screenResolution?: string;
    viewportSize?: string;
    language?: string;
    isMobile?: boolean;
    isTablet?: boolean;
    isDesktop?: boolean;
    [key: string]: unknown;
  };
  os?: string;
  screenResolution?: string;
  viewportSize?: string;
  language?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
  duration?: number;
  scrollPercentage?: number;
  timeOnPage?: number;
  events?: Array<{
    type: string;
    data?: unknown;
    timestamp: number;
  }>;
}

// ==================== CONSTANTES =====================

// URLs de webhooks
export const N8N_SESSION_WEBHOOK_URL = 'https://n8n.nat-pets.com/webhook/session-tracking';
export const N8N_HEARTBEAT_WEBHOOK_URL = 'https://n8n.nat-pets.com/webhook/heartbeat';

// Constantes de tiempo
export const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutos
export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
export const TAB_HIDDEN_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos
export const MIN_SESSION_TIME_SECONDS = 5; // 5 segundos

// ==================== FUNCIONES =====================

/**
 * Obtiene los parámetros UTM de la URL actual
 */
export const getStructuredUtmParams = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  
  // Solo incluir parámetros UTM si existen
  const utmKeys = ['source', 'medium', 'campaign', 'term', 'content'];
  utmKeys.forEach(key => {
    const value = params.get(`utm_${key}`);
    if (value) utmParams[key] = value;
  });
  
  return utmParams;
};

/**
 * Obtiene la huella digital del navegador
 */
export const getBrowserFingerprint = (): string => {
  if (typeof window === 'undefined') return '';
  
  const navigator = window.navigator;
  const screen = window.screen;
  const timezone = new Date().getTimezoneOffset();
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    timezone,
    navigator.hardwareConcurrency || 0,
    (navigator as any).deviceMemory || 0,
  ].join('|');
  
  // Usar un hash en formato hexadecimal para el fingerprint (siempre positivo y consistente)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  
  // Convertir a hexadecimal positivo y añadir prefijo para asegurar formato string
  return 'fp_' + Math.abs(hash).toString(16);
};
