const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mainController = require('./controllers/mainController');
const commentMonitor = require('./services/commentMonitor');

const app = express();

// Middleware
app.use(cors());
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
  app.listen(PORT, () => {
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