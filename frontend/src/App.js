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
  Network
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

      // Create payment
      const response = await axios.post(`${API_URL}/api/payments/create`, {
        tier: tier.name.toLowerCase(),
        currency: 'BTC' // Default to BTC, could make this selectable
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

  const copyReferralLink = () => {
    if (user?.referral_link) {
      navigator.clipboard.writeText(user.referral_link);
      alert('Referral link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
              <span className="text-gray-300">Welcome, {user?.username}</span>
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

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Payment Status */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Recent Payments</h3>
          <RecentPayments />
        </div>

        {/* Payment Status */}
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
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
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
        currency: selectedCurrency
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

export default App;