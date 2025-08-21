/**
 * 🎯 UTM PARAMETERS EXTRACTOR
 * Sistema robusto para extraer y gestionar parámetros UTM y Click IDs de URLs
 */

import { UTMParams } from '../types';

/**
 * Extrae todos los parámetros UTM y Click IDs de la URL actual
 */
export const getUTMParams = (): UTMParams => {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const utmParams: UTMParams = {};

  // Parámetros UTM estándar
  const utmKeys = ['source', 'medium', 'campaign', 'term', 'content'];
  utmKeys.forEach(key => {
    const value = params.get(`utm_${key}`);
    if (value) {
      (utmParams as any)[key] = value;
    }
  });

  // Click IDs para diferentes plataformas de anuncios
  const clickIds = [
    { param: 'fbclid', key: 'fbclid' },      // Facebook Click ID
    { param: 'gclid', key: 'gclid' },        // Google Click ID
    { param: 'msclkid', key: 'msclkid' },    // Microsoft Ads Click ID
    { param: 'ttclid', key: 'ttclid' },      // TikTok Ads Click ID
    { param: 'twclid', key: 'twclid' },      // Twitter Ads Click ID
    { param: 'li_mc', key: 'li_mc' },        // LinkedIn Click ID
    { param: 'yclid', key: 'yclid' },        // Yandex Click ID
    { param: 'igshid', key: 'igshid' }       // Instagram Share ID
  ];

  clickIds.forEach(({ param, key }) => {
    const value = params.get(param);
    if (value) {
      (utmParams as any)[key] = value;
    }
  });

  return utmParams;
};

/**
 * Extrae parámetros UTM de una URL específica
 */
export const getUTMParamsFromURL = (url: string): UTMParams => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const utmParams: UTMParams = {};

    // Parámetros UTM estándar
    const utmKeys = ['source', 'medium', 'campaign', 'term', 'content'];
    utmKeys.forEach(key => {
      const value = params.get(`utm_${key}`);
      if (value) {
        (utmParams as any)[key] = value;
      }
    });

    // Click IDs
    const clickIds = ['fbclid', 'gclid', 'msclkid', 'ttclid', 'twclid', 'li_mc', 'yclid', 'igshid'];
    clickIds.forEach(clickId => {
      const value = params.get(clickId);
      if (value) {
        (utmParams as any)[clickId] = value;
      }
    });

    return utmParams;
  } catch (error) {
    console.warn('Error parsing URL for UTM params:', error);
    return {};
  }
};

/**
 * Obtiene parámetros UTM del referrer
 */
export const getUTMParamsFromReferrer = (): UTMParams => {
  if (typeof document === 'undefined' || !document.referrer) {
    return {};
  }

  return getUTMParamsFromURL(document.referrer);
};

/**
 * Combina parámetros UTM de múltiples fuentes con prioridad
 * Prioridad: URL actual > Referrer > LocalStorage
 */
export const getCombinedUTMParams = (): UTMParams => {
  // 1. Obtener de URL actual (máxima prioridad)
  const currentParams = getUTMParams();
  
  // 2. Obtener del referrer
  const referrerParams = getUTMParamsFromReferrer();
  
  // 3. Obtener de localStorage (primera sesión)
  const storedParams = getStoredUTMParams();
  
  // Combinar con prioridad: actual > referrer > stored
  return {
    ...storedParams,
    ...referrerParams,
    ...currentParams
  };
};

/**
 * Guarda parámetros UTM en localStorage para persistencia
 */
export const storeUTMParams = (params: UTMParams): void => {
  if (typeof localStorage === 'undefined') return;

  try {
    const dataToStore = {
      ...params,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : ''
    };
    localStorage.setItem('innova_utm_params', JSON.stringify(dataToStore));
  } catch (error) {
    console.warn('Error storing UTM params:', error);
  }
};

/**
 * Obtiene parámetros UTM guardados en localStorage
 */
export const getStoredUTMParams = (): UTMParams => {
  if (typeof localStorage === 'undefined') return {};

  try {
    const stored = localStorage.getItem('innova_utm_params');
    if (stored) {
      const data = JSON.parse(stored);
      
      // Verificar que no sean demasiado antiguos (30 días)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días en ms
      if (Date.now() - data.timestamp < maxAge) {
        // Remover campos internos
        const { timestamp, url, ...utmParams } = data;
        return utmParams;
      } else {
        // Limpiar datos antiguos
        localStorage.removeItem('innova_utm_params');
      }
    }
  } catch (error) {
    console.warn('Error retrieving stored UTM params:', error);
  }

  return {};
};

