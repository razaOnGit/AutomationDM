import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service Class
class ApiService {
  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Authentication
  async authenticateWithInstagram(authData) {
    try {
      const response = await api.post('/api/auth/instagram/callback', authData);
      if (response.data.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Instagram authentication failed:', error);
      throw error;
    }
  }

  async verifyToken() {
    try {
      const response = await api.get('/api/auth/verify');
      return response.data;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
  }

  // Instagram Posts (replaces your mockPosts)
  async getInstagramPosts(limit = 25) {
    try {
      const response = await api.get('/api/instagram/dashboard/posts', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Instagram posts:', error);
      throw error;
    }
  }

  async getPostDetails(postId) {
    try {
      const response = await api.get(`/api/instagram/media/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch post details:', error);
      throw error;
    }
  }

  // Workflow Management
  async createWorkflow(workflowData) {
    try {
      const response = await api.post('/api/workflows', workflowData);
      return response.data;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  }

  async activateWorkflow(workflowId) {
    try {
      const response = await api.post(`/api/workflows/${workflowId}/activate`);
      return response.data;
    } catch (error) {
      console.error('Failed to activate workflow:', error);
      throw error;
    }
  }

  async getWorkflowStats(workflowId) {
    try {
      const response = await api.get(`/api/workflows/${workflowId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workflow stats:', error);
      throw error;
    }
  }

  async getUserWorkflows() {
    try {
      const response = await api.get('/api/workflows');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user workflows:', error);
      throw error;
    }
  }

  // Dashboard-specific endpoints
  async validateKeywords(keywords) {
    try {
      const response = await api.post('/api/instagram/dashboard/validate-keywords', {
        keywords
      });
      return response.data;
    } catch (error) {
      console.error('Failed to validate keywords:', error);
      throw error;
    }
  }

  async getKeywordSuggestions() {
    try {
      const response = await api.get('/api/instagram/dashboard/keyword-suggestions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch keyword suggestions:', error);
      throw error;
    }
  }

  async previewDM(message, variables = {}) {
    try {
      const response = await api.post('/api/instagram/dashboard/preview-dm', {
        message,
        variables
      });
      return response.data;
    } catch (error) {
      console.error('Failed to preview DM:', error);
      throw error;
    }
  }

  async simulateComment(postId, keywords) {
    try {
      const response = await api.post('/api/instagram/dashboard/simulate-comment', {
        postId,
        keywords
      });
      return response.data;
    } catch (error) {
      console.error('Failed to simulate comment:', error);
      throw error;
    }
  }

  // Instagram Accounts
  async getInstagramAccounts() {
    try {
      const response = await api.get('/api/instagram/accounts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Instagram accounts:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
  healthCheck,
  authenticateWithInstagram,
  verifyToken,
  getInstagramPosts,
  getPostDetails,
  createWorkflow,
  activateWorkflow,
  getWorkflowStats,
  getUserWorkflows,
  validateKeywords,
  getKeywordSuggestions,
  previewDM,
  simulateComment,
  getInstagramAccounts
} = apiService;