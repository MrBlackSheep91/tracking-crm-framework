/**
 * Script para limpiar completamente la base de datos
 * Elimina TODOS los registros excepto el business 00000000-0000-0000-0000-000000000001
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://tracking_user:tracking_password@localhost:5433/tracking_crm'
    }
  }
});

async function cleanDatabase() {
  try {
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE BASE DE DATOS...\n');
    
    // 1. Eliminar tracking_events
    const deletedEvents = await prisma.trackingEvent.deleteMany({});
    console.log(`✅ Eliminados ${deletedEvents.count} tracking_events`);
    
    // 2. Eliminar sessions
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`✅ Eliminados ${deletedSessions.count} sessions`);
    
    // 3. Eliminar visitors
    const deletedVisitors = await prisma.visitor.deleteMany({});
    console.log(`✅ Eliminados ${deletedVisitors.count} visitors`);
    
    // 4. Eliminar activities
    const deletedActivities = await prisma.activity.deleteMany({});
    console.log(`✅ Eliminados ${deletedActivities.count} activities`);
    
    // 5. Eliminar contacts
    const deletedContacts = await prisma.contact.deleteMany({});
    console.log(`✅ Eliminados ${deletedContacts.count} contacts`);
    
    // 6. Eliminar leads
    const deletedLeads = await prisma.lead.deleteMany({});
    console.log(`✅ Eliminados ${deletedLeads.count} leads`);
    
    // 7. Eliminar interactions
    const deletedInteractions = await prisma.interaction.deleteMany({});
    console.log(`✅ Eliminados ${deletedInteractions.count} interactions`);
    
    // 8. Verificar que el business principal existe
    const mainBusiness = await prisma.business.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000001' }
    });
    
    if (mainBusiness) {
      console.log(`✅ Business principal preservado: ${mainBusiness.name}`);
    } else {
      console.log('⚠️ Business principal no encontrado, creándolo...');
      
      await prisma.business.create({
        data: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Innova Marketing',
          domain: 'localhost:3000',
          industry: 'Marketing Digital',
          country: 'Uruguay',
          timezone: 'America/Montevideo',
          isActive: true
        }
      });
      
      console.log('✅ Business principal creado');
    }
    
    // 9. Verificar estado final
    console.log('\n📊 ESTADO FINAL DE LA BASE DE DATOS:');
    
    const finalCounts = {
      businesses: await prisma.business.count(),
      visitors: await prisma.visitor.count(),
      sessions: await prisma.session.count(),
      trackingEvents: await prisma.trackingEvent.count(),
      activities: await prisma.activity.count(),
      contacts: await prisma.contact.count(),
      leads: await prisma.lead.count(),
      interactions: await prisma.interaction.count()
    };
    
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} registros`);
    });
    
    console.log('\n🎉 BASE DE DATOS LIMPIA Y LISTA PARA PRUEBAS CONTROLADAS');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar limpieza
cleanDatabase()
  .then(() => {
    console.log('✅ Limpieza completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Limpieza falló:', error);
    process.exit(1);
  });
