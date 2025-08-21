/**
 * ESQUEMAS DE VALIDACIÓN UNIFICADOS PARA TRACKING
 * Versión 4.0 - PRISMA COMPATIBLE
 * Campos exactamente compatibles con schema.prisma
 */

import Joi from 'joi';

// ============================================
// ESQUEMAS EXACTOS COMPATIBLES CON PRISMA
// ============================================

// Schema para model Visitor (Prisma compatible)
export const visitorSchema = Joi.object({
  // Identificadores únicos (exactos de Prisma)
  visitorId: Joi.string().required(),
  fingerprint: Joi.string().optional().allow(null),
  sessionId: Joi.string().optional().allow(null),
  businessId: Joi.number().integer().required(),

  // Información del dispositivo (campos exactos Prisma)
  userAgent: Joi.string().optional().allow(null),
  deviceType: Joi.string().optional().allow(null),
  browser: Joi.string().optional().allow(null),
  browserVersion: Joi.string().optional().allow(null),
  operatingSystem: Joi.string().optional().allow(null),
  osVersion: Joi.string().optional().allow(null),
  screenResolution: Joi.string().optional().allow(null),
  screenSize: Joi.string().optional().allow(null),
  timezone: Joi.string().optional().allow(null),
  language: Joi.string().optional().allow(null),

  // Información de red y ubicación (campos exactos Prisma)
  clientIP: Joi.string().optional().allow(null),
  ipAddress: Joi.string().optional().allow(null),
  country: Joi.string().optional().allow(null),
  region: Joi.string().optional().allow(null),
  city: Joi.string().optional().allow(null),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),

  // Métricas de comportamiento (campos exactos Prisma)
  firstVisitAt: Joi.date().optional(),
  lastVisitAt: Joi.date().optional(),
  lastActivity: Joi.date().optional().allow(null),
  sessionsCount: Joi.number().integer().default(1),
  totalTimeOnSite: Joi.number().integer().optional().allow(null).default(0),
  pagesVisited: Joi.number().integer().optional().allow(null).default(0),
  pageViews: Joi.number().integer().optional().allow(null).default(0),
  maxScrollPercentage: Joi.number().integer().optional().allow(null).default(0),

  // Datos de origen y UTM (campos exactos Prisma)
  firstSource: Joi.string().optional().allow(null),
  firstMedium: Joi.string().optional().allow(null),
  firstCampaign: Joi.string().optional().allow(null),
  firstReferrer: Joi.string().optional().allow(null),
  utmParams: Joi.object().optional().allow(null),

  // Engagement y calidad (campos exactos Prisma)
  hasHighEngagement: Joi.boolean().default(false),
  engagementScore: Joi.number().integer().optional().allow(null).default(0),

  // Relación con contacto
  contactId: Joi.string().uuid().optional().allow(null)
});

