#!/usr/bin/env node

/**
 * Tracking CRM Framework - CLI de Inicialización
 * Script para configurar el framework en cualquier proyecto web
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TrackingCRMInit {
  constructor() {
    this.projectDir = process.cwd();
    this.frameworkDir = __dirname + '/../';
  }

  async init() {
    console.log('🚀 Inicializando Tracking CRM Framework...\n');
    
    try {
      await this.detectProject();
      await this.copyFiles();
      await this.generateConfig();
      await this.setupBackend();
      await this.generateExamples();
      await this.showInstructions();
      
      console.log('✅ ¡Tracking CRM Framework configurado exitosamente!');
    } catch (error) {
      console.error('❌ Error durante la inicialización:', error.message);
      process.exit(1);
    }
  }

  async detectProject() {
    console.log('🔍 Detectando tipo de proyecto...');
    
    const packageJsonPath = path.join(this.projectDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Detectar framework
      if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
        this.projectType = 'react';
        console.log('📦 Proyecto React detectado');
      } else if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
        this.projectType = 'vue';
        console.log('📦 Proyecto Vue detectado');
      } else if (packageJson.dependencies?.['@angular/core']) {
        this.projectType = 'angular';
        console.log('📦 Proyecto Angular detectado');
      } else {
        this.projectType = 'vanilla';
        console.log('📦 Proyecto JavaScript detectado');
      }
    } else {
      this.projectType = 'html';
      console.log('📦 Proyecto HTML estático detectado');
    }
  }

  async copyFiles() {
    console.log('📁 Copiando archivos del framework...');
    
    // Crear directorio tracking si no existe
    const trackingDir = path.join(this.projectDir, 'tracking-crm');
    if (!fs.existsSync(trackingDir)) {
      fs.mkdirSync(trackingDir, { recursive: true });
    }

    // Copiar cliente JavaScript
    const clientSrc = path.join(this.frameworkDir, 'client/index.js');
    const clientDest = path.join(trackingDir, 'client.js');
    fs.copyFileSync(clientSrc, clientDest);

    // Copiar tipos TypeScript si es proyecto TypeScript
    if (this.hasTypeScript()) {
      const typesSrc = path.join(this.frameworkDir, 'client/index.d.ts');
      const typesDest = path.join(trackingDir, 'client.d.ts');
      fs.copyFileSync(typesSrc, typesDest);
    }

    // Copiar Docker Compose para backend
    const dockerSrc = path.join(this.frameworkDir, 'docker-compose.template.yml');
    const dockerDest = path.join(trackingDir, 'docker-compose.yml');
    fs.copyFileSync(dockerSrc, dockerDest);

    // Copiar backend completo
    const backendSrc = path.join(this.frameworkDir, 'backend');
    const backendDest = path.join(trackingDir, 'backend');
    this.copyRecursive(backendSrc, backendDest);
  }

  async generateConfig() {
    console.log('⚙️ Generando configuración personalizada...');
    
    const envTemplate = fs.readFileSync(
      path.join(this.frameworkDir, '.env.template'), 
      'utf8'
    );
    
    // Generar valores únicos
    const businessId = this.generateUUID();
    const jwtSecret = this.generateSecret();
    const apiKey = this.generateSecret();
    
    let envConfig = envTemplate
      .replace('your_jwt_secret_key_here_change_me', jwtSecret)
      .replace('your_api_key_here_change_me', apiKey)
      .replace('00000000-0000-0000-0000-000000000001', businessId);
    
    // Detectar puerto del frontend
    const frontendPort = this.detectFrontendPort();
    if (frontendPort) {
      envConfig = envConfig.replace('http://localhost:3000', `http://localhost:${frontendPort}`);
    }
    
    fs.writeFileSync(path.join(this.projectDir, 'tracking-crm/.env'), envConfig);
    
    this.businessId = businessId;
    this.frontendPort = frontendPort || 3000;
  }

  async setupBackend() {
    console.log('🐳 Configurando backend con Docker...');
    
    const trackingDir = path.join(this.projectDir, 'tracking-crm');
    
    try {
      // Cambiar al directorio del tracking
      process.chdir(trackingDir);
      
      // Levantar servicios Docker
      console.log('📦 Levantando servicios Docker...');
      execSync('docker-compose up -d --build', { stdio: 'inherit' });
      
      // Esperar a que la base de datos esté lista
      console.log('⏳ Esperando que la base de datos esté lista...');
      await this.waitForService('localhost', 5433, 30);
      
      // Ejecutar migraciones Prisma
      console.log('🗄️ Configurando base de datos...');
      execSync('docker-compose exec -T tracking_backend npx prisma migrate deploy', { stdio: 'inherit' });
      
      // Volver al directorio original
      process.chdir(this.projectDir);
      
    } catch (error) {
      console.warn('⚠️ No se pudo configurar Docker automáticamente. Configúralo manualmente con:');
      console.warn('   cd tracking-crm && docker-compose up -d --build');
    }
  }

  async generateExamples() {
    console.log('📝 Generando ejemplos de integración...');
    
    const examplesDir = path.join(this.projectDir, 'tracking-crm/examples');
    if (!fs.existsSync(examplesDir)) {
      fs.mkdirSync(examplesDir, { recursive: true });
    }

    // Ejemplo para React
    if (this.projectType === 'react') {
      this.generateReactExample();
    }
    
    // Ejemplo para Vue
    if (this.projectType === 'vue') {
      this.generateVueExample();
    }
    
    // Ejemplo para HTML/Vanilla JS
    this.generateVanillaExample();
  }

  generateReactExample() {
    const reactExample = `
// tracking-crm/examples/react-integration.tsx
import React, { useEffect } from 'react';
import TrackingCRMClient from '../client.js';

// Inicializar cliente (hazlo una sola vez en tu App.tsx)
const trackingCRM = new TrackingCRMClient({
  baseUrl: 'http://localhost:3001',
  businessId: '${this.businessId}',
  debug: true
});

// Hook personalizado para tracking
export const useTracking = () => {
  useEffect(() => {
    // Auto-tracking de página
    trackingCRM.trackPageView({
      page: window.location.pathname
    });
  }, []);

  return {
    trackCTA: (ctaName: string) => trackingCRM.trackCTA({ cta: ctaName }),
    captureLead: (leadData: any) => trackingCRM.captureLead(leadData),
    trackCustomEvent: (eventType: string, data: any) => trackingCRM.trackEvent(eventType, data)
  };
};

// Componente de ejemplo
export const ExampleComponent: React.FC = () => {
  const { trackCTA, captureLead } = useTracking();

  const handleCTAClick = () => {
    trackCTA('hero-button');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    captureLead({
      email: 'usuario@ejemplo.com',
      name: 'Usuario Ejemplo',
      source: 'landing-page',
      formId: 'hero-form'
    });
  };

  return (
    <div>
      <button onClick={handleCTAClick}>
        ¡Haz clic aquí! (Tracked)
      </button>
      
      <form onSubmit={handleFormSubmit}>
        <input type="email" placeholder="Tu email" />
        <button type="submit">Enviar Lead</button>
      </form>
    </div>
  );
};
`;
    
    fs.writeFileSync(
      path.join(this.projectDir, 'tracking-crm/examples/react-integration.tsx'), 
      reactExample
    );
  }

  generateVanillaExample() {
    const vanillaExample = `
<!DOCTYPE html>
<html>
<head>
    <title>Tracking CRM - Ejemplo HTML</title>
</head>
<body>
    <h1>Mi Sitio Web</h1>
    
    <button id="cta-button">¡Haz clic aquí!</button>
    
    <form id="lead-form">
        <input type="email" id="email" placeholder="Tu email" required>
        <input type="text" id="name" placeholder="Tu nombre">
        <button type="submit">Enviar</button>
    </form>

    <!-- Cargar el cliente de tracking -->
    <script src="./client.js"></script>
    
    <script>
        // Inicializar cliente
        const trackingCRM = new TrackingCRMClient({
            baseUrl: 'http://localhost:3001',
            businessId: '${this.businessId}',
            debug: true
        });

        // Tracking automático de página
        trackingCRM.trackPageView({
            page: window.location.pathname,
            title: document.title
        });

        // Tracking de CTA
        document.getElementById('cta-button').addEventListener('click', function() {
            trackingCRM.trackCTA({
                cta: 'hero-button',
                location: 'homepage'
            });
        });

        // Captura de leads
        document.getElementById('lead-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const name = document.getElementById('name').value;
            
            trackingCRM.captureLead({
                email: email,
                name: name,
                source: 'website',
                formId: 'lead-form'
            }).then(response => {
                alert('¡Lead capturado exitosamente!');
                console.log('Lead guardado:', response);
            }).catch(error => {
                alert('Error capturando lead: ' + error.message);
            });
        });
    </script>
</body>
</html>
`;
    
    fs.writeFileSync(
      path.join(this.projectDir, 'tracking-crm/examples/vanilla-integration.html'), 
      vanillaExample
    );
  }

  async showInstructions() {
    console.log('\n📚 INSTRUCCIONES DE USO:');
    console.log('=' * 50);
    
    console.log(`
✅ Framework instalado en: tracking-crm/

🚀 SIGUIENTE PASO - Integrar en tu código:
${this.getIntegrationInstructions()}

🔧 CONFIGURACIÓN:
   • Backend API: http://localhost:3001
   • Frontend: http://localhost:${this.frontendPort}
   • Business ID: ${this.businessId}

📁 ARCHIVOS IMPORTANTES:
   • tracking-crm/client.js - Cliente JavaScript
   • tracking-crm/.env - Configuración
   • tracking-crm/examples/ - Ejemplos de integración

🐳 GESTIONAR BACKEND:
   cd tracking-crm
   docker-compose up -d     # Iniciar
   docker-compose down      # Detener
   docker-compose logs      # Ver logs

📖 DOCUMENTACIÓN COMPLETA:
   Ver tracking-crm/README.md

🆘 SOPORTE:
   GitHub: https://github.com/innova-marketing/tracking-crm-framework
   Email: info@innovamarketing.com
`);
  }

  getIntegrationInstructions() {
    switch (this.projectType) {
      case 'react':
        return `
   1. Copia tracking-crm/examples/react-integration.tsx a tu src/
   2. Importa useTracking en tus componentes
   3. Usa trackCTA(), captureLead(), etc.
`;
      case 'vue':
        return `
   1. Importa el cliente: import TrackingCRMClient from './tracking-crm/client.js'
   2. Inicializa en main.js o App.vue
   3. Usa los métodos de tracking en tus componentes
`;
      default:
        return `
   1. Abre tracking-crm/examples/vanilla-integration.html
   2. Copia el código a tu HTML
   3. Personaliza según tus necesidades
`;
    }
  }

  // Métodos auxiliares
  hasTypeScript() {
    return fs.existsSync(path.join(this.projectDir, 'tsconfig.json'));
  }

  detectFrontendPort() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectDir, 'package.json'), 'utf8'));
      
      // Detectar puerto en scripts comunes
      const scripts = packageJson.scripts || {};
      for (const [key, script] of Object.entries(scripts)) {
        const match = script.match(/port[\\s=]+(\d+)/i);
        if (match) return parseInt(match[1]);
      }
      
      // Puertos por defecto según framework
      if (packageJson.dependencies?.['next']) return 3000;
      if (packageJson.dependencies?.['nuxt']) return 3000;
      if (packageJson.dependencies?.['@angular/core']) return 4200;
      
      return 3000;
    } catch {
      return 3000;
    }
  }

  copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  generateSecret() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  async waitForService(host, port, timeout = 30) {
    const net = require('net');
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Timeout')), timeout * 1000);
      
      const tryConnect = () => {
        const socket = net.createConnection(port, host);
        socket.on('connect', () => {
          clearTimeout(timeoutId);
          socket.destroy();
          resolve();
        });
        socket.on('error', () => {
          setTimeout(tryConnect, 1000);
        });
      };
      
      tryConnect();
    });
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const init = new TrackingCRMInit();
  init.init().catch(console.error);
}

module.exports = TrackingCRMInit;
