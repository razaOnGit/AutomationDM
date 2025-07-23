const Workflow = require('../models/Workflow');
const Event = require('../models/Event');
const instagramAPI = require('./instagramAPI');
const commentMonitor = require('./commentMonitor');
const logger = require('../utils/logger');

class WorkflowService {
  // Create new workflow
  async createWorkflow(userId, workflowData) {
    try {
      const workflow = new Workflow({
        userId,
        ...workflowData,
        status: 'draft'
      });

      await workflow.save();

      // Log workflow creation
      await this.logEvent(workflow._id, 'workflow_created', {
        message: 'Workflow created successfully'
      });

      logger.info(`Workflow created: ${workflow._id} for user ${userId}`);
      return workflow;

    } catch (error) {
      logger.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Activate workflow (Go Live)
  async activateWorkflow(workflowId, userId) {
    try {
      const workflow = await Workflow.findOne({ _id: workflowId, userId });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status === 'active') {
        throw new Error('Workflow is already active');
      }

      // Validate workflow before activation
      await this.validateWorkflow(workflow);

      // Update status
      workflow.status = 'active';
      await workflow.save();

      // Start monitoring comments
      await commentMonitor.startMonitoring(workflow);

      // Log activation
      await Event.logWorkflowStatusChange(workflow._id, 'active', {
        message: 'Workflow activated and monitoring started',
        activatedBy: userId
      });

      logger.info(`Workflow activated: ${workflowId} by user ${userId}`);
      return workflow;

    } catch (error) {
      logger.error('Error activating workflow:', error);
      throw error;
    }
  }

  // Stop workflow
  async stopWorkflow(workflowId, userId) {
    try {
      const workflow = await Workflow.findOne({ _id: workflowId, userId });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status === 'stopped') {
        throw new Error('Workflow is already stopped');
      }

      workflow.status = 'stopped';
      await workflow.save();

      // Stop monitoring
      commentMonitor.stopMonitoring(workflowId);

      // Log deactivation
      await Event.logWorkflowStatusChange(workflow._id, 'stopped', {
        message: 'Workflow stopped and monitoring ended',
        stoppedBy: userId
      });

      logger.info(`Workflow stopped: ${workflowId} by user ${userId}`);
      return workflow;

    } catch (error) {
      logger.error('Error stopping workflow:', error);
      throw error;
    }
  }

