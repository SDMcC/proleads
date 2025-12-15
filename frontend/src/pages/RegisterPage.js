import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { useDarkMode } from '../DarkModeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function RegisterPage() {
  const { login } = useAuth();
  const { isDark } = require('./DarkModeContext').useDarkMode();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    wallet_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    
    if (ref) {
      setReferralCode(ref);
      fetchReferrerInfo(ref);
    }
  }, []);

  const fetchReferrerInfo = async (code) => {
    try {
      const response = await axios.get(`${API_URL}/referral/${code}`);
      setReferrerInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch referrer info:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.wallet_address) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (!acceptTerms) {
      alert('Please accept the Terms & Conditions to continue');
      return;
    }

    // Basic wallet address validation
    if (!formData.wallet_address.startsWith('0x') || formData.wallet_address.length !== 42) {
      alert('Please enter a valid Ethereum wallet address');
      return;
    }

    setLoading(true);
    try {
      // Register user
      console.log('Attempting registration...');
      const registerResponse = await axios.post(`${API_URL}/users/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        wallet_address: formData.wallet_address,
        referrer_code: referralCode || undefined
      });
      console.log('Registration successful:', registerResponse.data);

      // Auto-login after registration
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        username: formData.username,
        password: formData.password
      });
      
      const { token } = loginResponse.data;
      console.log('Auto-login successful, redirecting to dashboard...');
      login(token);

      window.location.href = '/dashboard';

    } catch (error) {
      console.error('Registration failed:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = `Registration failed: ${error.response.data.detail}`;
      } else if (error.response?.status === 400) {
        errorMessage = 'Registration failed: Invalid data or user already exists.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Registration failed: Server error. Please try again later.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4 py-16 transition-colors duration-300 relative"
      style={{
        backgroundImage: 'url(https://customer-assets.emergentagent.com/job_membership-tier/artifacts/7me6y0cn_abstract-luxury-gradient-blue-background-smooth-dark-blue-with-black-vignette-studio-banner.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-dark shadow-2xl dark:shadow-2xl rounded-lg p-8 sm:p-12 transition-colors duration-300 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
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
              Create your account
            </h3>
            <p className="text-body-color dark:text-body-color-dark text-center text-base font-medium">
              Join our network and start earning today
            </p>
            
            {referrerInfo && (
              <div className="mt-4 p-4 bg-primary bg-opacity-10 dark:bg-primary dark:bg-opacity-20 rounded-lg border border-primary border-opacity-30">
                <p className="text-primary dark:text-white text-sm font-medium">
                  🎉 You're joining through <strong>{referrerInfo.referrer_username}</strong>'s network!
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label className="text-black dark:text-white mb-3 block text-sm font-medium">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="border-stroke dark:text-body-color-dark text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3 text-base outline-none transition-all duration-300 dark:border-stroke-dark"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="mb-8">
              <label className="text-black dark:text-white mb-3 block text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="border-stroke dark:text-body-color-dark text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3 text-base outline-none transition-all duration-300 dark:border-stroke-dark"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-8">
              <label className="text-black dark:text-white mb-3 block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="border-stroke dark:text-body-color-dark text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3 text-base outline-none transition-all duration-300 dark:border-stroke-dark"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            <div className="mb-8">
              <label className="text-black dark:text-white mb-3 block text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="border-stroke dark:text-body-color-dark text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3 text-base outline-none transition-all duration-300 dark:border-stroke-dark"
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <div className="mb-8">
              <label className="text-black dark:text-white mb-3 block text-sm font-medium">
                Wallet Address
              </label>
              <input
                type="text"
                value={formData.wallet_address}
                onChange={(e) => setFormData(prev => ({ ...prev, wallet_address: e.target.value }))}
                className="border-stroke dark:text-body-color-dark text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3 text-base outline-none transition-all duration-300 dark:border-stroke-dark"
                placeholder="0x1234567890123456789012345678901234567890"
                required
              />
              <p className="text-body-color dark:text-body-color-dark text-xs mt-2">You can change this later in your account settings</p>
            </div>

            <div className="mb-8 flex items-start">
              <label htmlFor="acceptTerms" className="flex items-start cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="sr-only peer"
                    required
                  />
                  <div className="box border-body-color/20 dark:border-white/10 mr-4 flex h-5 w-5 items-center justify-center rounded border peer-checked:border-primary peer-checked:bg-primary transition-all duration-200">
                    <span className={acceptTerms ? 'opacity-100' : 'opacity-0'}>
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972Z" fill="white" stroke="white" strokeWidth="0.4"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <span className="text-body-color dark:text-body-color-dark text-sm select-none">
                  I accept the{' '}
                  <a 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </a>
                </span>
              </label>
            </div>

            <div className="mb-6">
              <button
                type="submit"
                disabled={loading || !acceptTerms}
                className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-lg px-9 py-4 text-base font-medium text-white duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign up'}
              </button>
            </div>
          </form>

          <p className="text-body-color dark:text-body-color-dark text-center text-base font-medium">
            Already have an account?{" "}
            <a href="/" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
