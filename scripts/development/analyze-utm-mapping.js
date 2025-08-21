/**
 * Script para analizar el mapeo UTM después de la prueba controlada
 * Identifica campos NULL, mal mapeados o faltantes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://tracking_user:tracking_password@localhost:5433/tracking_crm'
    }
  }
});

// Función para analizar completitud de campos
function analyzeFieldCompleteness(obj, modelName) {
  const totalFields = Object.keys(obj).length;
  const filledFields = Object.values(obj).filter(value => 
    value !== null && value !== undefined && value !== ''
  ).length;
  const nullFields = Object.entries(obj)
    .filter(([key, value]) => value === null || value === undefined || value === '')
    .map(([key]) => key);
  
  const completeness = totalFields > 0 ? ((filledFields / totalFields) * 100).toFixed(1) : 0;
  
  return {
    modelName,
    totalFields,
    filledFields,
    nullFields,
    completeness: `${completeness}%`
  };
}

// Función para mostrar análisis detallado
function displayDetailedAnalysis(data, modelName) {
  console.log(`\n📊 ANÁLISIS DETALLADO: ${modelName.toUpperCase()}`);
  console.log('═'.repeat(60));
  
  const analysis = analyzeFieldCompleteness(data, modelName);
  
  console.log(`📈 Completitud: ${analysis.completeness} (${analysis.filledFields}/${analysis.totalFields})`);
  
  // Mostrar campos llenos
  console.log('\n✅ CAMPOS LLENOS:');
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      const displayValue = typeof value === 'string' && value.length > 50 
        ? value.substring(0, 50) + '...' 
        : value;
      console.log(`   ✓ ${key}: ${displayValue}`);
    }
  });
  
  // Mostrar campos NULL
  if (analysis.nullFields.length > 0) {
    console.log('\n❌ CAMPOS NULL/VACÍOS:');
    analysis.nullFields.forEach(field => {
      console.log(`   ✗ ${field}`);
    });
  }
  
  return analysis;
}

async function analyzeUTMMapping() {
  try {
    console.log('🔍 INICIANDO ANÁLISIS DE MAPEO UTM POST-PRUEBA...\n');
    
    // 1. Verificar que hay datos después de la prueba
    const totalVisitors = await prisma.visitor.count();
    const totalSessions = await prisma.session.count();
    const totalEvents = await prisma.trackingEvent.count();
    
    console.log('📋 ESTADO ACTUAL DE LA BASE DE DATOS:');
    console.log(`   👥 Visitors: ${totalVisitors}`);
    console.log(`   📋 Sessions: ${totalSessions}`);
    console.log(`   📊 Events: ${totalEvents}`);
    
    if (totalVisitors === 0 && totalSessions === 0 && totalEvents === 0) {
      console.log('\n⚠️ NO HAY DATOS PARA ANALIZAR');
      console.log('🎯 Por favor, haz clic en el enlace UTM de prueba primero');
      return;
    }
    
    // 2. Analizar el último visitor creado
    const latestVisitor = await prisma.visitor.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (latestVisitor) {
      const visitorAnalysis = displayDetailedAnalysis(latestVisitor, 'VISITOR');
      
      // Análisis específico de campos críticos de visitor
      console.log('\n🎯 ANÁLISIS ESPECÍFICO VISITOR:');
      const criticalVisitorFields = {
        'visitorId': latestVisitor.visitorId,
        'userAgent': latestVisitor.userAgent,
        'deviceType': latestVisitor.deviceType,
        'browser': latestVisitor.browser,
        'browserVersion': latestVisitor.browserVersion,
        'operatingSystem': latestVisitor.operatingSystem,
        'osVersion': latestVisitor.osVersion,
        'country': latestVisitor.country,
        'region': latestVisitor.region,
        'city': latestVisitor.city,
        'clientIP': latestVisitor.clientIP
      };
      
      Object.entries(criticalVisitorFields).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${value || 'NULL'}`);
      });
    }
    
    // 3. Analizar la última session creada
    const latestSession = await prisma.session.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (latestSession) {
      const sessionAnalysis = displayDetailedAnalysis(latestSession, 'SESSION');
      
      // Análisis específico de campos UTM
      console.log('\n🎯 ANÁLISIS ESPECÍFICO UTM:');
      const utmFields = {
        'entryUrl': latestSession.entryUrl,
        'utmSource': latestSession.utmSource,
        'utmMedium': latestSession.utmMedium,
        'utmCampaign': latestSession.utmCampaign,
        'utmContent': latestSession.utmContent,
        'utmTerm': latestSession.utmTerm,
        'fbclid': latestSession.fbclid,
        'gclid': latestSession.gclid
      };
      
      Object.entries(utmFields).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${value || 'NULL'}`);
      });
      
      // Verificar si la URL contiene UTM pero no se mapeó
      if (latestSession.entryUrl && latestSession.entryUrl.includes('utm_')) {
        console.log('\n🔍 VERIFICACIÓN URL vs MAPEO:');
        console.log(`   📍 URL: ${latestSession.entryUrl}`);
        
        const urlParams = new URL(latestSession.entryUrl).searchParams;
        const expectedUTM = {
          utm_source: urlParams.get('utm_source'),
          utm_medium: urlParams.get('utm_medium'),
          utm_campaign: urlParams.get('utm_campaign'),
          utm_content: urlParams.get('utm_content'),
          utm_term: urlParams.get('utm_term'),
          fbclid: urlParams.get('fbclid'),
          gclid: urlParams.get('gclid')
        };
        
        console.log('\n   📋 UTM EN URL vs BASE DE DATOS:');
        Object.entries(expectedUTM).forEach(([param, urlValue]) => {
          const dbField = param.replace('utm_', 'utm');
          const dbValue = latestSession[dbField];
          const match = urlValue === dbValue;
          const status = match ? '✅' : '❌';
          console.log(`   ${status} ${param}: URL="${urlValue}" | DB="${dbValue}"`);
        });
      }
    }
    
    // 4. Analizar eventos recientes
    const recentEvents = await prisma.trackingEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    if (recentEvents.length > 0) {
      console.log('\n📊 ANÁLISIS DE EVENTOS RECIENTES:');
      recentEvents.forEach((event, index) => {
        console.log(`\n   📋 EVENTO ${index + 1}:`);
        console.log(`   ✓ Tipo: ${event.eventType}`);
        console.log(`   ✓ Nombre: ${event.eventName}`);
        console.log(`   ✓ URL: ${event.pageUrl}`);
        console.log(`   ✓ Timestamp: ${event.createdAt}`);
        
        const eventAnalysis = analyzeFieldCompleteness(event, `EVENT_${index + 1}`);
        console.log(`   📈 Completitud: ${eventAnalysis.completeness}`);
      });
    }
    
    // 5. Resumen de problemas encontrados
    console.log('\n🚨 RESUMEN DE PROBLEMAS DETECTADOS:');
    
    const problems = [];
    
    if (latestVisitor) {
      if (!latestVisitor.visitorId) problems.push('❌ visitorId NULL en visitor');
      if (!latestVisitor.userAgent) problems.push('❌ userAgent NULL en visitor');
      if (!latestVisitor.deviceType) problems.push('❌ deviceType NULL en visitor');
      if (!latestVisitor.browser) problems.push('❌ browser NULL en visitor');
      if (!latestVisitor.country) problems.push('❌ country NULL en visitor');
    }
    
    if (latestSession) {
      if (!latestSession.utmSource && latestSession.entryUrl && latestSession.entryUrl.includes('utm_source')) {
        problems.push('❌ utmSource no mapeado desde URL');
      }
      if (!latestSession.utmMedium && latestSession.entryUrl && latestSession.entryUrl.includes('utm_medium')) {
        problems.push('❌ utmMedium no mapeado desde URL');
      }
      if (!latestSession.fbclid && latestSession.entryUrl && latestSession.entryUrl.includes('fbclid')) {
        problems.push('❌ fbclid no mapeado desde URL');
      }
    }
    
    if (problems.length > 0) {
      problems.forEach(problem => console.log(`   ${problem}`));
    } else {
      console.log('   ✅ No se detectaron problemas críticos de mapeo');
    }
    
    // 6. Recomendaciones
    console.log('\n🎯 RECOMENDACIONES PARA CORREGIR:');
    console.log('   1. Verificar función extractUtmParam en trackingService');
    console.log('   2. Asegurar que sessionData.entryUrl se pase correctamente');
    console.log('   3. Validar métodos auxiliares (extractBrowser, extractOS, etc.)');
    console.log('   4. Revisar mapeo de campos en findOrCreateVisitor y findOrCreateSession');
    
    console.log('\n✅ ANÁLISIS COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar análisis
analyzeUTMMapping()
  .then(() => {
    console.log('✅ Análisis UTM completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Análisis falló:', error);
    process.exit(1);
  });
