/**
 * ⚡ CONFIGURACIÓN DE EVENTOS CRÍTICOS
 * Sistema de priorización inteligente para optimizar el envío de datos
 */

import { EventPriority } from '../types';

// Configuración de eventos críticos que requieren envío inmediato
export const CRITICAL_EVENTS_CONFIG = {
  // Eventos que requieren envío inmediato (0-100ms)
  IMMEDIATE: {
    // Conversiones y leads
    'conversion': ['lead_submission', 'form_submit', 'purchase', 'signup'],
    'form_interaction': ['form_submit', 'lead_form_submit'],
    'user_interaction': ['cta_click', 'buy_now_click', 'contact_click'],
    
    // Eventos de sistema críticos
    'system': ['session_start', 'session_end', 'error_critical'],
    
    // Eventos de negocio importantes
    'custom': ['lead_generated', 'conversion_completed', 'payment_initiated']
  },

  // Eventos de alta prioridad (1-5 segundos)
  HIGH: {
    'page_view': ['landing_page_view', 'service_page_view', 'pricing_view'],
    'navigation': ['page_change', 'external_link_click'],
    'user_interaction': ['button_click', 'menu_click', 'search'],
    'engagement': ['video_play', 'document_download', 'content_share'],
    'system': ['visibility_change', 'focus_change']
  },

  // Eventos normales (batch cada 10 eventos o 30 segundos)
  NORMAL: {
    'user_interaction': ['hover', 'focus', 'blur', 'text_select'],
    'navigation': ['scroll_milestone', 'time_milestone'],
    'engagement': ['content_interaction', 'social_interaction'],
    'system': ['heartbeat', 'activity_update']
  },

  // Eventos de baja prioridad (batch cada 50 eventos o 5 minutos)
  LOW: {
    'engagement': ['mouse_movement', 'passive_scroll', 'idle_detection'],
    'system': ['performance_metric', 'debug_info'],
    'custom': ['analytics_event', 'tracking_test']
  },

  // Eventos de análisis (envío al finalizar sesión)
  ANALYTICS: {
    'engagement': ['scroll_attention_map', 'time_on_page_zones', 'interaction_heatmap'],
    'system': ['session_analytics', 'performance_analytics'],
    'custom': ['behavior_analytics', 'user_journey_analytics']
  }
};

// Configuración de timeouts y límites
export const SESSION_CONFIG = {
  // Timeouts para diferentes tipos de buffering
  IMMEDIATE_FLUSH_DELAY: 100,      // 100ms para eventos críticos
  HIGH_PRIORITY_DELAY: 2000,       // 2 segundos para eventos importantes
  NORMAL_BATCH_SIZE: 10,           // 10 eventos para batch normal
  NORMAL_BATCH_TIMEOUT: 30000,     // 30 segundos máximo para batch normal
  LOW_BATCH_SIZE: 50,              // 50 eventos para batch de baja prioridad
  LOW_BATCH_TIMEOUT: 300000,       // 5 minutos para batch de baja prioridad

  // Configuración de retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,               // 1 segundo delay inicial
  RETRY_BACKOFF_MULTIPLIER: 2,     // Multiplicador exponencial

  // Configuración de almacenamiento local
  LOCAL_STORAGE_MAX_ITEMS: 100,    // Máximo de eventos en localStorage
  LOCAL_STORAGE_MAX_AGE: 86400000  // 24 horas en millisegundos
};

/**
 * Determina la prioridad de un evento basado en su tipo y nombre
 */
export const getEventPriority = (eventType: string, eventName: string): EventPriority => {
  // Verificar eventos inmediatos
  const immediateEvents = CRITICAL_EVENTS_CONFIG.IMMEDIATE[eventType as keyof typeof CRITICAL_EVENTS_CONFIG.IMMEDIATE] as string[] | undefined;
  if (immediateEvents?.includes(eventName)) {
    return 'immediate';
  }

  // Verificar eventos de alta prioridad
  const highEvents = CRITICAL_EVENTS_CONFIG.HIGH[eventType as keyof typeof CRITICAL_EVENTS_CONFIG.HIGH] as string[] | undefined;
  if (highEvents?.includes(eventName)) {
    return 'high';
  }

  // Verificar eventos de análisis
  const analyticsEvents = CRITICAL_EVENTS_CONFIG.ANALYTICS[eventType as keyof typeof CRITICAL_EVENTS_CONFIG.ANALYTICS] as string[] | undefined;
  if (analyticsEvents?.includes(eventName)) {
    return 'analytics';
  }

  // Verificar eventos de baja prioridad
  const lowEvents = CRITICAL_EVENTS_CONFIG.LOW[eventType as keyof typeof CRITICAL_EVENTS_CONFIG.LOW] as string[] | undefined;
  if (lowEvents?.includes(eventName)) {
    return 'low';
  }

  // Por defecto, eventos normales
  return 'normal';
};

