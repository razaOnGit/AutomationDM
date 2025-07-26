const Workflow = require('../models/Workflow');
const commentMonitor = require('../services/commentMonitor');

class MainController {
  // Handle "Go Live" button from frontend
  async goLive(req, res) {
    try {
      const { name, postId, keywords, dmMessage, dmWithLinkMessage, linkUrl, openingDmEnabled } = req.body;

      // Validate required fields
      if (!postId || !keywords || !dmMessage) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: postId, keywords, dmMessage'
        });
      }

      // Create workflow
      const workflow = new Workflow({
        name: name || `Workflow for Post ${postId}`,
        postId,
        keywords: Array.isArray(keywords) ? keywords : keywords.split(',').map(k => k.trim()),
        dmMessage,
        dmWithLinkMessage: dmWithLinkMessage || '',
        linkUrl: linkUrl || '',
        openingDmEnabled: openingDmEnabled !== false
      });

      await workflow.save();

      // Activate workflow
      await workflow.activate();

      // Start monitoring comments
      commentMonitor.startMonitoring(workflow);

      console.log(`🚀 Workflow ${workflow._id} is now LIVE! Monitoring post ${postId} for keywords:`, workflow.keywords);

      res.json({
        success: true,
        workflow: {
          _id: workflow._id,
          name: workflow.name,
          postId: workflow.postId,
          keywords: workflow.keywords,
          status: workflow.status
        },
        message: 'Workflow is now LIVE! Monitoring comments for keywords...'
      });

    } catch (error) {
      console.error('Error in goLive:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate workflow',
        message: error.message
      });
    }
  }

  // Stop workflow
  async stopWorkflow(req, res) {
    try {
      const { id } = req.params;

      const workflow = await Workflow.findById(id);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      await workflow.stop();
      commentMonitor.stopMonitoring(id);

      console.log(`⏹️ Workflow ${id} stopped`);

      res.json({
        success: true,
        message: 'Workflow stopped successfully'
      });

    } catch (error) {
      console.error('Error stopping workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop workflow'
      });
    }
  }

  // Get workflow stats
  async getStats(req, res) {
    try {
      const { id } = req.params;

      const workflow = await Workflow.findById(id);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      res.json({
        success: true,
        stats: workflow.stats
      });

    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get workflow stats'
      });
    }
  }

  // Get all workflows
  async getWorkflows(req, res) {
    try {
      const workflows = await Workflow.find().sort({ createdAt: -1 });

      res.json({
        success: true,
        workflows
      });

    } catch (error) {
      console.error('Error getting workflows:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get workflows'
      });
    }
  }
}

module.exports = new MainController();