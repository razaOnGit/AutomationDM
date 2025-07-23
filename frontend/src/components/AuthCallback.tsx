import React, { useEffect } from 'react';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          // Send error to parent window
          window.opener?.postMessage({
            type: 'INSTAGRAM_AUTH_ERROR',
            error: errorDescription || error,
          }, window.location.origin);
          window.close();
          return;
        }

        if (code) {
          // Exchange code for access token
          const response = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.REACT_APP_FACEBOOK_APP_ID!,
              client_secret: process.env.REACT_APP_FACEBOOK_APP_SECRET!,
              grant_type: 'authorization_code',
              redirect_uri: window.location.origin + '/auth/callback',
              code: code,
            }),
          });

          const data = await response.json();

          if (data.access_token) {
            // Send success to parent window
            window.opener?.postMessage({
              type: 'INSTAGRAM_AUTH_SUCCESS',
              accessToken: data.access_token,
              userId: data.user_id,
              expiresIn: data.expires_in,
            }, window.location.origin);
          } else {
            throw new Error(data.error_message || 'Failed to get access token');
          }
        } else {
          throw new Error('No authorization code received');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        window.opener?.postMessage({
          type: 'INSTAGRAM_AUTH_ERROR',
          error: error.message || 'Authentication failed',
        }, window.location.origin);
      }

      window.close();
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px',
        }} />
        <p>Processing authentication...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default AuthCallback;