# Instagram Comment-to-DM Automation - Demo Version

🎉 **No Instagram Business Account Required!** This demo version simulates the complete Instagram comment-to-DM automation workflow without needing real Instagram API access.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the demo server
npm run demo
```

The server will start on `http://localhost:5000`

## ✨ Demo Features

- **Mock Instagram Comments**: Pre-loaded sample comments for testing
- **Automated Workflows**: Create rules to automatically respond to comments
- **DM Simulation**: See how DMs would be sent based on comment triggers
- **Real-time Processing**: Add new comments and see instant workflow matching
- **Dashboard Stats**: View processing statistics and performance metrics

## 📋 Available API Endpoints

### Authentication (Demo)
- `POST /api/auth/demo-login` - Demo login (no real Instagram needed)

### Workflows
- `GET /api/workflows` - Get all workflows
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id/toggle` - Activate/deactivate workflow

### Comments & DMs
- `GET /api/instagram/comments` - Get mock Instagram comments
- `GET /api/dms` - Get sent DMs
- `GET /api/stats` - Get dashboard statistics

### Demo Actions
- `POST /api/demo/new-comment` - Simulate new Instagram comment
- `POST /api/demo/process-comments` - Process all unprocessed comments

## 🎯 How It Works

1. **Create Workflows**: Define keywords and automatic responses
2. **Monitor Comments**: The system watches for comments containing your keywords
3. **Auto-Respond**: When a match is found, a DM is automatically sent
4. **Track Results**: View all sent DMs and processing statistics

## 📝 Example Workflow

```json
{
  "name": "Info Request",
  "keyword": "info",
  "response": "Hi! Thanks for your interest. I've sent you detailed information via DM!"
}
```

When someone comments "Can I get more info?", they'll automatically receive the DM response.

## 🧪 Testing the Demo

1. Start the server: `npm run demo`
2. Open your browser to `http://localhost:5000/health`
3. Use the API endpoints to:
   - Create workflows
   - Add mock comments
   - See automatic DM responses

## 🔗 Frontend Integration

The backend is ready to connect with a React frontend at `http://localhost:3000`. All CORS settings are configured for local development.

## 📊 Sample Data Included

- **3 Mock Comments**: Ready for testing workflows
- **2 Sample Workflows**: "info" and "price" keyword triggers
- **Real-time Processing**: See immediate results

Perfect for demonstrations, portfolio projects, or proof-of-concept presentations! 🎉