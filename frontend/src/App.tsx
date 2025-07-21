import React, { createContext, useContext, useReducer } from 'react';
import './App.css'; // Import the external CSS file

import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Search,
  Home,
  PlusSquare,
  Users,
  Settings,
  Play,
  Plus,
  Info
} from 'lucide-react';

// Mock data for posts
const mockPosts = [
  {
    id: 1,
    imageUrl: '/image/a.png',
    username: 'botspacehq',
    caption: 'Beautiful sunset at the beach! 🌅',
    likes: 245,
    comments: [
      { id: 1, username: 'original_user', text: 'nice video' },
      { id: 2, username: 'another_user', text: 'bddy bash' },
    ],
  },
  {
    id: 2,
    imageUrl: '/image/b.png',
    username: 'botspacehq',
    caption: '🎮 When your mom turns into your marketing manager 😩But she\'s right BotSpace is kinda genius. 🧠#BotSpace #MomKnowsBest #ContentCreatorLife',
    likes: 189,
    comments: [
      { id: 1, username: 'scared', text: 'amazing view!' },
      { id: 2, username: 'mountain_man', text: 'its not mom its' },
    ],
  },
  {
    id: 3,
    imageUrl: '/image/c.png',
    username: 'botspacehq',
    caption: 'Delicious pasta night 🍝',
    likes: 156,
    comments: [
      { id: 1, username: 'chef_mike', text: 'looks delicious!' },
      { id: 2, username: 'pasta_lover', text: 'recipe please?' },
    ],
  },
];

// Define the shape of the workflow state
interface WorkflowState {
  selectedPost: typeof mockPosts[0];
  commentKeyword: string;
  currentStep: 'postSelection' | 'commentKeyword' | 'dmConfiguration';
  activeWorkflowStep: 'Post' | 'Comments' | 'DM';
  showPostModal: boolean;
  dmMessage: string;
  dmLink: string;
  openingDmEnabled: boolean;
}

// Define the shape of the workflow actions
type WorkflowAction =
  | { type: 'SET_SELECTED_POST'; payload: typeof mockPosts[0] }
  | { type: 'SET_COMMENT_KEYWORD'; payload: string }
  | { type: 'SET_CURRENT_STEP'; payload: WorkflowState['currentStep'] }
  | { type: 'SET_ACTIVE_WORKFLOW_STEP'; payload: WorkflowState['activeWorkflowStep'] }
  | { type: 'SET_SHOW_POST_MODAL'; payload: boolean }
  | { type: 'SET_DM_MESSAGE'; payload: string }
  | { type: 'SET_DM_LINK'; payload: string }
  | { type: 'SET_OPENING_DM_ENABLED'; payload: boolean };

// Create the context
const WorkflowContext = createContext<{
  state: WorkflowState;
  dispatch: React.Dispatch<WorkflowAction>;
} | null>(null);

