// Script para verificar resultados de pruebas usando Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

async function verifyResults() {
  console.log('🔍 VERIFICANDO RESULTADOS DE PRUEBAS');
  console.log('====================================');
  
  try {
    // 1. Verificar eventos de tracking
    const trackingEventsCount = await prisma.trackingEvent.count({
      where: {
        businessId: BUSINESS_ID
      }
    });
    console.log(`✅ Eventos de tracking: ${trackingEventsCount}`);
    
    // 2. Verificar actividades
    const activitiesCount = await prisma.activity.count({
      where: {
        businessId: BUSINESS_ID
      }
    });
    console.log(`✅ Actividades: ${activitiesCount}`);
    
    // 3. Verificar tipos de actividades
    const activityTypes = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count 
      FROM activities 
      WHERE "businessId" = ${BUSINESS_ID} 
      GROUP BY type
    `;
    console.log('✅ Tipos de actividades:');
    activityTypes.forEach(type => {
      console.log(`   - ${type.type}: ${type.count}`);
    });
    
    // 4. Verificar visitantes
    const visitorsCount = await prisma.visitor.count({
      where: {
        businessId: BUSINESS_ID
      }
    });
    console.log(`✅ Visitantes: ${visitorsCount}`);
    
    // 5. Verificar sesiones
    const sessionsCount = await prisma.visitorSession.count({
      where: {
        businessId: BUSINESS_ID
      }
    });
    console.log(`✅ Sesiones: ${sessionsCount}`);
    
    // 6. Detalles de últimas actividades
    const recentActivities = await prisma.activity.findMany({
      where: {
        businessId: BUSINESS_ID
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true
      }
    });
    
    console.log('✅ Últimas actividades:');
    recentActivities.forEach(activity => {
      console.log(`   - [${activity.type}] ${activity.title} (${activity.createdAt.toISOString()})`);
    });
    
    // 7. Resumen
    console.log('\n📊 RESUMEN DE RESULTADOS');
    console.log('=======================');
    console.log(`✅ Total eventos: ${trackingEventsCount}`);
    console.log(`✅ Total actividades: ${activitiesCount}`);
    console.log(`✅ Total visitantes: ${visitorsCount}`);
    console.log(`✅ Total sesiones: ${sessionsCount}`);
    
    // 8. Validación
    const expectedEvents = 4; // Esperamos 4 eventos de las pruebas
    const expectedActivities = 4; // Esperamos 4 actividades generadas
    
    if (trackingEventsCount >= expectedEvents && activitiesCount >= expectedActivities) {
      console.log('\n🎉 PIPELINE VALIDADO EXITOSAMENTE');
      console.log('El pipeline de tracking y actividades está funcionando correctamente');
    } else {
      console.log('\n⚠️ VALIDACIÓN INCOMPLETA');
      console.log(`Esperábamos al menos ${expectedEvents} eventos y ${expectedActivities} actividades`);
      console.log(`Encontramos ${trackingEventsCount} eventos y ${activitiesCount} actividades`);
    }
    
  } catch (error) {
    console.error('❌ ERROR AL VERIFICAR RESULTADOS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyResults();
