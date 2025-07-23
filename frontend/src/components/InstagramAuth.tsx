import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface InstagramAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const InstagramAuth: React.FC<InstagramAuthProps> = ({ onSuccess, onError }) => {
  const { login, state } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleInstagramLogin = () => {
    setIsLoading(true);

    const appId = process.env.REACT_APP_FACEBOOK_APP_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const scope = 'instagram_basic,instagram_manage_comments,instagram_manage_messages';

    // Instagram OAuth URL
    const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

    // Open Instagram OAuth in a popup
    const popup = window.open(
      instagramAuthUrl,
      'instagram-auth',
      'width=600,height=600,scrollbars=yes,resizable=yes'
    );

    // Listen for messages from the popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'INSTAGRAM_AUTH_SUCCESS') {
        const { accessToken, userId, expiresIn } = event.data;
        
        try {
          await login(accessToken, userId, expiresIn);
          popup?.close();
          setIsLoading(false);
          onSuccess?.();
        } catch (error: any) {
          console.error('Login failed:', error);
          setIsLoading(false);
          onError?.(error.message || 'Login failed');
        }
      } else if (event.data.type === 'INSTAGRAM_AUTH_ERROR') {
        popup?.close();
        setIsLoading(false);
        onError?.(event.data.error || 'Authentication failed');
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="instagram-auth">
      <button
        onClick={handleInstagramLogin}
        disabled={isLoading || state.isLoading}
        className="instagram-auth-button"
        style={{
          background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isLoading ? (
          <>
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            Connecting...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Connect Instagram
          </>
        )}
      </button>

      {state.error && (
        <div
          style={{
            color: '#dc2626',
            fontSize: '14px',
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
          }}
        >
          {state.error}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default InstagramAuth;