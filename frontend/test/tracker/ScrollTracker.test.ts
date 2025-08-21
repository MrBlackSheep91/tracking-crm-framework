/**
 * Tests para ScrollTracker - Tracking de scroll y visibilidad
 */

import { ScrollTracker } from '../../src/tracker/ScrollTracker';
import { TrackerConfig } from '../../src/types';

describe('ScrollTracker', () => {
  let scrollTracker: ScrollTracker;
  let mockConfig: TrackerConfig;

  beforeEach(() => {
    mockConfig = {
      businessId: 123,
      baseUrl: 'http://localhost:3001',
      debug: true,
      enableScrollTracking: true,
      enableActivityMonitoring: true
    };
    scrollTracker = new ScrollTracker(mockConfig);

    // Mock window properties
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true });

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
  });

  afterEach(() => {
    try {
      scrollTracker.stop();
    } catch (e) {
      // Ignore cleanup errors
    }
    jest.clearAllMocks();
  });

  describe('Inicialización', () => {
    test('debería crear instancia correctamente', () => {
      expect(scrollTracker).toBeInstanceOf(ScrollTracker);
    });

    test('debería poder iniciar tracking', () => {
      expect(() => {
        scrollTracker.start();
      }).not.toThrow();
    });

    test('debería poder detener tracking', () => {
      scrollTracker.start();
      expect(() => {
        scrollTracker.stop();
      }).not.toThrow();
    });

    test('debería poder hacer reset', () => {
      expect(() => {
        scrollTracker.reset();
      }).not.toThrow();
    });

    test('debería configurar callbacks', () => {
      const callback = jest.fn();
      expect(() => {
        scrollTracker.onScrollChange(callback);
      }).not.toThrow();
    });

    test('debería obtener estadísticas', () => {
      const stats = scrollTracker.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });
});
