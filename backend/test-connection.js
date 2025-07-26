const http = require('http');

function testConnection() {
  console.log('🔍 Testing Backend Connection...\n');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Connection successful!');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      console.log('\n🎉 Backend is running and responding!');
      console.log('Frontend can now connect to: http://localhost:5000');
    });
  });

  req.on('error', (err) => {
    console.error('❌ Connection failed:', err.message);
    console.log('\n💡 Make sure backend is running:');
    console.log('   node demo-server.js');
  });

  req.on('timeout', () => {
    console.error('❌ Connection timeout');
    req.destroy();
  });

  req.end();
}

testConnection();