require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB Connection...\n');
    
    // Test connection
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Test database operations
    console.log('\n🧪 Testing database operations...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 Database has ${collections.length} collections`);
    
    // Test models
    const User = require('./src/models/User');
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);
    
    console.log('\n🎉 MongoDB is fully connected and working!');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

testConnection();