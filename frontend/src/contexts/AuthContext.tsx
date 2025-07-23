import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, User } from '../services/api';
import webSocketService from '../services/websocket';

// Auth State
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// Auth Context
interface AuthContextType {
  state: AuthState;
  login: (accessToken: string, userId: string, expiresIn?: number) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Auth Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('authToken'),
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Initialize auth on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
          
          // Connect to WebSocket
          await webSocketService.connect(token);
          
          // Verify token is still valid
          await verifyToken();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          logout();
        }
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (accessToken: string, userId: string, expiresIn?: number) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authAPI.instagramCallback(accessToken, userId, expiresIn);
      
      if (response.success) {
        const { token, user } = response;
        
        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        
        // Connect to WebSocket
        await webSocketService.connect(token);
        
        console.log('✅ Login successful');
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Call logout API
      authAPI.logout().catch(console.error);
      
      // Disconnect WebSocket
      webSocketService.disconnect();
      
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      dispatch({ type: 'AUTH_LOGOUT' });
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Verify token
  const verifyToken = async () => {
    try {
      const response = await authAPI.verifyToken();
      
      if (response.user) {
        dispatch({ type: 'UPDATE_USER', payload: response.user });
      }
    } catch (error: any) {
      console.error('❌ Token verification failed:', error);
      
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    verifyToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;