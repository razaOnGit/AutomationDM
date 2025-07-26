const express = require('express');
const router = express.Router();
const instagramAPI = require('../services/instagramAPI');
const mockDataService = require('../services/mockDataService');
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
    const { limit = 25, format = 'api' } = req.query;
    const userId = req.user.userId;
    
    // Check if we should use mock data for development
    if (mockDataService.shouldUseMockData()) {
      logger.info('Using mock data for Instagram posts');
      const mockResponse = await mockDataService.getMockPosts(parseInt(limit));
      
      // Convert to frontend format if requested
      const posts = format === 'frontend' 
        ? mockDataService.convertToFrontendFormat(mockResponse.data)
        : mockResponse.data;
      
      return res.json({
        success: true,
        media: posts,
        account: await mockDataService.getMockAccount(),
        isMockData: true
      });
    }
    
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
    
    // Convert to frontend format if requested
    const posts = format === 'frontend' && media.data
      ? mockDataService.convertToFrontendFormat(media.data)
      : media.data || [];
    
    res.json({
      success: true,
      media: posts,
      account: {
        id: account._id,
        username: account.username,
        instagramBusinessId: account.instagramBusinessId
      },
      isMockData: false
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

// Dashboard-specific endpoints for frontend integration

// Get posts in frontend format (for your App.tsx mockPosts replacement)
router.get('/dashboard/posts', async (req, res) => {
  try {
    const { limit = 25 } = req.query;
    const userId = req.user.userId;
    
    // For development, use mock data
    if (mockDataService.shouldUseMockData()) {
      logger.info('Returning mock posts for dashboard');
      const mockResponse = await mockDataService.getMockPosts(parseInt(limit));
      const frontendPosts = mockDataService.convertToFrontendFormat(mockResponse.data);
      
      return res.json({
        success: true,
        posts: frontendPosts,
        account: await mockDataService.getMockAccount(),
        isMockData: true
      });
    }
    
    // Get user's first connected Instagram account
    const account = await InstagramAccount.findOne({ 
      userId, 
      isConnected: true 
    });
    
    if (!account) {
      return res.status(404).json({
        error: 'No connected Instagram account found',
        message: 'Please connect your Instagram account first'
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
    
    // Convert to frontend format
    const frontendPosts = mockDataService.convertToFrontendFormat(media.data || []);
    
    res.json({
      success: true,
      posts: frontendPosts,
      account: {
        id: account._id,
        username: account.username,
        instagramBusinessId: account.instagramBusinessId
      },
      isMockData: false
    });
    
  } catch (error) {
    logger.error('Error fetching dashboard posts:', error);
    res.status(500).json({
      error: 'Failed to fetch posts for dashboard',
      message: error.message
    });
  }
});

// Preview DM message with variable substitution
router.post('/dashboard/preview-dm', async (req, res) => {
  try {
    const { message, variables = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message template is required'
      });
    }
    
    // Generate preview with mock or provided variables
    const preview = mockDataService.generateDMPreview(message, variables);
    
    res.json({
      success: true,
      preview,
      originalMessage: message,
      variables: variables
    });
    
  } catch (error) {
    logger.error('Error generating DM preview:', error);
    res.status(500).json({
      error: 'Failed to generate DM preview',
      message: error.message
    });
  }
});

// Validate keywords for workflow
router.post('/dashboard/validate-keywords', async (req, res) => {
  try {
    const { keywords } = req.body;
    
    if (!keywords || typeof keywords !== 'string') {
      return res.status(400).json({
        error: 'Keywords string is required'
      });
    }
    
    // Parse comma-separated keywords
    const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    if (keywordList.length === 0) {
      return res.status(400).json({
        error: 'At least one keyword is required'
      });
    }
    
    // Validate keywords (basic validation)
    const validKeywords = keywordList.filter(keyword => {
      return keyword.length >= 2 && keyword.length <= 50; // Basic length validation
    });
    
    const invalidKeywords = keywordList.filter(keyword => {
      return keyword.length < 2 || keyword.length > 50;
    });
    
    res.json({
      success: true,
      validKeywords,
      invalidKeywords,
      totalCount: keywordList.length,
      validCount: validKeywords.length
    });
    
  } catch (error) {
    logger.error('Error validating keywords:', error);
    res.status(500).json({
      error: 'Failed to validate keywords',
      message: error.message
    });
  }
});

// Get keyword suggestions for dashboard
router.get('/dashboard/keyword-suggestions', async (req, res) => {
  try {
    const suggestions = [
      'price', 'cost', 'how much', 'link', 'shop', 'buy', 
      'discount', 'sale', 'offer', 'deal', 'info', 'details',
      'website', 'store', 'purchase', 'order', 'available',
      'shipping', 'delivery', 'contact', 'dm me', 'interested'
    ];
    
    res.json({
      success: true,
      suggestions: suggestions.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      )
    });
    
  } catch (error) {
    logger.error('Error fetching keyword suggestions:', error);
    res.status(500).json({
      error: 'Failed to fetch keyword suggestions',
      message: error.message
    });
  }
});

// Simulate comment matching for preview (development helper)
router.post('/dashboard/simulate-comment', async (req, res) => {
  try {
    const { postId, keywords } = req.body;
    
    if (!postId || !keywords) {
      return res.status(400).json({
        error: 'Post ID and keywords are required'
      });
    }
    
    // Get mock comments for the post
    const mockComments = await mockDataService.getMockComments(postId);
    
    // Find comments that match keywords
    const matchingComments = mockComments.data.filter(comment => 
      mockDataService.simulateKeywordMatch(comment, keywords)
    );
    
    res.json({
      success: true,
      postId,
      keywords,
      totalComments: mockComments.data.length,
      matchingComments,
      matchCount: matchingComments.length
    });
    
  } catch (error) {
    logger.error('Error simulating comment matching:', error);
    res.status(500).json({
      error: 'Failed to simulate comment matching',
      message: error.message
    });
  }
});

module.exports = router;