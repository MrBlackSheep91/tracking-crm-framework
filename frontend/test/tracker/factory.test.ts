/**
 * Tests para Factory - Funciones de creación de trackers
 */

import { createInnovaTracker, createDevelopmentTracker } from '../../src/tracker/factory';
import { InnovaTracker } from '../../src/tracker/InnovaTracker';

// Mock de fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const originalLog = console.log;
const originalError = console.error;

describe('Factory Functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.log = originalLog;
    console.error = originalError;
  });

  describe('createInnovaTracker', () => {
    test('debería crear instancia de InnovaTracker con configuración mínima', () => {
      const config = {
        businessId: 123
      };

      const tracker = createInnovaTracker(config);

      expect(tracker).toBeInstanceOf(InnovaTracker);
      // Verificar que el tracker se creó correctamente
      expect(tracker.getSessionId()).toBeNull(); // Sesión no iniciada aún
      
      const stats = tracker.getStats();
      expect(stats).toBeDefined();
      expect(stats.isInitialized).toBe(false);
      expect(stats.isTracking).toBe(false);
    });

    test('debería inicializar correctamente con configuración personalizada', async () => {
      // Mock successful health check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          healthy: true,
          services: { database: true, tracking: true, api: true }
        })
      });

      const config = {
        businessId: 456,
        debug: true,
        autoStart: false
      };

      const tracker = createInnovaTracker(config);
      
      expect(tracker).toBeInstanceOf(InnovaTracker);
      
      // Inicializar manualmente
      await tracker.init();
      
      const stats = tracker.getStats();
      expect(stats.isInitialized).toBe(true);
    });

    test('debería crear tracker sin businessId usando DEFAULT_CONFIG', () => {
      const tracker = createInnovaTracker({});
      expect(tracker).toBeInstanceOf(InnovaTracker);
      // businessId vendrá del DEFAULT_CONFIG
    });

    test('debería aceptar businessId como number', () => {
      const tracker1 = createInnovaTracker({ businessId: 0 });
      expect(tracker1).toBeInstanceOf(InnovaTracker);

      const tracker2 = createInnovaTracker({ businessId: 123 });
      expect(tracker2).toBeInstanceOf(InnovaTracker);
    });

    test('debería manejar health check exitoso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          healthy: true,
          services: { database: true, tracking: true, api: true }
        })
      });

      const tracker = createInnovaTracker({ businessId: 123 });
      
      const healthResult = await tracker.healthCheck();
      expect(healthResult.healthy).toBe(true);
      expect(healthResult.services).toBeDefined();
    });

    test('debería manejar health check fallido', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const tracker = createInnovaTracker({ businessId: 123 });
      
      const healthResult = await tracker.healthCheck();
      expect(healthResult.healthy).toBe(false);
      expect(healthResult.services).toBeDefined();
    });
  });

  describe('createDevelopmentTracker', () => {
    test('debería crear tracker con configuración de desarrollo', () => {
      const config = {
        businessId: 789
      };

      const tracker = createDevelopmentTracker(config);

      expect(tracker).toBeInstanceOf(InnovaTracker);
      
      // Verificar que está en modo desarrollo con estadísticas
      const stats = tracker.getStats();
      expect(stats).toBeDefined();
      expect(stats.isInitialized).toBe(false);
      expect(stats.isTracking).toBe(false);
    });

    test('debería usar configuración personalizada', () => {
      const tracker = createDevelopmentTracker({ businessId: 456 });
      
      // Verificar que se creó correctamente (businessId no está en stats públicas)
      expect(tracker).toBeInstanceOf(InnovaTracker);
      const stats = tracker.getStats();
      expect(stats.config.baseUrl).toBe('http://localhost:3001'); // Valor de desarrollo
    });

    test('debería habilitar logging en desarrollo', () => {
      const tracker = createDevelopmentTracker({ businessId: 999 });
      
      // Verificar que se llamó console.log durante la creación
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Funcionalidad de tracking', () => {
    test('debería poder trackear eventos básicos', () => {
      const tracker = createInnovaTracker({ businessId: 123 });

      expect(() => {
        tracker.trackPageView('/home');
        tracker.trackButtonClick('cta-button', 'Click me');
        tracker.trackCustomEvent('user_action', { action: 'scroll' });
      }).not.toThrow();
    });

    test('debería poder configurar callbacks', () => {
      const tracker = createInnovaTracker({ businessId: 123 });
      
      const sessionStartCallback = jest.fn();
      const sessionEndCallback = jest.fn();
      const eventTrackCallback = jest.fn();
      const errorCallback = jest.fn();

      expect(() => {
        tracker.onSessionStart(sessionStartCallback);
        tracker.onSessionEnd(sessionEndCallback);
        tracker.onEventTrack(eventTrackCallback);
        tracker.onError(errorCallback);
      }).not.toThrow();
    });

    test('debería poder obtener información de la sesión', () => {
      const tracker = createInnovaTracker({ businessId: 123 });

      const sessionId = tracker.getSessionId();
      const sessionInfo = tracker.getSessionInfo();
      const stats = tracker.getStats();

      expect(sessionId).toBeNull(); // No hay sesión activa aún
      expect(sessionInfo).toBeNull(); // No hay sesión activa aún
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    test('debería poder hacer flush de datos', async () => {
      const tracker = createInnovaTracker({ businessId: 123 });

      await expect(tracker.flush()).resolves.not.toThrow();
    });

    test('debería poder hacer reset', async () => {
      const tracker = createInnovaTracker({ businessId: 123 });

      await expect(tracker.reset()).resolves.not.toThrow();
      
      const stats = tracker.getStats();
      expect(stats.isInitialized).toBe(false);
      expect(stats.isTracking).toBe(false);
    });
  });

  describe('Métricas y estadísticas', () => {
    test('debería poder obtener métricas del backend', async () => {
      // Mock successful metrics response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ metrics: { sessions: 100, events: 500 } })
      });

      const tracker = createInnovaTracker({ businessId: 123 });
      
      const metrics = await tracker.getMetrics();
      expect(metrics).toBeDefined();
    });

    test('debería poder obtener métricas en tiempo real', async () => {
      // Mock successful realtime metrics response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ realtime: { active_sessions: 5 } })
      });

      const tracker = createInnovaTracker({ businessId: 123 });
      
      const realtimeMetrics = await tracker.getRealtimeMetrics();
      expect(realtimeMetrics).toBeDefined();
    });

    test('debería poder obtener métricas del dashboard', async () => {
      // Mock successful dashboard metrics response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ dashboard: { daily_sessions: 25 } })
      });

      const tracker = createInnovaTracker({ businessId: 123 });
      
      const dashboardMetrics = await tracker.getDashboardMetrics('daily');
      expect(dashboardMetrics).toBeDefined();
    });
  });

  describe('Gestión de errores', () => {
    test('debería manejar errores de inicialización', async () => {
      // Mock failed health check
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const errorCallback = jest.fn();
      const tracker = createInnovaTracker({ 
        businessId: 123,
        onError: errorCallback 
      });

      // init() completa exitosamente incluso con healthCheck fallido
      await expect(tracker.init()).resolves.not.toThrow();
      expect(tracker.getStats().isInitialized).toBe(true);
    });

    test('debería manejar errores de tracking', () => {
      const errorCallback = jest.fn();
      const tracker = createInnovaTracker({ 
        businessId: 123,
        onError: errorCallback 
      });

      // Intentar trackear sin inicializar debería ser seguro
      expect(() => {
        tracker.track('test', 'test_event', { data: 'test' });
      }).not.toThrow();
    });
  });
});
