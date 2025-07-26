require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 5000;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

console.log('🔧 Testing Webhook Endpoint\n');

// Test webhook verification (what Facebook will call)
async function testWebhookVerification() {
    try {
        const url = `http://localhost:${PORT}/api/webhooks/instagram`;
        const params = {
            'hub.mode': 'subscribe',
            'hub.verify_token': WEBHOOK_VERIFY_TOKEN,
            'hub.challenge': 'test_challenge_123'
        };
        
        console.log('Testing webhook verification...');
        console.log('URL:', url);
        console.log('Verify Token:', WEBHOOK_VERIFY_TOKEN);
        
        const response = await axios.get(url, { params });
        
        if (response.status === 200 && response.data === 'test_challenge_123') {
            console.log('✅ Webhook verification test PASSED');
            console.log('Response:', response.data);
        } else {
            console.log('❌ Webhook verification test FAILED');
            console.log('Status:', response.status);
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.log('❌ Webhook verification test FAILED');
        console.log('Error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure your server is running:');
            console.log('   npm run dev');
        }
    }
}

// Run the test
testWebhookVerification();