// Reducer function to manage workflow state
const workflowReducer = (state: WorkflowState, action: WorkflowAction): WorkflowState => {
  switch (action.type) {
    case 'SET_SELECTED_POST':
      return { ...state, selectedPost: action.payload };
    case 'SET_COMMENT_KEYWORD':
      return { ...state, commentKeyword: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_ACTIVE_WORKFLOW_STEP':
      return { ...state, activeWorkflowStep: action.payload };
    case 'SET_SHOW_POST_MODAL':
      return { ...state, showPostModal: action.payload };
    case 'SET_DM_MESSAGE':
      return { ...state, dmMessage: action.payload };
    case 'SET_DM_LINK':
      return { ...state, dmLink: action.payload };
    case 'SET_OPENING_DM_ENABLED':
      return { ...state, openingDmEnabled: action.payload };
    default:
      return state;
  }
};

// WorkflowProvider component to wrap the application
const WorkflowProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(workflowReducer, {
    selectedPost: mockPosts[0], // Default selected post
    commentKeyword: '',
    currentStep: 'postSelection', // Initial step of the workflow
    activeWorkflowStep: 'Post', // For the preview step buttons
    showPostModal: false,
    dmMessage: 'Hey there! I\'m so happy you\'re here, thanks so much for your interest 😊\n\nClick below and I\'ll send you the link in just a sec ✨',
    dmLink: '',
    openingDmEnabled: true, // Opening DM is enabled by default
  });

  return (
    <WorkflowContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Custom hook to use the workflow context
const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};

// Sidebar component
const Sidebar = () => {
  const icons = [Home, Search, PlusSquare, Users, Settings];
  return (
    <div className="sidebar">
      {icons.map((Icon, i) => (
        <div className={`sidebar-icon ${i === 2 ? 'active' : ''}`} key={i}>
          <Icon size={20} />
        </div>
      ))}
    </div>
  );
};

// Modal for selecting a post
const PostSelectionModal = () => {
  const { state, dispatch } = useWorkflow();
  if (!state.showPostModal) return null; // Only render if modal is visible

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Select a Post or Reel</h3>
        <div className="post-grid">
          {mockPosts.map((post) => (
            <div
              key={post.id}
              className="post-item"
              onClick={() => {
                dispatch({ type: 'SET_SELECTED_POST', payload: post });
                dispatch({ type: 'SET_SHOW_POST_MODAL', payload: false }); // Close modal on selection
              }}
            >
              <img src={post.imageUrl} className="post-thumbnail" alt="thumbnail" />
              <div className="post-info">
                <p className="username">@{post.username}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="cancel-btn" onClick={() => dispatch({ type: 'SET_SHOW_POST_MODAL', payload: false })}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// DM Configuration component
const DMConfiguration = () => {
  const { state, dispatch } = useWorkflow();

  return (
    <div className="dm-configuration-section">
      <h2 className="workflow-title">They will get</h2>

      <div className="dm-option">
        <div className="dm-toggle">
          <span>an opening DM</span>
          <div
            className={`toggle-switch ${state.openingDmEnabled ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_OPENING_DM_ENABLED', payload: !state.openingDmEnabled })}
          >
            <div className="toggle-slider"></div>
          </div>
        </div>

        <textarea
          className={`dm-textarea ${!state.openingDmEnabled ? 'disabled' : ''}`}
          value={state.dmMessage}
          onChange={(e) => dispatch({ type: 'SET_DM_MESSAGE', payload: e.target.value })}
          placeholder="Hey there! I'm so happy you're here, thanks so much for your interest 😊..."
          rows={4}
          disabled={!state.openingDmEnabled}
        />

        <button className="link-btn">Send me the link</button> {/* This button could trigger a link input modal */}

        <div className="info-section">
          <Info size={16} className="info-icon" />
          <span className="info-text">Why does an Opening DM matter?</span>
        </div>
      </div>

      <div className="dm-option">
        <span>a DM with the link</span>
        <textarea
          className="dm-textarea disabled" // This textarea is always disabled as per image
          placeholder="Write a message"
          rows={3}
          disabled
        />
        <p className="helper-text">Create the DM you'd like to send</p>
        <button className="add-link-btn">
          <Plus size={16} />
          Add A Link
        </button>
      </div>
      <button className="go-live-btn-main">Go Live</button>
    </div>
  );
};

// WorkflowBuilder component manages the steps
const WorkflowBuilder = () => {
  const { state, dispatch } = useWorkflow();

  // Handles moving to the next step
  const handleNextStep = () => {
    if (state.currentStep === 'postSelection') {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'commentKeyword' });
      dispatch({ type: 'SET_ACTIVE_WORKFLOW_STEP', payload: 'Comments' });
    } else if (state.currentStep === 'commentKeyword') {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'dmConfiguration' });
      dispatch({ type: 'SET_ACTIVE_WORKFLOW_STEP', payload: 'DM' });
    }
  };

  // Handles moving to the previous step
  const handleBackStep = () => {
    if (state.currentStep === 'commentKeyword') {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'postSelection' });
      dispatch({ type: 'SET_ACTIVE_WORKFLOW_STEP', payload: 'Post' });
    } else if (state.currentStep === 'dmConfiguration') {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'commentKeyword' });
      dispatch({ type: 'SET_ACTIVE_WORKFLOW_STEP', payload: 'Comments' });
    }
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'postSelection':
        return (
          <>
            <h2 className="workflow-title">When someone comments on</h2>
            <div className="radio-option selected">
              <input type="radio" checked readOnly />
              <span>a specific post or reel</span>
            </div>

            <div className="post-card-row">
              {mockPosts.map((post) => (
                <div
                  key={post.id}
                  className={`post-card ${state.selectedPost.id === post.id ? 'selected' : ''}`}
                  onClick={() => dispatch({ type: 'SET_SELECTED_POST', payload: post })}
                >
                  <img className="post-card-image" src={post.imageUrl} alt={post.caption} />
                </div>
              ))}
              <button className="show-all-btn" onClick={() => dispatch({ type: 'SET_SHOW_POST_MODAL', payload: true })}>
                Show All
              </button>
            </div>

            <div className="radio-option">
              <input type="radio" disabled />
              <span>any post or reel</span>
              <span className="pro-label">PRO</span>
            </div>

            <div className="radio-option">
              <input type="radio" disabled />
              <span>next post or reel</span>
              <span className="pro-label">PRO</span>
            </div>
          </>
        );
      
      case 'commentKeyword':
        return (
          <>
            <h2 className="workflow-title">And this comment has</h2>
            <div className="keyword-section">
              <div className="radio-option selected">
                <input type="radio" checked readOnly />
                <span>a specific word or words</span>
              </div>

              <input
                className="keyword-input"
                type="text"
                value={state.commentKeyword}
                onChange={(e) => dispatch({ type: 'SET_COMMENT_KEYWORD', payload: e.target.value })}
                placeholder="Enter a word or multiple"
              />

              <p className="hint-text">Use commas to separate words</p>
              <div className="chips">
                <span>Price</span>
                <span>Link</span>
                <span>Shop</span>
              </div>

              <div className="radio-option">
                <input type="radio" disabled />
                <span>any word</span>
              </div>
            </div>
          </>
        );
      
      case 'dmConfiguration':
        return <DMConfiguration />;
      
      default:
        return null;
    }
  };

  return (
    <div className="workflow-builder">
      {/* Workflow step buttons */}
      <div className="workflow-steps">
        <WorkflowStepButtons />
      </div>

      {/* Current step content */}
      <div className="step-content">
        {renderStepContent()}
        
        {/* Navigation buttons */}
        <div className="workflow-actions">
          {state.currentStep !== 'postSelection' && (
            <button className="back-btn" onClick={handleBackStep}>
              Back
            </button>
          )}
          
          {state.currentStep !== 'dmConfiguration' && (
            <button
              className="next-btn"
              onClick={handleNextStep}
              disabled={
                (state.currentStep === 'postSelection' && !state.selectedPost) ||
                (state.currentStep === 'commentKeyword' && !state.commentKeyword.trim())
              }
            >
              Next
            </button>
          )}
        </div>
      </div>
      
      <PostSelectionModal /> {/* Modal for selecting posts */}
    </div>
  );
};

// Workflow step buttons for preview section
const WorkflowStepButtons = () => {
  const { state, dispatch } = useWorkflow();
  const steps = ['Post', 'Comments', 'DM'];

  // Function to navigate to a specific step
  const goToStep = (stepName: 'Post' | 'Comments' | 'DM') => {
    dispatch({ type: 'SET_ACTIVE_WORKFLOW_STEP', payload: stepName });
    if (stepName === 'Post') {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'postSelection' });
    } else if (stepName === 'Comments') {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'commentKeyword' });
    } else if (stepName === 'DM') {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'dmConfiguration' });
    }
  };

  return (
    <div className="step-buttons">
      {steps.map((step) => (
        <button
          key={step}
          className={`step-btn ${state.activeWorkflowStep === step ? 'active' : ''}`}
          onClick={() => goToStep(step as 'Post' | 'Comments' | 'DM')}
        >
          {step}
        </button>
      ))}
    </div>
  );
};

// Instagram post content for the phone mockup
const InstagramPostContent = () => {
  const { state } = useWorkflow();
  const post = state.selectedPost;
  const comments = [...post.comments];

  // Add a mock comment with the keyword if in the 'Comments' step and keyword is set
  if (state.activeWorkflowStep === 'Comments' && state.commentKeyword.trim()) {
    comments.push({ id: 999, username: 'user_trigger', text: state.commentKeyword });
  }

  return (
    <div className="instagram-post">
      <div className="post-header">
        <div className="user-info">
          <div className="avatar">
            <img
              src="/image/logo.jpeg" // Original logo path
              alt="User avatar"
              className="avatar-inner"
            />
          </div>
          <span className="username">{post.username}</span>
        </div>
        <MoreHorizontal size={20} className="more-icon" />
      </div>
      <div className="post-image">
        <img className="main-image" src={post.imageUrl} alt={post.caption} />
        {/* Check if the URL indicates a video (simple check) */}
        {post.imageUrl.includes('video') && <Play className="play-icon-overlay" size={48} />}
      </div>
      <div className="post-content">
        <div className="post-actions">
          <div className="left-actions">
            <Heart className="action-icon" />
            <MessageCircle className="action-icon" />
            <Send className="action-icon" />
          </div>
          <Bookmark className="action-icon" />
        </div>
        <p className="likes-count">{post.likes} likes</p>
        <div className="caption">
          <span className="caption-username">{post.username}</span>
          <span className="caption-text">{post.caption}</span>
        </div>
        <div className="comments">
          {comments.map((c: any) => (
            <div className="comment" key={c.id}>
              <span className={`comment-username ${c.isKeyword ? 'keyword' : ''}`}>{c.username}</span>
              <span className={`comment-text ${c.isKeyword ? 'keyword' : ''}`}>
                {c.text}
                {c.isKeyword && <span className="trigger-badge">TRIGGER</span>}
              </span>
            </div>
          ))}
        </div>
        {/* DM Preview conditional rendering */}
        {state.activeWorkflowStep === 'DM' && state.openingDmEnabled && (
          <div className="dm-preview">
            <p className="dm-label">DM WILL BE SENT:</p>
            <p className="dm-text">
              "{state.dmMessage}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Phone mockup for Instagram preview
const PhoneMockup = () => (
  <div className="phone-mockup">
    <div className="phone-frame">
      <div className="phone-inner">
        <div className="phone-content">
          <div className="status-bar">
            <div className="status-indicators">
              <div className="indicator" />
              <div className="signal-bar" />
              <div className="dot" />
            </div>
          </div>
          <div className="instagram-header">
            <h3 className="app-title">BOTSPACEHQ</h3>
          </div>
          <div className="content-area">
            <InstagramPostContent />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Instagram preview section
const InstagramPreview = () => (
  <div className="instagram-preview">
    <div className="preview-header">
      <h2 className="preview-title">Preview</h2>
      <button className="go-live-btn">Go Live</button>
    </div>
    <WorkflowStepButtons />
    <PhoneMockup />
  </div>
);

// Main App component
const App = () => (
  <WorkflowProvider>
    <div className="app">
      <Sidebar />
      <WorkflowBuilder />
      <InstagramPreview />
    </div>
  </WorkflowProvider>
);

export default App;
