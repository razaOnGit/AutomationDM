# Simple Comment-to-DM Automation Backend

## 🎯 What This Does

This is a **simplified backend** that matches your frontend needs exactly:

1. **User clicks "Go Live"** → Creates workflow and starts monitoring
2. **Comments with keywords detected** → Automatically sends DMs
3. **Real-time updates** → Shows activity as it happens

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm run dev

# Test the automation
npm test
```

## 📡 API Endpoints (For Your Frontend)

### Go Live (Main Endpoint)
```javascript
POST /api/go-live
{
  "name": "Workflow for botspacehq",
  "postId": "123",
  "keywords": ["price", "cost", "how much"],
  "dmMessage": "Hey {username}! Thanks for asking about the price...",
  "linkUrl": "https://example.com"
}

Response: { success: true, workflow: {...} }
```

### Stop Workflow
```javascript
POST /api/workflows/:id/stop
Response: { success: true, message: "Workflow stopped" }
```

### Get Stats
```javascript
GET /api/workflows/:id/stats
Response: { success: true, stats: { commentsDetected: 5, dmsSent: 3 } }
```

## 🔧 How It Works

1. **Frontend sends "Go Live" request** with workflow data
2. **Backend creates workflow** and starts monitoring comments
3. **Every 30 seconds** checks for new comments on the post
4. **When keyword found** → sends automated DM
5. **Updates statistics** and logs activity

## 📁 Simple File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── mainController.js     # Handles Go Live, Stop, Stats
│   ├── models/
│   │   └── Workflow.js           # Simple workflow storage
│   ├── services/
│   │   ├── commentMonitor.js     # Monitors comments for keywords
│   │   └── dmService.js          # Sends DMs to users
│   └── app.js                    # Main Express server
├── server.js                     # Entry point
├── test-simple-automation.js     # Test the automation
└── package.json
```

## 🧪 Test the System

```bash
# Run the automation test
npm test

# This will:
# 1. Create a test workflow
# 2. Start monitoring for keywords: "price", "cost", "how much"
# 3. Simulate comments and DM sending
# 4. Show real-time logs of the automation working
```

## 🔗 Connect to Your Frontend

In your `App.tsx`, add this to the "Go Live" button:

```javascript
const handleGoLive = async () => {
  const workflowData = {
    name: `Workflow for ${selectedPost.username}`,
    postId: selectedPost.id,
    keywords: commentKeyword.split(',').map(k => k.trim()),
    dmMessage: dmMessage,
    linkUrl: linkUrl
  };

  const response = await fetch('http://localhost:5000/api/go-live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflowData)
  });

  const result = await response.json();
  if (result.success) {
    setIsLive(true);
    alert('🚀 Workflow is now LIVE!');
  }
};
```

## 📊 What You'll See

When you run the test or connect your frontend:

```
🔍 Starting comment monitoring for workflow 507f1f77bcf86cd799439011 on post 123
📝 Watching for keywords: price, cost, how much
💬 Processing comment: "What is the price for this?" by @user123
🎯 KEYWORD MATCH! "What is the price for this?" matched "price"
📩 Sending DM to @user123: "Hey user123! Thanks for asking about the price..."
✅ DM sent to @user123: "Hey user123! Thanks for asking about the price..."
```

## 🎉 That's It!

Your backend is now **100x simpler** and does exactly what your frontend needs:
- ✅ Simple "Go Live" API
- ✅ Comment monitoring with keyword detection
- ✅ Automated DM sending
- ✅ Real-time statistics
- ✅ No complex authentication or user management

Perfect for connecting to your beautiful React dashboard!