// Schema para model Session (Prisma compatible)
export const sessionSchema = Joi.object({
  // ID exacto como en Prisma
  id: Joi.string().uuid().required(),
  visitorId: Joi.string().uuid().required(),
  businessId: Joi.number().integer().required(),

  // Timestamps exactos como en Prisma
  startedAt: Joi.date().default(new Date()),
  endedAt: Joi.date().optional().allow(null),
  duration: Joi.string().optional().allow(null), // BigInt como string
  totalActiveTime: Joi.string().optional().allow(null), // BigInt como string

  // Dispositivo y navegador (campos exactos Prisma)
  userAgent: Joi.string().optional().allow(null),
  deviceType: Joi.string().optional().allow(null),
  browser: Joi.string().optional().allow(null),
  browserVersion: Joi.string().optional().allow(null),
  operatingSystem: Joi.string().optional().allow(null),
  osVersion: Joi.string().optional().allow(null),
  screenResolution: Joi.string().optional().allow(null),
  screenSize: Joi.string().optional().allow(null),
  timezone: Joi.string().optional().allow(null),
  language: Joi.string().optional().allow(null),

  // Localización (campos exactos Prisma)
  ipAddress: Joi.string().optional().allow(null),
  country: Joi.string().optional().allow(null),
  region: Joi.string().optional().allow(null),
  city: Joi.string().optional().allow(null),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),

  // Actividad (campos exactos Prisma)
  entryUrl: Joi.string().optional().allow(null),
  exitUrl: Joi.string().optional().allow(null),
  pagesViewed: Joi.number().integer().default(0),
  lastPageViewedUrl: Joi.string().optional().allow(null),
  lastActivityAt: Joi.date().optional().allow(null),
  scrollDepthMax: Joi.number().integer().optional().allow(null),
  pagesVisited: Joi.array().items(Joi.string()).default([]),
  referrer: Joi.string().optional().allow(null),

  // Atribución (campos exactos Prisma)
  utmSource: Joi.string().optional().allow(null),
  utmMedium: Joi.string().optional().allow(null),
  utmCampaign: Joi.string().optional().allow(null),
  utmContent: Joi.string().optional().allow(null),
  utmTerm: Joi.string().optional().allow(null),
  fbclid: Joi.string().optional().allow(null),
  gclid: Joi.string().optional().allow(null),

  // Análisis IA (campo exacto Prisma)
  aiAnalysis: Joi.object().optional().allow(null)
});

// Schema para model TrackingEvent (Prisma compatible)
export const trackingEventSchema = Joi.object({
  // IDs exactos como en Prisma
  businessId: Joi.number().integer().required(),
  visitorId: Joi.string().uuid().required(),
  sessionId: Joi.string().uuid().required(),

  // Información del evento (campos exactos Prisma)
  eventType: Joi.string().required(),
  eventCategory: Joi.string().optional().allow(null),
  eventAction: Joi.string().optional().allow(null),

  // Contexto del evento (campos exactos Prisma)
  pageUrl: Joi.string().required(),
  pageTitle: Joi.string().optional().allow(null),
  referrer: Joi.string().optional().allow(null),
  timestamp: Joi.date().default(new Date()),

  // Datos específicos del evento DOM (campos exactos Prisma)
  targetElement: Joi.string().optional().allow(null),
  targetText: Joi.string().optional().allow(null),
  targetType: Joi.string().optional().allow(null),
  targetClasses: Joi.string().optional().allow(null),
  eventValue: Joi.number().optional().allow(null),

  // Metadata específica del evento (campos exactos Prisma)
  metadata: Joi.object().optional().allow(null),
  elementInfo: Joi.object().optional().allow(null),
  eventData: Joi.object().optional().allow(null),
  eventDetail: Joi.object().optional().allow(null),

  // Datos de conversión (campos exactos Prisma)
  conversionType: Joi.string().optional().allow(null),
  conversionValue: Joi.number().optional().allow(null),
  conversionSuccess: Joi.boolean().optional().allow(null),
  conversionAttemptId: Joi.string().optional().allow(null),

  // Datos de formularios (campos exactos Prisma)
  formId: Joi.string().optional().allow(null),
  formFields: Joi.object().optional().allow(null),
  formErrors: Joi.object().optional().allow(null),
  formEmptyFields: Joi.number().integer().optional().allow(null),
  formEmptyRequiredFields: Joi.object().optional().allow(null),
  formIsValid: Joi.boolean().optional().allow(null),
  formWillSubmit: Joi.boolean().optional().allow(null),

  // Información técnica (campos exactos Prisma)
  userAgent: Joi.string().optional().allow(null),
  ipAddress: Joi.string().optional().allow(null),
  pageLoadTime: Joi.number().integer().optional().allow(null),

  // Métricas de tiempo (campos exactos Prisma)
  clientGeneratedAt: Joi.date().optional().allow(null),
  timeToGenerate: Joi.number().integer().optional().allow(null),
  timeToSend: Joi.number().integer().optional().allow(null)
});

