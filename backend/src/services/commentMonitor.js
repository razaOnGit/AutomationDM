const cron = require('node-cron');
const Workflow = require('../models/Workflow');
const User = require('../models/User');
const instagramAPI = require('./instagramAPI');
const dmService = require('./dmService');
const workflowService = require('./workflowService');
const socketManager = require('../websocket');
const logger = require('../utils/logger');

class CommentMonitor {
  constructor() {
    this.monitoringTasks = new Map();
    this.processedComments = new Set(); // Prevent duplicate processing
    this.lastCommentTimestamps = new Map(); // Track last processed comment time per workflow
  }

  // Start monitoring a specific workflow
  async startMonitoring(workflow) {
    try {
      const taskId = workflow._id.toString();

      // Stop existing task if running
      if (this.monitoringTasks.has(taskId)) {
        this.stopMonitoring(taskId);
      }

      // Create new monitoring task (every 30 seconds)
      const intervalMs = parseInt(process.env.IG_COMMENT_POLLING_INTERVAL) || 30000;
      const intervalSeconds = Math.floor(intervalMs / 1000);
      const task = cron.schedule(`*/${intervalSeconds} * * * * *`, async () => {
        await this.checkComments(workflow);
      }, { scheduled: false });

      this.monitoringTasks.set(taskId, task);
      task.start();

      logger.info(`Started monitoring workflow ${taskId} for post ${workflow.postId} (interval: ${intervalMs}ms)`);

    } catch (error) {
      logger.error('Error starting comment monitoring:', error);
      throw error;
    }
  }

  // Stop monitoring a workflow
  stopMonitoring(workflowId) {
    const taskId = workflowId.toString();

    if (this.monitoringTasks.has(taskId)) {
      const task = this.monitoringTasks.get(taskId);
      task.destroy();
      this.monitoringTasks.delete(taskId);
      
      // Clean up processed comments for this workflow
      this.cleanupProcessedComments(taskId);
      
      logger.info(`Stopped monitoring workflow ${taskId}`);
    }
  }

  // Check for new comments on a post
  async checkComments(workflow) {
    try {
      // Get user access token
      const user = await User.findById(workflow.userId);
      if (!user || !user.accessToken) {
        logger.error(`No access token found for user ${workflow.userId}`);
        return;
      }

      // Check if token is expired
      if (user.isTokenExpired()) {
        logger.warn(`Access token expired for user ${workflow.userId}, pausing workflow ${workflow._id}`);
        await workflow.pause();
        this.stopMonitoring(workflow._id);
        return;
      }

      // Get last processed timestamp for this workflow
      const workflowKey = workflow._id.toString();
      const lastTimestamp = this.lastCommentTimestamps.get(workflowKey);

      // Fetch recent comments
      const commentsData = await instagramAPI.getRecentComments(
        workflow.postId, 
        user.accessToken, 
        null, 
        50
      );

      if (!commentsData.data || commentsData.data.length === 0) {
        logger.debug(`No comments found for post ${workflow.postId}`);
        return;
      }

      // Filter new comments (only process comments newer than last processed)
      let newComments = commentsData.data;
      if (lastTimestamp) {
        newComments = commentsData.data.filter(comment => {
          const commentTime = new Date(comment.timestamp);
          return commentTime > lastTimestamp;
        });
      }

      if (newComments.length === 0) {
        logger.debug(`No new comments for workflow ${workflow._id}`);
        return;
      }

      logger.info(`Found ${newComments.length} new comments for workflow ${workflow._id}`);

      // Process each new comment
      let latestTimestamp = lastTimestamp;
      for (const comment of newComments) {
        const commentTime = new Date(comment.timestamp);
        if (!latestTimestamp || commentTime > latestTimestamp) {
          latestTimestamp = commentTime;
        }

        await this.processComment(comment, workflow, user.accessToken);
      }

      // Update last processed timestamp
      this.lastCommentTimestamps.set(workflowKey, latestTimestamp);

    } catch (error) {
      logger.error(`Error checking comments for workflow ${workflow._id}:`, error);

      // If it's an auth error, pause workflow
      if (error.message.includes('access token') || error.status === 401) {
        logger.warn(`Authentication error for workflow ${workflow._id}, pausing workflow`);
        await Workflow.findByIdAndUpdate(workflow._id, { status: 'paused' });
        this.stopMonitoring(workflow._id);
      }
    }
  }

