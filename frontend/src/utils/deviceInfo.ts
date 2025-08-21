/**
 * 📱 DEVICE INFO DETECTOR
 * Sistema completo para detectar información del dispositivo, navegador y capacidades
 */

import { DeviceInfo } from '../types';

/**
 * Obtiene información completa del dispositivo y navegador
 */
export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return getServerSideDeviceInfo();
  }

  const userAgent = navigator.userAgent;
  const browserInfo = getBrowserInfo(userAgent);
  const osInfo = getOperatingSystemInfo(userAgent);
  const deviceType = getDeviceType(userAgent);
  const screenInfo = getScreenInfo();
  const networkInfo = getNetworkInfo();

  return {
    // Navegador
    userAgent,
    browser: browserInfo.name,
    browserVersion: browserInfo.version,
    
    // Sistema operativo
    platform: navigator.platform,
    operatingSystem: osInfo.name,
    osVersion: osInfo.version,
    
    // Dispositivo
    isMobile: deviceType.isMobile,
    isTablet: deviceType.isTablet,
    isDesktop: deviceType.isDesktop,
    deviceType: deviceType.type,
    
    // Pantalla
    screenWidth: screenInfo.screenWidth,
    screenHeight: screenInfo.screenHeight,
    viewportWidth: screenInfo.viewportWidth,
    viewportHeight: screenInfo.viewportHeight,
    screenResolution: screenInfo.resolution,
    colorDepth: screenInfo.colorDepth,
    pixelRatio: screenInfo.pixelRatio,
    
    // Capacidades del navegador
    language: navigator.language,
    languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    cookieEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    
    // Hardware
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    
    // Red
    connectionType: networkInfo.connectionType,
    effectiveType: networkInfo.effectiveType,
    downlink: networkInfo.downlink,
    rtt: networkInfo.rtt
  };
};

/**
 * Información para entornos server-side
 */
const getServerSideDeviceInfo = (): DeviceInfo => {
  return {
    userAgent: 'Server-Side-Rendering',
    browser: 'SSR',
    browserVersion: '1.0',
    platform: 'server',
    operatingSystem: 'server',
    osVersion: '1.0',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop',
    screenWidth: 1920,
    screenHeight: 1080,
    viewportWidth: 1920,
    viewportHeight: 1080,
    screenResolution: '1920x1080',
    colorDepth: 24,
    pixelRatio: 1,
    language: 'en-US',
    languages: ['en-US'],
    timezone: 'UTC',
    timezoneOffset: 0,
    cookieEnabled: true,
    onlineStatus: true
  };
};

/**
 * Detecta información del navegador
 */
const getBrowserInfo = (userAgent: string): { name: string; version: string } => {
  const browsers = [
    { name: 'Chrome', regex: /Chrome\/(\d+)/ },
    { name: 'Firefox', regex: /Firefox\/(\d+)/ },
    { name: 'Safari', regex: /Safari\/(\d+)/ },
    { name: 'Edge', regex: /Edg\/(\d+)/ },
    { name: 'Opera', regex: /OPR\/(\d+)/ },
    { name: 'Internet Explorer', regex: /MSIE (\d+)/ },
    { name: 'Internet Explorer', regex: /Trident.*rv:(\d+)/ }
  ];

  for (const browser of browsers) {
    const match = userAgent.match(browser.regex);
    if (match) {
      return {
        name: browser.name,
        version: match[1]
      };
    }
  }

  return { name: 'Unknown', version: '0' };
};

/**
 * Detecta información del sistema operativo
 */
const getOperatingSystemInfo = (userAgent: string): { name: string; version: string } => {
  const systems = [
    { name: 'Windows', regex: /Windows NT (\d+\.\d+)/ },
    { name: 'macOS', regex: /Mac OS X (\d+[._]\d+)/ },
    { name: 'iOS', regex: /OS (\d+[._]\d+)/ },
    { name: 'Android', regex: /Android (\d+\.\d+)/ },
    { name: 'Linux', regex: /Linux/ },
    { name: 'Ubuntu', regex: /Ubuntu/ },
    { name: 'Chrome OS', regex: /CrOS/ }
  ];

  for (const system of systems) {
    const match = userAgent.match(system.regex);
    if (match) {
      return {
        name: system.name,
        version: match[1] ? match[1].replace('_', '.') : '1.0'
      };
    }
  }

  return { name: 'Unknown', version: '0' };
};

/**
 * Detecta tipo de dispositivo
 */
const getDeviceType = (userAgent: string): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  type: 'mobile' | 'tablet' | 'desktop';
} => {
  const mobileRegex = /Android.*Mobile|iPhone|iPod|BlackBerry|Windows Phone/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i;
  
  const isMobile = mobileRegex.test(userAgent);
  const isTablet = !isMobile && tabletRegex.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (isMobile) type = 'mobile';
  else if (isTablet) type = 'tablet';

  return { isMobile, isTablet, isDesktop, type };
};

/**
 * Obtiene información de pantalla
 */
const getScreenInfo = () => {
  const screenWidth = screen.width || 0;
  const screenHeight = screen.height || 0;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const colorDepth = screen.colorDepth || 24;
  const pixelRatio = window.devicePixelRatio || 1;

  return {
    screenWidth,
    screenHeight,
    viewportWidth,
    viewportHeight,
    resolution: `${screenWidth}x${screenHeight}`,
    colorDepth,
    pixelRatio
  };
};

/**
 * Obtiene información de red (si está disponible)
 */
const getNetworkInfo = () => {
  const connection = (navigator as any).connection || 
                   (navigator as any).mozConnection || 
                   (navigator as any).webkitConnection;

  if (connection) {
    return {
      connectionType: connection.type || undefined,
      effectiveType: connection.effectiveType || undefined,
      downlink: connection.downlink || undefined,
      rtt: connection.rtt || undefined
    };
  }

  return {
    connectionType: undefined,
    effectiveType: undefined,
    downlink: undefined,
    rtt: undefined
  };
};

/**
 * Detecta si es un dispositivo móvil (función de conveniencia)
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return getDeviceType(navigator.userAgent).isMobile;
};

/**
 * Detecta si es una tablet (función de conveniencia)
 */
export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return getDeviceType(navigator.userAgent).isTablet;
};

/**
 * Detecta si es desktop (función de conveniencia)
 */
export const isDesktopDevice = (): boolean => {
  if (typeof window === 'undefined') return true;
  return getDeviceType(navigator.userAgent).isDesktop;
};

/**
 * Obtiene el tipo de dispositivo (función de conveniencia)
 */
export const getDeviceTypeSimple = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  return getDeviceType(navigator.userAgent).type;
};
