import React, { createContext, useContext, useReducer } from 'react';
import './App.css'; // Import the external CSS file

// Images will be served from public folder

import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MessageSquare,
  MoreHorizontal,
  Search,
  Home,
  User,
  PlusSquare,
  Settings,
  Plus,
  Info,
  ChevronLeft,
  Phone,
  Video,
  Camera,
  Smile
} from 'lucide-react';

// Define Comment interface
interface Comment {
  id: number;
  username: string;
  text: string;
  avatar?: string;
  isKeyword?: boolean;
}

// Mock data for posts
const mockPosts = [
  {
    id: 1,
    imageUrl: '/image/a.png',
    username: 'botspacehq',
    caption: 'Even superheroes need a sidekick. 🦸‍♂️ If Iron Man trusts Botspace, maybe its time for your business to discover its power. Join us! ✨',
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
    caption: `
     use AI to automate DMs that sell.
     create content that actually converts.
     How to get discovered by buyers — not just followers
     You just need the right tools. Drop Dm. Use it. And watch your sales grow.
    `,
    likes: 156,
    comments: [
      { id: 1, username: 'digital_marketer', text: 'This is exactly what I needed!' },
      { id: 2, username: 'entrepreneur_life', text: 'Which AI tools do you recommend?' },
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
  dmWithLinkMessage: string;
  openingDmEnabled: boolean;
  linkUrl: string;
  showLinkModal: boolean;
  messagePreview: string;
  simulatedComments: Comment[];
  showTriggerComment: boolean;
  isLive: boolean;
  workflowId: string | null;
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
  | { type: 'SET_DM_WITH_LINK_MESSAGE'; payload: string }
  | { type: 'SET_OPENING_DM_ENABLED'; payload: boolean }
  | { type: 'SET_LINK_URL'; payload: string }
  | { type: 'SET_SHOW_LINK_MODAL'; payload: boolean }
  | { type: 'SET_MESSAGE_PREVIEW'; payload: string }
  | { type: 'SET_SIMULATED_COMMENTS'; payload: Comment[] }
  | { type: 'SET_SHOW_TRIGGER_COMMENT'; payload: boolean }
  | { type: 'SET_IS_LIVE'; payload: boolean }
  | { type: 'SET_WORKFLOW_ID'; payload: string | null };

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
    case 'SET_DM_WITH_LINK_MESSAGE':
      return { ...state, dmWithLinkMessage: action.payload };
    case 'SET_OPENING_DM_ENABLED':
      return { ...state, openingDmEnabled: action.payload };
    case 'SET_LINK_URL':
      return { ...state, linkUrl: action.payload };
    case 'SET_SHOW_LINK_MODAL':
      return { ...state, showLinkModal: action.payload };
    case 'SET_MESSAGE_PREVIEW':
      return { ...state, messagePreview: action.payload };
    case 'SET_SIMULATED_COMMENTS':
      return { ...state, simulatedComments: action.payload };
    case 'SET_SHOW_TRIGGER_COMMENT':
      return { ...state, showTriggerComment: action.payload };
    case 'SET_IS_LIVE':
      return { ...state, isLive: action.payload };
    case 'SET_WORKFLOW_ID':
      return { ...state, workflowId: action.payload };
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
    dmWithLinkMessage: '',
    openingDmEnabled: true, // Opening DM is enabled by default
    linkUrl: '',
    showLinkModal: false,
    messagePreview: '',
    simulatedComments: [],
    showTriggerComment: false,
    isLive: false,
    workflowId: null,
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
  const icons = [Home, Search, PlusSquare, User, MessageSquare, Send, Settings]; // Keep your existing icons

  return (
    <div className="sidebar">
      {/* "M" initial or user avatar placeholder */}
      <div className="sidebar-initial">M</div> {/* Or an image: <img src="/path/to/user-avatar.png" alt="User" /> */}

      {/* Company Logo */}
      <div className="sidebar-logo">
        <img src="/image/logo.jpeg" alt="Company Logo" /> {/* Use your actual logo path */}
      </div>

      {/* Spacer to push icons down, if needed, or adjust gap on sidebar */}
      <div className="sidebar-spacer"></div>

      {icons.map((Icon, i) => (
        <div className={`sidebar-icon ${i === 2 ? 'active' : ''}`} key={i}>
          {Icon === MessageSquare ? (
            <div className="sidebar-message-icon-wrapper">
              <Icon size={20} />
              <div className="sidebar-notification-dot"></div>
            </div>
          ) : (
            <Icon size={20} />
          )}
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

  // Handle Go Live button click - Connect to backend
  const handleGoLive = async () => {
    try {
      // Prepare workflow data for backend
      const workflowData = {
        name: `Workflow for ${state.selectedPost.username}`,
        postId: state.selectedPost.id.toString(),
        keywords: state.commentKeyword.split(',').map(k => k.trim()),
        dmMessage: state.dmMessage,
        dmWithLinkMessage: state.dmWithLinkMessage,
        linkUrl: state.linkUrl,
        openingDmEnabled: state.openingDmEnabled
      };

      console.log('🚀 Sending Go Live request to backend:', workflowData);

      // Call backend API
      const response = await fetch('http://localhost:5000/api/go-live', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(workflowData)
      });

      const result = await response.json();

      if (result.success) {
        // Update frontend state
        dispatch({ type: 'SET_IS_LIVE', payload: true });
        dispatch({ type: 'SET_WORKFLOW_ID', payload: result.workflow._id });
        
        console.log('✅ Workflow is now LIVE!', result);
        alert('🚀 Workflow is now LIVE! Monitoring comments for keywords...');
      } else {
        console.error('❌ Failed to go live:', result.error);
        alert(`Failed to activate workflow: ${result.error}`);
      }

    } catch (error) {
      console.error('❌ Error connecting to backend:', error);
      alert('Failed to connect to backend. Make sure the server is running on port 5000.');
    }
  };

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
          className="dm-textarea"
          value={state.dmWithLinkMessage}
          onChange={(e) => dispatch({ type: 'SET_DM_WITH_LINK_MESSAGE', payload: e.target.value })}
          placeholder="Write a message"
          rows={3}
        />
        <p className="helper-text">Create the DM you'd like to send</p>
        <button
          className="add-link-btn"
          onClick={() => dispatch({ type: 'SET_SHOW_LINK_MODAL', payload: true })}
        >
          <Plus size={16} />
          Add A Link
        </button>
      </div>
      <button 
        className="go-live-btn-main"
        onClick={handleGoLive}
        disabled={state.isLive}
      >
        {state.isLive ? 'LIVE 🔴' : 'Go Live'}
      </button>
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

  return (
    <div className="workflow-builder">


      {/* Step 1: Post Selection */}
      {state.currentStep === 'postSelection' && (
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

          <div className="workflow-actions">
            <button
              className="next-btn"
              onClick={handleNextStep}
              disabled={!state.selectedPost} // Disable if no post is selected
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Step 2: Comment Keywords */}
      {state.currentStep === 'commentKeyword' && (
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
            <p className="example-text">For example:</p>
            <div className="suggestion-chips">
              {['Price', 'Link', 'Shop', 'Discount', 'Buy', 'Sale'].map((word) => (
                <button
                  key={word}
                  className="suggestion-chip"
                  onClick={() => {
                    const currentKeywords = state.commentKeyword.trim();
                    const newKeyword = currentKeywords
                      ? `${currentKeywords}, ${word}`
                      : word;
                    dispatch({ type: 'SET_COMMENT_KEYWORD', payload: newKeyword });
                  }}
                >
                  {word}
                </button>
              ))}
            </div>

            <div className="radio-option">
              <input type="radio" disabled />
              <span>any word</span>
            </div>
          </div>

          <div className="workflow-actions">
            <button className="back-btn" onClick={handleBackStep}>
              Back
            </button>
            <button
              className="next-btn"
              onClick={handleNextStep}
              disabled={!state.commentKeyword.trim()} // Disable if keyword is empty
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Step 3: DM Configuration */}
      {state.currentStep === 'dmConfiguration' && (
        <>
          <DMConfiguration />
          <div className="workflow-actions">
            <button className="back-btn" onClick={handleBackStep}>
              Back
            </button>
          </div>
        </>
      )}

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

// DM Preview component for the phone mockup
const DMPreview = () => {
  const { state } = useWorkflow();

  return (
    <div className="dm-interface">
      {/* DM Header */}
      <div className="dm-header">
        <div className="dm-user-info">
          <ChevronLeft size={20} />
          <div className="dm-avatar">
            <img src="/image/logo.jpeg" alt="User" />
          </div>
          <span className="dm-username">botspacehq</span>
        </div>
        <div className="dm-actions">
          <Phone size={20} />
          <Video size={20} />
        </div>
      </div>

      {/* Message History */}
      <div className="messages-container">
        {/* Opening DM message */}
        {state.openingDmEnabled && state.dmMessage && (
          <div className="message-bubble received">
            <p>{state.dmMessage}</p>
          </div>
        )}

        <div className="message-bubble received">
          <p>Click below and I'll send you the link in just a sec ✨</p>
        </div>

        <div className="link-button-message">
          <button className="send-link-btn">Send me the link</button>
        </div>

        {/* DM with link message - appears from bot side when user types */}
        {state.dmWithLinkMessage && (
          <div className="message-bubble received">
            <p>{state.dmWithLinkMessage}</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="message-input-wrapper">
          <Camera size={20} />
          <input
            type="text"
            placeholder="Write a message"
            className="message-input"
          />
          <Smile size={20} />
        </div>
      </div>
    </div>
  );
};

// Link Modal component
const LinkModal = () => {
  const { state, dispatch } = useWorkflow();
  const [linkUrl, setLinkUrl] = React.useState('');

  if (!state.showLinkModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add a Link</h3>
        <input
          type="url"
          placeholder="Paste your link here"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="link-input"
        />
        <div className="modal-actions">
          <button onClick={() => dispatch({ type: 'SET_SHOW_LINK_MODAL', payload: false })}>
            Cancel
          </button>
          <button onClick={() => {
            dispatch({ type: 'SET_LINK_URL', payload: linkUrl });
            dispatch({ type: 'SET_SHOW_LINK_MODAL', payload: false });
          }}>
            Add Link
          </button>
        </div>
      </div>
    </div>
  );
};

// Instagram Comments View that matches the image UI exactly
const InstagramCommentsView = () => {
  const { state } = useWorkflow();
  const [newComment, setNewComment] = React.useState('');

  // Only show comments view if there's input in the keyword field
  if (!state.commentKeyword.trim()) {
    return <InstagramPostContent />;
  }

  // Get the first keyword to display as comment
  const getDisplayComment = () => {
    const keywords = state.commentKeyword.toLowerCase().split(',').map(word => word.trim());
    const firstKeyword = keywords[0];
    return firstKeyword.charAt(0).toUpperCase() + firstKeyword.slice(1);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  return (
    <div className="instagram-comments-dialog">
      {/* Header with back arrow and title */}
      <div className="comments-dialog-header">
        <ChevronLeft size={20} className="back-arrow" />
        <div className="header-center">
          <span className="header-username">BOTSPACEHQ</span>
          <span className="header-subtitle">Posts</span>
        </div>
        <div className="header-spacer"></div>
      </div>

      {/* User profile row */}
      <div className="profile-row">
        <div className="profile-avatar-small">
          <img src="/image/logo.jpeg" alt="Profile" />
        </div>
        <span className="profile-name">botspacehq</span>
        <MoreHorizontal size={16} className="profile-more" />
      </div>

      {/* Half post preview - exactly like in your image */}
      <div className="half-post-preview">
        <img src={state.selectedPost.imageUrl} alt="Post preview" className="half-post-image" />
        <div className="post-text-overlay">
          {/* <span className="overlay-text">3 Billion Users!</span> */}
        </div>
        <div className="post-bottom-bar">
          <span className="white-bar"></span>
        </div>
      </div>

      {/* Comments section header */}
      <div className="comments-header-bar">
        <span className="comments-title">Comments</span>
        <Send size={16} className="send-icon" />
      </div>

      {/* Single comment matching the keyword */}
      <div className="comments-list">
        <div className="single-comment">
          <div className="comment-avatar-circle">
            <img src="/image/logo.jpeg" alt="User avatar" />
          </div>
          <div className="comment-content">
            <div className="comment-top-row">
              <span className="comment-username">Username</span>
              <span className="comment-time">Now</span>
              <Heart size={12} className="comment-heart-icon" />
            </div>
            <div className="comment-text">
              {getDisplayComment()}
            </div>
            <button className="reply-btn">Reply</button>
          </div>
        </div>
      </div>

      {/* Spacer for empty area */}
      <div className="comments-spacer"></div>

      {/* Emoji reactions bar */}
      <div className="emoji-reactions-bar">
        {['❤️', '🙌', '👍', '👏', '😢', '😍', '😮', '😂'].map((emoji, index) => (
          <span key={index} className="emoji-reaction">
            {emoji}
          </span>
        ))}
      </div>

      {/* Comment input at bottom */}
      <div className="comment-input-bottom">
        <div className="input-wrapper">
          <div className="input-avatar-circle">
            <Camera size={16} />
          </div>
          <input
            type="text"
            placeholder="Add a comment for username..."
            className="comment-input-text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
        </div>
      </div>
    </div>
  );
};

// Instagram Bottom Navigation Component
const InstagramBottomNav = () => (
  <div className="instagram-bottom-nav">
    <Home size={24} className="nav-icon active" />
    <Search size={24} className="nav-icon" />
    <PlusSquare size={24} className="nav-icon" />
    <User size={24} className="nav-icon" />
    <MessageCircle size={24} className="nav-icon" />
  </div>
);

// Enhanced Instagram post content with restructured bottom section
const InstagramPostContent = () => {
  const { state } = useWorkflow();

  return (
    <div className="instagram-post">
      {/* Enhanced header with better styling */}
      <div className="post-header">
        <div className="user-info">
          <div className="profile-avatar">
            <img src="/image/logo.jpeg" alt="Profile" />
          </div>
          <span className="username">botspacehq</span>
          <button className="follow-btn">Follow</button>
        </div>
        <MoreHorizontal size={16} />
      </div>

      {/* Main post image */}
      <div className="post-image-container">
        <img src={state.selectedPost.imageUrl} alt="Post" />
      </div>

      {/* MAIN UPDATE: Restructured bottom section */}
      <div className="post-bottom-section">
        {/* Action buttons row */}
        <div className="post-actions">
          <div className="left-actions">
            <Heart size={24} className="action-icon" />
            <MessageCircle size={24} className="action-icon" />
            <Send size={24} className="action-icon" />
          </div>
          <Bookmark size={24} className="action-icon bookmark-right" />
        </div>

        {/* Likes count */}
        <div className="likes-count">
          <span>{state.selectedPost.likes} likes</span>
        </div>

        {/* Caption with username */}
        <div className="post-caption">
          <span className="caption-username">botspacehq</span>
          <span className="caption-text">{state.selectedPost.caption}</span>
        </div>

        {/* View all comments link */}
        <button className="view-comments-link">
          View all comments
        </button>

        {/* Time stamp */}
        <div className="post-timestamp">
          <span>6 May, 2025</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced PhoneMockup with dynamic content switching and bottom nav
const PhoneMockup = () => {
  const { state } = useWorkflow();

  const renderContent = () => {
    switch (state.activeWorkflowStep) {
      case 'Post':
        return (
          <>
            <InstagramPostContent />
            <InstagramBottomNav />
          </>
        );
      case 'Comments':
        return (
          <>
            <InstagramCommentsView />
            <InstagramBottomNav />
          </>
        );
      case 'DM':
        return <DMPreview />;
      default:
        return (
          <>
            <InstagramPostContent />
            <InstagramBottomNav />
          </>
        );
    }
  };

  return (
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
              <div className="header-left">
                <img src="/image/logo.jpeg" alt="BotSpace" className="botspace-logo" />
              </div>
              <h3 className="app-title">BOTSPACEHQ</h3>
              <div className="header-right">
                <MessageSquare size={24} />
              </div>
            </div>
            <div className="content-area">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <LinkModal />
    </div>
  </WorkflowProvider>
);

export default App;