  // Process individual comment
  async processComment(comment, workflow, accessToken) {
    try {
      const commentKey = `${workflow._id}-${comment.id}`;

      // Skip if already processed
      if (this.processedComments.has(commentKey)) {
        return;
      }

      logger.debug(`Processing comment ${comment.id} for workflow ${workflow._id}: "${comment.text}"`);

      // Check if comment matches keywords
      const matchedKeyword = this.checkKeywordMatch(comment.text, workflow.keywords, workflow.settings);

      if (matchedKeyword) {
        this.processedComments.add(commentKey);

        logger.info(`Keyword match found! Comment: "${comment.text}" matched keyword: "${matchedKeyword}"`);

        // Log the trigger event
        const Event = require('../models/Event');
        await Event.logCommentDetected(workflow._id, {
          ...comment,
          matchedKeyword
        });

        // Send DM
        const dmResult = await dmService.sendDM(workflow, comment, accessToken);

        // Log DM result
        if (dmResult.success) {
          await Event.logDmSent(workflow._id, comment, dmResult.dmId);
          
          // Update workflow statistics
          await workflowService.updateWorkflowStats(workflow._id, {
            'statistics.totalTriggers': 1,
            'statistics.dmsSent': 1
          });

          logger.info(`DM sent successfully to @${comment.username} (ID: ${dmResult.dmId})`);

        } else if (dmResult.skipped) {
          logger.info(`DM skipped for @${comment.username}: ${dmResult.reason}`);
          
          // Still count as trigger even if skipped
          await workflowService.updateWorkflowStats(workflow._id, {
            'statistics.totalTriggers': 1
          });

        } else {
          await Event.logDmFailed(workflow._id, comment, new Error(dmResult.error));
          logger.error(`DM failed for @${comment.username}: ${dmResult.error}`);
        }

        // Send real-time update to frontend
        socketManager.emitToUser(workflow.userId.toString(), 'workflow_triggered', {
          workflowId: workflow._id,
          comment: {
            id: comment.id,
            text: comment.text,
            username: comment.username,
            timestamp: comment.timestamp
          },
          matchedKeyword,
          dmSent: dmResult.success,
          dmSkipped: dmResult.skipped,
          skipReason: dmResult.reason,
          error: dmResult.error
        });

      } else {
        logger.debug(`No keyword match for comment: "${comment.text}"`);
      }

    } catch (error) {
      logger.error('Error processing comment:', {
        commentId: comment.id,
        workflowId: workflow._id,
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Check if comment matches any keywords
  checkKeywordMatch(commentText, keywords, settings = {}) {
    if (!commentText || !keywords || keywords.length === 0) {
      return null;
    }

    const text = settings.caseSensitive ? commentText : commentText.toLowerCase();

    for (const keyword of keywords) {
      const searchKeyword = settings.caseSensitive ? keyword : keyword.toLowerCase();

      if (settings.exactMatch) {
        // Exact word match using word boundaries
        const wordBoundaryRegex = new RegExp(`\\b${searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (wordBoundaryRegex.test(text)) {
          return keyword;
        }
      } else {
        // Substring match
        if (text.includes(searchKeyword)) {
          return keyword;
        }
      }
    }

    return null;
  }

  // Start all active workflows
  async startAllActiveWorkflows() {
    try {
      const activeWorkflows = await Workflow.find({ status: 'active' })
        .populate('userId');

      for (const workflow of activeWorkflows) {
        await this.startMonitoring(workflow);
      }

      logger.info(`Started monitoring ${activeWorkflows.length} active workflows`);

    } catch (error) {
      logger.error('Error starting active workflows:', error);
    }
  }

  // Stop all monitoring tasks
  stopAll() {
    this.monitoringTasks.forEach((task, workflowId) => {
      task.destroy();
    });
    
    this.monitoringTasks.clear();
    this.processedComments.clear();
    this.lastCommentTimestamps.clear();
    
    logger.info('Stopped all comment monitoring tasks');
  }

  // Clean up processed comments for a specific workflow
  cleanupProcessedComments(workflowId) {
    const keysToDelete = [];
    for (const key of this.processedComments) {
      if (key.startsWith(`${workflowId}-`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.processedComments.delete(key));
    this.lastCommentTimestamps.delete(workflowId);
  }

  // Get monitoring status
  getMonitoringStatus() {
    return {
      activeMonitors: this.monitoringTasks.size,
      processedCommentsCount: this.processedComments.size,
      monitoredWorkflows: Array.from(this.monitoringTasks.keys())
    };
  }

  // Manual comment check (for testing)
  async manualCheck(workflowId) {
    try {
      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status !== 'active') {
        throw new Error('Workflow is not active');
      }

      await this.checkComments(workflow);
      return { success: true, message: 'Manual check completed' };

    } catch (error) {
      logger.error('Manual check failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CommentMonitor();