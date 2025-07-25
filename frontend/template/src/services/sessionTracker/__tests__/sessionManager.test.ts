// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import sessionManager from '../sessionManager';
import { server } from '../../../test/server';
import type { Mock } from 'vitest';

// Asegurarse de que el entorno de pruebas esté configurado correctamente
if (!globalThis.window) {
  throw new Error('No window object found. Make sure tests are running in jsdom environment.');
}

// Configura el servidor de pruebas MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SessionManager', () => {
  // Limpia el almacenamiento local antes de cada prueba
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reinicia la instancia de sessionManager
    sessionManager.reset();
  });

  describe('Inicialización', () => {
    it('debe inicializarse correctamente', () => {
      console.log('Ejecutando prueba de inicialización');
      expect(sessionManager).toBeDefined();
      expect(sessionManager.getSessionId()).toBeUndefined();
      expect(sessionManager.getVisitorId()).toBeUndefined();
    });
  });

  describe('Manejo de sesiones', () => {
    it('debe crear una nueva sesión al iniciar', () => {
      // Actuar
      sessionManager.startNewSession();
      
      // Afirmar
      const sessionId = sessionManager.getSessionId();
      const visitorId = sessionManager.getVisitorId();
      
      expect(sessionId).toBeDefined();
      expect(visitorId).toBeDefined();
      expect(localStorage.getItem('sessionId')).toBe(sessionId);
      expect(localStorage.getItem('visitorId')).toBe(visitorId);
    });

    it('debe cargar una sesión existente si existe', () => {
      // Preparar
      const testSessionId = 'test-session-id';
      const testVisitorId = 'test-visitor-id';
      localStorage.setItem('sessionId', testSessionId);
      localStorage.setItem('visitorId', testVisitorId);
      
      // Actuar
      sessionManager.loadExistingSession();
      
      // Afirmar
      expect(sessionManager.getSessionId()).toBe(testSessionId);
      expect(sessionManager.getVisitorId()).toBe(testVisitorId);
    });
  });

  describe('Seguimiento de actividad', () => {
    it('debe actualizar el tiempo de última actividad', () => {
      // Preparar
      const initialTime = new Date().getTime();
      sessionManager.startNewSession();
      
      // Actuar
      const updateSpy = vi.spyOn(sessionManager, 'updateActivityTime') as Mock;
      sessionManager.updateActivityTime();
      
      // Afirmar
      expect(updateSpy).toHaveBeenCalled();
      const lastActivity = sessionManager.getLastActivityTime();
      expect(lastActivity).toBeGreaterThanOrEqual(initialTime);
    });

    it('debe detectar inactividad', async () => {
      // Guardar la implementación original de Date.now
      const originalDateNow = Date.now;
      
      try {
        // Preparar
        const now = Date.now();
        
        // Mock Date.now para controlar el tiempo
        vi.spyOn(Date, 'now').mockImplementation(() => now);
        
        // Iniciar sesión - esto establecerá lastActivityTime
        await sessionManager.startNewSession();
        
        // Avanzar el tiempo 16 minutos (16 * 60 * 1000 ms)
        const sixteenMinutesLater = now + (16 * 60 * 1000);
        vi.spyOn(Date, 'now').mockImplementation(() => sixteenMinutesLater);
        
        // Forzar la actualización de lastActivityTime para que coincida con nuestro mock
        // @ts-ignore - Accediendo a variable privada para la prueba
        sessionManager.lastActivityTime = now;
        
        // Actuar - Verificar inactividad con un umbral de 15 minutos
        const isInactive = sessionManager.checkInactivity(15);
        
        // Afirmar
        expect(isInactive).toBe(true);
      } finally {
        // Restaurar la implementación original
        vi.restoreAllMocks();
      }
    });
  });

  describe('Manejo de eventos', () => {
    it('debe registrar eventos correctamente', () => {
      // Preparar
      sessionManager.startNewSession();
      const testEvent = { type: 'test', data: { key: 'value' } };
      
      // Actuar
      sessionManager.recordEvent(testEvent.type, testEvent.data);
      
      // Afirmar
      const events = sessionManager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: testEvent.type,
        data: testEvent.data,
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Envío de datos', () => {
    // Los mocks se manejan dentro de cada prueba para evitar fugas entre pruebas

    it('debe enviar datos de sesión al servidor', async () => {
      // Mock del objeto console.error para evitar ruido en las pruebas
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Importar el módulo para poder espiar la función exportada
      const sessionManagerModule = await import('../sessionManager');
      
      // Crear un mock para la función sendToWebhook
      const mockSendToWebhook = vi.fn().mockResolvedValue(undefined);
      
      // Espiar la función exportada y reemplazarla con el mock
      const sendToWebhookSpy = vi
        .spyOn(sessionManagerModule, 'sendToWebhook')
        .mockImplementation(mockSendToWebhook);
      
      try {
        // Crear una sesión de prueba
        await sessionManager.startNewSession();
        
        // Asegurarse de que hay una sesión activa
        expect(sessionManager.getSessionId()).toBeDefined();
        expect(sessionManager.getVisitorId()).toBeDefined();
        
        // Actuar: Llamar a sendSessionData
        await sessionManager.sendSessionData();
        
        // Afirmar: Verificar que se llamó a sendToWebhook
        expect(mockSendToWebhook).toHaveBeenCalledTimes(1);
        
        // Verificar que se enviaron los datos correctos
        const callArgs = mockSendToWebhook.mock.calls[0][0];
        expect(callArgs).toMatchObject({
          sessionId: expect.any(String),
          visitorId: expect.any(String),
          events: expect.any(Array),
          deviceInfo: expect.any(Object),
          timestamp: expect.any(Number)
        });
        
        // Verificar que los IDs coinciden con los de la sesión actual
        expect(callArgs.sessionId).toBe(sessionManager.getSessionId());
        expect(callArgs.visitorId).toBe(sessionManager.getVisitorId());
      } finally {
        // Restaurar console.error
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('Detección de dispositivo', () => {
    let originalInnerWidth: number;
    
    beforeEach(() => {
      // Guardar el valor original
      originalInnerWidth = window.innerWidth;
      // Mock de window.innerWidth para simular un dispositivo móvil
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375 // Ancho típico de un móvil
      });
    });
    
    afterEach(() => {
      // Restaurar el valor original
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth
      });
    });
    
    it('debe detectar correctamente el tipo de dispositivo móvil', () => {
      // Preparar
      const mockMobileAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15';
      Object.defineProperty(window.navigator, 'userAgent', {
        value: mockMobileAgent,
        configurable: true,
      });
      
      // Actuar
      const deviceType = sessionManager.getDeviceType();
      
      // Afirmar
      expect(deviceType).toBe('mobile');
    });
  });
});
