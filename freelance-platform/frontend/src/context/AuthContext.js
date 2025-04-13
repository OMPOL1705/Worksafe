import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on startup
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser({...userData, token: storedToken});
        
        // Set default axios auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log('Authenticated from localStorage with token');
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post('http://localhost:5000/api/users/register', userData);
      
      // Extract token and user data
      const { token, ...userWithoutToken } = res.data;
      
      // Store token separately
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userWithoutToken));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user in state with token
      setUser({...userWithoutToken, token});
      
      console.log('Token saved after registration:', token);
      
      return res.data;
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      console.log('Attempting login with:', { email });
      
      const res = await axios.post('http://localhost:5000/api/users/login', { email, password });
      console.log('Login response:', res.data);
      
      // Extract token and user data
      const { token, ...userWithoutToken } = res.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Store token separately 
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userWithoutToken));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user in state with token
      setUser({...userWithoutToken, token});
      
      console.log('Token saved after login:', token);
      
      return res.data;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'An error occurred');
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Update user profile
  const updateProfile = (updatedUser) => {
    const { token, ...userWithoutToken } = updatedUser;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(userWithoutToken));
  };

  // No need for axios interceptor since we're setting the headers directly after login/register

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;