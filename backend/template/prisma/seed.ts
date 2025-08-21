import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const businessSubdomain = 'innovamarketing-test';
  const businessName = 'Innova Marketing (Test)';

  console.log(`Verificando si el negocio con subdomain: ${businessSubdomain} ya existe...`);

  const existingBusiness = await prisma.business.findUnique({
    where: { subdomain: businessSubdomain },
  });

  if (existingBusiness) {
    console.log(`El negocio '${existingBusiness.name}' ya existe. No se necesita seeding.`);
  } else {
    console.log(`Creando negocio de prueba: ${businessName}...`);
    await prisma.business.create({
      data: {
        name: businessName,
        subdomain: businessSubdomain,
        isActive: true,
        settings: {
          tracking: {
            enabled: true,
          },
        },
      },
    });
    console.log(`Negocio '${businessName}' creado exitosamente.`);
  }
}

main()
  .catch((e) => {
    console.error('Error durante el seeding de la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
