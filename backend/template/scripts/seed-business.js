#!/usr/bin/env node
/**
 * Seed de Business por ID específico
 * Uso: node scripts/seed-business.js <BUSINESS_ID>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const businessId = process.argv[2] || 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

  const payload = {
    id: businessId,
    name: 'Innova Test Business',
    subdomain: 'localhost',
    isActive: true,
  };

  console.log('🔧 Upserting Business with ID:', businessId);
  const business = await prisma.business.upsert({
    where: { id: businessId },
    update: { ...payload },
    create: payload,
  });

  console.log('✅ Business listo:', business);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed-business:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
