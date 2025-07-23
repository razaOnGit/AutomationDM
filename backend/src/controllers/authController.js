const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InstagramAccount = require('../models/InstagramAccount');
const instagramAPI = require('../services/instagramAPI');
const logger = require('../utils/logger');

class AuthController {
  // Instagram OAuth Callback
  async instagramCallback(req, res) {
    try {
      const { access_token, user_id, expires_in } = req.body;

      if (!access_token || !user_id) {
        return res.status(400).json({ 
          error: 'Missing access token or user ID' 
        });
      }

      logger.info(`Instagram OAuth callback for user: ${user_id}`);

      // Create or update user
      const user = await User.createOrUpdate({
        facebookUserId: user_id,
        accessToken: access_token,
        // Calculate expiration time (default 60 days if not provided)
        expiresIn: expires_in ? expires_in * 1000 : 60 * 24 * 60 * 60 * 1000
      });

      // Sync Instagram Business Accounts
      await this.syncInstagramAccounts(user);

      // Generate JWT
      const token = jwt.sign(
        { 
          userId: user._id, 
          facebookUserId: user.facebookUserId 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      logger.info(`User authenticated successfully: ${user._id}`);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          facebookUserId: user.facebookUserId,
          instagramAccounts: user.instagramAccounts
        }
      });

    } catch (error) {
      logger.error('Instagram callback error:', error);
      res.status(500).json({ 
        error: 'Authentication failed',
        message: error.message 
      });
    }
  }

  // Sync Instagram Business Accounts
  async syncInstagramAccounts(user) {
    try {
      logger.info(`Syncing Instagram accounts for user: ${user._id}`);

      // For MVP, we'll use a placeholder Instagram Business ID
      // In production, you'd fetch Facebook Pages first, then their Instagram accounts
      const mockAccountData = {
        id: 'mock_ig_business_id',
        username: 'mock_username',
        profile_picture_url: 'https://example.com/profile.jpg',
        followers_count: 1000
      };

      let instagramAccount = await InstagramAccount.findByBusinessId(mockAccountData.id);

      if (!instagramAccount) {
        instagramAccount = new InstagramAccount({
          userId: user._id,
          instagramBusinessId: mockAccountData.id,
          username: mockAccountData.username,
          profilePicture: mockAccountData.profile_picture_url,
          followersCount: mockAccountData.followers_count
        });
      } else {
        await instagramAccount.updateAccountInfo(mockAccountData);
      }

      await instagramAccount.save();

      // Add to user's Instagram accounts if not already there
      if (!user.instagramAccounts.includes(instagramAccount._id)) {
        user.instagramAccounts.push(instagramAccount._id);
        await user.save();
      }

      logger.info(`Instagram account synced: ${instagramAccount.username}`);

    } catch (error) {
      logger.error('Error syncing Instagram accounts:', error);
      throw error;
    }
  }

  // Verify JWT Token
  async verifyToken(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .populate('instagramAccounts')
        .select('-accessToken');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if Instagram token is expired
      if (user.isTokenExpired()) {
        return res.status(401).json({ 
          error: 'Instagram access token expired',
          requiresReauth: true 
        });
      }

      res.json({ 
        success: true,
        user 
      });

    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(500).json({ error: 'Token verification failed' });
    }
  }

  // Refresh Instagram Token
  async refreshToken(req, res) {
    try {
      const { access_token, expires_in } = req.body;

      if (!access_token) {
        return res.status(400).json({ error: 'Access token required' });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update token
      await user.updateToken(access_token, expires_in * 1000);

      logger.info(`Token refreshed for user: ${user._id}`);

      res.json({ 
        success: true,
        message: 'Token refreshed successfully' 
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      // For JWT, we just return success
      // In production, you might want to blacklist the token
      res.json({ 
        success: true,
        message: 'Logged out successfully' 
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
}

module.exports = new AuthController();