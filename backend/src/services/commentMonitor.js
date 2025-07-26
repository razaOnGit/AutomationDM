const Workflow = require('../models/Workflow');
const instagramAPI = require('./instagramAPI');
const dmService = require('./dmService');

class CommentMonitor {
  constructor() {
    this.monitoringTasks = new Map();
    this.processedComments = new Set();
  }

  // Start monitoring a workflow
  startMonitoring(workflow) {
    const workflowId = workflow._id.toString();

    // Stop existing monitoring if running
    if (this.monitoringTasks.has(workflowId)) {
      this.stopMonitoring(workflowId);
    }

    console.log(`🔍 Starting comment monitoring for workflow ${workflowId} on post ${workflow.postId}`);
    console.log(`📝 Watching for keywords: ${workflow.keywords.join(', ')}`);

    // Check comments every 30 seconds
    const interval = setInterval(async () => {
      await this.checkComments(workflow);
    }, 30000);

    this.monitoringTasks.set(workflowId, interval);

    // Do initial check immediately
    this.checkComments(workflow);
  }

  // Stop monitoring a workflow
  stopMonitoring(workflowId) {
    if (this.monitoringTasks.has(workflowId)) {
      clearInterval(this.monitoringTasks.get(workflowId));
      this.monitoringTasks.delete(workflowId);
      console.log(`⏹️ Stopped monitoring workflow ${workflowId}`);
    }
  }

  // Check for new comments
  async checkComments(workflow) {
    try {
      console.log(`🔍 Checking comments for post ${workflow.postId}...`);

      // Get comments from Instagram API (or mock data for testing)
      const comments = await this.getCommentsForPost(workflow.postId);

      for (const comment of comments) {
        await this.processComment(comment, workflow);
      }

    } catch (error) {
      console.error(`❌ Error checking comments for workflow ${workflow._id}:`, error.message);
    }
  }

  // Process individual comment
  async processComment(comment, workflow) {
    const commentKey = `${workflow._id}-${comment.id}`;

    // Skip if already processed
    if (this.processedComments.has(commentKey)) {
      return;
    }

    console.log(`💬 Processing comment: "${comment.text}" by @${comment.username}`);

    // Check if comment matches keywords
    const matchedKeyword = this.checkKeywordMatch(comment.text, workflow.keywords);

    if (matchedKeyword) {
      this.processedComments.add(commentKey);

      console.log(`🎯 KEYWORD MATCH! "${comment.text}" matched "${matchedKeyword}"`);

      // Update workflow stats
      await workflow.incrementStats('comment');

      // Send DM
      const dmResult = await dmService.sendDM(workflow, comment);

      if (dmResult.success) {
        await workflow.incrementStats('dm');
        console.log(`✅ DM sent to @${comment.username}: "${dmResult.message}"`);
      } else {
        console.log(`❌ Failed to send DM to @${comment.username}: ${dmResult.error}`);
      }
    }
  }

  // Check if comment matches keywords
  checkKeywordMatch(commentText, keywords) {
    if (!commentText || !keywords) return null;

    const text = commentText.toLowerCase();

    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }

    return null;
  }

  // Get comments for a post (mock data for now)
  async getCommentsForPost(postId) {
    // For testing, return mock comments
    // In production, this would call Instagram API
    const mockComments = [
      {
        id: `comment_${Date.now()}_1`,
        text: 'What is the price for this?',
        username: 'user123',
        timestamp: new Date().toISOString()
      },
      {
        id: `comment_${Date.now()}_2`,
        text: 'How much does it cost?',
        username: 'buyer456',
        timestamp: new Date().toISOString()
      },
      {
        id: `comment_${Date.now()}_3`,
        text: 'Nice post!',
        username: 'fan789',
        timestamp: new Date().toISOString()
      }
    ];

    // Simulate random new comments (for testing)
    if (Math.random() > 0.7) {
      return [mockComments[Math.floor(Math.random() * mockComments.length)]];
    }

    return [];
  }

  // Start all active workflows
  async startAllActive() {
    try {
      const activeWorkflows = await Workflow.findActive();
      
      for (const workflow of activeWorkflows) {
        this.startMonitoring(workflow);
      }

      console.log(`🚀 Started monitoring ${activeWorkflows.length} active workflows`);
    } catch (error) {
      console.error('Error starting active workflows:', error);
    }
  }

  // Stop all monitoring
  stopAll() {
    this.monitoringTasks.forEach((interval, workflowId) => {
      clearInterval(interval);
    });
    
    this.monitoringTasks.clear();
    this.processedComments.clear();
    
    console.log('⏹️ Stopped all comment monitoring');
  }
}

module.exports = new CommentMonitor();