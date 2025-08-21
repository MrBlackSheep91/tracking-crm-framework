# 📦 Estructura de Payloads - Tracking CRM Framework

## 🎯 Payload Principal de Eventos (Batch)

### Endpoint: `POST /api/v1/track/event`

```json
{
  "body": {
    "session": {
      "sessionId": "uuid-v4",
      "visitorId": "uuid-v4",
      "businessId": "uuid-v4-del-negocio",
      "fingerprint": "string-unico-del-dispositivo",
      "startedAt": "2025-01-01T00:00:00.000Z",
      "deviceInfo": {
        "type": "desktop",
        "os": "Windows",
        "browser": "Chrome",
        "screenResolution": "1920x1080",
        "userAgent": "Mozilla/5.0...",
        "language": "es-ES"
      },
      "ipLocation": {
        "country": "Uruguay",
        "city": "Montevideo"
      },
      "pageInfo": {
        "url": "https://example.com/page",
        "title": "Page Title",
        "referrer": "https://google.com"
      }
    },
    "events": [
      {
        "eventType": "page_view",
        "timestamp": "2025-01-01T00:00:00.000Z",
        "metadata": {
          "page": "/home",
          "title": "Página de Inicio"
        }
      },
      {
        "eventType": "cta_click",
        "timestamp": "2025-01-01T00:00:05.000Z",
        "metadata": {
          "elementId": "hero-button",
          "text": "Comprar Ahora"
        }
      }
    ]
  }
}
```

## 🔄 Respuesta del Servidor

```json
{
  "success": true,
  "message": "✅ [TRACKING API] 2 eventos procesados",
  "processed": 2
}
```

## 📋 Tipos de Eventos Soportados

### 1. **Eventos de Sesión**
```json
{
  "eventType": "session_start|session_end",
  "eventData": {
    "startedAt": "2025-01-01T00:00:00.000Z",
    "source": "google",
    "campaign": "restaurantes"
  }
}
```

### 2. **Eventos de Interacción**
```json
{
  "eventType": "interaction", 
  "eventName": "button_click|form_interaction|scroll",
  "eventData": {
    "element": "button-cta",
    "buttonText": "Contactar Ahora",
    "scrollPercentage": 75
  }
}
```

### 3. **Eventos de Conversión**
```json
{
  "eventType": "conversion",
  "eventName": "lead_capture|purchase|signup",
  "eventData": {
    "email": "usuario@ejemplo.com", 
    "name": "Juan Pérez",
    "phone": "+59899999999",
    "leadType": "contact_form",
    "value": 1500
  }
}
```

### 4. **Eventos Personalizados**
```json
{
  "eventType": "custom",
  "eventName": "video_play|download|share",
  "eventData": {
    "videoId": "intro-video",
    "duration": 120,
    "completionRate": 85
  }
}
```

## 🏢 Estructura de Business

```json
{
  "id": 1,
  "name": "Mi Negocio",
  "domain": "ejemplo.com",
  "industry": "restaurante",
  "timezone": "America/Montevideo",
  "settings": {
    "trackingEnabled": true,
    "leadAutoCapture": true
  }
}
```

## 👤 Estructura de Visitor

```json
{
  "id": "uuid-interno",
  "visitorId": "uuid-v4",
  "businessId": 1,
  "fingerprint": "fp_unique_device",
  "deviceInfo": { /* objeto deviceInfo */ },
  "location": { /* objeto ipLocation */ },
  "behavior": {
    "sessionsCount": 3,
    "totalTimeOnSite": 900000,
    "pageViews": 15,
    "engagementScore": 82
  },
  "utm": {
    "source": "google",
    "medium": "cpc", 
    "campaign": "restaurantes",
    "content": "landing-principal"
  }
}
```

## 🎯 Estructura de Session

```json
{
  "id": "uuid-interno",
  "sessionId": "uuid-v4",
  "visitorId": "uuid-interno",
  "startedAt": "2025-01-01T00:00:00.000Z",
  "endedAt": "2025-01-01T00:15:00.000Z",
  "duration": 900000,
  "pageViews": 5,
  "events": [ /* array de eventos */ ],
  "convertedAt": "2025-01-01T00:10:00.000Z"
}
```

## 📊 Estructura de Lead

```json
{
  "id": "uuid-interno",
  "visitorId": "uuid-interno", 
  "sessionId": "uuid-interno",
  "businessId": 1,
  "email": "lead@ejemplo.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+59899999999",
  "source": "contact_form",
  "score": 85,
  "convertedAt": "2025-01-01T00:10:00.000Z",
  "metadata": {
    "campaign": "restaurantes",
    "pageUrl": "https://ejemplo.com/contacto"
  }
}
```

## 🔧 Validaciones Requeridas

### Campos Obligatorios (objeto `session`):
- `sessionId` (UUID v4)
- `visitorId` (UUID v4)  
- `businessId` (UUID v4)

### Campos Obligatorios (cada objeto en `events`):
- `eventType` (string)
- `timestamp` (ISO 8601)

### Campos Opcionales pero Recomendados:
- `fingerprint` (identificación única del dispositivo)
- `deviceInfo` (información del navegador/dispositivo)
- `ipLocation` (geolocalización)
- `pageInfo` (información de la página)
- `eventData` (datos específicos del evento)

## ⚠️ Errores Comunes

### 400 Bad Request
```json
{
  "success": false,
  "message": "Payload de lote de eventos inválido",
  "errors": [
    {
      "message": "\"sessionId\" is required",
      "path": ["sessionData", "sessionId"]
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "success": false, 
  "message": "Error interno del servidor",
  "error": "Database connection failed"
}
```

## 🚀 Ejemplos de Uso

### Tracking Básico de Página
```javascript
const payload = {
  body: {
    session: {
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      visitorId: "987fcdeb-51a2-43d7-8f9e-123456789abc", 
      businessId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      fingerprint: "fp_user_device_001"
      // ... otros datos de deviceInfo, pageInfo, etc.
    },
    events: [{
      eventType: "page_view",
      timestamp: new Date().toISOString(),
      metadata: {
        page: "/home",
        title: "Inicio - Mi Sitio"
      }
    }]
  }
};
```

### Captura de Lead
```javascript
const conversionPayload = {
  sessionData: { /* datos de sesión */ },
  events: [{
    eventType: "conversion",
    eventName: "lead_capture", 
    timestamp: new Date().toISOString(),
    businessId: 1,
    visitorId: "uuid-visitor",
    sessionId: "uuid-session",
    eventData: {
      email: "prospecto@email.com",
      name: "María García",
      phone: "+59891234567",
      leadType: "contact_form",
      source: "landing_page"
    }
  }]
};
```
