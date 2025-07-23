// Simplified development server
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Instagram Comment-to-DM Backend (Dev Mode)'
  });
});

// Load routes one by one to identify issues
try {
  console.log('Loading auth routes...');
  app.use('/api/auth', require('./src/routes/auth'));
  console.log('✅ Auth routes loaded');

  console.log('Loading workflow routes...');
  app.use('/api/workflows', require('./src/routes/workflows'));
  console.log('✅ Workflow routes loaded');

  console.log('Loading instagram routes...');
  app.use('/api/instagram', require('./src/routes/instagram'));
  console.log('✅ Instagram routes loaded');

  console.log('Loading webhook routes...');
  app.use('/api/webhooks', require('./src/routes/webhooks'));
  console.log('✅ Webhook routes loaded');

} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  process.exit(1);
}

// Error handlers
app.use(require('./src/middleware/errorHandler'));
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Create HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 Development server running on port ${PORT}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📝 Mode: Development`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});