import { useContext } from 'react';

// This will be imported from the main App.tsx file
// For now, we'll create a placeholder that can be used when we refactor
export interface WorkflowContextType {
  state: any;
  dispatch: React.Dispatch<any>;
}

// This hook will be moved here when we refactor the context out of App.tsx
export const useWorkflow = () => {
  // This will be implemented when we move the context logic here
  throw new Error('useWorkflow must be used within WorkflowProvider');
};

// Export types that will be useful for other components
export interface Comment {
  id: number;
  username: string;
  text: string;
  avatar?: string;
  isKeyword?: boolean;
}

export interface WorkflowState {
  selectedPost: any;
  commentKeyword: string;
  currentStep: 'postSelection' | 'commentKeyword' | 'dmConfiguration';
  activeWorkflowStep: 'Post' | 'Comments' | 'DM';
  showPostModal: boolean;
  dmMessage: string;
  dmLink: string;
  openingDmEnabled: boolean;
  linkUrl: string;
  showLinkModal: boolean;
  messagePreview: string;
  simulatedComments: Comment[];
  showTriggerComment: boolean;
  isLive: boolean;
  workflowId: string | null;
}

export type WorkflowAction =
  | { type: 'SET_SELECTED_POST'; payload: any }
  | { type: 'SET_COMMENT_KEYWORD'; payload: string }
  | { type: 'SET_CURRENT_STEP'; payload: WorkflowState['currentStep'] }
  | { type: 'SET_ACTIVE_WORKFLOW_STEP'; payload: WorkflowState['activeWorkflowStep'] }
  | { type: 'SET_SHOW_POST_MODAL'; payload: boolean }
  | { type: 'SET_DM_MESSAGE'; payload: string }
  | { type: 'SET_DM_LINK'; payload: string }
  | { type: 'SET_OPENING_DM_ENABLED'; payload: boolean }
  | { type: 'SET_LINK_URL'; payload: string }
  | { type: 'SET_SHOW_LINK_MODAL'; payload: boolean }
  | { type: 'SET_MESSAGE_PREVIEW'; payload: string }
  | { type: 'SET_SIMULATED_COMMENTS'; payload: Comment[] }
  | { type: 'SET_SHOW_TRIGGER_COMMENT'; payload: boolean }
  | { type: 'SET_IS_LIVE'; payload: boolean }
  | { type: 'SET_WORKFLOW_ID'; payload: string | null };