// Main Express application setup
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const commentMonitor = require('./services/commentMonitor');
    const socketManager = require('./websocket');
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check monitoring service
    const monitoringStatus = commentMonitor.getMonitoringStatus();
    
    // Check WebSocket connections
    const socketStats = socketManager.getStats();
    
    // System uptime
    const uptime = process.uptime();
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Instagram Comment-to-DM Backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: {
        seconds: Math.floor(uptime),
        human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      database: {
        status: dbStatus,
        name: 'MongoDB'
      },
      monitoring: {
        activeWorkflows: monitoringStatus.activeMonitors,
        processedComments: monitoringStatus.processedCommentsCount
      },
      websocket: {
        totalConnections: socketStats.totalConnections,
        authenticatedUsers: socketStats.authenticatedUsers
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    res.status(200).json(healthData);
    
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'Instagram Comment-to-DM Backend',
      error: error.message
    });
  }
});

// Detailed system status endpoint
app.get('/status', async (req, res) => {
  try {
    const commentMonitor = require('./services/commentMonitor');
    const socketManager = require('./websocket');
    const Workflow = require('./models/Workflow');
    const User = require('./models/User');
    
    // Get workflow statistics
    const workflowStats = await Workflow.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get user count
    const userCount = await User.countDocuments({ isActive: true });
    
    // Get monitoring details
    const monitoringStatus = commentMonitor.getMonitoringStatus();
    
    // Get socket details
    const socketStats = socketManager.getStats();
    
    const statusData = {
      timestamp: new Date().toISOString(),
      service: 'Instagram Comment-to-DM Backend',
      users: {
        total: userCount,
        active: userCount
      },
      workflows: workflowStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        acc.total = (acc.total || 0) + stat.count;
        return acc;
      }, {}),
      monitoring: {
        activeMonitors: monitoringStatus.activeMonitors,
        processedComments: monitoringStatus.processedCommentsCount,
        monitoredWorkflows: monitoringStatus.monitoredWorkflows
      },
      websocket: {
        totalConnections: socketStats.totalConnections,
        authenticatedUsers: socketStats.authenticatedUsers,
        userConnections: socketStats.userConnections
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    res.json(statusData);
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get system status',
      message: error.message
    });
  }
});

// API routes will be added here
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/api/instagram', require('./routes/instagram'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Global error handler
app.use(require('./middleware/errorHandler'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;