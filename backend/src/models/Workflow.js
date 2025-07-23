const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  instagramAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstagramAccount',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  postId: {
    type: String,
    required: true,
    index: true
  },
  postData: {
    mediaUrl: String,
    caption: String,
    mediaType: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']
    },
    permalink: String
  },
  keywords: [{
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  }],
  dmMessage: {
    type: String,
    required: true,
    maxlength: 1000
  },
  linkUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Link URL must be a valid HTTP/HTTPS URL'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'stopped'],
    default: 'draft',
    index: true
  },
  statistics: {
    totalTriggers: {
      type: Number,
      default: 0,
      min: 0
    },
    dmsSent: {
      type: Number,
      default: 0,
      min: 0
    },
    dmsDelivered: {
      type: Number,
      default: 0,
      min: 0
    },
    lastTriggered: Date
  },
  settings: {
    caseSensitive: {
      type: Boolean,
      default: false
    },
    exactMatch: {
      type: Boolean,
      default: false
    },
    maxDmsPerDay: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000
    }
  }
}, {
  timestamps: true
});

// Compound indexes for performance
workflowSchema.index({ userId: 1, status: 1 });
workflowSchema.index({ postId: 1, status: 1 });

// Validation
workflowSchema.pre('save', function(next) {
  // Ensure keywords array is not empty
  if (!this.keywords || this.keywords.length === 0) {
    return next(new Error('At least one keyword is required'));
  }
  
  // Validate DM message
  if (!this.dmMessage || this.dmMessage.trim().length === 0) {
    return next(new Error('DM message is required'));
  }
  
  next();
});

// Instance methods
workflowSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

workflowSchema.methods.stop = function() {
  this.status = 'stopped';
  return this.save();
};

workflowSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

workflowSchema.methods.incrementTriggers = function() {
  this.statistics.totalTriggers += 1;
  this.statistics.lastTriggered = new Date();
  return this.save();
};

workflowSchema.methods.incrementDmsSent = function() {
  this.statistics.dmsSent += 1;
  return this.save();
};

workflowSchema.methods.incrementDmsDelivered = function() {
  this.statistics.dmsDelivered += 1;
  return this.save();
};

workflowSchema.methods.isActive = function() {
  return this.status === 'active';
};

workflowSchema.methods.canSendMoreDms = function() {
  // Check daily limit (simplified - would need more complex logic for actual daily tracking)
  return this.statistics.dmsSent < this.settings.maxDmsPerDay;
};

// Static methods
workflowSchema.statics.findActiveWorkflows = function() {
  return this.find({ status: 'active' }).populate('userId instagramAccountId');
};

workflowSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).populate('instagramAccountId');
};

workflowSchema.statics.findByPostId = function(postId) {
  return this.find({ postId, status: 'active' });
};

module.exports = mongoose.model('Workflow', workflowSchema);