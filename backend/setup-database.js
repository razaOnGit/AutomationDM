require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');

// Import models to ensure they're registered
const User = require('./src/models/User');
const Workflow = require('./src/models/Workflow');
const InstagramAccount = require('./src/models/InstagramAccount');
const Event = require('./src/models/Event');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up MongoDB database...\n');

    // Check if MONGODB_URI is configured
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in .env file');
      console.log('📝 Please add MONGODB_URI to your .env file:');
      console.log('   MONGODB_URI=mongodb://localhost:27017/instagram_automation');
      console.log('   OR for MongoDB Atlas:');
      console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/instagram_automation');
      return;
    }

    console.log(`📡 Connecting to: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Test database operations
    console.log('\n🧪 Testing database operations...');

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`, collections.map(c => c.name));

    // Test model operations
    console.log('\n🔍 Testing model operations...');
    
    // Test User model
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);

    // Test Workflow model
    const workflowCount = await Workflow.countDocuments();
    console.log(`⚙️  Workflows in database: ${workflowCount}`);

    // Test InstagramAccount model
    const accountCount = await InstagramAccount.countDocuments();
    console.log(`📱 Instagram accounts in database: ${accountCount}`);

    // Test Event model
    const eventCount = await Event.countDocuments();
    console.log(`📝 Events in database: ${eventCount}`);

    console.log('\n✅ Database setup completed successfully!');
    console.log('🚀 Your backend is ready to connect to MongoDB');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Make sure MongoDB is running locally');
      console.log('   2. Or use MongoDB Atlas (cloud database)');
      console.log('   3. Check your MONGODB_URI in .env file');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication issue:');
      console.log('   1. Check username/password in MONGODB_URI');
      console.log('   2. Ensure database user has proper permissions');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

setupDatabase();