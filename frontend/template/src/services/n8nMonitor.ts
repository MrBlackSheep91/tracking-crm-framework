/**
 * Servicio de monitoreo de n8n en tiempo real
 * Conecta con n8n via WebSocket y HTTP para obtener logs y estado de workflows
 */

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  lastExecution?: string;
  executionCount: number;
  successRate: number;
  nodes: N8nNode[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  executeOnce?: boolean;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  mode: 'manual' | 'trigger' | 'webhook';
  status: 'success' | 'error' | 'running' | 'waiting';
  startedAt: string;
  finishedAt?: string;
  data: {
    resultData: {
      runData: Record<string, any[]>;
    };
  };
  error?: string;
}

export interface N8nWebhookPayload {
  id: string;
  timestamp: string;
  workflowId: string;
  webhookName: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: any;
  response?: any;
  executionId?: string;
  status: 'received' | 'processing' | 'completed' | 'error';
  processingTime?: number;
}

class N8nMonitorService {
  private baseUrl: string;
  private apiKey?: string;
  private websocket?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // Event listeners
  private listeners: {
    execution: ((execution: N8nExecution) => void)[];
    webhook: ((payload: N8nWebhookPayload) => void)[];
    workflow: ((workflow: N8nWorkflow) => void)[];
    error: ((error: Error) => void)[];
    connected: (() => void)[];
    disconnected: (() => void)[];
  } = {
    execution: [],
    webhook: [],
    workflow: [],
    error: [],
    connected: [],
    disconnected: []
  };

