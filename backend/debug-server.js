require('dotenv').config();
const express = require('express');
const cors = require('cors');

console.log('🔍 Starting debug server...\n');

const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test basic route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Debug server working' });
});

console.log('✅ Basic setup complete');

// Try loading routes one by one
try {
  console.log('Loading auth routes...');
  const authRoutes = require('./src/routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  process.exit(1);
}

try {
  console.log('Loading webhook routes...');
  const webhookRoutes = require('./src/routes/webhooks');
  app.use('/api/webhooks', webhookRoutes);
  console.log('✅ Webhook routes loaded');
} catch (error) {
  console.error('❌ Error loading webhook routes:', error.message);
  process.exit(1);
}

try {
  console.log('Loading workflow routes...');
  const workflowRoutes = require('./src/routes/workflows');
  app.use('/api/workflows', workflowRoutes);
  console.log('✅ Workflow routes loaded');
} catch (error) {
  console.error('❌ Error loading workflow routes:', error.message);
  process.exit(1);
}

try {
  console.log('Loading instagram routes...');
  const instagramRoutes = require('./src/routes/instagram');
  app.use('/api/instagram', instagramRoutes);
  console.log('✅ Instagram routes loaded');
} catch (error) {
  console.error('❌ Error loading instagram routes:', error.message);
  process.exit(1);
}

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Debug server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/health`);
  console.log('\n✅ All routes loaded successfully!');
  console.log('Press Ctrl+C to stop');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down debug server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});