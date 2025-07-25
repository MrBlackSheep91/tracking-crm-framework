/**
 * Módulo centralizado para gestión de UTM y análisis de fuentes de tráfico
 * Este módulo unifica toda la lógica relacionada con UTM para evitar duplicaciones e inconsistencias
 */

// ==================== Tipos y constantes ====================

/**
 * Interfaz para los parámetros UTM estándar y datos adicionales de tráfico
 */
export interface UtmParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  [key: string]: string | undefined;
}

// Parámetros UTM estándar que se buscarán en URL y localStorage
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid'];

// Clave para el almacenamiento en localStorage
const UTM_STORAGE_KEY = 'utm_params';

// Singleton para almacenar los parámetros UTM en memoria para toda la sesión
let cachedUtmParams: UtmParameters | null = null;

// ==================== Detección de placeholders ====================

/**
 * Detecta si un valor es un placeholder de Meta Ads que no ha sido sustituido
 * @param value - El valor a comprobar
 * @returns true si es un placeholder no sustituido, false en caso contrario
 */
export const isPlaceholder = (value: string | undefined): boolean => {
  if (!value) return false;
  
  const placeholderPatterns = [
    /^\{\{.*\}\}$/,       // {{algo}}
    /^\{%.*%\}$/,         // {% algo %}
    /^\$\{.*\}$/,         // ${algo}
    /^\[\[.*\]\]$/        // [[algo]]
  ];
  
  return placeholderPatterns.some(pattern => pattern.test(value));
};

// ==================== Clasificación de tráfico ====================

/**
 * Detecta la fuente real de tráfico cuando no hay UTM explícitos
 * Analiza múltiples señales: referrer, user-agent, query params, etc.
 * @param params - Objeto donde se guardarán los parámetros detectados
 */
