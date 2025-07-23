const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class SocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.facebookUserId = decoded.facebookUserId;
        
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.setupEventHandlers();
    
    logger.info('Socket.io server initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      
      // Add socket to user's socket set
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(socket.id);

      logger.info(`User ${userId} connected with socket ${socket.id}`);

      // Join user to their personal room
      socket.join(`user:${userId}`);

      // Handle workflow subscription
      socket.on('subscribe_workflow', (workflowId) => {
        socket.join(`workflow:${workflowId}`);
        logger.info(`Socket ${socket.id} subscribed to workflow ${workflowId}`);
      });

      // Handle workflow unsubscription
      socket.on('unsubscribe_workflow', (workflowId) => {
        socket.leave(`workflow:${workflowId}`);
        logger.info(`Socket ${socket.id} unsubscribed from workflow ${workflowId}`);
      });

      // Handle real-time workflow status requests
      socket.on('get_workflow_status', async (workflowId) => {
        try {
          const Workflow = require('../models/Workflow');
          const workflow = await Workflow.findOne({ 
            _id: workflowId, 
            userId: userId 
          });

          if (workflow) {
            socket.emit('workflow_status', {
              workflowId,
              status: workflow.status,
              statistics: workflow.statistics
            });
          } else {
            socket.emit('error', { message: 'Workflow not found' });
          }
        } catch (error) {
          logger.error('Error getting workflow status:', error);
          socket.emit('error', { message: 'Failed to get workflow status' });
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`User ${userId} disconnected: ${reason}`);
        
        // Remove socket from user's socket set
        if (this.userSockets.has(userId)) {
          this.userSockets.get(userId).delete(socket.id);
          
          // Remove user entry if no more sockets
          if (this.userSockets.get(userId).size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to Instagram Automation Server',
        userId: userId,
        socketId: socket.id
      });
    });
  }

  // Emit event to specific user
  emitToUser(userId, event, data) {
    try {
      this.io.to(`user:${userId}`).emit(event, data);
      logger.debug(`Emitted ${event} to user ${userId}`, { dataSize: JSON.stringify(data).length });
    } catch (error) {
      logger.error('Error emitting to user:', error);
    }
  }

  // Emit event to specific workflow subscribers
  emitToWorkflow(workflowId, event, data) {
    try {
      this.io.to(`workflow:${workflowId}`).emit(event, data);
      logger.debug(`Emitted ${event} to workflow ${workflowId}`, { dataSize: JSON.stringify(data).length });
    } catch (error) {
      logger.error('Error emitting to workflow:', error);
    }
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    try {
      this.io.emit(event, data);
      logger.debug(`Broadcasted ${event} to all users`, { dataSize: JSON.stringify(data).length });
    } catch (error) {
      logger.error('Error broadcasting:', error);
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      authenticatedUsers: this.userSockets.size,
      userConnections: Array.from(this.userSockets.entries()).map(([userId, sockets]) => ({
        userId,
        socketCount: sockets.size
      }))
    };
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }

  // Disconnect user (for admin purposes)
  disconnectUser(userId, reason = 'Admin disconnect') {
    if (this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      sockets.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(reason);
        }
      });
      logger.info(`Disconnected user ${userId}: ${reason}`);
    }
  }
}

module.exports = new SocketManager();