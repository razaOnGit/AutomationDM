import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Connect to WebSocket server
  connect() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn('No auth token found, cannot connect to WebSocket');
      return;
    }

    this.socket = io(wsUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  // Set up socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection-status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection-status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Workflow-related events
    this.socket.on('workflow-activated', (data) => {
      console.log('🚀 Workflow activated:', data);
      this.emit('workflow-activated', data);
    });

    this.socket.on('comment-detected', (data) => {
      console.log('💬 Comment detected:', data);
      this.emit('comment-detected', data);
    });

    this.socket.on('dm-sent', (data) => {
      console.log('📩 DM sent:', data);
      this.emit('dm-sent', data);
    });

    this.socket.on('workflow-stats', (data) => {
      console.log('📊 Workflow stats updated:', data);
      this.emit('workflow-stats', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  // Handle reconnection logic
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max-reconnect-attempts-reached');
    }
  }

  // Subscribe to workflow events
  subscribeToWorkflow(workflowId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-workflow', workflowId);
      console.log(`📡 Subscribed to workflow: ${workflowId}`);
    }
  }

  // Unsubscribe from workflow events
  unsubscribeFromWorkflow(workflowId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-workflow', workflowId);
      console.log(`📡 Unsubscribed from workflow: ${workflowId}`);
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('WebSocket disconnected manually');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: !!this.socket
    };
  }

  // Send custom event to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot send WebSocket event: not connected');
    }
  }
}

// Create and export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;