import React, { useState, useEffect } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { arbitrum, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  X
} from 'lucide-react';
import './App.css';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.REACT_APP_WC_PROJECT_ID || 'af44774b87514c0aab24072250c2baa8';

// 2. Create wagmiConfig
const metadata = {
  name: 'Web3 Membership Platform',
  description: 'Multi-tier affiliate membership platform',
  url: 'https://web3membership.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, arbitrum];
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true
});

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true
});

const queryClient = new QueryClient();
const API_URL = process.env.REACT_APP_BACKEND_URL;

// Auth context
const AuthContext = React.createContext();

// Main App Component
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
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
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Network className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">Web3 Membership</span>
            </div>
            <div className="flex items-center space-x-4">
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
                Join the Future of
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {" "}Web3 Membership
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Unlock unlimited earning potential with our 4-tier affiliate system. 
                Connect your wallet, choose your membership level, and start earning 
                instant crypto commissions.
              </p>
              
              {referralCode && (
                <div className="bg-blue-900 bg-opacity-50 border border-blue-400 rounded-lg p-4 mb-6">
                  <p className="text-blue-300 text-sm font-medium">
                    🎉 You've been invited! Using referral code: <span className="font-bold text-blue-200">{referralCode}</span>
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <WalletConnectButton />
                <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-300">
                  Learn More
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1639815188546-c43c240ff4df?w=600&h=400&fit=crop"
                  alt="Blockchain Network"
                  className="rounded-2xl shadow-2xl w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent rounded-2xl opacity-60"></div>
              </div>
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black bg-opacity-30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Choose Your Membership Tier
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Higher tiers unlock better commission rates and deeper affiliate levels
            </p>
          </div>

          <MembershipTiers referralCode={referralCode} />
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              4-Level Commission Structure
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Earn from multiple levels of referrals with instant USDC payouts
            </p>
          </div>

          <CommissionStructure />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black bg-opacity-30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Wallet className="h-12 w-12 text-blue-400" />}
              title="Web3 Wallet Integration"
              description="Connect with any Web3 wallet using WalletConnect. Secure, decentralized authentication."
            />
            <FeatureCard 
              icon={<DollarSign className="h-12 w-12 text-green-400" />}
              title="Instant Crypto Payouts"
              description="Receive commission payments instantly in USDC directly to your connected wallet."
            />
            <FeatureCard 
              icon={<TrendingUp className="h-12 w-12 text-purple-400" />}
              title="Multi-Level Earnings"
              description="Earn from up to 4 levels of referrals with tier-based commission rates."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// Wallet Connect Button
function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { user, login } = useAuth();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!address) return;
    
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

  useEffect(() => {
    if (isConnected && address && !user && !loading) {
      // Only auto-authenticate on landing page, not on registration page
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
        handleAuth();
      }
    }
  }, [isConnected, address, user]);

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
  const { address, isConnected } = useAccount();
  const { login, user } = useAuth();
  const { signMessageAsync } = useSignMessage();
  const [formData, setFormData] = useState({
    username: '',
    email: ''
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
    if (!address) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/users/register`, {
        address: address.toLowerCase(),
        username: formData.username,
        email: formData.email,
        referrer_code: referralCode || undefined
      });

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

      window.location.href = '/dashboard';

    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <Network className="h-16 w-16 text-blue-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-300 mb-8">Please connect your Web3 wallet to continue with registration</p>
          <w3m-button />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Join Web3 Membership</h1>
          
          {referrerInfo && (
            <div className="bg-blue-900 bg-opacity-50 border border-blue-400 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">
                🎉 Invited by: <span className="font-bold text-blue-200">{referrerInfo.referrer_username}</span>
                <span className="ml-2 px-2 py-1 bg-blue-700 rounded text-xs">{referrerInfo.referrer_tier}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
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
              <label className="block text-gray-300 text-sm font-medium mb-2">Wallet Address</label>
              <input
                type="text"
                value={address}
                disabled
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
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
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'network', label: 'Network Tree', icon: Network },
    { id: 'affiliate-tools', label: 'Affiliate Tools', icon: ExternalLink },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'payments', label: 'Payment History', icon: Activity },
    { id: 'milestones', label: 'Milestones', icon: Award },
    { id: 'leads', label: 'My Leads', icon: FileText },
    { id: 'account', label: 'Account Settings', icon: Settings }
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
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
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
          {activeTab === 'account' && <AccountSettingsTab user={user} />}

          {/* Leads Management Tab */}
          {activeTab === 'leads' && (
            <LeadsManagementTab />
          )}
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
  const copyReferralLink = () => {
    if (user?.referral_link) {
      navigator.clipboard.writeText(user.referral_link);
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
            value={user?.referral_link || ''}
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
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelAccount = async () => {
    setCancelling(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/users/cancel-account`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Account cancelled successfully. You will be logged out.');
      
      // Clear authentication and redirect to home
      localStorage.removeItem('token');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Failed to cancel account:', error);
      alert('Failed to cancel account: ' + (error.response?.data?.detail || error.message));
    } finally {
      setCancelling(false);
      setShowCancelWarning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={user?.username || ''}
                readOnly
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Wallet Address</label>
            <input
              type="text"
              value={user?.address || ''}
              readOnly
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Membership Tier</label>
              <div className="px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg">
                <span className={`px-3 py-1 rounded text-sm uppercase font-medium ${
                  user?.membership_tier === 'gold' ? 'bg-yellow-600 text-yellow-100' :
                  user?.membership_tier === 'silver' ? 'bg-gray-600 text-gray-100' :
                  user?.membership_tier === 'bronze' ? 'bg-orange-600 text-orange-100' :
                  'bg-blue-600 text-blue-100'
                }`}>
                  {user?.membership_tier || 'affiliate'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Member Since</label>
              <input
                type="text"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                readOnly
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Referral Code</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={user?.referral_code || ''}
                readOnly
                className="flex-1 px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user?.referral_code || '');
                  alert('Referral code copied!');
                }}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-300"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900 bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-red-600">
        <h3 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="p-4 bg-red-600 bg-opacity-10 rounded-lg border border-red-500">
            <h4 className="text-red-300 font-bold mb-2">Cancel Account</h4>
            <p className="text-gray-300 text-sm mb-4">
              Permanently cancel your account. This action cannot be undone.
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-red-200 text-sm">
                  <strong>You will lose access to your account</strong> - You won't be able to log in again
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-red-200 text-sm">
                  <strong>All pending commissions will be forfeited</strong> - Any unpaid earnings will be lost
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-red-200 text-sm">
                  <strong>Your referrals will transfer to your sponsor</strong> - All your downline members will be reassigned
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-red-200 text-sm">
                  <strong>Account reinstatement is not possible</strong> - This action is permanent and irreversible
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCancelWarning(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Cancel My Account
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Account Warning Modal */}
      {showCancelWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4 border border-red-600">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Final Warning</h3>
              <p className="text-gray-300 text-sm">
                Are you absolutely sure you want to cancel your account? This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3 bg-red-900 bg-opacity-30 rounded border border-red-500">
                <p className="text-red-200 text-sm text-center">
                  ⚠️ All your commissions, referrals, and account data will be permanently lost
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelWarning(false)}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Keep My Account
              </button>
              <button
                onClick={handleCancelAccount}
                disabled={cancelling}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold rounded-lg transition-all duration-300"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Account'}
              </button>
            </div>
          </div>
        </div>
      )}
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

// Admin Dashboard Component
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
            { id: 'leads', label: 'Leads', icon: FileText }
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
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.suspended ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'
                          }`}>
                            {member.suspended ? 'Suspended' : 'Active'}
                          </span>
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
          onEdit={handleEditMember}
        />
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

// Member Modal Component
function MemberModal({ member, editingMember, onClose, onUpdate, onSuspend, onEdit }) {
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

export default App;
