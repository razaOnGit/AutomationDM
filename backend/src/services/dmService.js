const instagramAPI = require('./instagramAPI');

class DMService {
  constructor() {
    this.sentDMs = new Set(); // Track sent DMs to prevent duplicates
  }

  // Send DM to commenter
  async sendDM(workflow, comment) {
    try {
      const dmKey = `${workflow._id}-${comment.username}`;

      // Prevent duplicate DMs
      if (this.sentDMs.has(dmKey)) {
        return {
          success: false,
          error: 'DM already sent to this user for this workflow'
        };
      }

      // Prepare DM message
      let message = workflow.dmMessage;

      // Replace placeholders
      message = message.replace('{username}', comment.username);
      if (workflow.linkUrl) {
        message += `\n\n${workflow.linkUrl}`;
      }

      console.log(`📩 Sending DM to @${comment.username}: "${message}"`);

      // For testing, simulate DM sending
      // In production, this would call Instagram API
      const dmResult = await this.simulateDMSending(comment.username, message);

      if (dmResult.success) {
        this.sentDMs.add(dmKey);
        return {
          success: true,
          message: message,
          dmId: dmResult.dmId
        };
      } else {
        return {
          success: false,
          error: dmResult.error
        };
      }

    } catch (error) {
      console.error('Error sending DM:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Simulate DM sending for testing
  async simulateDMSending(username, message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate 90% success rate
    if (Math.random() > 0.1) {
      return {
        success: true,
        dmId: `dm_${Date.now()}_${username}`
      };
    } else {
      return {
        success: false,
        error: 'Instagram API error: User not found or cannot receive messages'
      };
    }
  }

  // Clear sent DMs (for testing)
  clearSentDMs() {
    this.sentDMs.clear();
    console.log('🧹 Cleared sent DMs cache');
  }
}

module.exports = new DMService();