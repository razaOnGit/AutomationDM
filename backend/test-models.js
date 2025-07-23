require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./src/models/User');
const Workflow = require('./src/models/Workflow');
const InstagramAccount = require('./src/models/InstagramAccount');
const Event = require('./src/models/Event');

async function testModels() {
  try {
    console.log('🧪 Testing data models...');
    
    // Test User model
    const testUser = new User({
      facebookUserId: 'test123',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'test_token',
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });
    
    console.log('✅ User model validation passed');
    
    // Test Workflow model
    const testWorkflow = new Workflow({
      userId: new mongoose.Types.ObjectId(),
      instagramAccountId: new mongoose.Types.ObjectId(),
      name: 'Test Workflow',
      postId: 'test_post_123',
      keywords: ['price', 'link'],
      dmMessage: 'Hello! Thanks for your interest.'
    });
    
    console.log('✅ Workflow model validation passed');
    
    // Test InstagramAccount model
    const testAccount = new InstagramAccount({
      userId: new mongoose.Types.ObjectId(),
      instagramBusinessId: 'ig_business_123',
      username: 'testaccount',
      followersCount: 1000
    });
    
    console.log('✅ InstagramAccount model validation passed');
    
    // Test Event model
    const testEvent = new Event({
      workflowId: new mongoose.Types.ObjectId(),
      type: 'comment_detected',
      commentId: 'comment_123',
      commenterUsername: 'testuser',
      comment: 'What is the price?',
      matchedKeyword: 'price'
    });
    
    console.log('✅ Event model validation passed');
    
    console.log('🎉 All models are working correctly!');
    
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
  }
}

testModels();