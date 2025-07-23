import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Redirect to login or show auth modal
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  name?: string;
  email?: string;
  facebookUserId: string;
  instagramAccounts: InstagramAccount[];
}

export interface InstagramAccount {
  _id: string;
  username: string;
  profilePicture?: string;
  followersCount: number;
  instagramBusinessId: string;
  isConnected: boolean;
}

export interface Workflow {
  _id: string;
  name: string;
  postId: string;
  postData?: {
    mediaUrl: string;
    caption: string;
    mediaType: string;
    permalink: string;
  };
  keywords: string[];
  dmMessage: string;
  linkUrl?: string;
  status: 'draft' | 'active' | 'paused' | 'stopped';
  statistics: {
    totalTriggers: number;
    dmsSent: number;
    dmsDelivered: number;
    lastTriggered?: Date;
  };
  settings: {
    caseSensitive: boolean;
    exactMatch: boolean;
    maxDmsPerDay: number;
  };
  instagramAccountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStats {
  totalTriggers: number;
  dmsSent: number;
  dmsDelivered: number;
  dmsFailed: number;
  lastActivity?: Date;
  successRate: string;
  keywordPerformance: Record<string, { triggers: number; dmsSent: number }>;
  recentEvents: any[];
}

export interface InstagramPost {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  caption: string;
  permalink: string;
  timestamp: string;
  comments_count: number;
  like_count: number;
}

export interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  user?: {
    id: string;
    username: string;
  };
}

// API Functions
export const authAPI = {
  // Instagram OAuth callback
  instagramCallback: async (accessToken: string, userId: string, expiresIn?: number) => {
    const response = await api.post('/auth/instagram/callback', {
      access_token: accessToken,
      user_id: userId,
      expires_in: expiresIn,
    });
    return response.data;
  },

  // Verify current token
  verifyToken: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Refresh token
  refreshToken: async (accessToken: string, expiresIn: number) => {
    const response = await api.post('/auth/refresh', {
      access_token: accessToken,
      expires_in: expiresIn,
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export const workflowAPI = {
  // Create workflow
  create: async (workflowData: Partial<Workflow>): Promise<{ workflow: Workflow }> => {
    const response = await api.post('/workflows', workflowData);
    return response.data;
  },

  // Get all workflows
  getAll: async (params?: { status?: string; limit?: number; offset?: number }): Promise<{
    workflows: Workflow[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> => {
    const response = await api.get('/workflows', { params });
    return response.data;
  },

  // Get specific workflow
  getById: async (id: string): Promise<{ workflow: Workflow; recentEvents: any[] }> => {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  // Update workflow
  update: async (id: string, workflowData: Partial<Workflow>): Promise<{ workflow: Workflow }> => {
    const response = await api.put(`/workflows/${id}`, workflowData);
    return response.data;
  },

  // Delete workflow
  delete: async (id: string) => {
    const response = await api.delete(`/workflows/${id}`);
    return response.data;
  },

  // Activate workflow
  activate: async (id: string): Promise<{ workflow: Workflow }> => {
    const response = await api.post(`/workflows/${id}/activate`);
    return response.data;
  },

  // Stop workflow
  stop: async (id: string): Promise<{ workflow: Workflow }> => {
    const response = await api.post(`/workflows/${id}/stop`);
    return response.data;
  },

  // Pause workflow
  pause: async (id: string): Promise<{ workflow: Workflow }> => {
    const response = await api.post(`/workflows/${id}/pause`);
    return response.data;
  },

  // Get workflow statistics
  getStats: async (id: string): Promise<{ stats: WorkflowStats }> => {
    const response = await api.get(`/workflows/${id}/stats`);
    return response.data;
  },

  // Test workflow
  test: async (id: string, testComment: string): Promise<{
    testResult: {
      workflowId: string;
      testComment: string;
      keywords: string[];
      matched: boolean;
      matchedKeyword?: string;
      dmMessage?: string;
    };
  }> => {
    const response = await api.post(`/workflows/${id}/test`, { testComment });
    return response.data;
  },
};

export const instagramAPI = {
  // Get user's Instagram accounts
  getAccounts: async (): Promise<{ accounts: InstagramAccount[] }> => {
    const response = await api.get('/instagram/accounts');
    return response.data;
  },

  // Get posts/media for an account
  getAccountMedia: async (accountId: string, limit = 25): Promise<{
    media: InstagramPost[];
    account: {
      id: string;
      username: string;
      instagramBusinessId: string;
    };
  }> => {
    const response = await api.get(`/instagram/accounts/${accountId}/media`, {
      params: { limit },
    });
    return response.data;
  },

  // Get specific post details
  getMediaDetails: async (mediaId: string): Promise<{ media: InstagramPost }> => {
    const response = await api.get(`/instagram/media/${mediaId}`);
    return response.data;
  },

  // Get comments for a post
  getMediaComments: async (mediaId: string, limit = 50): Promise<{
    comments: Comment[];
    mediaId: string;
  }> => {
    const response = await api.get(`/instagram/media/${mediaId}/comments`, {
      params: { limit },
    });
    return response.data;
  },

  // Sync Instagram account data
  syncAccount: async (accountId: string): Promise<{ account: InstagramAccount }> => {
    const response = await api.post(`/instagram/accounts/${accountId}/sync`);
    return response.data;
  },
};

export const systemAPI = {
  // Health check
  health: async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },

  // System status
  status: async () => {
    const response = await axios.get(`${API_BASE_URL}/status`);
    return response.data;
  },
};

export default api;