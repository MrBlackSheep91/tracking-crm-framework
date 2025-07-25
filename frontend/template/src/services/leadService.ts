import * as React from 'react';
import ReactPixel from 'react-facebook-pixel';

import { logWebhookPayload } from './diagnosticService';

// --- Interfaces ---

export interface LeadMetadata {
  leadType: 'book_purchase' | 'free_guide';
  interestedInBook: boolean;
  productName: string;
  // Campos adicionales que pueden ser enviados en el payload
  phone?: string;
  company?: string;
  jobTitle?: string;
  formId?: string;
  emailSubject?: string;
  emailNumber?: number;
  customFields?: Record<string, any>;
}

export interface CampaignData {
  campaignId: string;
  processType: 'sales' | 'nurture';
  entryDate: string;
  campaignName: string;
  currentStep?: number;
  status: 'new' | 'active' | 'completed' | 'paused' | 'cancelled';
  source?: string;  // Fuente de la campaña (utm_source)
  medium?: string;  // Medio de la campaña (utm_medium)
  content?: string; // ID del anuncio específico (utm_content/ad.id)
  term?: string;    // ID del conjunto de anuncios (utm_term/adset.id)
  fbclid?: string;  // Facebook click ID para seguimiento
}

interface SaveLeadParams {
  name: string;
  email: string;
  leadMetadata?: LeadMetadata;
  userLocation: any;
  pageStartTime: React.RefObject<number>;
  getUtmParams: () => any;
}

// --- Helper Functions ---

// Importar configuración centralizada
import { N8N_WEBHOOKS, trackingLog, trackingError } from '../config/tracking-config.js';

// Webhook URL for n8n (usando configuración centralizada)
const N8N_WEBHOOK_URL = N8N_WEBHOOKS.leadCapture;

const getN8NWebhookUrl = (): string => {
  return N8N_WEBHOOK_URL;
};

/**
 * Construye un payload de lead optimizado y alineado con el schema de Prisma
 * 
 * @param params - Parámetros para la creación del lead
 * @param visitorId - ID de visitante para relacionar el lead
 * @returns Payload optimizado del lead o null si falta información esencial
 */
