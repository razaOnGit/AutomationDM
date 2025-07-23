const mongoose = require('mongoose');

const instagramAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  instagramBusinessId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Profile picture must be a valid URL'
    }
  },
  followersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isConnected: {
    type: Boolean,
    default: true
  },
  lastSyncAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for performance
instagramAccountSchema.index({ userId: 1, isConnected: 1 });

// Instance methods
instagramAccountSchema.methods.updateAccountInfo = function(accountData) {
  const { username, profilePicture, followersCount } = accountData;
  
  if (username) this.username = username;
  if (profilePicture) this.profilePicture = profilePicture;
  if (followersCount !== undefined) this.followersCount = followersCount;
  
  this.lastSyncAt = new Date();
  this.isConnected = true;
  
  return this.save();
};

instagramAccountSchema.methods.markDisconnected = function() {
  this.isConnected = false;
  return this.save();
};

// Static methods
instagramAccountSchema.statics.findByBusinessId = function(instagramBusinessId) {
  return this.findOne({ instagramBusinessId });
};

instagramAccountSchema.statics.findByUser = function(userId) {
  return this.find({ userId, isConnected: true });
};

module.exports = mongoose.model('InstagramAccount', instagramAccountSchema);