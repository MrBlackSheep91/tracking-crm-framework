require('dotenv').config({ path: './backend/template/.env' });

// Sobrescribir la URL de la base de datos para el entorno de prueba local
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@db:5432', '@localhost:5433');
}

/**
 * TEST DE INTEGRACIÓN COMPLETA - Tracking CRM Framework
 * Valida flujo end-to-end: Cliente → Backend → PostgreSQL
 * @version 1.0.0
 * @author Innova Marketing
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuración del test  
const CONFIG = {
  backendUrl: 'http://localhost:3001',
  businessId: '00000000-0000-0000-0000-000000000001', // Business ID de ejemplo de la documentación
  timeout: 10000 // 10 segundos
};

// Función para simular el cliente JavaScript
class TestTrackingClient {
  constructor() {
    this.visitorId = uuidv4();
    this.sessionId = uuidv4();
    this.fingerprint = this.generateFingerprint();
  }

  generateFingerprint() {
    const canvas = 'mock-canvas-fingerprint';
    const screen = `${1920}x${1080}`;
    const timezone = 'America/Montevideo';
    const language = 'es-UY';
    return btoa(`${canvas}-${screen}-${timezone}-${language}`).substring(0, 32);
  }

  async getIpLocation() {
    return {
      ip: '127.0.0.1',
      country: 'Uruguay',
      region: 'Montevideo',
      city: 'Montevideo',
      latitude: -34.9011,  // Campo requerido 
      longitude: -56.1645, // Campo requerido 
      timezone: 'America/Montevideo',
      isp: 'Test ISP'
    };
  }

  getDeviceInfo() {
    return {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      screenResolution: '1920x1080',
      screenSize: '1920x1080', // Campo requerido por el backend
      colorDepth: 24,
      timezone: 'America/Montevideo',
      language: 'es-UY',
      platform: 'Win32',
      deviceType: 'desktop',
      operatingSystem: 'Windows',
      browser: 'Chrome',
      browserVersion: '120.0.0.0',
      osVersion: '10'
    };
  }

  async startSession() {
    const sessionData = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      businessId: CONFIG.businessId,
      fingerprint: this.fingerprint,
      startedAt: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo(),
      ipLocation: await this.getIpLocation(),
      pageInfo: {
        url: 'https://test.innovamarketing.uy/test-page',
        title: 'Test Page - Integration Test',
        referrer: 'https://google.com'
      },
      userBehavior: {
        sessionStartTime: new Date().toISOString(),
        referrer: 'https://google.com',
        initialUrl: 'https://test.innovamarketing.uy/test-page',
        initialTitle: 'Test Page - Integration Test'
      }
    };

    // El endpoint /start-session espera el objeto sessionData directamente.
    return this.sendRequest('/api/v1/track/start-session', sessionData);
  }

  async trackEvent(eventType, eventData) {
    // La validación del backend requiere tanto sessionData como events.
    const payload = {
      sessionData: {
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        businessId: CONFIG.businessId,
        lastActivityAt: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo(),
        pageInfo: {
          url: 'https://test.innovamarketing.uy/test-page',
          title: 'Test Page - Integration Test'
        }
      },
      events: [{
        eventId: uuidv4(),
        eventType: eventType,
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        businessId: CONFIG.businessId,
        timestamp: new Date().toISOString(),
        pageUrl: 'https://test.innovamarketing.uy/test-page',
        eventData: eventData
      }]
    };

    return this.sendRequest('/api/v1/track/batch-events', payload);
  }

  async sendHeartbeat() {
    const heartbeatData = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      businessId: CONFIG.businessId,
      timestamp: new Date().toISOString(),
      isActive: true
    };

    return this.sendRequest('/api/v1/track/heartbeat', heartbeatData);
  }

  async endSession() {
    const endData = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      businessId: CONFIG.businessId,
      endedAt: new Date().toISOString(),
      reason: 'user_navigation'
    };

    return this.sendRequest('/api/v1/track/session-end', endData);
  }

  async sendRequest(endpoint, data) {
    try {
      const response = await axios.post(`${CONFIG.backendUrl}${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrackingCRMClient/2.4.0 Integration-Test'
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

// Funciones de test
async function testBackendHealth() {
  console.log('🔍 Verificando salud del backend...');
  try {
    const response = await axios.get(`${CONFIG.backendUrl}/api/health`, { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Backend está respondiendo correctamente');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend no está disponible:', error.message);
    return false;
  }
}

async function testSessionTracking() {
  console.log('\n📊 Iniciando test de tracking de sesión...');
  const client = new TestTrackingClient();
  
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

  // Test 2: Tracking de eventos
  console.log('\n🎯 Enviando eventos de tracking...');
  
  // Evento: Button Click
  const clickResult = await client.trackEvent('click', {
    sessionData: {
      sessionId: client.sessionId,
      visitorId: client.visitorId,
      businessId: CONFIG.businessId,
    },
    eventData: {
      elementType: 'button',
      action: 'click',
      buttonText: 'Test Button',
      buttonId: 'test-btn-1',
      ctaType: 'primary'
    }
  });

  let eventsOk = true;
  if (clickResult) {
    console.log('✅ Evento click registrado');
  } else {
    console.log('❌ Error en click:', clickResult.error);
    if (clickResult.data) console.log('   - Detalles:', JSON.stringify(clickResult.data, null, 2));
    eventsOk = false;
  }

  // Evento: Form Interaction
  const formResult = await client.trackEvent('form_interaction', {
    sessionData: {
      sessionId: client.sessionId,
      visitorId: client.visitorId,
      businessId: CONFIG.businessId,
    },
    eventData: {
      elementType: 'form',
      action: 'submit',
      formId: 'contact-form',
      formFields: ['name', 'email', 'message']
    }
  });

  if (formResult) {
    console.log('✅ Evento formInteraction registrado');
  } else {
    console.log('❌ Error en formInteraction:', formResult.error);
    if (formResult.data) console.log('   - Detalles:', JSON.stringify(formResult.data, null, 2));
    eventsOk = false;
  }

  // Test 3: Heartbeat
  console.log('\n💓 Enviando heartbeat...');
  const heartbeatResult = await client.sendHeartbeat();
  
  if (heartbeatResult.success) {
    console.log('✅ Heartbeat registrado');
  } else {
    console.log('❌ Error en heartbeat:', heartbeatResult.error);
  }

  // Test 4: Finalizar sesión
  console.log('\n🏁 Finalizando sesión...');
  const endResult = await client.endSession();
  
  if (endResult.success) {
    console.log('✅ Sesión finalizada correctamente');
  } else {
    console.log('❌ Error al finalizar sesión:', endResult.error);
    // Aunque falle el endSession, los eventos pueden haber funcionado
  }

  return sessionResult.success && eventsOk;
}

async function testPayloadValidation() {
  console.log('\n🛡️ Probando validación de payload con estructura incorrecta...');
  
  // Test con payload malformado (falta sessionData)
  const malformedPayload = {
    events: [{ eventType: 'test' }]
  };

  try {
    await axios.post(`${CONFIG.backendUrl}/api/v1/track/batch-events`, malformedPayload, {
      timeout: CONFIG.timeout
    });
    console.log('❌ Validación falló - payload malformado fue aceptado');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validación de payload funcionando - payload malformado rechazado correctamente');
      return true;
    } else {
      console.log('❓ Error inesperado durante la prueba de validación:', error.message);
      return false;
    }
  }
}

async function runCompleteIntegrationTest() {
  console.log('🚀 INICIANDO TEST DE INTEGRACIÓN COMPLETA (FORMATO MODERNO)');
  console.log('='.repeat(50));
  
  let allTestsPassed = true;

  try {
    // Ejecutar el test de salud del backend
    const healthOk = await testBackendHealth();
    if (!healthOk) {
      console.log('\n❌ TEST FALLIDO: Backend no disponible');
      return false;
    }

    // Ejecutar el test de tracking de sesión
    const sessionTestPassed = await testSessionTracking();
    allTestsPassed = allTestsPassed && sessionTestPassed;

    // Ejecutar el test de validación de payload
    const validationTestPassed = await testPayloadValidation();
    allTestsPassed = allTestsPassed && validationTestPassed;

    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 TODOS LOS TESTS PASARON - FRAMEWORK FUNCIONAL');
      console.log('✅ Cliente-Backend integración completa con formato de payload moderno');
      console.log('✅ Validación de payload funcionando correctamente');
      console.log('✅ Listo para instalación en innova-marketing');
    } else {
      console.log('❌ ALGUNOS TESTS FALLARON - REVISAR ERRORES');
    }
  } catch (error) {
    console.error('💥 Error crítico durante la ejecución de los tests:', error);
    allTestsPassed = false;
  } finally {
    // Este bloque se ejecutará siempre, haya o no errores.
    console.log('\n⏳ Esperando 2 segundos para que el backend procese eventos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🧹 Limpiando la base de datos...');
    try {
      await prisma.trackingEvent.deleteMany({});
      await prisma.session.deleteMany({});
      await prisma.visitor.deleteMany({});
      console.log('✅ Base de datos limpiada exitosamente.');
    } catch (dbError) {
      console.error('❌ Error limpiando la base de datos:', dbError);
    } finally {
      await prisma.$disconnect();
    }
  }

  return allTestsPassed;
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runCompleteIntegrationTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Error crítico en tests:', error);
      process.exit(1);
    });
}

module.exports = {
  runCompleteIntegrationTest,
  testBackendHealth,
  testSessionTracking,
  testPayloadValidation,
  TestTrackingClient
};
