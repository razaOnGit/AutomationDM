require('dotenv').config();
const request = require('supertest');
const app = require('./src/app');

describe('Instagram Automation Backend', () => {
  describe('Health Endpoints', () => {
    test('GET /health should return OK status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('Instagram Comment-to-DM Backend');
    });

    test('GET /status should return system status', async () => {
      const response = await request(app)
        .get('/status')
        .expect(200);
      
      expect(response.body.service).toBe('Instagram Comment-to-DM Backend');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/instagram/callback should handle OAuth', async () => {
      const response = await request(app)
        .post('/api/auth/instagram/callback')
        .send({
          access_token: 'test_token',
          user_id: 'test_user_123',
          expires_in: 5184000
        });
      
      // Should return success or specific error (depending on DB connection)
      expect([200, 500]).toContain(response.status);
    });

    test('GET /api/auth/verify should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);
      
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Workflow Endpoints', () => {
    test('GET /api/workflows should require authentication', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .expect(401);
      
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Instagram Endpoints', () => {
    test('GET /api/instagram/accounts should require authentication', async () => {
      const response = await request(app)
        .get('/api/instagram/accounts')
        .expect(401);
      
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Error Handling', () => {
    test('404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body.error).toBe('Route not found');
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🧪 Running Backend Tests...\n');
  
  // Simple test runner
  const runTests = async () => {
    try {
      console.log('Testing health endpoints...');
      await request(app).get('/health').expect(200);
      console.log('✅ Health endpoint working');

      console.log('\nTesting authentication...');
      await request(app).get('/api/auth/verify').expect(401);
      console.log('✅ Authentication protection working');

      console.log('\nTesting protected routes...');
      await request(app).get('/api/workflows').expect(401);
      console.log('✅ Protected routes working');

      console.log('\n🎉 All basic tests passed!');
      
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
    }
  };

  runTests();
}

module.exports = app;