/**
 * Meta Conversions API (Server-Side) Integration
 * Permite enviar eventos directamente desde el servidor a Meta
 * para mejorar la precisión del tracking y evitar bloqueadores
 */

import axios from 'axios';

// Valores de configuración desde .env
// En desarrollo, asegúrate de tener estas variables definidas en .env
const getEnvVar = (key: string, fallback = '') => {
  if (typeof import.meta?.env?.[key] !== 'undefined') {
    return import.meta.env[key] as string;
  }
  return fallback;
};

const META_CAPI_TOKEN = getEnvVar('VITE_META_CAPI_TOKEN', '');
const PIXEL_ID = getEnvVar('VITE_META_PIXEL_ID', '3094329594078626');

const API_VERSION = 'v17.0'; // Actualizar según versión más reciente

// Flag para detectar si estamos en desarrollo o producción
const IS_DEVELOPMENT = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Tipos para mejor tipado
export interface UserData {
  external_id?: string;     // ID de visitante (hash recomendado)
  client_ip_address?: string;
  client_user_agent?: string;
  email?: string;           // Preferible hash
  phone?: string;           // Preferible hash
  fbc?: string;             // Facebook click ID
  fbp?: string;             // Facebook browser ID
  subscription_id?: string;
  fb_login_id?: string;
  lead_id?: string;
}

export interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  order_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  [key: string]: any;      // Permite datos personalizados adicionales
}

export interface ServerEventConfig {
  eventName: string;
  userData: UserData;
  customData: CustomData;
  eventId?: string;
}

/**
 * Envía un evento a la Meta Conversions API
 * @param config Configuración del evento a enviar
 * @returns Respuesta de la API de Meta o error
 */
export async function sendServerEvent(config: ServerEventConfig): Promise<any> {
  const { eventName, userData, customData, eventId } = config;

  // En desarrollo, simulamos el envío sin necesidad de token
  if (IS_DEVELOPMENT) {
    console.log('🧪 [Meta CAPI] Simulando envío en desarrollo del evento:', eventName);
    console.log('📋 Datos:', { userData, customData });
    return { 
      success: true, 
      mock: true,
      event_name: eventName,
      timestamp: Date.now()
    };
  }

  // En producción verificamos el token
  if (!META_CAPI_TOKEN) {
    console.error('❌ [Meta CAPI] Error: META_CAPI_TOKEN no está configurado');
    return { error: 'Token no configurado', development: IS_DEVELOPMENT };
  }

  try {
    const endpoint = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;
    
    // Preparar payload según especificaciones de Meta
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          event_source_url: customData.page_url || '',
          action_source: 'website',
          user_data: userData,
          custom_data: customData
        }
      ],
      access_token: META_CAPI_TOKEN
    };

    console.log(`📊 [Meta CAPI] Enviando evento ${eventName}...`);
    const response = await axios.post(endpoint, payload);
    console.log(`✅ [Meta CAPI] Evento ${eventName} enviado:`, response.data);
    return response.data;
    } catch (error) {
    console.error(`❌ [Meta CAPI] Error al enviar evento ${eventName}:`, error);
    // Structural type guard for Axios-like errors
    if (
      error &&
      typeof error === 'object' &&
      'isAxiosError' in error &&
      (error as { isAxiosError?: boolean }).isAxiosError &&
      'message' in error
    ) {
      const axiosError = error as { response?: { data: any }; message: string };
      return { error: axiosError.message, details: axiosError.response?.data || {} };
    }

    // Fallback for generic errors that still have a message
    if (error && typeof error === 'object' && 'message' in error) {
      return { error: String((error as { message: unknown }).message), details: {} };
    }

    // Final fallback for anything else
    return { error: String(error), details: {} };
  }
}

/**
 * Función de ayuda para PageView
 */
export async function trackServerPageView(visitorData: any, utmData: any, pageUrl?: string): Promise<any> {
  const userData: UserData = {
    external_id: visitorData.id || visitorData.fingerprint || '',
    client_ip_address: visitorData.clientIP || '',
    client_user_agent: visitorData.browser || ''
  };

  const customData: CustomData = {
    ...utmData,
    page_url: pageUrl || (typeof window !== 'undefined' ? window.location.href : '')
  };

  return sendServerEvent({
    eventName: 'PageView',
    userData,
    customData
  });
}

/**
 * Función de ayuda para ViewContent
 */
export async function trackServerViewContent(
  visitorData: any,
  utmData: any,
  contentId: string,
  contentType: string = 'product',
  contentName?: string
): Promise<any> {
  const userData: UserData = {
    external_id: visitorData.id || visitorData.fingerprint || '',
    client_ip_address: visitorData.clientIP || '',
    client_user_agent: visitorData.browser || ''
  };

  const customData: CustomData = {
    ...utmData,
    content_ids: [contentId],
    content_type: contentType,
    content_name: contentName || 'Recetas Naturales para Perros'
  };

  return sendServerEvent({
    eventName: 'ViewContent',
    userData,
    customData
  });
}

/**
 * Función de ayuda para Purchase
 */
export async function trackServerPurchase(
  visitorData: any,
  utmData: any,
  value: number,
  currency: string = 'USD',
  contentIds: string[] = [],
  orderId?: string
): Promise<any> {
  const userData: UserData = {
    external_id: visitorData.id || visitorData.fingerprint || '',
    client_ip_address: visitorData.clientIP || '',
    client_user_agent: visitorData.browser || ''
  };

  // Si tenemos email (de un Lead), agregarlo al userData
  if (visitorData.email) {
    userData.email = visitorData.email; // Idealmente esto debería ser hasheado
  }

  const customData: CustomData = {
    ...utmData,
    value,
    currency,
    content_ids: contentIds,
    content_type: 'product',
    order_id: orderId || `order_${Date.now()}`
  };

  return sendServerEvent({
    eventName: 'Purchase',
    userData,
    customData
  });
}

export default {
  sendServerEvent,
  trackServerPageView,
  trackServerViewContent,
  trackServerPurchase
};
