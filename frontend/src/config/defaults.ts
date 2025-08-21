/**
 * ⚙️ CONFIGURACIÓN POR DEFECTO DEL TRACKING CRM FRAMEWORK
 * Valores predeterminados para una configuración óptima
 */

import { TrackerConfig } from '../types';

// Configuración por defecto para todos los entornos
export const DEFAULT_CONFIG: TrackerConfig = {
  // URLs y autenticación
  baseUrl: 'http://localhost:3001',
  businessId: '00000000-0000-0000-0000-000000000000',
  
  // Intervalos de tiempo (en milisegundos)
  heartbeatInterval: 30000,        // 30 segundos
  inactivityTimeout: 1800000,      // 30 minutos
  
  // Configuración de buffering
  eventBufferSize: 100,
  
  // Funcionalidades
  enableScrollTracking: true,
  enableActivityMonitoring: true,
  autoStart: true,
  
  // Configuración de retry
  maxRetries: 3,
  retryDelay: 1000,
  
  // Debugging
  debug: false,
  
  // Callbacks por defecto (vacíos)
  onSessionStart: () => {},
  onSessionEnd: () => {},
  onEventTrack: () => {},
  onError: () => {}
};

// Configuración específica para desarrollo
export const DEVELOPMENT_CONFIG: Partial<TrackerConfig> = {
  debug: true,
  baseUrl: 'http://localhost:3001',
  businessId: 'dev-business-id'
};

// Configuración específica para producción
export const PRODUCTION_CONFIG: Partial<TrackerConfig> = {
  debug: false
};

// Configuración específica para testing
export const TESTING_CONFIG: Partial<TrackerConfig> = {
  debug: true,
  baseUrl: 'http://localhost:3001',
  businessId: 'test-business-id'
};

export default DEFAULT_CONFIG;
