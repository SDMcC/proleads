import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useAuth } from '../../App';
import { useDarkMode } from '../../DarkModeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function LoginModal({ onClose }) {
  const { login } = useAuth();
  const { isDark } = useDarkMode();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      alert('Please fill in all fields');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: loginData.username,
        password: loginData.password
      });
      
      const { token } = response.data;
      login(token);
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.response?.data?.detail) {
        errorMessage = `Login failed: ${error.response.data.detail}`;
      }
      alert(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 dark:bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark shadow-lg dark:shadow-2xl rounded-lg max-w-md w-full p-8 sm:p-12 relative transition-colors duration-300">
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-body-color dark:text-body-color-dark hover:text-primary transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Centered logo and title */}
        <div className="text-center mb-8">
          <img 
            src={isDark 
              ? "https://members.proleads.network/assets/images/hero-logo-2.png" 
              : "https://customer-assets.emergentagent.com/job_membership-tier/artifacts/pnsgppw4_hero-logo-4.png"
            }
            alt="Proleads Network" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
            Sign in to your account
          </h3>
          <p className="text-body-color dark:text-body-color-dark text-center text-base font-medium">
            Login to your account for faster access
          </p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-8">
            <label className="text-black dark:text-white mb-3 block text-sm font-medium">
              Username
            </label>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
              className="border-stroke dark:text-body-color-dark text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3 text-base outline-none transition-all duration-300 dark:border-stroke-dark"
              required
            />
          </div>
          
          <div className="mb-8">
            <label className="text-black dark:text-white mb-3 block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              className="border-stroke dark:text-body-color-dark text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3 text-base outline-none transition-all duration-300 dark:border-stroke-dark"
              required
            />
          </div>
          
          <div className="mb-6">
            <button
              type="submit"
              disabled={loginLoading}
              className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-lg px-9 py-4 text-base font-medium text-white duration-300 disabled:opacity-50"
            >
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <p className="text-body-color dark:text-body-color-dark text-center text-base font-medium">
          Don't have an account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginModal;
