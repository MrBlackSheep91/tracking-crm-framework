# 🧪 TESTS OFICIALES - TRACKING CRM FRAMEWORK

## 📋 Tests Consolidados (Carpeta Única)

Esta es la **ÚNICA carpeta de tests** del framework tras la consolidación.

### ✅ TESTS PRINCIPALES
- **`test-compatibility-final.js`** - **CRÍTICO** - Test completo frontend-backend
- **`test-schema-validation.js`** - Validación de schemas Joi
- **`test-heartbeat-complete.js`** - Sistema heartbeat y sesiones
- **`test-utm-tracking.html`** - Test frontend completo

### 🏢 Setup de Testing
- **`create-business.js`** - Script para crear business de test (Prisma)
- **`create_business.sql`** - Versión SQL del setup (PostgreSQL)
- **`verify-results.js`** - Verificación de resultados en DB

### 📊 Payloads de Prueba
- **`test-*.json`** - Diversos payloads para testing
- **`run-all-tests.ps1`** - Script PowerShell de ejecución

### 🎯 Cómo Ejecutar

## 🎯 Cómo Ejecutar las Pruebas

### Prerequisitos
1. **Docker containers ejecutándose:**
   ```bash
   docker-compose up -d
   ```

2. **Backend API ejecutándose en puerto 3001:**
   ```bash
   cd backend/template
   npm run dev
   ```

### Opción 1: Ejecutar Todas las Pruebas (Recomendado)
```powershell
.\test\run-all-tests.ps1
```

### Opción 2: Crear Business de Prueba Manualmente
```bash
# Opción A: Usando Node.js + Prisma
cd backend/template
node ../../test/create-business.js

# Opción B: Usando SQL directo
docker exec -i tracking_crm_db psql -U user -d tracking_crm < test/create-business.sql
```

### Opción 3: Ejecutar Pruebas Individuales
```powershell
# Prueba de formulario
Invoke-WebRequest -Uri "http://localhost:3001/api/track/event" -Method POST -Headers @{"Content-Type"="application/json"} -Body (Get-Content "test\test-form-submit.json" -Raw)

# Prueba de CTA click
Invoke-WebRequest -Uri "http://localhost:3001/api/track/event" -Method POST -Headers @{"Content-Type"="application/json"} -Body (Get-Content "test\test-cta-click.json" -Raw)

# Prueba de page view
Invoke-WebRequest -Uri "http://localhost:3001/api/track/event" -Method POST -Headers @{"Content-Type"="application/json"} -Body (Get-Content "test\test-page-view.json" -Raw)

# Prueba de conversión
Invoke-WebRequest -Uri "http://localhost:3001/api/track/event" -Method POST -Headers @{"Content-Type"="application/json"} -Body (Get-Content "test\test-conversion.json" -Raw)
```

## 📊 Verificación de Resultados

### En Base de Datos (PostgreSQL)
```sql
-- Verificar eventos de tracking
SELECT COUNT(*) FROM tracking_events WHERE "businessId" = '00000000-0000-0000-0000-000000000001';

-- Verificar actividades generadas
SELECT type, title, "createdAt" FROM activities WHERE "businessId" = '00000000-0000-0000-0000-000000000001' ORDER BY "createdAt" DESC;

-- Verificar visitantes
SELECT COUNT(*) FROM visitors WHERE "businessId" = '00000000-0000-0000-0000-000000000001';

-- Verificar sesiones
SELECT COUNT(*) FROM visitor_sessions WHERE "businessId" = '00000000-0000-0000-0000-000000000001';
```

### En Prisma Studio
1. Abrir `http://localhost:5555` (si está ejecutándose en Docker)
2. Navegar a las tablas:
   - `tracking_events` - Eventos granulares
   - `activities` - Actividades de usuario
   - `visitors` - Visitantes registrados
   - `visitor_sessions` - Sesiones de tracking

## 🎯 Qué Validan las Pruebas

### 1. **Form Submit Test** (`test-form-submit.json`)
- ✅ Almacena evento `form_submit` en `tracking_events`
- ✅ Genera actividad `form_submit` en `activities`
- ✅ Crea/actualiza visitor y session
- ✅ Incluye datos del formulario en metadata

### 2. **CTA Click Test** (`test-cta-click.json`)
- ✅ Almacena evento `universal_click` en `tracking_events`
- ✅ Genera actividad `cta_click` en `activities`
- ✅ Incluye información del elemento clickeado
- ✅ Valida detección de CTAs importantes

### 3. **Page View Test** (`test-page-view.json`)
- ✅ Almacena evento `page_view` en `tracking_events`
- ✅ Genera actividad `page_view` para páginas importantes
- ✅ Incluye información de navegación
- ✅ Valida detección de páginas de conversión

### 4. **Conversion Test** (`test-conversion.json`)
- ✅ Almacena evento `conversion` en `tracking_events`
- ✅ Genera actividad `conversion` en `activities`
- ✅ Incluye valor y tipo de conversión
- ✅ Valida pipeline completo de conversión

## 🔧 Troubleshooting

### Error: "Business no encontrado"
```bash
# Ejecutar script de creación de business
cd backend/template
node ../../test/create-business.js
```

### Error: "Endpoint no encontrado"
- Verificar que el backend esté ejecutándose en puerto 3001
- Verificar que Docker containers estén activos

### Error: "UUID inválido"
- Los payloads de prueba usan UUIDs válidos
- Verificar que el business existe con ID: `00000000-0000-0000-0000-000000000001`

## 📈 Resultados Esperados

Después de ejecutar todas las pruebas exitosamente:
- **4 eventos** almacenados en `tracking_events`
- **4 actividades** generadas en `activities`
- **4 visitantes** registrados en `visitors`
- **4 sesiones** registradas en `visitor_sessions`
- **1 business** de prueba en `businesses`

## 🎉 Pipeline Validado

Si todas las pruebas pasan exitosamente, el pipeline de tracking y actividades está funcionando correctamente y listo para producción.
