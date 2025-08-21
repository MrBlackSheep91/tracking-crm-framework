-- Script para crear el business necesario para el tracking
-- Ejecutar este script en la base de datos tracking_crm

-- Insertar business con ID específico para Innova Marketing
INSERT INTO businesses (
    id, 
    name, 
    subdomain, 
    "isActive",
    "createdAt", 
    "updatedAt"
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Innova Marketing',
    'innova-marketing',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó correctamente
SELECT 
    id,
    name,
    subdomain,
    "isActive",
    "createdAt"
FROM businesses 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verificar que se creó correctamente
SELECT id, name, subdomain, is_active FROM businesses WHERE id = '00000000-0000-0000-0000-000000000001';
