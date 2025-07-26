require('dotenv').config();

console.log('🔧 Instagram API Configuration Test\n');

const config = {
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? '✅ Set' : '❌ Missing',
    INSTAGRAM_GRAPH_API_VERSION: process.env.INSTAGRAM_GRAPH_API_VERSION,
    WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN ? '✅ Set' : '❌ Missing'
};

console.log('Configuration Status:');
Object.entries(config).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
});

console.log('\n📋 Next Steps:');
console.log('1. Verify App Secret in Facebook Developer Console');
console.log('2. Configure Instagram Basic Display redirect URIs');
console.log('3. Set up webhooks if needed');
console.log('4. Test the connection with: node test-connection.js');