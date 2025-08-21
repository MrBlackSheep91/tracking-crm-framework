const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando conexión a base de datos...');
    
    // Verificar businesses existentes
    const businesses = await prisma.business.findMany();
    console.log('📊 Businesses encontrados:', businesses.length);
    businesses.forEach(business => {
      console.log(`  - ID: ${business.id}, Name: ${business.name}`);
    });

    // Contar registros en otras tablas
    const visitorsCount = await prisma.visitor.count();
    const sessionsCount = await prisma.session.count();
    const eventsCount = await prisma.trackingEvent.count();
    const leadsCount = await prisma.lead.count();

    console.log('\n📈 Estadísticas generales:');
    console.log(`  - Visitors: ${visitorsCount}`);
    console.log(`  - Sessions: ${sessionsCount}`);
    console.log(`  - Events: ${eventsCount}`);
    console.log(`  - Leads: ${leadsCount}`);

  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