/**
 * Verifica si un evento es crítico y requiere envío inmediato
 */
export const isCriticalEvent = (eventType: string, eventName: string): boolean => {
  return getEventPriority(eventType, eventName) === 'immediate';
};

/**
 * Verifica si un evento es de análisis y debe enviarse al final de sesión
 */
export const isAnalyticsEvent = (eventType: string, eventName: string): boolean => {
  return getEventPriority(eventType, eventName) === 'analytics';
};

/**
 * Obtiene el timeout apropiado para un tipo de prioridad
 */
export const getTimeoutForPriority = (priority: EventPriority): number => {
  switch (priority) {
    case 'immediate':
      return SESSION_CONFIG.IMMEDIATE_FLUSH_DELAY;
    case 'high':
      return SESSION_CONFIG.HIGH_PRIORITY_DELAY;
    case 'normal':
      return SESSION_CONFIG.NORMAL_BATCH_TIMEOUT;
    case 'low':
      return SESSION_CONFIG.LOW_BATCH_TIMEOUT;
    case 'analytics':
      return 0; // Se envían al finalizar sesión
    default:
      return SESSION_CONFIG.NORMAL_BATCH_TIMEOUT;
  }
};

/**
 * Obtiene el tamaño de batch apropiado para un tipo de prioridad
 */
export const getBatchSizeForPriority = (priority: EventPriority): number => {
  switch (priority) {
    case 'immediate':
      return 1; // Envío inmediato individual
    case 'high':
      return 5; // Batches pequeños para alta prioridad
    case 'normal':
      return SESSION_CONFIG.NORMAL_BATCH_SIZE;
    case 'low':
      return SESSION_CONFIG.LOW_BATCH_SIZE;
    case 'analytics':
      return 999; // Sin límite, se envían todos al final
    default:
      return SESSION_CONFIG.NORMAL_BATCH_SIZE;
  }
};

/**
 * Configuración específica para diferentes tipos de eventos de negocio
 */
export const BUSINESS_EVENT_CONFIG = {
  // Eventos específicos de Innova Marketing
  INNOVA_EVENTS: {
    // Landing pages por nicho
    'niche_interaction': {
      priority: 'high',
      events: ['restaurants_cta', 'inmobiliarias_cta', 'ecommerce_cta', 'servicios_cta']
    },
    
    // Interacciones con servicios
    'service_interaction': {
      priority: 'high', 
      events: ['service_inquiry', 'quote_request', 'consultation_request']
    },
    
    // Club y membresías
    'membership_interaction': {
      priority: 'immediate',
      events: ['club_signup', 'premium_upgrade', 'directory_access']
    },
    
    // Blog y contenido
    'content_interaction': {
      priority: 'normal',
      events: ['blog_read', 'category_filter', 'post_share', 'newsletter_signup']
    }
  },

  // Eventos de conversión por valor
  CONVERSION_VALUES: {
    'lead_magnet_download': { priority: 'high', value: 5 },
    'contact_form_submit': { priority: 'immediate', value: 10 },
    'service_inquiry': { priority: 'immediate', value: 25 },
    'quote_request': { priority: 'immediate', value: 50 },
    'club_signup': { priority: 'immediate', value: 100 },
    'premium_upgrade': { priority: 'immediate', value: 500 }
  }
};

/**
 * Obtiene la configuración específica para eventos de negocio de Innova
 */
export const getInnovaEventConfig = (eventName: string) => {
  // Buscar en eventos específicos de Innova
  for (const [category, config] of Object.entries(BUSINESS_EVENT_CONFIG.INNOVA_EVENTS)) {
    if (config.events.includes(eventName)) {
      return {
        category,
        priority: config.priority,
        isInnovaEvent: true
      };
    }
  }

  // Buscar en valores de conversión
  const conversionConfig = BUSINESS_EVENT_CONFIG.CONVERSION_VALUES[eventName as keyof typeof BUSINESS_EVENT_CONFIG.CONVERSION_VALUES];
  if (conversionConfig) {
    return {
      category: 'conversion',
      priority: conversionConfig.priority,
      value: conversionConfig.value,
      isConversion: true
    };
  }

  return null;
};

/**
 * Función para registrar eventos personalizados dinámicamente
 */
export const registerCustomCriticalEvent = (
  eventType: string, 
  eventName: string, 
  priority: EventPriority
): void => {
  const priorityKey = priority.toUpperCase() as keyof typeof CRITICAL_EVENTS_CONFIG;
  const priorityConfig = CRITICAL_EVENTS_CONFIG[priorityKey];
  
  // Usar type assertion para acceder dinámicamente a la propiedad
  const typedPriorityConfig = priorityConfig as Record<string, string[]>;
  
  if (!typedPriorityConfig[eventType]) {
    typedPriorityConfig[eventType] = [];
  }
  
  if (!typedPriorityConfig[eventType].includes(eventName)) {
    typedPriorityConfig[eventType].push(eventName);
  }
};
