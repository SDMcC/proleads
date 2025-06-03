import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user data', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);
  
  const registerUser = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/register`, 
        userData
      );
      
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const getNonce = async (address) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/nonce`,
        { address }
      );
      return response.data.nonce;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get nonce');
      throw err;
    }
  };
  
  const verifySignature = async (address, signature) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/verify`,
        { address, signature }
      );
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Get user data
        const userResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/users/me`,
          { headers: { Authorization: `Bearer ${response.data.token}` } }
        );
        
        setUser(userResponse.data);
        localStorage.setItem('user', JSON.stringify(userResponse.data));
        return userResponse.data;
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setWalletAddress(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        walletAddress,
        setWalletAddress,
        registerUser,
        getNonce,
        verifySignature,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
