import { PrismaClient, Prisma, Session, Visitor, TrackingEvent, Lead, Contact } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import ActivityService from './activityService';

const prisma = new PrismaClient();

// Sobrescribimos el tipo PrismaClient para que acepte el cliente de transacción
type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
const activityService = new ActivityService();

// Tipos para los datos del payload
interface SessionPayload {
  sessionId: string;
  visitorId: string;
  businessId: string | number;
  fingerprint: string;
  startedAt: string;
  deviceInfo: any;
  ipLocation: any;
  pageInfo: any;
  userBehavior: any;
  endedAt?: string;
  duration?: number;
  utmParams?: any;
}

interface EventData {
  id?: string; // El ID se genera en el servidor
  eventType: string;
  eventCategory?: string;
  eventAction?: string;
  eventName?: string;
  visitorId: string;
  sessionId: string;
  businessId: string | number;
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
  timestamp?: string | number | Date;
  targetElement?: string;
  targetId?: string;
  targetClass?: string;
  targetText?: string;
  targetType?: string;
  eventValue?: number;
  eventData?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt?: string;
}

interface TrackingPayload {
  session: SessionPayload;
  events: EventData[];
}

interface BatchPayload {
  events: EventData[];
  businessId: string | number;
  visitorId: string;
  sessionId: string;
  fingerprint: string;
  startedAt: string;
  deviceInfo: any;
  ipLocation: any;
  pageInfo: any;
  userBehavior: any;
  endedAt?: string;
  duration?: number;
  utmParams?: any;
}

