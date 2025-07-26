const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mainController = require('./controllers/mainController');
const commentMonitor = require('./services/commentMonitor');

const app = express();

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS Debug - Incoming origin:', origin);
    console.log('🔍 CORS Debug - FRONTEND_URL env var:', process.env.FRONTEND_URL);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://automation-dm.vercel.app', // Hardcoded for immediate fix
      'https://automation-dm.vercel.app/', // With trailing slash
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash
      process.env.FRONTEND_URL?.replace(/([^/])$/, '$1/'), // Add trailing slash
      'http://localhost:3000'
    ].filter(Boolean); // Remove undefined values
    
    console.log('🔍 CORS Debug - Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes for frontend
app.post('/api/go-live', mainController.goLive);
app.post('/api/workflows/:id/stop', mainController.stopWorkflow);
app.get('/api/workflows/:id/stats', mainController.getStats);
app.get('/api/workflows', mainController.getWorkflows);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Comment-to-DM automation backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await connectDB();
  
  // Start monitoring any existing active workflows
  await commentMonitor.startAllActive();
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   POST /api/go-live - Start comment monitoring`);
    console.log(`   GET  /api/health - Health check`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  commentMonitor.stopAll();
  mongoose.connection.close();
  process.exit(0);
});

module.exports = { app, startServer };