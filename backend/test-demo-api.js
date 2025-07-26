const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing Demo API Endpoints\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data.message);
    
    // Test workflows
    console.log('\n2. Testing workflows endpoint...');
    const workflows = await axios.get(`${BASE_URL}/api/workflows`);
    console.log('✅ Workflows loaded:', workflows.data.workflows.length);
    
    // Test comments
    console.log('\n3. Testing comments endpoint...');
    const comments = await axios.get(`${BASE_URL}/api/instagram/comments`);
    console.log('✅ Comments loaded:', comments.data.comments.length);
    
    // Test stats
    console.log('\n4. Testing stats endpoint...');
    const stats = await axios.get(`${BASE_URL}/api/stats`);
    console.log('✅ Stats:', stats.data.stats);
    
    // Test creating a new comment
    console.log('\n5. Testing new comment simulation...');
    const newComment = await axios.post(`${BASE_URL}/api/demo/new-comment`, {
      username: 'test_user',
      text: 'Hey, can I get more info about this?'
    });
    console.log('✅ New comment result:', newComment.data.message);
    
    console.log('\n🎉 All API endpoints working perfectly!');
    console.log('\n📋 Your demo backend is ready for:');
    console.log('   - Frontend integration');
    console.log('   - Portfolio demonstration');
    console.log('   - Project submission');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the demo server is running:');
      console.log('   npm run demo');
    }
  }
}

testAPI();