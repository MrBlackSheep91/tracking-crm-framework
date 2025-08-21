const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE BASE DE DATOS...\n');
  
  try {
    // Eliminar en orden de dependencias
    await prisma.trackingEvent.deleteMany({});
    console.log('✅ TrackingEvents eliminados');
    
    await prisma.session.deleteMany({});
    console.log('✅ Sessions eliminadas');
    
    await prisma.visitor.deleteMany({});
    console.log('✅ Visitors eliminados');
    
    await prisma.activity.deleteMany({});
    console.log('✅ Activities eliminadas');
    
    await prisma.leadScore.deleteMany({});
    console.log('✅ LeadScores eliminados');
    
    await prisma.channelStatus.deleteMany({});
    console.log('✅ ChannelStatuses eliminados');
    
    await prisma.interaction.deleteMany({});
    console.log('✅ Interactions eliminadas');
    
    await prisma.lead.deleteMany({});
    console.log('✅ Leads eliminados');
    
    await prisma.customField.deleteMany({});
    console.log('✅ CustomFields eliminados');
    
    await prisma.contact.deleteMany({});
    console.log('✅ Contacts eliminados');
    
    await prisma.businessUser.deleteMany({});
    console.log('✅ BusinessUsers eliminados');
    
    await prisma.user.deleteMany({});
    console.log('✅ Users eliminados');

    // Verificar si existe el business principal
    const mainBusiness = await prisma.business.findFirst({
      where: { id: '00000000-0000-0000-0000-000000000001' }
    });

    if (!mainBusiness) {
      console.log('⚠️ Creando business principal...');
      await prisma.business.create({
        data: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Innova Marketing',
          isActive: true
        }
      });
      console.log('✅ Business principal creado');
    } else {
      console.log('✅ Business principal ya existe');
    }

    // Estado final
    console.log('\n📊 ESTADO FINAL:');
    const counts = {
      businesses: await prisma.business.count(),
      visitors: await prisma.visitor.count(),
      sessions: await prisma.session.count(),
      trackingEvents: await prisma.trackingEvent.count()
    };

    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });

    console.log('\n🎉 BASE DE DATOS LIMPIA - LISTA PARA PRIMERA VISITA');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
