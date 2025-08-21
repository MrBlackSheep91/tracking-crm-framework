# 📚 API Documentation - Innova Tracking CRM Framework v2.0.0

## 🚀 Introducción

El **Innova Tracking CRM Framework v2.0.0** proporciona una API completa para capturar, procesar y almacenar datos de tracking de visitantes, sesiones, eventos y leads. Esta documentación refleja los endpoints reales implementados en el backend.

## 🔗 Base URL

```
Desarrollo: http://localhost:3001
Producción: https://api.innovamarketing.com
```

## 🔐 Autenticación

Actualmente el framework no requiere autenticación, pero incluye headers de identificación del cliente.

---

## 🎨 API del Cliente Frontend (InnovaTracker)

El **InnovaTracker** es la librería que se integra en el frontend de tu aplicación. Proporciona una API fluida para capturar la actividad del usuario sin esfuerzo.

### 1. Inicialización

Para comenzar, primero debes crear una instancia del tracker. Esto se hace a través de la función `createInnovaTracker`, que devuelve la instancia que usarás para todas las interacciones.

```javascript
import { createInnovaTracker } from '@innova-marketing/tracking-crm-framework';

const tracker = createInnovaTracker({
  businessId: 'TU_BUSINESS_ID', // Reemplaza con el ID de tu negocio
  baseUrl: 'http://localhost:3001', // URL de tu backend de tracking
  debug: true // Activa logs en la consola para depuración
});

// El tracking de sesión y page view inicial comienza automáticamente.
```

**Parámetros de Configuración:**

-   `businessId` (string, requerido): El identificador único de tu negocio.
-   `baseUrl` (string, requerido): La URL base del backend del Tracking CRM Framework.
-   `debug` (boolean, opcional): Si es `true`, el tracker imprimirá información útil en la consola del navegador.

### 2. Métodos Principales

Una vez inicializado, el objeto `tracker` expone los siguientes métodos:

#### Eventos de Tracking

-   **`trackPageView(customData?: object)`**: Registra una vista de página. Se llama automáticamente al inicio, pero puede ser invocado manualmente en aplicaciones de página única (SPA) al cambiar de ruta.
    ```javascript
    // Ejemplo para una SPA (React, Vue, Angular)
    tracker.trackPageView({ page: '/nueva-ruta', title: 'Nueva Página' });
    ```

-   **`trackEvent(eventType: string, eventData: object)`**: El método más versátil. Permite registrar cualquier tipo de evento personalizado.
    ```javascript
    tracker.trackEvent('video_played', { videoId: 'video-123', duration: 180 });
    ```

-   **`captureLead(leadData: object)`**: Envía un evento de conversión de lead. Este es un evento de alta prioridad y se envía inmediatamente al backend.
    ```javascript
    tracker.captureLead({
      formId: 'contact-form',
      email: 'cliente@example.com',
      name: 'John Doe'
    });
    ```

#### Métodos de Conveniencia

-   **`trackCTA(ctaData: object)`**: Un atajo para registrar un clic en un Call-to-Action.
    ```javascript
    // Asociar a un evento de clic de un botón
    const ctaButton = document.getElementById('hero-cta');
    ctaButton.addEventListener('click', () => {
      tracker.trackCTA({ ctaId: 'hero-cta', ctaText: 'Comprar Ahora' });
    });
    ```

-   **`trackFormInteraction(formData: object)`**: Registra una interacción con un formulario (ej. focus en un campo).
    ```javascript
    tracker.trackFormInteraction({ formId: 'register-form', fieldName: 'email' });
    ```

#### Control del Tracker

-   **`startTracking()`**: Inicia (o reanuda) el tracking de actividad automática (scroll, clicks, etc.).
-   **`stopTracking()`**: Pausa el tracking de actividad automática.
-   **`flushEvents()`**: Fuerza el envío inmediato de todos los eventos acumulados en el buffer. Útil antes de que el usuario abandone la página.

