#!/bin/bash

# 🎯 N8N NODE TESTER - Herramienta completa para testing de workflows y nodos
# Autor: Sistema CRM NAT-PETS
# Función: Testing individual de nodos, payloads, errores y salidas

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
N8N_URL="http://localhost:5679"
API_ENDPOINT="$N8N_URL/rest"
WEBHOOK_BASE="$N8N_URL/webhook"

# Funciones de utilidad
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

# Función para verificar estado de n8n
check_n8n_status() {
    print_header "VERIFICANDO ESTADO DE N8N"
    
    if curl -s "$N8N_URL" > /dev/null; then
        print_success "n8n está accesible en $N8N_URL"
    else
        print_error "n8n no está accesible"
        exit 1
    fi
}

# Función para listar workflows
list_workflows() {
    print_header "WORKFLOWS DISPONIBLES"
    response=$(curl -s "$API_ENDPOINT/workflows")
    
    if echo "$response" | grep -q '"status":"error"'; then
        print_warning "API requiere autenticación. Mostrando workflows desde archivos:"
        echo ""
        ls -1 *.json | grep -E "^[0-9]+-" | sed 's/\.json$//' | nl
    else
        echo "$response" | jq -r '.data[] | "\(.id) - \(.name) - Active: \(.active)"' 2>/dev/null || print_error "Error procesando respuesta"
    fi
}

# Función para ejecutar test de nodo específico
test_node() {
    local workflow_file="$1"
    local payload_file="$2"
    
    if [ ! -f "$workflow_file" ]; then
        print_error "Archivo de workflow no encontrado: $workflow_file"
        return 1
    fi
    
    if [ ! -f "$payload_file" ]; then
        print_error "Archivo de payload no encontrado: $payload_file"
        return 1
    fi
    
    print_header "TESTING NODO: $workflow_file"
    print_info "Payload: $payload_file"
    
    # Obtener nombre del workflow
    workflow_name=$(basename "$workflow_file" .json)
    print_info "Ejecutando: $workflow_name"
    
    # Enviar payload al webhook correspondiente
    webhook_url="$WEBHOOK_BASE/$(echo "$workflow_name" | tr '[:upper:]' '[:lower:]' | sed 's/-/_/g')"
    print_info "Webhook URL: $webhook_url"
    
    response=$(curl -s -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "@$payload_file" \
        -w "%{http_code}" -o /tmp/n8n_response.txt)
    
    http_code=$(tail -n1 <<< "$response")
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Ejecución exitosa (HTTP $http_code)"
        echo ""
        cat /tmp/n8n_response.txt | jq '.' 2>/dev/null || cat /tmp/n8n_response.txt
    elif [ "$http_code" -eq 404 ]; then
        print_error "Webhook no encontrado (HTTP $http_code) - Workflow no activo"
        print_info "Solución: Activar el workflow en la interfaz de n8n"
    else
        print_error "Error en ejecución (HTTP $http_code)"
        echo ""
        cat /tmp/n8n_response.txt | jq '.' 2>/dev/null || cat /tmp/n8n_response.txt
    fi
    
    echo ""
}

# Función para crear payload de prueba
create_test_payload() {
    local type="$1"
    local output_file="$2"
    
    case "$type" in
        "visitor")
            cat > "$output_file" << 'EOF'
{
  "session": {
    "sessionId": "test-session-001",
    "userId": "user-123",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "timestamp": "2025-07-25T10:30:00Z",
    "url": "https://example.com/product-page"
  },
  "events": [
    {
      "type": "page_view",
      "url": "https://example.com/product-page",
      "timestamp": "2025-07-25T10:30:00Z"
    },
    {
      "type": "click",
      "element": "add-to-cart-button",
      "timestamp": "2025-07-25T10:30:15Z"
    }
  ]
}
EOF
            ;;
        "lead")
            cat > "$output_file" << 'EOF'
{
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "phone": "+1234567890",
  "company": "Empresa Ejemplo S.A.",
  "message": "Estoy interesado en sus productos",
  "source": "website-form",
  "timestamp": "2025-07-25T10:45:00Z"
}
EOF
            ;;
        "conversion")
            cat > "$output_file" << 'EOF'
{
  "conversionType": "purchase",
  "value": 299.99,
  "currency": "USD",
  "sessionId": "test-session-001",
  "timestamp": "2025-07-25T10:45:00Z",
  "products": [
    {
      "id": "prod-001",
      "name": "Producto Premium",
      "price": 299.99,
      "quantity": 1
    }
  ]
}
EOF
            ;;
        *)
            print_error "Tipo de payload no válido: $type"
            print_info "Tipos disponibles: visitor, lead, conversion"
            return 1
            ;;
    esac
    
    print_success "Payload de prueba creado: $output_file"
}

# Función para mostrar ayuda
show_help() {
    echo "🎯 N8N NODE TESTER - Herramienta de testing para workflows"
    echo ""
    echo "USO:"
    echo "  ./n8n-node-tester.sh [COMANDO] [OPCIONES]"
    echo ""
    echo "COMANDOS:"
    echo "  list                   Listar workflows disponibles"
    echo "  test WORKFLOW PAYLOAD  Testear un workflow con payload específico"
    echo "  create-payload TYPE    Crear payload de prueba (visitor|lead|conversion)"
    echo "  status                 Verificar estado de n8n"
    echo "  help                   Mostrar esta ayuda"
    echo ""
    echo "EJEMPLOS:"
    echo "  ./n8n-node-tester.sh list"
    echo "  ./n8n-node-tester.sh test 01-VISITOR-PROCESSOR.json visitor-payload.json"
    echo "  ./n8n-node-tester.sh create-payload visitor"
    echo ""
    echo "NOTAS:"
    echo "  - Los workflows deben estar ACTIVOS en n8n para funcionar"
    echo "  - Los payloads deben ser archivos JSON válidos"
    echo "  - La herramienta requiere curl y jq instalados"
}

# Función principal
main() {
    case "$1" in
        "list")
            check_n8n_status
            list_workflows
            ;;
        "test")
            if [ $# -ne 3 ]; then
                print_error "Uso: $0 test WORKFLOW_FILE PAYLOAD_FILE"
                exit 1
            fi
            check_n8n_status
            test_node "$2" "$3"
            ;;
        "create-payload")
            if [ $# -ne 2 ]; then
                print_error "Uso: $0 create-payload TYPE"
                print_info "Tipos: visitor, lead, conversion"
                exit 1
            fi
            create_test_payload "$2" "test-payload-$2.json"
            ;;
        "status")
            check_n8n_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        "")
            show_help
            ;;
        *)
            print_error "Comando no reconocido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
