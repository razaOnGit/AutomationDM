require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Mock data for demo
let mockComments = [
  { id: 1, username: 'sarah_jones', text: 'Love this post! Can I get more info?', timestamp: new Date(), processed: false },
  { id: 2, username: 'mike_smith', text: 'Great content!', timestamp: new Date(), processed: false },
  { id: 3, username: 'anna_wilson', text: 'info please', timestamp: new Date(), processed: false }
];

let mockWorkflows = [
  {
    id: 1,
    name: 'Info Request Workflow',
    trigger: 'comment',
    keyword: 'info',
    response: 'Hi! Thanks for your interest. I\'ve sent you detailed information via DM. Check your messages! 📩',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 2,
    name: 'Product Inquiry',
    trigger: 'comment',
    keyword: 'price',
    response: 'Hello! I\'ve sent you pricing details in your DMs. Let me know if you have any questions! 💰',
    isActive: true,
    createdAt: new Date()
  }
];

let sentDMs = [];

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🚀 Instagram Comment-to-DM Demo Backend',
    timestamp: new Date().toISOString(),
    features: [
      'Mock Instagram comments',
      'Automated DM responses',
      'Workflow management',
      'Real-time processing'
    ]
  });
});

// Demo authentication (no real Instagram needed)
app.post('/api/auth/demo-login', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 'demo-user-123',
      username: 'your_business_account',
      displayName: 'Your Business',
      profilePicture: 'https://via.placeholder.com/150',
      accessToken: 'demo-access-token-12345'
    },
    message: 'Demo authentication successful! 🎉'
  });
});

// Get workflows
app.get('/api/workflows', (req, res) => {
  res.json({
    success: true,
    workflows: mockWorkflows,
    total: mockWorkflows.length
  });
});

// Create new workflow
app.post('/api/workflows', (req, res) => {
  const { name, keyword, response } = req.body;
  
  if (!name || !keyword || !response) {
    return res.status(400).json({
      success: false,
      error: 'Name, keyword, and response are required'
    });
  }
  
  const newWorkflow = {
    id: Date.now(),
    name,
    trigger: 'comment',
    keyword: keyword.toLowerCase(),
    response,
    isActive: true,
    createdAt: new Date()
  };
  
  mockWorkflows.push(newWorkflow);
  
  res.json({
    success: true,
    workflow: newWorkflow,
    message: 'Workflow created successfully! 🎯'
  });
});

// Toggle workflow status
app.put('/api/workflows/:id/toggle', (req, res) => {
  const workflowId = parseInt(req.params.id);
  const workflow = mockWorkflows.find(w => w.id === workflowId);
  
  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: 'Workflow not found'
    });
  }
  
  workflow.isActive = !workflow.isActive;
  
  res.json({
    success: true,
    workflow,
    message: `Workflow ${workflow.isActive ? 'activated' : 'deactivated'} successfully!`
  });
});

// Get mock Instagram comments
app.get('/api/instagram/comments', (req, res) => {
  res.json({
    success: true,
    comments: mockComments.map(comment => ({
      ...comment,
      timeAgo: getTimeAgo(comment.timestamp)
    })),
    total: mockComments.length
  });
});

// Get sent DMs
app.get('/api/dms', (req, res) => {
  res.json({
    success: true,
    dms: sentDMs,
    total: sentDMs.length
  });
});

// Simulate new comment (for demo purposes)
app.post('/api/demo/new-comment', (req, res) => {
  const { username, text } = req.body;
  
  if (!username || !text) {
    return res.status(400).json({
      success: false,
      error: 'Username and text are required'
    });
  }
  
  const newComment = {
    id: Date.now(),
    username,
    text,
    timestamp: new Date(),
    processed: false
  };
  
  mockComments.unshift(newComment); // Add to beginning
  
  // Check for workflow matches
  const matchedWorkflows = mockWorkflows.filter(workflow => 
    workflow.isActive && 
    text.toLowerCase().includes(workflow.keyword.toLowerCase())
  );
  
  let dmsCreated = [];
  
  if (matchedWorkflows.length > 0) {
    matchedWorkflows.forEach(workflow => {
      const dm = {
        id: Date.now() + Math.random(),
        recipient: username,
        message: workflow.response,
        workflowName: workflow.name,
        triggerComment: newComment,
        timestamp: new Date(),
        status: 'sent'
      };
      
      sentDMs.unshift(dm);
      dmsCreated.push(dm);
    });
    
    newComment.processed = true;
  }
  
  res.json({
    success: true,
    comment: newComment,
    matchedWorkflows: matchedWorkflows.length,
    dmsCreated: dmsCreated.length,
    dms: dmsCreated,
    message: dmsCreated.length > 0 
      ? `Comment processed! ${dmsCreated.length} DM(s) sent automatically 🚀`
      : 'Comment added (no workflow matches)'
  });
});

// Process existing comments (simulate batch processing)
app.post('/api/demo/process-comments', (req, res) => {
  let processedCount = 0;
  let dmsCreated = [];
  
  mockComments.forEach(comment => {
    if (!comment.processed) {
      const matchedWorkflows = mockWorkflows.filter(workflow => 
        workflow.isActive && 
        comment.text.toLowerCase().includes(workflow.keyword.toLowerCase())
      );
      
      if (matchedWorkflows.length > 0) {
        matchedWorkflows.forEach(workflow => {
          const dm = {
            id: Date.now() + Math.random(),
            recipient: comment.username,
            message: workflow.response,
            workflowName: workflow.name,
            triggerComment: comment,
            timestamp: new Date(),
            status: 'sent'
          };
          
          sentDMs.unshift(dm);
          dmsCreated.push(dm);
        });
        
        comment.processed = true;
        processedCount++;
      }
    }
  });
  
  res.json({
    success: true,
    processedComments: processedCount,
    dmsCreated: dmsCreated.length,
    message: `Processed ${processedCount} comments and sent ${dmsCreated.length} DMs! 📨`
  });
});

// Get dashboard stats
app.get('/api/stats', (req, res) => {
  const totalComments = mockComments.length;
  const processedComments = mockComments.filter(c => c.processed).length;
  const activeWorkflows = mockWorkflows.filter(w => w.isActive).length;
  const totalDMs = sentDMs.length;
  
  res.json({
    success: true,
    stats: {
      totalComments,
      processedComments,
      unprocessedComments: totalComments - processedComments,
      activeWorkflows,
      totalWorkflows: mockWorkflows.length,
      totalDMs,
      processingRate: totalComments > 0 ? Math.round((processedComments / totalComments) * 100) : 0
    }
  });
});

// Helper function
function getTimeAgo(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Instagram Comment-to-DM Demo Backend`);
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`\n✨ Demo Features Available:`);
  console.log(`   📝 Mock Instagram comments`);
  console.log(`   🤖 Automated workflow processing`);
  console.log(`   📨 DM response simulation`);
  console.log(`   📊 Real-time statistics`);
  console.log(`   🎯 No Instagram Business account required!`);
  console.log(`\n🎉 Ready for frontend connection!`);
});