// Schema legacy para compatibilidad con frontend (se mapea a sessionSchema)
export const sessionDataSchema = Joi.object({
  // IDs compatibles
  sessionId: Joi.string().required(),
  visitorId: Joi.string().required(), 
  businessId: Joi.number().integer().required(),
  
  // Permitir campos anidados del frontend pero mapearlos a campos planos
  deviceInfo: Joi.object({
    type: Joi.string().optional(),
    userAgent: Joi.string().optional(),
    deviceType: Joi.string().optional(),
    os: Joi.string().optional(),
    browser: Joi.string().optional(),
    operatingSystem: Joi.string().optional(),
    screenSize: Joi.string().optional(),
    screenResolution: Joi.string().optional(),
    viewportSize: Joi.string().optional(),
    language: Joi.string().optional(),
    timezone: Joi.string().optional()
  }).optional(),
  
  pageInfo: Joi.object({
    url: Joi.string().uri().optional(),
    title: Joi.string().optional(),
    referrer: Joi.string().optional()
  }).optional(),
  
  ipLocation: Joi.object({
    ip: Joi.string().optional(),
    country: Joi.string().optional(),
    region: Joi.string().optional(),
    city: Joi.string().optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    timezone: Joi.string().optional()
  }).optional(),
  
  userBehavior: Joi.object({
    sessionStartTime: Joi.string().isoDate().optional(),
    lastActivity: Joi.string().isoDate().optional(),
    pagesViewed: Joi.number().integer().min(0).optional(),
    timeOnSite: Joi.number().integer().min(0).optional(),
    scrollDepthMax: Joi.number().integer().min(0).max(100).optional(),
    currentUrl: Joi.string().uri().optional(),
    referrer: Joi.string().optional(),
    isActive: Joi.boolean().optional()
  }).optional(),
  
  // Campos directos también permitidos (compatibilidad)
  startedAt: Joi.string().isoDate().optional(),
  fingerprint: Joi.string().optional(),
  userAgent: Joi.string().optional(),
  deviceType: Joi.string().optional(),
  ipAddress: Joi.string().optional(),
  country: Joi.string().optional(),
  referrer: Joi.string().optional(),
  
  // Permitir cualquier campo adicional para compatibilidad
  metadata: Joi.object().optional()
}).unknown(true);

export const trackingEventDataSchema = trackingEventSchema;

// ============================================
// ESQUEMAS PRINCIPALES DE PAYLOADS
// ============================================

/**
 * Schema para eventos compatible con frontend
 */
export const frontendEventSchema = Joi.object({
  eventType: Joi.string().required(),
  eventData: Joi.object().optional(),
  pageUrl: Joi.string().uri().required(),
  timestamp: Joi.string().isoDate().required(),
  metadata: Joi.object().optional(),
  
  // Campos opcionales que el backend puede requerir
  businessId: Joi.number().integer().optional(),
  visitorId: Joi.string().uuid().optional(), 
  sessionId: Joi.string().uuid().optional()
});

/**
 * Schema para lotes de eventos (batch events) - COMPATIBLE CON FRONTEND
 */
export const batchEventsPayloadSchema = Joi.object({
  sessionData: sessionDataSchema.required(),
  events: Joi.array().items(frontendEventSchema).min(1).required()
}).required();

/**
 * Schema para heartbeat de sesión - COMPATIBLE CON FRONTEND
 */
