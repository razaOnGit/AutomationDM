// Application entry point
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const socketManager = require('./src/websocket');
const commentMonitor = require('./src/services/commentMonitor');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
socketManager.initialize(server);

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop comment monitoring
  commentMonitor.stopAll();
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    require('mongoose').connection.close(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    // Connect to database
    try {
      await connectDB();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error.message);
      logger.info('Please ensure MongoDB is running or check your MONGODB_URI');
      // Don't exit in development, but log the issue
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
    
    // TODO: Start monitoring active workflows in later task
    // await commentMonitor.startAllActiveWorkflows();
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();