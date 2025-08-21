/**
 * Tests para Device Info utilities
 */

import { getDeviceInfo } from '../../src/utils/deviceInfo';

describe('Device Info Utils', () => {
  beforeEach(() => {
    // Reset navigator mock
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        language: 'es-ES',
        platform: 'Win32'
      },
      writable: true
    });

    Object.defineProperty(window, 'screen', {
      value: {
        width: 1920,
        height: 1080
      },
      writable: true
    });

    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
  });

  describe('getDeviceInfo', () => {
    test('debería detectar información básica del dispositivo', () => {
      const deviceInfo = getDeviceInfo();

      expect(deviceInfo).toMatchObject({
        deviceType: expect.any(String),
        userAgent: expect.any(String),
        browser: expect.any(String),
        browserVersion: expect.any(String),
        operatingSystem: expect.any(String),
        osVersion: expect.any(String),
        language: expect.any(String),
        timezone: expect.any(String),
        screenResolution: expect.any(String),
        isMobile: expect.any(Boolean),
        isTablet: expect.any(Boolean),
        isDesktop: expect.any(Boolean),
        screenWidth: expect.any(Number),
        screenHeight: expect.any(Number),
        viewportWidth: expect.any(Number),
        viewportHeight: expect.any(Number)
      });
    });

    test('debería detectar Chrome correctamente', () => {
      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.browser).toBe('Chrome');
      expect(deviceInfo.browserVersion).toMatch(/^120/);
    });

    test('debería detectar Windows correctamente', () => {
      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.operatingSystem).toBe('Windows');
      expect(deviceInfo.osVersion).toMatch(/10/);
    });

    test('debería detectar tipo de dispositivo desktop', () => {
      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.deviceType).toBe('desktop');
      expect(deviceInfo.isDesktop).toBe(true);
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(false);
    });

    test('debería detectar dispositivo móvil', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          language: 'es-ES',
          platform: 'iPhone'
        },
        writable: true
      });

      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.deviceType).toBe('mobile');
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.operatingSystem).toBe('iOS');
    });

    test('debería detectar tablet', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          language: 'es-ES',
          platform: 'iPad'
        },
        writable: true
      });

      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.deviceType).toBe('tablet');
      expect(deviceInfo.isTablet).toBe(true);
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isDesktop).toBe(false);
    });

    test('debería detectar Firefox correctamente', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
          language: 'es-ES',
          platform: 'Win32'
        },
        writable: true
      });

      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.browser).toBe('Firefox');
      expect(deviceInfo.browserVersion).toMatch(/^120/);
    });

    test('debería detectar Safari correctamente', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.0 Safari/537.36',
          language: 'es-ES',
          platform: 'MacIntel'
        },
        writable: true
      });

      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.browser).toBe('Safari');
      expect(deviceInfo.operatingSystem).toBe('macOS');
    });

    test('debería detectar Android correctamente', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Linux; Android 13.0; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          language: 'es-ES',
          platform: 'Linux armv7l',
          languages: ['es-ES'],
          cookieEnabled: true,
          onLine: true,
          hardwareConcurrency: 8,
          maxTouchPoints: 5
        },
        writable: true
      });

      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.operatingSystem).toBe('Android');
      expect(deviceInfo.osVersion).toBe('13.0');
      expect(deviceInfo.deviceType).toBe('mobile');
      expect(deviceInfo.isMobile).toBe(true);
    });

    test('debería manejar user agents desconocidos', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'UnknownBrowser/1.0',
          language: 'es-ES',
          platform: 'Unknown'
        },
        writable: true
      });

      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.browser).toBe('Unknown');
      expect(deviceInfo.operatingSystem).toBe('Unknown');
      expect(deviceInfo.browserVersion).toBe('0');
    });

    test('debería incluir resolución de pantalla correcta', () => {
      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.screenResolution).toBe('1920x1080');
      expect(deviceInfo.screenWidth).toBe(1920);
      expect(deviceInfo.screenHeight).toBe(1080);
      expect(deviceInfo.viewportWidth).toBe(1200);
      expect(deviceInfo.viewportHeight).toBe(800);
    });

    test('debería incluir timezone del usuario', () => {
      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.timezone).toBeDefined();
      expect(typeof deviceInfo.timezone).toBe('string');
    });

    test('debería incluir idioma del navegador', () => {
      const deviceInfo = getDeviceInfo();

      expect(deviceInfo.language).toBe('es-ES');
    });

    test('debería manejar errores graciosamente', () => {
      // Simular entorno server-side donde window es undefined
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => getDeviceInfo()).not.toThrow();
      
      const deviceInfo = getDeviceInfo();
      // En este caso debe devolver la info de server-side
      expect(deviceInfo.browser).toBe('SSR');
      expect(deviceInfo.operatingSystem).toBe('server');
      
      // Restaurar window
      global.window = originalWindow;
    });
  });
});
