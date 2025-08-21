# @tracking-crm/client

Cliente JavaScript/TypeScript para el sistema de tracking CRM. Compatible con React, Vue, Angular, Next.js y HTML estático.

## 🚀 Instalación

```bash
npm install @tracking-crm/client
```

## 📖 Uso Básico

```typescript
import { createInnovaTracker } from '@tracking-crm/client';

const tracker = createInnovaTracker({
  baseUrl: 'http://localhost:3001',
  businessId: 'your-business-id',
  debug: true
});

// Inicializar
await tracker.init();

// Tracking de eventos
tracker.trackPageView('/home');
tracker.trackButtonClick('cta-button', 'Contactar');
tracker.trackConversion('lead_capture', { email: 'user@example.com' });
```

## 📚 Documentación Completa

Ver [FRONTEND-GUIDE.md](../docs/FRONTEND-GUIDE.md) para documentación completa, ejemplos por framework y guías de integración.

## 🐛 Issues y Soporte

[GitHub Issues](https://github.com/innova-marketing/tracking-crm-framework/issues)

## 📄 Licencia

MIT
