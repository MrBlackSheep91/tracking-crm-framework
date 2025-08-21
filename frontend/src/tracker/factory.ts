/**
 * 🏭 FACTORY PARA CREAR INSTANCIAS DEL TRACKER
 * Funciones de conveniencia para inicializar el tracker con configuraciones predefinidas
 */

import { InnovaTracker } from './InnovaTracker';
import { TrackerConfig, DEFAULT_CONFIG } from '../types';

/**
 * Crea una instancia del tracker con configuración personalizada
 */
export const createInnovaTracker = (overrides: Partial<TrackerConfig> = {}): InnovaTracker => {
  const config = { ...DEFAULT_CONFIG, ...overrides };
  return new InnovaTracker(config);
};

/**
 * Crea una instancia para desarrollo con debug habilitado
 */
export function createDevelopmentTracker(options: Partial<TrackerConfig> = {}): InnovaTracker {
  const devConfig = {
    ...DEFAULT_CONFIG,
    debug: true,
    baseUrl: 'http://localhost:3001',
    autoStart: true,
    enableScrollTracking: true,
    enableActivityMonitoring: true,
    ...options,
  };

  // Asegurarse de que la configuración final cumple con TrackerConfig
  if (!devConfig.businessId) {
    throw new Error('businessId es requerido para inicializar el tracker.');
  }

  return new InnovaTracker(devConfig as TrackerConfig);
};

/**
 * Crea una instancia para producción optimizada
 */
export const createProductionTracker = (
  businessId: string,
  baseUrl: string,
  overrides: Partial<TrackerConfig> = {}
): InnovaTracker => {
  const prodConfig: TrackerConfig = {
    ...DEFAULT_CONFIG,
    businessId,
    baseUrl,
    debug: false,
    autoStart: true,
    enableScrollTracking: true,
    enableActivityMonitoring: true,
    ...overrides
  };
  
  return new InnovaTracker(prodConfig);
};

/**
 * Crea una instancia mínima solo para eventos básicos
 */
export const createMinimalTracker = (
  businessId: string,
  baseUrl: string,
  overrides: Partial<TrackerConfig> = {}
): InnovaTracker => {
  const minimalConfig: TrackerConfig = {
    ...DEFAULT_CONFIG,
    businessId,
    baseUrl,
    debug: false,
    enableScrollTracking: false,
    enableActivityMonitoring: false,
    heartbeatInterval: 60000, // 1 minuto
    inactivityTimeout: 300000, // 5 minutos
    ...overrides
  };
  
  return new InnovaTracker(minimalConfig);
};

/**
 * Crea una instancia para testing con configuración específica
 */
export const createTestTracker = (overrides: Partial<TrackerConfig> = {}): InnovaTracker => {
  const testConfig: TrackerConfig = {
    ...DEFAULT_CONFIG,
    debug: true,
    autoStart: false, // No iniciar automáticamente en tests
    baseUrl: 'http://localhost:3001',
    heartbeatInterval: 5000, // Más frecuente para tests
    inactivityTimeout: 10000, // Más corto para tests
    ...overrides
  };
  
  return new InnovaTracker(testConfig);
};

/**
 * Detecta automáticamente el entorno y crea la configuración apropiada
 */
export const createAutoConfigTracker = (
  businessId?: string,
  baseUrl?: string,
  overrides: Partial<TrackerConfig> = {}
): InnovaTracker => {
  // Detectar entorno - usar window para evitar dependencias de Node.js
  const isDevelopment = typeof window !== 'undefined' && (window as any).__DEVELOPMENT__;
  const isTest = typeof window !== 'undefined' && (window as any).__TEST__;
  
  if (isTest) {
    return createTestTracker(overrides);
  }
  
  if (isDevelopment) {
    return createDevelopmentTracker(overrides);
  }
  
  // Producción - requiere parámetros
  if (!businessId || !baseUrl) {
    throw new Error('businessId y baseUrl son requeridos para entorno de producción');
  }
  
  return createProductionTracker(businessId, baseUrl, overrides);
};

/**
 * Configuraciones predefinidas para diferentes tipos de negocio
 */
export const BUSINESS_PRESETS = {
  /**
   * Preset para restaurantes - enfoque en conversiones locales
   */
  restaurant: (businessId: string, baseUrl: string): TrackerConfig => ({
    ...DEFAULT_CONFIG,
    businessId,
    baseUrl,
    enableScrollTracking: true,
    enableActivityMonitoring: true,
    scrollZoneSize: 20, // Zonas más grandes para contenido visual
    inactivityTimeout: 45000, // 45 segundos - navegación rápida
    eventBufferSize: 5, // Buffers más pequeños para respuesta rápida
    onEventTrack: (event) => {
      // Tracking específico para restaurantes
      if (event.eventName.includes('menu') || event.eventName.includes('reserva')) {
        console.log('🍽️ Evento de restaurante:', event.eventName);
      }
    }
  }),

  /**
   * Preset para inmobiliarias - enfoque en tiempo de atención
   */
  realEstate: (businessId: string, baseUrl: string): TrackerConfig => ({
    ...DEFAULT_CONFIG,
    businessId,
    baseUrl,
    enableScrollTracking: true,
    enableActivityMonitoring: true,
    scrollZoneSize: 10, // Zonas detalladas para propiedades
    inactivityTimeout: 120000, // 2 minutos - navegación detallada
    activityUpdateInterval: 5000, // Actualización menos frecuente
    onEventTrack: (event) => {
      if (event.eventName.includes('property') || event.eventName.includes('contact')) {
        console.log('🏠 Evento inmobiliario:', event.eventName);
      }
    }
  }),

  /**
   * Preset para ecommerce - enfoque en conversiones
   */
  ecommerce: (businessId: string, baseUrl: string): TrackerConfig => ({
    ...DEFAULT_CONFIG,
    businessId,
    baseUrl,
    enableScrollTracking: true,
    enableActivityMonitoring: true,
    scrollZoneSize: 15, // Balance entre detalle y performance
    inactivityTimeout: 60000, // 1 minuto - decisión rápida
    eventBufferSize: 15, // Buffers más grandes para alta actividad
    onEventTrack: (event) => {
      if (event.eventName.includes('product') || event.eventName.includes('cart')) {
        console.log('🛒 Evento ecommerce:', event.eventName);
      }
    }
  }),

  /**
   * Preset para servicios profesionales - enfoque en leads
   */
  services: (businessId: string, baseUrl: string): TrackerConfig => ({
    ...DEFAULT_CONFIG,
    businessId,
    baseUrl,
    enableScrollTracking: true,
    enableActivityMonitoring: true,
    scrollZoneSize: 10, // Tracking detallado de contenido
    inactivityTimeout: 90000, // 1.5 minutos - lectura de contenido
    heartbeatInterval: 20000, // Heartbeat más frecuente
    onEventTrack: (event) => {
      if (event.eventName.includes('service') || event.eventName.includes('quote')) {
        console.log('💼 Evento de servicios:', event.eventName);
      }
    }
  })
};

/**
 * Crea un tracker con preset de negocio específico
 */
export const createBusinessTracker = (
  businessType: keyof typeof BUSINESS_PRESETS,
  businessId: string,
  baseUrl: string,
  overrides: Partial<TrackerConfig> = {}
): InnovaTracker => {
  const presetConfig = BUSINESS_PRESETS[businessType](businessId, baseUrl);
  const finalConfig = { ...presetConfig, ...overrides };
  
  return new InnovaTracker(finalConfig);
};
