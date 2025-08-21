// Script para crear un business de prueba
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

async function createTestBusiness() {
  try {
    // Verificar si el business ya existe
    const existingBusiness = await prisma.business.findUnique({
      where: { id: BUSINESS_ID }
    });

    if (existingBusiness) {
      console.log(`✅ Business ya existe: ${existingBusiness.name} (${existingBusiness.id})`);
      return existingBusiness;
    }

    // Crear business si no existe
    const newBusiness = await prisma.business.create({
      data: {
        id: BUSINESS_ID,
        name: 'Test Business',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Business creado: ${newBusiness.name} (${newBusiness.id})`);
    return newBusiness;
  } catch (error) {
    console.error('❌ Error creando business:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
createTestBusiness();
