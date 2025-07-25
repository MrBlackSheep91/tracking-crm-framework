#!/bin/bash

# 🚀 SCRIPT DE IMPORTACIÓN DE MICRO-WORKFLOWS A N8N
# Este script importa los 6 micro-workflows del sistema NAT-PETS CRM

echo "🔄 Iniciando importación de micro-workflows a n8n..."
echo "📍 N8n URL: http://localhost:5679"
echo ""

# Array con los workflows a importar
workflows=(
    "01-VISITOR-PROCESSOR"
    "02-CONVERSION-DETECTOR" 
    "03-LEAD-PROCESSOR"
    "04-ACTIVITY-LOGGER"
    "05-ENRICHMENT-ENGINE"
    "06-EMAIL-ORCHESTRATOR"
)

# Función para importar un workflow
import_workflow() {
    local workflow_name=$1
    local file_path="/root/N8n Workflow/CRM-MicroWorkflows-v2/${workflow_name}.json"
    
    echo "📦 Importando ${workflow_name}..."
    
    if [ ! -f "$file_path" ]; then
        echo "❌ Error: Archivo no encontrado: $file_path"
        return 1
    fi
    
    # Importar workflow via API de n8n
    response=$(curl -s -X POST \
        "http://localhost:5679/rest/workflows/import" \
        -H "Content-Type: application/json" \
        -d @"$file_path" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "✅ ${workflow_name} importado correctamente"
        return 0
    else
        echo "❌ Error importando ${workflow_name}"
        return 1
    fi
}

# Función para activar un workflow
activate_workflow() {
    local workflow_id=$1
    local workflow_name=$2
    
    echo "🔄 Activando workflow ${workflow_name} (ID: ${workflow_id})..."
    
    response=$(curl -s -X POST \
        "http://localhost:5679/rest/workflows/${workflow_id}/activate" \
        -H "Content-Type: application/json" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "✅ ${workflow_name} activado correctamente"
        return 0
    else
        echo "❌ Error activando ${workflow_name}"
        return 1
    fi
}

# Contadores
total_workflows=${#workflows[@]}
imported_count=0
failed_count=0

echo "📊 Workflows a importar: $total_workflows"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Importar cada workflow
for workflow in "${workflows[@]}"; do
    if import_workflow "$workflow"; then
        ((imported_count++))
    else
        ((failed_count++))
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 RESUMEN DE IMPORTACIÓN:"
echo "✅ Workflows importados: $imported_count"
echo "❌ Workflows fallidos: $failed_count"
echo "📊 Total procesados: $total_workflows"

if [ $failed_count -eq 0 ]; then
    echo ""
    echo "🎉 ¡Todos los workflows fueron importados exitosamente!"
    echo "🔄 Verificando estado de los workflows..."
    
    # Listar workflows importados
    curl -s "http://localhost:5679/rest/workflows" | jq -r '.data[] | "- \(.name) (ID: \(.id)) - Active: \(.active)"' 2>/dev/null || echo "Workflows importados. Verificar en la interfaz de n8n."
    
    echo ""
    echo "🎯 PRÓXIMOS PASOS:"
    echo "1. Acceder a http://localhost:5679 para verificar los workflows"
    echo "2. Activar los webhooks si no están activos"
    echo "3. Ejecutar la suite de testing: ./run-workflow-tests.sh"
    
else
    echo ""
    echo "⚠️  Algunos workflows fallaron en la importación."
    echo "📋 Revisar los archivos JSON y la configuración de n8n."
fi

echo ""
echo "🔗 Para testing manual, usar los comandos de TESTING-SUITE.md"
echo "🏁 Importación completada."
