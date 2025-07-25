import React, { useState, useEffect, useRef } from 'react';
import { Activity, Users, Target, Zap, Eye, MousePointer, Clock, Globe } from 'lucide-react';

interface TrackingData {
  visitors: {
    total: number;
    active: number;
    new: number;
    returning: number;
  };
  sessions: {
    total: number;
    avgDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  leads: {
    total: number;
    today: number;
    conversionRate: number;
    byType: {
      book_purchase: number;
      free_guide: number;
    };
  };
  events: {
    total: number;
    pageViews: number;
    formSubmits: number;
    buttonClicks: number;
  };
  n8nStatus: {
    connected: boolean;
    lastWebhook: string;
    totalWebhooks: number;
    errors: number;
  };
  realTimeEvents: Array<{
    id: string;
    type: string;
    timestamp: string;
    data: any;
  }>;
}

interface N8nPayload {
  id: string;
  timestamp: string;
  type: 'lead_capture' | 'email_sent' | 'whatsapp_sent' | 'error';
  status: 'success' | 'error' | 'pending';
  data: any;
  response?: any;
  error?: string;
}

const TrackingDashboard: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingData>({
    visitors: { total: 0, active: 0, new: 0, returning: 0 },
    sessions: { total: 0, avgDuration: 0, bounceRate: 0, pagesPerSession: 0 },
    leads: { total: 0, today: 0, conversionRate: 0, byType: { book_purchase: 0, free_guide: 0 } },
    events: { total: 0, pageViews: 0, formSubmits: 0, buttonClicks: 0 },
    n8nStatus: { connected: false, lastWebhook: '', totalWebhooks: 0, errors: 0 },
    realTimeEvents: []
  });

  const [n8nPayloads, setN8nPayloads] = useState<N8nPayload[]>([]);
  const [selectedPayload, setSelectedPayload] = useState<N8nPayload | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  
  const intervalRef = useRef<NodeJS.Timeout>();

  // Simular datos en tiempo real
  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        // En producción, esto sería una llamada real a la API
        const mockData: TrackingData = {
          visitors: {
            total: Math.floor(Math.random() * 1000) + 500,
            active: Math.floor(Math.random() * 50) + 10,
            new: Math.floor(Math.random() * 200) + 100,
            returning: Math.floor(Math.random() * 300) + 200
          },
          sessions: {
            total: Math.floor(Math.random() * 800) + 400,
            avgDuration: Math.floor(Math.random() * 300) + 120,
            bounceRate: Math.floor(Math.random() * 40) + 30,
            pagesPerSession: Math.floor(Math.random() * 5) + 2
          },
          leads: {
            total: Math.floor(Math.random() * 100) + 50,
            today: Math.floor(Math.random() * 20) + 5,
            conversionRate: Math.floor(Math.random() * 10) + 5,
            byType: {
              book_purchase: Math.floor(Math.random() * 30) + 10,
              free_guide: Math.floor(Math.random() * 70) + 40
            }
          },
          events: {
            total: Math.floor(Math.random() * 5000) + 2000,
            pageViews: Math.floor(Math.random() * 3000) + 1500,
            formSubmits: Math.floor(Math.random() * 100) + 50,
            buttonClicks: Math.floor(Math.random() * 500) + 200
          },
          n8nStatus: {
            connected: Math.random() > 0.1, // 90% conectado
            lastWebhook: new Date(Date.now() - Math.random() * 300000).toISOString(),
            totalWebhooks: Math.floor(Math.random() * 500) + 200,
            errors: Math.floor(Math.random() * 10)
          },
          realTimeEvents: []
        };

        setTrackingData(mockData);

