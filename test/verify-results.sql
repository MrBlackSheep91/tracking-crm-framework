-- Script SQL para verificar resultados de pruebas
-- Eventos de tracking
SELECT COUNT(*) AS total_eventos FROM tracking_events WHERE "businessId" = '00000000-0000-0000-0000-000000000001';

-- Actividades
SELECT COUNT(*) AS total_actividades FROM activities WHERE "businessId" = '00000000-0000-0000-0000-000000000001';

-- Tipos de actividades
SELECT type, COUNT(*) FROM activities WHERE "businessId" = '00000000-0000-0000-0000-000000000001' GROUP BY type;

-- Visitantes
SELECT COUNT(*) AS total_visitantes FROM visitors WHERE "businessId" = '00000000-0000-0000-0000-000000000001';

-- Sesiones
SELECT COUNT(*) AS total_sesiones FROM visitor_sessions WHERE "businessId" = '00000000-0000-0000-0000-000000000001';

-- Detalles de actividades (últimas 5)
SELECT id, type, title, "createdAt" FROM activities 
WHERE "businessId" = '00000000-0000-0000-0000-000000000001' 
ORDER BY "createdAt" DESC 
LIMIT 5;
