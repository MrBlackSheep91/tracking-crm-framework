import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/reset-database', async (req, res) => {
  try {
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE BASE DE DATOS...');
    
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
      where: { name: 'Innova Marketing' }
    });

    if (!mainBusiness) {
      console.log('⚠️ Creando business principal...');
      await prisma.business.create({
        data: {
          name: 'Innova Marketing',
          isActive: true
        }
      });
      console.log('✅ Business principal creado');
    }

    // Estado final
    const counts = {
      businesses: await prisma.business.count(),
      visitors: await prisma.visitor.count(),
      sessions: await prisma.session.count(),
      trackingEvents: await prisma.trackingEvent.count(),
      activities: await prisma.activity.count(),
      contacts: await prisma.contact.count(),
      leads: await prisma.lead.count()
    };

    console.log('🎉 BASE DE DATOS LIMPIA - LISTA PARA PRIMERA VISITA');
    
    res.json({
      success: true,
      message: 'Base de datos reinicializada correctamente',
      counts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error durante limpieza:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
