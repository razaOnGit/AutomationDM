const crypto = require('crypto');

function generateWebhookToken() {
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  console.log('🔐 Generated Webhook Verify Token:');
  console.log('━'.repeat(50));
  console.log(token);
  console.log('━'.repeat(50));
  console.log('\n📝 Next Steps:');
  console.log('1. Copy the token above');
  console.log('2. Add it to your .env file as WEBHOOK_VERIFY_TOKEN');
  console.log('3. Use it in Facebook Developer Console');
  
  return token;
}

// Generate token
const token = generateWebhookToken();

// Show .env format
console.log('\n📄 Add this to your .env file:');
console.log(`WEBHOOK_VERIFY_TOKEN=${token}`);

console.log('\n🌐 Your webhook URL will be:');
console.log('Development: http://localhost:5000/api/webhooks/instagram');
console.log('Production: https://yourdomain.com/api/webhooks/instagram');