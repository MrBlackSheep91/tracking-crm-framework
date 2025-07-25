#!/bin/bash

# 🧪 AUTOMATED TEST RUNNER FOR ALL MICRO-WORKFLOWS
# Executes comprehensive testing of all 6 NAT-PETS CRM micro-workflows

echo "🚀 INICIANDO TESTING COMPLETO DE MICRO-WORKFLOWS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 n8n URL: http://localhost:5679"
echo "⏰ Timestamp: $(date)"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Función para ejecutar test y verificar resultado
run_test() {
    local test_name="$1"
    local webhook_url="$2"
    local payload="$3"
    local expected_status="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}🔄 Ejecutando: ${test_name}${NC}"
    
    # Ejecutar request con curl
    response=$(curl -s -w "\n%{http_code}" -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null)
    
    # Extraer código de estado HTTP
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    # Verificar resultado
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED: ${test_name} (${http_code})${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED: ${test_name} (Expected: ${expected_status}, Got: ${http_code})${NC}"
        echo -e "${YELLOW}Response: ${response_body}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "🎯 TEST 1: VISITOR-PROCESSOR - Visitor Básico"
run_test "VISITOR-PROCESSOR Basic" \
    "http://localhost:5679/webhook/visitor-processor" \
    '{
        "body": {
            "session": {
                "sessionId": "auto-test-001",
                "visitorId": "auto-visitor-001",
                "businessId": "00000000-0000-0000-0000-000000000001",
                "fingerprint": "fp_auto_001",
                "startedAt": "2025-07-24T16:57:00.000Z",
                "pageInfo": {
                    "url": "https://nat-pets.com/",
                    "title": "NAT-PETS CRM Auto Test",
                    "referrer": "direct"
                }
            },
            "events": [
                {
                    "eventType": "page_view",
                    "pageUrl": "https://nat-pets.com/",
                    "createdAt": "2025-07-24T16:57:00.000Z",
                    "metadata": {"timeOnPage": 120}
                }
            ]
        }
    }' \
    "200"

sleep 1

echo ""
echo "🎯 TEST 2: VISITOR-PROCESSOR - Con Conversión"
run_test "VISITOR-PROCESSOR Conversion" \
    "http://localhost:5679/webhook/visitor-processor" \
    '{
        "body": {
            "session": {
                "sessionId": "auto-test-002",
                "visitorId": "auto-visitor-002",
                "businessId": "00000000-0000-0000-0000-000000000001",
                "fingerprint": "fp_auto_002",
                "startedAt": "2025-07-24T16:57:30.000Z",
                "pageInfo": {
                    "url": "https://nat-pets.com/contact",
                    "title": "Contact - NAT-PETS CRM",
                    "referrer": "https://nat-pets.com/"
                }
            },
            "events": [
                {
                    "eventType": "form_submit",
                    "pageUrl": "https://nat-pets.com/contact",
                    "createdAt": "2025-07-24T16:57:45.000Z",
                    "metadata": {
                        "formId": "contact-form",
                        "email": "autotest@example.com",
                        "formType": "contact"
                    }
                }
            ]
        }
    }' \
    "200"

sleep 2

echo ""
echo "🎯 TEST 3: CONVERSION-DETECTOR - Detección Válida"
run_test "CONVERSION-DETECTOR Valid" \
    "http://localhost:5679/webhook/conversion-detector" \
    '{
        "session": {
            "sessionId": "auto-test-003",
            "visitorId": "auto-visitor-003",
            "businessId": "00000000-0000-0000-0000-000000000001"
        },
        "events": [
            {
                "eventType": "form_submit",
                "pageUrl": "https://nat-pets.com/signup",
                "createdAt": "2025-07-24T16:58:00.000Z",
                "metadata": {
                    "formId": "lead-form",
                    "email": "conversion@example.com",
                    "formType": "lead"
                }
            }
        ]
    }' \
    "200"

