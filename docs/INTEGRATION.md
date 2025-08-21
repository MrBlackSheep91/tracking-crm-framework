# 🚀 Guía de Integración - InnovaTracker

Esta guía te mostrará cómo integrar el cliente de tracking **InnovaTracker** en tu aplicación web. Para detalles sobre los métodos de la API, consulta la [Documentación de la API](./API.md).

## ⚡ Inicio Rápido

La forma recomendada de integrar InnovaTracker es a través de `npm` o `yarn`.

### 1. Instalación

```bash
npm install @innova-marketing/tracking-crm-framework
# O con yarn
yarn add @innova-marketing/tracking-crm-framework
```

### 2. Inicialización

Importa la factory `createInnovaTracker` y crea una instancia. Esto debe hacerse una sola vez en tu aplicación.

```javascript
import { createInnovaTracker } from '@innova-marketing/tracking-crm-framework';

const tracker = createInnovaTracker({
  businessId: 'TU_BUSINESS_ID',      // Requerido: El ID de tu negocio
  baseUrl: 'http://localhost:3001', // Requerido: La URL de tu backend de tracking
  debug: true,                      // Opcional: Activa logs para depuración
});

// ¡Listo! El tracking de sesión y la primera page view se inician automáticamente.
```

---

## 🎯 Ejemplos por Tecnología

### 📄 JavaScript (Vanilla)

Para sitios web estáticos, puedes usar un bundler como Webpack o Vite para manejar los módulos, o usar la versión UMD si está disponible.

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi Sitio Web</title>
</head>
<body>
    <h1>¡Bienvenido!</h1>
    <button id="contact-button">Contactar</button>

    <!-- Tu script de aplicación (ej. main.js) -->
    <script src="./main.js" type="module"></script>
</body>
</html>
```

```javascript
// main.js
import { createInnovaTracker } from '@innova-marketing/tracking-crm-framework';

const tracker = createInnovaTracker({
    businessId: 'TU_BUSINESS_ID',
    baseUrl: 'http://localhost:3001',
});

document.getElementById('contact-button').addEventListener('click', () => {
    tracker.trackCTA({ ctaId: 'contact-button', ctaText: 'Contactar' });
    alert('¡Gracias por contactarnos!');
});
```

### ⚛️ React

La mejor práctica en React es inicializar el tracker en un contexto para que esté disponible en toda la aplicación.

**`src/contexts/TrackingProvider.js`**
```jsx
import React, { createContext, useContext } from 'react';
import { createInnovaTracker } from '@innova-marketing/tracking-crm-framework';

const TrackingContext = createContext(null);

// Hook personalizado para acceder al tracker
export const useTracker = () => useContext(TrackingContext);

// Proveedor del contexto
export const TrackingProvider = ({ children }) => {
    const tracker = createInnovaTracker({
        businessId: process.env.REACT_APP_BUSINESS_ID,
        baseUrl: process.env.REACT_APP_TRACKING_URL,
        debug: process.env.NODE_ENV === 'development',
    });

    return (
        <TrackingContext.Provider value={tracker}>
            {children}
        </TrackingContext.Provider>
    );
};
```

**`src/index.js` (o `src/App.js`)**
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { TrackingProvider } from './contexts/TrackingProvider';

ReactDOM.render(
    <React.StrictMode>
        <TrackingProvider>
            <App />
        </TrackingProvider>
    </React.StrictMode>,
    document.getElementById('root')
);
```

**Uso en un componente:**
```jsx
import { useTracker } from '../contexts/TrackingProvider';

const MyComponent = () => {
    const tracker = useTracker();

    const handlePurchase = () => {
        tracker.captureLead({ 
            formId: 'purchase-form', 
            product: 'Producto Estrella' 
        });
    };

    return <button onClick={handlePurchase}>Comprar</button>;
};
```

### 🌟 Vue.js

En Vue 3, puedes usar el sistema de `provide`/`inject` para un resultado similar al contexto de React.

**`src/main.js`**
```javascript
import { createApp } from 'vue';
import App from './App.vue';
import { createInnovaTracker } from '@innova-marketing/tracking-crm-framework';

// Crea la instancia del tracker
const tracker = createInnovaTracker({
    businessId: import.meta.env.VITE_BUSINESS_ID,
    baseUrl: import.meta.env.VITE_TRACKING_URL,
    debug: import.meta.env.DEV,
});

const app = createApp(App);

// Provee la instancia a toda la aplicación
app.provide('tracker', tracker);

app.mount('#app');
```

**Uso en un componente:**
```vue
<template>
  <button @click="handleCTA">¡Haz clic!</button>
</template>

<script setup>
import { inject } from 'vue';

// Inyecta la instancia del tracker
const tracker = inject('tracker');

const handleCTA = () => {
  if (tracker) {
    tracker.trackCTA({ ctaId: 'vue-cta', ctaText: '¡Haz clic!' });
  }
};
</script>
```

---

## 🔧 Configuración Avanzada

La función `createInnovaTracker` acepta un segundo argumento opcional para configuración avanzada.

```javascript
const tracker = createInnovaTracker(
  { /* Configuración básica */ },
  {
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
    batchSize: 15,                   // Enviar eventos en lotes de 15
    flushInterval: 10000,            // Enviar lotes cada 10 segundos
  }
);
```

---

## 🆘 Troubleshooting

-   **Error de CORS**: Asegúrate de que el dominio de tu frontend esté incluido en la variable `CORS_ORIGINS` del backend.
-   **Eventos no llegan**: Activa el modo `debug: true` durante la inicialización para ver los logs en la consola del navegador. Verifica que la `baseUrl` sea correcta y que el backend esté funcionando.
-   **`businessId` no definido**: Asegúrate de que la variable de entorno que contiene el ID de tu negocio esté disponible en el frontend (ej. prefijo `REACT_APP_` en React o `VITE_` en Vue).
