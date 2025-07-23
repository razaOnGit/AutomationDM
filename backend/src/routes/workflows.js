const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { authenticateToken } = require('../middleware/auth');

// All workflow routes require authentication
router.use(authenticateToken);

// CRUD operations
router.post('/', workflowController.createWorkflow);
router.get('/', workflowController.getWorkflows);
router.get('/:id', workflowController.getWorkflow);
router.put('/:id', workflowController.updateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

// Workflow control
router.post('/:id/activate', workflowController.activateWorkflow);
router.post('/:id/stop', workflowController.stopWorkflow);
router.post('/:id/pause', workflowController.pauseWorkflow);

// Analytics and testing
router.get('/:id/stats', workflowController.getWorkflowStats);
router.post('/:id/test', workflowController.testWorkflow);

module.exports = router;