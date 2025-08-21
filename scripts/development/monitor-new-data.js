/**
 * Script para monitorear nuevos datos que se crean en la base de datos
 * Útil para verificar la persistencia del visitorId y creación de sesiones
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://tracking_user:tracking_password@localhost:5433/tracking_crm'
    }
  }
});

async function monitorNewData() {
  try {
    console.log('🔍 Monitoreando nuevos datos en la base de datos...\n');
    
    // Función para mostrar el estado actual
    const showCurrentState = async () => {
      const visitorCount = await prisma.visitor.count();
      const sessionCount = await prisma.session.count();
      const eventCount = await prisma.trackingEvent.count();
      
      console.log(`📊 Estado actual: ${visitorCount} visitors, ${sessionCount} sessions, ${eventCount} events`);
      
      // Mostrar visitors si existen
      if (visitorCount > 0) {
        const visitors = await prisma.visitor.findMany({
          include: {
            sessions: {
              include: {
                TrackingEvent: {
                  take: 3,
                  orderBy: { createdAt: 'desc' }
                }
              }
            }
          }
        });
        
        console.log('\n👥 NUEVOS VISITORS:');
        visitors.forEach((visitor, index) => {
          console.log(`\n--- VISITOR ${index + 1} ---`);
          console.log(`- DB ID: ${visitor.id}`);
          console.log(`- Visitor ID: ${visitor.visitorId || '❌ NULL'}`);
          console.log(`- Business ID: ${visitor.businessId}`);
          console.log(`- Fingerprint: ${visitor.fingerprint}`);
          console.log(`- Created At: ${visitor.createdAt}`);
          console.log(`- User Agent: ${visitor.userAgent?.substring(0, 80)}...`);
          
          // Mostrar device info si existe
          if (visitor.deviceInfo) {
            console.log(`- Device Type: ${visitor.deviceInfo.type}`);
            console.log(`- OS: ${visitor.deviceInfo.os}`);
            console.log(`- Browser: ${visitor.deviceInfo.browser}`);
            console.log(`- Screen: ${visitor.deviceInfo.screenResolution}`);
          }
          
          // Mostrar IP location si existe
          if (visitor.ipLocation) {
            console.log(`- Location: ${visitor.ipLocation.city}, ${visitor.ipLocation.country}`);
            console.log(`- IP: ${visitor.ipLocation.ip}`);
          }
          
          console.log(`- Sessions: ${visitor.sessions.length}`);
          
          // Mostrar sesiones
          visitor.sessions.forEach((session, sessionIndex) => {
            console.log(`\n  📋 SESSION ${sessionIndex + 1}:`);
            console.log(`  - Session ID: ${session.sessionId}`);
            console.log(`  - Started At: ${session.startedAt}`);
            console.log(`  - Ended At: ${session.endedAt || 'En curso'}`);
            console.log(`  - Page URL: ${session.pageUrl}`);
            console.log(`  - Page Title: ${session.pageTitle}`);
            console.log(`  - Referrer: ${session.referrer}`);
            console.log(`  - Duration: ${session.duration || 'N/A'} segundos`);
            console.log(`  - Events: ${session.TrackingEvent.length}`);
            
            // Mostrar algunos eventos
            if (session.TrackingEvent.length > 0) {
              console.log(`  - Últimos eventos:`);
              session.TrackingEvent.forEach((event, eventIndex) => {
                console.log(`    ${eventIndex + 1}. ${event.eventType} - ${event.eventName} (${event.createdAt})`);
              });
            }
          });
        });
      }
    };
    
    // Mostrar estado inicial
    await showCurrentState();
    
    console.log('\n⏳ Esperando nuevos datos... (presiona Ctrl+C para salir)');
    
    // Monitorear cada 3 segundos
    let lastVisitorCount = 0;
    let lastSessionCount = 0;
    let lastEventCount = 0;
    
    const monitor = setInterval(async () => {
      try {
        const visitorCount = await prisma.visitor.count();
        const sessionCount = await prisma.session.count();
        const eventCount = await prisma.trackingEvent.count();
        
        if (visitorCount !== lastVisitorCount || sessionCount !== lastSessionCount || eventCount !== lastEventCount) {
          console.log(`\n🚨 CAMBIO DETECTADO! ${new Date().toISOString()}`);
          console.log(`Visitors: ${lastVisitorCount} → ${visitorCount}`);
          console.log(`Sessions: ${lastSessionCount} → ${sessionCount}`);
          console.log(`Events: ${lastEventCount} → ${eventCount}`);
          
          await showCurrentState();
          
          lastVisitorCount = visitorCount;
          lastSessionCount = sessionCount;
          lastEventCount = eventCount;
        }
      } catch (error) {
        console.error('❌ Error en monitoreo:', error);
      }
    }, 3000);
    
    // Manejar Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n🛑 Deteniendo monitoreo...');
      clearInterval(monitor);
      prisma.$disconnect().then(() => {
        console.log('✅ Desconectado de la base de datos');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error durante el monitoreo:', error);
    throw error;
  }
}

// Ejecutar el script
monitorNewData()
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
