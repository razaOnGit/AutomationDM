require('dotenv').config();
const express = require('express');

console.log('Testing minimal Express setup...');

try {
  const app = express();
  
  app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
  });
  
  console.log('✅ Basic Express setup working');
  
  // Test route mounting
  const testRouter = express.Router();
  testRouter.get('/hello', (req, res) => {
    res.json({ message: 'Hello from router' });
  });
  
  app.use('/api/test', testRouter);
  console.log('✅ Router mounting working');
  
  // Test server start
  const server = app.listen(5001, () => {
    console.log('✅ Server started on port 5001');
    server.close(() => {
      console.log('✅ Server closed successfully');
      console.log('🎉 Minimal test passed - Express is working');
    });
  });
  
} catch (error) {
  console.error('❌ Minimal test failed:', error.message);
}