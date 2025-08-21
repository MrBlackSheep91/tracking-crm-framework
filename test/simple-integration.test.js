/**
 * TEST DE INTEGRACIÓN SIMPLE - SIN LEGACY
 * Prueba el flujo completo: Cliente → JOI → Prisma
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const CONFIG = {
  backendUrl: 'http://localhost:3001',
  businessId: '00000000-0000-0000-0000-000000000001',
  timeout: 10000
};

class SimpleTrackingClient {
  constructor() {
    this.visitorId = uuidv4();
    this.sessionId = uuidv4();
    this.businessId = CONFIG.businessId;
  }

  async startSession() {
    const payload = {
      visitor: {
        visitorId: this.visitorId,
        businessId: this.businessId,
        fingerprint: `fp_${Math.random().toString(36).substring(2, 15)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
        browser: 'Chrome',
        browserVersion: '120.0.0.0',
        operatingSystem: 'Windows',
        osVersion: '10',
        screenResolution: '1920x1080',
        timezone: 'America/Montevideo',
        language: 'es-419',
        country: 'Uruguay',
        region: 'Montevideo',
        city: 'Montevideo',
        latitude: -34.9011,
        longitude: -56.1645
      },
      session: {
        id: this.sessionId,
        visitorId: this.visitorId,
        businessId: this.businessId,
        startedAt: new Date().toISOString(),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
        browser: 'Chrome',
        browserVersion: '120.0.0.0',
        operatingSystem: 'Windows',
        osVersion: '10',
        screenResolution: '1920x1080',
        timezone: 'America/Montevideo',
        language: 'es-419',
        ipAddress: '192.168.1.100',
        country: 'Uruguay',
        region: 'Montevideo',
        city: 'Montevideo',
        latitude: -34.9011,
        longitude: -56.1645,
        entryUrl: 'https://test.innovamarketing.uy/',
        pagesViewed: 1,
        referrer: 'https://google.com'
      },
      events: [
        {
          businessId: this.businessId,
          visitorId: this.visitorId,
          sessionId: this.sessionId,
          eventType: 'page_view',
          pageUrl: 'https://test.innovamarketing.uy/',
          pageTitle: 'Test Page - Simple Integration',
          referrer: 'https://google.com',
          timestamp: new Date().toISOString(),
          eventCategory: 'navigation',
          eventAction: 'page_load'
        }
      ]
    };

    return this.sendRequest('/api/simple/start-session', payload);
  }

  async trackEvent(eventType, eventData = {}) {
    const payload = {
      event: {
        businessId: this.businessId,
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        eventType: eventType,
        pageUrl: 'https://test.innovamarketing.uy/test-page',
        pageTitle: 'Test Page - Simple Integration',
        timestamp: new Date().toISOString(),
        eventCategory: eventData.category || 'interaction',
        eventAction: eventData.action || 'click',
        targetElement: eventData.element || 'button',
        targetText: eventData.text || 'Test Button',
        eventData: eventData
      }
    };

    return this.sendRequest('/api/simple/track-event', payload);
  }

  async sendHeartbeat() {
    const payload = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      businessId: this.businessId,
      timestamp: new Date().toISOString(),
      isActive: true,
      pageUrl: 'https://test.innovamarketing.uy/test-page',
      scrollDepth: 75,
      timeOnPage: 30000
    };

    return this.sendRequest('/api/simple/heartbeat', payload);
  }

  async endSession() {
    const payload = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      businessId: this.businessId,
      endedAt: new Date().toISOString(),
      totalDuration: 120000,
      finalPageUrl: 'https://test.innovamarketing.uy/final-page',
      finalScrollDepth: 100,
      reason: 'user_navigation',
      finalEvents: [
        {
          businessId: this.businessId,
          visitorId: this.visitorId,
          sessionId: this.sessionId,
          eventType: 'session_end',
          pageUrl: 'https://test.innovamarketing.uy/final-page',
          pageTitle: 'Final Page',
          timestamp: new Date().toISOString(),
          eventCategory: 'session',
          eventAction: 'end'
        }
      ]
    };

    return this.sendRequest('/api/simple/end-session', payload);
  }

  async sendRequest(endpoint, data) {
    try {
      const response = await axios.post(`${CONFIG.backendUrl}${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SimpleTrackingClient/1.0.0 Integration-Test'
        },
        timeout: CONFIG.timeout
      });
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { 
        success: false, 
        error: error.message, 
        status: error.response?.status,
        data: error.response?.data 
      };
    }
  }
}

// ============================================
// FUNCIONES DE TEST
// ============================================

async function testBackendHealth() {
  console.log('🔍 Verificando salud del backend...');
  try {
    const response = await axios.get(`${CONFIG.backendUrl}/api/simple/health`, { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Backend simple está respondiendo correctamente');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend simple no está disponible:', error.message);
    return false;
  }
}

async function testSimpleFlow() {
  console.log('\n📊 Iniciando test de flujo simple...');
  const client = new SimpleTrackingClient();
  
  // Test 1: Iniciar sesión
  console.log('🚀 Enviando datos de inicio de sesión...');
  const sessionResult = await client.startSession();
  
  if (sessionResult.success) {
    console.log('✅ Sesión iniciada correctamente');
    console.log(`   - Session ID: ${client.sessionId}`);
    console.log(`   - Visitor ID: ${client.visitorId}`);
  } else {
    console.log('❌ Error al iniciar sesión:', sessionResult.error);
    if (sessionResult.data) {
      console.log('   - Detalles:', JSON.stringify(sessionResult.data, null, 2));
    }
    return false;
  }

  // Test 2: Evento individual
  console.log('\n🎯 Enviando evento individual...');
  const eventResult = await client.trackEvent('click', {
    element: 'button#test-btn',
    text: 'Test Button Click',
    category: 'interaction',
    action: 'click'
  });

  if (eventResult.success) {
    console.log('✅ Evento individual registrado');
  } else {
    console.log('❌ Error en evento individual:', eventResult.error);
    if (eventResult.data) {
      console.log('   - Detalles:', JSON.stringify(eventResult.data, null, 2));
    }
  }

  // Test 3: Heartbeat
  console.log('\n💓 Enviando heartbeat...');
  const heartbeatResult = await client.sendHeartbeat();
  
  if (heartbeatResult.success) {
    console.log('✅ Heartbeat registrado');
  } else {
    console.log('❌ Error en heartbeat:', heartbeatResult.error);
    if (heartbeatResult.data) {
      console.log('   - Detalles:', JSON.stringify(heartbeatResult.data, null, 2));
    }
  }

  // Test 4: Finalizar sesión
  console.log('\n🏁 Finalizando sesión...');
  const endResult = await client.endSession();
  
  if (endResult.success) {
    console.log('✅ Sesión finalizada correctamente');
  } else {
    console.log('❌ Error al finalizar sesión:', endResult.error);
    if (endResult.data) {
      console.log('   - Detalles:', JSON.stringify(endResult.data, null, 2));
    }
  }

  return sessionResult.success && eventResult.success && heartbeatResult.success && endResult.success;
}

async function runSimpleIntegrationTest() {
  console.log('🚀 INICIANDO TEST DE INTEGRACIÓN SIMPLE');
  console.log('='.repeat(50));
  
  let allTestsPassed = true;

  // Test 1: Salud del backend
  const healthOk = await testBackendHealth();
  if (!healthOk) {
    console.log('\n❌ TEST FALLIDO: Backend no disponible');
    return false;
  }

  // Test 2: Flujo completo simple
  const flowOk = await testSimpleFlow();
  if (!flowOk) {
    allTestsPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ TODOS LOS TESTS PASARON CORRECTAMENTE');
  } else {
    console.log('❌ ALGUNOS TESTS FALLARON - REVISAR ERRORES');
  }
  
  return allTestsPassed;
}

// Ejecutar tests
runSimpleIntegrationTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Error fatal en tests:', error);
    process.exit(1);
  });