---

## 📊 Endpoints de Tracking V2.0

Estos son los endpoints principales para la recolección de datos de actividad.

### 1. Endpoint Principal: Eventos en Lote (Batch Events)

**Endpoint:** `POST /api/track/batch-events`

Este es el endpoint principal y más eficiente para enviar datos. Permite agrupar múltiples eventos de tracking en una sola solicitud HTTP, reduciendo la sobrecarga de red. El backend soporta dos formatos de payload: el **moderno (recomendado)** y el **legacy (obsoleto)**.

#### Formato de Payload (Moderno vs. Legacy)

**A. Formato Moderno (Recomendado)**

Este es el formato preferido para todas las nuevas implementaciones. Es una estructura plana y directa.

**Request Body (Moderno):**
```json
{
  "type": "batch_events",
  "sessionData": {
    "sessionId": "session_1234567890_abc123",
    "visitorId": "visitor_1234567890_def456",
    "businessId": "00000000-0000-0000-0000-000000000001",
    "startedAt": "2024-01-15T10:30:00.000Z",
    "pageInfo": {
      "url": "https://ejemplo.com",
      "title": "Página Principal"
    }
  },
  "events": [
    {
      "eventType": "page_view",
      "pageUrl": "https://ejemplo.com",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    {
      "eventType": "cta_click",
      "pageUrl": "https://ejemplo.com",
      "timestamp": "2024-01-15T10:30:05.000Z",
      "eventData": {
        "ctaId": "hero-button",
        "ctaText": "Comenzar Ahora"
      }
    }
  ]
}
```

**B. Formato Legacy (Obsoleto)**

Este formato se mantiene únicamente por retrocompatibilidad con clientes antiguos. **No se recomienda su uso en nuevas implementaciones.** La principal diferencia es que todo el contenido está anidado dentro de un objeto `body`.

**Request Body (Legacy):**
```json
{
  "body": {
    "session": {
      "sessionId": "session_1234567890_abc123",
      "visitorId": "visitor_1234567890_def456"
    },
    "events": [
      {
        "eventType": "page_view",
        "pageUrl": "https://ejemplo.com"
      }
    ]
  }
}
```

**Response:**
```json
{
    "success": true,
    "message": "Eventos procesados correctamente",
    "data": {
        "eventsReceived": 2,
        "eventsProcessed": 2
    }
}
```

### 2. Heartbeat de Sesión

**Endpoint:** `POST /api/track/heartbeat`

Mantiene una sesión activa y actualiza las métricas de comportamiento del usuario en tiempo real. El cliente frontend envía esto automáticamente.

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "visitorId": "550e8400-e29b-41d4-a716-446655440001",
  "businessId": "00000000-0000-0000-0000-000000000001",
  "userBehavior": {
    "timeOnSite": 120,
    "scrollDepthMax": 85,
    "isActive": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Heartbeat procesado correctamente",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active"
  }
}
```

### 3. Finalizar Sesión

**Endpoint:** `POST /api/track/session-end`

Marca explícitamente el final de una sesión. Esto es útil para asegurar que la duración y las métricas finales se calculen con precisión, especialmente cuando un usuario cierra la pestaña del navegador.

**Request Body:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "endedAt": "2024-01-15T11:00:00.000Z",
  "finalMetrics": {
      "totalEvents": 15,
      "timeOnSite": 300
  }
}
```

**Response:**
```json
{
    "success": true,
    "message": "Sesión finalizada correctamente"
}
```

---

## 📈 Endpoints de Métricas

El framework proporciona un potente conjunto de endpoints para consultar métricas agregadas y en tiempo real, ideales para dashboards y análisis de negocio.

**Todos los endpoints de métricas requieren un `businessId` en los query parameters.**

### 1. Métricas Agregadas por Período

**Endpoint:** `GET /api/metrics/aggregated`

Devuelve métricas clave agregadas durante un período de tiempo específico.