  // Validate workflow configuration
  async validateWorkflow(workflow) {
    const errors = [];

    // Basic field validation
    if (!workflow.postId) {
      errors.push('Post ID is required');
    }

    if (!workflow.keywords || workflow.keywords.length === 0) {
      errors.push('At least one keyword is required');
    }

    if (!workflow.dmMessage || workflow.dmMessage.trim().length === 0) {
      errors.push('DM message is required');
    }

    if (workflow.dmMessage && workflow.dmMessage.length > 1000) {
      errors.push('DM message is too long (max 1000 characters)');
    }

    // Validate keywords
    if (workflow.keywords) {
      workflow.keywords.forEach((keyword, index) => {
        if (!keyword || keyword.trim().length === 0) {
          errors.push(`Keyword ${index + 1} cannot be empty`);
        }
        if (keyword.length > 50) {
          errors.push(`Keyword ${index + 1} is too long (max 50 characters)`);
        }
      });
    }

    // Validate URL if provided
    if (workflow.linkUrl) {
      try {
        new URL(workflow.linkUrl);
      } catch (e) {
        errors.push('Link URL must be a valid URL');
      }
    }

    // Validate settings
    if (workflow.settings) {
      if (workflow.settings.maxDmsPerDay < 1 || workflow.settings.maxDmsPerDay > 1000) {
        errors.push('Max DMs per day must be between 1 and 1000');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Workflow validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  // Get workflow statistics
  async getWorkflowStats(workflowId) {
    try {
      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Get events from database
      const events = await Event.find({ workflowId }).sort({ createdAt: -1 });

      // Calculate statistics
      const stats = {
        totalTriggers: events.filter(e => e.type === 'comment_detected').length,
        dmsSent: events.filter(e => e.type === 'dm_sent').length,
        dmsDelivered: events.filter(e => e.dmStatus === 'delivered').length,
        dmsFailed: events.filter(e => e.type === 'dm_failed').length,
        lastActivity: events.length > 0 ? events[0].createdAt : null,
        recentEvents: events.slice(0, 10),
        
        // Performance metrics
        successRate: 0,
        averageResponseTime: null,
        
        // Workflow info
        status: workflow.status,
        createdAt: workflow.createdAt,
        lastTriggered: workflow.statistics.lastTriggered
      };

      // Calculate success rate
      if (stats.totalTriggers > 0) {
        stats.successRate = (stats.dmsSent / stats.totalTriggers * 100).toFixed(2);
      }

      // Get keyword performance
      const keywordStats = {};
      events.filter(e => e.matchedKeyword).forEach(event => {
        const keyword = event.matchedKeyword;
        if (!keywordStats[keyword]) {
          keywordStats[keyword] = { triggers: 0, dmsSent: 0 };
        }
        keywordStats[keyword].triggers++;
        if (event.type === 'dm_sent') {
          keywordStats[keyword].dmsSent++;
        }
      });

      stats.keywordPerformance = keywordStats;

      return stats;

    } catch (error) {
      logger.error('Error getting workflow stats:', error);
      throw error;
    }
  }

  // Log workflow events
  async logEvent(workflowId, type, data = {}) {
    try {
      const event = new Event({
        workflowId,
        type,
        ...data
      });

      await event.save();
      return event;

    } catch (error) {
      logger.error('Error logging event:', error);
    }
  }

  // Update workflow statistics
  async updateWorkflowStats(workflowId, updateData) {
    try {
      await Workflow.findByIdAndUpdate(workflowId, {
        $inc: updateData,
        $set: { 'statistics.lastTriggered': new Date() }
      });

    } catch (error) {
      logger.error('Error updating workflow stats:', error);
    }
  }

  // Get active workflows for monitoring
  async getActiveWorkflows() {
    try {
      return await Workflow.find({ status: 'active' })
        .populate('userId instagramAccountId');

    } catch (error) {
      logger.error('Error getting active workflows:', error);
      return [];
    }
  }

  // Bulk update workflow statuses (for maintenance)
  async bulkUpdateStatus(workflowIds, newStatus, userId) {
    try {
      const result = await Workflow.updateMany(
        { _id: { $in: workflowIds }, userId },
        { status: newStatus }
      );

      // Log bulk update
      for (const workflowId of workflowIds) {
        await Event.logWorkflowStatusChange(workflowId, newStatus, {
          message: `Bulk status update to ${newStatus}`,
          updatedBy: userId
        });
      }

      logger.info(`Bulk updated ${result.modifiedCount} workflows to status: ${newStatus}`);
      return result;

    } catch (error) {
      logger.error('Error in bulk status update:', error);
      throw error;
    }
  }

  // Get workflow summary for dashboard
  async getWorkflowSummary(userId) {
    try {
      const summary = await Workflow.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalTriggers: { $sum: '$statistics.totalTriggers' },
            totalDmsSent: { $sum: '$statistics.dmsSent' }
          }
        }
      ]);

      const result = {
        total: 0,
        active: 0,
        draft: 0,
        stopped: 0,
        paused: 0,
        totalTriggers: 0,
        totalDmsSent: 0
      };

      summary.forEach(item => {
        result.total += item.count;
        result[item._id] = item.count;
        result.totalTriggers += item.totalTriggers || 0;
        result.totalDmsSent += item.totalDmsSent || 0;
      });

      return result;

    } catch (error) {
      logger.error('Error getting workflow summary:', error);
      throw error;
    }
  }
}

module.exports = new WorkflowService();