export const classifyTrafficSource = (params: UtmParameters = {}): void => {
  // Solo clasificamos si no hay utm_source explícito o es un placeholder
  if (params.utm_source && !isPlaceholder(params.utm_source) && params.utm_source !== 'unknown') {
    // Si ya tenemos una fuente válida, la respetamos
    return;
  }
  
  // ---------- Obtener señales de tráfico ----------
  
  // Referrer (sitio que nos envía tráfico)
  const referrer = document.referrer;
  let referrerDomain = '';
  let referrerUrl: URL | null = null;
  
  try {
    if (referrer) {
      referrerUrl = new URL(referrer);
      referrerDomain = referrerUrl.hostname.toLowerCase();
    }
  } catch (e) {
    console.warn('Error al analizar referrer:', e);
  }
  
  // User-Agent (para detectar apps móviles)
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  
  // Query params especiales (fbclid, etc.)
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  
  // ---------- Clasificación jerárquica ----------
  
  // 1. Facebook con fbclid (prioridad máxima, es tráfico pagado)
  if (fbclid) {
    params.utm_source = 'facebook';
    params.utm_medium = 'paid';
    params.utm_campaign = params.utm_campaign || 'fb_ads';
    params.fbclid = fbclid;
    return;
  }
  
  // 2. Apps específicas detectadas por User-Agent
  // WhatsApp
  if (userAgent.includes('whatsapp')) {
    params.utm_source = 'whatsapp';
    params.utm_medium = 'social';
    params.utm_campaign = params.utm_campaign || 'whatsapp_share';
    return;
  }
  
  // Instagram app
  if (userAgent.includes('instagram')) {
    params.utm_source = 'instagram';
    params.utm_medium = 'app';
    params.utm_campaign = params.utm_campaign || 'instagram_organic';
    return;
  }
  
  // Facebook app (FBAN o FBAV en User-Agent)
  if (userAgent.includes('fban') || userAgent.includes('fbav')) {
    params.utm_source = 'facebook';
    params.utm_medium = 'app';
    params.utm_campaign = params.utm_campaign || 'facebook_app_organic';
    return;
  }
  
  // 3. Sitios web específicos por referrer
  if (referrerDomain) {
    // Facebook web
    if (referrerDomain.includes('facebook.com') || referrerDomain.includes('fb.com')) {
      params.utm_source = 'facebook';
      params.utm_medium = 'social';
      params.utm_campaign = params.utm_campaign || 'facebook_organic';
      return;
    }
    
    // Instagram web
    if (referrerDomain.includes('instagram.com')) {
      params.utm_source = 'instagram';
      params.utm_medium = 'social';
      params.utm_campaign = params.utm_campaign || 'instagram_organic';
      return;
    }
    
    // Twitter/X
    if (referrerDomain.includes('twitter.com') || referrerDomain.includes('x.com')) {
      params.utm_source = 'twitter';
      params.utm_medium = 'social';
      params.utm_campaign = params.utm_campaign || 'twitter_organic';
      return;
    }
    
    // Google
    if (referrerDomain.includes('google')) {
      params.utm_source = 'google';
      params.utm_medium = referrerUrl?.pathname?.includes('/search') ? 'organic' : 'referral';
      params.utm_campaign = params.utm_campaign || 'google_organic';
      return;
    }
    
    // YouTube
    if (referrerDomain.includes('youtube.com') || referrerDomain.includes('youtu.be')) {
      params.utm_source = 'youtube';
      params.utm_medium = 'social';
      params.utm_campaign = params.utm_campaign || 'youtube_organic';
      return;
    }
    
    // TikTok
    if (referrerDomain.includes('tiktok.com')) {
      params.utm_source = 'tiktok';
      params.utm_medium = 'social';
      params.utm_campaign = params.utm_campaign || 'tiktok_organic';
      return;
    }
    
    // LinkedIn
    if (referrerDomain.includes('linkedin.com')) {
      params.utm_source = 'linkedin';
      params.utm_medium = 'social';
      params.utm_campaign = params.utm_campaign || 'linkedin_organic';
      return;
    }
    
    // Otros sitios web (referral genérico)
    params.utm_source = referrerDomain.replace('www.', '');
    params.utm_medium = 'referral';
    params.utm_campaign = params.utm_campaign || `referral_${Date.now().toString(36)}`;
    return;
  }
  
  // 4. Tráfico directo (sin referrer ni otras señales)
  if (!referrer || referrer === '') {
    params.utm_source = 'direct';
    params.utm_medium = 'none';
    params.utm_campaign = params.utm_campaign || `direct_${Date.now().toString(36)}`;
    return;
  }
  
  // 5. Fallback para casos no identificados
  if (!params.utm_source || params.utm_source === 'unknown') {
    // Si llegamos aquí, no pudimos identificar la fuente - usar direct o referral según corresponda
    if (referrer) {
      params.utm_source = 'referral';
      params.utm_medium = 'website';
      params.utm_campaign = params.utm_campaign || `referral_${referrerDomain || 'unknown'}`;
    } else {
      params.utm_source = 'direct';
      params.utm_medium = 'none';
      params.utm_campaign = params.utm_campaign || 'direct_navigation';
    }
  }
};

// ==================== Funciones principales para UTM ====================

/**
 * Obtiene los parámetros UTM de la URL actual y otras fuentes
 * Prioridad: 1) URL actual, 2) localStorage, 3) clasificación automática
 * @param forceRefresh Si es true, ignora la caché y recalcula los parámetros
 * @returns Objeto con los parámetros UTM y datos asociados
 */