**Query Parameters:**
- `businessId` (requerido): ID del negocio.
- `startDate` (opcional): Fecha de inicio (ISO 8601).
- `endDate` (opcional): Fecha de fin (ISO 8601).
- `period` (opcional): "daily", "weekly", "monthly". Si se especifica, `startDate` y `endDate` se ignoran.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVisitors": 520,
    "totalSessions": 850,
    "totalEvents": 12345,
    "totalLeads": 45,
    "averageSessionDuration": 185.5,
    "bounceRate": 0.35,
    "period": {
      "startDate": "2024-07-01T00:00:00.000Z",
      "endDate": "2024-07-31T23:59:59.999Z"
    }
  }
}
```

### 2. Estadísticas en Tiempo Real

**Endpoint:** `GET /api/metrics/real-time`

Proporciona un snapshot de la actividad actual en el sitio.

**Query Parameters:**
- `businessId` (requerido): ID del negocio.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 15,
    "sessionsLastHour": 42,
    "eventsLastMinute": 120,
    "leadsToday": 5
  }
}
```

### 3. Datos para Dashboard

**Endpoint:** `GET /api/metrics/dashboard`

Endpoint optimizado que retorna todos los datos necesarios para un dashboard principal en una sola llamada.

**Query Parameters:**
- `businessId` (requerido): ID del negocio.
- `period` (opcional): "24h", "7d", "30d", "90d". Por defecto "30d".

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "visitors": { "value": 1200, "change": 0.15 },
      "sessions": { "value": 2500, "change": -0.05 },
      "leads": { "value": 80, "change": 0.20 },
      "bounceRate": { "value": 0.40, "change": 0.10 }
    },
    "visitorsChart": [
      { "date": "2024-07-01", "count": 50 },
      { "date": "2024-07-02", "count": 55 }
    ],
    "topPages": [
      { "url": "/precios", "views": 1500 },
      { "url": "/contacto", "views": 950 }
    ],
    "topReferrers": [
      { "referrer": "google.com", "sessions": 800 },
      { "referrer": "facebook.com", "sessions": 450 }
    ]
  }
}
```

### 4. Exportar Métricas

**Endpoint:** `GET /api/metrics/export`

Permite exportar datos de métricas en formato CSV o JSON.

**Query Parameters:**
- `businessId` (requerido): ID del negocio.
- `format` (requerido): "csv" o "json".
- `startDate` (opcional): Fecha de inicio.
- `endDate` (opcional): Fecha de fin.

**Response:**
- Si `format=json`, devuelve un JSON con los datos.
- Si `format=csv`, devuelve un archivo `metrics.csv` para descargar.

---

## 🎯 Endpoints de Leads

### 1. Crear Lead

**Endpoint:** `POST /api/leads`

Crea un nuevo lead en el sistema CRM.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "phone": "+598 99 123 456",
  "source": "landing-page",
  "formId": "contact-form",
  "businessId": "00000000-0000-0000-0000-000000000001",
  "sessionId": "session_1234567890_abc123",
  "visitorId": "visitor_1234567890_def456",
  "metadata": {
    "campaign": "verano-2024",
    "utm_source": "google",
    "utm_medium": "cpc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leadId": "lead_1234567890_ghi789",
    "email": "usuario@ejemplo.com",
    "status": "NEW",
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### 2. Obtener Leads

**Endpoint:** `GET /api/leads`

Obtiene una lista de leads con filtros opcionales.

**Query Parameters:**
- `businessId` (opcional): ID del negocio
- `status` (opcional): Estado del lead (NEW, CONTACTED, QUALIFIED, etc.)
- `source` (opcional): Fuente del lead
- `limit` (opcional): Número máximo de resultados (default: 50)
- `offset` (opcional): Número de resultados a saltar (default: 0)

---

## 🏥 Endpoints de Salud

### 1. Health Check

**Endpoint:** `GET /health`

Verifica el estado del sistema y la conectividad con la base de datos.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0",
  "uptime": 3600
}
```

