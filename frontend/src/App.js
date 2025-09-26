import React, { useState, useEffect } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { arbitrum, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Wallet, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  ExternalLink,
  Activity,
  Award,
  Network,
  Settings,
  BarChart3,
  Shield,
  UserCheck,
  FileText,
  Gift,
  Menu,
  X,
  Clock,
  Download,
  ChevronDown,
  ChevronRight,
  Mail,
  Bell,
  UserX,
  MessageCircle,
  Zap
} from 'lucide-react';
import './App.css';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.REACT_APP_WC_PROJECT_ID || 'af44774b87514c0aab24072250c2baa8';

// 2. Create wagmiConfig
const metadata = {
  name: 'Web3 Membership Platform',
  description: 'Multi-tier affiliate membership platform',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, arbitrum];
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true
});

// 3. Create modal with error handling
try {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: true
  });
} catch (error) {
  console.warn('Web3Modal creation failed (this is fine for traditional auth):', error.message);
}

const queryClient = new QueryClient();
const API_URL = process.env.REACT_APP_BACKEND_URL;

// Auth context
const AuthContext = React.createContext();

// Main App Component
// Error Boundary Component for Wallet Connection
class WalletErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a MetaMask/wallet connection error
    if (error.message && (
      error.message.includes('MetaMask') || 
      error.message.includes('wallet') ||
      error.message.includes('Web3Modal') ||
      error.message.includes('WalletConnect')
    )) {
      return { hasError: true, error };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    if (error.message && (
      error.message.includes('MetaMask') || 
      error.message.includes('wallet') ||
      error.message.includes('Web3Modal') ||
      error.message.includes('WalletConnect')
    )) {
      console.warn('Wallet connection error handled gracefully:', error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI without wallet functionality
      return this.props.children;
    }

    return this.props.children;
  }
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletErrorBoundary>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/r/:code" element={<ReferralRedirect />} />
                  <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                  <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                </Routes>
              </div>
            </Router>
          </AuthProvider>
        </WalletErrorBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Auth Provider
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    refreshUser: fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Referral Redirect Component
function ReferralRedirect() {
  const { code } = useParams();
  
  useEffect(() => {
    // Redirect to homepage with referral code so users see the landing page first
    window.location.href = `/?ref=${code}`;
  }, [code]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading your referral link...</p>
        <p className="text-gray-200 text-sm mt-2">Using referral code: {code}</p>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/" />;
}

// Landing Page Component
function LandingPage() {
  const { user, login } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const generateReferralLink = () => {
    if (user && user.referral_code) {
      const baseUrl = window.location.origin;
      return `${baseUrl}/r/${user.referral_code}`;
    }
    return '';
  };

  const copyReferralLink = () => {
    const link = generateReferralLink();
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  const handleSimpleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      alert('Please fill in all fields');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
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

  if (user) {
    return (
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome back, {user.username}!</h1>
            <p className="text-xl text-gray-200">You're signed in and ready to go</p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Your Dashboard</h2>
              <p className="text-gray-200 mb-6">Access your member dashboard to view earnings, referrals, and more.</p>
              <a 
                href="/dashboard"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                Go to Dashboard
              </a>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Share Your Link</h2>
              <p className="text-gray-200 mb-4">Invite others and earn commissions</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generateReferralLink()}
                  readOnly
                  className="flex-1 px-4 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white text-sm"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Header */}
      <header className="bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Network className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Web3 Membership</h1>
            </div>
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="bg-white bg-opacity-20 text-white px-6 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-300"
            >
              {showLogin ? 'Hide Login' : 'Login'}
            </button>
          </div>
        </div>
      </header>

      {/* Login Form */}
      {showLogin && (
        <div className="bg-black bg-opacity-20 backdrop-blur-sm border-b border-white border-opacity-10">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Login to Your Account</h2>
              <form onSubmit={handleSimpleLogin} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
                >
                  {loginLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Join the Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Web3 Membership</span>
          </h2>
          <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
            Experience a revolutionary affiliate system with 4-tier commissions, instant USDC payouts, and exclusive member benefits.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href={`/register${referralCode ? `?ref=${referralCode}` : ''}`}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Join Now
            </a>
            <a 
              href={`/register${referralCode ? `?ref=${referralCode}` : ''}`}
              className="bg-white bg-opacity-20 text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm border border-white border-opacity-30"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <MembershipTiers referralCode={referralCode} />

      {/* Commission Structure */}
      <CommissionStructure />
    </div>
  );
}

// Wallet Connect Button (Legacy - kept for backward compatibility)
function WalletConnectButton() {
  const [walletError, setWalletError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();

  // Safely access wallet hooks with error handling
  let address, isConnected, signMessageAsync;
  
  try {
    const accountHook = useAccount();
    const signHook = useSignMessage();
    address = accountHook.address;
    isConnected = accountHook.isConnected;
    signMessageAsync = signHook.signMessageAsync;
  } catch (error) {
    console.warn('Wallet connection not available:', error.message);
    setWalletError(true);
  }

  const handleAuth = async () => {
    if (!address || walletError) return;
    
    setLoading(true);
    try {
      const nonceResponse = await axios.post(`${API_URL}/api/auth/nonce`, {
        address: address.toLowerCase()
      });
      
      const { nonce } = nonceResponse.data;
      const message = `Sign this message to authenticate: ${nonce}`;
      
      const signature = await signMessageAsync({ message });
      
      const verifyResponse = await axios.post(`${API_URL}/api/auth/verify`, {
        address: address.toLowerCase(),
        signature
      });
      
      const { token } = verifyResponse.data;
      login(token);
      
    } catch (error) {
      console.error('Authentication failed:', error);
      if (error.response?.status === 404 || error.response?.status === 401) {
        // User not registered, redirect to registration
        window.location.href = '/register';
      }
    } finally {
      setLoading(false);
    }
  };

  // Only attempt auto-authentication if wallet is properly connected and no errors
  useEffect(() => {
    if (!walletError && isConnected && address && !user && !loading) {
      // Only auto-authenticate on specific pages, avoid during registration flow
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/payment') {
        // Add a small delay to avoid conflicts with registration flow
        setTimeout(() => {
          if (!user && !loading) {
            handleAuth();
          }
        }, 1000);
      }
    }
  }, [isConnected, address, user, walletError]);

  if (user) {
    return (
      <button 
        onClick={() => window.location.href = '/dashboard'}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
      >
        Go to Dashboard
      </button>
    );
  }

  if (loading) {
    return (
      <button className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg">
        Authenticating...
      </button>
    );
  }

  // Show traditional login link if wallet connection has errors
  if (walletError) {
    return (
      <button 
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
      >
        Login with Email
      </button>
    );
  }

  return (
    <w3m-button />
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}

// Membership Tiers Component
function MembershipTiers({ referralCode }) {
  const [tiers, setTiers] = useState({});

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/membership/tiers`);
        setTiers(response.data.tiers || {});
      } catch (error) {
        console.error('Failed to fetch tiers:', error);
      }
    };
    fetchTiers();
  }, []);

  const tierConfigs = [
    { name: 'affiliate', popular: false },
    { name: 'bronze', popular: false },
    { name: 'silver', popular: true },
    { name: 'gold', popular: false }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {tierConfigs.map(({ name, popular }) => {
        const tierData = tiers[name];
        if (!tierData) return null;

        return (
          <TierCard 
            key={name} 
            tier={{
              name: name.charAt(0).toUpperCase() + name.slice(1),
              price: tierData.price,
              currency: tierData.price === 0 ? 'FREE' : 'USD',
              commissions: tierData.commissions.map(rate => `${Math.round(rate * 100)}%`),
              popular
            }} 
            referralCode={referralCode} 
          />
        );
      })}
    </div>
  );
}

// Tier Card Component
function TierCard({ tier, referralCode }) {
  const { user } = useAuth();
  
  const handleSelectTier = () => {
    if (!user) {
      // If not logged in, go to registration
      const params = new URLSearchParams();
      params.append('tier', tier.name.toLowerCase());
      if (referralCode) {
        params.append('ref', referralCode);
      }
      window.location.href = `/register?${params.toString()}`;
    } else {
      // If logged in, go to payment page
      const params = new URLSearchParams();
      params.append('tier', tier.name.toLowerCase());
      window.location.href = `/payment?${params.toString()}`;
    }
  };

  const handleUpgrade = async () => {
    if (tier.price === 0) {
      // Free tier - redirect to register
      handleSelectTier();
      return;
    }

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        handleSelectTier();
        return;
      }

      // Create payment with default ETH currency
      const response = await axios.post(`${API_URL}/api/payments/create`, {
        tier: tier.name.toLowerCase(),
        currency: 'ETH' // Default to ETH
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_url) {
        // Redirect to payment page
        window.open(response.data.payment_url, '_blank');
      } else {
        alert('Payment created successfully! Please check your dashboard.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again or contact support.');
    }
  };

  return (
    <div className={`relative rounded-2xl p-8 ${
      tier.popular 
        ? 'bg-gradient-to-b from-blue-600 to-purple-700 transform scale-105' 
        : 'bg-white bg-opacity-10 backdrop-blur-sm'
    } hover:transform hover:scale-110 transition-all duration-300`}>
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
            MOST POPULAR
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-4">{tier.name}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold text-white">${tier.price}</span>
          <span className="text-gray-300">/{tier.currency === 'FREE' ? 'forever' : 'month'}</span>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">COMMISSION RATES</h4>
          <div className="flex justify-center space-x-2">
            {tier.commissions.map((rate, index) => (
              <span key={index} className="bg-black bg-opacity-30 px-2 py-1 rounded text-sm text-white">
                L{index + 1}: {rate}
              </span>
            ))}
          </div>
        </div>
        
        <button 
          onClick={handleUpgrade}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
            tier.popular
              ? 'bg-white text-blue-600 hover:bg-gray-100'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {tier.price === 0 ? 'Start Free' : 'Upgrade Now'}
        </button>
      </div>
    </div>
  );
}

// Commission Structure Component
function CommissionStructure() {
  const examples = [
    {
      tier: 'Bronze → Gold',
      amounts: ['$25.00', '$5.00', '$3.00', '$2.00'],
      rates: ['25%', '5%', '3%', '2%']
    },
    {
      tier: 'Silver → Bronze',
      amounts: ['$5.40', '$2.00', '$1.00', '$0.60'],
      rates: ['27%', '10%', '5%', '3%']
    },
    {
      tier: 'Gold → Gold',
      amounts: ['$30.00', '$15.00', '$10.00', '$5.00'],
      rates: ['30%', '15%', '10%', '5%']
    }
  ];

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
      <h3 className="text-2xl font-bold text-white mb-6 text-center">Commission Examples</h3>
      <div className="space-y-6">
        {examples.map((example, index) => (
          <div key={index} className="border-b border-gray-600 pb-4 last:border-b-0">
            <h4 className="text-lg font-semibold text-blue-300 mb-3">{example.tier}</h4>
            <div className="grid grid-cols-4 gap-4">
              {example.amounts.map((amount, levelIndex) => (
                <div key={levelIndex} className="text-center">
                  <div className="text-sm text-gray-400">Level {levelIndex + 1}</div>
                  <div className="text-lg font-bold text-white">{amount}</div>
                  <div className="text-sm text-green-400">{example.rates[levelIndex]}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Register Page Component
function RegisterPage() {
  const { login } = useAuth();
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
      const response = await axios.get(`${API_URL}/api/referral/${code}`);
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

    // Basic wallet address validation
    if (!formData.wallet_address.startsWith('0x') || formData.wallet_address.length !== 42) {
      alert('Please enter a valid Ethereum wallet address');
      return;
    }

    setLoading(true);
    try {
      // Register user
      console.log('Attempting registration...');
      const registerResponse = await axios.post(`${API_URL}/api/users/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        wallet_address: formData.wallet_address,
        referrer_code: referralCode || undefined
      });
      console.log('Registration successful:', registerResponse.data);

      // Auto-login after registration
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="max-w-md w-full">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white border-opacity-20">
          <div className="text-center mb-8">
            <Network className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Join Our Network</h2>
            <p className="text-gray-200">Create your membership account</p>
            
            {referrerInfo && (
              <div className="mt-4 p-4 bg-blue-600 bg-opacity-30 rounded-lg border border-blue-400 border-opacity-50">
                <p className="text-blue-100 text-sm">
                  🎉 You're joining through <strong>{referrerInfo.referrer_username}</strong>'s network!
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  Tier: {referrerInfo.referrer_tier.toUpperCase()}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Wallet Address *
              </label>
              <input
                type="text"
                value={formData.wallet_address}
                onChange={(e) => setFormData(prev => ({ ...prev, wallet_address: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="0x1234567890123456789012345678901234567890"
                required
              />
              <p className="text-gray-400 text-xs mt-1">You can change this later in your account settings</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm">
              Already have an account?{' '}
              <a href="/" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [affiliateMenuOpen, setAffiliateMenuOpen] = useState(false);
  const [accountSubTab, setAccountSubTab] = useState('settings');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'leads', label: 'My Leads', icon: FileText },
    { 
      id: 'affiliate', 
      label: 'Affiliate', 
      icon: ExternalLink,
      isNested: true,
      subItems: [
        { id: 'affiliate-tools', label: 'Affiliate Tools', icon: ExternalLink },
        { id: 'network', label: 'Network Tree', icon: Network },
        { id: 'referrals', label: 'Referrals', icon: Users }
      ]
    },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'payments', label: 'Payment History', icon: Activity },
    { id: 'milestones', label: 'Milestones', icon: Award },
    { id: 'autoresponder', label: 'Autoresponder', icon: Mail },
    { id: 'account', label: 'Account', icon: Settings },
    { id: 'tickets', label: 'Tickets', icon: MessageCircle }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Top Navigation */}
      <nav className="bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-white bg-opacity-10 text-white hover:bg-opacity-20 transition-all duration-300"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Network className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">Web3 Membership</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-300">Welcome back</p>
                <p className="text-white font-medium">{user?.username}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out lg:static absolute z-30 w-64 h-full bg-black bg-opacity-30 backdrop-blur-sm`}>
          <div className="p-6">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                
                // Handle nested menu items (like Affiliate)
                if (item.isNested) {
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => setAffiliateMenuOpen(!affiliateMenuOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 ${
                          ['affiliate-tools', 'network', 'referrals'].includes(activeTab)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {affiliateMenuOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {/* Nested menu items */}
                      {affiliateMenuOpen && (
                        <div className="pl-4 space-y-1">
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <button
                                key={subItem.id}
                                onClick={() => {
                                  setActiveTab(subItem.id);
                                  setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                                  activeTab === subItem.id
                                    ? 'bg-blue-700 text-white'
                                    : 'text-gray-400 hover:bg-white hover:bg-opacity-10 hover:text-white'
                                }`}
                              >
                                <SubIcon className="h-4 w-4" />
                                <span className="font-medium text-sm">{subItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Handle regular menu items
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                      // Reset account sub-tab when clicking account
                      if (item.id === 'account') {
                        setAccountSubTab('settings');
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8">
          {activeTab === 'overview' && <OverviewTab stats={stats} user={user} />}
          {activeTab === 'network' && <NetworkTreeTab />}
          {activeTab === 'affiliate-tools' && <AffiliateToolsTab user={user} />}
          {activeTab === 'earnings' && <EarningsTab />}
          {activeTab === 'payments' && <PaymentHistoryTab />}
          {activeTab === 'milestones' && <MilestonesTab />}
          {activeTab === 'leads' && <LeadsTab />}
          {activeTab === 'referrals' && <ReferralsTab />}
          {activeTab === 'autoresponder' && <AutoresponderTab />}
          {activeTab === 'tickets' && <TicketsTab />}
          {activeTab === 'account' && <AccountTab user={user} accountSubTab={accountSubTab} setAccountSubTab={setAccountSubTab} />}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Dashboard Tab Components
function OverviewTab({ stats, user }) {
  const getShortenedReferralLink = () => {
    if (!user?.referral_code) return '';
    // Create a shortened version using referral code
    const baseUrl = window.location.origin;
    return `${baseUrl}/r/${user.referral_code}`;
  };

  const copyReferralLink = () => {
    const referralLink = getShortenedReferralLink();
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    }
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<DollarSign className="h-8 w-8 text-green-400" />}
          title="Total Earnings"
          value={`$${stats?.total_earnings?.toFixed(2) || '0.00'} USDC`}
          subtitle="Completed payments"
        />
        <StatCard
          icon={<Activity className="h-8 w-8 text-yellow-400" />}
          title="Pending Earnings"
          value={`$${stats?.pending_earnings?.toFixed(2) || '0.00'} USDC`}
          subtitle="Processing payouts"
        />
        <StatCard
          icon={<Users className="h-8 w-8 text-blue-400" />}
          title="Total Referrals"
          value={stats?.total_referrals || 0}
          subtitle="All levels"
        />
        <StatCard
          icon={<Award className="h-8 w-8 text-purple-400" />}
          title="Membership Tier"
          value={user?.membership_tier?.toUpperCase() || 'AFFILIATE'}
          subtitle={`${user?.membership_tier === 'affiliate' ? 'Free' : '$' + (user?.membership_tier === 'bronze' ? '20' : user?.membership_tier === 'silver' ? '50' : '100')}/month`}
          action={
            <button
              onClick={() => window.location.href = '/payment'}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-300"
            >
              Upgrade
            </button>
          }
        />
      </div>

      {/* Recent Payments */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Recent Payments</h3>
        <RecentPayments />
      </div>

      {/* Referral Link */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Your Referral Link</h3>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={getShortenedReferralLink()}
            readOnly
            className="flex-1 px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-300"
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Commission Activity</h3>
        <div className="space-y-4">
          {stats?.recent_commissions?.length > 0 ? (
            stats.recent_commissions.map((commission, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-gray-600 last:border-b-0">
                <div>
                  <p className="text-white font-medium">${commission.amount?.toFixed(2)} USDC</p>
                  <p className="text-gray-400 text-sm">
                    Level {commission.level} • {commission.new_member_tier} member • {Math.round((commission.commission_rate || 0) * 100)}%
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    commission.status === 'completed' ? 'bg-green-600 text-green-100' :
                    commission.status === 'processing' ? 'bg-yellow-600 text-yellow-100' :
                    'bg-gray-600 text-gray-100'
                  }`}>
                    {commission.status}
                  </span>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(commission.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">No commission activity yet. Start referring to earn!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function NetworkTreeTab() {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depth, setDepth] = useState(3);

  useEffect(() => {
    fetchNetworkTree();
  }, [depth]);

  const fetchNetworkTree = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users/network-tree?depth=${depth}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNetworkData(response.data);
    } catch (error) {
      console.error('Failed to fetch network tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTreeNode = (node, level = 0) => {
    const marginLeft = level * 20;
    
    return (
      <div key={node.address} className="mb-2">
        <div 
          className="bg-white bg-opacity-5 rounded-lg p-3 border-l-4 border-blue-400"
          style={{ marginLeft: `${marginLeft}px` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">{node.username}</h4>
              <p className="text-gray-400 text-sm">{node.email}</p>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${
                  node.membership_tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                  node.membership_tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                  node.membership_tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                  'bg-blue-600 text-blue-100'
                }`}>
                  {node.membership_tier}
                </span>
                <span className="text-gray-400 text-xs">Level {node.level}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{node.total_referrals} referrals</p>
              <p className="text-green-400 text-sm">${node.total_earnings?.toFixed(2) || '0.00'}</p>
              {node.suspended && (
                <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-xs">Suspended</span>
              )}
            </div>
          </div>
        </div>
        {node.children && node.children.map(child => renderTreeNode(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Network Tree</h3>
          <div className="flex items-center space-x-4">
            <label className="text-gray-300">Depth:</label>
            <select
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value={1}>1 Level</option>
              <option value={2}>2 Levels</option>
              <option value={3}>3 Levels</option>
              <option value={4}>4 Levels</option>
              <option value={5}>5 Levels</option>
            </select>
          </div>
        </div>
        
        {networkData?.network_stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{networkData.network_stats.direct_referrals}</p>
              <p className="text-gray-400">Direct Referrals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{networkData.network_stats.total_network_size}</p>
              <p className="text-gray-400">Total Network</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{depth}</p>
              <p className="text-gray-400">Levels Shown</p>
            </div>
          </div>
        )}
      </div>

      {/* Network Tree */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h4 className="text-lg font-bold text-white mb-4">Your Network</h4>
        {networkData?.network_tree ? (
          <div className="space-y-4">
            {/* Root Node (Current User) */}
            <div className="bg-blue-600 bg-opacity-20 rounded-lg p-4 border-2 border-blue-400">
              <div className="text-center">
                <h4 className="text-white font-bold text-lg">YOU</h4>
                <p className="text-blue-200">{networkData.network_tree.root.username}</p>
                <span className={`inline-block px-3 py-1 rounded text-sm uppercase font-medium mt-2 ${
                  networkData.network_tree.root.membership_tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                  networkData.network_tree.root.membership_tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                  networkData.network_tree.root.membership_tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                  'bg-blue-600 text-blue-100'
                }`}>
                  {networkData.network_tree.root.membership_tier}
                </span>
              </div>
            </div>
            
            {/* Children Nodes */}
            {networkData.network_tree.children && networkData.network_tree.children.length > 0 ? (
              <div className="mt-6">
                {networkData.network_tree.children.map(child => renderTreeNode(child, 1))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No referrals yet. Share your referral link to build your network!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">Unable to load network tree</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AffiliateToolsTab({ user }) {
  const [editableText, setEditableText] = useState('🚀 Join the Web3 revolution! Earn up to 30% commission with our 4-tier affiliate system. Connect your wallet and start earning instant crypto payouts in USDC!');
  const [isEditingText, setIsEditingText] = useState(false);

  const copyReferralLink = () => {
    const shortLink = getShortenedLink();
    navigator.clipboard.writeText(shortLink);
    alert('Referral link copied to clipboard!');
  };

  const getShortenedLink = () => {
    if (!user?.referral_code) return user?.referral_link || '';
    // Create a shortened version using referral code
    const baseUrl = window.location.origin;
    return `${baseUrl}/r/${user.referral_code}`;
  };

  const generateQRCode = () => {
    // Use QR Server API which is more reliable than Google Charts
    const qrData = encodeURIComponent(getShortenedLink());
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=FFFFFF&color=000000`;
  };

  const downloadQRCode = async () => {
    try {
      const qrUrl = generateQRCode();
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `referral-qr-code-${user?.username || 'user'}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Failed to download QR code');
    }
  };

  const shareToSocial = (platform) => {
    const referralLink = getShortenedLink();
    const text = editableText + ' ';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyPromotionalText = () => {
    const textWithLink = `${editableText} ${getShortenedLink()}`;
    navigator.clipboard.writeText(textWithLink);
    alert('Promotional text with link copied!');
  };

  const saveEditableText = () => {
    setIsEditingText(false);
    // Here you could save to backend if needed
  };

  return (
    <div className="space-y-6">
      {/* Referral Link */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Your Referral Link</h3>
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="text"
            value={getShortenedLink()}
            readOnly
            className="flex-1 px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-300"
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </button>
        </div>
        
        {/* QR Code */}
        <div className="text-center">
          <h4 className="text-white font-medium mb-3">QR Code</h4>
          <div className="inline-block p-4 bg-white rounded-lg mb-3">
            <img 
              src={generateQRCode()} 
              alt="Referral QR Code" 
              className="w-48 h-48"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' fill='%23999'%3E%3Crect width='192' height='192' fill='%23f3f3f3'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14'%3EQR Code%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
          <div className="space-x-2">
            <p className="text-gray-400 text-sm mb-2">Scan to visit your referral link</p>
            <button
              onClick={downloadQRCode}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-300"
            >
              Download QR Code
            </button>
          </div>
        </div>
      </div>

      {/* Social Share Buttons */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Share on Social Media</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            onClick={() => shareToSocial('x')}
            className="flex flex-col items-center p-4 bg-black hover:bg-gray-800 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">X</span>
          </button>

          <button
            onClick={() => shareToSocial('facebook')}
            className="flex flex-col items-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">Facebook</span>
          </button>

          <button
            onClick={() => shareToSocial('linkedin')}
            className="flex flex-col items-center p-4 bg-blue-700 hover:bg-blue-800 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">LinkedIn</span>
          </button>

          <button
            onClick={() => shareToSocial('telegram')}
            className="flex flex-col items-center p-4 bg-blue-400 hover:bg-blue-500 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">Telegram</span>
          </button>

          <button
            onClick={() => shareToSocial('whatsapp')}
            className="flex flex-col items-center p-4 bg-green-500 hover:bg-green-600 rounded-lg transition-all duration-300"
          >
            <div className="w-8 h-8 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Marketing Materials */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Marketing Materials</h3>
        <div className="space-y-4">
          <div className="p-4 bg-black bg-opacity-20 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-medium">Promotional Text</h4>
              <button
                onClick={() => setIsEditingText(!isEditingText)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all duration-300"
              >
                {isEditingText ? 'Save' : 'Edit'}
              </button>
            </div>
            
            {isEditingText ? (
              <div className="space-y-3">
                <textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white text-sm"
                  rows={4}
                  placeholder="Enter your promotional text..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={saveEditableText}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all duration-300"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingText(false);
                      setEditableText('🚀 Join the Web3 revolution! Earn up to 30% commission with our 4-tier affiliate system. Connect your wallet and start earning instant crypto payouts in USDC!');
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all duration-300"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 text-sm mb-3">
                  "{editableText}"
                </p>
                <p className="text-blue-400 text-sm mb-3 break-all">
                  Link: {getShortenedLink()}
                </p>
                <button
                  onClick={copyPromotionalText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all duration-300"
                >
                  Copy Text + Link
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-black bg-opacity-20 rounded-lg">
            <h4 className="text-white font-medium mb-2">Commission Structure</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-blue-300 font-bold">Affiliate</p>
                <p className="text-white text-sm">25% / 5%</p>
              </div>
              <div>
                <p className="text-orange-300 font-bold">Bronze</p>
                <p className="text-white text-sm">25% / 5% / 3% / 2%</p>
              </div>
              <div>
                <p className="text-gray-300 font-bold">Silver</p>
                <p className="text-white text-sm">27% / 10% / 5% / 3%</p>
              </div>
              <div>
                <p className="text-yellow-300 font-bold">Gold</p>
                <p className="text-white text-sm">30% / 15% / 10% / 5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EarningsTab() {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEarnings();
  }, [statusFilter, dateFrom, dateTo, page]);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await axios.get(`${API_URL}/api/users/earnings?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEarnings(response.data.earnings || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportEarningsCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await axios.get(`${API_URL}/api/users/earnings/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `earnings_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export earnings:', error);
      alert('Failed to export earnings CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-4">Commission Earnings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
            >
              Clear Filters
            </button>
            <button
              onClick={exportEarningsCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="pb-3 text-gray-300 font-medium">Commission ID</th>
                  <th className="pb-3 text-gray-300 font-medium">Amount</th>
                  <th className="pb-3 text-gray-300 font-medium">From Member</th>
                  <th className="pb-3 text-gray-300 font-medium">Level</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earning, index) => (
                  <tr key={index} className="border-b border-gray-700 last:border-b-0">
                    <td className="py-3">
                      <p className="text-white font-mono text-sm">{earning.id.slice(0, 8)}...{earning.id.slice(-6)}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-green-400 font-bold">${earning.amount}</p>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="text-white font-medium">{earning.new_member_username}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-medium mt-1 ${
                          earning.new_member_tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                          earning.new_member_tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                          earning.new_member_tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                          'bg-blue-600 text-blue-100'
                        }`}>
                          {earning.new_member_tier}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-purple-600 text-purple-100 rounded text-xs font-medium">
                        Level {earning.level}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        earning.status === 'completed' ? 'bg-green-600 text-green-100' :
                        earning.status === 'processing' ? 'bg-yellow-600 text-yellow-100' :
                        earning.status === 'pending' ? 'bg-blue-600 text-blue-100' :
                        'bg-red-600 text-red-100'
                      }`}>
                        {earning.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(earning.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {earnings.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No earnings found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
            >
              Previous
            </button>
            
            <span className="text-gray-400">Page {page} of {totalPages}</span>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentHistoryTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, tierFilter, dateFrom, dateTo, page]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (tierFilter) params.append('tier_filter', tierFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await axios.get(`${API_URL}/api/users/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPayments(response.data.payments || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPaymentsCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (tierFilter) params.append('tier_filter', tierFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await axios.get(`${API_URL}/api/users/payments/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export payments:', error);
      alert('Failed to export payments CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-4">Payment History</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Status</option>
                  <option value="waiting">Waiting</option>
                  <option value="confirming">Confirming</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Tier</label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Tiers</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter('');
                setTierFilter('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
            >
              Clear Filters
            </button>
            <button
              onClick={exportPaymentsCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="pb-3 text-gray-300 font-medium">Payment ID</th>
                  <th className="pb-3 text-gray-300 font-medium">Amount</th>
                  <th className="pb-3 text-gray-300 font-medium">Currency</th>
                  <th className="pb-3 text-gray-300 font-medium">Tier</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Date</th>
                  <th className="pb-3 text-gray-300 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={index} className="border-b border-gray-700 last:border-b-0">
                    <td className="py-3">
                      <p className="text-white font-mono text-sm">{payment.id?.toString()?.slice(0, 8)}...{payment.id?.toString()?.slice(-6)}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-white font-bold">${payment.amount}</p>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-gray-600 text-gray-100 rounded text-xs uppercase font-medium">
                        {payment.currency}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-medium ${
                        payment.tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                        payment.tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                        payment.tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                        'bg-blue-600 text-blue-100'
                      }`}>
                        {payment.tier}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'confirmed' ? 'bg-green-600 text-green-100' :
                        payment.status === 'confirming' ? 'bg-yellow-600 text-yellow-100' :
                        payment.status === 'waiting' ? 'bg-blue-600 text-blue-100' :
                        payment.status === 'partially_paid' ? 'bg-orange-600 text-orange-100' :
                        payment.status === 'failed' ? 'bg-red-600 text-red-100' :
                        payment.status === 'expired' ? 'bg-gray-600 text-gray-100' :
                        payment.status === 'refunded' ? 'bg-purple-600 text-purple-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {payment.payment_url && payment.status === 'waiting' && (
                        <a
                          href={payment.payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all duration-300"
                        >
                          Pay Now
                        </a>
                      )}
                      {payment.status === 'confirmed' && (
                        <span className="text-green-400 text-sm font-medium">✓ Paid</span>
                      )}
                      {payment.status === 'failed' && (
                        <span className="text-red-400 text-sm font-medium">✗ Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No payments found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
            >
              Previous
            </button>
            
            <span className="text-gray-400">Page {page} of {totalPages}</span>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MilestonesTab() {
  const [milestones, setMilestones] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users/milestones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMilestones(response.data);
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Progress */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Milestone Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{milestones?.paid_downlines || 0}</p>
            <p className="text-gray-400">Paid Downlines</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{milestones?.achieved_milestones?.length || 0}</p>
            <p className="text-gray-400">Milestones Achieved</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">
              ${milestones?.achieved_milestones?.reduce((sum, m) => sum + m.bonus_amount, 0) || 0}
            </p>
            <p className="text-gray-400">Total Bonuses Earned</p>
          </div>
        </div>

        {/* Next Milestone Progress */}
        {milestones?.next_milestone && (
          <div className="bg-black bg-opacity-20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-medium">Next Milestone: {milestones.next_milestone.milestone_count} Downlines</h4>
              <span className="text-green-400 font-bold">${milestones.next_milestone.bonus_amount} Bonus</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage(milestones.next_milestone.progress, milestones.next_milestone.milestone_count)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {milestones.next_milestone.progress} / {milestones.next_milestone.milestone_count} downlines
              </span>
              <span className="text-gray-400">
                {milestones.next_milestone.remaining} remaining
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Achieved Milestones */}
      {milestones?.achieved_milestones && milestones.achieved_milestones.length > 0 && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Achieved Milestones</h3>
          <div className="space-y-4">
            {milestones.achieved_milestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-green-600 bg-opacity-20 border border-green-500 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{milestone.milestone_count} Downlines Milestone</h4>
                    <p className="text-green-200 text-sm">
                      Achieved on {new Date(milestone.achieved_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">${milestone.bonus_amount}</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    milestone.status === 'completed' ? 'bg-green-600 text-green-100' :
                    milestone.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                    'bg-gray-600 text-gray-100'
                  }`}>
                    {milestone.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Milestones Overview */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Milestone System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones?.all_milestones?.map((milestone, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border-2 ${
                milestone.achieved 
                  ? 'bg-green-600 bg-opacity-20 border-green-500' 
                  : 'bg-gray-600 bg-opacity-20 border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  milestone.achieved ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {milestone.achieved ? (
                    <Award className="h-8 w-8 text-white" />
                  ) : (
                    <span className="text-white font-bold">{milestone.milestone_count}</span>
                  )}
                </div>
                <h4 className={`font-bold mb-1 ${
                  milestone.achieved ? 'text-green-400' : 'text-white'
                }`}>
                  {milestone.milestone_count} Downlines
                </h4>
                <p className={`text-lg font-bold ${
                  milestone.achieved ? 'text-green-400' : 'text-gray-400'
                }`}>
                  ${milestone.bonus_amount} Bonus
                </p>
                {milestone.achieved && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-600 text-green-100 rounded text-xs">
                    ✓ Achieved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg">
          <h4 className="text-blue-300 font-bold mb-2">How It Works</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Earn bonus rewards when you reach milestone numbers of paid downlines</li>
            <li>• Only active, non-cancelled members count toward your milestones</li>
            <li>• Bonuses are paid automatically when milestones are achieved</li>
            <li>• Build your network to unlock higher bonus tiers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AccountSettingsTab({ user }) {
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    wallet_address: user?.address || '',
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validation
    if (profileData.new_password && profileData.new_password !== profileData.confirm_new_password) {
      alert('New passwords do not match');
      return;
    }

    if (profileData.new_password && profileData.new_password.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    if (profileData.wallet_address && (!profileData.wallet_address.startsWith('0x') || profileData.wallet_address.length !== 42)) {
      alert('Please enter a valid Ethereum wallet address');
      return;
    }

    setLoading(true);
    try {
      const updateData = {};
      
      if (profileData.email !== user?.email) {
        updateData.email = profileData.email;
      }
      
      if (profileData.wallet_address !== user?.address) {
        updateData.wallet_address = profileData.wallet_address;
      }
      
      if (profileData.new_password) {
        updateData.current_password = profileData.current_password;
        updateData.new_password = profileData.new_password;
      }

      if (Object.keys(updateData).length === 0) {
        alert('No changes detected');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/users/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Profile updated successfully!');
      
      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      }));
      
    } catch (error) {
      console.error('Profile update failed:', error);
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = `Update failed: ${error.response.data.detail}`;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAccount = async () => {
    if (!window.confirm('Are you sure you want to cancel your account? This action cannot be undone.')) {
      return;
    }

    if (!window.confirm('WARNING: This will permanently delete your account and all associated data. Are you absolutely sure?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/cancel-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Your account has been cancelled successfully.');
      localStorage.removeItem('token');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Account cancellation failed:', error);
      alert('Failed to cancel account. Please contact support.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Account Settings</h3>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-gray-500 text-xs mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Wallet Address</label>
            <input
              type="text"
              value={profileData.wallet_address}
              onChange={(e) => setProfileData(prev => ({ ...prev, wallet_address: e.target.value }))}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              placeholder="0x1234567890123456789012345678901234567890"
              required
            />
            <p className="text-gray-400 text-xs mt-1">Update this if you lose access to your current wallet</p>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h4 className="text-lg font-semibold text-white mb-3">Change Password</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={profileData.current_password}
                  onChange={(e) => setProfileData(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={profileData.new_password}
                  onChange={(e) => setProfileData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={profileData.confirm_new_password}
                  onChange={(e) => setProfileData(prev => ({ ...prev, confirm_new_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Account Actions */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Account Actions</h3>
        
        <div className="space-y-4">
          <div className="border border-red-600 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-400 mb-2">Cancel Account</h4>
            <p className="text-gray-300 text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={handleCancelAccount}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
            >
              Cancel Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Referrals Tab Component 
function ReferralsTab() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchReferrals();
  }, [currentPage]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users/referrals?page=${currentPage}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReferrals(response.data.referrals || []);
      setTotalReferrals(response.data.total_count || 0);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
      alert('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'gold':
        return 'bg-yellow-600 bg-opacity-20 text-yellow-300';
      case 'silver':
        return 'bg-gray-600 bg-opacity-20 text-gray-300';
      case 'bronze':
        return 'bg-orange-600 bg-opacity-20 text-orange-300';
      default:
        return 'bg-blue-600 bg-opacity-20 text-blue-300';
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active'
      ? 'bg-green-600 bg-opacity-20 text-green-300'
      : 'bg-red-600 bg-opacity-20 text-red-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Referrals</h2>
        <div className="text-gray-300">
          {totalReferrals} referral{totalReferrals !== 1 ? 's' : ''} total
        </div>
      </div>

      {referrals.length === 0 ? (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Referrals Yet</h3>
          <p className="text-gray-300">Start sharing your referral link to build your network!</p>
        </div>
      ) : (
        <>
          {/* Referrals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{totalReferrals}</div>
              <div className="text-gray-300 text-sm">Total Referrals</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {referrals.filter(ref => ref.status === 'active').length}
              </div>
              <div className="text-gray-300 text-sm">Active</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {referrals.filter(ref => ref.membership_tier === 'bronze').length}
              </div>
              <div className="text-gray-300 text-sm">Bronze Members</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {referrals.reduce((sum, ref) => sum + ref.referral_count, 0)}
              </div>
              <div className="text-gray-300 text-sm">Sub-Referrals</div>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 text-gray-300 font-medium">Member</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Email</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Tier</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Referrals</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.user_id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {referral.username ? referral.username.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-white font-medium">{referral.username || 'Unknown'}</div>
                            <div className="text-gray-400 text-sm">{referral.address?.slice(0, 8)}...{referral.address?.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{referral.email || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-sm font-medium capitalize ${getTierBadgeClass(referral.membership_tier)}`}>
                          {referral.membership_tier}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-sm font-medium capitalize ${getStatusBadgeClass(referral.status)}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{referral.referral_count}</span>
                          {referral.referral_count > 0 && (
                            <Users className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {referral.joined_date ? new Date(referral.joined_date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-20"
              >
                Previous
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-20"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Autoresponder Tab Component (placeholder)
function AutoresponderTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Autoresponder</h2>
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
        <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Email Autoresponder</h3>
        <p className="text-gray-300">Set up automated email sequences and campaigns. This feature is coming soon!</p>
      </div>
    </div>
  );
}

// Tickets Tab Component (placeholder)
function TicketsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
        <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Support System</h3>
        <p className="text-gray-300">Submit and track your support tickets here. This feature is coming soon!</p>
      </div>
    </div>
  );
}

// Enhanced Account Tab Component with sub-tabs
function AccountTab({ user, accountSubTab, setAccountSubTab }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Account Management</h2>
      </div>

      {/* Account Sub-tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'settings', label: 'Account Settings', icon: Settings },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'kyc', label: 'KYC', icon: Shield },
          { id: 'cancel', label: 'Cancel Account', icon: UserX }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAccountSubTab(id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              accountSubTab === id
                ? 'bg-blue-600 text-white'
                : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Account Sub-tab Content */}
      {accountSubTab === 'settings' && <AccountSettingsOnlyTab user={user} />}
      {accountSubTab === 'notifications' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Notification Settings</h3>
          <p className="text-gray-300">Manage your email and SMS notification preferences. Coming soon!</p>
        </div>
      )}
      {accountSubTab === 'kyc' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">KYC Verification</h3>
          <p className="text-gray-300">Complete your Know Your Customer verification process. Coming soon!</p>
        </div>
      )}
      {accountSubTab === 'cancel' && <CancelAccountTab />}
    </div>
  );
}

// Recent Payments Component
function RecentPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/payments/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading payments...</div>;
  }

  if (payments.length === 0) {
    return <div className="text-gray-400 text-center py-4">No payments yet</div>;
  }

  return (
    <div className="space-y-4">
      {payments.map((payment, index) => (
        <div key={index} className="flex justify-between items-center py-3 border-b border-gray-600 last:border-b-0">
          <div>
            <p className="text-white font-medium">{payment.tier.toUpperCase()} Membership</p>
            <p className="text-gray-400 text-sm">
              ${payment.amount} {payment.currency} • {new Date(payment.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-2 py-1 rounded text-xs ${
              payment.status === 'confirmed' ? 'bg-green-600 text-green-100' :
              payment.status === 'waiting' ? 'bg-yellow-600 text-yellow-100' :
              payment.status === 'processing' ? 'bg-blue-600 text-blue-100' :
              'bg-gray-600 text-gray-100'
            }`}>
              {payment.status}
            </span>
            {payment.payment_url && payment.status === 'waiting' && (
              <div className="mt-1">
                <a 
                  href={payment.payment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:text-blue-300"
                >
                  Complete Payment
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, subtitle, action }) {
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-gray-400 text-sm">{subtitle}</p>
      {action && action}
    </div>
  );
}

// Payment Page Component
function PaymentPage() {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState('bronze');
  const [selectedCurrency, setSelectedCurrency] = useState('ETH');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [tiers, setTiers] = useState({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tier = urlParams.get('tier');
    if (tier) {
      setSelectedTier(tier);
    }

    const fetchTiers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/membership/tiers`);
        setTiers(response.data.tiers || {});
      } catch (error) {
        console.error('Failed to fetch tiers:', error);
      }
    };
    fetchTiers();
  }, []);

  const supportedCurrencies = ['BTC', 'ETH', 'USDC', 'USDT', 'LTC', 'XMR'];

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/payments/create`, {
        tier: selectedTier,
        currency: selectedCurrency // Use the selected currency from the form
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_required === false) {
        alert('Membership upgraded to Affiliate!');
        window.location.href = '/dashboard';
      } else {
        setPaymentData(response.data);
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Payment creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentTier = tiers[selectedTier];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Network className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">Web3 Membership</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Upgrade Your Membership</h1>
          <p className="text-xl text-gray-300">Choose your tier and payment method</p>
        </div>

        {!paymentData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tier Selection */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-6">Select Membership Tier</h3>
              <div className="space-y-4">
                {Object.entries(tiers).map(([key, tierData]) => (
                  <label key={key} className="block">
                    <input
                      type="radio"
                      name="tier"
                      value={key}
                      checked={selectedTier === key}
                      onChange={(e) => setSelectedTier(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedTier === key
                        ? 'border-blue-400 bg-blue-900 bg-opacity-50'
                        : 'border-gray-600 bg-black bg-opacity-30 hover:border-blue-400'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-bold text-white capitalize">{key}</h4>
                          <p className="text-gray-300">{tierData.commissions?.length || 0} commission levels</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">${tierData.price}</p>
                          <p className="text-gray-300">{tierData.price === 0 ? 'Free' : '/month'}</p>
                        </div>
                      </div>
                      {tierData.commissions && (
                        <div className="mt-3 flex space-x-2">
                          {tierData.commissions.map((rate, index) => (
                            <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                              L{index + 1}: {Math.round(rate * 100)}%
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-6">Payment Method</h3>
              
              {currentTier?.price === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Free Tier</h4>
                  <p className="text-gray-300 mb-6">No payment required for Affiliate membership</p>
                  <button
                    onClick={handleCreatePayment}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    {loading ? 'Upgrading...' : 'Activate Free Tier'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-gray-300 text-sm font-medium mb-3">
                      Select Cryptocurrency
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {supportedCurrencies.map((currency) => (
                        <label key={currency} className="block">
                          <input
                            type="radio"
                            name="currency"
                            value={currency}
                            checked={selectedCurrency === currency}
                            onChange={(e) => setSelectedCurrency(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 text-center ${
                            selectedCurrency === currency
                              ? 'border-blue-400 bg-blue-900 bg-opacity-50'
                              : 'border-gray-600 bg-black bg-opacity-30 hover:border-blue-400'
                          }`}>
                            <span className="font-medium text-white">{currency}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6">
                    <h4 className="text-lg font-bold text-white mb-2">Order Summary</h4>
                    <div className="flex justify-between text-gray-300">
                      <span>Membership Tier:</span>
                      <span className="capitalize text-white">{selectedTier}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Price:</span>
                      <span className="text-white">${currentTier?.price}/month</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Payment Method:</span>
                      <span className="text-white">{selectedCurrency}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCreatePayment}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    {loading ? 'Creating Payment...' : `Pay ${currentTier?.price ? '$' + currentTier.price : ''} with ${selectedCurrency}`}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Payment Instructions */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Payment Created</h3>
                <p className="text-gray-300">Complete your payment to upgrade your membership</p>
              </div>

              <div className="bg-black bg-opacity-30 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-bold text-white mb-4">Payment Details</h4>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-white font-mono">{paymentData.amount} {paymentData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Address:</span>
                    <span className="text-white font-mono text-sm break-all">{paymentData.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Payment ID:</span>
                    <span className="text-white font-mono text-sm">{paymentData.payment_id}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => navigator.clipboard.writeText(paymentData.address)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-all duration-300"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Address</span>
                </button>
                <a
                  href={paymentData.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-all duration-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Payment Page</span>
                </a>
              </div>

              <p className="text-gray-400 text-sm mt-6">
                Your membership will be automatically upgraded once payment is confirmed.
                This usually takes 1-3 confirmations on the blockchain.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Payment Success Component
function PaymentSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-gray-300 mb-6">
            Your membership has been upgraded successfully. You can now start earning commissions!
          </p>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// Admin Protected Route Component
function AdminProtectedRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          setLoading(false);
          return;
        }

        // For now, we'll assume the token is valid if it exists
        // In a real app, you'd verify with the server
        setIsAdmin(true);
        
      } catch (error) {
        console.error("Admin auth check failed:", error);
        localStorage.removeItem("adminToken");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return isAdmin ? children : <Navigate to="/admin/login" />;
}

function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/admin/login`, credentials);
      const { token } = response.data;
      
      localStorage.setItem("adminToken", token);
      window.location.href = "/admin/dashboard";
      
    } catch (error) {
      console.error("Admin login failed:", error);
      alert("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-300">Access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400"
                placeholder="Enter admin username"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400"
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = "/"}
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

//=====================================================
// ADMIN DASHBOARD COMPONENT
//=====================================================
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [memberFilter, setMemberFilter] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Payments management state
  const [paymentUserFilter, setPaymentUserFilter] = useState('');
  const [paymentTierFilter, setPaymentTierFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentDateFrom, setPaymentDateFrom] = useState('');
  const [paymentDateTo, setPaymentDateTo] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  
  // Commissions management state
  const [commissionUserFilter, setCommissionUserFilter] = useState('');
  const [commissionTierFilter, setCommissionTierFilter] = useState('');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('');
  const [commissionDateFrom, setCommissionDateFrom] = useState('');
  const [commissionDateTo, setCommissionDateTo] = useState('');
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionTotalPages, setCommissionTotalPages] = useState(1);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers(memberFilter, memberPage);
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'commissions') {
      fetchCommissions();
    }
  }, [activeTab, memberFilter, memberPage, sortField, sortDirection, paymentUserFilter, paymentTierFilter, paymentStatusFilter, paymentDateFrom, paymentDateTo, paymentPage, commissionUserFilter, commissionTierFilter, commissionStatusFilter, commissionDateFrom, commissionDateTo, commissionPage]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch dashboard overview
      const overviewResponse = await axios.get(`${API_URL}/api/admin/dashboard/overview`, { headers });
      setStats(overviewResponse.data);
      
      // Fetch members data if on members tab
      if (activeTab === 'members') {
        fetchMembers();
      }
      
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (tier = '', page = 1) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (tier) params.append('tier', tier);
      params.append('page', page.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/api/admin/members?${params}`, { headers });
      
      // Sort members on the frontend (since backend doesn't support sorting yet)
      let sortedMembers = response.data.members || [];
      sortedMembers.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (sortField === 'created_at') {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortDirection === 'desc' ? bDate - aDate : aDate - bDate;
        } else if (sortField === 'total_earnings' || sortField === 'total_referrals') {
          const aNum = Number(aValue) || 0;
          const bNum = Number(bValue) || 0;
          return sortDirection === 'desc' ? bNum - aNum : aNum - bNum;
        } else {
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          if (sortDirection === 'desc') {
            return bStr.localeCompare(aStr);
          } else {
            return aStr.localeCompare(bStr);
          }
        }
      });
      
      setMembers(sortedMembers);
      setTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (paymentUserFilter) params.append('user', paymentUserFilter);
      if (paymentTierFilter) params.append('tier', paymentTierFilter);
      if (paymentStatusFilter) params.append('status', paymentStatusFilter);
      if (paymentDateFrom) params.append('date_from', paymentDateFrom);
      if (paymentDateTo) params.append('date_to', paymentDateTo);
      params.append('page', paymentPage.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/api/admin/payments?${params}`, { headers });
      setPayments(response.data.payments || []);
      setPaymentTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (commissionUserFilter) params.append('user', commissionUserFilter);
      if (commissionTierFilter) params.append('tier', commissionTierFilter);
      if (commissionStatusFilter) params.append('status', commissionStatusFilter);
      if (commissionDateFrom) params.append('date_from', commissionDateFrom);
      if (commissionDateTo) params.append('date_to', commissionDateTo);
      params.append('page', commissionPage.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/api/admin/commissions?${params}`, { headers });
      setCommissions(response.data.commissions || []);
      setCommissionTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
    }
  };

  const fetchMemberDetails = async (memberId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_URL}/api/admin/members/${memberId}`, { headers });
      setSelectedMember(response.data);
      setShowMemberModal(true);
      
    } catch (error) {
      console.error('Failed to fetch member details:', error);
      alert('Failed to fetch member details');
    }
  };

  const updateMember = async (memberId, updateData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/api/admin/members/${memberId}`, updateData, { headers });
      
      // Refresh members list
      fetchMembers(memberFilter, memberPage);
      setShowMemberModal(false);
      setEditingMember(null);
      setSelectedMember(null);
      alert('Member updated successfully');
      
    } catch (error) {
      console.error('Failed to update member:', error);
      alert('Failed to update member: ' + (error.response?.data?.detail || error.message));
    }
  };

  const suspendMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to suspend this member?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.delete(`${API_URL}/api/admin/members/${memberId}`, { headers });
      
      // Refresh members list
      fetchMembers(memberFilter, memberPage);
      setShowMemberModal(false);
      setSelectedMember(null);
      alert('Member suspended successfully');
      
    } catch (error) {
      console.error('Failed to suspend member:', error);
      alert('Failed to suspend member: ' + (error.response?.data?.detail || error.message));
    }
  };
  const unsuspendMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to unsuspend this member?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post(`${API_URL}/api/admin/members/${memberId}/unsuspend`, {}, { headers });
      
      // Refresh members list
      fetchMembers(memberFilter, memberPage);
      setShowMemberModal(false);
      setSelectedMember(null);
      alert('Member unsuspended successfully');
      
    } catch (error) {
      console.error('Failed to unsuspend member:', error);
      alert('Failed to unsuspend member: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportPaymentsCSV = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (paymentUserFilter) params.append('user_filter', paymentUserFilter);
      if (paymentTierFilter) params.append('tier_filter', paymentTierFilter);
      if (paymentStatusFilter) params.append('status_filter', paymentStatusFilter);
      if (paymentDateFrom) params.append('date_from', paymentDateFrom);
      if (paymentDateTo) params.append('date_to', paymentDateTo);
      
      const response = await axios.get(`${API_URL}/api/admin/payments/export?${params}`, { 
        headers,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'payments_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).+?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export payments:', error);
      alert('Failed to export payments CSV');
    }
  };

  const exportCommissionsCSV = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (commissionUserFilter) params.append('user_filter', commissionUserFilter);
      if (commissionTierFilter) params.append('tier_filter', commissionTierFilter);
      if (commissionStatusFilter) params.append('status_filter', commissionStatusFilter);
      if (commissionDateFrom) params.append('date_from', commissionDateFrom);
      if (commissionDateTo) params.append('date_to', commissionDateTo);
      
      const response = await axios.get(`${API_URL}/api/admin/commissions/export?${params}`, { 
        headers,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'commissions_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).+?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export commissions:', error);
      alert('Failed to export commissions CSV');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Admin Navigation */}
      <nav className="bg-red-900 bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-400" />
              <span className="text-2xl font-bold text-white">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Administrator</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'payments', label: 'Payments', icon: DollarSign },
            { id: 'commissions', label: 'Commissions', icon: TrendingUp },
            { id: 'leads', label: 'Leads Distribution', icon: FileText },
            { id: 'configuration', label: 'Configuration', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                activeTab === id
                  ? 'bg-red-600 text-white'
                  : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <AdminStatCard
                icon={<Users className="h-8 w-8 text-blue-400" />}
                title="Total Members"
                value={stats?.members?.total || 0}
                subtitle={`${stats?.members?.recent_30_days || 0} this month`}
              />
              <AdminStatCard
                icon={<DollarSign className="h-8 w-8 text-green-400" />}
                title="Total Revenue"
                value={`$${stats?.payments?.total_revenue?.toFixed(2) || '0.00'}`}
                subtitle={`${stats?.payments?.recent_30_days || 0} payments this month`}
              />
              <AdminStatCard
                icon={<Activity className="h-8 w-8 text-yellow-400" />}
                title="Active Payments"
                value={stats?.payments?.by_status?.waiting?.count || 0}
                subtitle="Pending confirmations"
              />
              <AdminStatCard
                icon={<TrendingUp className="h-8 w-8 text-purple-400" />}
                title="Commission Payouts"
                value={`$${stats?.commissions?.total_payouts?.toFixed(2) || '0.00'}`}
                subtitle={`${stats?.commissions?.recent_30_days || 0} this month`}
              />
              <AdminStatCard
                icon={<Gift className="h-8 w-8 text-pink-400" />}
                title="Milestones"
                value={stats?.milestones?.total_achieved || 0}
                subtitle="Achieved this month"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {stats?.recent_activity?.length > 0 ? (
                  stats.recent_activity.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-600 last:border-b-0">
                      <div>
                        <p className="text-white font-medium">{activity.description}</p>
                        <p className="text-gray-400 text-sm">{activity.user}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members Management Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Members Filter */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <h3 className="text-xl font-bold text-white">Members Management</h3>
                <div className="flex gap-2 ml-auto">
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="px-4 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                  >
                    <option value="">All Tiers</option>
                    <option value="affiliate">Affiliate</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('username')}
                      >
                        Member {sortField === 'username' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('membership_tier')}
                      >
                        Tier {sortField === 'membership_tier' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('total_referrals')}
                      >
                        Referrals {sortField === 'total_referrals' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('total_earnings')}
                      >
                        Earnings {sortField === 'total_earnings' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('created_at')}
                      >
                        Joined {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="pb-3 text-gray-300 font-medium">Expiry Date</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-b-0">
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{member.username}</p>
                            <p className="text-gray-400 text-sm">{member.email}</p>
                            <p className="text-gray-500 text-xs font-mono">{member.wallet_address.slice(0, 8)}...{member.wallet_address.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${
                            member.membership_tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                            member.membership_tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                            member.membership_tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                            'bg-blue-600 text-blue-100'
                          }`}>
                            {member.membership_tier}
                          </span>
                        </td>
                        <td className="py-3 text-white">{member.total_referrals || 0}</td>
                        <td className="py-3 text-white">${member.total_earnings?.toFixed(2) || '0.00'}</td>
                        <td className="py-3 text-gray-400">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-gray-400">
                          {member.subscription_expires_at ? 
                            new Date(member.subscription_expires_at).toLocaleDateString() : 
                            'N/A'
                          }
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {member.is_expired && (
                              <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-yellow-100">
                                Expired
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs ${
                              member.suspended ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'
                            }`}>
                              {member.suspended ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => fetchMemberDetails(member.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all duration-300"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditMember(member)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all duration-300"
                            >
                              Edit
                            </button>
                            {!member.suspended && (
                              <button
                                onClick={() => suspendMember(member.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-all duration-300"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {members.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No members found</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setMemberPage(Math.max(1, memberPage - 1))}
                    disabled={memberPage === 1}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(1, memberPage - 2);
                      if (page > totalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setMemberPage(page)}
                          className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                            memberPage === page
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setMemberPage(Math.min(totalPages, memberPage + 1))}
                    disabled={memberPage === totalPages}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Next
                  </button>
                  
                  <span className="text-gray-400 text-sm">
                    Page {memberPage} of {totalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Management Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payments Filters */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">Payments Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">User Search</label>
                      <input
                        type="text"
                        value={paymentUserFilter}
                        onChange={(e) => setPaymentUserFilter(e.target.value)}
                        placeholder="Username or email"
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Tier</label>
                      <select
                        value={paymentTierFilter}
                        onChange={(e) => setPaymentTierFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Tiers</option>
                        <option value="affiliate">Affiliate</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                      <select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Status</option>
                        <option value="waiting">Waiting</option>
                        <option value="confirming">Confirming</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="sending">Sending</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="finished">Finished</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                      <input
                        type="date"
                        value={paymentDateFrom}
                        onChange={(e) => setPaymentDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                      <input
                        type="date"
                        value={paymentDateTo}
                        onChange={(e) => setPaymentDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPaymentUserFilter('');
                      setPaymentTierFilter('');
                      setPaymentStatusFilter('');
                      setPaymentDateFrom('');
                      setPaymentDateTo('');
                      setPaymentPage(1);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={exportPaymentsCSV}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="pb-3 text-gray-300 font-medium">Payment ID</th>
                      <th className="pb-3 text-gray-300 font-medium">User</th>
                      <th className="pb-3 text-gray-300 font-medium">Amount</th>
                      <th className="pb-3 text-gray-300 font-medium">Tier</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-b-0">
                        <td className="py-3">
                          <div>
                            <p className="text-white font-mono text-sm">{payment.id.slice(0, 8)}...{payment.id.slice(-6)}</p>
                            {payment.nowpayments_id && (
                              <p className="text-gray-400 text-xs">NP: {payment.nowpayments_id}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{payment.username}</p>
                            <p className="text-gray-400 text-sm">{payment.email}</p>
                            <p className="text-gray-500 text-xs font-mono">{payment.user_address.slice(0, 8)}...{payment.user_address.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">${payment.amount}</p>
                            <p className="text-gray-400 text-sm">{payment.currency}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${
                            payment.tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                            payment.tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                            payment.tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                            'bg-blue-600 text-blue-100'
                          }`}>
                            {payment.tier}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.status === 'confirmed' || payment.status === 'finished' ? 'bg-green-600 text-green-100' :
                            payment.status === 'waiting' || payment.status === 'confirming' ? 'bg-yellow-600 text-yellow-100' :
                            payment.status === 'failed' || payment.status === 'expired' ? 'bg-red-600 text-red-100' :
                            'bg-gray-600 text-gray-100'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {payments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No payments found</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {paymentTotalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))}
                    disabled={paymentPage === 1}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(5, paymentTotalPages) }, (_, i) => {
                      const page = i + Math.max(1, paymentPage - 2);
                      if (page > paymentTotalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setPaymentPage(page)}
                          className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                            paymentPage === page
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPaymentPage(Math.min(paymentTotalPages, paymentPage + 1))}
                    disabled={paymentPage === paymentTotalPages}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Next
                  </button>
                  
                  <span className="text-gray-400 text-sm">
                    Page {paymentPage} of {paymentTotalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commissions Management Tab */}
        {activeTab === 'commissions' && (
          <div className="space-y-6">
            {/* Commissions Filters */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">Commissions Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Recipient Search</label>
                      <input
                        type="text"
                        value={commissionUserFilter}
                        onChange={(e) => setCommissionUserFilter(e.target.value)}
                        placeholder="Username or email"
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">New Member Tier</label>
                      <select
                        value={commissionTierFilter}
                        onChange={(e) => setCommissionTierFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Tiers</option>
                        <option value="affiliate">Affiliate</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                      <select
                        value={commissionStatusFilter}
                        onChange={(e) => setCommissionStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                      <input
                        type="date"
                        value={commissionDateFrom}
                        onChange={(e) => setCommissionDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                      <input
                        type="date"
                        value={commissionDateTo}
                        onChange={(e) => setCommissionDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCommissionUserFilter('');
                      setCommissionTierFilter('');
                      setCommissionStatusFilter('');
                      setCommissionDateFrom('');
                      setCommissionDateTo('');
                      setCommissionPage(1);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={exportCommissionsCSV}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Commissions Table */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="pb-3 text-gray-300 font-medium">Commission ID</th>
                      <th className="pb-3 text-gray-300 font-medium">Recipient</th>
                      <th className="pb-3 text-gray-300 font-medium">New Member</th>
                      <th className="pb-3 text-gray-300 font-medium">Amount</th>
                      <th className="pb-3 text-gray-300 font-medium">Level</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((commission, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-b-0">
                        <td className="py-3">
                          <div>
                            <p className="text-white font-mono text-sm">{commission.id.slice(0, 8)}...{commission.id.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{commission.recipient_username}</p>
                            <p className="text-gray-400 text-sm">{commission.recipient_email}</p>
                            <p className="text-gray-500 text-xs font-mono">{commission.recipient_address.slice(0, 8)}...{commission.recipient_address.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{commission.new_member_username}</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-medium mt-1 ${
                              commission.new_member_tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                              commission.new_member_tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                              commission.new_member_tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                              'bg-blue-600 text-blue-100'
                            }`}>
                              {commission.new_member_tier}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="text-white font-medium">${commission.amount}</p>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-purple-600 text-purple-100 rounded text-xs font-medium">
                            Level {commission.level}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            commission.status === 'completed' ? 'bg-green-600 text-green-100' :
                            commission.status === 'processing' ? 'bg-yellow-600 text-yellow-100' :
                            commission.status === 'pending' ? 'bg-blue-600 text-blue-100' :
                            'bg-red-600 text-red-100'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {commissions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No commissions found</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {commissionTotalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setCommissionPage(Math.max(1, commissionPage - 1))}
                    disabled={commissionPage === 1}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(5, commissionTotalPages) }, (_, i) => {
                      const page = i + Math.max(1, commissionPage - 2);
                      if (page > commissionTotalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCommissionPage(page)}
                          className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                            commissionPage === page
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCommissionPage(Math.min(commissionTotalPages, commissionPage + 1))}
                    disabled={commissionPage === commissionTotalPages}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Next
                  </button>
                  
                  <span className="text-gray-400 text-sm">
                    Page {commissionPage} of {commissionTotalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leads Management Tab */}
        {activeTab === 'leads' && (
          <LeadsManagementTab />
        )}

        {/* Configuration Tab */}
        {activeTab === 'configuration' && (
          <ConfigurationTab />
        )}
      </div>

      {/* Member Details/Edit Modal */}
      {showMemberModal && (
        <MemberModal
          member={selectedMember}
          editingMember={editingMember}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
            setEditingMember(null);
          }}
          onUpdate={updateMember}
          onSuspend={suspendMember}
          onUnsuspend={unsuspendMember}
          onEdit={handleEditMember}
        />
      )}
    </div>
  );
}

// Leads Tab Component (for users)
function LeadsTab() {
  const [csvFiles, setCsvFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchCsvFiles();
  }, [currentPage]);

  const fetchCsvFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users/leads?page=${currentPage}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCsvFiles(response.data.csv_files || []);
      setTotalFiles(response.data.total_count || 0);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch CSV files:', error);
      alert('Failed to load CSV files');
    } finally {
      setLoading(false);
    }
  };

  const downloadCsvFile = async (fileId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users/leads/download/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Refresh the files list to update download status
      fetchCsvFiles();
      
      alert('CSV file downloaded successfully!');
    } catch (error) {
      console.error('Failed to download CSV file:', error);
      alert('Failed to download CSV file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Lead Files</h2>
        <div className="text-gray-300">
          {totalFiles} CSV file{totalFiles !== 1 ? 's' : ''} available
        </div>
      </div>

      {csvFiles.length === 0 ? (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Lead Files Available</h3>
          <p className="text-gray-300">Lead files will appear here when they are distributed by the admin.</p>
        </div>
      ) : (
        <>
          {/* CSV Files Table */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 text-gray-300 font-medium">Filename</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Lead Count</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Tier</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Created</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Downloads</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {csvFiles.map((file) => (
                    <tr key={file.file_id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          <span className="text-white font-medium">{file.filename}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-600 bg-opacity-20 text-blue-300 px-2 py-1 rounded text-sm">
                          {file.lead_count} leads
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-sm capitalize ${
                          file.member_tier === 'gold' ? 'bg-yellow-600 bg-opacity-20 text-yellow-300' :
                          file.member_tier === 'silver' ? 'bg-gray-600 bg-opacity-20 text-gray-300' :
                          'bg-orange-600 bg-opacity-20 text-orange-300'
                        }`}>
                          {file.member_tier}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        <div className="flex flex-col">
                          <span>{file.download_count} time{file.download_count !== 1 ? 's' : ''}</span>
                          {file.downloaded_at && (
                            <span className="text-xs text-gray-400">
                              Last: {new Date(file.downloaded_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => downloadCsvFile(file.file_id, file.filename)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-20"
              >
                Previous
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-red-600 text-white'
                          : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-20"
              >
                Next
              </button>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{totalFiles}</div>
              <div className="text-gray-300">Total Files</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {csvFiles.reduce((sum, file) => sum + file.lead_count, 0)}
              </div>
              <div className="text-gray-300">Total Leads</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {csvFiles.reduce((sum, file) => sum + file.download_count, 0)}
              </div>
              <div className="text-gray-300">Total Downloads</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Leads Management Tab Component for Admin
function LeadsManagementTab() {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDistributions();
  }, [page]);

  const fetchDistributions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/api/admin/leads/distributions?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDistributions(response.data.distributions || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('csv_file', csvFile);

      const response = await axios.post(`${API_URL}/api/admin/leads/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert(`Successfully uploaded ${response.data.total_leads} leads! Estimated distribution time: ${response.data.estimated_weeks} weeks`);
      setCsvFile(null);
      fetchDistributions();
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      alert('Failed to upload CSV file: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const triggerDistribution = async (distributionId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/admin/leads/distribute/${distributionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Lead distribution started successfully!');
      fetchDistributions();
    } catch (error) {
      console.error('Failed to trigger distribution:', error);
      alert('Failed to trigger distribution: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-600 text-green-100';
      case 'processing': return 'bg-yellow-600 text-yellow-100';
      case 'queued': return 'bg-blue-600 text-blue-100';
      case 'failed': return 'bg-red-600 text-red-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload CSV Section */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Upload Lead CSV</h3>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              CSV File (must contain: Name, Email, Address columns)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
          >
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </form>
      </div>

      {/* Distributions List */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Lead Distributions</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="pb-3 text-gray-300 font-medium">Filename</th>
                  <th className="pb-3 text-gray-300 font-medium">Total Leads</th>
                  <th className="pb-3 text-gray-300 font-medium">Distributed</th>
                  <th className="pb-3 text-gray-300 font-medium">Remaining</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Uploaded</th>
                  <th className="pb-3 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((dist, index) => (
                  <tr key={index} className="border-b border-gray-700 last:border-b-0">
                    <td className="py-3">
                      <p className="text-white font-medium">{dist.filename}</p>
                      <p className="text-gray-400 text-sm">Uploaded by {dist.uploaded_by}</p>
                    </td>
                    <td className="py-3 text-white">{dist.total_leads}</td>
                    <td className="py-3 text-green-400">{dist.distributed_count}</td>
                    <td className="py-3 text-orange-400">{dist.remaining_leads}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(dist.status)}`}>
                        {dist.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(dist.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {(dist.status === 'queued' || dist.status === 'failed') && (
                        <button
                          onClick={() => triggerDistribution(dist.distribution_id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all duration-300"
                        >
                          {dist.status === 'failed' ? 'Retry' : 'Distribute'}
                        </button>
                      )}
                      {dist.status === 'processing' && (
                        <span className="text-yellow-400 text-sm">Processing...</span>
                      )}
                      {dist.status === 'completed' && (
                        <span className="text-green-400 text-sm">✓ Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {distributions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No lead distributions found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
            >
              Previous
            </button>
            
            <span className="text-gray-400">Page {page} of {totalPages}</span>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Configuration Tab Component for Admin
function ConfigurationTab() {
  const [config, setConfig] = useState(null);
  const [membershipTiers, setMembershipTiers] = useState({});
  const [paymentProcessors, setPaymentProcessors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('membership');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/api/admin/config/system`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.config);
      setMembershipTiers(response.data.config.membership_tiers || {});
      setPaymentProcessors(response.data.config.payment_processors || {});
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      alert('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateMembershipTier = (tierName, field, value) => {
    setMembershipTiers(prev => ({
      ...prev,
      [tierName]: {
        ...prev[tierName],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const updatePaymentProcessor = (processorName, field, value) => {
    setPaymentProcessors(prev => ({
      ...prev,
      [processorName]: {
        ...prev[processorName],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const saveMembershipTiers = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Convert to the format expected by the API
      const tiersData = {};
      Object.keys(membershipTiers).forEach(tierName => {
        const tier = membershipTiers[tierName];
        tiersData[tierName] = {
          tier_name: tierName,
          price: parseFloat(tier.price) || 0,
          commissions: tier.commissions.map(c => parseFloat(c) || 0),
          enabled: tier.enabled !== false,
          description: tier.description || `${tierName.charAt(0).toUpperCase() + tierName.slice(1)} membership tier`
        };
      });

      const response = await axios.put(`${API_URL}/api/admin/config/membership-tiers`, tiersData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnsavedChanges(false);
      alert('Membership tiers updated successfully!');
      await fetchConfiguration(); // Refresh configuration
    } catch (error) {
      console.error('Failed to save membership tiers:', error);
      alert('Failed to save membership tiers: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const savePaymentProcessors = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Convert to the format expected by the API
      const processorsData = {};
      Object.keys(paymentProcessors).forEach(processorName => {
        const processor = paymentProcessors[processorName];
        processorsData[processorName] = {
          processor_name: processorName,
          api_key: processor.api_key || null,
          public_key: processor.public_key || null,
          ipn_secret: processor.ipn_secret || null,
          enabled: processor.enabled !== false,
          supported_currencies: processor.supported_currencies || ["BTC", "ETH", "USDC", "USDT"]
        };
      });

      const response = await axios.put(`${API_URL}/api/admin/config/payment-processors`, processorsData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnsavedChanges(false);
      alert('Payment processors updated successfully!');
      await fetchConfiguration(); // Refresh configuration
    } catch (error) {
      console.error('Failed to save payment processors:', error);
      alert('Failed to save payment processors: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all configuration to defaults? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/api/admin/config/reset-to-defaults`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Configuration reset to defaults successfully!');
      await fetchConfiguration(); // Refresh configuration
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      alert('Failed to reset configuration: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveSection('membership')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            activeSection === 'membership'
              ? 'bg-red-600 text-white'
              : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
          }`}
        >
          Membership Tiers
        </button>
        <button
          onClick={() => setActiveSection('payment')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            activeSection === 'payment'
              ? 'bg-red-600 text-white'
              : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
          }`}
        >
          Payment Processors
        </button>
      </div>

      {unsavedChanges && (
        <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-200 font-medium">You have unsaved changes</span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => fetchConfiguration().then(() => setUnsavedChanges(false))}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all duration-300"
              >
                Discard
              </button>
              <button
                onClick={activeSection === 'membership' ? saveMembershipTiers : savePaymentProcessors}
                disabled={saving}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-all duration-300"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Tiers Configuration */}
      {activeSection === 'membership' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Membership Tiers Configuration</h3>
            <div className="space-x-2">
              <button
                onClick={resetToDefaults}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
              >
                Reset to Defaults
              </button>
              <button
                onClick={saveMembershipTiers}
                disabled={saving || !unsavedChanges}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {Object.keys(membershipTiers).map(tierName => {
              const tier = membershipTiers[tierName];
              return (
                <div key={tierName} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-white capitalize">{tierName} Tier</h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tier.enabled !== false}
                        onChange={(e) => updateMembershipTier(tierName, 'enabled', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-300">Enabled</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.price || 0}
                        onChange={(e) => updateMembershipTier(tierName, 'price', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={tier.description || ''}
                        onChange={(e) => updateMembershipTier(tierName, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder={`${tierName.charAt(0).toUpperCase() + tierName.slice(1)} membership tier`}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Commission Rates (as decimals, e.g., 0.25 for 25%)
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {(tier.commissions || []).map((commission, index) => (
                        <div key={index}>
                          <label className="text-xs text-gray-400">Level {index + 1}</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={commission || 0}
                            onChange={(e) => {
                              const newCommissions = [...(tier.commissions || [])];
                              newCommissions[index] = parseFloat(e.target.value) || 0;
                              updateMembershipTier(tierName, 'commissions', newCommissions);
                            }}
                            className="w-full px-2 py-1 bg-black bg-opacity-30 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Processors Configuration */}
      {activeSection === 'payment' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Payment Processors Configuration</h3>
            <button
              onClick={savePaymentProcessors}
              disabled={saving || !unsavedChanges}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="space-y-6">
            {Object.keys(paymentProcessors).map(processorName => {
              const processor = paymentProcessors[processorName];
              return (
                <div key={processorName} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-white capitalize">{processorName}</h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={processor.enabled !== false}
                        onChange={(e) => updatePaymentProcessor(processorName, 'enabled', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-300">Enabled</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={processor.api_key === '***HIDDEN***' ? '' : (processor.api_key || '')}
                        onChange={(e) => updatePaymentProcessor(processorName, 'api_key', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder={processor.api_key === '***HIDDEN***' ? 'Current value hidden' : 'Enter API key'}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Public Key
                      </label>
                      <input
                        type="text"
                        value={processor.public_key === '***HIDDEN***' ? '' : (processor.public_key || '')}
                        onChange={(e) => updatePaymentProcessor(processorName, 'public_key', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder={processor.public_key === '***HIDDEN***' ? 'Current value hidden' : 'Enter public key'}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        IPN Secret
                      </label>
                      <input
                        type="password"
                        value={processor.ipn_secret === '***HIDDEN***' ? '' : (processor.ipn_secret || '')}
                        onChange={(e) => updatePaymentProcessor(processorName, 'ipn_secret', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder={processor.ipn_secret === '***HIDDEN***' ? 'Current value hidden' : 'Enter IPN secret'}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Supported Currencies (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(processor.supported_currencies || []).join(', ')}
                        onChange={(e) => updatePaymentProcessor(processorName, 'supported_currencies', e.target.value.split(',').map(c => c.trim()))}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder="BTC, ETH, USDC, USDT"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    <p><strong>Note:</strong> Changes to payment processor configuration may require application restart to take full effect.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
// Member Modal Component
function MemberModal({ member, editingMember, onClose, onUpdate, onSuspend, onUnsuspend, onEdit }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    membership_tier: 'affiliate'
  });

  // Get the actual member data (handle both detailed and list member objects)
  const memberData = member?.member || member;

  useEffect(() => {
    if (memberData) {
      setFormData({
        username: memberData.username || '',
        email: memberData.email || '',
        membership_tier: memberData.membership_tier || 'affiliate'
      });
    }
  }, [memberData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (memberData) {
      onUpdate(memberData.id || memberData.wallet_address, formData);
    }
  };

  const handleSuspend = () => {
    if (memberData) {
      onSuspend(memberData.id || memberData.wallet_address);
    }
  };

  const handleUnsuspend = () => {
    if (memberData) {
      onUnsuspend(memberData.id || memberData.wallet_address);
    }
  };

  const handleEditClick = () => {
    onEdit(memberData);
  };

  if (!memberData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {editingMember ? 'Edit Member' : 'Member Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {editingMember ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Membership Tier</label>
              <select
                value={formData.membership_tier}
                onChange={(e) => setFormData(prev => ({ ...prev, membership_tier: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
              >
                <option value="affiliate">Affiliate</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Update Member
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Member Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white ml-2">{memberData.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{memberData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Wallet:</span>
                    <span className="text-white ml-2 font-mono text-sm">
                      {memberData.wallet_address || memberData.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tier:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs uppercase font-medium ${
                      memberData.membership_tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                      memberData.membership_tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                      memberData.membership_tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                      'bg-blue-600 text-blue-100'
                    }`}>
                      {memberData.membership_tier}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Joined:</span>
                    <span className="text-white ml-2">
                      {new Date(memberData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">Total Referrals:</span>
                    <span className="text-white ml-2">{member?.stats?.total_referrals || memberData.total_referrals || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Earnings:</span>
                    <span className="text-white ml-2">${(member?.stats?.total_earnings || memberData.total_earnings || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Referral Code:</span>
                    <span className="text-white ml-2 font-mono text-sm">{memberData.referral_code}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-6 border-t border-gray-700">
              <button
                onClick={handleEditClick}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Edit Member
              </button>
              <button
                onClick={handleSuspend}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Suspend Member
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Stat Card Component
function AdminStatCard({ icon, title, value, subtitle }) {
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
}

// Account Settings Only Tab Component (without cancel account section)
function AccountSettingsOnlyTab({ user }) {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    wallet_address: user?.address || '',
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        wallet_address: user.address || ''
      }));
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password fields if provided
      if (profileData.new_password) {
        if (profileData.new_password !== profileData.confirm_new_password) {
          alert('New passwords do not match');
          setLoading(false);
          return;
        }
        if (profileData.new_password.length < 6) {
          alert('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        if (!profileData.current_password) {
          alert('Current password is required to set a new password');
          setLoading(false);
          return;
        }
      }

      // Only include changed fields in the update
      const updateData = {};
      
      if (profileData.email !== user?.email) {
        updateData.email = profileData.email;
      }
      
      if (profileData.wallet_address !== user?.address) {
        updateData.wallet_address = profileData.wallet_address;
      }
      
      if (profileData.new_password) {
        updateData.current_password = profileData.current_password;
        updateData.new_password = profileData.new_password;
      }

      if (Object.keys(updateData).length === 0) {
        alert('No changes detected');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/users/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Profile updated successfully!');
      
      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      }));
      
    } catch (error) {
      console.error('Profile update failed:', error);
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = `Update failed: ${error.response.data.detail}`;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Account Settings</h3>
      
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
          <input
            type="text"
            value={user?.username || ''}
            disabled
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
          />
          <p className="text-gray-500 text-xs mt-1">Username cannot be changed</p>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Wallet Address</label>
          <input
            type="text"
            value={profileData.wallet_address}
            onChange={(e) => setProfileData(prev => ({ ...prev, wallet_address: e.target.value }))}
            className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            placeholder="Enter your wallet address"
            required
          />
        </div>

        {/* Password Change Section */}
        <div className="border-t border-gray-600 pt-4 mt-6">
          <h4 className="text-lg font-semibold text-white mb-4">Change Password</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Current Password</label>
              <input
                type="password"
                value={profileData.current_password}
                onChange={(e) => setProfileData(prev => ({ ...prev, current_password: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={profileData.new_password}
                onChange={(e) => setProfileData(prev => ({ ...prev, new_password: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Confirm New Password</label>
              <input
                type="password"
                value={profileData.confirm_new_password}
                onChange={(e) => setProfileData(prev => ({ ...prev, confirm_new_password: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}

// Cancel Account Tab Component
function CancelAccountTab() {
  const handleCancelAccount = async () => {
    if (!window.confirm('Are you sure you want to cancel your account? This action cannot be undone.')) {
      return;
    }

    if (!window.confirm('WARNING: This will permanently delete your account and all associated data. Are you absolutely sure?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/cancel-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Your account has been cancelled successfully.');
      localStorage.removeItem('token');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Account cancellation failed:', error);
      alert('Failed to cancel account. Please contact support.');
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Account Actions</h3>
      
      <div className="space-y-4">
        <div className="border border-red-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-red-400 mb-2">Cancel Account</h4>
          <p className="text-gray-300 text-sm mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={handleCancelAccount}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
          >
            Cancel Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
