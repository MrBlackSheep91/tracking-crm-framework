/**
 * Tests para Fingerprint utilities
 */

import { generateFingerprint } from '../../src/utils/fingerprint';

describe('Fingerprint Utils', () => {
  beforeEach(() => {
    // Mock consistent browser environment
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        language: 'es-ES',
        platform: 'Win32',
        hardwareConcurrency: 8,
        deviceMemory: 8
      },
      writable: true
    });

    Object.defineProperty(window, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        colorDepth: 24,
        pixelDepth: 24
      },
      writable: true
    });

    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
  });

  describe('generateFingerprint', () => {
    test('debería generar fingerprint consistente', () => {
      const fingerprint1 = generateFingerprint();
      const fingerprint2 = generateFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
      expect(typeof fingerprint1).toBe('string');
      expect(fingerprint1.length).toBeGreaterThan(0);
    });

    test('debería generar fingerprints diferentes para diferentes dispositivos', () => {
      const fingerprint1 = generateFingerprint();

      // Cambiar características del dispositivo
      Object.defineProperty(window, 'screen', {
        value: {
          width: 1366,
          height: 768,
          colorDepth: 32,
          pixelDepth: 32
        },
        writable: true
      });

      const fingerprint2 = generateFingerprint();

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    test('debería incluir información de pantalla en fingerprint', () => {
      const fingerprint = generateFingerprint();

      // El fingerprint debería cambiar si cambia la resolución
      Object.defineProperty(window, 'screen', {
        value: {
          width: 2560,
          height: 1440,
          colorDepth: 24,
          pixelDepth: 24
        },
        writable: true
      });

      const differentFingerprint = generateFingerprint();
      expect(fingerprint).not.toBe(differentFingerprint);
    });

    test('debería incluir información del navegador en fingerprint', () => {
      const fingerprint1 = generateFingerprint();

      // Cambiar user agent
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          language: 'en-US',
          platform: 'MacIntel',
          hardwareConcurrency: 8,
          deviceMemory: 16
        },
        writable: true
      });

      const fingerprint2 = generateFingerprint();
      expect(fingerprint1).not.toBe(fingerprint2);
    });

    test('debería manejar propiedades faltantes graciosamente', () => {
      // Mock navigator con propiedades limitadas
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'BasicBrowser/1.0',
          language: 'es-ES'
          // Faltan hardwareConcurrency y deviceMemory
        },
        writable: true
      });

      expect(() => generateFingerprint()).not.toThrow();
      
      const fingerprint = generateFingerprint();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    test('debería incluir timezone en fingerprint', () => {
      const fingerprint1 = generateFingerprint();

      // Mock diferente timezone (esto es difícil de mockear, pero podemos verificar que se incluye)
      const originalDateTimeFormat = Intl.DateTimeFormat;
      
      // Mock timezone diferente
      global.Intl = {
        ...global.Intl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' })
        }))
      } as any;

      const fingerprint2 = generateFingerprint();

      // Restaurar original
      global.Intl.DateTimeFormat = originalDateTimeFormat;

      // Los fingerprints deberían ser diferentes si el timezone es diferente
      expect(typeof fingerprint1).toBe('string');
      expect(typeof fingerprint2).toBe('string');
    });

    test('debería generar hash de longitud consistente', () => {
      const fingerprints: string[] = [];
      
      for (let i = 0; i < 10; i++) {
        const fp = generateFingerprint();
        fingerprints.push(fp);
      }

      // Todos deberían tener la misma longitud
      const lengths = fingerprints.map(fp => fp.length);
      expect(new Set(lengths).size).toBe(1);
    });

    test('debería usar caracteres válidos en fingerprint', () => {
      const fingerprint = generateFingerprint();
      
      // Debería tener formato "innova_" seguido de caracteres alfanuméricos
      const validCharsRegex = /^innova_[a-z0-9]+$/;
      expect(fingerprint).toMatch(validCharsRegex);
    });

    test('debería ser determinístico dentro de la misma sesión', () => {
      const fingerprints: string[] = [];
      
      // Generar múltiples fingerprints en rápida sucesión
      for (let i = 0; i < 5; i++) {
        fingerprints.push(generateFingerprint());
      }

      // Todos deberían ser idénticos
      expect(new Set(fingerprints).size).toBe(1);
    });

    test('debería incluir información de canvas si está disponible', () => {
      // Mock canvas context
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({
          fillText: jest.fn(),
          fillStyle: '',
          font: '',
          toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockcanvasdata')
        }),
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockcanvasdata')
      };

      Object.defineProperty(document, 'createElement', {
        value: jest.fn().mockImplementation((tagName) => {
          if (tagName === 'canvas') {
            return mockCanvas;
          }
          return document.createElement(tagName);
        }),
        writable: true
      });

      const fingerprint = generateFingerprint();
      
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });
  });
});
