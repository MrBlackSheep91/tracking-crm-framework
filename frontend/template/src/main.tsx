import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initTracker } from './services/sessionTracker';

// Inicializa el tracker con el ID del negocio. Esto debe hacerse una sola vez.
// Incluye tracking de sesión y tracking de botones/interacciones
// El ID '1' es el ID del negocio para el tracking
initTracker('00000000-0000-0000-0000-000000000001');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
