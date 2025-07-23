import { workflowAPI, instagramAPI, Workflow, InstagramPost, InstagramAccount } from './api';
import webSocketService from './websocket';

// Legacy interfaces for backward compatibility
export interface WorkflowConfig {
  id: string;
  name: string;
  postId: string;
  keywords: string[];
  dmMessage: string;
  linkUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStats {
  totalTriggers: number;
  messagesSent: number;
  linkClicks: number;
  conversionRate: number;
}

// Enhanced workflow service with real backend integration
export const workflowService = {
  // Get user's Instagram posts
  getUserPosts: async (accountId?: string): Promise<InstagramPost[]> => {
    try {
      if (accountId) {
        const response = await instagramAPI.getAccountMedia(accountId);
        return response.media;
      } else {
        // Get first account's posts if no specific account provided
        const accountsResponse = await instagramAPI.getAccounts();
        if (accountsResponse.accounts.length > 0) {
          const response = await instagramAPI.getAccountMedia(accountsResponse.accounts[0]._id);
          return response.media;
        }
        return [];
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  },

  // Get user's Instagram accounts
  getInstagramAccounts: async (): Promise<InstagramAccount[]> => {
    try {
      const response = await instagramAPI.getAccounts();
      return response.accounts;
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error);
      throw error;
    }
  },

  // Create a workflow
  createWorkflow: async (workflowData: {
    name: string;
    postId: string;
    keywords: string[];
    dmMessage: string;
    linkUrl?: string;
    instagramAccountId: string;
    settings?: {
      caseSensitive?: boolean;
      exactMatch?: boolean;
      maxDmsPerDay?: number;
    };
  }): Promise<Workflow> => {
    try {
      const response = await workflowAPI.create(workflowData);
      return response.workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  },

  // Get all workflows
  getWorkflows: async (params?: { 
    status?: string; 
    limit?: number; 
    offset?: number; 
  }): Promise<{
    workflows: Workflow[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> => {
    try {
      const response = await workflowAPI.getAll(params);
      return response;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  },

  // Get specific workflow
  getWorkflow: async (id: string): Promise<{ workflow: Workflow; recentEvents: any[] }> => {
    try {
      const response = await workflowAPI.getById(id);
      return response;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  },

  // Update workflow
  updateWorkflow: async (id: string, workflowData: Partial<Workflow>): Promise<Workflow> => {
    try {
      const response = await workflowAPI.update(id, workflowData);
      return response.workflow;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  },

  // Delete workflow
  deleteWorkflow: async (id: string): Promise<void> => {
    try {
      await workflowAPI.delete(id);
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  },

  // Activate workflow (Go Live)
  activateWorkflow: async (id: string): Promise<Workflow> => {
    try {
      const response = await workflowAPI.activate(id);
      
      // Subscribe to real-time updates for this workflow
      webSocketService.subscribeToWorkflow(id);
      
      return response.workflow;
    } catch (error) {
      console.error('Error activating workflow:', error);
      throw error;
    }
  },

  // Stop workflow
  stopWorkflow: async (id: string): Promise<Workflow> => {
    try {
      const response = await workflowAPI.stop(id);
      
      // Unsubscribe from real-time updates
      webSocketService.unsubscribeFromWorkflow(id);
      
      return response.workflow;
    } catch (error) {
      console.error('Error stopping workflow:', error);
      throw error;
    }
  },

  // Pause workflow
  pauseWorkflow: async (id: string): Promise<Workflow> => {
    try {
      const response = await workflowAPI.pause(id);
      return response.workflow;
    } catch (error) {
      console.error('Error pausing workflow:', error);
      throw error;
    }
  },

  // Get workflow statistics
  getWorkflowStats: async (id: string) => {
    try {
      const response = await workflowAPI.getStats(id);
      return response.stats;
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      throw error;
    }
  },

  // Test workflow keyword matching
  testWorkflow: async (id: string, testComment: string) => {
    try {
      const response = await workflowAPI.test(id, testComment);
      return response.testResult;
    } catch (error) {
      console.error('Error testing workflow:', error);
      throw error;
    }
  },

  // Get post details
  getPostDetails: async (mediaId: string): Promise<InstagramPost> => {
    try {
      const response = await instagramAPI.getMediaDetails(mediaId);
      return response.media;
    } catch (error) {
      console.error('Error fetching post details:', error);
      throw error;
    }
  },

  // Get post comments
  getPostComments: async (mediaId: string, limit = 50) => {
    try {
      const response = await instagramAPI.getMediaComments(mediaId, limit);
      return response.comments;
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  },

  // Sync Instagram account
  syncInstagramAccount: async (accountId: string): Promise<InstagramAccount> => {
    try {
      const response = await instagramAPI.syncAccount(accountId);
      return response.account;
    } catch (error) {
      console.error('Error syncing Instagram account:', error);
      throw error;
    }
  },

  // Legacy methods for backward compatibility
  toggleWorkflow: async (id: string, isActive: boolean): Promise<Workflow> => {
    if (isActive) {
      return await workflowService.activateWorkflow(id);
    } else {
      return await workflowService.stopWorkflow(id);
    }
  },

  // Validate message template
  validateMessageTemplate: (template: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check message length
    if (template.length > 1000) {
      errors.push('Message is too long (max 1000 characters)');
    }

    if (template.length < 10) {
      errors.push('Message is too short (min 10 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Process message template with actual values
  processMessageTemplate: (template: string, username: string, keyword?: string): string => {
    return template
      .replace(/\{username\}/g, username)
      .replace(/\{keyword\}/g, keyword || '')
      .replace(/\[username\]/g, username) // Legacy support
      .replace(/\[keyword\]/g, keyword || ''); // Legacy support
  },
};

// Legacy export for backward compatibility
export const mockInstagramAPI = workflowService;

export default workflowService;