export const getUtmParams = (forceRefresh = false): UtmParameters => {
  // Logging para debug
  console.log('[urlUtils] getUtmParams llamado con forceRefresh =', forceRefresh);
  console.log('[urlUtils] localStorage actual:', localStorage.getItem(UTM_STORAGE_KEY));
  
  // 1. Usar versión en caché si existe y no se fuerza refresh
  if (cachedUtmParams && !forceRefresh) {
    console.log('[urlUtils] Usando UTM params en caché:', cachedUtmParams);
    return { ...cachedUtmParams };
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: UtmParameters = {};
  
  // 2. Intentar obtener parámetros UTM de la URL actual
  console.log('[urlUtils] URL params:', window.location.search);
  UTM_KEYS.forEach(key => {
    const value = urlParams.get(key);
    if (value && !isPlaceholder(value)) {
      utmParams[key] = value;
      console.log(`[urlUtils] Extraído de URL: ${key} = ${value}`);
    }
  });
  
  // 3. Si faltan parámetros esenciales, intentar recuperar de localStorage
  // IMPORTANTE: No usamos valores por defecto tipo "MetaAds"
  if (!utmParams.utm_source || !utmParams.utm_campaign) {
    try {
      const savedUtmParams = localStorage.getItem(UTM_STORAGE_KEY);
      if (savedUtmParams) {
        console.log('[urlUtils] Recuperando de localStorage:', savedUtmParams);
        const parsedParams = JSON.parse(savedUtmParams);
        
        // IMPORTANTE: Verificar si hay valores MetaAds en localStorage y eliminarlos
        let foundMetaAds = false;
        Object.keys(parsedParams).forEach(key => {
          if (parsedParams[key] === 'MetaAds' || parsedParams[key] === 'default_campaign' || 
              parsedParams[key] === 'default_ad' || parsedParams[key] === 'cpc') {
            console.warn(`[urlUtils] ⚠️ Encontrado valor por defecto en localStorage: ${key}=${parsedParams[key]}`);
            delete parsedParams[key]; // Eliminar valores por defecto
            foundMetaAds = true;
          }
        });
        
        // Si había valores MetaAds, limpiar localStorage
        if (foundMetaAds) {
          console.log('[urlUtils] Limpiando localStorage de valores por defecto');
          localStorage.removeItem(UTM_STORAGE_KEY);
        } else {
          UTM_KEYS.forEach(key => {
            // Solo usar valores guardados para claves faltantes y que no sean placeholders
            if (!utmParams[key] && parsedParams[key] && !isPlaceholder(parsedParams[key])) {
              utmParams[key] = parsedParams[key];
              console.log(`[urlUtils] Recuperado de localStorage: ${key} = ${parsedParams[key]}`);
            }
          });
        }
      }
    } catch (e) {
      console.warn('[urlUtils] Error al recuperar UTM params del localStorage:', e);
    }
  }
  
  // 4. Clasificación inteligente si aún faltan datos esenciales
  console.log('[urlUtils] Antes de clasificación:', utmParams);
  classifyTrafficSource(utmParams);
  console.log('[urlUtils] Después de clasificación:', utmParams);
  
  // VERIFICAR: No debe haber valores MetaAds a estas alturas
  Object.entries(utmParams).forEach(([key, value]) => {
    if (value === 'MetaAds' || value === 'default_campaign' || value === 'default_ad' || value === 'cpc') {
      console.error(`[urlUtils] ⚠️ ALERTA: Valor por defecto detectado en el flujo principal para ${key}=${value}`);
      // Eliminamos valores fijos por defecto
      delete utmParams[key];
    }
  });
  
  // 5. Guardar en caché y localStorage para consistencia entre páginas
  cachedUtmParams = { ...utmParams };
  
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
    console.log('[urlUtils] Guardado en localStorage:', utmParams);
  } catch (e) {
    console.warn('[urlUtils] Error al guardar UTM params en localStorage:', e);
  }
  
  // Logging para debugging
  console.log('[urlUtils] UTM Params finales:', utmParams);
  
  return utmParams;
};

/**
 * Convierte los parámetros UTM planos a una estructura anidada
 * (útil para APIs que esperan un formato específico)
 */
export const getStructuredUtmParams = (): { utm: Record<string, string> } => {
  const flatParams = getUtmParams();
  const result: { utm: Record<string, string> } = {
    utm: {}
  };
  
  // Convertir utm_source a source, etc.
  Object.keys(flatParams).forEach(key => {
    if (key.startsWith('utm_')) {
      const shortKey = key.replace('utm_', '');
      result.utm[shortKey] = flatParams[key] || '';
    } else if (key === 'fbclid') {
      result.utm.fbclid = flatParams.fbclid || '';
    }
  });
  
  return result;
};

/**
 * Obtiene todos los parámetros de la URL actual (no solo UTM)
 * @returns Objeto con todos los parámetros de la URL
 */
export const getAllUrlParams = (): { [key: string]: string } => {
  const urlParams = new URLSearchParams(window.location.search);
  const params: { [key: string]: string } = {};
  
  urlParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

/**
 * Construye una URL incluyendo parámetros UTM
 * @param baseUrl URL base a la que añadir los parámetros
 * @param utmParams Parámetros UTM para añadir (opcional, usa los actuales si no se especifica)
 */
export const buildUrlWithUtm = (baseUrl: string, utmParams?: UtmParameters): string => {
  const params = utmParams || getUtmParams();
  const url = new URL(baseUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.append(key, params[key] as string);
    }
  });
  
  return url.toString();
};
