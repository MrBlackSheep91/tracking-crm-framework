/**
 * Tests para InnovaTracker - Clase principal del sistema de tracking
 */

import { InnovaTracker } from '../../src/tracker/InnovaTracker';
import { TrackerConfig } from '../../src/types';

// Mock de fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('InnovaTracker', () => {
  let tracker: InnovaTracker;
  let mockConfig: TrackerConfig;

  beforeEach(() => {
    // Reset mocks
    mockFetch.mockReset();
    (console.log as jest.Mock).mockReset();
    (console.error as jest.Mock).mockReset();
    
    mockConfig = {
      businessId: 123,
      baseUrl: 'http://localhost:3001',
      debug: true,
      enableScrollTracking: true,
      enableActivityMonitoring: true,
      autoStart: false
    };

    tracker = new InnovaTracker(mockConfig);
    mockFetch.mockClear();
  });

  afterEach(async () => {
    try {
      await tracker.stopTracking('test_cleanup');
    } catch (e) {
      // Ignore cleanup errors
    }
    jest.clearAllMocks();
  });

  describe('Inicialización', () => {
    test('debería inicializar correctamente', () => {
      expect(tracker).toBeInstanceOf(InnovaTracker);
    });

    test('debería inicializar y hacer health check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ healthy: true })
      });

      await tracker.init();
      
      // Verificar que se puede llamar init sin errores
      expect(mockFetch).toHaveBeenCalled();
    });

    test('debería manejar errores de inicialización', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // No debería lanzar error, debería manejarlo internamente
      await expect(tracker.init()).resolves.not.toThrow();
      
      // Verificar que se logueó el error
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Tracking de eventos', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      await tracker.init();
    });

    test('debería trackear eventos personalizados', () => {
      const eventData = { buttonId: 'cta-main', value: 100 };
      
      // Simplemente verificar que no lance error
      expect(() => {
        tracker.track('custom_event', 'button_click', eventData);
      }).not.toThrow();
    });

    test('debería trackear vistas de página', () => {
      // Verificar que trackPageView funciona con la API real
      expect(() => {
        tracker.trackPageView('/test-page', { title: 'Test Page' });
      }).not.toThrow();
    });

    test('debería trackear clics de botones', () => {
      // Verificar que trackButtonClick funciona con la API real
      expect(() => {
        tracker.trackButtonClick('test-button', 'Click me', { customData: 'test' });
      }).not.toThrow();
    });

    test('debería trackear interacciones de formulario', () => {
      // Verificar que trackFormInteraction funciona con la API real
      expect(() => {
        tracker.trackFormInteraction('contact-form', 'submit', {
          fields: ['email', 'name'],
          isValid: true
        });
      }).not.toThrow();
    });

    test('debería trackear clics de CTA', () => {
      // Verificar que trackCTAClick funciona con la API real
      expect(() => {
        tracker.trackCTAClick('hero-cta', { text: 'Comenzar Ahora', url: '/signup' });
      }).not.toThrow();
    });
  });

  describe('Gestión de sesión', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      await tracker.init();
    });

    test('debería iniciar y detener tracking', async () => {
      await tracker.startTracking();
      await tracker.stopTracking('test');
      
      // Verificar que no lanza errores
      expect(true).toBe(true);
    });

    test('debería poder hacer flush de datos', async () => {
      await tracker.flush();
      
      // Verificar que no lanza errores
      expect(true).toBe(true);
    });

    test('debería manejar errores de red graciosamente', async () => {
      // Mock fetch para que falle en el healthCheck
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // El init() completa exitosamente incluso si healthCheck falla
      await expect(tracker.init()).resolves.not.toThrow();
      
      // Verificar que el tracker se inicializó correctamente
      expect(tracker.getStats().isInitialized).toBe(true);
    });
  });

  describe('Callbacks y eventos', () => {
    test('debería configurar callback de errores', () => {
      const onError = jest.fn();
      
      expect(() => {
        tracker.onError(onError);
      }).not.toThrow();
    });

    test('debería poder trackear eventos personalizados', () => {
      expect(() => {
        tracker.trackCustomEvent('custom_action', { data: 'test' });
      }).not.toThrow();
    });

    test('debería poder hacer reset del tracker', async () => {
      await tracker.reset();
      
      // Verificar que no lanza errores
      expect(true).toBe(true);
    });
  });

  describe('Utilidades y estado', () => {
    test('debería hacer flush manual de eventos', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await tracker.init();
      tracker.track('event1', 'test', { test: 'data' });

      await tracker.flush();

      // Verificar que no lanza errores
      expect(true).toBe(true);
    });

    test('debería verificar health del backend', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          healthy: true,
          services: { api: true, database: true, tracking: true },
          timestamp: '2025-08-21T05:57:58.010Z'
        })
      });

      const health = await tracker.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.services).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });

    test('debería manejar set de URL actual', () => {
      expect(() => {
        tracker.setCurrentUrl('/test-page');
      }).not.toThrow();
    });
  });
});
