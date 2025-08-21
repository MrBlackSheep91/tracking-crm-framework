import { createDevelopmentTracker } from '../dist/index.js';

console.log('🚀 Test Runner: Cargado');

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const customEventBtn = document.getElementById('custom-event-btn');

  try {
    console.log('🚀 Test Runner: Inicializando InnovaTracker...');
    statusEl.textContent = 'Inicializando tracker...';

    // 1. Instanciar el tracker usando la factory de desarrollo
    const tracker = createDevelopmentTracker({
      businessId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      // Alinear endpoints con el backend: /api/v1/track/*
      endpoints: {
        sessionStart: '/api/v1/track/start-session',
        sessionEnd: '/api/v1/track/session-end',
        batchEvents: '/api/v1/track/batch-events',
        heartbeat: '/api/v1/track/heartbeat',
        health: '/api/v1/track/health'
      }
    });
    // 2. Inicializar explícitamente (autoStart: true iniciará el tracking)
    await tracker.init();

    // Exponer para debug en consola
    window.tracker = tracker;

    console.log('✅ Test Runner: InnovaTracker inicializado y sesión iniciada.', tracker);
    statusEl.textContent = `Tracker activo. SessionID: ${tracker.getSessionId()}`;

    // 3. Configurar manejadores de eventos
    customEventBtn.addEventListener('click', () => {
      console.log('🚀 Test Runner: Enviando evento personalizado...');
      tracker.track('user_interaction', 'test_button_click', {
        buttonLabel: 'Enviar Evento Personalizado',
        clickedAt: new Date().toISOString(),
      });
      console.log('✅ Test Runner: Evento personalizado enviado.');
    });

  } catch (error) {
    console.error('❌ Test Runner: Error al inicializar el tracker:', error);
    statusEl.textContent = 'Error al inicializar el tracker. Revisa la consola.';
    statusEl.style.backgroundColor = '#ffdddd';
    statusEl.style.color = '#d8000c';
  }
});
