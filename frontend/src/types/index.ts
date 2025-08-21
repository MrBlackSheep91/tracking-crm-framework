/**
 * 🎯 TIPOS CONSOLIDADOS - TRACKING CRM FRAMEWORK v2.0
 * Tipos unificados compatibles con backend Prisma y frontend avanzado
 */

// ==================== CONFIGURACIÓN DEL TRACKER ====================

export interface TrackerConfig {
  businessId: string;
  baseUrl?: string;
  debug?: boolean;
  
  // Intervalos de tiempo (ms)
  heartbeatInterval?: number;        // 15000ms por defecto
  inactivityTimeout?: number;        // 30000ms por defecto
  activityUpdateInterval?: number;   // 2000ms por defecto
  scrollUpdateInterval?: number;     // 1000ms por defecto
  
  // Configuración de buffering
  eventBufferSize?: number;          // 10 eventos por lote
  maxRetries?: number;              // 3 reintentos
  retryDelay?: number;              // 1000ms inicial
  
  // Configuración de scroll tracking
  scrollZoneSize?: number;          // 10% por zona
  enableScrollTracking?: boolean;   // true por defecto
  enableActivityMonitoring?: boolean; // true por defecto
  autoStart?: boolean;              // true por defecto
  
  // Endpoints personalizables
  endpoints?: {
    // Nuevos endpoints simplificados
    sessionStart?: string;          // '/api/start-session'
    sessionEnd?: string;            // '/api/end-session'
    trackEvent?: string;            // '/api/track-event'
    batchEvents?: string;           // '/api/batch-events'
    heartbeat?: string;             // '/api/heartbeat'

    // Endpoints de sistema/métricas
    health?: string;                // '/api/health'
    metrics?: string;               // '/api/metrics'
    metricsRealtime?: string;       // '/api/metrics/realtime'
    metricsDashboard?: string;      // '/api/metrics/dashboard'
  };
  
  // Callbacks opcionales
  onSessionStart?: (sessionData: SessionData) => void;
  onSessionEnd?: (sessionData: SessionData) => void;
  onEventTrack?: (event: TrackingEvent) => void;
  onError?: (error: Error, context?: string) => void;
}

// ==================== DATOS DE SESIÓN ====================

export interface SessionData {
  // Identificadores principales
  sessionId: string;
  visitorId: string;
  businessId: string;
  fingerprint: string;
  
  // Metadatos temporales
  startedAt: string;
  endedAt?: string;
  lastActivityAt?: string;
  
  // Información del dispositivo y navegador
  deviceInfo: DeviceInfo;
  ipLocation?: IPLocation;
  pageInfo: PageInfo;
  userBehavior: UserBehavior;
  
  // Eventos de la sesión
  events: TrackingEvent[];
  
  // Estado de la sesión
  isActive?: boolean;
  endReason?: SessionEndReason;
}

// ==================== INFORMACIÓN DEL DISPOSITIVO ====================

export interface DeviceInfo {
  // Navegador
  userAgent: string;
  browser?: string;
  browserVersion?: string;
  
  // Sistema operativo
  platform: string;
  operatingSystem?: string;
  osVersion?: string;
  
  // Dispositivo
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  
  // Pantalla
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  
  // Capacidades del navegador
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  cookieEnabled: boolean;
  onlineStatus: boolean;
  
  // Hardware
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  
  // Red
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// ==================== GEOLOCALIZACIÓN ====================

export interface IPLocation {
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  city?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
  asn?: string;
}

// ==================== INFORMACIÓN DE PÁGINA ====================

export interface PageInfo {
  url: string;
  title: string;
  referrer: string;
  pathname: string;
  search: string;
  hash: string;
  
  // UTM Parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  
  // Click IDs para tracking de anuncios
  fbclid?: string;        // Facebook Click ID
  gclid?: string;         // Google Click ID
  msclkid?: string;       // Microsoft Ads Click ID
  ttclid?: string;        // TikTok Ads Click ID
  