---

## 🎨 Tipos de Eventos Soportados

### Eventos de Navegación
- `page_view`: Vista de página
- `page_exit`: Salida de página
- `scroll`: Scroll en la página

### Eventos de Interacción
- `cta_click`: Click en Call-to-Action
- `link_click`: Click en enlace
- `button_click`: Click en botón
- `form_interaction`: Interacción con formulario

### Eventos de Conversión
- `lead_capture`: Captura de lead
- `form_submit`: Envío de formulario
- `download`: Descarga de archivo

### Eventos Personalizados
- `custom_event`: Evento personalizado definido por el usuario

---

## 📝 Estructura de Metadatos

Los metadatos permiten agregar información adicional a los eventos:

```json
{
  "metadata": {
    "category": "conversion",
    "action": "form_submit",
    "label": "contact-form",
    "value": 1,
    "custom_field_1": "valor personalizado",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "verano-2024"
  }
}
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos de entrada inválidos |
| 404 | Not Found - Recurso no encontrado |
| 422 | Unprocessable Entity - Error de validación |
| 500 | Internal Server Error - Error interno del servidor |

### Ejemplo de Respuesta de Error:

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation error",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

---

## 🚀 Ejemplos de Integración

### JavaScript Vanilla
```javascript
// Ejemplo de envío de un lote de eventos usando el formato moderno.
const payload = {
  type: "batch_events",
  sessionData: {
    sessionId: "session_1234567890_abc123",
    visitorId: "visitor_1234567890_def456",
    businessId: "00000000-0000-0000-0000-000000000001",
    startedAt: new Date().toISOString(),
    pageInfo: {
      url: window.location.href,
      title: document.title
    }
  },
  events: [
    {
      eventType: "page_view",
      pageUrl: window.location.href,
      timestamp: new Date().toISOString()
    }
  ]
};

const response = await fetch('http://localhost:3001/api/track/batch-events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

### React
```jsx
import React from 'react';

const sendTrackingEvent = async () => {
  const payload = {
    type: "batch_events",
    sessionData: { /* ...datos de sesión... */ },
    events: [
      {
        eventType: "cta_click",
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
        eventData: { ctaId: "buy-now-button" }
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:3001/api/track/batch-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log('Tracking event sent:', result);
  } catch (error) {
    console.error('Error sending tracking event:', error);
  }
};

const MyComponent = () => (
  <button onClick={sendTrackingEvent}>Comprar Ahora</button>
);
```

### Vue.js
```javascript
export default {
  methods: {
    async sendTrackingEvent() {
      const payload = {
        type: "batch_events",
        sessionData: { /* ...datos de sesión... */ },
        events: [
          {
            eventType: "form_interaction",
            pageUrl: window.location.href,
            timestamp: new Date().toISOString(),
            eventData: { formId: "contact-form" }
          }
        ]
      };

      try {
        const response = await this.$axios.post('http://localhost:3001/api/track/batch-events', payload);
        console.log('Tracking event sent:', response.data);
      } catch (error) {
        console.error('Error sending tracking event:', error);
      }
    }
  }
};
```

---

## 📊 Rate Limiting

El framework implementa rate limiting para prevenir abuso:

- **Eventos individuales**: 100 requests por minuto por IP
- **Batch events**: 20 requests por minuto por IP
- **Leads**: 10 requests por minuto por IP

---

## 🔧 Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5433/tracking_crm

# Servidor
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Rate Limiting
RATE_LIMIT_EVENTS=100
RATE_LIMIT_BATCH=20
RATE_LIMIT_LEADS=10
```

---

## 📞 Soporte

Para soporte técnico o preguntas sobre la API:

- **Email**: info@innovamarketing.com
- **GitHub Issues**: [Reportar problema](https://github.com/innova-marketing/tracking-crm-framework/issues)
- **Documentación**: [Guías completas](./README.md)
