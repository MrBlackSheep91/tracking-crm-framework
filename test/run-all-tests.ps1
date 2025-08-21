# Script PowerShell para ejecutar todas las pruebas del pipeline de tracking
# Ejecutar con: .\test\run-all-tests.ps1

Write-Host "🚀 INICIANDO PRUEBAS COMPLETAS DEL PIPELINE DE TRACKING Y ACTIVIDADES" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Variables de configuración
$API_BASE_URL = "http://localhost:3001"
$TEST_DIR = "test"

# Función para ejecutar prueba HTTP
function Test-TrackingEndpoint {
    param(
        [string]$TestName,
        [string]$JsonFile,
        [string]$Endpoint = "/api/track/event"
    )
    
    Write-Host "`n🧪 Ejecutando prueba: $TestName" -ForegroundColor Yellow
    Write-Host "   Archivo: $JsonFile" -ForegroundColor Gray
    Write-Host "   Endpoint: $API_BASE_URL$Endpoint" -ForegroundColor Gray
    
    try {
        $jsonContent = Get-Content "$TEST_DIR\$JsonFile" -Raw
        $response = Invoke-WebRequest -Uri "$API_BASE_URL$Endpoint" -Method POST -Headers @{"Content-Type"="application/json"} -Body $jsonContent
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ ÉXITO: $TestName" -ForegroundColor Green
            $responseData = $response.Content | ConvertFrom-Json
            Write-Host "   📊 Respuesta: $($responseData.message)" -ForegroundColor Cyan
            return $true
        } else {
            Write-Host "   ❌ FALLO: $TestName - Status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "   ❌ ERROR: $TestName - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para verificar estado del servidor
function Test-ServerHealth {
    Write-Host "`n🏥 Verificando estado del servidor..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "$API_BASE_URL/health" -Method GET
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Servidor funcionando correctamente" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "   ❌ Servidor no disponible: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para crear business de prueba
function Create-TestBusiness {
    Write-Host "`n🏢 Creando business de prueba..." -ForegroundColor Yellow
    
    try {
        Set-Location "backend\template"
        $result = node "..\..\test\create-business.js"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Business de prueba creado exitosamente" -ForegroundColor Green
            return $true
        } else {
            Write-Host "   ❌ Error creando business de prueba" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "   ❌ Error ejecutando script: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    } finally {
        Set-Location "..\..\"
    }
}

# Función para verificar datos en base de datos
function Verify-DatabaseData {
    Write-Host "`n🗄️ Verificando datos en base de datos..." -ForegroundColor Yellow
    
    # Verificar tracking_events
    $eventsCount = docker exec tracking_crm_db psql -U user -d tracking_crm -t -c "SELECT COUNT(*) FROM tracking_events WHERE \"businessId\" = '00000000-0000-0000-0000-000000000001';"
    Write-Host "   📊 Eventos de tracking almacenados: $($eventsCount.Trim())" -ForegroundColor Cyan
    
    # Verificar activities
    $activitiesCount = docker exec tracking_crm_db psql -U user -d tracking_crm -t -c "SELECT COUNT(*) FROM activities WHERE \"businessId\" = '00000000-0000-0000-0000-000000000001';"
    Write-Host "   📊 Actividades almacenadas: $($activitiesCount.Trim())" -ForegroundColor Cyan
    
    # Verificar visitors
    $visitorsCount = docker exec tracking_crm_db psql -U user -d tracking_crm -t -c "SELECT COUNT(*) FROM visitors WHERE \"businessId\" = '00000000-0000-0000-0000-000000000001';"
    Write-Host "   📊 Visitantes registrados: $($visitorsCount.Trim())" -ForegroundColor Cyan
    
    # Verificar sessions
    $sessionsCount = docker exec tracking_crm_db psql -U user -d tracking_crm -t -c "SELECT COUNT(*) FROM visitor_sessions WHERE \"businessId\" = '00000000-0000-0000-0000-000000000001';"
    Write-Host "   📊 Sesiones registradas: $($sessionsCount.Trim())" -ForegroundColor Cyan
}

# INICIO DE PRUEBAS
Write-Host "`n⏰ Iniciando pruebas: $(Get-Date)" -ForegroundColor Gray

# 1. Verificar servidor
if (-not (Test-ServerHealth)) {
    Write-Host "`n❌ FALLO CRÍTICO: Servidor no disponible. Abortando pruebas." -ForegroundColor Red
    exit 1
}

# 2. Crear business de prueba
if (-not (Create-TestBusiness)) {
    Write-Host "`n⚠️ ADVERTENCIA: No se pudo crear business de prueba. Continuando..." -ForegroundColor Yellow
}

# 3. Ejecutar pruebas de tracking
$testResults = @()

$testResults += Test-TrackingEndpoint "Form Submit (Lead Generation)" "test-form-submit.json"
Start-Sleep -Seconds 2

$testResults += Test-TrackingEndpoint "CTA Click (User Engagement)" "test-cta-click.json"
Start-Sleep -Seconds 2

$testResults += Test-TrackingEndpoint "Page View (Navigation)" "test-page-view.json"
Start-Sleep -Seconds 2

$testResults += Test-TrackingEndpoint "Conversion (Sales Funnel)" "test-conversion.json"
Start-Sleep -Seconds 2

# 4. Verificar datos almacenados
Verify-DatabaseData

# 5. Resumen de resultados
Write-Host "`n📊 RESUMEN DE PRUEBAS" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

$successCount = ($testResults | Where-Object { $_ -eq $true }).Count
$totalTests = $testResults.Count

Write-Host "   ✅ Pruebas exitosas: $successCount/$totalTests" -ForegroundColor Green
Write-Host "   📈 Porcentaje de éxito: $([math]::Round(($successCount / $totalTests) * 100, 2))%" -ForegroundColor Cyan

if ($successCount -eq $totalTests) {
    Write-Host "`n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE" -ForegroundColor Green
    Write-Host "   El pipeline de tracking y actividades está funcionando correctamente" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ ALGUNAS PRUEBAS FALLARON" -ForegroundColor Yellow
    Write-Host "   Revisar logs anteriores para detalles" -ForegroundColor Yellow
}

Write-Host "`n⏰ Pruebas completadas: $(Get-Date)" -ForegroundColor Gray
Write-Host "=================================================================" -ForegroundColor Green
