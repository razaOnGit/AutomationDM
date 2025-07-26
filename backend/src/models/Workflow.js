const mongoose = require('mongoose');

// Simple workflow model that matches frontend needs
const workflowSchema = new mongoose.Schema({
  // Basic workflow info
  name: {
    type: String,
    required: true,
    default: function() {
      return `Workflow ${Date.now()}`;
    }
  },
  postId: {
    type: String,
    required: true
  },
  keywords: [{
    type: String,
    required: true,
    trim: true
  }],
  dmMessage: {
    type: String,
    required: true
  },
  dmWithLinkMessage: {
    type: String,
    default: ''
  },
  linkUrl: {
    type: String,
    default: ''
  },
  openingDmEnabled: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'stopped'],
    default: 'draft'
  },
  // Simple statistics
  stats: {
    commentsDetected: { type: Number, default: 0 },
    dmsSent: { type: Number, default: 0 },
    lastActivity: Date
  }
}, {
  timestamps: true
});

// Simple methods
workflowSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

workflowSchema.methods.stop = function() {
  this.status = 'stopped';
  return this.save();
};

workflowSchema.methods.incrementStats = function(type) {
  if (type === 'comment') {
    this.stats.commentsDetected += 1;
  } else if (type === 'dm') {
    this.stats.dmsSent += 1;
  }
  this.stats.lastActivity = new Date();
  return this.save();
};

// Find active workflows
workflowSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

module.exports = mongoose.model('Workflow', workflowSchema);