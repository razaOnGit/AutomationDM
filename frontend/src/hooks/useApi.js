import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

// Custom hook for API calls with loading and error states
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  return { data, loading, error, execute };
};

// Hook for Instagram posts (replaces your mockPosts)
export const useInstagramPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async (limit = 25) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getInstagramPosts(limit);
      
      if (response.success) {
        setPosts(response.posts || []);
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch posts');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch posts');
      console.error('Error fetching Instagram posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts };
};

// Hook for workflow management
export const useWorkflow = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createWorkflow = useCallback(async (workflowData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createWorkflow(workflowData);
      
      if (response.success) {
        // Refresh workflows list
        await fetchWorkflows();
        return response;
      } else {
        throw new Error(response.message || 'Failed to create workflow');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const activateWorkflow = useCallback(async (workflowId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.activateWorkflow(workflowId);
      
      if (response.success) {
        // Refresh workflows list
        await fetchWorkflows();
        return response;
      } else {
        throw new Error(response.message || 'Failed to activate workflow');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to activate workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getUserWorkflows();
      
      if (response.success) {
        setWorkflows(response.workflows || []);
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch workflows');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch workflows');
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    activateWorkflow,
    fetchWorkflows
  };
};

// Hook for keyword validation and suggestions
export const useKeywords = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateKeywords = useCallback(async (keywords) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.validateKeywords(keywords);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to validate keywords');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getKeywordSuggestions();
      
      if (response.success) {
        setSuggestions(response.suggestions || []);
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch suggestions');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch suggestions');
      console.error('Error fetching keyword suggestions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    validateKeywords,
    refetchSuggestions: fetchSuggestions
  };
};

// Hook for DM preview
export const useDMPreview = () => {
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePreview = useCallback(async (message, variables = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.previewDM(message, variables);
      
      if (response.success) {
        setPreview(response.preview);
        return response;
      } else {
        throw new Error(response.message || 'Failed to generate preview');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate preview');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    preview,
    loading,
    error,
    generatePreview
  };
};

// Hook for authentication
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const response = await apiService.verifyToken();
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('authToken');
      }
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('authToken');
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (authData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.authenticateWithInstagram(authData);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user);
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    checkAuth
  };
};

export default useApi;