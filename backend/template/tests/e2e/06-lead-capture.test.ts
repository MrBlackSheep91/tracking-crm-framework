/**
 * 🧪 TEST 6: Captura y Almacenamiento de Leads
 * Valida que los leads se capturen y almacenen correctamente desde eventos
 */

import request, { Test } from 'supertest';
import { app, prisma, testBusinessId } from '../setup';
import { 
  generateRealisticLeadCapturePayload,
} from '../fixtures/realistic-payloads';
import { LeadStage, LeadStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

const processAndSend = (payload: { sessionData: any; events: any[] }): Test => {
  const { sessionData, events } = payload;
  
  // No modificar los eventos, enviar tal como vienen del payload
  return request(app)
    .post('/api/v1/track/event')
    .send({ sessionData, events });
};

describe('🔍 Test 6: Captura y Almacenamiento de Leads', () => {
  const visitorIdMap = new Map<string, string>();

  const getVisitorDbId = async (visitorId: string) => {
    if (visitorIdMap.has(visitorId)) {
      return visitorIdMap.get(visitorId)!;
    }
    const visitor = await prisma.visitor.findUnique({
      where: { visitorId_businessId: { visitorId, businessId: testBusinessId } },
    });
    if (visitor) {
      visitorIdMap.set(visitorId, visitor.id);
      return visitor.id;
    }
    throw new Error(`Visitor con ID ${visitorId} no encontrado en la base de datos.`);
  };

  describe('📝 Captura Básica de Leads', () => {
    test('✅ Debe crear lead desde evento de conversión', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const payload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });

      const response = await processAndSend(payload).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.processed).toBe(1);

      const visitorDbId = await getVisitorDbId(visitorId);
      const lead = await prisma.lead.findFirst({
        where: {
          businessId: testBusinessId,
          visitorId: visitorDbId,
          email: 'juan.perez@mirestaurante.com'
        }
      });

      expect(lead).toBeTruthy();
      expect(lead!.businessId).toBe(testBusinessId);
      expect(lead!.visitorId).toBe(visitorDbId);
      const leadCustomFields = lead!.customFields as any;
      expect(leadCustomFields.sessionIdString).toBe(sessionId);
      expect(lead!.email).toBe('juan.perez@mirestaurante.com');
      expect(lead!.name).toBe('Juan Pérez');
      expect(lead!.phone).toBe('+59899123456');
      expect(lead!.company).toBe('Restaurante El Buen Sabor');
      
      expect(lead!.status).toBe('NEW');
      expect(lead!.stage).toBe('PROSPECT');
      expect(lead!.score).toBe(85);
      expect(lead!.isHot).toBe(true);
      expect(lead!.leadType).toBe('hot');
      
      expect(lead!.source).toBe('tracking');
      expect(lead!.medium).toBeTruthy();
      expect(lead!.campaignName).toBeTruthy();
      
      expect(lead!.convertedAt).toBeTruthy();
      expect(lead!.conversionPage).toBe('https://innova-marketing.com/contacto');
      
      expect(lead!.customFields).toBeTruthy();
      const customFields = lead!.customFields as any;
      expect(customFields.tipoNegocio).toBe('Restaurante');
      expect(customFields.mensaje).toBe('Necesito automatizar mi restaurante con 50 mesas');
      expect(customFields.leadScore).toBe(85);
      
      expect(lead!.entryDate).toBeTruthy();
      expect(lead!.createdAt).toBeTruthy();
      expect(lead!.updatedAt).toBeTruthy();
    });

    test('✅ Debe crear contact automáticamente desde lead', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const payload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      await processAndSend(payload).expect(200);

      const visitorDbId = await getVisitorDbId(visitorId);
      const contact = await prisma.contact.findFirst({
        where: {
          businessId: testBusinessId,
          email: 'juan.perez@mirestaurante.com'
        }
      });

      expect(contact).toBeTruthy();
      expect(contact!.email).toBe('juan.perez@mirestaurante.com');
      expect(contact!.firstName).toBe('Juan');
      expect(contact!.lastName).toBe('Pérez');
      expect(contact!.phone).toBe('+59899123456');
      expect(contact!.company).toBe('Restaurante El Buen Sabor');
      expect(contact!.source).toBe('tracking');
      expect(contact!.leadScore).toBe(85);
      expect(contact!.status).toBe('lead');
      expect(contact!.type).toBe('prospect');
    });

    test('✅ Debe vincular lead con visitor existente', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const payload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      await processAndSend(payload).expect(200);

      const visitorDbId = await getVisitorDbId(visitorId);
      const lead = await prisma.lead.findFirst({
        where: {
          email: 'juan.perez@mirestaurante.com'
        },
        include: { visitor: true }
      });

      expect(lead!.visitor).toBeTruthy();
      expect(lead!.visitor.id).toBe(visitorDbId);
      expect(lead!.visitor.visitorId).toBe(visitorId);
      
      const visitor = await prisma.visitor.findUnique({
        where: { id: visitorDbId },
        include: { contact: true }
      });

      expect(visitor!.contact).toBeTruthy();
      expect(visitor!.contact!.email).toBe('juan.perez@mirestaurante.com');
    });
  });

  describe('🎯 Scoring y Calificación de Leads', () => {
    test('✅ Debe calcular score basado en comportamiento', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const basePayload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      const highEngagementPayload = _.cloneDeep(basePayload);
      _.merge(highEngagementPayload.sessionData.userBehavior, {
        sessionDuration: 900000, // 15 minutos
        pageViews: 12,
        clickCount: 18,
        scrollDepthMax: 95,
        lastActivityAt: new Date().toISOString(),
        lastPageViewedUrl: highEngagementPayload.sessionData.pageInfo.url,
      });
      _.merge(highEngagementPayload.events[0].eventData, {
        leadScore: 95,
        qualificationScore: 90,
        engagementLevel: 'very_high'
      });

      await processAndSend(highEngagementPayload).expect(200);

      const visitorDbId = await getVisitorDbId(visitorId);
      const lead = await prisma.lead.findFirst({
        where: {
          businessId: testBusinessId,
          visitorId: visitorDbId,
          email: 'juan.perez@mirestaurante.com'
        }
      });

      expect(lead!.score).toBe(95);
      expect(lead!.isHot).toBe(true);
      expect(lead!.leadType).toBe('hot');
      expect(lead!.stage).toBe('PROSPECT');
    });

    test('✅ Debe crear múltiples registros de scoring', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const payload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      await processAndSend(payload).expect(200);

      const visitorDbId = await getVisitorDbId(visitorId);
      const lead = await prisma.lead.findFirst({
        where: { email: 'juan.perez@mirestaurante.com' }
      });

      await prisma.leadScore.createMany({
        data: [
          {
            businessId: testBusinessId,
            leadId: lead!.id,
            behavior: 'form_completion',
            points: 50,
            metadata: { formId: 'lead-capture-form' }
          },
          {
            businessId: testBusinessId,
            leadId: lead!.id,
            behavior: 'high_engagement',
            points: 25,
            metadata: { sessionDuration: 900000 }
          },
          {
            businessId: testBusinessId,
            leadId: lead!.id,
            behavior: 'pricing_page_view',
            points: 20,
            metadata: { timeOnPage: 180000 }
          }
        ] as any
      });

      const scores = await prisma.leadScore.findMany({
        where: { leadId: lead!.id },
        orderBy: { createdAt: 'asc' }
      });

      expect(scores).toHaveLength(3);
      const totalScore = scores.reduce((sum, score) => sum + score.points, 0);
      expect(totalScore).toBe(95);
    });
  });

  describe('📊 Leads con Diferentes Tipos de Negocio', () => {
    test('✅ Debe crear leads para restaurantes', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const restaurantLead = generateRealisticLeadCapturePayload(visitorId, sessionId, {
        businessId: testBusinessId,
        leadData: {
          name: 'Maria Gonzalez',
          email: 'maria.gonzalez@pizzeria.com',
          phone: '+59899123456',
          businessType: 'Restaurante',
          message: 'Quiero mejorar mis pedidos online.'
        }
      });

      await processAndSend(restaurantLead).expect(200);

      const visitorDbId = await getVisitorDbId(visitorId);
      const lead = await prisma.lead.findFirst({
        where: { email: 'maria.gonzalez@pizzeria.com' }
      });

      expect(lead).toBeTruthy();
      const customFields = lead!.customFields as any;
      expect(customFields.industry).toBe('food_service');
    });

    test('✅ Debe crear leads para inmobiliarias', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const basePayload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      const realEstateLead = _.cloneDeep(basePayload);
      _.merge(realEstateLead.events[0], {
        pageUrl: 'https://innova-marketing.com/inmobiliarias',
        eventData: {
          email: 'carlos.rodriguez@inmobiliariaplus.com',
          name: 'Carlos Rodríguez',
          phone: '+59899333444',
          company: 'Inmobiliaria Plus',
          tipoNegocio: 'Inmobiliaria',
          mensaje: 'Necesito CRM para gestionar mis propiedades',
          leadScore: 82,
          leadType: 'hot',
          industry: 'real_estate',
          businessSize: 'medium'
        }
      });

      await processAndSend(realEstateLead).expect(200);

      const visitorDbId = await getVisitorDbId(visitorId);
      const lead = await prisma.lead.findFirst({
        where: { email: 'carlos.rodriguez@inmobiliariaplus.com' }
      });

      expect(lead).toBeTruthy();
      const customFields = lead!.customFields as any;
      expect(customFields.industry).toBe('real_estate');
    });
  });

  describe('🔄 Actualización de Leads Existentes', () => {
    test('✅ Debe actualizar lead existente con nueva información', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const payload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      await processAndSend(payload).expect(200);

      const updatePayload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      _.merge(updatePayload.events[0].eventData, {
        jobTitle: 'Propietario',
        mensaje: 'Actualización: Tengo 3 sucursales y necesito automatización completa',
        leadScore: 92,
        qualificationNotes: 'Cliente premium potencial',
        budget: 5000,
        timeline: '1-2 months'
      });

      await processAndSend(updatePayload).expect(200);

      const visitorDbId = await getVisitorDbId(visitorId);
      const lead = await prisma.lead.findFirst({
        where: { email: 'juan.perez@mirestaurante.com' }
      });

      expect(lead!.jobTitle).toBe('Propietario');
      expect(lead!.score).toBe(92);
    });

    test('✅ Debe manejar leads duplicados por email', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const payload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      await processAndSend(payload).expect(200);

      const duplicatePayload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      _.merge(duplicatePayload.events[0].eventData, {
        name: 'Juan Pérez (segundo intento)',
        mensaje: 'Segundo formulario completado'
      });

      await processAndSend(duplicatePayload).expect(200);

      const leads = await prisma.lead.findMany({
        where: { email: 'juan.perez@mirestaurante.com' }
      });

      expect(leads).toHaveLength(1);
      expect(leads[0].name).toBe('Juan Pérez (segundo intento)');
    });
  });

  describe('📈 Progresión en el Funnel', () => {
    test('✅ Debe rastrear progresión a través de stages', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const payload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      await processAndSend(payload).expect(200);

      const lead = await prisma.lead.findFirst({
        where: { email: 'juan.perez@mirestaurante.com' }
      });

      const progressionStages = [
        { stage: 'INTEREST', status: 'CONTACTED', score: 60 },
        { stage: 'CONSIDERATION', status: 'QUALIFIED', score: 75 },
        { stage: 'INTENT', status: 'PROPOSAL', score: 85 },
        { stage: 'EVALUATION', status: 'NEGOTIATION', score: 90 }
      ];

      for (const progression of progressionStages) {
        await prisma.lead.update({
          where: { id: lead!.id },
          data: {
            stage: progression.stage as LeadStage,
            status: progression.status as LeadStatus,
            score: progression.score,
          }
        });

        await prisma.activity.create({
          data: {
            businessId: testBusinessId,
            leadId: lead!.id,
            type: 'lead_progression',
            category: 'sales',
            activityType: 'stage_change',
            entityType: 'lead',
            entityId: lead!.id,
            title: `Progresión a ${progression.stage}`,
            description: `Lead movido a stage ${progression.stage} con status ${progression.status}`,
            source: 'crm',
            metadata: {
              newStage: progression.stage,
            }
          }
        });
      }

      const updatedLead = await prisma.lead.findUnique({
        where: { id: lead!.id }
      });

      expect(updatedLead!.stage).toBe('EVALUATION');
      expect(updatedLead!.score).toBe(90);

      const progressionActivities = await prisma.activity.findMany({
        where: {
          leadId: lead!.id,
          activityType: 'stage_change'
        }
      });

      expect(progressionActivities).toHaveLength(4);
    });
  });

  describe('❌ Casos de Error en Captura de Leads', () => {
    test('❌ Debe fallar si falta email', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const invalidPayload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      (invalidPayload.events[0].eventData as any).email = undefined;

      const response = await processAndSend(invalidPayload).expect(400);

      expect(response.body.success).toBeFalsy();
    });

    test('❌ Debe fallar si el business no existe', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const invalidBusinessId = 999999;
      const payload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: invalidBusinessId });

      const response = await processAndSend(payload).expect(400);

      expect(response.body.success).toBeFalsy();
    });

    test('❌ Debe fallar con emails inválidos', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      const invalidEmailPayload = generateRealisticLeadCapturePayload(visitorId, sessionId, { businessId: testBusinessId });
      invalidEmailPayload.events[0].eventData.email = 'email-invalido';

      const response = await processAndSend(invalidEmailPayload).expect(400);

      expect(response.body.success).toBeFalsy();
    });
  });
});
