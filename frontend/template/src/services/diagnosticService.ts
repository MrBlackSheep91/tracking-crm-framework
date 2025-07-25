/**
 * Servicio de diagnóstico para rastrear parámetros UTM y URLs
 * Útil para depuración de problemas con Meta Ads y webhooks
 */

// Importar configuración centralizada
import { N8N_WEBHOOKS, trackingLog, trackingError } from '../config/tracking-config.js';

// URL del webhook de n8n para diagnóstico (usando configuración centralizada)
const DIAGNOSTIC_ENDPOINT = N8N_WEBHOOKS.utmDiagnostics;

/**
 * Registra la URL de entrada y los parámetros UTM procesados
 */
export const logEntryPoint = (): void => {
  try {
    // Capturar URL completa de entrada
    const fullUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Extraer solo los parámetros UTM y fbclid de la URL
    const rawUtmParams: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid'].forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        rawUtmParams[param] = value;
      }
    });

    // Construir payload con información de diagnóstico
    const payload = {
      timestamp: new Date().toISOString(),
      sessionId: generateSessionId(),
      fullUrl,
      rawUtmParams,
      userAgent: navigator.userAgent
    };

    // Enviar datos a endpoint de diagnóstico
    sendDiagnosticData('entry_point', payload);
    
    console.log('📊 [DIAGNÓSTICO] Entrada registrada:', payload);
  } catch (error) {
    console.error('Error al registrar entrada:', error);
  }
};

/**
 * Registra los parámetros UTM procesados antes de enviarlos a webhook
 */
export const logWebhookPayload = (
  webhookName: string, 
  processedUtmParams: Record<string, any>,
  additionalData: Record<string, any> = {}
): void => {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      sessionId: generateSessionId(),
      webhookName,
      processedUtmParams,
      additionalData
    };

    sendDiagnosticData('webhook_payload', payload);
    
    console.log(`📊 [DIAGNÓSTICO] Payload de webhook '${webhookName}':`, payload);
  } catch (error) {
    console.error('Error al registrar payload de webhook:', error);
  }
};

/**
 * Envía datos de diagnóstico al endpoint configurado
 */
const sendDiagnosticData = (type: string, data: Record<string, any>): void => {
  // Solo enviar si estamos en producción o si hay un parámetro de debug
  if (!shouldSendDiagnosticData()) {
    return;
  }

  const payload = {
    type,
    data,
    environment: getEnvironment()
  };

  fetch(DIAGNOSTIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    // No esperar a que se complete para no afectar el rendimiento
    keepalive: true
  }).catch(error => {
    // Silenciar errores para no afectar la experiencia del usuario
    console.warn('Error enviando datos de diagnóstico:', error);
  });
};

/**
 * Genera un ID de sesión único o recupera uno existente
 */
const generateSessionId = (): string => {
  try {
    let sessionId = sessionStorage.getItem('diagnostic_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('diagnostic_session_id', sessionId);
    }
    return sessionId;
  } catch (e) {
    return `${Date.now()}-fallback`;
  }
};

/**
 * Determina el entorno actual (producción o desarrollo)
 */
const getEnvironment = (): string => {
  // Métodos para detectar si estamos en producción
  try {
    // Verificar si la URL es de producción
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && 
        !hostname.includes('.local') && 
        !hostname.includes('127.0.0.1')) {
      return 'production';
    }
    
    // Verificar si hay un flag de entorno guardado
    const envFlag = localStorage.getItem('environment');
    if (envFlag === 'production') {
      return 'production';
    }
    
    // Por defecto, asumir desarrollo
    return 'development';
  } catch (e) {
    return 'development';
  }
};

/**
 * Determina si se deben enviar datos de diagnóstico
 */
const shouldSendDiagnosticData = (): boolean => {
  // Enviar en estas condiciones:
  // 1. Estamos en producción
  // 2. Hay parámetro de URL para debug
  // 3. Flag en localStorage para debug
  try {
    const isProduction = getEnvironment() === 'production';
    const hasDebugParam = new URLSearchParams(window.location.search).get('utm_debug') === 'true';
    const hasDebugFlag = localStorage.getItem('utm_debug') === 'true';
    
    return isProduction || hasDebugParam || hasDebugFlag;
  } catch (e) {
    return false;
  }
};
