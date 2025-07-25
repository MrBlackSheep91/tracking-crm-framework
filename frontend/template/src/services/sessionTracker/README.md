# Sistema Modular de Tracking de Sesiones

Este directorio contiene una versión modularizada del sistema de tracking de sesiones, dividido en componentes más pequeños y manejables.

## Estructura de archivos

- `sessionTypes.ts`: Definiciones de tipos, interfaces y constantes compartidas
- `activityTracker.ts`: Seguimiento de actividad del usuario, inactividad y checkpoints de scroll
- `webhookService.ts`: Comunicación con webhooks de n8n y manejo de errores
- `sessionManager.ts`: Gestión principal del ciclo de vida de sesiones
- `index.ts`: Punto de entrada que expone la API pública
- `__tests__/`: Directorio con pruebas unitarias
  - `sessionManager.test.ts`: Pruebas para el gestor de sesiones
- `sessionUtils.ts`: Utilidades compartidas para el manejo de sesiones

## Integración con n8n

Para configurar correctamente n8n, asegúrate de tener:

1. Dos nodos webhook separados:
   - `session-tracking`: Para inicio y fin de sesión
   - `session-heartbeat`: Para pings periódicos de sesión activa

2. Configura cada webhook con:
   - Método: POST
   - Opciones CORS: Permitir origen '*'
   - Rutas correctas según están definidas en `sessionTypes.ts`

3. Conecta cada webhook a un nodo de almacenamiento (Google Sheets, Base de datos, etc.)

**Ejemplo de configuración n8n correcta:**

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "session-tracking",
        "options": { "allowedOrigins": "*" }
      },
      "type": "n8n-nodes-base.webhook",
      "id": "session_tracking_webhook",
      "name": "Session Tracking Webhook"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "session-heartbeat",
        "options": { "allowedOrigins": "*" }
      },
      "type": "n8n-nodes-base.webhook",
      "id": "session_heartbeat_webhook", 
      "name": "Session Heartbeat Webhook"
    }
  ]
}
```

## Pruebas

El sistema incluye pruebas unitarias completas para garantizar el correcto funcionamiento del gestor de sesiones. Las pruebas cubren:

- Inicialización y gestión de sesiones
- Seguimiento de actividad e inactividad
- Detección de dispositivos
- Manejo de eventos
- Envío de datos al servidor

### Ejecutando las pruebas

Para ejecutar las pruebas, utiliza el siguiente comando:

```bash
npm test
```

O para ejecutar pruebas específicas:

```bash
npm test -- -t "nombre de la prueba"
```

## Migración

El archivo `sessionService.ts` original se mantiene como adaptador temporalmente. En futuras versiones, debería ser reemplazado completamente por este sistema modular.

## Cambios Recientes

- **2024-06-28**: Mejora en la detección de inactividad
- **2024-06-28**: Corrección en la detección de dispositivos móviles
- **2024-06-28**: Mejora en los mocks para pruebas unitarias
- **2024-06-28**: Documentación actualizada