const buildLeadPayload = async (
  { name, email, leadMetadata, userLocation, pageStartTime, getUtmParams }: SaveLeadParams,
  visitorId: string
): Promise<Record<string, any> | null> => {
  // Verificar los parámetros obligatorios
  if (!email) {
    console.error('Email es obligatorio para crear un lead');
    return null;
  }

  // Datos básicos de tiempo y navegación
  const now = new Date();
  const localTime = now.toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const referrer = document?.referrer || 'direct';
  const currentUrl = window?.location?.href || '';
  const pageTitle = document?.title || '';
  
  // Calcular tiempo en página si está disponible
  const timeOnPageSeconds = pageStartTime?.current ? (now.getTime() - pageStartTime.current) / 1000 : 0;
  const scrollPercentage = typeof window !== 'undefined' && document?.body ? 
    Math.floor((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100) || 0 : 0;
  
  // Parámetros UTM y campaña
  const utmParams = getUtmParams ? getUtmParams() : {};
  
  // Verificar si hay datos del tracker de visitantes disponible
  let trackerSessionId = '';
  try {
    if (typeof localStorage !== 'undefined') {
      const trackerDataString = localStorage.getItem('tracker_data');
      if (trackerDataString) {
        const trackerData = JSON.parse(trackerDataString);
        trackerSessionId = trackerData?.sessionId || '';
      }
    }
  } catch (e) {
    console.error('Error al recuperar sessionId del tracker:', e);
  }

  // Usar el sessionId del tracker o generar uno válido
  const sessionId = trackerSessionId || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Datos del dispositivo/navegador
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
  const deviceType = isDesktop ? 'desktop' : 'mobile';
  
  // Determinar sistema operativo
  let os = 'Unknown';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iOS|iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
  
  // Determinar navegador
  let browser = 'Unknown';
  if (/Chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Safari/i.test(userAgent)) browser = 'Safari';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';
  
  // Datos de campaña
  const source = utmParams.utm_source || referrer || 'direct';
  const medium = utmParams.utm_medium || 'website';
  const campaignName = utmParams.utm_campaign || 'organic';
  
  // Obtener datos de geolocalización mejorados
  const ipLocation = await getGeoLocationData(userLocation, timezone);

  // Calcular score y estado basado en el tipo de lead
  const leadType = leadMetadata?.leadType || 'free_guide';
  const calculatedScore = leadType === 'book_purchase' ? 20 : 5;
  const leadStatus = leadType === 'book_purchase' ? 'Interesado en Compra' : 'Iniciando Secuencia';
  
  // =====================================
  // PAYLOAD OPTIMIZADO ALINEADO CON PRISMA
  // =====================================
  // Este payload es completamente plano y se alinea 1:1 con el schema de Lead en Prisma
  // Elimina duplicidades y anidaciones innecesarias para facilitar el mapeo en n8n
  return {
    // Información básica del negocio
    businessId: '00000000-0000-0000-0000-000000000001',
    
    // Información de contacto (campos directos del modelo Lead)
    email,
    name,
    phone: leadMetadata?.phone || null,
    company: leadMetadata?.company || null,
    jobTitle: leadMetadata?.jobTitle || null,
    
    // Información de perfil y scoring
    status: leadStatus,
    score: calculatedScore,
    isHot: calculatedScore > 7,
    leadType,
    
    // Tracking y atribución de campaña
    campaignName,
    source,
    medium,
    content: utmParams.utm_content || null,
    term: utmParams.utm_term || null,
    fbclid: utmParams.fbclid || null,
    entryDate: localTime,
    
    // Conversión
    conversionPage: currentUrl,
    
    // Tracking de interacción
    interactionType: 'form_submit',
    interactionSource: 'landing-page',
    formType: leadType,
    formId: leadMetadata?.formId || null,
    timeOnPage: timeOnPageSeconds,
    scrollPercentage,
    
    // Tracking de sesión
    sessionId,
    visitorId,
    deviceType,
    browser,
    operatingSystem: os,
    language: typeof navigator !== 'undefined' ? navigator.language : 'es-ES',
    timezone: ipLocation.timezone || timezone,
    ipAddress: ipLocation.ip,
    country: ipLocation.country,
    region: ipLocation.region,
    city: ipLocation.city,
    referrer,
    
    // Email tracking
    emailCampaignName: campaignName,
    emailSubject: leadMetadata?.emailSubject || 'Tu guía de transición a comida natural',
    emailNumber: leadMetadata?.emailNumber || 1,
    emailScheduledFor: localTime,
    
    // Datos adicionales/personalizados
    customFields: {
      pageTitle,
      latitude: ipLocation.latitude,
      longitude: ipLocation.longitude,
      // Incluir datos adicionales del formulario si existen
      ...(leadMetadata?.customFields || {})
    }
  };
};

/**
 * Obtiene los mejores datos de geolocalización disponibles usando múltiples fuentes
 * y servicios externos, con sistema de fallbacks robusto
 */
async function getGeoLocationData(userLocation: any | null, timezone: string) {
  // Valores predeterminados del navegador como fallback
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone || 'UTC';
  
  // Estructura de datos base con valores por defecto para evitar nulls
  let geoData = {
    ip: '127.0.0.1',
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    timezone: browserTimezone,
    latitude: 0,
    longitude: 0
  };

  try {
    // 1. FUENTE PRINCIPAL: Datos del tracker en localStorage (más completos)
    const trackerDataString = localStorage.getItem('tracker_data');
    if (trackerDataString) {
      try {
        const trackerData = JSON.parse(trackerDataString);
        if (trackerData?.ipLocation?.country) {
          console.log('📍 Usando datos de geolocalización de tracker_data:', trackerData.ipLocation);
          return {
            ip: trackerData.ipLocation.ip || geoData.ip,
            country: trackerData.ipLocation.country || geoData.country,
            region: trackerData.ipLocation.region || geoData.region,
            city: trackerData.ipLocation.city || geoData.city,
            timezone: trackerData.ipLocation.timezone || browserTimezone,
            latitude: trackerData.ipLocation.latitude || geoData.latitude,
            longitude: trackerData.ipLocation.longitude || geoData.longitude
          };
        }
      } catch (e) {
        console.error('Error al parsear tracker_data:', e);
      }
    }

    // 2. COMPATIBILIDAD LEGACY: Datos almacenados en visitorData
    const storedVisitorData = localStorage.getItem('visitorData');
    if (storedVisitorData) {
      try {
        const parsedData = JSON.parse(storedVisitorData);
        if (parsedData?.ipLocation?.country) {
          console.log('🇱 Usando datos de geolocalización de visitorData:', parsedData.ipLocation);
          return {
            ip: parsedData.ipLocation.ip || geoData.ip,
            country: parsedData.ipLocation.country || geoData.country,
            region: parsedData.ipLocation.region || geoData.region,
            city: parsedData.ipLocation.city || geoData.city,
            timezone: parsedData.ipLocation.timezone || browserTimezone,
            latitude: parsedData.ipLocation.latitude || geoData.latitude,
            longitude: parsedData.ipLocation.longitude || geoData.longitude
          };
        }
      } catch (e) {
        console.error('Error al parsear visitorData:', e);
      }
    }

    // 3. PARÁMETROS: Datos pasados explícitamente a la función
    if (userLocation?.country) {
      console.log('🇲 Usando datos de geolocalización de userLocation:', userLocation);
      return {
        ip: userLocation.ip || geoData.ip,
        country: userLocation.country || geoData.country,
        region: userLocation.region || geoData.region,
        city: userLocation.city || geoData.city,
        timezone: userLocation.timezone || browserTimezone,
        latitude: userLocation.latitude || geoData.latitude,
        longitude: userLocation.longitude || geoData.longitude
      };
    }

    // 4. SERVICIOS EXTERNOS: Consultar APIs de geolocalización
    // Solo intentar en producción o si los pasos anteriores fallaron
    if (window.location.hostname !== 'localhost') {
      try {
        console.log('🌐 Consultando APIs externas de geolocalización');
        
        // Lista de APIs de geolocalización por IP (en orden de preferencia)
        const apis = [
          { url: 'https://ipapi.co/json/', headers: {} },
          { url: 'https://ip-api.com/json/', headers: {} },
          { url: 'https://ipinfo.io/json', headers: {} }
        ];
        
        // Intentar cada API hasta que una funcione
        for (const api of apis) {
          try {
            console.log(`🔍 Intentando obtener IP desde ${api.url}`);
            const response = await fetch(api.url, { 
              cache: 'no-cache', 
              headers: api.headers,
              signal: AbortSignal.timeout(3000) // 3 segundos de timeout
            });
            
            if (response.ok) {
              const data = await response.json();
              
              // Extraer campos relevantes con fallbacks
              const ipLocation = { 
                ip: data.ip || data.query || geoData.ip, 
                country: data.country_name || data.country || geoData.country, 
                region: data.region || data.regionName || data.state || geoData.region, 
                city: data.city || geoData.city, 
                timezone: data.timezone || browserTimezone,
                latitude: parseFloat(data.latitude || data.lat) || geoData.latitude,
                longitude: parseFloat(data.longitude || data.lon) || geoData.longitude
              };
              
              console.log('📍 Ubicación IP obtenida exitosamente de API:', ipLocation);
              
              // Guardar en localStorage para futuros usos
              try {
                localStorage.setItem('ipLocationCache', JSON.stringify({
                  data: ipLocation,
                  timestamp: Date.now()
                }));
              } catch (e) {
                console.warn('Error guardando cache de IP:', e);
              }
              
              return ipLocation;
            }
          } catch (error) { 
            console.error(`Error con API ${api.url}:`, error);
            /* continuar con la siguiente API */ 
          }
        }
      } catch (apiError) {
        console.error('Error general consultando APIs de geolocalización:', apiError);
      }
    }

    // 5. DESARROLLO LOCAL: Usar datos de prueba específicos
    if (window.location.hostname === 'localhost') {
      console.log('🔍 Usando datos de prueba para desarrollo local');
      return {
        ip: '8.8.8.8', // IP de prueba (Google DNS)
        country: 'Argentina',
        region: 'Buenos Aires',
        city: 'Buenos Aires',
        timezone: 'America/Argentina/Buenos_Aires',
        latitude: -34.6037,
        longitude: -58.3816
      };
    }
  } catch (error) {
    console.error('Error general obteniendo datos de geolocalización:', error);
  }

  // Si todo falla, devolver objeto con valores por defecto (sin nulls)
  console.warn('⚠️ No se pudieron obtener datos de geolocalización completos, usando fallback');
  return geoData;
}

// Send data to n8n webhook 
const sendDataToN8N = async (payload: any, _webhookName: string) => {
  // webhookName es usado solo para debugging/logs si fuera necesario
  console.log('📤 Enviando payload completo a n8n:', payload);
  const webhookUrl = getN8NWebhookUrl();
  return await sendDataToWebhook(webhookUrl, payload);
};

// Send data to specific n8n webhook URL
const sendDataToWebhook = async (webhookUrl: string, payload: any) => {
  // Registrar para diagnóstico lo que estamos enviando al webhook
  logWebhookPayload('lead_capture', payload, { 
    utmParamsFormat: payload.leadInfo ? 'lead_info' : 'flat_params',
    hasNestedUtm: !!payload.utm || !!payload.leadInfo
  });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error enviando lead a n8n: ${response.statusText}`);
  }
  return response.json();
};

const trackLeadInPixel = (leadId: string) => {
  try {
    ReactPixel.track('Lead', {
      content_name: 'Libro de Recetas Naturales',
      content_category: 'lead_magnet',
      value: 0.00,
      currency: 'USD',
      status: 'captured',
      lead_id: leadId,
    });
    console.log('Evento Lead enviado a Meta Pixel');
  } catch (pixelError) {
    console.error('Error enviando datos a Meta Pixel:', pixelError);
  }
};

const updateLocalStorage = (leadId: string, email: string) => {
  localStorage.setItem('natpets_lead_id', leadId);
  localStorage.setItem('natpets_lead_email', email);
};

// --- Main Exported Function ---

/**
 * Orquesta el proceso de guardar un lead, enviarlo a n8n y registrar el evento.
 * Utiliza un payload optimizado y alineado con el schema de Prisma.
 */
export const saveLeadToEmailMarketing = async (params: SaveLeadParams) => {
  const { 
    email, 
    leadMetadata = { 
      leadType: 'book_purchase', 
      interestedInBook: true, 
      productName: 'NAT-PETS CRM Premium Service' 
    }
  } = params;

  try {
    // Recuperar el visitorId de localStorage para vincular la sesión anónima
    let visitorId = '';
    try {
      if (typeof localStorage !== 'undefined') {
        visitorId = localStorage.getItem('visitorId') || '';
      }
      if (!visitorId) {
        visitorId = `fallback_visitor_${Date.now()}`;
      }
    } catch (e) {
      console.warn('Error accessing localStorage:', e);
      visitorId = `fallback_visitor_${Date.now()}`;
    }

    const webhookUrl = getN8NWebhookUrl();
    // Pasar el visitorId al constructor del payload
    const leadData = await buildLeadPayload({ ...params, leadMetadata }, visitorId);
    
    if (!leadData) {
      return { success: false, error: 'No se pudo construir el payload del lead' };
    }
    
    // Inspeccionar estructura de datos para diagnóstico
    console.log('Enviando datos a n8n:', webhookUrl);
    console.log('Payload del lead:', JSON.stringify(leadData, null, 2));
    
    // Guardar una copia en localStorage para revisión
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('utm_debug_payload', JSON.stringify({
          timestamp: new Date().toISOString(),
          leadData: leadData,
          payloadFormat: 'flat_schema_aligned'
        }));
      }
    } catch (e) {
      console.warn('Error guardando debug:', e);
    }
    
    // Enviar datos a n8n
    const n8nResponse = await sendDataToN8N(leadData, 'lead_capture');
    console.log('Respuesta de n8n:', n8nResponse);
    
    // El evento de conversión se registrará con la sesión normal del sistema de tracking
    // cuando la sesión se cierre, sin necesidad de enviarlo como evento inmediato.
    
    // Usar visitorId para el tracking y localStorage
    trackLeadInPixel(visitorId);
    
    // Guardar información del lead y campaña en localStorage
    updateLocalStorage(visitorId, email);
    
    // Guardar información de campaña en localStorage para seguimiento
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('natpets_campaign_id', leadData.campaignName || 'organic');
        localStorage.setItem('natpets_campaign_type', leadData.leadType === 'book_purchase' ? 'sales' : 'nurture');
      }
    } catch (e) {
      console.warn('Error guardando datos de campaña:', e);
    }
    
    return { 
      success: true, 
      data: n8nResponse, 
      leadId: visitorId,
      campaignId: leadData.campaignName || 'organic'
    };
  } catch (error) {
    console.error('Error al guardar lead para email marketing:', error);
    return { success: false, error: (error as Error).message };
  }
};

// --- Other Exported Functions ---

/**
 * Función para obtener parámetros de URL
 * @returns Un objeto con todos los parámetros de URL
 */
const getURLParameters = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  
  for (const [key, value] of queryParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Enviar evento de lead a Meta Pixel
 * @param name Nombre del lead
 * @param email Email del lead
 * @param leadMetadata Metadatos del lead
 */
export const sendLeadEventToPixel = (name: string, email: string, leadMetadata: LeadMetadata) => {
  if (window.fbq) {
    try {
      // Construir objeto de parámetros para el evento
      const eventParams = {
        content_name: leadMetadata.leadType === 'book_purchase' 
          ? 'Libro de Recetas Naturales' 
          : 'Guía Gratuita de Transición',
        content_category: leadMetadata.leadType === 'book_purchase' ? 'Producto' : 'Lead Magnet',
        currency: leadMetadata.leadType === 'book_purchase' ? 'USD' : '',
        value: leadMetadata.leadType === 'book_purchase' ? 15 : 0,
        lead_id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, // ID único para este lead en particular
        lead_type: leadMetadata.leadType,
        // User data
        user_data: {
          email: [email],
          name: [name]
        }
      };

      // Enviar evento al pixel
      window.fbq('track', 'Lead', eventParams);
      console.log('Evento Lead enviado a Meta Pixel');
    } catch (error) {
      console.error('Error al enviar evento a Meta Pixel:', error);
    }
  }
};