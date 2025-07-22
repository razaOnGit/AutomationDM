// Workflow Service for managing Instagram automation workflows

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

class WorkflowService {
  private baseUrl = '/api/workflows'; // This would be your actual API endpoint

  // Create a new workflow
  async createWorkflow(config: Omit<WorkflowConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowConfig> {
    try {
      // In a real implementation, this would make an API call
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Update an existing workflow
  async updateWorkflow(id: string, updates: Partial<WorkflowConfig>): Promise<WorkflowConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  // Get workflow statistics
  async getWorkflowStats(id: string): Promise<WorkflowStats> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/stats`);

      if (!response.ok) {
        throw new Error('Failed to fetch workflow stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      throw error;
    }
  }

  // Activate/deactivate a workflow
  async toggleWorkflow(id: string, isActive: boolean): Promise<WorkflowConfig> {
    return this.updateWorkflow(id, { isActive });
  }

  // Delete a workflow
  async deleteWorkflow(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  // Get all workflows for the user
  async getWorkflows(): Promise<WorkflowConfig[]> {
    try {
      const response = await fetch(this.baseUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  }

  // Validate message template
  validateMessageTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required placeholders
    if (!template.includes('[username]')) {
      errors.push('Message should include [username] placeholder');
    }

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
  }

  // Process message template with actual values
  processMessageTemplate(template: string, username: string, keyword?: string): string {
    return template
      .replace(/\[username\]/g, username)
      .replace(/\[keyword\]/g, keyword || '');
  }
}

// Export a singleton instance
export const workflowService = new WorkflowService();
export default workflowService;