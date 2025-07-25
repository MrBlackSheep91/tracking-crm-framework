# 🎯 TRACKING CRM FRAMEWORK - SISTEMA REUTILIZABLE Y "WHITE-LABEL"

Este framework proporciona una solución completa para la integración de un sistema de tracking y CRM, diseñado con la máxima modularidad y reusabilidad en mente. Permite la creación rápida de sitios web con funcionalidades de tracking avanzadas, fácilmente adaptables a cualquier marca o necesidad.

## 🚀 INICIO RÁPIDO

Para comenzar a utilizar el framework:

1.  **Clona el repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd tracking-crm-framework
    ```

2.  **Configura un nuevo sitio (opcional, para un ejemplo completo):**
    Si deseas levantar un ejemplo completo del framework (frontend, backend, base de datos, n8n), utiliza el script de configuración:
    ```bash
    ./setup-new-site.sh mi-nuevo-sitio mi-nuevo-sitio.com
    cd mi-nuevo-sitio
    # Edita .env y config/site-config.json según tus necesidades
    docker-compose up -d
    ./scripts/deployment/import-workflows.sh
    ```

## 🧩 MODULARIDAD Y REUTILIZACIÓN ("WHITE-LABEL")

El corazón de este framework es su diseño modular, que permite la reutilización de componentes y servicios en cualquier proyecto frontend/backend. Hemos separado las funcionalidades en:

### 1. Módulos Reutilizables (Conceptuales)

Los componentes y servicios clave del framework están organizados para ser fácilmente integrables en tus propios proyectos, simulando paquetes NPM:

*   **`reusable-modules/core`**: Contiene la lógica central de tracking, servicios de API, y componentes UI específicos de tracking (ej. `ConsentBanner`, `TrackingDebugger`). Estos módulos son la base para interactuar con el backend del CRM.
    *   **Uso en tu Frontend:** Importa los servicios y componentes directamente desde esta carpeta en tu proyecto. Por ejemplo:
        ```javascript
        import { trackEvent } from 'path/to/reusable-modules/core/services/trackingService';
        import { LeadForm } from 'path/to/reusable-modules/core/components/LeadForm';
        ```

*   **`reusable-modules/ui-components`**: Contiene componentes de interfaz de usuario genéricos y altamente configurables (ej. `Hero`, `Testimonials`, `Header`, `Footer`). Estos están diseñados para ser "white-label" y adaptarse a la identidad visual de cualquier marca.
    *   **Uso en tu Frontend:** Importa los componentes y aliméntalos con datos de tu `site-config.json`.
        ```javascript
        import { Hero, Testimonials } from 'path/to/reusable-modules/ui-components';
        // ... usa los componentes con props de tu configuración
        ```

### 2. Configuración Centralizada del Sitio (`site-config.json`)

Para una personalización sencilla y un enfoque "white-label", cada sitio utiliza un archivo `site-config.json`. Este archivo es la fuente única de verdad para el contenido, las características y la configuración específica del tracking.

*   **Ubicación de la Plantilla:** Puedes encontrar una plantilla en `config/templates/site-config.json.template`.
*   **Contenido:** Define textos para secciones como "Hero" y "Testimonios", enlaces, imágenes, y configuraciones de tracking como la URL del backend y el ID de Google Analytics.
*   **Integración:** Tu aplicación frontend debe cargar este `site-config.json` al inicio y pasar los datos relevantes como `props` a los componentes UI o utilizarlos para inicializar los servicios de tracking.

## 📁 ESTRUCTURA DEL PROYECTO

-   `backend/` - API de procesamiento y integración con n8n
-   `config/` - Templates de configuración (`.env.template`, `docker-compose.template.yml`, `site-config.json.template`)
-   `database/` - Esquemas de base de datos optimizados
-   `docs/` - Documentación completa (Guías de Integración, Despliegue, etc.)
-   `ejemplo-tienda/` - Un ejemplo completo de aplicación que utiliza el framework
-   `frontend/` - (Antigua estructura NAT-PETS, ahora los componentes clave están en `reusable-modules`)
-   `n8n-workflows/` - Micro-workflows para CRM automatizado
-   `reusable-modules/` - **Nuevos módulos "white-label" para frontend (core y UI components)**
-   `scripts/` - Scripts de deployment y testing
-   `setup-new-site.sh` - Script para configurar rápidamente un nuevo sitio basado en el framework

## 🎯 CARACTERÍSTICAS PRINCIPALES

✅ **Modular y "White-Label"**: Componentes y servicios reutilizables para cualquier marca.
✅ **Tracking Inteligente**: Captura solo eventos relevantes, sin ruido.
✅ **CRM Automatizado**: Integración con n8n para lead scoring, enrichment y secuencias de email.
✅ **Micro-workflows**: Modulares, testeables y escalables.
✅ **Base de Datos Unificada**: PostgreSQL con esquemas optimizados.
✅ **Docker Ready**: Despliegue rápido y consistente.
✅ **Documentación Completa**: Guías detalladas para cada aspecto del framework.

## 📚 DOCUMENTACIÓN DETALLADA

-   [Guía Completa del Sistema](docs/guides/SISTEMA-TRACKING-CRM-COMPLETO.md)
-   [Guía de Empaquetado](docs/guides/GUIA-EMPAQUETADO-REUTILIZABLE.md)
-   [Guía de Integración de API](docs/guides/API-INTEGRATION-GUIDE.md)
-   [Guía de Integración Frontend](docs/guides/FRONTEND-INTEGRATION-GUIDE.md)
-   [Guía de Despliegue de Workflows n8n](docs/guides/N8N-DEPLOYMENT-GUIDE.md)

## 🆘 SOPORTE

Para soporte y preguntas, consulta la documentación o crea un issue en el repositorio.

---

**🎯 IMPLEMENTA UN CRM COMPLETO EN CUALQUIER SITIO WEB EN MINUTOS**
