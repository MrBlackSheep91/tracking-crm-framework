const { v4: uuidv4 } = require('uuid');

// Importar la función que genera payloads
const { generateRealisticSessionStartPayload } = require('./tests/fixtures/realistic-payloads.ts');

const visitorId = uuidv4();
const sessionId = uuidv4();
const businessId = 1;

console.log('=== DEBUGGING PAYLOAD STRUCTURE ===');

try {
  const payload = generateRealisticSessionStartPayload(visitorId, sessionId, businessId);
  console.log('Generated payload:', JSON.stringify(payload, null, 2));
  
  // Verificar estructura
  console.log('\n=== STRUCTURE VALIDATION ===');
  console.log('Has sessionData:', !!payload.sessionData);
  console.log('Has events:', !!payload.events);
  console.log('businessId location:', payload.businessId ? 'root' : payload.sessionData?.businessId ? 'sessionData' : 'missing');
  
} catch (error) {
  console.error('Error generating payload:', error);
}
