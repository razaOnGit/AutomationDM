const Workflow = require('../models/Workflow');
const InstagramAccount = require('../models/InstagramAccount');
const Event = require('../models/Event');
const workflowService = require('../services/workflowService');
const instagramAPI = require('../services/instagramAPI');
const logger = require('../utils/logger');

class WorkflowController {
  // Create new workflow
  async createWorkflow(req, res) {
    try {
      const userId = req.user.userId;
      const workflowData = req.body;

      // Validate required fields
      const { name, postId, keywords, dmMessage, instagramAccountId } = workflowData;
      
      if (!name || !postId || !keywords || !dmMessage || !instagramAccountId) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['name', 'postId', 'keywords', 'dmMessage', 'instagramAccountId']
        });
      }

      // Verify user owns the Instagram account
      const instagramAccount = await InstagramAccount.findOne({
        _id: instagramAccountId,
        userId: userId
      });

      if (!instagramAccount) {
        return res.status(403).json({
          error: 'Instagram account not found or access denied'
        });
      }

      // Create workflow using service
      const workflow = await workflowService.createWorkflow(userId, {
        ...workflowData,
        instagramAccountId
      });

      logger.info(`Workflow created: ${workflow._id} by user ${userId}`);

      res.status(201).json({
        success: true,
        workflow: await workflow.populate('instagramAccountId')
      });

    } catch (error) {
      logger.error('Error creating workflow:', error);
      res.status(500).json({
        error: 'Failed to create workflow',
        message: error.message
      });
    }
  }

  // Get all workflows for user
  async getWorkflows(req, res) {
    try {
      const userId = req.user.userId;
      const { status, limit = 50, offset = 0 } = req.query;

      let query = { userId };
      if (status) {
        query.status = status;
      }

      const workflows = await Workflow.find(query)
        .populate('instagramAccountId', 'username profilePicture')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await Workflow.countDocuments(query);

      res.json({
        success: true,
        workflows,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + workflows.length) < total
        }
      });

    } catch (error) {
      logger.error('Error fetching workflows:', error);
      res.status(500).json({
        error: 'Failed to fetch workflows',
        message: error.message
      });
    }
  }

  // Get specific workflow
  async getWorkflow(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const workflow = await Workflow.findOne({ _id: id, userId })
        .populate('instagramAccountId', 'username profilePicture followersCount');

      if (!workflow) {
        return res.status(404).json({
          error: 'Workflow not found'
        });
      }

      // Get recent events for this workflow
      const recentEvents = await Event.getWorkflowEvents(workflow._id, 10);

      res.json({
        success: true,
        workflow,
        recentEvents
      });

    } catch (error) {
      logger.error('Error fetching workflow:', error);
      res.status(500).json({
        error: 'Failed to fetch workflow',
        message: error.message
      });
    }
  }

  // Update workflow
  async updateWorkflow(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const updateData = req.body;

      // Find workflow
      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({
          error: 'Workflow not found'
        });
      }

      // Don't allow updating certain fields if workflow is active
      if (workflow.status === 'active') {
        const restrictedFields = ['postId', 'instagramAccountId'];
        const hasRestrictedUpdates = restrictedFields.some(field => updateData.hasOwnProperty(field));
        
        if (hasRestrictedUpdates) {
          return res.status(400).json({
            error: 'Cannot update postId or instagramAccountId while workflow is active',
            message: 'Stop the workflow first to make these changes'
          });
        }
      }

      // Update workflow
      Object.assign(workflow, updateData);
      await workflow.save();

      logger.info(`Workflow updated: ${workflow._id} by user ${userId}`);

      res.json({
        success: true,
        workflow: await workflow.populate('instagramAccountId')
      });

    } catch (error) {
      logger.error('Error updating workflow:', error);
      res.status(500).json({
        error: 'Failed to update workflow',
        message: error.message
      });
    }
  }

  // Delete workflow
  async deleteWorkflow(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({
          error: 'Workflow not found'
        });
      }

      // Stop workflow if it's active
      if (workflow.status === 'active') {
        await workflowService.stopWorkflow(id, userId);
      }

      // Delete workflow
      await Workflow.findByIdAndDelete(id);

      // Log deletion event
      await Event.create({
        workflowId: id,
        type: 'workflow_deleted',
        metadata: { deletedBy: userId }
      });

      logger.info(`Workflow deleted: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Workflow deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting workflow:', error);
      res.status(500).json({
        error: 'Failed to delete workflow',
        message: error.message
      });
    }
  }

  // Activate workflow (Go Live)
  async activateWorkflow(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const workflow = await workflowService.activateWorkflow(id, userId);

      logger.info(`Workflow activated: ${id} by user ${userId}`);

      res.json({
        success: true,
        workflow: await workflow.populate('instagramAccountId'),
        message: 'Workflow activated successfully'
      });

    } catch (error) {
      logger.error('Error activating workflow:', error);
      res.status(400).json({
        error: 'Failed to activate workflow',
        message: error.message
      });
    }
  }

  // Stop workflow
  async stopWorkflow(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const workflow = await workflowService.stopWorkflow(id, userId);

      logger.info(`Workflow stopped: ${id} by user ${userId}`);

      res.json({
        success: true,
        workflow: await workflow.populate('instagramAccountId'),
        message: 'Workflow stopped successfully'
      });

    } catch (error) {
      logger.error('Error stopping workflow:', error);
      res.status(400).json({
        error: 'Failed to stop workflow',
        message: error.message
      });
    }
  }

  // Pause workflow
  async pauseWorkflow(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({
          error: 'Workflow not found'
        });
      }

      if (workflow.status !== 'active') {
        return res.status(400).json({
          error: 'Can only pause active workflows'
        });
      }

      await workflow.pause();
      await Event.logWorkflowStatusChange(workflow._id, 'paused');

      logger.info(`Workflow paused: ${id} by user ${userId}`);

      res.json({
        success: true,
        workflow: await workflow.populate('instagramAccountId'),
        message: 'Workflow paused successfully'
      });

    } catch (error) {
      logger.error('Error pausing workflow:', error);
      res.status(500).json({
        error: 'Failed to pause workflow',
        message: error.message
      });
    }
  }

  // Get workflow statistics
  async getWorkflowStats(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Verify ownership
      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({
          error: 'Workflow not found'
        });
      }

      const stats = await workflowService.getWorkflowStats(id);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      logger.error('Error fetching workflow stats:', error);
      res.status(500).json({
        error: 'Failed to fetch workflow statistics',
        message: error.message
      });
    }
  }

  // Test workflow (dry run)
  async testWorkflow(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { testComment } = req.body;

      const workflow = await Workflow.findOne({ _id: id, userId })
        .populate('instagramAccountId');

      if (!workflow) {
        return res.status(404).json({
          error: 'Workflow not found'
        });
      }

      if (!testComment) {
        return res.status(400).json({
          error: 'Test comment text is required'
        });
      }

      // Test keyword matching
      const commentMonitor = require('../services/commentMonitor');
      const matchedKeyword = commentMonitor.checkKeywordMatch(
        testComment,
        workflow.keywords,
        workflow.settings
      );

      const result = {
        workflowId: workflow._id,
        testComment,
        keywords: workflow.keywords,
        settings: workflow.settings,
        matched: !!matchedKeyword,
        matchedKeyword,
        dmMessage: matchedKeyword ? workflow.dmMessage : null
      };

      res.json({
        success: true,
        testResult: result
      });

    } catch (error) {
      logger.error('Error testing workflow:', error);
      res.status(500).json({
        error: 'Failed to test workflow',
        message: error.message
      });
    }
  }
}

module.exports = new WorkflowController();