  // Metadatos adicionales
  loadTime?: number;
  domContentLoadedTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

// ==================== PARÁMETROS UTM ====================

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  
  // Click IDs
  fbclid?: string;
  gclid?: string;
  msclkid?: string;
  ttclid?: string;
}

// ==================== COMPORTAMIENTO DEL USUARIO ====================

export interface UserBehavior {
  // Métricas de tiempo
  sessionDuration: number;
  pageViewDuration: number;
  timeOnPage: number;
  
  // Métricas de scroll
  maxScrollPercentage: number;
  currentScrollPercentage: number;
  scrollDirection: 'up' | 'down' | 'none';
  scrollSpeed: number;
  
  // Zones de atención (scroll tracking granular)
  attentionMap: {
    [zone: string]: {
      timeSpent: number;      // Tiempo en milisegundos
      visits: number;         // Número de veces que visitó la zona
      lastVisit: number;      // Timestamp de última visita
    };
  };
  
  // Métricas de actividad
  clickCount: number;
  keyboardEvents: number;
  mouseMovements: number;
  focusEvents: number;
  
  // Métricas de engagement
  engagementScore: number;    // 0-100
  attentionScore: number;     // 0-100
  interactionScore: number;   // 0-100
  
  // Estado de actividad
  isActive: boolean;
  lastActivityAt: number;
  timeSinceLastActivity: number;
  
  // Detección de inactividad
  inactivityCount: number;
  totalInactiveTime: number;
  
  // Cambios de visibilidad
  visibilityChanges: number;
  timeHidden: number;
  timeVisible: number;
}

// ==================== EVENTOS DE TRACKING ====================

export interface TrackingEvent {
  // Identificadores
  eventId: string;
  sessionId: string;
  visitorId: string;
  businessId: string;
  
  // Clasificación del evento
  category: EventCategory;
  eventType: string;
  eventName: string;
  priority: EventPriority;
  
  // Datos del evento
  eventData: Record<string, any>;
  
  // Metadatos temporales
  timestamp: string;
  clientTimestamp: number;
  
  // Contexto de la página
  pageUrl: string;
  pageTitle: string;
  
  // Información adicional
  deviceInfo?: Partial<DeviceInfo>;
  userBehavior?: Partial<UserBehavior>;
  
  // Seguimiento interno
  attempts?: number;
  lastAttempt?: string;
  sent?: boolean;
}

// ==================== ENUMS Y TIPOS LITERALES ====================

export type EventCategory = 
  | 'page_view'
  | 'user_interaction' 
  | 'navigation'
  | 'form_interaction'
  | 'conversion'
  | 'engagement'
  | 'system'
  | 'error'
  | 'custom';

export type EventPriority = 'immediate' | 'high' | 'normal' | 'low' | 'analytics';

export type SessionEndReason = 
  | 'manual'
  | 'inactivity'
  | 'navigation'
  | 'window_close'
  | 'tab_switch'
  | 'browser_close'
  | 'network_error'
  | 'timeout';

export type BufferType = 'immediate' | 'batch' | 'session_end';

// ==================== CONSTANTES DE EVENTOS ====================

export const EVENT_CATEGORIES = {
  PAGE_VIEW: 'page_view' as EventCategory,
  USER_INTERACTION: 'user_interaction' as EventCategory,
  NAVIGATION: 'navigation' as EventCategory,
  FORM_INTERACTION: 'form_interaction' as EventCategory,
  CONVERSION: 'conversion' as EventCategory,
  ENGAGEMENT: 'engagement' as EventCategory,
  SYSTEM: 'system' as EventCategory,
  ERROR: 'error' as EventCategory,
  CUSTOM: 'custom' as EventCategory
};

export const EVENT_PRIORITIES = {
  IMMEDIATE: 'immediate' as EventPriority,
  HIGH: 'high' as EventPriority,
  NORMAL: 'normal' as EventPriority,
  LOW: 'low' as EventPriority,
  ANALYTICS: 'analytics' as EventPriority
};

// ==================== TIPOS DE RESPUESTA DE API ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  healthy: boolean;
  timestamp: string;
  services: {
    database: boolean;
    tracking: boolean;
    api: boolean;
  };
  metrics?: {
    uptime: number;
    memory: number;
    cpu: number;
  };
  error?: string;
}

