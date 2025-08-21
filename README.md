# 🚀 Tracking CRM Framework

**Sistema completo de tracking de visitantes y CRM automático**  
Framework agnóstico compatible con React, Vue, Angular, Next.js, HTML estático y cualquier tecnología web.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/innova-marketing/tracking-crm-framework)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://docker.com/)

## ✨ Características Principales

- 🎯 **Tracking Completo**: Visitantes, sesiones, eventos, comportamiento, UTM campaigns
- 🔄 **100% Agnóstico**: Funciona con cualquier framework o sitio web
- 🐳 **Docker Ready**: Sistema completo con PostgreSQL + Backend API + Prisma ORM
- 📊 **Analytics Avanzado**: Geolocalización, dispositivos, métricas de engagement
- 🛡️ **Validación Robusta**: Sistema Joi compatible con esquema Prisma
- 🚀 **Producción Lista**: Health checks, logs, monitoreo, escalabilidad

## ⚡ Instalación Rápida

### Prerequisitos
```bash
# Asegurar Docker y Node.js estén instalados
docker --version
node --version  # >= 18.0.0
```

### Opción 1: Sistema Completo con Docker
```bash
# 1. Clonar el repositorio
git clone https://github.com/innova-marketing/tracking-crm-framework.git
cd tracking-crm-framework

# 2. Levantar sistema completo (incluye Prisma Studio en puerto 5555)
docker-compose up -d

# 3. Verificar que funciona
curl http://localhost:3001/health

# 4. Acceder a Prisma Studio para ver la base de datos
# http://localhost:5555
```

### Opción 2: Paquete NPM del Cliente
```bash
# Instalar solo el cliente JavaScript (próximamente)
npm install @tracking-crm/client

# Uso básico
import { createInnovaTracker } from '@tracking-crm/client';
const tracker = createInnovaTracker({ baseUrl: 'your-backend-url' });
```

### Opción 3: Self-Hosted Completo
```bash
git clone https://github.com/innova-marketing/tracking-crm-framework.git
cd tracking-crm-framework
node scripts/init-project.js
```

## 🧪 Testing y Desarrollo

```bash
# Scripts de desarrollo disponibles
node scripts/development/verify-final.js           # Verificación completa del pipeline
node scripts/development/create-business.js        # Crear business de prueba  
node scripts/development/clean-database-complete.js # Limpiar base de datos
node scripts/development/verify-database-state.js  # Verificar estado de DB

# Health check del sistema
curl http://localhost:3001/health
# Respuesta: {"status":"healthy","timestamp":"...","database":"connected","version":"2.0.0","uptime":...}
```

## 📚 Documentación

### 📖 Guías Principales
- **[Instalación](docs/INSTALLATION.md)** - Setup completo paso a paso
- **[Tracking Integration Guide](docs/TRACKING-INTEGRATION-GUIDE.md)** - Guía de integración
- **[Arquitectura](ARCHITECTURE.md)** - Estructura técnica del sistema


## 🎯 Uso Básico

```typescript
// Frontend - InnovaTracker (TypeScript)
import { createInnovaTracker } from './frontend/src/tracker/factory';

const tracker = createInnovaTracker({
  baseUrl: 'http://localhost:3001',
  businessId: '00000000-0000-0000-0000-000000000001',
  debug: true
});

// Tracking automático se inicia al crear la instancia
tracker.trackPageView();
tracker.trackEvent('cta_click', { ctaId: 'hero-button', ctaText: 'Comenzar' });
```

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + TypeScript)
- **API REST**: Express.js con validación Joi
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Endpoints**: `/api/v1/track/*`, `/api/leads`, `/api/metrics/*`, `/health`

### Frontend (TypeScript)
- **InnovaTracker**: Clase principal de tracking
- **Módulos**: SessionManager, DataService, ActivityMonitor, ScrollTracker
- **Tipos**: Definiciones TypeScript completas

### Docker Stack
- **PostgreSQL**: Puerto 5433, base de datos `tracking_crm`  
- **Backend API**: Puerto 3001, health checks integrados
- **Prisma Studio**: Puerto 5555, interfaz de administración DB

## 📊 Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/track/event` | Endpoint principal para recibir lotes de eventos. |
| POST | `/api/v1/track/heartbeat` | Mantiene una sesión de usuario activa. |
| POST | `/api/v1/track/session-end` | Marca el final explícito de una sesión. |
| POST | `/api/leads` | Crea un nuevo lead en el CRM. |
| GET | `/api/leads` | Obtiene una lista de leads con filtros. |
| GET | `/api/metrics/*` | Endpoints para consultar métricas agregadas. |
| GET | `/health` | Verifica el estado del servicio y la base de datos. |

## ✅ Estado del Proyecto

- **🧹 Completamente reorganizado** - Estructura clara y profesional
- **🔄 Refactorizado** - Sin dependencias obsoletas (N8N eliminado)
- **🧪 Tests consolidados** - Suite unificada en `/test/`
- **📚 Documentación actualizada** - Guías completas y actuales
- **🚀 Listo para producción** - Framework estable y optimizado

## 🤝 Contribuir

Ver documentación en `docs/` para guías de contribución y desarrollo.

## 📄 Licencia

MIT License - ver [LICENSE] para detalles.

---

**🎯 IMPLEMENTA UN CRM COMPLETO EN CUALQUIER SITIO WEB EN MINUTOS**
