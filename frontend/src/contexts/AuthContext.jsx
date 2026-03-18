import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

/**
 * Authentication Context
 * Manages user authentication state and methods
 */
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user profile
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data.user);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update user state
        setUser(user);
        
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update user state
        setUser(user);
        
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional)
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setError(null);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.success) {
        setUser(response.data.data.user);
        toast.success('Profile updated successfully');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await api.post('/auth/refresh', { token });
      
      if (response.data.success) {
        const { token: newToken } = response.data.data;
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      logout();
      return false;
    }
    return false;
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated: !!user,
    
    // Methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    clearError,
    
    // Computed values
    isAdmin: user?.role === 'admin',
    isAccountant: user?.role === 'accountant',
    isViewer: user?.role === 'viewer',
    userName: user ? `${user.firstName} ${user.lastName}` : '',
    userEmail: user?.email,
    userCompany: user?.company,
    userSubscription: user?.subscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
