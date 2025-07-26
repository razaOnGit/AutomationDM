require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for demo
let mockComments = [
  { id: 1, username: 'user1', text: 'Great post!', timestamp: new Date() },
  { id: 2, username: 'user2', text: 'Love this!', timestamp: new Date() },
  { id: 3, username: 'user3', text: 'Amazing content', timestamp: new Date() }
];

let mockWorkflows = [
  {
    id: 1,
    name: 'Welcome Message',
    trigger: 'comment',
    keyword: 'info',
    response: 'Thanks for your interest! Check your DMs for more info.',
    isActive: true
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple Instagram Comment-to-DM Backend',
    timestamp: new Date().toISOString()
  });
});

// Mock Instagram auth (no real Instagram needed)
app.post('/api/auth/demo-login', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 'demo-user',
      username: 'demo_account',
      accessToken: 'demo-token'
    },
    message: 'Demo login successful'
  });
});

// Get mock workflows
app.get('/api/workflows', (req, res) => {
  res.json({
    success: true,
    workflows: mockWorkflows
  });
});

// Create workflow
app.post('/api/workflows', (req, res) => {
  const { name, trigger, keyword, response } = req.body;
  
  const newWorkflow = {
    id: mockWorkflows.length + 1,
    name,
    trigger,
    keyword,
    response,
    isActive: true,
    createdAt: new Date()
  };
  
  mockWorkflows.push(newWorkflow);
  
  res.json({
    success: true,
    workflow: newWorkflow,
    message: 'Workflow created successfully'
  });
});

// Get mock comments
app.get('/api/instagram/comments', (req, res) => {
  res.json({
    success: true,
    comments: mockComments
  });
});

// Simulate comment processing
app.post('/api/comments/simulate', (req, res) => {
  const { username, text } = req.body;
  
  const newComment = {
    id: mockComments.length + 1,
    username: username || `user${mockComments.length + 1}`,
    text: text || 'This is a simulated comment',
    timestamp: new Date()
  };
  
  mockComments.push(newComment);
  
  // Check if comment matches any workflow
  const matchedWorkflow = mockWorkflows.find(workflow => 
    workflow.isActive && 
    newComment.text.toLowerCase().includes(workflow.keyword.toLowerCase())
  );
  
  let dmSent = false;
  if (matchedWorkflow) {
    dmSent = true;
    // Emit to connected clients
    io.emit('dm_sent', {
      comment: newComment,
      workflow: matchedWorkflow,
      dm: {
        recipient: newComment.username,
        message: matchedWorkflow.response,
        timestamp: new Date()
      }
    });
  }
  
  // Emit new comment to all clients
  io.emit('new_comment', newComment);
  
  res.json({
    success: true,
    comment: newComment,
    dmSent,
    matchedWorkflow: dmSent ? matchedWorkflow : null
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Simple Instagram Comment-to-DM Backend running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`\n📋 Demo Features:`);
  console.log(`   ✅ Mock Instagram comments`);
  console.log(`   ✅ Workflow management`);
  console.log(`   ✅ Real-time WebSocket updates`);
  console.log(`   ✅ Comment-to-DM simulation`);
  console.log(`\n🎯 No Instagram Business account needed!`);
});