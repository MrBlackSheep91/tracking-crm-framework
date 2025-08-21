#!/usr/bin/env node

/**
 * Script de instalación automática del CRM Tracking Framework
 * Uso: node install-framework.js [directorio-destino]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FrameworkInstaller {
  constructor() {
    this.sourceDir = __dirname;
    this.targetDir = process.argv[2] || process.cwd();
    this.frameworkName = '@innova-marketing/tracking-crm-framework';
  }

  async install() {
    console.log('🚀 Instalando CRM Tracking Framework...\n');
    
    try {
      // 1. Verificar directorio destino
      this.verifyTargetDirectory();
      
      // 2. Copiar archivos esenciales
      this.copyEssentialFiles();
      
      // 3. Instalar dependencias
      this.installDependencies();
      
      // 4. Configurar variables de entorno
      this.setupEnvironment();
      
      // 5. Crear archivos de ejemplo
      this.createExamples();
      
      // 6. Mostrar instrucciones finales
      this.showFinalInstructions();
      
      console.log('✅ ¡Framework instalado exitosamente!\n');
      
    } catch (error) {
      console.error('❌ Error durante la instalación:', error.message);
      process.exit(1);
    }
  }

  verifyTargetDirectory() {
    console.log(`📁 Verificando directorio: ${this.targetDir}`);
    
    if (!fs.existsSync(this.targetDir)) {
      fs.mkdirSync(this.targetDir, { recursive: true });
      console.log('✅ Directorio creado');
    } else {
      console.log('✅ Directorio existe');
    }
  }

  copyEssentialFiles() {
    console.log('\n📋 Copiando archivos esenciales...');
    
    const filesToCopy = [
      'client/index.js',
      'docker-compose.yml',
      'backend/template',
      '.env.example'
    ];

    filesToCopy.forEach(file => {
      const sourcePath = path.join(this.sourceDir, file);
      const targetPath = path.join(this.targetDir, 'tracking-framework', file);
      
      if (fs.existsSync(sourcePath)) {
        this.copyRecursive(sourcePath, targetPath);
        console.log(`✅ Copiado: ${file}`);
      }
    });
  }

  copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      fs.readdirSync(src).forEach(child => {
        this.copyRecursive(
          path.join(src, child),
          path.join(dest, child)
        );
      });
    } else {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
    }
  }

  installDependencies() {
    console.log('\n📦 Instalando dependencias...');
    
    const frameworkDir = path.join(this.targetDir, 'tracking-framework');
    
    try {
      process.chdir(frameworkDir);
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencias instaladas');
    } catch (error) {
      console.log('⚠️ Error instalando dependencias, continúa manualmente');
    }
  }

  setupEnvironment() {
    console.log('\n🔧 Configurando variables de entorno...');
    
    const envContent = `# CRM Tracking Framework - Variables de Entorno
DATABASE_URL="postgresql://tracking_user:tracking_pass@localhost:5433/tracking_crm"
PORT=3001
NODE_ENV=development
BUSINESS_ID=00000000-0000-0000-0000-000000000001

# Configuración opcional
DEBUG=true
CORS_ORIGIN=http://localhost:3000
`;

    const envPath = path.join(this.targetDir, 'tracking-framework', '.env');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado');
  }

  createExamples() {
    console.log('\n📝 Creando archivos de ejemplo...');
    
    // Ejemplo para React
    const reactExample = `import TrackingCRMClient from './tracking-framework/client/index.js';

// Inicializar tracking
const tracker = new TrackingCRMClient({
  baseUrl: 'http://localhost:3001',
  businessId: '00000000-0000-0000-0000-000000000001',
  debug: true
});

// Ejemplos de uso
export const trackingExamples = {
  // Tracking de evento personalizado
  trackButtonClick: (buttonText) => {
    tracker.trackEvent('button_click', {
      buttonText,
      category: 'engagement'
    });
  },

  // Tracking de vista de página
  trackPageView: (page) => {
    tracker.trackPageView({
      page,
      category: 'navigation'
    });
  },

  // Captura de lead
  captureLead: (leadData) => {
    tracker.captureLead({
      ...leadData,
      source: 'website_form'
    });
  }
};
`;

    // Ejemplo para HTML vanilla
    const htmlExample = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ejemplo CRM Tracking Framework</title>
</head>
<body>
    <h1>Mi Sitio Web</h1>
    <button id="cta-button">Contactar</button>
    
    <script src="./tracking-framework/client/index.js"></script>
    <script>
        // Inicializar tracking
        const tracker = new TrackingCRMClient({
            baseUrl: 'http://localhost:3001',
            businessId: '00000000-0000-0000-0000-000000000001',
            debug: true
        });

        // Tracking de clicks
        document.getElementById('cta-button').addEventListener('click', () => {
            tracker.trackCTA({
                ctaText: 'Contactar',
                position: 'main'
            });
        });
    </script>
</body>
</html>`;

    // Guardar ejemplos
    fs.writeFileSync(
      path.join(this.targetDir, 'tracking-react-example.js'),
      reactExample
    );
    
    fs.writeFileSync(
      path.join(this.targetDir, 'tracking-html-example.html'),
      htmlExample
    );

    console.log('✅ Ejemplos creados');
  }

  showFinalInstructions() {
    console.log(`
🎉 ¡INSTALACIÓN COMPLETADA!

📋 PRÓXIMOS PASOS:

1. 🐳 Levantar el backend:
   cd ${path.relative(process.cwd(), this.targetDir)}/tracking-framework
   docker-compose up -d

2. ✅ Verificar que funciona:
   curl http://localhost:3001/api/health

3. 🔧 Integrar en tu web:
   - React: Ver tracking-react-example.js
   - HTML: Ver tracking-html-example.html

4. 📊 Personalizar eventos según tu negocio

5. 🚀 ¡Empezar a trackear!

📚 DOCUMENTACIÓN:
- Guía completa: tracking-framework/INSTALACION-Y-USO.md
- Arquitectura: tracking-framework/ARCHITECTURE.md

🆘 SOPORTE:
- GitHub: https://github.com/innova-marketing/tracking-crm-framework
- Documentación: tracking-framework/docs/

¡Listo para usar en cualquier nueva web que hagas! 🚀
`);
  }
}

// Ejecutar instalación
if (require.main === module) {
  const installer = new FrameworkInstaller();
  installer.install();
}

module.exports = FrameworkInstaller;
