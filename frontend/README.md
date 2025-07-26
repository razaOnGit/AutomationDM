# Instagram Comment-to-DM Frontend

React frontend for the Instagram Comment-to-DM automation system.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Backend server running on `http://localhost:5000`

### Installation
```bash
npm install
```

### Running the Frontend
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🔗 Backend Connection

The frontend is configured to connect to the backend at `http://localhost:5000`.

### Starting Both Frontend and Backend

**Terminal 1 (Backend):**
```bash
cd backend
node demo-server.js
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

## ✨ Demo Features

### 🎯 Demo Login
- Click "Try Demo Mode" to login without Instagram Business account
- No real Instagram API setup required
- Perfect for testing and demonstrations

### 📊 Dashboard Features
- View mock Instagram comments
- Create automated workflows
- See real-time DM responses
- Monitor processing statistics

### 🤖 Workflow Management
- Create keyword-based triggers
- Set automatic DM responses
- Activate/deactivate workflows
- View workflow performance

## 🧪 Testing the Connection

1. **Start Backend**: Make sure `node demo-server.js` is running
2. **Check Health**: Visit `http://localhost:5000/health`
3. **Start Frontend**: Run `npm start`
4. **Test Demo Login**: Click "Try Demo Mode" button

## 📝 Environment Variables

The frontend uses these environment variables (in `.env`):

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
REACT_APP_FACEBOOK_APP_ID=986578940116566
REACT_APP_ENV=development
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_DEBUG=true
```

## 🔧 Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` in `.env`
- Verify no firewall blocking localhost:5000

### Demo Login Not Working
- Check browser console for errors
- Ensure backend `/api/auth/demo-login` endpoint is responding
- Try refreshing the page

### CORS Issues
- Backend is configured for `http://localhost:3000`
- Make sure frontend runs on port 3000
- Check browser network tab for CORS errors

## 📱 Available Pages

- **Login**: Demo authentication
- **Dashboard**: Main workflow management
- **Comments**: View Instagram comments
- **Analytics**: Processing statistics
- **Settings**: Configuration options

## 🎉 Perfect for:
- Portfolio demonstrations
- Project submissions
- Proof of concept presentations
- Development and testing

No Instagram Business account required! 🚀