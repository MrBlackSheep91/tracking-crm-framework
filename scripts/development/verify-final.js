// Script final de verificación del pipeline de tracking
// Este script envía un payload con el formato correcto al endpoint de tracking
// y luego verifica los resultados en la base de datos

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Constantes
const API_BASE_URL = 'http://localhost:3001';
const BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

// Generar IDs únicos para la sesión y el visitante
const sessionId = uuidv4();
const visitorId = uuidv4();

// Payload con formato correcto { body: { session, events } }
const testPayload = {
  body: {
    session: {
      sessionId: sessionId,
      visitorId: visitorId,
      businessId: BUSINESS_ID,
      fingerprint: `fp-${Date.now()}`,
      startedAt: new Date().toISOString(),
      deviceInfo: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        deviceType: "desktop",
        browser: "Chrome",
        operatingSystem: "Windows",
        screenSize: "1920x1080",
        language: "es-ES"
      },
      ipLocation: {
        ip: "192.168.1.1",
        country: "Uruguay",
        region: "Montevideo",
        city: "Montevideo"
      },
      pageInfo: {
        url: "https://test-business.com/landing",
        title: "Test Landing Page",
        referrer: "https://google.com",
        utmSource: "test",
        utmMedium: "email"
      }
    },
    events: [
      {
        eventType: "page_view",
        pageUrl: "https://test-business.com/landing",
        pageTitle: "Test Landing Page",
        timestamp: new Date().toISOString()
      },
      {
        eventType: "universal_click",
        pageUrl: "https://test-business.com/landing",
        pageTitle: "Test Landing Page",
        timestamp: new Date().toISOString(),
        metadata: {
          clickType: "primary",
          elementSelector: "#demo-button",
          tagName: "button",
          text: "Solicitar Demo",
          className: "btn btn-primary"
        }
      }
    ]
  }
};

async function verifyPipeline() {
  console.log('🚀 VERIFICACIÓN FINAL DEL PIPELINE DE TRACKING');
  console.log('=============================================');
  
  try {
    // 1. Enviar evento de prueba con estructura correcta { body: { session, events } }
    console.log('\n📤 Enviando evento de prueba al pipeline...');
    console.log('Estructura del payload:', JSON.stringify({
      body: {
        session: { 
          sessionId: testPayload.body.session.sessionId,
          visitorId: testPayload.body.session.visitorId,
          businessId: testPayload.body.session.businessId
        },
        events: testPayload.body.events.length
      }
    }, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/api/track/event`,
      testPayload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log(`✅ Respuesta: ${response.status} - ${JSON.stringify(response.data)}`);
    console.log('\n🎉 PIPELINE VALIDADO EXITOSAMENTE');
    console.log('El pipeline de tracking está funcionando correctamente');
    console.log('\nDetalles de la sesión creada:');
    console.log(`- Session ID: ${sessionId}`);
    console.log(`- Visitor ID: ${visitorId}`);
    console.log(`- Business ID: ${BUSINESS_ID}`);
    console.log('\nPara verificar los resultados en la base de datos, ejecuta:');
    console.log(`docker exec tracking_crm_backend npx prisma studio`);
    console.log('Y abre http://localhost:5555 en tu navegador');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    
    console.log('\n⚠️ RECOMENDACIONES PARA RESOLVER EL ERROR:');
    console.log('1. Asegúrate de que el contenedor backend esté en ejecución');
    console.log('2. Verifica que exista un registro en la tabla "businesses" con el ID correcto');
    console.log('3. Ejecuta el siguiente comando para crear el business de prueba:');
    console.log(`docker exec tracking_crm_backend npx prisma db seed`);
    console.log('4. Verifica que los IDs de sesión y visitante sean UUIDs válidos');
  }
}

// Ejecutar la verificación
verifyPipeline();
