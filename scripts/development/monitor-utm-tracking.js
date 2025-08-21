/**
 * Script de monitoreo UTM en tiempo real
 * Monitorea la base de datos para verificar que los parámetros UTM se registren correctamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://tracking_user:tracking_password@localhost:5433/tracking_crm'
    }
  }
});

// Función para formatear fecha
function formatDate(date) {
  return new Date(date).toLocaleString('es-UY', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Función para mostrar datos UTM de una sesión
function displayUTMData(session) {
  const utmData = {
    utmSource: session.utmSource,
    utmMedium: session.utmMedium,
    utmCampaign: session.utmCampaign,
    utmContent: session.utmContent,
    utmTerm: session.utmTerm,
    fbclid: session.fbclid,
    gclid: session.gclid
  };
  
  const hasUTM = Object.values(utmData).some(value => value !== null);
  
  if (hasUTM) {
    console.log('🎯 DATOS UTM DETECTADOS:');
    Object.entries(utmData).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: ${value}`);
      }
    });
  } else {
    console.log('❌ Sin datos UTM registrados');
  }
  
  return hasUTM;
}

// Función principal de monitoreo
async function monitorUTMTracking() {
  try {
    console.log('🔍 INICIANDO MONITOREO UTM EN TIEMPO REAL...\n');
    console.log('📋 Presiona Ctrl+C para detener el monitoreo\n');
    
    let lastSessionId = null;
    let monitorCount = 0;
    
    // Obtener la última sesión como punto de partida
    const lastSession = await prisma.session.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (lastSession) {
      lastSessionId = lastSession.id;
      console.log(`🚀 Iniciando monitoreo desde sesión: ${lastSessionId}`);
      console.log(`📅 Última sesión: ${formatDate(lastSession.createdAt)}\n`);
    }
    
    // Monitoreo continuo cada 2 segundos
    const monitorInterval = setInterval(async () => {
      try {
        monitorCount++;
        
        // Buscar nuevas sesiones
        const newSessions = await prisma.session.findMany({
          where: lastSessionId ? {
            id: { gt: lastSessionId }
          } : {},
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            visitor: {
              select: {
                visitorId: true,
                country: true,
                city: true
              }
            }
          }
        });
        
        if (newSessions.length > 0) {
          console.log(`\n🆕 [${formatDate(new Date())}] NUEVAS SESIONES DETECTADAS: ${newSessions.length}`);
          console.log('═'.repeat(80));
          
          for (const session of newSessions) {
            console.log(`\n📋 SESIÓN: ${session.sessionId}`);
            console.log(`👤 Visitor: ${session.visitor?.visitorId || 'N/A'}`);
            console.log(`📍 Ubicación: ${session.visitor?.city || 'N/A'}, ${session.visitor?.country || 'N/A'}`);
            console.log(`🌐 URL Entrada: ${session.entryUrl || 'N/A'}`);
            console.log(`📅 Creada: ${formatDate(session.createdAt)}`);
            
            // Mostrar datos UTM
            const hasUTM = displayUTMData(session);
            
            if (hasUTM) {
              console.log('🎉 ¡TRACKING UTM EXITOSO!');
            }
            
            console.log('─'.repeat(60));
          }
          
          // Actualizar último ID procesado
          lastSessionId = newSessions[0].id;
        } else {
          // Mostrar progreso cada 10 iteraciones (20 segundos)
          if (monitorCount % 10 === 0) {
            console.log(`⏱️ [${formatDate(new Date())}] Monitoreando... (${monitorCount * 2}s)`);
          }
        }
        
        // Buscar eventos recientes con UTM
        const recentEvents = await prisma.trackingEvent.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30000) // Últimos 30 segundos
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            session: {
              select: {
                utmSource: true,
                utmMedium: true,
                utmCampaign: true
              }
            }
          }
        });
        
        if (recentEvents.length > 0) {
          const eventsWithUTM = recentEvents.filter(event => 
            event.session?.utmSource || event.session?.utmMedium || event.session?.utmCampaign
          );
          
          if (eventsWithUTM.length > 0) {
            console.log(`\n📊 EVENTOS RECIENTES CON UTM: ${eventsWithUTM.length}`);
            eventsWithUTM.forEach(event => {
              console.log(`   🎯 ${event.eventType} - ${event.eventName} (${event.session?.utmSource || 'N/A'})`);
            });
          }
        }
        
      } catch (error) {
        console.error('❌ Error en monitoreo:', error.message);
      }
    }, 2000);
    
    // Manejar interrupción
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Deteniendo monitoreo UTM...');
      clearInterval(monitorInterval);
      prisma.$disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error iniciando monitoreo:', error);
    throw error;
  }
}

// Función para mostrar resumen actual de UTM
async function showUTMSummary() {
  try {
    console.log('📊 RESUMEN ACTUAL DE TRACKING UTM\n');
    
    // Contar sesiones con UTM
    const totalSessions = await prisma.session.count();
    const sessionsWithUTM = await prisma.session.count({
      where: {
        OR: [
          { utmSource: { not: null } },
          { utmMedium: { not: null } },
          { utmCampaign: { not: null } }
        ]
      }
    });
    
    console.log(`📋 Total sesiones: ${totalSessions}`);
    console.log(`🎯 Sesiones con UTM: ${sessionsWithUTM}`);
    console.log(`📈 Porcentaje UTM: ${totalSessions > 0 ? ((sessionsWithUTM / totalSessions) * 100).toFixed(1) : 0}%\n`);
    
    // Mostrar fuentes UTM más comunes
    const utmSources = await prisma.session.groupBy({
      by: ['utmSource'],
      where: { utmSource: { not: null } },
      _count: { utmSource: true },
      orderBy: { _count: { utmSource: 'desc' } },
      take: 5
    });
    
    if (utmSources.length > 0) {
      console.log('🔝 TOP FUENTES UTM:');
      utmSources.forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.utmSource}: ${source._count.utmSource} sesiones`);
      });
    } else {
      console.log('❌ No se encontraron fuentes UTM registradas');
    }
    
    console.log('\n' + '═'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error obteniendo resumen UTM:', error);
  }
}

// Ejecutar según argumentos
const command = process.argv[2];

if (command === 'summary') {
  showUTMSummary()
    .then(() => {
      console.log('✅ Resumen UTM completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
} else {
  // Mostrar resumen primero, luego iniciar monitoreo
  showUTMSummary()
    .then(() => monitorUTMTracking())
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
