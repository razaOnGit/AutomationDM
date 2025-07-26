const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_API_URL = 'http://localhost:5000'; // This should match frontend .env

async function testFrontendBackendIntegration() {
  console.log('🔗 Testing Frontend-Backend Integration\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health check:', health.data.message);
    
    // Test 2: Demo login
    console.log('\n2. Testing demo login...');
    const demoLogin = await axios.post(`${BACKEND_URL}/api/auth/demo-login`);
    console.log('✅ Demo login:', demoLogin.data.message);
    console.log('   User:', demoLogin.data.user.username);
    
    // Test 3: Get workflows
    console.log('\n3. Testing workflows endpoint...');
    const workflows = await axios.get(`${BACKEND_URL}/api/workflows`);
    console.log('✅ Workflows:', workflows.data.workflows.length, 'workflows loaded');
    
    // Test 4: Get comments
    console.log('\n4. Testing comments endpoint...');
    const comments = await axios.get(`${BACKEND_URL}/api/instagram/comments`);
    console.log('✅ Comments:', comments.data.comments.length, 'comments loaded');
    
    // Test 5: Get stats
    console.log('\n5. Testing stats endpoint...');
    const stats = await axios.get(`${BACKEND_URL}/api/stats`);
    console.log('✅ Stats:', JSON.stringify(stats.data.stats, null, 2));
    
    // Test 6: Create new workflow
    console.log('\n6. Testing workflow creation...');
    const newWorkflow = await axios.post(`${BACKEND_URL}/api/workflows`, {
      name: 'Test Workflow',
      keyword: 'test',
      response: 'This is a test response!'
    });
    console.log('✅ New workflow created:', newWorkflow.data.workflow.name);
    
    // Test 7: Simulate new comment
    console.log('\n7. Testing comment simulation...');
    const newComment = await axios.post(`${BACKEND_URL}/api/demo/new-comment`, {
      username: 'test_user_integration',
      text: 'Hey, I need some test info please!'
    });
    console.log('✅ Comment simulation:', newComment.data.message);
    
    console.log('\n🎉 All integration tests passed!');
    console.log('\n📋 Frontend Connection Ready:');
    console.log(`   ✅ Backend running on: ${BACKEND_URL}`);
    console.log(`   ✅ Frontend should connect to: ${FRONTEND_API_URL}`);
    console.log(`   ✅ All API endpoints working`);
    console.log(`   ✅ Demo authentication working`);
    console.log(`   ✅ Workflow management working`);
    console.log(`   ✅ Comment processing working`);
    
    console.log('\n🚀 Ready to start frontend:');
    console.log('   cd frontend');
    console.log('   npm start');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend is running:');
      console.log('   cd backend');
      console.log('   node demo-server.js');
    } else if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testFrontendBackendIntegration();