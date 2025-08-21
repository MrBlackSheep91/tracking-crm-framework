import { PrismaClient } from '@prisma/client';
import app from '../src/server';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Configuración global para tests
declare global {
  var __PRISMA__: PrismaClient | undefined;
}

// Cliente Prisma para tests (base de datos de testing)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5433/tracking_crm_test"
    }
  }
});

global.__PRISMA__ = prisma;

// Setup antes de todos los tests
beforeAll(async () => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('🔗 [TEST SETUP] Conectado a la base de datos de testing');
  } catch (error) {
    console.error('❌ [TEST SETUP] Error conectando a la base de datos:', error);
    throw error;
  }
});


export const testBusinessId = 1;

// Cleanup y setup antes de cada test
beforeEach(async () => {
  try {
    // 1. Limpiar datos en orden correcto para evitar errores de FK
    await prisma.leadScore.deleteMany();
    await prisma.trackingEvent.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.session.deleteMany();
    await prisma.visitor.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.business.deleteMany();

    // 2. Crear un business por defecto para los tests con ID fijo
    const business = await prisma.business.create({
      data: {
        id: testBusinessId, // Usa la constante exportada (1)
        name: 'Test Business',
        subdomain: 'test',
        isActive: true,
      },
    });

    console.log(`📦 [TEST SETUP] Business de prueba creado con ID: ${business.id}`);
    console.log('🧹 [TEST SETUP] Base de datos limpiada y preparada para el test');
  } catch (error) {
    console.error('❌ [TEST SETUP] Error limpiando la base de datos:', error);
    throw error; // Lanzar el error para que el test falle si el setup no funciona
  }
});

// La instancia de la app se importa desde ../src/server para asegurar un entorno de prueba consistente.

export { prisma, app };
