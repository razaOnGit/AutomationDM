require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testWebhook() {
  try {
    console.log('🧪 Testing Webhook Setup...\n');

    // Test 1: Webhook verification (GET request)
    console.log('1. Testing webhook verification...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/webhooks/instagram`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': process.env.WEBHOOK_VERIFY_TOKEN,
        'hub.challenge': 'test_challenge_123'
      }
    });

    if (verifyResponse.data === 'test_challenge_123') {
      console.log('✅ Webhook verification working');
    } else {
      console.log('❌ Webhook verification failed');
    }

    // Test 2: Webhook event handling (POST request)
    console.log('\n2. Testing webhook event handling...');
    const eventResponse = await axios.post(`${BASE_URL}/api/webhooks/instagram`, {
      object: 'instagram',
      entry: [{
        id: 'test_entry_id',
        time: Date.now(),
        changes: [{
          field: 'comments',
          value: {
            id: 'test_comment_id',
            text: 'Test comment',
            created_time: new Date().toISOString()
          }
        }]
      }]
    });

    if (eventResponse.data === 'EVENT_RECEIVED') {
      console.log('✅ Webhook event handling working');
    } else {
      console.log('❌ Webhook event handling failed');
    }

    console.log('\n🎉 Webhook setup is working correctly!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start ngrok: ngrok http 5000');
    console.log('2. Copy the HTTPS URL from ngrok');
    console.log('3. Use that URL in Facebook Developer Console');
    console.log('4. Add /api/webhooks/instagram to the end');
    console.log(`5. Use verify token: ${process.env.WEBHOOK_VERIFY_TOKEN}`);

  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your backend server is running:');
      console.log('   npm run dev');
    }
  }
}

testWebhook();