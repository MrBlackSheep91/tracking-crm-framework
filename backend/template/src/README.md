# Backend Source Code Documentation

## Estructura de Carpetas

### `/middleware/` - Middlewares Express (LEGACY)
**Estado**: ⚠️ LEGACY - Contiene validaciones obsoletas
**Archivos**:
- `validation.ts` - Esquemas Joi legacy (DUPLICADO con /validation)
- `errorHandler.ts` - Manejo de errores global 
- `logger.ts` - Logging centralizado

**Problemas identificados**:
- `validation.ts` tiene esquemas duplicados y obsoletos
- Usa estructura de payload legacy con wrapper `body`
- Inconsistente con `/validation/tracking-schemas.ts`

### `/validation/` - Esquemas de Validación V3.0 (ACTUAL)
**Estado**: ✅ ACTUAL - Sistema unificado V3.0
**Archivos**:
- `tracking-schemas.ts` - Esquemas Joi modernos y middlewares Express

**Funcionalidades**:
- Esquemas unificados basados en types TypeScript
- Middlewares Express exportados
- Validación automática de tipos de payload
- Compatible con estructura V3.0

### `/routes/` - Endpoints de API
**Estado**: ✅ FUNCIONAL - Rutas V3.0 activas
**Archivos**:
- `tracking.ts` - Endpoints principales de tracking V3.0
- `leads.ts` - Manejo de leads y conversiones
- `health.ts` - Health checks del sistema

**Problemas identificados**:
- `tracking.ts` usa middleware custom `validateHeartbeatV3` en lugar del estándar
- Mezcla importaciones de `/validation` y middlewares custom

### `/services/` - Lógica de Negocio
**Estado**: ✅ FUNCIONAL - Servicios principales
**Archivos**:
- `trackingService.ts` - Procesamiento principal de tracking (53KB)
- `leadService.ts` - Gestión de leads y CRM
- `activityService.ts` - Sistema de actividades

**Funcionalidades**:
- Pipeline completo de visitor → session → events → leads → contacts
- Integración con Prisma ORM
- Cálculo de métricas y engagement

### `/types/` - Definiciones TypeScript
**Estado**: ✅ ACTUAL - Interfaces compartidas
**Archivos**:
- `tracking-payloads.ts` - Interfaces de payloads V3.0
- `express.d.ts` - Extensiones de Express

## Inconsistencias Críticas Identificadas

### 1. Validación Duplicada
- ❌ `middleware/validation.ts` - Sistema legacy
- ✅ `validation/tracking-schemas.ts` - Sistema actual V3.0

### 2. Middleware de Heartbeat Duplicado
- ❌ `validateHeartbeatV3()` en `routes/tracking.ts` (custom)
- ✅ `validateHeartbeat()` en `validation/tracking-schemas.ts` (estándar)

### 3. Esquemas Inconsistentes
- Legacy usa wrapper `{ body: { session: {}, events: [] } }`
- V3.0 usa payloads directos `{ sessionId, visitorId, userBehavior }`

## Acciones Requeridas

1. **INMEDIATO**: Reemplazar `validateHeartbeatV3` con `validateHeartbeat` estándar
2. **LIMPIAR**: Deprecar `middleware/validation.ts` completamente
3. **UNIFICAR**: Usar solo `validation/tracking-schemas.ts` para todas las validaciones
4. **DOCUMENTAR**: Actualizar imports en todas las rutas
