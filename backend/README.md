# Instagram Comment-to-DM Automation Backend

A production-ready Node.js/Express backend for automating Instagram direct message responses to comments with specific keywords.

## 🚀 Features

### Core Automation
- **Real-time Comment Monitoring** - Polls Instagram posts every 30 seconds
- **Keyword Matching** - Case-sensitive/insensitive, exact/substring matching
- **Automated DM Sending** - Personalized messages with dynamic placeholders
- **Duplicate Prevention** - Smart logic to prevent spam
- **Rate Limiting** - Respects Instagram API limits (200/hour, 1000/day)

### Advanced Features
- **Real-time Updates** - WebSocket notifications to frontend
- **Comprehensive Analytics** - Track performance, success rates, keyword effectiveness
- **Token Management** - Automatic handling of expired Instagram tokens
- **Error Recovery** - Graceful handling of API failures
- **Health Monitoring** - System status and performance metrics

## 📡 API Endpoints

### Authentication
```
POST /api/auth/instagram/callback  - Instagram OAuth callback
GET  /api/auth/verify              - Verify JWT token
POST /api/auth/refresh             - Refresh access token
POST /api/auth/logout              - Logout user
```

### Workflows
```
POST /api/workflows                - Create workflow
GET  /api/workflows                - List user workflows
GET  /api/workflows/:id            - Get specific workflow
PUT  /api/workflows/:id            - Update workflow
DELETE /api/workflows/:id          - Delete workflow
POST /api/workflows/:id/activate   - Activate workflow (Go Live!)
POST /api/workflows/:id/stop       - Stop workflow
POST /api/workflows/:id/pause      - Pause workflow
GET  /api/workflows/:id/stats      - Get workflow analytics
POST /api/workflows/:id/test       - Test keyword matching
```

### Instagram Data
```
GET  /api/instagram/accounts       - Get user's Instagram accounts
GET  /api/instagram/accounts/:id/media - Get account posts
GET  /api/instagram/media/:id      - Get post details
GET  /api/instagram/media/:id/comments - Get post comments
POST /api/instagram/accounts/:id/sync - Sync account data
```

### System
```
GET  /health                       - Health check
GET  /status                       - Detailed system status
```

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT with Instagram OAuth
- **HTTP Client**: Axios
- **Validation**: Joi
- **Scheduling**: node-cron
- **Process Management**: PM2 (production)

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication endpoints
│   │   └── workflowController.js # Workflow CRUD operations
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Global error handling
│   ├── models/
│   │   ├── User.js              # User data model
│   │   ├── Workflow.js          # Workflow configuration
│   │   ├── InstagramAccount.js  # Instagram account data
│   │   └── Event.js             # Activity logging
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── workflows.js         # Workflow management routes
│   │   └── instagram.js         # Instagram data routes
│   ├── services/
│   │   ├── instagramAPI.js      # Instagram Graph API client
│   │   ├── workflowService.js   # Workflow business logic
│   │   ├── commentMonitor.js    # Comment monitoring service
│   │   └── dmService.js         # DM sending service
│   ├── utils/
│   │   └── logger.js            # Logging utility
│   ├── websocket/
│   │   └── index.js             # WebSocket server setup
│   └── app.js                   # Express application setup
├── server.js                    # Application entry point
├── package.json
├── .env.example
└── README.md
```

## 🚀 Quick Start

### 1. Installation
```bash
cd backend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Required Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/instagram_automation

# Instagram/Facebook App
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
INSTAGRAM_GRAPH_API_VERSION=v18.0

# JWT
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRE=7d

# Instagram API Settings
IG_COMMENT_POLLING_INTERVAL=30000
IG_MAX_RETRIES=3
IG_RETRY_DELAY=5000
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Start Production Server
```bash
npm start
```

## 🧪 Testing

### Run System Tests
```bash
node test-complete-system.js
```

### Run Authentication Tests
```bash
node test-auth.js
```

### Run Model Tests
```bash
node test-models.js
```

## 📊 How It Works

### 1. User Authentication
- Users authenticate via Instagram OAuth
- JWT tokens issued for API access
- Instagram access tokens stored securely

### 2. Workflow Creation
- Users create workflows with:
  - Target Instagram post ID
  - Keywords to monitor
  - DM message template
  - Matching settings (case sensitivity, exact match)

### 3. Comment Monitoring
- System polls Instagram API every 30 seconds
- Checks new comments against active workflows
- Matches keywords using configured settings

### 4. Automated DM Sending
- When keyword matches, system sends personalized DM
- Prevents duplicate DMs to same user
- Respects Instagram rate limits
- Logs all activities for analytics

### 5. Real-time Updates
- WebSocket notifications to frontend
- Live workflow statistics
- Real-time monitoring status

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - API protection against abuse
- **Input Validation** - Comprehensive request validation
- **Error Sanitization** - Safe error messages for production
- **CORS Configuration** - Proper cross-origin setup
- **Security Headers** - Helmet.js protection

## 📈 Monitoring & Analytics

### Health Endpoints
- `GET /health` - Basic health check
- `GET /status` - Detailed system metrics

### Workflow Analytics
- Total triggers and DMs sent
- Success rates and performance metrics
- Keyword effectiveness tracking
- Recent activity logs

### System Monitoring
- Database connection status
- Active workflow monitoring
- WebSocket connection stats
- Memory and CPU usage

## 🚀 Deployment

### Deploy to Render
1. Connect your GitHub repository
2. Set environment variables
3. Deploy with automatic builds

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## 🔧 Configuration

### Instagram App Setup
1. Create Facebook Developer App
2. Add Instagram Basic Display product
3. Configure OAuth redirect URIs
4. Get App ID and App Secret

### MongoDB Setup
- Local: Install MongoDB locally
- Cloud: Use MongoDB Atlas
- Connection string in MONGODB_URI

## 📝 API Usage Examples

### Create Workflow
```javascript
POST /api/workflows
Authorization: Bearer <jwt_token>

{
  "name": "Price Inquiry Automation",
  "postId": "instagram_post_id",
  "instagramAccountId": "account_id",
  "keywords": ["price", "cost", "how much"],
  "dmMessage": "Hi {username}! Thanks for asking about pricing. Check out our website: {link}",
  "linkUrl": "https://yourwebsite.com",
  "settings": {
    "caseSensitive": false,
    "exactMatch": false,
    "maxDmsPerDay": 100
  }
}
```

### Activate Workflow
```javascript
POST /api/workflows/:id/activate
Authorization: Bearer <jwt_token>
```

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB Connection Failed**
   - Check MONGODB_URI in .env
   - Ensure MongoDB is running

2. **Instagram API Errors**
   - Verify Facebook App credentials
   - Check Instagram access token validity
   - Ensure proper permissions

3. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify JWT token in WebSocket auth

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For support and questions:
- Create GitHub issue
- Check documentation
- Review error logs in `/logs` directory