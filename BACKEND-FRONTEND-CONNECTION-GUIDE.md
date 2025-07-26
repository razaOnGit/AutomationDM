# Backend-Frontend Connection Guide

## 🎯 Goal: Connect Your App.tsx to Backend (No App.tsx Changes)

Your App.tsx is perfect as-is. You just need to connect the "Go Live" button to your backend APIs.

## 📡 Required API Connections

### 1. When User Clicks "Go Live" Button

**Current Frontend Code (App.tsx line ~XXX):**
```typescript
<button className="go-live-btn-main">Go Live</button>
```

**Add this onClick handler:**
```typescript
const handleGoLive = async () => {
  try {
    // 1. Create workflow from your frontend state
    const workflowData = {
      name: `Workflow for ${selectedPost.username}`,
      postId: selectedPost.id,
      keywords: commentKeyword.split(',').map(k => k.trim()),
      dmMessage: dmMessage,
      dmWithLinkMessage: dmWithLinkMessage,
      openingDmEnabled: openingDmEnabled,
      linkUrl: linkUrl
    };

    // 2. Call your backend API
    const response = await fetch('http://localhost:5000/api/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(workflowData)
    });

    const result = await response.json();

    if (result.success) {
      // 3. Activate the workflow
      const activateResponse = await fetch(`http://localhost:5000/api/workflows/${result.workflow._id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const activateResult = await activateResponse.json();

      if (activateResult.success) {
        setIsLive(true);
        alert('🚀 Workflow is now LIVE! Monitoring comments for keywords...');
      }
    }
  } catch (error) {
    console.error('Failed to go live:', error);
    alert('Failed to activate workflow. Please try again.');
  }
};
```

### 2. Replace Mock Posts with Real Instagram Data

**Current Frontend Code:**
```typescript
const mockPosts = [
  { id: 1, imageUrl: '/image/a.png', username: 'botspacehq', ... }
];
```

**Replace with API call:**
```typescript
const [posts, setPosts] = useState([]);

useEffect(() => {
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/instagram/dashboard/posts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setPosts(result.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  fetchPosts();
}, []);
```

### 3. Add Real-time Updates (Optional)

**Add WebSocket connection for live monitoring:**
```typescript
useEffect(() => {
  const socket = io('http://localhost:5000', {
    auth: { token: localStorage.getItem('authToken') }
  });

  socket.on('comment-detected', (data) => {
    console.log('💬 New comment detected:', data);
    // Update your phone mockup to show the comment
  });

  socket.on('dm-sent', (data) => {
    console.log('📩 DM sent:', data);
    // Show success notification in your UI
  });

  return () => socket.disconnect();
}, []);
```

## 🔧 Backend APIs Your Frontend Can Use

### Authentication
```javascript
POST /api/auth/instagram/callback  // Instagram OAuth
GET  /api/auth/verify              // Verify user token
```

### Workflow Management
```javascript
POST /api/workflows                // Create workflow (Go Live)
POST /api/workflows/:id/activate   // Activate workflow
GET  /api/workflows/:id/stats      // Get workflow statistics
```

### Instagram Data
```javascript
GET  /api/instagram/dashboard/posts           // Get user's posts
GET  /api/instagram/dashboard/keyword-suggestions  // Get keyword suggestions
POST /api/instagram/dashboard/preview-dm      // Preview DM message
```

### Real-time Updates
```javascript
WebSocket Events:
- comment-detected  // New comment with keyword
- dm-sent          // DM successfully sent
- workflow-stats   // Updated statistics
```

## 🚀 Complete Integration Example

Here's how your App.tsx "Go Live" flow works:

1. **User fills out workflow in your dashboard**
   - Selects Instagram post
   - Enters keywords: "price, cost, how much"
   - Configures DM message

2. **User clicks "Go Live"**
   - Frontend calls `POST /api/workflows`
   - Backend creates workflow in database
   - Frontend calls `POST /api/workflows/:id/activate`
   - Backend starts monitoring Instagram comments

3. **Real-time monitoring begins**
   - Backend polls Instagram API every 30 seconds
   - Checks new comments for keywords
   - When "price" is found → sends automated DM
   - WebSocket notifies frontend of activity

4. **User sees live updates**
   - Phone mockup shows detected comments
   - Success notifications for sent DMs
   - Real-time statistics updates

## 📋 Minimal Changes Needed

**In your App.tsx, you only need to add:**

1. **API calls** - Replace mock data with backend calls
2. **Go Live handler** - Connect button to backend workflow creation
3. **WebSocket** - For real-time updates (optional)
4. **Authentication** - Instagram OAuth flow

**Your existing UI, components, and styling stay exactly the same!**

## 🧪 Test Your Integration

1. **Start backend:** `cd backend && npm run dev`
2. **Test comment flow:** `node test-comment-to-dm-flow.js`
3. **Connect frontend:** Add API calls to your App.tsx
4. **Test Go Live:** Click button and verify workflow creation

Your backend is **100% ready** - it just needs to be connected to your beautiful frontend dashboard!