sleep 1

echo ""
echo "🎯 TEST 4: LEAD-PROCESSOR - Lead Directo"
run_test "LEAD-PROCESSOR Direct" \
    "http://localhost:5679/webhook/lead-processor" \
    '{
        "leadData": {
            "email": "directlead@example.com",
            "name": "Direct Lead Auto Test",
            "phone": "+1234567890",
            "businessId": "00000000-0000-0000-0000-000000000001",
            "source": "website",
            "medium": "organic",
            "campaign": "auto-test-campaign"
        }
    }' \
    "200"

sleep 1

echo ""
echo "🎯 TEST 5: ACTIVITY-LOGGER - Bulk Activities"
run_test "ACTIVITY-LOGGER Bulk" \
    "http://localhost:5679/webhook/activity-logger" \
    '{
        "activities": [
            {
                "id": "auto-activity-001",
                "businessId": "00000000-0000-0000-0000-000000000001",
                "type": "page_view",
                "category": "tracking",
                "entityType": "visitor",
                "entityId": "auto-visitor-001",
                "title": "Automated Page View",
                "description": "Auto test page view",
                "data": {"pageUrl": "https://nat-pets.com/"},
                "metadata": {"timeOnPage": 120},
                "source": "auto-test",
                "createdAt": "2025-07-24T16:58:30.000Z"
            }
        ]
    }' \
    "200"

sleep 1

echo ""
echo "🎯 TEST 6: ENRICHMENT-ENGINE - Lead Enrichment"
run_test "ENRICHMENT-ENGINE Enrichment" \
    "http://localhost:5679/webhook/enrichment-engine" \
    '{
        "leadData": {
            "leadId": "auto-lead-001",
            "email": "enrich@example.com",
            "name": "Auto Enrich Test",
            "businessId": "00000000-0000-0000-0000-000000000001",
            "score": 50,
            "source": "website",
            "metadata": {
                "timeOnSite": 600,
                "pagesViewed": 5,
                "formSubmissions": 1
            }
        }
    }' \
    "200"

sleep 1

echo ""
echo "🎯 TEST 7: EMAIL-ORCHESTRATOR - Campaign"
run_test "EMAIL-ORCHESTRATOR Campaign" \
    "http://localhost:5679/webhook/email-orchestrator" \
    '{
        "leadData": {
            "leadId": "auto-lead-002",
            "email": "email@example.com",
            "name": "Auto Email Test",
            "businessId": "00000000-0000-0000-0000-000000000001",
            "score": 78,
            "source": "website",
            "isHot": true
        },
        "campaignConfig": {
            "campaignType": "welcome_sequence",
            "priority": 1,
            "delayMinutes": 0,
            "templateId": "welcome-template-001"
        }
    }' \
    "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN DE TESTING COMPLETO:"
echo -e "✅ Tests PASSED: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "❌ Tests FAILED: ${RED}${FAILED_TESTS}${NC}"
echo -e "📈 Total Tests: ${BLUE}${TOTAL_TESTS}${NC}"
echo -e "🎯 Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!${NC}"
    echo -e "${GREEN}✅ Los 6 micro-workflows están funcionando correctamente${NC}"
    echo ""
    echo "🔍 PRÓXIMOS PASOS:"
    echo "1. Verificar datos en la base de datos PostgreSQL"
    echo "2. Revisar logs de n8n para errores"
    echo "3. Ejecutar tests end-to-end"
    echo "4. Optimizar rendimiento si es necesario"
else
    echo ""
    echo -e "${YELLOW}⚠️  Algunos tests fallaron. Revisar:${NC}"
    echo "1. Logs de n8n: docker logs n8n --tail=20"
    echo "2. Estado de workflows en http://localhost:5679"
    echo "3. Configuración de base de datos"
    echo "4. Estructura de payloads"
fi

echo ""
echo "🏁 Testing completo finalizado a las $(date)"