/**
 * Detecta la fuente de tráfico basada en UTM params y referrer
 */
export const getTrafficSource = (): {
  source: string;
  medium: string;
  category: 'direct' | 'organic' | 'social' | 'email' | 'paid' | 'referral' | 'other';
} => {
  const utmParams = getCombinedUTMParams();
  const referrer = typeof document !== 'undefined' ? document.referrer : '';

  // Si hay UTM source, usarlo
  if (utmParams.source) {
    return {
      source: utmParams.source,
      medium: utmParams.medium || 'unknown',
      category: categorizeTrafficSource(utmParams.source, utmParams.medium)
    };
  }

  // Si hay referrer, analizarlo
  if (referrer) {
    const referrerDomain = extractDomain(referrer);
    return {
      source: referrerDomain,
      medium: 'referral',
      category: categorizeReferrer(referrerDomain)
    };
  }

  // Tráfico directo
  return {
    source: 'direct',
    medium: 'none',
    category: 'direct'
  };
};

/**
 * Categoriza la fuente de tráfico
 */
const categorizeTrafficSource = (source?: string, medium?: string): 'direct' | 'organic' | 'social' | 'email' | 'paid' | 'referral' | 'other' => {
  if (!source) return 'other';

  const lowerSource = source.toLowerCase();
  const lowerMedium = medium?.toLowerCase() || '';

  // Paid traffic
  if (lowerMedium.includes('cpc') || lowerMedium.includes('ppc') || lowerMedium.includes('paid')) {
    return 'paid';
  }

  // Social media
  const socialSources = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'snapchat'];
  if (socialSources.some(social => lowerSource.includes(social))) {
    return 'social';
  }

  // Email
  if (lowerMedium.includes('email') || lowerSource.includes('email') || lowerSource.includes('newsletter')) {
    return 'email';
  }

  // Organic search
  if (lowerMedium.includes('organic') || lowerSource.includes('google') || lowerSource.includes('bing')) {
    return 'organic';
  }

  return 'other';
};

/**
 * Categoriza referrers conocidos
 */
const categorizeReferrer = (domain: string): 'organic' | 'social' | 'referral' => {
  const lowerDomain = domain.toLowerCase();

  // Motores de búsqueda
  const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex'];
  if (searchEngines.some(engine => lowerDomain.includes(engine))) {
    return 'organic';
  }

  // Redes sociales
  const socialDomains = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest'];
  if (socialDomains.some(social => lowerDomain.includes(social))) {
    return 'social';
  }

  return 'referral';
};

/**
 * Extrae el dominio de una URL
 */
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
};

/**
 * Verifica si hay Click IDs presentes (indica tráfico pagado)
 */
export const hasClickIDs = (params?: UTMParams): boolean => {
  const utmParams = params || getUTMParams();
  const clickIds = ['fbclid', 'gclid', 'msclkid', 'ttclid'];
  return clickIds.some(clickId => (utmParams as any)[clickId]);
};

/**
 * Construye una cadena de query con parámetros UTM
 */
export const buildUTMQuery = (params: UTMParams): string => {
  const queryParams = new URLSearchParams();

  // Agregar parámetros UTM
  if (params.source) queryParams.set('utm_source', params.source);
  if (params.medium) queryParams.set('utm_medium', params.medium);
  if (params.campaign) queryParams.set('utm_campaign', params.campaign);
  if (params.term) queryParams.set('utm_term', params.term);
  if (params.content) queryParams.set('utm_content', params.content);

  // Agregar Click IDs
  if (params.fbclid) queryParams.set('fbclid', params.fbclid);
  if (params.gclid) queryParams.set('gclid', params.gclid);
  if (params.msclkid) queryParams.set('msclkid', params.msclkid);
  if (params.ttclid) queryParams.set('ttclid', params.ttclid);

  return queryParams.toString();
};

/**
 * Auto-guarda parámetros UTM si están presentes
 */
export const autoStoreUTMParams = (): UTMParams => {
  const currentParams = getUTMParams();
  
  // Si hay parámetros UTM en la URL actual, guardarlos
  if (Object.keys(currentParams).length > 0) {
    storeUTMParams(currentParams);
  }
  
  return getCombinedUTMParams();
};
