# Instagram/Facebook App Setup Guide

## 🎯 Overview
To use Instagram Comment-to-DM automation, you need to create a Facebook Developer App and configure Instagram permissions.

## 📋 Prerequisites
- Facebook Developer Account
- Instagram Business Account
- Facebook Page connected to Instagram Business Account

## 🚀 Step-by-Step Setup

### 1. Create Facebook Developer App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as app type
4. Fill in app details:
   - App Name: "Instagram Comment DM Bot"
   - App Contact Email: your-email@example.com
   - Business Account: Select or create one

### 2. Add Instagram Basic Display Product
1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display → Basic Display
4. Click "Create New App"

### 3. Configure Instagram App Settings
1. In Instagram Basic Display settings:
   - **Display Name**: Your app name
   - **Namespace**: your-app-namespace
   - **Category**: Business
   - **Description**: Instagram comment automation

### 4. Set Up OAuth Redirect URIs
Add these redirect URIs in Instagram Basic Display → Basic Display:
```
http://localhost:3000/auth/callback          (for development)
https://yourdomain.com/auth/callback         (for production)
```

### 5. Add Instagram Graph API Product
1. Go back to app dashboard
2. Click "Add Product" → "Instagram Graph API"
3. Set up Instagram Graph API

### 6. Configure App Permissions
In App Review → Permissions and Features, request:
- `instagram_basic`
- `instagram_manage_comments`
- `instagram_manage_messages`
- `pages_read_engagement`
- `pages_manage_metadata`

### 7. Get App Credentials
1. Go to Settings → Basic
2. Copy your:
   - **App ID** → Use as `FACEBOOK_APP_ID`
   - **App Secret** → Use as `FACEBOOK_APP_SECRET`

### 8. Update Environment Variables
Add to your `.env` file:
```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
INSTAGRAM_GRAPH_API_VERSION=v18.0
WEBHOOK_VERIFY_TOKEN=your_random_webhook_token
```

### 9. Test Instagram Connection
Run this test to verify your setup:
```bash
node test-instagram-setup.js
```

## 🔧 Development vs Production

### Development Setup
- Use `http://localhost:3000` for redirect URIs
- App can be in "Development" mode
- Limited to app developers and testers

### Production Setup
- Use your production domain for redirect URIs
- Submit app for review to Facebook
- Request necessary permissions
- App must be approved for public use

## 🧪 Testing Your Setup

### Test Instagram OAuth Flow
1. Start your backend: `npm run dev`
2. Start your frontend: `npm start`
3. Try to connect Instagram account
4. Check browser network tab for any errors

### Test API Permissions
Use this endpoint to test permissions:
```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_ACCESS_TOKEN"
```

## 🚨 Common Issues

### "Invalid OAuth access token"
- Check if your access token is expired
- Verify FACEBOOK_APP_ID and FACEBOOK_APP_SECRET
- Ensure Instagram account is connected to Facebook Page

### "Insufficient permissions"
- Request additional permissions in App Review
- Check if your app is approved for production use
- Verify Instagram Business Account setup

### "Webhook verification failed"
- Check WEBHOOK_VERIFY_TOKEN matches in both places
- Ensure webhook URL is publicly accessible
- Verify webhook endpoint is working

## 📞 Support Resources
- [Facebook Developer Documentation](https://developers.facebook.com/docs/)
- [Instagram Graph API Reference](https://developers.facebook.com/docs/instagram-api/)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api/)

## 🔐 Security Best Practices
- Never commit App Secret to version control
- Use environment variables for all credentials
- Regularly rotate access tokens
- Monitor API usage and rate limits
- Use HTTPS in production