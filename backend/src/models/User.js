const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  facebookUserId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  accessToken: {
    type: String,
    required: true
  },
  tokenExpiresAt: {
    type: Date,
    required: true
  },
  instagramAccounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstagramAccount'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ facebookUserId: 1 });
userSchema.index({ email: 1 });

// Instance methods
userSchema.methods.isTokenExpired = function() {
  return new Date() > this.tokenExpiresAt;
};

userSchema.methods.updateToken = function(accessToken, expiresIn = 60 * 24 * 60 * 60 * 1000) {
  this.accessToken = accessToken;
  this.tokenExpiresAt = new Date(Date.now() + expiresIn);
  return this.save();
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.accessToken; // Don't expose access token in JSON responses
  return user;
};

// Static methods
userSchema.statics.findByFacebookId = function(facebookUserId) {
  return this.findOne({ facebookUserId });
};

userSchema.statics.createOrUpdate = async function(userData) {
  const { facebookUserId, accessToken, ...otherData } = userData;
  
  let user = await this.findByFacebookId(facebookUserId);
  
  if (user) {
    // Update existing user
    Object.assign(user, otherData);
    await user.updateToken(accessToken);
  } else {
    // Create new user
    user = new this({
      facebookUserId,
      accessToken,
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      ...otherData
    });
    await user.save();
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);