export const heartbeatPayloadSchema = Joi.object({
  // Frontend envía sessionId, no id
  sessionId: Joi.string().uuid().required(),
  visitorId: Joi.string().uuid().required(),
  businessId: Joi.number().integer().required(),
  timestamp: Joi.string().isoDate().required(),
  isActive: Joi.boolean().required(),
  
  // Campos opcionales que puede enviar el frontend
  pageUrl: Joi.string().uri().optional(),
  totalActiveTime: Joi.number().integer().min(0).optional(),
  events: Joi.array().items(Joi.any()).optional(),
  
  // Compatibilidad opcional con estructura legacy
  userBehavior: Joi.object({
    sessionStartTime: Joi.string().isoDate().optional(),
    lastActivity: Joi.string().isoDate().optional(),
    pagesViewed: Joi.number().integer().min(0).optional(),
    timeOnSite: Joi.number().integer().min(0).optional(),
    scrollDepthMax: Joi.number().integer().min(0).max(100).optional(),
    scrollDepth: Joi.number().integer().min(0).max(100).optional(),
    currentUrl: Joi.string().uri().optional(),
    referrer: Joi.string().optional(),
    initialUrl: Joi.string().uri().optional(),
    initialTitle: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    clicks: Joi.number().integer().min(0).optional(),
    formInteractions: Joi.number().integer().min(0).optional()
  }).optional(),
  
  id: Joi.string().uuid().optional(),
  lastActivityAt: Joi.date().optional(),
  duration: Joi.string().optional()
}).unknown(true);

/**
 * Schema para finalización de sesión - COMPATIBLE CON FRONTEND
 */
export const sessionEndPayloadSchema = Joi.object({
  // El frontend envía campos directos, no sessionData
  sessionId: Joi.string().uuid().required(),
  visitorId: Joi.string().uuid().required(),
  businessId: Joi.number().integer().required(),
  endedAt: Joi.string().isoDate().required(),
  reason: Joi.string().optional(),
  
  // Campos opcionales
  totalDuration: Joi.number().integer().min(0).optional(),
  pageViews: Joi.number().integer().min(0).optional(),
  events: Joi.array().items(trackingEventDataSchema).optional().default([]),
  
  // Compatibilidad con estructura legacy
  sessionData: sessionDataSchema.optional()
}).unknown(true);

/**
 * Schema para el inicio de sesión (start-session) - COMPATIBLE CON FRONTEND
 */
export const startSessionPayloadSchema = sessionDataSchema.required();

// ============================================
// ESQUEMAS PARA OTROS ENDPOINTS
// ============================================

/**
 * Schema para health check (sin payload, solo respuesta)
 */
export const healthCheckResponseSchema = Joi.object({
  status: Joi.string().valid('ok', 'error').required(),
  timestamp: Joi.string().isoDate().required(),
  services: Joi.object({
    database: Joi.string().valid('connected', 'disconnected').required(),
    redis: Joi.string().valid('connected', 'disconnected').optional()
  }).required(),
  version: Joi.string().required()
});

/**
 * Schema para respuestas de API de tracking
 */
export const trackingApiResponseSchema = Joi.object({
  success: Joi.boolean().required(),
  message: Joi.string().optional(),
  data: Joi.any().optional(),
  errors: Joi.array().items(Joi.string()).optional()
});

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida un payload de lote de eventos
 */
export function validateBatchEventsPayload(payload: any): { isValid: boolean; error?: any; value?: any } {
  const { error, value } = batchEventsPayloadSchema.validate(payload, {
    abortEarly: false,
    allowUnknown: true,  // Permitir campos desconocidos del cliente v2.6.0
    stripUnknown: false  // No eliminar campos desconocidos
  });
  
  return {
    isValid: !error,
    error: error?.details,
    value
  };
}

/**
 * Valida un payload de heartbeat
 */
export function validateHeartbeatPayload(payload: any): { isValid: boolean; error?: any; value?: any } {
  const { error, value } = heartbeatPayloadSchema.validate(payload, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });
  
  return {
    isValid: !error,
    error: error?.details,
    value
  };
}

/**
 * Valida un payload de finalización de sesión
 */
export function validateSessionEndPayload(payload: any): { isValid: boolean; error?: any; value?: any } {
  const { error, value } = sessionEndPayloadSchema.validate(payload, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });
  
  return {
    isValid: !error,
    error: error?.details,
    value
  };
}

