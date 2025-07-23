// Test environment variables loading
require('dotenv').config();

console.log('🔍 Testing environment variables...\n');

const envVars = [
  'PORT',
  'NODE_ENV', 
  'FRONTEND_URL',
  'MONGODB_URI',
  'JWT_SECRET',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'INSTAGRAM_GRAPH_API_VERSION',
  'WEBHOOK_VERIFY_TOKEN'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    // Hide sensitive values
    const displayValue = ['JWT_SECRET', 'FACEBOOK_APP_SECRET', 'MONGODB_URI'].includes(envVar) 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✅ ${envVar}: ${displayValue}`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
  }
});

console.log('\n🧪 Testing basic Express setup...');

try {
  const express = require('express');
  const app = express();
  
  app.get('/test', (req, res) => {
    res.json({ 
      message: 'Environment test successful',
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV
    });
  });
  
  const server = app.listen(5001, () => {
    console.log('✅ Basic server started on port 5001');
    server.close(() => {
      console.log('✅ Server closed successfully');
      console.log('🎉 Environment variables are working correctly!');
    });
  });
  
} catch (error) {
  console.error('❌ Environment test failed:', error.message);
}