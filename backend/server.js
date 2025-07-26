// Simple server entry point
require('dotenv').config();
const { startServer } = require('./src/app');

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});