/**
 * Valida un payload de inicio de sesión
 */
export function validateStartSessionPayload(payload: any): { isValid: boolean; error?: any; value?: any } {
  const { error, value } = startSessionPayloadSchema.validate(payload, {
    abortEarly: false,
    allowUnknown: true, // Permitir campos adicionales del frontend
    stripUnknown: false
  });
  
  return {
    isValid: !error,
    error: error?.details,
    value
  };
}


// ============================================
// MIDDLEWARES EXPRESS
// ============================================

import { Request, Response, NextFunction } from 'express';


/**
 * Middleware para validar lotes de eventos
 */
export function validateBatchEvents(req: Request, res: Response, next: NextFunction) {
  console.log('🔍 [VALIDATION BATCH] Payload recibido:', JSON.stringify(req.body, null, 2));
  
  const result = validateBatchEventsPayload(req.body);
  
  console.log('🔍 [VALIDATION BATCH] Resultado validación:', { isValid: result.isValid, error: result.error });
  
  if (!result.isValid) {
    console.error('❌ [VALIDATION BATCH] Errores detallados:', result.error);
    return res.status(400).json({
      success: false,
      message: 'Payload de lote de eventos inválido',
      errors: result.error?.map((err: any) => `${err.path.join('.')}: ${err.message}`) || []
    });
  }
  
  console.log('✅ [VALIDATION BATCH] Payload validado correctamente');
  req.body = result.value; // Usar datos sanitizados y transformados
  next();
}

/**
 * Middleware para validar heartbeat
 */
export function validateHeartbeat(req: Request, res: Response, next: NextFunction) {
  console.log('🔍 [VALIDATION HEARTBEAT] Payload recibido:', JSON.stringify(req.body, null, 2));
  
  const result = validateHeartbeatPayload(req.body);
  
  console.log('🔍 [VALIDATION HEARTBEAT] Resultado validación:', { isValid: result.isValid, error: result.error });
  
  if (!result.isValid) {
    console.error('❌ [VALIDATION HEARTBEAT] Error en payload:', result.error);
    return res.status(400).json({
      success: false,
      message: 'Payload de heartbeat inválido',
      errors: result.error?.map((err: any) => `${err.path.join('.')}: ${err.message}`) || []
    });
  }
  
  console.log('✅ [VALIDATION HEARTBEAT] Payload validado correctamente');
  req.body = result.value; // Usar datos sanitizados
  next();
}

/**
 * Middleware para validar finalización de sesión
 */
export function validateSessionEnd(req: Request, res: Response, next: NextFunction) {
  const result = validateSessionEndPayload(req.body);
  
  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Payload de finalización de sesión inválido',
      errors: result.error?.map((err: any) => `${err.path.join('.')}: ${err.message}`) || []
    });
  }
  
  req.body = result.value; // Usar datos sanitizados
  next();
}

/**
 * Middleware para validar inicio de sesión
 */
export function validateStartSession(req: Request, res: Response, next: NextFunction) {
  const result = validateStartSessionPayload(req.body);
  
  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Payload de inicio de sesión inválido',
      errors: result.error?.map((err: any) => `${err.path.join('.')}: ${err.message}`) || []
    });
  }
  
  req.body = result.value; // Usar datos sanitizados
  next();
}


// ============================================
// EXPORTACIONES
// ============================================

export default {
  schemas: {
    batchEventsPayloadSchema,
    heartbeatPayloadSchema,
    sessionEndPayloadSchema,
    startSessionPayloadSchema
  },
  validators: {
    validateBatchEventsPayload,
    validateHeartbeatPayload,
    validateSessionEndPayload,
    validateStartSessionPayload
  },
  middlewares: {
    validateBatchEvents,
    validateHeartbeat,
    validateSessionEnd,
    validateStartSession
  }
};
