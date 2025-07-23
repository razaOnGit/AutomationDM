import { io, Socket } from 'socket.io-client';

// WebSocket Configuration
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Connect to WebSocket server
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(WS_URL, {
          auth: {
            token: token,
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connected', (data: any) => {
          console.log('🎉 WebSocket authenticated:', data);
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('❌ WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason: any) => {
          console.log('🔌 WebSocket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            this.handleReconnect(token);
          }
        });

        this.socket.on('error', (error: any) => {
          console.error('❌ WebSocket error:', error);
        });

        // Handle authentication errors
        this.socket.on('auth_error', (error: any) => {
          console.error('🔐 WebSocket auth error:', error);
          this.disconnect();
          reject(new Error('Authentication failed'));
        });

      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  // Handle reconnection
  private handleReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      setTimeout(() => {
        this.connect(token).catch((error) => {
          console.error('❌ Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  // Subscribe to workflow events
  subscribeToWorkflow(workflowId: string): void {
    if (this.socket) {
      this.socket.emit('subscribe_workflow', workflowId);
      console.log(`📡 Subscribed to workflow: ${workflowId}`);
    }
  }

  // Unsubscribe from workflow events
  unsubscribeFromWorkflow(workflowId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe_workflow', workflowId);
      console.log(`📡 Unsubscribed from workflow: ${workflowId}`);
    }
  }

  // Get workflow status
  getWorkflowStatus(workflowId: string): void {
    if (this.socket) {
      this.socket.emit('get_workflow_status', workflowId);
    }
  }

  // Ping server
  ping(): void {
    if (this.socket) {
      this.socket.emit('ping');
    }
  }

  // Event listeners
  onWorkflowTriggered(callback: (data: WorkflowTriggeredEvent) => void): void {
    if (this.socket) {
      this.socket.on('workflow_triggered', callback);
    }
  }

  onWorkflowStatus(callback: (data: WorkflowStatusEvent) => void): void {
    if (this.socket) {
      this.socket.on('workflow_status', callback);
    }
  }

  onWorkflowStatsUpdated(callback: (data: WorkflowStatsEvent) => void): void {
    if (this.socket) {
      this.socket.on('workflow_stats_updated', callback);
    }
  }

  onPong(callback: () => void): void {
    if (this.socket) {
      this.socket.on('pong', callback);
    }
  }

  onError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Remove event listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Event Types
export interface WorkflowTriggeredEvent {
  workflowId: string;
  comment: {
    id: string;
    text: string;
    username: string;
    timestamp: string;
  };
  matchedKeyword: string;
  dmSent: boolean;
  dmSkipped?: boolean;
  skipReason?: string;
  error?: string;
}

export interface WorkflowStatusEvent {
  workflowId: string;
  status: 'draft' | 'active' | 'paused' | 'stopped';
  statistics: {
    totalTriggers: number;
    dmsSent: number;
    dmsDelivered: number;
    lastTriggered?: Date;
  };
}

export interface WorkflowStatsEvent {
  workflowId: string;
  stats: {
    totalTriggers: number;
    dmsSent: number;
    dmsDelivered: number;
    successRate: string;
  };
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;