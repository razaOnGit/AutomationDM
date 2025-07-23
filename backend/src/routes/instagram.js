const express = require('express');
const router = express.Router();
const instagramAPI = require('../services/instagramAPI');
const InstagramAccount = require('../models/InstagramAccount');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// All Instagram routes require authentication
router.use(authenticateToken);

// Get user's Instagram accounts
router.get('/accounts', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const accounts = await InstagramAccount.find({ 
      userId, 
      isConnected: true 
    });
    
    res.json({
      success: true,
      accounts
    });
    
  } catch (error) {
    logger.error('Error fetching Instagram accounts:', error);
    res.status(500).json({
      error: 'Failed to fetch Instagram accounts',
      message: error.message
    });
  }
});

// Get posts/media for an Instagram account
router.get('/accounts/:accountId/media', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 25 } = req.query;
    const userId = req.user.userId;
    
    // Verify user owns this account
    const account = await InstagramAccount.findOne({
      _id: accountId,
      userId
    });
    
    if (!account) {
      return res.status(404).json({
        error: 'Instagram account not found'
      });
    }
    
    // Get user's access token
    const user = await User.findById(userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({
        error: 'Instagram access token not found'
      });
    }
    
    // Fetch media from Instagram API
    const media = await instagramAPI.getMedia(
      account.instagramBusinessId,
      user.accessToken,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      media: media.data || [],
      account: {
        id: account._id,
        username: account.username,
        instagramBusinessId: account.instagramBusinessId
      }
    });
    
  } catch (error) {
    logger.error('Error fetching Instagram media:', error);
    res.status(500).json({
      error: 'Failed to fetch Instagram media',
      message: error.message
    });
  }
});

// Get specific post details
router.get('/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const userId = req.user.userId;
    
    // Get user's access token
    const user = await User.findById(userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({
        error: 'Instagram access token not found'
      });
    }
    
    // Fetch media details from Instagram API
    const mediaDetails = await instagramAPI.getMediaDetails(
      mediaId,
      user.accessToken
    );
    
    res.json({
      success: true,
      media: mediaDetails
    });
    
  } catch (error) {
    logger.error('Error fetching media details:', error);
    res.status(500).json({
      error: 'Failed to fetch media details',
      message: error.message
    });
  }
});

// Get comments for a specific post
router.get('/media/:mediaId/comments', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user.userId;
    
    // Get user's access token
    const user = await User.findById(userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({
        error: 'Instagram access token not found'
      });
    }
    
    // Fetch comments from Instagram API
    const comments = await instagramAPI.getComments(
      mediaId,
      user.accessToken,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      comments: comments.data || [],
      mediaId
    });
    
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      message: error.message
    });
  }
});

// Sync Instagram account data
router.post('/accounts/:accountId/sync', async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.userId;
    
    // Verify user owns this account
    const account = await InstagramAccount.findOne({
      _id: accountId,
      userId
    });
    
    if (!account) {
      return res.status(404).json({
        error: 'Instagram account not found'
      });
    }
    
    // Get user's access token
    const user = await User.findById(userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({
        error: 'Instagram access token not found'
      });
    }
    
    // Fetch latest account details
    const accountDetails = await instagramAPI.getAccountDetails(
      account.instagramBusinessId,
      user.accessToken
    );
    
    // Update account information
    await account.updateAccountInfo({
      username: accountDetails.username,
      profilePicture: accountDetails.profile_picture_url,
      followersCount: accountDetails.followers_count
    });
    
    res.json({
      success: true,
      account,
      message: 'Account synced successfully'
    });
    
  } catch (error) {
    logger.error('Error syncing Instagram account:', error);
    res.status(500).json({
      error: 'Failed to sync Instagram account',
      message: error.message
    });
  }
});

module.exports = router;