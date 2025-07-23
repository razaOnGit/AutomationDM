const axios = require('axios');
const logger = require('../utils/logger');

class InstagramAPI {
  constructor() {
    this.baseURL = `https://graph.facebook.com/${process.env.INSTAGRAM_GRAPH_API_VERSION || 'v18.0'}`;
    this.retryDelay = parseInt(process.env.IG_RETRY_DELAY) || 5000;
    this.maxRetries = parseInt(process.env.IG_MAX_RETRIES) || 3;
  }

  async makeRequest(endpoint, method = 'GET', data = null, accessToken, retries = 0) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        params: { access_token: accessToken },
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Instagram-Comment-DM-Bot/1.0'
        },
        timeout: 30000 // 30 second timeout
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      logger.debug(`Making Instagram API request: ${method} ${endpoint}`);
      const response = await axios(config);
      
      logger.debug(`Instagram API response: ${response.status}`, {
        endpoint,
        dataSize: JSON.stringify(response.data).length
      });
      
      return response.data;

    } catch (error) {
      const errorInfo = {
        endpoint,
        method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        retryAttempt: retries + 1
      };

      logger.error('Instagram API Error:', errorInfo);

      // Handle specific error types
      if (error.response?.status === 401) {
        throw new Error('Instagram access token is invalid or expired');
      }

      if (error.response?.status === 403) {
        throw new Error('Instagram API access forbidden - check permissions');
      }

      // Retry logic for rate limits and temporary errors
      if (retries < this.maxRetries && this.shouldRetry(error)) {
        const delay = this.retryDelay * Math.pow(2, retries); // Exponential backoff
        logger.info(`Retrying request in ${delay}ms... (${retries + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, method, data, accessToken, retries + 1);
      }

      // Enhance error message for better debugging
      const enhancedError = new Error(
        error.response?.data?.error?.message || 
        error.message || 
        'Instagram API request failed'
      );
      enhancedError.status = error.response?.status;
      enhancedError.code = error.response?.data?.error?.code;
      enhancedError.type = error.response?.data?.error?.type;
      enhancedError.originalError = error;

      throw enhancedError;
    }
  }

  shouldRetry(error) {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code;

    // Retry on rate limits, temporary errors, or server errors
    return status >= 500 || status === 429 || errorCode === 4 || errorCode === 17;
  }

  // Get Instagram Business Account Info
  async getBusinessAccount(facebookPageId, accessToken) {
    return this.makeRequest(
      `/${facebookPageId}?fields=instagram_business_account`, 
      'GET', 
      null, 
      accessToken
    );
  }

  // Get Instagram Account Details
  async getAccountDetails(instagramAccountId, accessToken) {
    const fields = 'id,username,profile_picture_url,followers_count,media_count';
    return this.makeRequest(
      `/${instagramAccountId}?fields=${fields}`, 
      'GET', 
      null, 
      accessToken
    );
  }

  // Get Instagram Media (Posts/Reels)
  async getMedia(instagramAccountId, accessToken, limit = 25) {
    const fields = 'id,media_type,media_url,thumbnail_url,caption,permalink,timestamp,comments_count,like_count';
    return this.makeRequest(
      `/${instagramAccountId}/media?fields=${fields}&limit=${limit}`, 
      'GET', 
      null, 
      accessToken
    );
  }

  // Get Post/Media Details
  async getMediaDetails(mediaId, accessToken) {
    const fields = 'id,media_type,media_url,thumbnail_url,caption,permalink,timestamp,comments_count,like_count';
    return this.makeRequest(
      `/${mediaId}?fields=${fields}`, 
      'GET', 
      null, 
      accessToken
    );
  }

  // Get Comments on a Post
  async getComments(mediaId, accessToken, limit = 50) {
    const fields = 'id,text,username,timestamp,user';
    return this.makeRequest(
      `/${mediaId}/comments?fields=${fields}&limit=${limit}`, 
      'GET', 
      null, 
      accessToken
    );
  }

  // Send DM to User
  async sendDirectMessage(instagramAccountId, recipientId, message, accessToken) {
    const endpoint = `/${instagramAccountId}/messages`;
    const payload = {
      recipient: { id: recipientId },
      message: { text: message }
    };

    return this.makeRequest(endpoint, 'POST', payload, accessToken);
  }

  // Subscribe to Webhooks
  async subscribeToWebhooks(instagramAccountId, accessToken) {
    const endpoint = `/${instagramAccountId}/subscribed_apps`;
    return this.makeRequest(endpoint, 'POST', {}, accessToken);
  }

  // Validate Access Token
  async validateToken(accessToken) {
    try {
      const response = await this.makeRequest('/me', 'GET', null, accessToken);
      return { valid: true, data: response };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Get Long-lived Token (for production use)
  async getLongLivedToken(shortLivedToken) {
    try {
      const endpoint = '/oauth/access_token';
      const params = {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: shortLivedToken
      };

      const response = await axios.get(`${this.baseURL}${endpoint}`, { params });
      return response.data;

    } catch (error) {
      logger.error('Error getting long-lived token:', error);
      throw error;
    }
  }

  // Get User's Facebook Pages (needed to get Instagram Business accounts)
  async getFacebookPages(accessToken) {
    const fields = 'id,name,access_token,instagram_business_account';
    return this.makeRequest(
      `/me/accounts?fields=${fields}`, 
      'GET', 
      null, 
      accessToken
    );
  }

  // Get Instagram Business Account from Facebook Page
  async getInstagramBusinessAccount(facebookPageId, pageAccessToken) {
    return this.makeRequest(
      `/${facebookPageId}?fields=instagram_business_account`, 
      'GET', 
      null, 
      pageAccessToken
    );
  }

  // Get recent comments for monitoring (with pagination)
  async getRecentComments(mediaId, accessToken, after = null, limit = 25) {
    const fields = 'id,text,username,timestamp,user{id,username}';
    let endpoint = `/${mediaId}/comments?fields=${fields}&limit=${limit}`;
    
    if (after) {
      endpoint += `&after=${after}`;
    }
    
    return this.makeRequest(endpoint, 'GET', null, accessToken);
  }

  // Check if user can receive messages (before sending DM)
  async canReceiveMessages(instagramUserId, accessToken) {
    try {
      const response = await this.makeRequest(
        `/${instagramUserId}?fields=id,username`, 
        'GET', 
        null, 
        accessToken
      );
      return { canReceive: true, user: response };
    } catch (error) {
      return { canReceive: false, error: error.message };
    }
  }

  // Get Instagram Insights (for analytics)
  async getMediaInsights(mediaId, accessToken) {
    const metrics = 'impressions,reach,engagement,comments,likes,shares,saved';
    return this.makeRequest(
      `/${mediaId}/insights?metric=${metrics}`, 
      'GET', 
      null, 
      accessToken
    );
  }

  // Batch request for multiple operations
  async batchRequest(requests, accessToken) {
    const batchData = {
      batch: requests.map((req, index) => ({
        method: req.method || 'GET',
        relative_url: req.endpoint,
        name: req.name || `request_${index}`
      }))
    };

    return this.makeRequest('/batch', 'POST', batchData, accessToken);
  }

  // Helper method to handle pagination
  async getAllPages(initialResponse, accessToken, maxPages = 10) {
    const allData = [...(initialResponse.data || [])];
    let nextUrl = initialResponse.paging?.next;
    let pageCount = 1;

    while (nextUrl && pageCount < maxPages) {
      try {
        const nextResponse = await axios.get(nextUrl);
        allData.push(...(nextResponse.data.data || []));
        nextUrl = nextResponse.data.paging?.next;
        pageCount++;
      } catch (error) {
        logger.warn('Error fetching next page:', error.message);
        break;
      }
    }

    return {
      data: allData,
      totalPages: pageCount,
      hasMore: !!nextUrl
    };
  }
}

module.exports = new InstagramAPI();