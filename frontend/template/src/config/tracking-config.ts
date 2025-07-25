/**
 * Configuración centralizada para URLs de tracking
 * Maneja automáticamente producción vs desarrollo
 */

// Detectar entorno
const isProduction = import.meta.env.PROD || window.location.hostname.includes('nat-pets.com');
const isDevelopment = !isProduction;

// URLs base según entorno
const BASE_URLS = {
  production: {
    n8n: 'https://n8n.nat-pets.com',
    api: 'https://tracker.nat-pets.com' // Modificado para apuntar al VPS con visitor-tracker
  },
  development: {
    n8n: 'http://localhost:5678',
    api: '/api' // Proxy de Vite
  }
};

// Configuración actual según entorno
const currentConfig = isProduction ? BASE_URLS.production : BASE_URLS.development;

// URLs de webhooks de n8n
export const N8N_WEBHOOKS = {
  sessionTracking: `${currentConfig.n8n}/webhook/session-tracking`,
  heartbeat: `${currentConfig.n8n}/webhook/heartbeat`,
  visitorTracking: `${currentConfig.n8n}/webhook/visitor-tracking`,
  leadCapture: `${currentConfig.n8n}/webhook/Lead-Capture`,
  whatsappTracking: `${currentConfig.n8n}/webhook/Whatsapp-Tracking`,
  utmDiagnostics: `${currentConfig.n8n}/webhook/UTM-Diagnostics`
};

// URLs de API interna
export const API_ENDPOINTS = {
  track: `${currentConfig.api}/track`,
  lead: `${currentConfig.api}/lead`,
  session: `${currentConfig.api}/session`
};

// Configuración de tracking
export const TRACKING_CONFIG = {
  // Intervalos de tiempo
  heartbeatInterval: isDevelopment ? 15000 : 30000, // 15s dev, 30s prod
  inactivityTimeout: isDevelopment ? 20000 : 300000, // 20s dev, 5min prod
  
  // Configuración de debug
  debug: {
    sessionDebug: isDevelopment,
    activityDebug: isDevelopment,
    scrollDebug: isDevelopment,
    apiDebug: isDevelopment
  },
  
  // Configuración de retry
  retry: {
    maxAttempts: 3,
    delay: 1000,
    exponentialBackoff: true
  },
  
  // Configuración de buffer
  buffer: {
    maxEvents: 100,
    flushInterval: isDevelopment ? 10000 : 30000 // 10s dev, 30s prod
  }
};

// Business ID por defecto
export const DEFAULT_BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

// Información del entorno
export const ENVIRONMENT_INFO = {
  isProduction,
  isDevelopment,
  hostname: window.location.hostname,
  currentConfig: currentConfig
};

// Función para logging condicional
export const trackingLog = (module: string, message: string, data?: any) => {
  if (TRACKING_CONFIG.debug.apiDebug) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${module}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
};

// Función para logging de errores (siempre activo)
export const trackingError = (module: string, message: string, error: any) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${module}] ERROR`;
  console.error(`${prefix} ${message}`, error);
};

// Exportar configuración completa
export default {
  N8N_WEBHOOKS,
  API_ENDPOINTS,
  TRACKING_CONFIG,
  DEFAULT_BUSINESS_ID,
  ENVIRONMENT_INFO,
  trackingLog,
  trackingError
}; 