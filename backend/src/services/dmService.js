const instagramAPI = require('./instagramAPI');
const Event = require('../models/Event');
const logger = require('../utils/logger');

class DMService {
  constructor() {
    this.sentDMs = new Map(); // Track sent DMs to prevent duplicates
    this.rateLimitTracker = new Map(); // Track rate limits per account
  }

  // Main method to send DM based on workflow trigger
  async sendDM(workflow, comment, accessToken) {
    try {
      const result = {
        success: false,
        dmId: null,
        error: null,
        skipped: false,
        reason: null
      };

      // Check for duplicate DM
      const duplicateCheck = await this.checkForDuplicate(workflow._id, comment.id, comment.user?.id);
      if (duplicateCheck.isDuplicate) {
        result.skipped = true;
        result.reason = 'Duplicate DM prevented';
        logger.info(`Skipping duplicate DM for comment ${comment.id} by user ${comment.user?.id}`);
        return result;
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimit(workflow.instagramAccountId);
      if (!rateLimitCheck.allowed) {
        result.skipped = true;
        result.reason = `Rate limit exceeded: ${rateLimitCheck.message}`;
        logger.warn(`Rate limit exceeded for account ${workflow.instagramAccountId}`);
        return result;
      }

      // Check if user can receive messages
      const canReceive = await instagramAPI.canReceiveMessages(comment.user?.id, accessToken);
      if (!canReceive.canReceive) {
        result.skipped = true;
        result.reason = 'User cannot receive messages';
        logger.info(`User ${comment.user?.id} cannot receive messages: ${canReceive.error}`);
        return result;
      }

      // Prepare DM message
      const dmMessage = this.prepareDMMessage(workflow, comment);

      // Send the DM
      const dmResponse = await instagramAPI.sendDirectMessage(
        workflow.instagramAccountId,
        comment.user.id,
        dmMessage,
        accessToken
      );

      if (dmResponse && dmResponse.message_id) {
        result.success = true;
        result.dmId = dmResponse.message_id;
        
        // Track sent DM
        this.trackSentDM(workflow._id, comment.id, comment.user.id, dmResponse.message_id);
        
        // Update rate limit tracker
        this.updateRateLimitTracker(workflow.instagramAccountId);
        
        logger.info(`DM sent successfully: ${dmResponse.message_id} to user ${comment.user.id}`);
      } else {
        result.error = 'No message ID returned from Instagram API';
        logger.error('DM sending failed: No message ID returned');
      }

      return result;

    } catch (error) {
      logger.error('Error sending DM:', {
        workflowId: workflow._id,
        commentId: comment.id,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        dmId: null,
        error: error.message,
        skipped: false,
        reason: null
      };
    }
  }

  // Check for duplicate DMs
  async checkForDuplicate(workflowId, commentId, userId) {
    try {
      // Check in-memory cache first
      const cacheKey = `${workflowId}-${userId}`;
      if (this.sentDMs.has(cacheKey)) {
        return { isDuplicate: true, source: 'cache' };
      }

      // Check database for existing DM to this user from this workflow
      const existingEvent = await Event.findOne({
        workflowId,
        commenterUserId: userId,
        type: { $in: ['dm_sent', 'dm_delivered'] }
      });

      if (existingEvent) {
        // Add to cache for faster future checks
        this.sentDMs.set(cacheKey, {
          timestamp: new Date(),
          eventId: existingEvent._id
        });
        return { isDuplicate: true, source: 'database' };
      }

      return { isDuplicate: false };

    } catch (error) {
      logger.error('Error checking for duplicate DM:', error);
      // On error, assume not duplicate to avoid blocking legitimate DMs
      return { isDuplicate: false };
    }
  }

  // Check rate limits
  checkRateLimit(instagramAccountId) {
    const accountKey = instagramAccountId.toString();
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    if (!this.rateLimitTracker.has(accountKey)) {
      this.rateLimitTracker.set(accountKey, {
        hourlyCount: 0,
        dailyCount: 0,
        hourlyReset: new Date(now.getTime() + oneHour),
        dailyReset: new Date(now.getTime() + oneDay)
      });
    }

    const tracker = this.rateLimitTracker.get(accountKey);

    // Reset counters if time has passed
    if (now > tracker.hourlyReset) {
      tracker.hourlyCount = 0;
      tracker.hourlyReset = new Date(now.getTime() + oneHour);
    }

    if (now > tracker.dailyReset) {
      tracker.dailyCount = 0;
      tracker.dailyReset = new Date(now.getTime() + oneDay);
    }

    // Check limits (Instagram allows ~200 messages per hour, ~1000 per day)
    const hourlyLimit = 200;
    const dailyLimit = 1000;

    if (tracker.hourlyCount >= hourlyLimit) {
      return {
        allowed: false,
        message: `Hourly limit reached (${hourlyLimit}). Resets at ${tracker.hourlyReset.toISOString()}`
      };
    }

    if (tracker.dailyCount >= dailyLimit) {
      return {
        allowed: false,
        message: `Daily limit reached (${dailyLimit}). Resets at ${tracker.dailyReset.toISOString()}`
      };
    }

    return { allowed: true };
  }

  // Update rate limit tracker
  updateRateLimitTracker(instagramAccountId) {
    const accountKey = instagramAccountId.toString();
    const tracker = this.rateLimitTracker.get(accountKey);
    
    if (tracker) {
      tracker.hourlyCount++;
      tracker.dailyCount++;
    }
  }

  // Track sent DM in memory
  trackSentDM(workflowId, commentId, userId, dmId) {
    const cacheKey = `${workflowId}-${userId}`;
    this.sentDMs.set(cacheKey, {
      timestamp: new Date(),
      commentId,
      dmId
    });

    // Clean up old entries (keep only last 24 hours)
    this.cleanupSentDMsCache();
  }

  // Prepare DM message with personalization
  prepareDMMessage(workflow, comment) {
    let message = workflow.dmMessage;

    // Replace placeholders with actual values
    const replacements = {
      '{username}': comment.username || 'there',
      '{comment}': comment.text || '',
      '{keyword}': comment.matchedKeyword || '',
      '{link}': workflow.linkUrl || ''
    };

    // Apply replacements
    Object.entries(replacements).forEach(([placeholder, value]) => {
      message = message.replace(new RegExp(placeholder, 'g'), value);
    });

    // Ensure message doesn't exceed Instagram's limit (1000 characters)
    if (message.length > 1000) {
      message = message.substring(0, 997) + '...';
      logger.warn('DM message truncated to fit Instagram limit');
    }

    return message;
  }

  // Clean up old cache entries
  cleanupSentDMsCache() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [key, value] of this.sentDMs.entries()) {
      if (value.timestamp < oneDayAgo) {
        this.sentDMs.delete(key);
      }
    }
  }

  // Get DM statistics for an account
  getRateLimitStatus(instagramAccountId) {
    const accountKey = instagramAccountId.toString();
    const tracker = this.rateLimitTracker.get(accountKey);
    
    if (!tracker) {
      return {
        hourlyCount: 0,
        dailyCount: 0,
        hourlyLimit: 200,
        dailyLimit: 1000,
        hourlyReset: null,
        dailyReset: null
      };
    }

    return {
      hourlyCount: tracker.hourlyCount,
      dailyCount: tracker.dailyCount,
      hourlyLimit: 200,
      dailyLimit: 1000,
      hourlyReset: tracker.hourlyReset,
      dailyReset: tracker.dailyReset
    };
  }

  // Clear rate limit for testing
  clearRateLimit(instagramAccountId) {
    const accountKey = instagramAccountId.toString();
    this.rateLimitTracker.delete(accountKey);
  }

  // Clear sent DMs cache for testing
  clearSentDMsCache() {
    this.sentDMs.clear();
  }
}

module.exports = new DMService();