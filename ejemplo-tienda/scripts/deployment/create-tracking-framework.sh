#!/bin/bash

# 📦 SCRIPT DE EMPAQUETADO COMPLETO - SISTEMA TRACKING CRM REUTILIZABLE
# Autor: Sistema CRM NAT-PETS
# Función: Crear framework completo reutilizable para múltiples sitios

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Configuración
FRAMEWORK_NAME="tracking-crm-framework"
BASE_DIR="/root"
NAT_PETS_DIR="/root/prisma-project"
N8N_DIR="/root/N8n Workflow/CRM-MicroWorkflows-v2"
OUTPUT_DIR="/root/$FRAMEWORK_NAME"

# Función principal de empaquetado
create_framework() {
    print_header "🎯 CREANDO FRAMEWORK DE TRACKING CRM REUTILIZABLE"
    
    # 1. Crear estructura base
    print_info "Creando estructura de directorios..."
    mkdir -p "$OUTPUT_DIR"/{frontend/template,backend/template,n8n-workflows,database/schemas,config/templates,scripts/deployment,docs/guides,examples/implementations}
    
    # 2. Copiar sistema de tracking frontend
    print_info "Empaquetando sistema de tracking frontend..."
    if [ -d "$NAT_PETS_DIR/nat-pets/src/tracking" ]; then
        cp -r "$NAT_PETS_DIR/nat-pets/src/tracking" "$OUTPUT_DIR/frontend/template/src/"
        print_success "Sistema de tracking copiado"
    else
        print_warning "Directorio de tracking no encontrado, creando estructura base"
        mkdir -p "$OUTPUT_DIR/frontend/template/src/tracking"
    fi
    
    # 3. Copiar componentes reutilizables
    print_info "Empaquetando componentes frontend..."
    if [ -d "$NAT_PETS_DIR/nat-pets/src/components" ]; then
        cp -r "$NAT_PETS_DIR/nat-pets/src/components" "$OUTPUT_DIR/frontend/template/src/"
        print_success "Componentes frontend copiados"
    fi
    
    # 4. Copiar backend de integración
    print_info "Empaquetando backend de procesamiento..."
    if [ -f "$N8N_DIR/server-integration.ts" ]; then
        mkdir -p "$OUTPUT_DIR/backend/template/src"
        cp "$N8N_DIR/server-integration.ts" "$OUTPUT_DIR/backend/template/src/server.ts"
        print_success "Backend de integración copiado"
    else
        print_error "server-integration.ts no encontrado"
    fi
    
    # 5. Copiar workflows de n8n
    print_info "Empaquetando workflows de n8n..."
    mkdir -p "$OUTPUT_DIR/n8n-workflows/core-workflows"
    cp "$N8N_DIR"/*.json "$OUTPUT_DIR/n8n-workflows/core-workflows/" 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "Workflows de n8n copiados"
    else
        print_warning "Algunos workflows no se pudieron copiar"
    fi
    
    # 6. Copiar scripts de n8n
    print_info "Empaquetando scripts de n8n..."
    cp "$N8N_DIR"/*.sh "$OUTPUT_DIR/scripts/deployment/" 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "Scripts de n8n copiados"
    fi
    
    # 7. Copiar esquemas de base de datos
    print_info "Empaquetando esquemas de base de datos..."
    if [ -f "$NAT_PETS_DIR/prisma/schema.prisma" ]; then
        mkdir -p "$OUTPUT_DIR/database/schemas/prisma"
        cp "$NAT_PETS_DIR/prisma/schema.prisma" "$OUTPUT_DIR/database/schemas/prisma/schema.template.prisma"
        print_success "Esquema de base de datos copiado"
    fi
    
    # 8. Crear templates de configuración
    print_info "Creando templates de configuración..."
    
    # Template .env
    cat > "$OUTPUT_DIR/config/templates/.env.template" << 'EOF'
# 🔧 CONFIGURACIÓN DEL SISTEMA TRACKING CRM
# Personalizar para cada sitio web

# Información del sitio
SITE_NAME="SITE_NAME_PLACEHOLDER"
SITE_DOMAIN="DOMAIN_PLACEHOLDER"
SITE_URL="https://DOMAIN_PLACEHOLDER"

# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/SITE_NAME_PLACEHOLDER_crm"

# N8N Configuration
N8N_URL="http://localhost:5679"
N8N_API_KEY=""

# Backend Configuration
BACKEND_PORT=3001
BACKEND_URL="http://localhost:3001"

# Tracking Configuration
TRACKING_DEBUG=false
TRACKING_SESSION_TIMEOUT=1800
TRACKING_MAX_EVENTS=50

# Email Configuration (opcional)
EMAIL_PROVIDER=""
EMAIL_API_KEY=""

# Analytics (opcional)
GOOGLE_ANALYTICS_ID=""
FACEBOOK_PIXEL_ID=""
EOF
    
    # Template docker-compose
    cat > "$OUTPUT_DIR/config/templates/docker-compose.template.yml" << 'EOF'
version: '3.8'

services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: SITE_NAME_PLACEHOLDER-postgres
    environment:
      POSTGRES_DB: SITE_NAME_PLACEHOLDER_crm
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend de tracking
  backend:
    build: ./backend
    container_name: SITE_NAME_PLACEHOLDER-backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/SITE_NAME_PLACEHOLDER_crm
      - N8N_URL=http://n8n:5678
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Frontend web
  frontend:
    build: ./frontend
    container_name: SITE_NAME_PLACEHOLDER-frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

  # N8N para workflows
  n8n:
    image: n8nio/n8n:latest
    container_name: SITE_NAME_PLACEHOLDER-n8n
    ports:
      - "5679:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=SITE_NAME_PLACEHOLDER_crm
      - DB_POSTGRESDB_USER=postgres
      - DB_POSTGRESDB_PASSWORD=password
      - DB_POSTGRESDB_SCHEMA=n8n_workflow
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  n8n_data:
EOF
    
    # Template de configuración del sitio
    cat > "$OUTPUT_DIR/config/templates/site-config.template.json" << 'EOF'
{
  "site": {
    "name": "SITE_NAME_PLACEHOLDER",
    "domain": "DOMAIN_PLACEHOLDER",
    "logo": "/assets/logo.png",
    "description": "Descripción del sitio web"
  },
  "tracking": {
    "enableSmartEvents": true,
    "sessionTimeout": 1800,
    "maxEventsPerSession": 50,
    "debugMode": false,
    "enableConversionTracking": true
  },
  "crm": {
    "leadScoringRules": [
      { "event": "page_view", "score": 1 },
      { "event": "button_click", "score": 2 },
      { "event": "form_interaction", "score": 5 },
      { "event": "form_submit", "score": 10 },
      { "event": "conversion", "score": 20 }
    ],
    "autoEnrichment": true,
    "emailSequences": []
  },
  "integrations": {
    "n8nUrl": "http://localhost:5679",
    "webhookEndpoints": {
      "visitor": "/webhook/visitor-tracking",
      "lead": "/webhook/lead-processor",
      "conversion": "/webhook/conversion-detector"
    }
  }
}
EOF
    
    # 9. Crear script de setup para nuevos sitios
    print_info "Creando script de setup automático..."
    cat > "$OUTPUT_DIR/setup-new-site.sh" << 'EOF'
#!/bin/bash

# 🚀 SCRIPT DE SETUP PARA NUEVO SITIO
# Uso: ./setup-new-site.sh NOMBRE_SITIO DOMINIO

SITE_NAME=$1
DOMAIN=$2

if [ -z "$SITE_NAME" ] || [ -z "$DOMAIN" ]; then
    echo "❌ Uso: ./setup-new-site.sh NOMBRE_SITIO DOMINIO"
    echo "📋 Ejemplo: ./setup-new-site.sh mi-tienda mi-tienda.com"
    exit 1
fi

echo "🚀 Configurando nuevo sitio: $SITE_NAME ($DOMAIN)"

# Crear directorio del proyecto
mkdir -p "$SITE_NAME"
cd "$SITE_NAME"

# Copiar estructura del framework
cp -r ../frontend .
cp -r ../backend .
cp -r ../n8n-workflows .
cp -r ../database .
cp -r ../scripts .

# Personalizar configuración
cp ../config/templates/.env.template .env
cp ../config/templates/docker-compose.template.yml docker-compose.yml
cp ../config/templates/site-config.template.json config/site-config.json

# Reemplazar placeholders
sed -i "s/SITE_NAME_PLACEHOLDER/$SITE_NAME/g" .env docker-compose.yml config/site-config.json
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" .env docker-compose.yml config/site-config.json

echo "✅ Sitio $SITE_NAME configurado correctamente"
echo ""
echo "📋 Próximos pasos:"
echo "   1. cd $SITE_NAME"
echo "   2. Editar .env con configuración específica"
echo "   3. Personalizar config/site-config.json"
echo "   4. docker-compose up -d"
echo "   5. ./scripts/deployment/import-workflows.sh"
echo ""
echo "🎯 Tu sitio estará disponible en:"
echo "   Frontend: http://localhost:8080"
echo "   Backend: http://localhost:3001"
echo "   N8N: http://localhost:5679"
EOF
    chmod +x "$OUTPUT_DIR/setup-new-site.sh"
    
    # 10. Copiar documentación
    print_info "Empaquetando documentación..."
    cp "$N8N_DIR/SISTEMA-TRACKING-CRM-COMPLETO.md" "$OUTPUT_DIR/docs/guides/"
    cp "$N8N_DIR/GUIA-EMPAQUETADO-REUTILIZABLE.md" "$OUTPUT_DIR/docs/guides/"
    
    # 11. Crear README principal
    print_info "Creando README principal..."
    cat > "$OUTPUT_DIR/README.md" << 'EOF'
# 🎯 TRACKING CRM FRAMEWORK - SISTEMA REUTILIZABLE

## 🚀 INICIO RÁPIDO

### Crear un nuevo sitio web con tracking CRM completo:

```bash
# 1. Configurar nuevo sitio
./setup-new-site.sh mi-sitio mi-sitio.com

# 2. Entrar al directorio
cd mi-sitio

# 3. Personalizar configuración
nano .env
nano config/site-config.json

# 4. Levantar sistema
docker-compose up -d

# 5. Importar workflows
./scripts/deployment/import-workflows.sh
```

## 📁 ESTRUCTURA

- `frontend/` - Sistema de tracking inteligente y componentes web
- `backend/` - API de procesamiento y integración con n8n
- `n8n-workflows/` - 6 micro-workflows para CRM automatizado
- `database/` - Esquemas de base de datos optimizados
- `config/` - Templates de configuración
- `scripts/` - Scripts de deployment y testing
- `docs/` - Documentación completa

## 🎯 CARACTERÍSTICAS

✅ **Tracking Inteligente**: Solo eventos relevantes, no ruido
✅ **CRM Automatizado**: Lead scoring, enrichment, email sequences
✅ **Micro-workflows**: Modulares, testeable, escalables
✅ **Base de Datos Unificada**: PostgreSQL con esquemas optimizados
✅ **Docker Ready**: Deploy en minutos
✅ **Completamente Reutilizable**: Para cualquier tipo de sitio web

## 📚 DOCUMENTACIÓN

- [Guía Completa del Sistema](docs/guides/SISTEMA-TRACKING-CRM-COMPLETO.md)
- [Guía de Empaquetado](docs/guides/GUIA-EMPAQUETADO-REUTILIZABLE.md)

## 🆘 SOPORTE

Para soporte y preguntas, consulta la documentación o crea un issue.

---

**🎯 IMPLEMENTA UN CRM COMPLETO EN CUALQUIER SITIO WEB EN MENOS DE 30 MINUTOS**
EOF
    
    print_success "Framework empaquetado completamente"
    print_info "Ubicación: $OUTPUT_DIR"
    
    # Mostrar resumen
    print_header "📊 RESUMEN DEL EMPAQUETADO"
    echo -e "${GREEN}✅ Frontend Template:${NC} Sistema de tracking + componentes"
    echo -e "${GREEN}✅ Backend Template:${NC} API de procesamiento"
    echo -e "${GREEN}✅ N8N Workflows:${NC} $(ls "$OUTPUT_DIR/n8n-workflows/core-workflows"/*.json 2>/dev/null | wc -l) workflows empaquetados"
    echo -e "${GREEN}✅ Database Schemas:${NC} Esquemas PostgreSQL + Prisma"
    echo -e "${GREEN}✅ Configuration Templates:${NC} .env, docker-compose, site-config"
    echo -e "${GREEN}✅ Deployment Scripts:${NC} Setup automático + testing"
    echo -e "${GREEN}✅ Documentation:${NC} Guías completas"
    echo ""
    echo -e "${CYAN}🎯 FRAMEWORK LISTO PARA USAR${NC}"
    echo -e "${BLUE}📋 Para crear un nuevo sitio: cd $OUTPUT_DIR && ./setup-new-site.sh NOMBRE DOMINIO${NC}"
}

# Función para crear ejemplo de implementación
create_example() {
    local example_name=$1
    local example_domain=$2
    
    print_header "📝 CREANDO EJEMPLO: $example_name"
    
    cd "$OUTPUT_DIR"
    ./setup-new-site.sh "$example_name" "$example_domain"
    
    print_success "Ejemplo $example_name creado en: $OUTPUT_DIR/$example_name"
}

# Función principal
main() {
    case "$1" in
        "create")
            create_framework
            ;;
        "example")
            if [ $# -ne 3 ]; then
                print_error "Uso: $0 example NOMBRE DOMINIO"
                exit 1
            fi
            create_example "$2" "$3"
            ;;
        "help"|"-h"|"--help")
            echo "🎯 SCRIPT DE EMPAQUETADO - TRACKING CRM FRAMEWORK"
            echo ""
            echo "COMANDOS:"
            echo "  create                 Crear framework completo"
            echo "  example NOMBRE DOMINIO Crear ejemplo de implementación"
            echo "  help                   Mostrar esta ayuda"
            echo ""
            echo "EJEMPLOS:"
            echo "  ./create-tracking-framework.sh create"
            echo "  ./create-tracking-framework.sh example mi-tienda mi-tienda.com"
            ;;
        "")
            create_framework
            ;;
        *)
            print_error "Comando no reconocido: $1"
            echo "Usa: $0 help para ver comandos disponibles"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
