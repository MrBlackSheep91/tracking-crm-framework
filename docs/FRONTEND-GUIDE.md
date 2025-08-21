# 🎯 Frontend Integration Guide - Tracking CRM Framework

## 📦 Instalación del Cliente NPM

### Próximamente Disponible
```bash
npm install @tracking-crm/client
```

### Instalación Manual (Actual)
```bash
# Clonar el repositorio y usar el frontend
git clone https://github.com/innova-marketing/tracking-crm-framework.git
cd tracking-crm-framework/frontend

# Instalar dependencias
npm install

# Compilar el paquete
npm run build
```

## 🚀 Uso Básico

### 1. Inicialización Simple
```typescript
import { createInnovaTracker } from '@tracking-crm/client';

const tracker = createInnovaTracker({
  baseUrl: 'http://localhost:3001',
  businessId: '00000000-0000-0000-0000-000000000001',
  debug: true,
  autoStart: true
});
```

### 2. Configuración Avanzada
```typescript
const tracker = createInnovaTracker({
  baseUrl: 'https://tu-backend.com',
  businessId: 'tu-business-id',
  debug: false,
  autoStart: true,
  enableScrollTracking: true,
  enableActivityMonitoring: true,
  bufferSize: 10,
  flushInterval: 5000,
  endpoints: {
    event: '/api/v1/track/event',
    lead: '/api/leads',
    heartbeat: '/api/v1/track/heartbeat',
    sessionEnd: '/api/v1/track/session-end'
  }
});
```

## 📊 API del Cliente

### Métodos Principales
```typescript
// Tracking de una vista de página
tracker.trackPageView({ page: '/home', title: 'Página de Inicio' });

// Tracking de un evento personalizado (ej. clic en un CTA)
tracker.trackEvent('cta_click', {
  ctaId: 'hero-cta',
  ctaText: 'Comenzar Ahora',
  campaign: 'main'
});

// Captura de un lead
tracker.captureLead({
  formId: 'contact-form',
  email: 'user@example.com',
  name: 'Juan Pérez'
});
```

### Estado y Estadísticas
```typescript
// Obtener estadísticas
const stats = tracker.getStats();
console.log(stats);
// {
//   sessionId: 'uuid',
//   visitorId: 'uuid', 
//   eventsCount: 15,
//   sessionDuration: 300000,
//   isActive: true,
//   lastActivity: '2025-01-01T...'
// }

// Health check
const health = await tracker.healthCheck();
console.log(health);
// {
//   status: 'healthy',
//   timestamp: '...',
//   database: 'connected',
//   version: '2.0.0',
//   uptime: ...
// }
```

## 🔧 Integración por Framework

### React
```tsx
import React, { useEffect, useContext } from 'react';
import { createInnovaTracker } from '@tracking-crm/client';

// Context para el tracker
const TrackerContext = React.createContext(null);

export const TrackerProvider = ({ children }) => {
  const tracker = React.useMemo(() => createInnovaTracker({
    baseUrl: process.env.REACT_APP_TRACKING_URL,
    businessId: process.env.REACT_APP_BUSINESS_ID,
    debug: process.env.NODE_ENV === 'development'
  }), []);

  return (
    <TrackerContext.Provider value={tracker}>
      {children}
    </TrackerContext.Provider>
  );
};

// Hook personalizado
export const useTracking = () => {
  const tracker = useContext(TrackerContext);
  
  // Devuelve directamente el tracker para que los componentes usen sus métodos
  return tracker;
};

// Uso en componentes
const MyButton = () => {
  const tracker = useTracking();

  const handleClick = () => {
    tracker?.trackEvent('cta_click', { 
      ctaId: 'hero-cta',
      ctaText: 'Comenzar Ahora',
      position: 'hero-section' 
    });
    // Tu lógica aquí
  };

  return <button onClick={handleClick}>Comenzar Ahora</button>;
};
```

### Vue.js
```typescript
// plugins/tracking.js
import { createInnovaTracker } from '@tracking-crm/client';

export default {
  install(app, options) {
    const tracker = createInnovaTracker(options);
    
    app.config.globalProperties.$tracker = tracker;
    app.provide('tracker', tracker);
  }
};

// main.js
import { createApp } from 'vue';
import TrackingPlugin from './plugins/tracking.js';

const app = createApp(App);
app.use(TrackingPlugin, {
  baseUrl: 'http://localhost:3001',
  businessId: 'your-business-id'
});

// Uso en componentes
export default {
  inject: ['tracker'],
  methods: {
    handleClick() {
      this.tracker.trackEvent('cta_click', { ctaId: 'vue-button', ctaText: 'Click desde Vue' });
    }
  }
};
```