  constructor(baseUrl: string = 'http://localhost:5678', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Inicializa la conexión con n8n
   */
  async connect(): Promise<void> {
    try {
      // Verificar conexión HTTP primero
      await this.checkConnection();
      
      // Inicializar WebSocket para eventos en tiempo real
      this.initWebSocket();
      
      console.log('N8nMonitorService: Conectado exitosamente');
    } catch (error) {
      console.error('N8nMonitorService: Error al conectar:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Verifica la conexión HTTP con n8n
   */
  private async checkConnection(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rest/active-workflows`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`No se pudo conectar a n8n: ${response.status}`);
    }
  }

  /**
   * Inicializa la conexión WebSocket
   */
  private initWebSocket(): void {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('N8nMonitorService: WebSocket conectado');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('N8nMonitorService: WebSocket desconectado');
        this.emit('disconnected');
        this.handleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('N8nMonitorService: WebSocket error:', error);
        this.emit('error', new Error('WebSocket connection error'));
      };

    } catch (error) {
      console.error('Error inicializando WebSocket:', error);
    }
  }

  /**
   * Maneja la reconexión automática
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado');
      this.emit('error', new Error('No se pudo reconectar a n8n'));
    }
  }

  /**
   * Maneja mensajes del WebSocket
   */
  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'executionStarted':
      case 'executionFinished':
      case 'executionError':
        this.handleExecutionEvent(data);
        break;
      case 'webhookReceived':
        this.handleWebhookEvent(data);
        break;
      case 'workflowActivated':
      case 'workflowDeactivated':
        this.handleWorkflowEvent(data);
        break;
      default:
        console.log('Mensaje WebSocket no manejado:', data);
    }
  }

  /**
   * Maneja eventos de ejecución
   */
  private handleExecutionEvent(data: any): void {
    const execution: N8nExecution = {
      id: data.executionId,
      workflowId: data.workflowId,
      mode: data.mode,
      status: data.type === 'executionStarted' ? 'running' : 
              data.type === 'executionError' ? 'error' : 'success',
      startedAt: data.startedAt || new Date().toISOString(),
      finishedAt: data.finishedAt,
      data: data.data || { resultData: { runData: {} } },
      error: data.error
    };

    this.emit('execution', execution);
  }

  /**
   * Maneja eventos de webhook
   */
  private handleWebhookEvent(data: any): void {
    const payload: N8nWebhookPayload = {
      id: data.id || `webhook_${Date.now()}`,
      timestamp: new Date().toISOString(),
      workflowId: data.workflowId,
      webhookName: data.webhookName,
      method: data.method,
      url: data.url,
      headers: data.headers || {},
      body: data.body,
      response: data.response,
      executionId: data.executionId,
      status: data.status || 'received',
      processingTime: data.processingTime
    };

    this.emit('webhook', payload);
  }

  /**
   * Maneja eventos de workflow
   */
  private handleWorkflowEvent(data: any): void {
    // Implementar según necesidades
    console.log('Workflow event:', data);
  }

  /**
   * Obtiene todos los workflows activos
   */
  async getActiveWorkflows(): Promise<N8nWorkflow[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/active-workflows`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo workflows: ${response.status}`);
      }

      const workflows = await response.json();
      return workflows.map((wf: any) => this.transformWorkflow(wf));
    } catch (error) {
      console.error('Error obteniendo workflows activos:', error);
      throw error;
    }
  }

  /**
   * Obtiene las ejecuciones recientes de un workflow
   */
  async getWorkflowExecutions(workflowId: string, limit: number = 10): Promise<N8nExecution[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/rest/executions?workflowId=${workflowId}&limit=${limit}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Error obteniendo ejecuciones: ${response.status}`);
      }

      const executions = await response.json();
      return executions.data.map((exec: any) => this.transformExecution(exec));
    } catch (error) {
      console.error('Error obteniendo ejecuciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de una ejecución específica
   */
  async getExecutionDetails(executionId: string): Promise<N8nExecution> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/executions/${executionId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo detalles de ejecución: ${response.status}`);
      }

      const execution = await response.json();
      return this.transformExecution(execution);
    } catch (error) {
      console.error('Error obteniendo detalles de ejecución:', error);
      throw error;
    }
  }

  /**
   * Ejecuta un workflow manualmente
   */
  async executeWorkflow(workflowId: string, data?: any): Promise<N8nExecution> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error(`Error ejecutando workflow: ${response.status}`);
      }

      const execution = await response.json();
      return this.transformExecution(execution);
    } catch (error) {
      console.error('Error ejecutando workflow:', error);
      throw error;
    }
  }

  /**
   * Prueba un webhook específico
   */
  async testWebhook(workflowId: string, webhookName: string, payload: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook-test/${webhookName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error probando webhook: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error probando webhook:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de n8n
   */
  async getStatistics(): Promise<any> {
    try {
      const [workflows, executions] = await Promise.all([
        this.getActiveWorkflows(),
        fetch(`${this.baseUrl}/rest/executions?limit=100`, { headers: this.getHeaders() })
          .then(r => r.json())
      ]);

      const totalExecutions = executions.count || 0;
      const successfulExecutions = executions.data?.filter((e: any) => e.finished && !e.stoppedAt).length || 0;
      
      return {
        totalWorkflows: workflows.length,
        activeWorkflows: workflows.filter(w => w.active).length,
        totalExecutions,
        successfulExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
        lastExecution: executions.data?.[0]?.startedAt
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Transforma workflow de n8n al formato interno
   */
  private transformWorkflow(workflow: any): N8nWorkflow {
    return {
      id: workflow.id,
      name: workflow.name,
      active: workflow.active,
      lastExecution: workflow.lastExecution,
      executionCount: workflow.executionCount || 0,
      successRate: workflow.successRate || 0,
      nodes: workflow.nodes || []
    };
  }

  /**
   * Transforma ejecución de n8n al formato interno
   */
  private transformExecution(execution: any): N8nExecution {
    return {
      id: execution.id,
      workflowId: execution.workflowId,
      mode: execution.mode,
      status: execution.finished ? (execution.stoppedAt ? 'error' : 'success') : 'running',
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt,
      data: execution.data || { resultData: { runData: {} } },
      error: execution.data?.resultData?.error?.message
    };
  }

  /**
   * Obtiene headers para las peticiones HTTP
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Registra un listener para eventos
   */
  on<T extends keyof typeof this.listeners>(
    event: T,
    listener: typeof this.listeners[T][0]
  ): void {
    this.listeners[event].push(listener as any);
  }

  /**
   * Remueve un listener
   */
  off<T extends keyof typeof this.listeners>(
    event: T,
    listener: typeof this.listeners[T][0]
  ): void {
    const index = this.listeners[event].indexOf(listener as any);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * Emite un evento
   */
  private emit<T extends keyof typeof this.listeners>(
    event: T,
    ...args: any[]
  ): void {
    this.listeners[event].forEach(listener => {
      try {
        (listener as any)(...args);
      } catch (error) {
        console.error(`Error en listener de ${event}:`, error);
      }
    });
  }

  /**
   * Desconecta el servicio
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
    
    // Limpiar listeners
    Object.keys(this.listeners).forEach(key => {
      this.listeners[key as keyof typeof this.listeners] = [];
    });
  }
}

// Instancia singleton
let n8nMonitor: N8nMonitorService | null = null;

/**
 * Obtiene la instancia del monitor de n8n
 */
export function getN8nMonitor(baseUrl?: string, apiKey?: string): N8nMonitorService {
  if (!n8nMonitor) {
    n8nMonitor = new N8nMonitorService(baseUrl, apiKey);
  }
  return n8nMonitor;
}

/**
 * Hook de React para usar el monitor de n8n
 */
export function useN8nMonitor() {
  const [isConnected, setIsConnected] = React.useState(false);
  const [workflows, setWorkflows] = React.useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = React.useState<N8nExecution[]>([]);
  const [webhooks, setWebhooks] = React.useState<N8nWebhookPayload[]>([]);
  const [statistics, setStatistics] = React.useState<any>(null);

  React.useEffect(() => {
    const monitor = getN8nMonitor();

    // Configurar listeners
    monitor.on('connected', () => setIsConnected(true));
    monitor.on('disconnected', () => setIsConnected(false));
    monitor.on('execution', (execution) => {
      setExecutions(prev => [execution, ...prev.slice(0, 49)]);
    });
    monitor.on('webhook', (webhook) => {
      setWebhooks(prev => [webhook, ...prev.slice(0, 49)]);
    });

    // Conectar
    monitor.connect().catch(console.error);

    // Cargar datos iniciales
    const loadInitialData = async () => {
      try {
        const [workflowsData, statsData] = await Promise.all([
          monitor.getActiveWorkflows(),
          monitor.getStatistics()
        ]);
        setWorkflows(workflowsData);
        setStatistics(statsData);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      }
    };

    loadInitialData();

    return () => {
      monitor.disconnect();
    };
  }, []);

  return {
    isConnected,
    workflows,
    executions,
    webhooks,
    statistics,
    monitor: getN8nMonitor()
  };
}

export default N8nMonitorService; 