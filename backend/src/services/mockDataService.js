const logger = require('../utils/logger');

class MockDataService {
  constructor() {
    // Mock Instagram posts that match your frontend mockPosts structure
    this.mockPosts = [
      {
        id: '17841400027244616',
        media_type: 'IMAGE',
        media_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t51.29350-15/462567890_1051072226680542_8598993748443717187_n.jpg',
        thumbnail_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t51.29350-15/462567890_1051072226680542_8598993748443717187_n.jpg',
        caption: 'Even superheroes need a sidekick. 🦸‍♂️ If Iron Man trusts Botspace, maybe its time for your business to discover its power. Join us! ✨',
        permalink: 'https://www.instagram.com/p/ABC123/',
        timestamp: '2025-01-26T10:00:00+0000',
        comments_count: 12,
        like_count: 245,
        username: 'botspacehq'
      },
      {
        id: '17841400027244617',
        media_type: 'VIDEO',
        media_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t50.2886-16/462567891_video.mp4',
        thumbnail_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t51.29350-15/462567891_thumbnail.jpg',
        caption: '🎮 When your mom turns into your marketing manager 😩But she\'s right BotSpace is kinda genius. 🧠#BotSpace #MomKnowsBest #ContentCreatorLife',
        permalink: 'https://www.instagram.com/p/DEF456/',
        timestamp: '2025-01-25T15:30:00+0000',
        comments_count: 8,
        like_count: 189,
        username: 'botspacehq'
      },
      {
        id: '17841400027244618',
        media_type: 'CAROUSEL_ALBUM',
        media_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t51.29350-15/462567892_carousel.jpg',
        thumbnail_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t51.29350-15/462567892_carousel.jpg',
        caption: 'use AI to automate DMs that sell.\ncreate content that actually converts.\nHow to get discovered by buyers — not just followers\nYou just need the right tools. Drop Dm. Use it. And watch your sales grow.',
        permalink: 'https://www.instagram.com/p/GHI789/',
        timestamp: '2025-01-24T09:15:00+0000',
        comments_count: 15,
        like_count: 156,
        username: 'botspacehq'
      },
      {
        id: '17841400027244619',
        media_type: 'IMAGE',
        media_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t51.29350-15/462567893_image4.jpg',
        thumbnail_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t51.29350-15/462567893_image4.jpg',
        caption: '🚀 Ready to scale your business with AI? Our automation tools help you convert followers into customers 24/7. #AIAutomation #BusinessGrowth',
        permalink: 'https://www.instagram.com/p/JKL012/',
        timestamp: '2025-01-23T14:20:00+0000',
        comments_count: 6,
        like_count: 98,
        username: 'botspacehq'
      },
      {
        id: '17841400027244620',
        media_type: 'VIDEO',
        media_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t50.2886-16/462567894_video2.mp4',
        thumbnail_url: 'https://scontent-cdg4-2.cdninstagram.com/v/t51.29350-15/462567894_thumbnail2.jpg',
        caption: '💡 Stop losing potential customers in your DMs! See how our comment-to-DM automation works in real-time. Link in bio! 🔗',
        permalink: 'https://www.instagram.com/p/MNO345/',
        timestamp: '2025-01-22T11:45:00+0000',
        comments_count: 20,
        like_count: 312,
        username: 'botspacehq'
      }
    ];

    this.mockComments = {
      '17841400027244616': [
        {
          id: 'comment_1',
          text: 'What\'s the price for this?',
          username: 'potential_customer_1',
          timestamp: '2025-01-26T10:05:00+0000',
          user: { id: 'user_1', username: 'potential_customer_1' }
        },
        {
          id: 'comment_2',
          text: 'This looks amazing! How much does it cost?',
          username: 'interested_buyer',
          timestamp: '2025-01-26T10:10:00+0000',
          user: { id: 'user_2', username: 'interested_buyer' }
        },
        {
          id: 'comment_3',
          text: 'Nice video!',
          username: 'regular_user',
          timestamp: '2025-01-26T10:15:00+0000',
          user: { id: 'user_3', username: 'regular_user' }
        }
      ],
      '17841400027244617': [
        {
          id: 'comment_4',
          text: 'Can you send me the link?',
          username: 'link_requester',
          timestamp: '2025-01-25T15:35:00+0000',
          user: { id: 'user_4', username: 'link_requester' }
        },
        {
          id: 'comment_5',
          text: 'Where can I buy this?',
          username: 'buyer_ready',
          timestamp: '2025-01-25T15:40:00+0000',
          user: { id: 'user_5', username: 'buyer_ready' }
        }
      ]
    };

    this.mockAccount = {
      id: 'mock_account_123',
      username: 'botspacehq',
      instagramBusinessId: '17841400027244615',
      profilePicture: 'https://scontent-cdg4-2.cdninstagram.com/v/profile_pic.jpg',
      followersCount: 15420,
      isConnected: true
    };
  }

  // Get mock Instagram posts (matches Instagram API format)
  async getMockPosts(limit = 25) {
    logger.info(`Returning ${Math.min(limit, this.mockPosts.length)} mock posts`);
    
    return {
      success: true,
      data: this.mockPosts.slice(0, limit),
      paging: {
        cursors: {
          before: 'before_cursor',
          after: 'after_cursor'
        },
        next: this.mockPosts.length > limit ? 'next_page_url' : null
      }
    };
  }

  // Get mock post details
  async getMockPostDetails(postId) {
    const post = this.mockPosts.find(p => p.id === postId);
    
    if (!post) {
      throw new Error('Post not found');
    }

    logger.info(`Returning mock post details for ${postId}`);
    return post;
  }

  // Get mock comments for a post
  async getMockComments(postId, limit = 50) {
    const comments = this.mockComments[postId] || [];
    
    logger.info(`Returning ${comments.length} mock comments for post ${postId}`);
    
    return {
      success: true,
      data: comments.slice(0, limit),
      paging: {
        cursors: {
          before: 'before_cursor',
          after: 'after_cursor'
        }
      }
    };
  }

  // Get mock account info
  async getMockAccount() {
    logger.info('Returning mock Instagram account');
    return this.mockAccount;
  }

  // Convert mock post to frontend format (matches your mockPosts structure)
  convertToFrontendFormat(posts) {
    return posts.map(post => ({
      id: parseInt(post.id.slice(-6)), // Convert to number for frontend compatibility
      imageUrl: post.thumbnail_url || post.media_url,
      username: post.username || 'botspacehq',
      caption: post.caption || '',
      likes: post.like_count || 0,
      comments: [], // Will be populated separately if needed
      permalink: post.permalink,
      timestamp: post.timestamp,
      media_type: post.media_type,
      comments_count: post.comments_count || 0
    }));
  }

  // Simulate keyword matching for testing
  simulateKeywordMatch(comment, keywords) {
    const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());
    const commentText = comment.text.toLowerCase();
    
    return keywordList.some(keyword => commentText.includes(keyword));
  }

  // Generate mock DM preview
  generateDMPreview(template, variables = {}) {
    let preview = template;
    
    // Replace common variables
    const defaultVariables = {
      username: variables.username || 'testuser',
      link: variables.link || 'https://example.com',
      firstname: variables.firstname || 'Test'
    };

    Object.keys(defaultVariables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'gi');
      preview = preview.replace(regex, defaultVariables[key]);
    });

    return preview;
  }

  // Check if we should use mock data (for development)
  shouldUseMockData() {
    return process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true';
  }
}

module.exports = new MockDataService();