### Angular
```typescript
// tracking.service.ts
import { Injectable } from '@angular/core';
import { createInnovaTracker } from '@tracking-crm/client';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  public tracker = createInnovaTracker({
    baseUrl: environment.trackingUrl,
    businessId: environment.businessId
  });
  // La inicialización es automática, no se necesita el método init().
}

// app.component.ts
export class AppComponent {
  constructor(private tracking: TrackingService) {}

  onButtonClick() {
    this.tracking.tracker.trackEvent('cta_click', { ctaId: 'angular-button', ctaText: 'Click desde Angular' });
  }
}
```

### Next.js
```typescript
// _app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { createInnovaTracker } from '@tracking-crm/client';

let tracker = null;

// Instancia única del tracker
const tracker = createInnovaTracker({
  baseUrl: process.env.NEXT_PUBLIC_TRACKING_URL,
  businessId: process.env.NEXT_PUBLIC_BUSINESS_ID
});

export default function App({ Component, pageProps }: AppProps) {
  // El tracker ya está inicializado y disponible globalmente en este módulo.
  // Se puede pasar a través de props o un contexto si es necesario.
  return <Component {...pageProps} tracker={tracker} />;
}

// pages/index.tsx
// Recibimos el tracker como prop desde _app.tsx
export default function Home({ tracker }) {
  useEffect(() => {
    tracker?.trackPageView({ page: '/' });
  }, [tracker]);

  return <div>Mi página</div>;
}
```

### HTML Estático
```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Sitio Web</title>
</head>
<body>
  <!-- Tu contenido -->
  <button id="cta-button">Contactar</button>

  <script src="./tracking-crm-client.min.js"></script>
  <script>
    // Asumiendo que el script UMD expone 'InnovaTracker' en window
    const tracker = InnovaTracker.createInnovaTracker({
      baseUrl: 'http://localhost:3001',
      businessId: 'your-business-id',
      debug: true
    });
    // El tracking se inicia automáticamente.

    // Eventos manuales
    document.getElementById('cta-button').addEventListener('click', () => {
      tracker.trackEvent('cta_click', {
        ctaId: 'cta-button',
        ctaText: 'Contactar',
        page: 'home'
      });
    });
  </script>
</body>
</html>
```

## 🔍 Debugging y Desarrollo

### Activar Debug Mode
```typescript
const tracker = createInnovaTracker({
  debug: true,  // Activa logs detallados
  baseUrl: 'http://localhost:3001'
});

// Logs en consola:
// 🚀 [INNOVA TRACKER] Inicializado con configuración: {...}
// 📊 [SESSION] Nueva sesión iniciada: uuid
// 🎯 [EVENT] button_click enviado: {...}
```

### Inspeccionar Estado
```typescript
// Estado actual del tracker
console.log(tracker.getStats());

// Health check del backend
const health = await tracker.healthCheck();
console.log('Backend status:', health);

// Eventos en buffer
console.log('Eventos pendientes:', tracker.getPendingEvents());
```

### Variables de Entorno
```bash
# .env
REACT_APP_TRACKING_URL=http://localhost:3001
REACT_APP_BUSINESS_ID=00000000-0000-0000-0000-000000000001
REACT_APP_TRACKING_DEBUG=true
```

## ⚠️ Troubleshooting

### Problemas Comunes

1. **Tracker no inicializa**
```typescript
// Verificar que el backend esté funcionando
fetch('http://localhost:3001/health')
  .then(res => res.json())
  .then(data => console.log('Backend OK:', data))
  .catch(err => console.error('Backend ERROR:', err));
```

2. **Eventos no se envían**
```typescript
// Verificar configuración
console.log('Config:', tracker.getConfig());

// Forzar flush manual
tracker.flushEvents();

// Revisar logs de red en DevTools
```

3. **CORS Errors**
```bash
# Verificar CORS en el archivo .env del backend
CORS_ORIGINS="http://localhost:3000,https://midominio.com"
```

4. **BusinessId incorrecto**
```typescript
// Verificar que el businessId existe en la base de datos
// Usar Prisma Studio: http://localhost:5555
```

## 📈 Métricas y Analytics

### Datos Capturados Automáticamente
- **Sesiones**: Duración, páginas visitadas, dispositivo, geolocalización
- **Eventos**: Clics, scrolls, interacciones, tiempo en página
- **Comportamiento**: Engagement score, bounce rate, conversion funnel
- **UTM**: Campaigns, sources, mediums automáticamente detectados

### Acceso a Datos
```bash
# Prisma Studio - Interfaz visual
http://localhost:5555

# API directa
curl http://localhost:3001/api/metrics/summary

# Queries personalizadas (ver PAYLOAD-STRUCTURE.md)
```

## 🚀 Deployment

### Variables de Entorno de Producción
```bash
REACT_APP_TRACKING_URL=https://tracking.midominio.com
REACT_APP_BUSINESS_ID=tu-business-id-real
REACT_APP_TRACKING_DEBUG=false
```

### CDN Distribution (Próximamente)
```html
<script src="https://cdn.jsdelivr.net/npm/@tracking-crm/client@latest/dist/tracking-crm-client.min.js"></script>
```
