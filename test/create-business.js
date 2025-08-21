// Script Node.js para crear business de prueba usando Prisma
// Ejecutar con: cd backend/template && node ../../test/create-business.js

const { PrismaClient } = require('@prisma/client');

async function createTestBusiness() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Creando business de prueba...');
    
    // Eliminar business existente si existe
    await prisma.business.deleteMany({
      where: {
        id: '00000000-0000-0000-0000-000000000001'
      }
    });
    
    // Crear business de prueba
    const business = await prisma.business.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Innova Marketing - Test Business',
        subdomain: 'test-innova',
        isActive: true,
        settings: {
          tracking: true,
          activities: true
        }
      }
    });
    
    console.log('✅ Business de prueba creado exitosamente:');
    console.log(`   ID: ${business.id}`);
    console.log(`   Nombre: ${business.name}`);
    console.log(`   Subdomain: ${business.subdomain}`);
    console.log(`   Activo: ${business.isActive}`);
    
  } catch (error) {
    console.error('❌ Error creando business de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBusiness();