export const processTrackEvent = async (payload: BatchPayload): Promise<{ message: string }> => {
  console.log('[trackingService] Iniciando processTrackEvent con payload:', JSON.stringify(payload, null, 2));
  console.log('--- [TRACKING] Iniciando procesamiento de batch ---');
  const { events, ...sessionData } = payload;
  const businessId = typeof sessionData.businessId === 'string' ? parseInt(sessionData.businessId, 10) : sessionData.businessId;

  if (isNaN(businessId)) {
    console.error('❌ [TRACKING] Error: businessId inválido.');
    throw new Error('Invalid businessId');
  }

  for (const event of events) {
    if (!event.eventType) {
      const error = new Error('Incomplete event data: eventType is required for all events.');
      (error as any).statusCode = 400;
      throw error;
    }
  }

  const pageViewEventsCount = events.filter(e => e.eventType === 'page_view').length;

  try {
    return await prisma.$transaction(async (tx) => {
      console.log('  [DB] Iniciando transacción...');
      const visitorId = sessionData.visitorId || (events.length > 0 ? events[0].visitorId : undefined);
      if (!visitorId) {
        throw new Error('Visitor ID is missing in session and events.');
      }
      // Asegurarse de que el visitorId esté en el objeto sessionData antes de pasarlo
      sessionData.visitorId = visitorId;

      const visitor = await findOrCreateVisitor(sessionData, events, tx);
      console.log(`  [DB] Visitor encontrado/creado: ${visitor.id}`);

      let session: Session | null = null;
      if (sessionData) {
        sessionData.visitorId = visitor.visitorId; // Ensure visitorId is set
        session = await findOrCreateSession(visitor, businessId, sessionData, events, tx);
      } else if (events && events.length > 0) {
        // Si no hay sessionData pero hay eventos, intentamos encontrar la sesión usando el sessionId del primer evento.
        const eventSessionId = events[0].sessionId;
        if (eventSessionId) {
          session = await tx.session.findUnique({ where: { sessionId: eventSessionId } });
        }
      }

      if (!session) {
        throw new Error(`Session not found for events, and no session data was provided.`);
      }

      console.log(`  [DB] Session encontrada/creada: ${session.id}`);

      const eventsToCreate = events.map(event => ({
        id: uuidv4(), ...event, businessId: businessId, visitorId: visitor.id, sessionId: session.id,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(), createdAt: undefined,
      }));

      if (eventsToCreate.length > 0) {
        await tx.trackingEvent.createMany({ data: eventsToCreate as any, skipDuplicates: true });
        console.log(`  [DB] ${eventsToCreate.length} eventos de tracking creados.`);
      }

      for (const event of eventsToCreate) {
        await activityService.createActivityFromEventData(tx, event, session);
        if (event.eventType === 'conversion' || event.eventType === 'lead_capture') {
          await handleConversion(event, visitor, session.sessionId, tx);
        }
      }
      console.log('  [DB] Actividades y conversiones procesadas.');
      console.log('--- [TRACKING] Procesamiento de batch completado exitosamente ---');
      return { message: `✅ [TRACKING API] ${events.length} eventos procesados` };
    });
  } catch (error) {
        console.error('❌ [TRACKING] Error fatal durante la transacción:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw error;
  }
};

async function findOrCreateSession(
  visitor: Visitor,
  businessId: number,
  sessionData: SessionPayload,
  events: any[],
  tx: PrismaTransactionClient
): Promise<Session> {
  console.log(`[findOrCreateSession] Buscando o creando sesión para sessionId: ${sessionData.sessionId}`);
  const { sessionId, startedAt } = sessionData;
  const pageInfo = sessionData.pageInfo ?? {};
  const deviceInfo = sessionData.deviceInfo ?? {};
  const ipLocation = sessionData.ipLocation ?? {};
  const userBehavior = sessionData.userBehavior ?? {};

    console.log(`[findOrCreateSession] Verificando si existe la sesión: ${sessionId}`);
  const existingSession = await tx.session.findUnique({ where: { sessionId } });

  const pageViewEventsCount = events.filter(e => e.eventType === 'page_view').length;
  const hasSessionEnd = events.some(e => e.eventType === 'session_end');

    if (existingSession) {
    console.log(`[findOrCreateSession] Sesión existente encontrada. Actualizando...`);
    const updateData: any = { lastActivityAt: new Date() };

    if (pageViewEventsCount > 0) {
      updateData.pagesViewed = { increment: pageViewEventsCount };
      const lastPageView = events.filter(e => e.eventType === 'page_view').pop();
      if (lastPageView) updateData.lastPageViewedUrl = lastPageView.pageUrl || pageInfo.url;
    }

    if (typeof userBehavior.sessionDuration === 'number') {
      updateData.duration = userBehavior.sessionDuration;
      const currentTotalActiveTime = existingSession.totalActiveTime ?? 0;
      const newTotalActiveTime = (userBehavior.sessionDuration ?? 0) - (userBehavior.totalInactiveTime ?? 0);
      if (newTotalActiveTime > currentTotalActiveTime) {
        updateData.totalActiveTime = newTotalActiveTime;
      }
    }

    // Actualizar campos adicionales de userBehavior
    if (typeof userBehavior.maxScrollPercentage === 'number') {
      updateData.scrollDepthMax = userBehavior.maxScrollPercentage;
    }
    // Nota: clickCount y timeOnPage no existen en el schema Session actual

    if (hasSessionEnd) {
      updateData.endedAt = new Date();
      if (pageInfo.url) updateData.exitUrl = pageInfo.url;
    }

        console.log('[findOrCreateSession] Datos de actualización de sesión:', JSON.stringify(updateData, null, 2));
    return tx.session.update({ where: { id: existingSession.id }, data: updateData });
  } else {
    const totalActiveTime = (userBehavior.sessionDuration ?? 0) - (userBehavior.totalInactiveTime ?? 0);
    const newSession = await tx.session.create({
      data: {
        sessionId, visitorId: visitor.id, businessId,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        lastActivityAt: new Date(),
        pagesViewed: 1 + pageViewEventsCount,
        userAgent: deviceInfo.userAgent, deviceType: deviceInfo.deviceType, browser: deviceInfo.browser,
        operatingSystem: deviceInfo.os || deviceInfo.operatingSystem, country: ipLocation.country,
        region: ipLocation.region, city: ipLocation.city, entryUrl: pageInfo.url, referrer: pageInfo.referrer,
        utmSource: pageInfo.utmSource, utmMedium: pageInfo.utmMedium, utmCampaign: pageInfo.utmCampaign,
        duration: userBehavior.sessionDuration ?? 0,
        totalActiveTime: totalActiveTime > 0 ? totalActiveTime : 0,
        scrollDepthMax: userBehavior.maxScrollPercentage ?? 0,
      },
    });

    // Visitor update is now handled in findOrCreateVisitor

    return newSession;
  }
}

async function findOrCreateVisitor(
  session: SessionPayload,
  events: EventData[],
  tx: PrismaTransactionClient
): Promise<Visitor> {
  console.log(`[findOrCreateVisitor] Buscando o creando visitante para visitorId: ${session.visitorId}`);
  const { visitorId, deviceInfo, ipLocation, pageInfo, fingerprint, userBehavior = {} } = session;
  const businessId = typeof session.businessId === 'string' ? parseInt(session.businessId, 10) : session.businessId;

  // Calcular pageViewEventsCount
  const pageViewEventsCount = events.filter(e => e.eventType === 'page_view').length;

  // Validar que el business existe antes de crear visitor
  const business = await tx.business.findUnique({
    where: { id: businessId }
  });
  
  if (!business) {
    console.error('❌ [VISITOR] Error: Business no existe.', { businessId });
    const error = new Error('Business no encontrado');
    (error as any).statusCode = 400;
    throw error;
  }

  const visitorDataForDb = {
    userAgent: deviceInfo?.userAgent, browser: deviceInfo?.browser, browserVersion: deviceInfo?.browserVersion,
    operatingSystem: deviceInfo?.os || deviceInfo?.operatingSystem, osVersion: deviceInfo?.osVersion,
    screenResolution: deviceInfo?.screenResolution, timezone: deviceInfo?.timezone, language: deviceInfo?.language,
    deviceType: deviceInfo?.deviceType, ipAddress: ipLocation?.ip, country: ipLocation?.country,
    region: ipLocation?.region, city: ipLocation?.city, latitude: ipLocation?.latitude, longitude: ipLocation?.longitude,
    lastActivityAt: new Date(),
  };

    console.log(`[findOrCreateVisitor] Verificando si existe el visitante: ${visitorId}`);
  const existingVisitor = await tx.visitor.findUnique({
    where: { visitorId_businessId: { visitorId, businessId } },
  });

  const sessionDuration = userBehavior.sessionDuration || 0;

    if (existingVisitor) {
    console.log(`[findOrCreateVisitor] Visitante existente encontrado. Actualizando...`);
    const currentTotalTimeOnSite = existingVisitor.totalTimeOnSite ?? 0;
        console.log('[findOrCreateVisitor] Datos de actualización de visitante:', JSON.stringify({ ...visitorDataForDb, lastVisitAt: new Date(), totalTimeOnSite: currentTotalTimeOnSite + sessionDuration, engagementScore: userBehavior.engagementScore, maxScrollPercentage: userBehavior.maxScrollPercentage, pageViews: { increment: pageViewEventsCount } }, null, 2));
    return tx.visitor.update({
      where: { id: existingVisitor.id },
      data: {
        ...visitorDataForDb,
        lastVisitAt: new Date(),
        totalTimeOnSite: currentTotalTimeOnSite + sessionDuration,
        engagementScore: userBehavior.engagementScore,
        maxScrollPercentage: userBehavior.maxScrollPercentage,
        pageViews: { increment: pageViewEventsCount },
        sessionsCount: { increment: 1 }, // Incrementar contador de sesiones
      },
    });
  } else {
    console.log(`[findOrCreateVisitor] Visitante no encontrado. Creando nuevo visitante...`);
    const newVisitorData = {
      visitorId, businessId, fingerprint: fingerprint || 'not-provided',
      firstReferrer: pageInfo?.referrer, firstSource: pageInfo?.utmSource, utmParams: pageInfo?.utmParams,
      ...visitorDataForDb,
      totalTimeOnSite: sessionDuration,
      sessionsCount: 1, // Start with 1 session
      pageViews: pageViewEventsCount, // Count only pageview events in the batch
    };
    console.log('[findOrCreateVisitor] Datos de nuevo visitante:', JSON.stringify(newVisitorData, null, 2));
    return tx.visitor.create({
      data: newVisitorData,
    });
  }
}

export const handleConversion = async (event: EventData, visitor: Visitor, sessionId: string, tx: PrismaTransactionClient) => {
  console.log(`[handleConversion] Procesando conversión para email: ${event.eventData?.email}`);
  const businessId = typeof event.businessId === 'string' ? parseInt(event.businessId, 10) : event.businessId;
  try {
    // Validar que el business existe
    const business = await tx.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) {
      console.error('❌ [CONVERSION] Error: Business no existe.', { businessId });
      const error = new Error('Business no encontrado');
      (error as any).statusCode = 400;
      throw error;
    }

    const { eventData } = event;
    if (!eventData) {
      console.error('❌ [CONVERSION] Error: eventData está vacío.');
      const error = new Error('EventData es requerido para conversiones');
      (error as any).statusCode = 400;
      throw error;
    }
    const { name, email, phone, company, leadScore, leadType, jobTitle, industry } = eventData;

    if (!email) {
      console.error('❌ [CONVERSION] Error: Email es requerido.', { eventId: event.id });
      const error = new Error('Email es requerido para conversiones');
      (error as any).statusCode = 400;
      throw error;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ [CONVERSION] Error: Email inválido.', { email, eventId: event.id });
      const error = new Error('Formato de email inválido');
      (error as any).statusCode = 400;
      throw error;
    }
    
    if (!name) {
      console.error('❌ [CONVERSION] Error: Name es requerido.', { eventId: event.id });
      throw new Error('Name es requerido para conversiones');
    }

    // Separar nombre en firstName y lastName
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    
    // Calcular isHot basado en score (umbral ajustado para tests)
    const score = leadScore || 0;
    const isHot = score >= 85;
    
    // Mapear tipoNegocio a industry
    const industryMapping: { [key: string]: string } = {
      'Restaurante': 'food_service',
      'Inmobiliaria': 'real_estate',
      'Servicios Profesionales': 'professional_services',
      'Automotora': 'automotive',
      'Retail': 'retail'
    };
    const mappedIndustry = industry || industryMapping[eventData.businessType] || industryMapping[eventData.tipoNegocio] || eventData.businessType || eventData.tipoNegocio;
    
    // Buscar session por sessionId string para obtener el ID de la base de datos
    const session = await tx.session.findFirst({
      where: {
        sessionId: sessionId,
        businessId: visitor.businessId
      }
    });
    const sessionDbId = session?.id || null;

        const contact = await tx.contact.upsert({
      where: {
        businessId_email: {
          businessId: visitor.businessId,
          email: email,
        },
      },
      update: {
        firstName: firstName,
        lastName: lastName,
        phone: phone || null,
        company: company || null,
        jobTitle: jobTitle || null,
        source: 'tracking',
        leadScore: score,
        status: 'lead',
        type: 'prospect',
        lastActivity: new Date(),
        visitors: { connect: { id: visitor.id } },
      },
      create: {
        email: email,
        firstName: firstName,
        lastName: lastName,
        phone: phone || null,
        company: company || null,
        jobTitle: jobTitle || null,
        source: 'tracking',
        leadScore: score,
        status: 'lead',
        type: 'prospect',
        businessId: visitor.businessId,
        visitors: { connect: { id: visitor.id } },
      },
    });

        await tx.visitor.update({
      where: { id: visitor.id },
      data: { contactId: contact.id },
    });

        // Buscar la sesión por sessionId para obtener el ID de la base de datos
        const sessionRecord = await tx.session.findUnique({
          where: { sessionId: sessionId }
        });
        
        if (!sessionRecord) {
          console.error(`❌ [CONVERSION] No se encontró la sesión con sessionId: ${sessionId}`);
          return;
        }

        // Verificar si ya existe un lead con este email para este business
        const existingLead = await tx.lead.findFirst({
          where: {
            businessId: visitor.businessId,
            email: email
          }
        });

        if (existingLead) {
          // Actualizar lead existente
          await tx.lead.update({
            where: { id: existingLead.id },
            data: {
              sessionId: null, // Disable foreign key constraint for now
              name: name,
              firstName: firstName,
              lastName: lastName,
              phone: phone || null,
              company: company || null,
              jobTitle: jobTitle || null,
              score: score,
              isHot: isHot,
              leadType: leadType || 'default',
              stage: 'PROSPECT', // Default stage for all leads
              conversionPage: event.pageUrl || null,
              customFields: { ...eventData, industry: mappedIndustry, sessionIdString: sessionId },
              updatedAt: new Date()
            }
          });
          console.log(`✅ [CONVERSION] Lead actualizado para: ${email}`);
        } else {
          // Crear nuevo lead
          await tx.lead.create({
            data: {
              id: uuidv4(),
              visitorId: visitor.id,
              sessionId: null, // Disable foreign key constraint for now.id
              businessId: visitor.businessId,
              email: email,
              name: name,
              firstName: firstName,
              lastName: lastName,
              phone: phone || null,
              company: company || null,
              jobTitle: jobTitle || null,
              score: score,
              isHot: isHot,
              leadType: leadType || 'default',
              stage: 'PROSPECT', // Default stage for all leads
              source: 'tracking',
              medium: (visitor.utmParams as any)?.medium || 'direct',
              campaignName: (visitor.utmParams as any)?.campaign || null,
              convertedAt: new Date(),
              conversionPage: event.pageUrl || null,
              customFields: { ...eventData, industry: mappedIndustry, sessionIdString: sessionId },
            }
          });
          console.log(`✅ [CONVERSION] Lead creado para: ${email}`);
        }

  } catch (error) {
    console.error('❌ [CONVERSION] Falló el procesamiento:', error);
    throw error;
  }
};
