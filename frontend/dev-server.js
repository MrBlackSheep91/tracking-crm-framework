#!/usr/bin/env node

/**
 * 🚀 Servidor de desarrollo para Framework CRM Unificado
 * Sirve archivos estáticos con soporte para ES modules
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// CORS para permitir requests desde cualquier origen
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tracking-Client']
}));

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos con MIME types correctos
app.use('/src', express.static(path.join(__dirname, 'src'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/typescript');
    }
  }
}));

app.use('/test', express.static(path.join(__dirname, 'test')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Ruta principal - redirigir a test
app.get('/', (req, res) => {
  res.redirect('/test/index.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'frontend-dev-server',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Servidor de Desarrollo Frontend
┌─────────────────────────────────────────┐
│  Frontend Dev Server: http://localhost:${PORT}  │
│  Test Page: http://localhost:${PORT}/test/index.html │
│  Backend API: http://localhost:3001     │
│  Status: ✅ Ejecutándose               │
└─────────────────────────────────────────┘
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor de desarrollo...');
  process.exit(0);
});
