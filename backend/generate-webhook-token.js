const crypto = require('crypto');

// Generate a secure webhook verify token
function generateWebhookToken() {
    return crypto.randomBytes(32).toString('hex');
}

const newToken = generateWebhookToken();
console.log('New Webhook Verify Token:');
console.log(newToken);
console.log('\nAdd this to your .env file as WEBHOOK_VERIFY_TOKEN');