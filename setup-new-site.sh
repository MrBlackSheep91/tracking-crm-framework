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
cp -r ../config .
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
