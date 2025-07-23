const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'comment_detected',
      'dm_sent', 
      'dm_failed',
      'dm_delivered',
      'workflow_activated',
      'workflow_stopped',
      'workflow_paused'
    ],
    required: true,
    index: true
  },
  commentId: {
    type: String,
    index: true
  },
  commenterUsername: {
    type: String,
    trim: true
  },
  commenterUserId: {
    type: String,
    index: true
  },
  comment: {
    type: String,
    maxlength: 2200 // Instagram comment limit
  },
  matchedKeyword: {
    type: String,
    trim: true
  },
  dmStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'blocked'],
    default: 'pending'
  },
  dmId: {
    type: String,
    index: true
  },
  errorMessage: {
    type: String,
    maxlength: 500
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for performance
eventSchema.index({ workflowId: 1, type: 1 });
eventSchema.index({ workflowId: 1, createdAt: -1 });
eventSchema.index({ commentId: 1, workflowId: 1 });

// Static methods
eventSchema.statics.logCommentDetected = function(workflowId, commentData) {
  return this.create({
    workflowId,
    type: 'comment_detected',
    commentId: commentData.id,
    commenterUsername: commentData.username,
    commenterUserId: commentData.user?.id,
    comment: commentData.text,
    matchedKeyword: commentData.matchedKeyword,
    metadata: {
      timestamp: commentData.timestamp,
      permalink: commentData.permalink
    }
  });
};

eventSchema.statics.logDmSent = function(workflowId, commentData, dmId) {
  return this.create({
    workflowId,
    type: 'dm_sent',
    commentId: commentData.id,
    commenterUsername: commentData.username,
    commenterUserId: commentData.user?.id,
    dmId,
    dmStatus: 'sent',
    metadata: {
      message: commentData.dmMessage
    }
  });
};

eventSchema.statics.logDmFailed = function(workflowId, commentData, error) {
  return this.create({
    workflowId,
    type: 'dm_failed',
    commentId: commentData.id,
    commenterUsername: commentData.username,
    commenterUserId: commentData.user?.id,
    dmStatus: 'failed',
    errorMessage: error.message || 'Unknown error',
    metadata: {
      errorCode: error.code,
      errorType: error.type
    }
  });
};

eventSchema.statics.logWorkflowStatusChange = function(workflowId, status, metadata = {}) {
  const typeMap = {
    'active': 'workflow_activated',
    'stopped': 'workflow_stopped',
    'paused': 'workflow_paused'
  };
  
  return this.create({
    workflowId,
    type: typeMap[status] || 'workflow_activated',
    metadata
  });
};

eventSchema.statics.getWorkflowEvents = function(workflowId, limit = 50) {
  return this.find({ workflowId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

eventSchema.statics.getWorkflowStats = function(workflowId) {
  return this.aggregate([
    { $match: { workflowId: mongoose.Types.ObjectId(workflowId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastEvent: { $max: '$createdAt' }
      }
    }
  ]);
};

module.exports = mongoose.model('Event', eventSchema);