import { SessionManager } from '../../src/tracker/SessionManager';
import { TrackerConfig } from '../../src/types';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockConfig: TrackerConfig;

  beforeEach(() => {
    mockConfig = {
      businessId: 123,
      baseUrl: 'http://localhost:3001',
      debug: true,
      heartbeatInterval: 15000,
      inactivityTimeout: 30000,
      eventBufferSize: 10,
      maxRetries: 3,
      retryDelay: 1000
    };

    sessionManager = new SessionManager(mockConfig);
  });

  afterEach(() => {
    try {
      if (sessionManager && typeof sessionManager.endSession === 'function') {
        sessionManager.endSession();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    jest.clearAllMocks();
  });

  describe('Inicialización', () => {
    test('debería crear instancia correctamente', () => {
      expect(sessionManager).toBeInstanceOf(SessionManager);
    });

    test('debería poder iniciar sesión', async () => {
      const sessionData = await sessionManager.startSession();
      
      expect(sessionData).toBeDefined();
      expect(sessionData.sessionId).toBeDefined();
      expect(sessionData.visitorId).toBeDefined();
      expect(sessionData.businessId).toBe(123);
    });
  });

  describe('Gestión de eventos', () => {
    beforeEach(async () => {
      await sessionManager.startSession();
    });

    test('debería poder agregar eventos', () => {
      expect(() => {
        sessionManager.addEvent({
          eventId: 'test-event-1',
          sessionId: 'test-session',
          visitorId: 'test-visitor',
          businessId: 123,
          category: 'user_interaction',
          eventType: 'click',
          eventName: 'button_click',
          priority: 'normal',
          eventData: { buttonId: 'test-button' },
          timestamp: new Date().toISOString(),
          clientTimestamp: Date.now(),
          pageUrl: 'http://localhost/test',
          pageTitle: 'Test Page',
          attempts: 0,
          sent: false
        });
      }).not.toThrow();
    });

    test('debería poder finalizar sesión', () => {
      expect(() => {
        sessionManager.endSession();
      }).not.toThrow();
    });
  });

  describe('Control de sesión', () => {
    test('debería indicar si la sesión está activa', async () => {
      expect(sessionManager.isActive()).toBe(false);
      
      await sessionManager.startSession();
      expect(sessionManager.isActive()).toBe(true);
      
      await sessionManager.endSession();
      expect(sessionManager.isActive()).toBe(false);
    });
  });
});
