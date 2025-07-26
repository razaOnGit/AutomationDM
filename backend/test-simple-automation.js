// Simple test for Comment-to-DM automation
require('dotenv').config();
const mongoose = require('mongoose');
const Workflow = require('./src/models/Workflow');
const commentMonitor = require('./src/services/commentMonitor');

async function testCommentToDM() {
  try {
    console.log('🧪 Testing Comment-to-DM Automation\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-automation');
    console.log('✅ Connected to MongoDB');

    // Create a test workflow (simulating "Go Live" from frontend)
    const testWorkflow = new Workflow({
      name: 'Test Workflow - Price Keywords',
      postId: 'test_post_123',
      keywords: ['price', 'cost', 'how much'],
      dmMessage: 'Hey {username}! Thanks for asking about the price. Check out our link: {link}',
      linkUrl: 'https://example.com/product',
      openingDmEnabled: true
    });

    await testWorkflow.save();
    console.log('✅ Created test workflow:', testWorkflow._id);

    // Activate workflow
    await testWorkflow.activate();
    console.log('✅ Activated workflow');

    // Start monitoring (this will simulate finding comments with keywords)
    console.log('\n🔍 Starting comment monitoring...');
    commentMonitor.startMonitoring(testWorkflow);

    console.log('\n📝 The system is now monitoring for comments containing:');
    console.log('   - "price"');
    console.log('   - "cost"');
    console.log('   - "how much"');

    console.log('\n💬 Mock comments will be processed automatically...');
    console.log('⏰ Watch for keyword matches and DM sending in the logs above');

    // Let it run for 2 minutes to see the automation in action
    setTimeout(async () => {
      console.log('\n⏹️ Stopping test...');
      
      // Stop monitoring
      commentMonitor.stopMonitoring(testWorkflow._id);
      
      // Get final stats
      const finalWorkflow = await Workflow.findById(testWorkflow._id);
      console.log('\n📊 Final Statistics:');
      console.log(`   Comments detected: ${finalWorkflow.stats.commentsDetected}`);
      console.log(`   DMs sent: ${finalWorkflow.stats.dmsSent}`);
      
      // Clean up
      await Workflow.findByIdAndDelete(testWorkflow._id);
      console.log('🧹 Cleaned up test workflow');
      
      mongoose.connection.close();
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    }, 120000); // Run for 2 minutes

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  commentMonitor.stopAll();
  mongoose.connection.close();
  process.exit(0);
});

testCommentToDM();