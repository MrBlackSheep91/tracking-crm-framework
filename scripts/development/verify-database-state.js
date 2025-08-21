/**
 * Script para verificar el estado actual de la base de datos
 * y monitorear la creación de nuevos visitors/sessions
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://tracking_user:tracking_password@localhost:5433/tracking_crm'
    }
  }
});

async function verifyDatabaseState() {
  try {
    console.log('🔍 Verificando estado actual de la base de datos...\n');
    
    // Contar registros
    const businessCount = await prisma.business.count();
    const visitorCount = await prisma.visitor.count();
    const sessionCount = await prisma.session.count();
    const eventCount = await prisma.trackingEvent.count();
    
    console.log('📊 CONTADORES:');
    console.log(`- Businesses: ${businessCount}`);
    console.log(`- Visitors: ${visitorCount}`);
    console.log(`- Sessions: ${sessionCount}`);
    console.log(`- Tracking Events: ${eventCount}\n`);
    
    // Mostrar business existente
    const businesses = await prisma.business.findMany();
    console.log('🏢 BUSINESSES:');
    businesses.forEach(business => {
      console.log(`- ID: ${business.id}`);
      console.log(`- Name: ${business.name}`);
      console.log(`- Domain: ${business.domain}`);
      console.log(`- Industry: ${business.industry}\n`);
    });
    
    // Mostrar visitors si existen
    if (visitorCount > 0) {
      const visitors = await prisma.visitor.findMany({
        include: {
          sessions: {
            include: {
              trackingEvents: true
            }
          }
        }
      });
      
      console.log('👥 VISITORS:');
      visitors.forEach((visitor, index) => {
        console.log(`\n--- VISITOR ${index + 1} ---`);
        console.log(`- ID: ${visitor.id}`);
        console.log(`- Visitor ID: ${visitor.visitorId || 'NULL'}`);
        console.log(`- Business ID: ${visitor.businessId}`);
        console.log(`- User Agent: ${visitor.userAgent?.substring(0, 50)}...`);
        console.log(`- Device Info: ${JSON.stringify(visitor.deviceInfo, null, 2)}`);
        console.log(`- IP Location: ${JSON.stringify(visitor.ipLocation, null, 2)}`);
        console.log(`- Sessions: ${visitor.sessions.length}`);
        
        visitor.sessions.forEach((session, sessionIndex) => {
          console.log(`\n  SESSION ${sessionIndex + 1}:`);
          console.log(`  - Session ID: ${session.sessionId}`);
          console.log(`  - Started At: ${session.startedAt}`);
          console.log(`  - Ended At: ${session.endedAt || 'NULL'}`);
          console.log(`  - Page URL: ${session.pageUrl}`);
          console.log(`  - Page Title: ${session.pageTitle}`);
          console.log(`  - Referrer: ${session.referrer}`);
          console.log(`  - Events: ${session.trackingEvents.length}`);
        });
      });
    }
    
    // Mostrar eventos recientes si existen
    if (eventCount > 0) {
      const recentEvents = await prisma.trackingEvent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          session: true
        }
      });
      
      console.log('\n📈 EVENTOS RECIENTES (últimos 5):');
      recentEvents.forEach((event, index) => {
        console.log(`\n--- EVENTO ${index + 1} ---`);
        console.log(`- Event Type: ${event.eventType}`);
        console.log(`- Event Name: ${event.eventName}`);
        console.log(`- Created At: ${event.createdAt}`);
        console.log(`- Page URL: ${event.pageUrl}`);
        console.log(`- Session ID: ${event.session?.sessionId || 'NULL'}`);
      });
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
verifyDatabaseState()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