        // Simular nuevos payloads de n8n
        if (Math.random() > 0.7) {
          const newPayload: N8nPayload = {
            id: `payload_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: ['lead_capture', 'email_sent', 'whatsapp_sent'][Math.floor(Math.random() * 3)] as any,
            status: ['success', 'error', 'pending'][Math.floor(Math.random() * 3)] as any,
            data: {
              email: `user${Math.floor(Math.random() * 1000)}@example.com`,
              name: `User ${Math.floor(Math.random() * 1000)}`,
              leadType: Math.random() > 0.5 ? 'book_purchase' : 'free_guide',
              source: ['facebook', 'google', 'direct'][Math.floor(Math.random() * 3)],
              campaign: `campaign_${Math.floor(Math.random() * 10)}`
            }
          };
          
          setN8nPayloads(prev => [newPayload, ...prev.slice(0, 49)]); // Mantener solo 50
        }

      } catch (error) {
        console.error('Error fetching tracking data:', error);
      }
    };

    if (isLive) {
      fetchTrackingData();
      intervalRef.current = setInterval(fetchTrackingData, 5000); // Actualizar cada 5 segundos
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const filteredPayloads = n8nPayloads.filter(payload => 
    filter === 'all' || payload.status === filter
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Tracking</h1>
            <p className="text-gray-600">Monitoreo en tiempo real de NAT-PETS</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isLive 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {isLive ? '🔴 EN VIVO' : '⏸️ PAUSADO'}
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                trackingData.n8nStatus.connected ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm text-gray-600">
                n8n {trackingData.n8nStatus.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Visitantes Activos"
            value={trackingData.visitors.active}
            subtitle={`${trackingData.visitors.total} total hoy`}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="#3B82F6"
          />
          <StatCard
            title="Leads Generados"
            value={trackingData.leads.today}
            subtitle={`${trackingData.leads.conversionRate}% conversión`}
            icon={<Target className="w-6 h-6 text-green-600" />}
            color="#10B981"
          />
          <StatCard
            title="Eventos Totales"
            value={trackingData.events.total}
            subtitle={`${trackingData.events.formSubmits} formularios`}
            icon={<Activity className="w-6 h-6 text-purple-600" />}
            color="#8B5CF6"
          />
          <StatCard
            title="Duración Promedio"
            value={formatDuration(trackingData.sessions.avgDuration)}
            subtitle={`${trackingData.sessions.pagesPerSession} páginas/sesión`}
            icon={<Clock className="w-6 h-6 text-orange-600" />}
            color="#F59E0B"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leads por Tipo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads por Tipo</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compra de Libro</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(trackingData.leads.byType.book_purchase / trackingData.leads.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{trackingData.leads.byType.book_purchase}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Guía Gratuita</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(trackingData.leads.byType.free_guide / trackingData.leads.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{trackingData.leads.byType.free_guide}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de n8n */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de n8n</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  trackingData.n8nStatus.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {trackingData.n8nStatus.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Webhooks</span>
                <span className="text-sm font-medium">{trackingData.n8nStatus.totalWebhooks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Errores</span>
                <span className="text-sm font-medium text-red-600">{trackingData.n8nStatus.errors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Último Webhook</span>
                <span className="text-sm font-medium">
                  {trackingData.n8nStatus.lastWebhook ? formatTimestamp(trackingData.n8nStatus.lastWebhook) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payloads de n8n */}
        <div className="mt-8 bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Payloads de n8n en Tiempo Real</h3>
              <div className="flex space-x-2">
                {(['all', 'success', 'error', 'pending'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      filter === status
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'Todos' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Lista de Payloads */}
            <div className="p-4 border-r border-gray-200 max-h-96 overflow-y-auto">
              {filteredPayloads.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay payloads disponibles</p>
              ) : (
                <div className="space-y-2">
                  {filteredPayloads.map((payload) => (
                    <div
                      key={payload.id}
                      onClick={() => setSelectedPayload(payload)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPayload?.id === payload.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            payload.status === 'success' ? 'bg-green-400' :
                            payload.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                          }`}></span>
                          <span className="text-sm font-medium">{payload.type}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(payload.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {payload.data.email || payload.data.name || 'Sin datos'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detalles del Payload Seleccionado */}
            <div className="p-4">
              {selectedPayload ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Detalles del Payload</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">ID</label>
                      <p className="text-sm">{selectedPayload.id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Tipo</label>
                      <p className="text-sm">{selectedPayload.type}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Estado</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        selectedPayload.status === 'success' ? 'bg-green-100 text-green-800' :
                        selectedPayload.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedPayload.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Datos</label>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(selectedPayload.data, null, 2)}
                      </pre>
                    </div>
                    {selectedPayload.error && (
                      <div>
                        <label className="text-xs font-medium text-red-500">Error</label>
                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1">
                          {selectedPayload.error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona un payload para ver los detalles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingDashboard; 