/**
 * 👆 GENERADOR DE FINGERPRINT
 * Sistema robusto para generar huellas digitales únicas del navegador/dispositivo
 */

import { generateShortId } from './uuid';

/**
 * Genera un fingerprint único basado en características del navegador y dispositivo
 */
export const generateFingerprint = (): string => {
  if (typeof window === 'undefined') {
    return `server_${generateShortId(12)}`;
  }

  const components: string[] = [];

  try {
    // User Agent
    components.push(navigator.userAgent || '');

    // Idioma
    components.push(navigator.language || '');

    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');

    // Resolución de pantalla
    components.push(`${screen.width}x${screen.height}`);

    // Color depth
    components.push(screen.colorDepth?.toString() || '');

    // Pixel ratio
    components.push(window.devicePixelRatio?.toString() || '');

    // Plataforma
    components.push(navigator.platform || '');

    // Hardware concurrency
    components.push(navigator.hardwareConcurrency?.toString() || '');

    // Max touch points
    components.push(navigator.maxTouchPoints?.toString() || '');

    // Cookies habilitadas
    components.push(navigator.cookieEnabled ? '1' : '0');

    // Do Not Track
    components.push(navigator.doNotTrack || '');

    // Características adicionales del canvas (más únicas)
    const canvasFingerprint = getCanvasFingerprint();
    if (canvasFingerprint) {
      components.push(canvasFingerprint);
    }

    // WebGL fingerprint
    const webglFingerprint = getWebGLFingerprint();
    if (webglFingerprint) {
      components.push(webglFingerprint);
    }

    // Fuentes disponibles (sample)
    const fontsFingerprint = getFontsFingerprint();
    if (fontsFingerprint) {
      components.push(fontsFingerprint);
    }

  } catch (error) {
    console.warn('Error generando fingerprint:', error);
  }

  // Crear hash simple pero efectivo
  const combinedString = components.join('|');
  const hash = simpleHash(combinedString);
  
  return `innova_${hash}`;
};

/**
 * Genera fingerprint del canvas para mayor unicidad
 */
const getCanvasFingerprint = (): string | null => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Configurar canvas
    canvas.width = 200;
    canvas.height = 50;

    // Dibujar texto con diferentes fuentes y estilos
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillText('Innova Tracking 🚀', 2, 2);

    ctx.font = '11px Times';
    ctx.fillStyle = '#069';
    ctx.fillText('Fingerprint Test', 4, 17);

    // Dibujar formas
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.beginPath();
    ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    // Obtener datos del canvas
    return canvas.toDataURL();
  } catch (error) {
    return null;
  }
};

/**
 * Genera fingerprint de WebGL
 */
const getWebGLFingerprint = (): string | null => {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (context) {
      const webglContext = context as WebGLRenderingContext;
      const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const webglInfo = {
          renderer: webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '',
          vendor: webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '',
          version: webglContext.getParameter(webglContext.VERSION) || '',
          shadingLanguageVersion: webglContext.getParameter(webglContext.SHADING_LANGUAGE_VERSION) || ''
        };

        return Object.values(webglInfo).join('|');
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Genera fingerprint de fuentes disponibles (muestra)
 */
const getFontsFingerprint = (): string | null => {
  try {
    // Lista de fuentes comunes a probar
    const testFonts = [
      'Arial', 'Times New Roman', 'Courier New', 'Helvetica',
      'Georgia', 'Verdana', 'Comic Sans MS', 'Impact',
      'Trebuchet MS', 'Arial Black', 'Times', 'Courier'
    ];

    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    // Función para medir ancho del texto
    const getTextWidth = (font: string): number => {
      context.font = testSize + ' ' + font;
      return context.measureText(testString).width;
    };

    // Obtener anchos base
    const baseWidths = baseFonts.map(font => getTextWidth(font));
    
    // Probar fuentes y ver cuáles están disponibles
    const availableFonts: string[] = [];
    
    testFonts.forEach(font => {
      baseFonts.forEach((baseFont, index) => {
        const width = getTextWidth(`${font}, ${baseFont}`);
        if (width !== baseWidths[index]) {
          availableFonts.push(font);
        }
      });
    });

    return Array.from(new Set(availableFonts)).sort().join(',');
  } catch (error) {
    return null;
  }
};

/**
 * Hash simple pero efectivo
 */
const simpleHash = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Valida si un fingerprint tiene el formato correcto
 */
export const isValidFingerprint = (fingerprint: string): boolean => {
  return /^innova_[a-z0-9]+$/.test(fingerprint);
};
