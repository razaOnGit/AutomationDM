require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAuth() {
  try {
    console.log('🧪 Testing Authentication System...\n');

    // Test 1: Instagram OAuth Callback
    console.log('1. Testing Instagram OAuth callback...');
    const authResponse = await axios.post(`${BASE_URL}/api/auth/instagram/callback`, {
      access_token: 'test_access_token_123',
      user_id: 'test_facebook_user_456',
      expires_in: 5184000 // 60 days
    });

    if (authResponse.data.success) {
      console.log('✅ OAuth callback successful');
      console.log(`   Token: ${authResponse.data.token.substring(0, 20)}...`);
      console.log(`   User ID: ${authResponse.data.user.id}`);
      
      const token = authResponse.data.token;

      // Test 2: Verify Token
      console.log('\n2. Testing token verification...');
      const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (verifyResponse.data.success) {
        console.log('✅ Token verification successful');
        console.log(`   User: ${verifyResponse.data.user.name || 'No name'}`);
      }

      // Test 3: Test protected route without token
      console.log('\n3. Testing protected route without token...');
      try {
        await axios.get(`${BASE_URL}/api/auth/verify`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ Protected route correctly rejected unauthorized request');
        }
      }

      console.log('\n🎉 All authentication tests passed!');

    } else {
      console.log('❌ OAuth callback failed');
    }

  } catch (error) {
    console.error('❌ Authentication test failed:', error.response?.data || error.message);
  }
}

// Start test server first, then run tests
setTimeout(testAuth, 2000);