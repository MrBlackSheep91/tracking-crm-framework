/**
 * TIPOS UNIFICADOS PARA PAYLOADS DE TRACKING
 * Basados en el schema Prisma para garantizar consistencia entre frontend y backend
 * Versión 3.0 del CRM Tracker Framework
 */

// ============================================
// TIPOS BASE GENERADOS POR PRISMA
// ============================================

// Estos tipos se importan directamente de Prisma Client para ser la única fuente de verdad.
// Asegúrate de ejecutar `npx prisma generate` para que estos tipos estén disponibles.
import type { 
  Session as PrismaSession, 
  Visitor as PrismaVisitor, 
  TrackingEvent as PrismaTrackingEvent 
} from '@prisma/client';

// Exportamos los tipos base de Prisma para su uso en toda la aplicación.
export type { PrismaSession, PrismaVisitor, PrismaTrackingEvent };

// ============================================
// TIPOS DE DATOS PARA LA API (PAYLOADS)
// ============================================
// Estos tipos definen el contrato de la API con el frontend.
// Son similares a los tipos de Prisma pero usan `string` para fechas y pueden tener una estructura diferente.

/**
 * Representa los datos de una sesión enviados por el frontend.
 * Nótese la estructura anidada, que se aplana antes de guardar en la base de datos.
 */

// ============================================
// INTERFACES PARA SESIONES
// ============================================

export interface SessionData {
  sessionId: string;
  visitorId: string;
  businessId: number;
  startedAt: string; // ISO string
  endedAt?: string; // ISO string
  duration?: number; // en segundos
  
  // Device Info
  deviceInfo?: {
    type?: string;
    os?: string;
    browser?: string;
    screenResolution?: string;
    viewportSize?: string;
    userAgent?: string;
    language?: string;
    timezone?: string;
  };
  
  // Location Info
  ipLocation?: {
    ip?: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Page Info
  pageInfo?: {
    url?: string;
    title?: string;
    referrer?: string;
  };
  
  // User Behavior
  userBehavior?: {
    sessionStartTime?: string;
    referrer?: string;
    initialUrl?: string;
    initialTitle?: string;
    pagesViewed?: number;
    totalActiveTime?: number;
    scrollDepthMax?: number;
    pagesVisited?: string[];
  };
}

// ============================================
// INTERFACES PARA EVENTOS
// ============================================

/**
 * Representa un único evento de tracking enviado por el frontend.
 * Derivado de PrismaTrackingEvent para reducir duplicación.
 */
export type TrackingEventData = Omit<PrismaTrackingEvent, 'id' | 'sessionId' | 'visitorId' | 'businessId' | 'createdAt' | 'metadata'> & {
  createdAt: string; // ISO string
  metadata?: Record<string, any>;
};

/**
 * Representa los datos de un visitante enviados por el frontend.
 * Derivado de PrismaVisitor para reducir duplicación.
 */
export type VisitorData = Omit<PrismaVisitor, 'id' | 'firstSeenAt' | 'lastSeenAt'> & {
  visitorId: string;
  firstSeenAt?: string; // ISO string
  lastSeenAt?: string; // ISO string
};

// ============================================
// TIPOS DE PAYLOADS PARA API V3.0
// ============================================

export interface ImmediateEventPayload {
  sessionData: SessionData;
  event: TrackingEventData;
  visitorData?: VisitorData;
}

export interface BatchEventsPayload {
  sessionData: SessionData;
  events: TrackingEventData[];
  visitorData?: VisitorData;
}

export interface HeartbeatPayload {
  sessionId: string;
  visitorId: string;
  businessId: number;
  userBehavior: {
    sessionStartTime: string;
    lastActivity: string;
    pagesViewed: number;
    timeOnSite: number;
    scrollDepthMax?: number;
    currentUrl: string;
    referrer?: string;
    initialUrl?: string;
    initialTitle?: string;
    isActive: boolean;
  };
  timestamp?: string;
  pageUrl?: string;
}

export interface SessionEndPayload {
  sessionData: SessionData;
  finalEvents?: TrackingEventData[];
  visitorData?: VisitorData;
}

// Union type para validación universal
export type UniversalTrackingPayload = 
  | ImmediateEventPayload 
  | BatchEventsPayload 
  | HeartbeatPayload 
  | SessionEndPayload;

// ============================================
// TIPOS DE RESPUESTA DE LA API
// ============================================

export interface TrackingApiResponse {
  success: boolean;
  message: string;
  data?: {
    sessionId?: string;
    visitorId?: string;
    eventsProcessed?: number;
    warnings?: string[];
  };
  error?: {
    code: string;
    details?: string;
    field?: string;
  };
  timestamp: string;
}

// ============================================
// TIPOS PARA DETECCIÓN DE PAYLOADS
// ============================================

export type PayloadType = 'immediate' | 'batch' | 'heartbeat' | 'session-end' | 'legacy' | 'unknown';

// Metadata para tracking interno
export interface PayloadMetadata {
  type: PayloadType;
  receivedAt: string;
  size: number;
  source: 'api' | 'webhook' | 'direct';
}

// ============================================
// LEGACY SUPPORT TYPES
// ============================================

export interface LegacyPayload {
  sessionId?: string;
  visitorId?: string;
  businessId?: number;
  eventType?: string;
  eventData?: any;
  timestamp?: string;
  [key: string]: any; // Para campos adicionales legacy
}

// ============================================
// VALIDATION HELPERS
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  payloadType?: PayloadType;
  normalizedPayload?: UniversalTrackingPayload;
}

// ============================================
// EXPORT PRINCIPAL - Evitar duplicados
// ============================================
