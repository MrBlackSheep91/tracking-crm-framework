import React, { useState, useEffect } from 'react';
import trackingConfig, { 
  N8N_WEBHOOKS, 
  API_ENDPOINTS, 
  TRACKING_CONFIG, 
  ENVIRONMENT_INFO 
} from '../config/tracking-config';

interface TrackingStatus {
  environment: string;
  urls: Record<string, string>;
  sessionActive: boolean;
  eventsCount: number;
  lastActivity: string;
  errors: string[];
}

const TrackingDebugger: React.FC = () => {
  const [status, setStatus] = useState<TrackingStatus>({
    environment: 'unknown',
    urls: {},
    sessionActive: false,
    eventsCount: 0,
    lastActivity: 'N/A',
    errors: []
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si estamos en modo debug
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true' || 
                     localStorage.getItem('tracking_debug') === 'true';
    
    if (debugMode) {
      setIsVisible(true);
    }

    // Actualizar estado inicial
    updateStatus();

    // Actualizar cada 5 segundos
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    try {
      // Obtener información del entorno
      const environment = ENVIRONMENT_INFO.isProduction ? 'production' : 'development';
      
      // Obtener URLs configuradas
      const urls = {
        'N8N Base': ENVIRONMENT_INFO.currentConfig.n8n,
        'API Base': ENVIRONMENT_INFO.currentConfig.api,
        'Session Tracking': N8N_WEBHOOKS.sessionTracking,
        'Lead Capture': N8N_WEBHOOKS.leadCapture,
        'Visitor Tracking': N8N_WEBHOOKS.visitorTracking
      };

      // Verificar si hay sesión activa
      const sessionData = localStorage.getItem('tracker_data');
      const sessionActive = !!sessionData;

      // Contar eventos en buffer (si existe)
      let eventsCount = 0;
      try {
        const eventBuffer = localStorage.getItem('tracking_events_buffer');
        if (eventBuffer) {
          const events = JSON.parse(eventBuffer);
          eventsCount = Array.isArray(events) ? events.length : 0;
        }
      } catch (e) {
        console.warn('Error contando eventos:', e);
      }

      // Obtener última actividad
      const lastActivity = localStorage.getItem('last_activity_time') || 'N/A';

      // Obtener errores recientes (si existen)
      const errors: string[] = [];
      try {
        const errorLog = localStorage.getItem('tracking_errors');
        if (errorLog) {
          const errorData = JSON.parse(errorLog);
          errors.push(...errorData.slice(-5)); // Últimos 5 errores
        }
      } catch (e) {
        // Ignorar errores de parsing
      }

      setStatus({
        environment,
        urls,
        sessionActive,
        eventsCount,
        lastActivity,
        errors
      });
    } catch (error) {
      console.error('Error actualizando estado de tracking:', error);
    }
  };

  const testWebhook = async (webhookName: string, url: string) => {
    try {
      console.log(`🧪 Probando webhook: ${webhookName}`);
      
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        webhookName,
        environment: status.environment
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        console.log(`✅ Webhook ${webhookName} funcionando`);
        alert(`✅ Webhook ${webhookName} funcionando correctamente`);
      } else {
        console.error(`❌ Webhook ${webhookName} falló:`, response.status);
        alert(`❌ Webhook ${webhookName} falló: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error probando webhook ${webhookName}:`, error);
      alert(`❌ Error probando webhook ${webhookName}: ${error}`);
    }
  };

  const clearTrackingData = () => {
    localStorage.removeItem('tracker_data');
    localStorage.removeItem('tracking_events_buffer');
    localStorage.removeItem('last_activity_time');
    localStorage.removeItem('tracking_errors');
    updateStatus();
    alert('🧹 Datos de tracking limpiados');
  };

  const exportTrackingData = () => {
    const data = {
      status,
      localStorage: {
        tracker_data: localStorage.getItem('tracker_data'),
        tracking_events_buffer: localStorage.getItem('tracking_events_buffer'),
        last_activity_time: localStorage.getItem('last_activity_time'),
        tracking_errors: localStorage.getItem('tracking_errors')
      },
      config: {
        N8N_WEBHOOKS,
        API_ENDPOINTS,
        TRACKING_CONFIG,
        ENVIRONMENT_INFO
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-debug-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: '#333',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
        onClick={() => setIsVisible(true)}
      >
        🔍 Debug
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: '1px solid #444'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#4CAF50' }}>🔍 Tracking Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>🌍 Entorno:</strong> {status.environment}
        <br />
        <strong>🏠 Hostname:</strong> {window.location.hostname}
        <br />
        <strong>📡 Sesión Activa:</strong> {status.sessionActive ? '✅' : '❌'}
        <br />
        <strong>📊 Eventos en Buffer:</strong> {status.eventsCount}
        <br />
        <strong>⏰ Última Actividad:</strong> {status.lastActivity}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>🔗 URLs Configuradas:</strong>
        {Object.entries(status.urls).map(([name, url]) => (
          <div key={name} style={{ marginLeft: '10px', fontSize: '10px' }}>
            <strong>{name}:</strong> {url}
            <button 
              onClick={() => testWebhook(name, url)}
              style={{ 
                marginLeft: '5px', 
                padding: '2px 5px', 
                fontSize: '9px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Test
            </button>
          </div>
        ))}
      </div>

      {status.errors.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>🚨 Errores Recientes:</strong>
          {status.errors.map((error, index) => (
            <div key={index} style={{ marginLeft: '10px', fontSize: '10px', color: '#ff6b6b' }}>
              {error}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button 
          onClick={updateStatus}
          style={{ 
            padding: '5px 10px', 
            fontSize: '10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🔄 Actualizar
        </button>
        <button 
          onClick={clearTrackingData}
          style={{ 
            padding: '5px 10px', 
            fontSize: '10px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🧹 Limpiar
        </button>
        <button 
          onClick={exportTrackingData}
          style={{ 
            padding: '5px 10px', 
            fontSize: '10px',
            background: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          📥 Exportar
        </button>
      </div>
    </div>
  );
};

export default TrackingDebugger; 