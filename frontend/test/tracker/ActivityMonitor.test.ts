import { ActivityMonitor } from '../../src/tracker/ActivityMonitor';
import { TrackerConfig } from '../../src/types';

// Mock console methods
const originalLog = console.log;
const originalError = console.error;

describe('ActivityMonitor', () => {
  let activityMonitor: ActivityMonitor;
  let mockConfig: TrackerConfig;

  beforeEach(() => {
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    
    mockConfig = {
      businessId: 123,
      baseUrl: 'http://localhost:3001',
      debug: true,
      heartbeatInterval: 15000,
      inactivityTimeout: 5000, // Reducido para tests
      eventBufferSize: 10,
      maxRetries: 3,
      retryDelay: 1000,
      activityUpdateInterval: 1000
    };
    
    activityMonitor = new ActivityMonitor(mockConfig);
  });

  afterEach(() => {
    try {
      activityMonitor.stop();
    } catch (e) {
      // Ignore cleanup errors
    }
    
    // Restore console methods
    console.log = originalLog;
    console.error = originalError;
    
    jest.clearAllMocks();
  });

  describe('Inicialización', () => {
    test('debería crear instancia correctamente', () => {
      expect(activityMonitor).toBeInstanceOf(ActivityMonitor);
    });

    test('debería poder iniciar monitoreo', () => {
      expect(() => {
        activityMonitor.start();
      }).not.toThrow();
    });

    test('debería poder detener monitoreo', () => {
      activityMonitor.start();
      
      expect(() => {
        activityMonitor.stop();
      }).not.toThrow();
    });
  });

  describe('Gestión de estado', () => {
    test('debería poder obtener estadísticas', () => {
      const stats = activityMonitor.getStats();
      
      expect(stats).toBeDefined();
      expect(stats).toMatchObject({
        isActive: expect.any(Boolean),
        lastActivityAt: expect.any(Number),
        timeSinceLastActivity: expect.any(Number),
        totalActiveTime: expect.any(Number),
        totalInactiveTime: expect.any(Number),
        inactivityCount: expect.any(Number),
        activityEvents: expect.objectContaining({
          clicks: expect.any(Number),
          keystrokes: expect.any(Number),
          mouseMoves: expect.any(Number),
          scrolls: expect.any(Number),
          focus: expect.any(Number),
          blur: expect.any(Number)
        }),
        engagementScore: expect.any(Number),
        interactionScore: expect.any(Number)
      });
    });

    test('debería verificar si el usuario está activo', () => {
      const isActive = activityMonitor.isUserActive();
      expect(typeof isActive).toBe('boolean');
    });

    test('debería obtener tiempo desde última actividad', () => {
      const timeSince = activityMonitor.getTimeSinceLastActivity();
      expect(typeof timeSince).toBe('number');
      expect(timeSince).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Callbacks', () => {
    test('debería configurar callback de cambio de actividad', () => {
      const mockCallback = jest.fn();
      
      expect(() => {
        activityMonitor.onActivityChange(mockCallback);
      }).not.toThrow();
    });

    test('debería configurar callback de inactividad', () => {
      const mockCallback = jest.fn();
      
      expect(() => {
        activityMonitor.onInactivity(mockCallback);
      }).not.toThrow();
    });
  });

  describe('Detección de actividad', () => {
    let mockActivityCallback: jest.Mock;

    beforeEach(() => {
      mockActivityCallback = jest.fn();
      activityMonitor.onActivityChange(mockActivityCallback);
      activityMonitor.start();
    });

    test('debería detectar eventos click', () => {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        clientX: 100,
        clientY: 200
      });

      document.dispatchEvent(clickEvent);

      const stats = activityMonitor.getStats();
      expect(stats.activityEvents.clicks).toBeGreaterThan(0);
    });

    test('debería detectar eventos keydown', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true
      });

      document.dispatchEvent(keyEvent);

      const stats = activityMonitor.getStats();
      expect(stats.activityEvents.keystrokes).toBeGreaterThan(0);
    });

    test('debería detectar eventos mousemove con throttling', async () => {
      // Primer evento mousemove
      const mouseMoveEvent1 = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 150,
        clientY: 250
      });

      document.dispatchEvent(mouseMoveEvent1);

      const stats1 = activityMonitor.getStats();
      const initialMouseMoves = stats1.activityEvents.mouseMoves;

      // Segundo evento inmediato (debería ser throttled)
      const mouseMoveEvent2 = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 160,
        clientY: 260
      });

      document.dispatchEvent(mouseMoveEvent2);

      const stats2 = activityMonitor.getStats();
      // Debería ser el mismo por throttling
      expect(stats2.activityEvents.mouseMoves).toBe(initialMouseMoves);
    });

    test('debería detectar eventos scroll', () => {
      const scrollEvent = new Event('scroll', { bubbles: true });

      document.dispatchEvent(scrollEvent);

      const stats = activityMonitor.getStats();
      expect(stats.activityEvents.scrolls).toBeGreaterThan(0);
    });
  });

  describe('Gestión de inactividad', () => {
    test('debería manejar inactividad después del timeout', (done) => {
      const mockInactivityCallback = jest.fn();
      activityMonitor.onInactivity(mockInactivityCallback);
      
      activityMonitor.start();

      // Esperar más que el timeout de inactividad
      setTimeout(() => {
        const stats = activityMonitor.getStats();
        expect(stats.isActive).toBe(false);
        expect(mockInactivityCallback).toHaveBeenCalled();
        done();
      }, 5500);
    }, 6000);

    test('debería reactivar después de actividad', () => {
      activityMonitor.start();
      
      // Simular actividad
      const clickEvent = new MouseEvent('click', { bubbles: true });
      document.dispatchEvent(clickEvent);

      const stats = activityMonitor.getStats();
      expect(stats.isActive).toBe(true);
    });
  });

  describe('Reset', () => {
    test('debería reiniciar correctamente', async () => {
      activityMonitor.start();
      
      // Generar actividad
      const clickEvent = new MouseEvent('click', { bubbles: true });
      document.dispatchEvent(clickEvent);

      let stats = activityMonitor.getStats();
      expect(stats.activityEvents.clicks).toBeGreaterThan(0);

      // Pequeño delay para asegurar que los timers procesan
      await new Promise(resolve => setTimeout(resolve, 10));

      // Reset
      activityMonitor.reset();

      // Pequeño delay después del reset
      await new Promise(resolve => setTimeout(resolve, 10));

      stats = activityMonitor.getStats();
      expect(stats.activityEvents.clicks).toBe(0);
      // Verificar que el totalActiveTime se reinicia (puede tener un valor residual mínimo)
      expect(stats.totalActiveTime).toBeLessThan(100); // Permitir un valor mínimo
      expect(stats.totalInactiveTime).toBe(0);
      expect(stats.inactivityCount).toBe(0);
    });
  });

  describe('Scores de engagement', () => {
    test('debería calcular engagement score', () => {
      activityMonitor.start();
      
      // Generar actividad variada
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      document.dispatchEvent(new Event('scroll', { bubbles: true }));

      const stats = activityMonitor.getStats();
      expect(stats.engagementScore).toBeGreaterThanOrEqual(0);
      expect(stats.engagementScore).toBeLessThanOrEqual(100);
      expect(stats.interactionScore).toBeGreaterThanOrEqual(0);
      expect(stats.interactionScore).toBeLessThanOrEqual(100);
    });
  });
});
