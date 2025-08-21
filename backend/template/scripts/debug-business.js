const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBusiness() {
  try {
    const BUSINESS_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    
    console.log('🔍 Intentando crear business...');
    
    const business = await prisma.business.upsert({
      where: { id: BUSINESS_ID },
      update: {},
      create: {
        id: BUSINESS_ID,
        name: 'Test Business for E2E',
        subdomain: 'test-e2e',
        isActive: true
      }
    });

    console.log('✅ Business creado/encontrado:', business);

    // Verificar que existe
    const found = await prisma.business.findUnique({
      where: { id: BUSINESS_ID }
    });

    console.log('🔍 Business verificado:', found);

    // Ahora intentar crear un visitor
    console.log('🔍 Intentando crear visitor...');
    
    const visitor = await prisma.visitor.create({
      data: {
        id: '12345678-1234-1234-1234-123456789012',
        businessId: BUSINESS_ID,
        visitorId: `visitor_${Date.now()}`,
        fingerprint: `fp_${Date.now()}`,
        deviceType: 'desktop',
        browser: 'Chrome'
      }
    });

    console.log('✅ Visitor creado:', visitor);

    // Limpiar
    await prisma.visitor.delete({ where: { id: visitor.id } });
    console.log('🧹 Visitor eliminado');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBusiness();
