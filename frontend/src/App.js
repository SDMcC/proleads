import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Tree from 'react-d3-tree';
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
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell,
  UserX,
  MessageCircle,
  Zap,
  Send,
  Paperclip,
  Search,
  Filter,
  Eye,
  ArrowLeft,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Circle,
  MoreVertical,
  Target,
  Trash2,
  Upload,
  Edit,
  Calendar,
  User,
  RefreshCcw,
  Ticket,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';
import './App.css';


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Utility function to get tier display name
const getTierDisplayName = (tier) => {
  if (tier === 'vip_affiliate') return 'VIP Affiliate';
  return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Unknown';
};

// Utility function to get tier badge colors
const getTierBadgeClass = (tier) => {
  switch (tier) {
    case 'gold':
      return 'bg-yellow-600 text-yellow-100';
    case 'silver':
      return 'bg-gray-600 text-gray-100';
    case 'bronze':
      return 'bg-orange-600 text-orange-100';
    case 'test':
      return 'bg-green-600 text-green-100';
    case 'vip_affiliate':
      return 'bg-purple-600 text-purple-100';
    case 'affiliate':
    default:
      return 'bg-blue-600 text-blue-100';
  }
};
// Auth context
const AuthContext = React.createContext();

// Main App Component
// Error Boundary Component (Simplified)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-4">Please refresh the page to continue</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/affiliates" element={<AffiliatesPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
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
    </ErrorBoundary>
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
      const response = await axios.get(`${API_URL}/users/profile`, {
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

// Login Modal Component
function LoginModal({ onClose }) {
  const { login } = useAuth();
  const { isDark } = require('./DarkModeContext').useDarkMode();
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

// Enhanced Membership Tiers Component
function EnhancedMembershipTiers({ tiers, referralCode, loading }) {
  const publicTiers = ['affiliate', 'bronze', 'silver', 'gold'];
  
  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-dark transition-colors duration-300" id="pricing">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-dark transition-colors duration-300" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
            Choose Your Membership Level
          </h2>
          <p className="text-lg text-body-color dark:text-body-color-dark max-w-3xl mx-auto">
            Select the tier that matches your network marketing goals. Each membership includes weekly leads and access to our affiliate program.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {publicTiers.map((tierId) => {
            const tier = tiers[tierId];
            if (!tier) return null;
            
            const isAffiliate = tierId === 'affiliate';
            const price = tier.price;
            const commissions = tier.commissions || [];
            
            // Define leads per week
            const leadsPerWeek = {
              affiliate: 0,
              bronze: 100,
              silver: 250,
              gold: 500
            }[tierId] || 0;

            return (
              <div key={tierId} className={`relative bg-white dark:bg-dark border-2 rounded-lg shadow-lg overflow-hidden transition-colors duration-300 ${
                tierId === 'silver' ? 'border-blue-500 dark:border-blue-400 transform scale-105' : 'border-stroke dark:border-stroke-dark'
              }`}>
                {tierId === 'silver' && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-500 dark:bg-blue-400 text-white dark:text-black text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-black dark:text-white capitalize mb-2">
                      {getTierDisplayName(tierId)}
                    </h3>
                    <div className="text-3xl font-bold text-black dark:text-white mb-2">
                      {isAffiliate ? 'FREE' : `$${price}`}
                      {!isAffiliate && <span className="text-lg text-body-color dark:text-body-color-dark">/month</span>}
                    </div>
                    {isAffiliate && (
                      <p className="text-sm text-body-color dark:text-body-color-dark">Lifetime Access</p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
                      <span className="text-body-color dark:text-body-color-dark">
                        {leadsPerWeek > 0 ? `${leadsPerWeek} leads/week` : 'Affiliate program access'}
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
                      <span className="text-body-color dark:text-body-color-dark">
                        {commissions.length === 4 ? '4-tier commissions' : '2-tier commissions'}
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
                      <span className="text-body-color dark:text-body-color-dark">Instant USDC payouts</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
                      <span className="text-body-color dark:text-body-color-dark">Member dashboard</span>
                    </li>
                  </ul>

                  {commissions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-black dark:text-white mb-2">Commission Structure:</h4>
                      <div className="text-xs text-body-color dark:text-body-color-dark space-y-1">
                        {commissions.map((rate, index) => (
                          <div key={index}>Tier {index + 1}: {Math.round(rate * 100)}%</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <a 
                    href={`/register?tier=${tierId}${referralCode ? `&ref=${referralCode}` : ''}`}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      tierId === 'silver' 
                        ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white dark:text-black' 
                        : 'bg-primary hover:bg-primary/80 text-white'
                    }`}
                  >
                    {isAffiliate ? 'Join Free' : 'Choose Plan'}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// FAQ Section Component
function FAQSection() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How does the affiliate program work?",
      answer: "Every member becomes an affiliate and can earn commissions by referring new members. You earn up to 30% recurring commissions on referrals, with payments made instantly in USDC."
    },
    {
      question: "What kind of leads do you provide?",
      answer: "We provide fresh, verified leads for network marketing. Leads are delivered weekly to your member dashboard and include contact information for prospects interested in business opportunities."
    },
    {
      question: "How are commissions paid?",
      answer: "All commissions are paid instantly in USDC cryptocurrency directly to your wallet address. Payments are processed automatically when new members join your network."
    },
    {
      question: "Can I cancel my membership anytime?",
      answer: "Yes, you can cancel your membership at any time. Due to the nature of cryptocurrency payments and instant commission distribution, refunds are subject to our refund policy."
    },
    {
      question: "What's the difference between membership tiers?",
      answer: "Higher tiers receive more weekly leads and have access to deeper commission structures (up to 4 levels). All tiers include affiliate program access and member dashboard."
    }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-bg-color-dark transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-body-color dark:text-body-color-dark">Get answers to common questions about Proleads Network</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full text-left p-6 bg-white dark:bg-dark rounded-lg shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-black dark:text-white">{faq.question}</h3>
                  <ChevronDown className={`h-5 w-5 text-body-color dark:text-body-color-dark transition-transform duration-300 ${
                    openFaq === index ? 'transform rotate-180' : ''
                  }`} />
                </div>
              </button>
              {openFaq === index && (
                <div className="mt-2 p-6 pt-0 bg-white dark:bg-dark rounded-lg transition-colors duration-300">
                  <p className="text-body-color dark:text-body-color-dark">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  
  const scrollToSection = (sectionId) => {
    // If we're not on the homepage, navigate to it first
    if (window.location.pathname !== '/') {
      window.location.href = '/';
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSmoothScroll = (sectionId) => {
    if (window.location.pathname !== '/') {
      // If not on homepage, navigate to homepage and then scroll
      window.location.href = '/#' + sectionId;
    } else {
      scrollToSection(sectionId);
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="flex flex-col items-center mb-4">
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="w-20 h-auto mb-2"
              />
              <p className="text-gray-400 text-lg">
                Your LeadGen Partner
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><button onClick={() => handleSmoothScroll('about')} className="text-gray-400 hover:text-white transition-colors text-left">About</button></li>
              <li><button onClick={() => handleSmoothScroll('pricing')} className="text-gray-400 hover:text-white transition-colors text-left">Pricing</button></li>
              <li><a href="/affiliates" className="text-gray-400 hover:text-white transition-colors">Affiliates</a></li>
              <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Members Area</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-400">Email: support@proleads.network</span></li>
              <li><span className="text-gray-400">24/7 Member Support</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Proleads Network. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Affiliates Page Component
function AffiliatesPage() {
  const { isDark, toggleDarkMode } = require('./DarkModeContext').useDarkMode();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-dark' : 'bg-white'}`}>
      {/* Header */}
      <header className="absolute top-0 left-0 z-40 w-full bg-transparent transition-colors duration-300">
        <div className="container mx-auto">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4">
              <a href="/" className="flex items-center space-x-3 py-5">
                <img 
                  src={isDark ? "https://members.proleads.network/assets/images/hero-logo-2.png" : "https://members.proleads.network/assets/images/hero-logo-4.png"}
                  alt="Proleads Network" 
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-white dark:text-white">Proleads Network</span>
              </a>
            </div>
            <div className="flex w-full items-center justify-end px-4">
              <button
                onClick={toggleDarkMode}
                className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors duration-300"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-white" />
                ) : (
                  <Moon className="h-5 w-5 text-white" />
                )}
              </button>
              <a 
                href="/" 
                className="text-white hover:text-blue-300 transition-colors font-medium"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Image */}
      <section className="relative pt-[120px] pb-20 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/network-connection-bg.jpg" 
            alt="Network background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-indigo-900/90"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Join Our Affiliate Program
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Earn up to 30% recurring commissions by referring new members to Proleads Network. 
              Build your network and create passive income with our generous multi-tier commission structure.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white dark:bg-gray-dark transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              How The Affiliate Program Works
            </h2>
            <p className="text-lg text-body-color dark:text-body-color-dark max-w-2xl mx-auto">
              Three simple steps to start earning recurring commissions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl shadow-lg transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">1. Become a Member</h3>
              <p className="text-body-color dark:text-body-color-dark">
                Join any membership tier to automatically become an affiliate. Even our free Affiliate tier 
                gives you access to the referral program and commission structure.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl shadow-lg transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">2. Share Your Link</h3>
              <p className="text-body-color dark:text-body-color-dark">
                Get your unique referral link from your dashboard and share it with your network. 
                Anyone who joins through your link becomes part of your downline.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl shadow-lg transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">3. Earn Commissions</h3>
              <p className="text-body-color dark:text-body-color-dark">
                Receive instant USDC payouts when your referrals join. Earn recurring monthly commissions 
                and build passive income through our multi-tier structure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-16 bg-gray-light dark:bg-dark-2 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Commission Structure by Tier
            </h2>
            <p className="text-lg text-body-color dark:text-body-color-dark max-w-2xl mx-auto">
              Higher tiers unlock deeper commission levels and better rates
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-dark border-2 border-stroke dark:border-stroke-dark rounded-xl p-6 shadow-lg transition-colors duration-300">
              <h3 className="text-lg font-bold text-primary mb-4">Affiliate (Free)</h3>
              <ul className="space-y-2 text-body-color dark:text-body-color-dark">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 1: 25%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 2: 5%
                </li>
                <li className="text-gray-400">No weekly leads</li>
                <li className="text-primary font-medium mt-4">Perfect for beginners</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-dark border-2 border-stroke dark:border-stroke-dark rounded-xl p-6 shadow-lg transition-colors duration-300">
              <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-4">Bronze ($20/month)</h3>
              <ul className="space-y-2 text-body-color dark:text-body-color-dark">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 1: 25%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 2: 5%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 3: 3%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 4: 2%
                </li>
                <li className="text-orange-600 dark:text-orange-400 font-medium mt-4">100 leads/week</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-dark border-2 border-blue-500 dark:border-blue-400 rounded-xl p-6 shadow-xl transform scale-105 transition-colors duration-300">
              <div className="bg-blue-500 dark:bg-blue-400 text-white dark:text-black text-center py-1 text-xs font-medium rounded-md mb-4">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">Silver ($50/month)</h3>
              <ul className="space-y-2 text-body-color dark:text-body-color-dark">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 1: 27%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 2: 10%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 3: 5%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 4: 3%
                </li>
                <li className="text-blue-600 dark:text-blue-400 font-medium mt-4">250 leads/week</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-dark border-2 border-stroke dark:border-stroke-dark rounded-xl p-6 shadow-lg transition-colors duration-300">
              <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-4">Gold ($100/month)</h3>
              <ul className="space-y-2 text-body-color dark:text-body-color-dark">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 1: 30%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 2: 15%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 3: 10%
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tier 4: 5%
                </li>
                <li className="text-yellow-600 dark:text-yellow-400 font-medium mt-4">500 leads/week</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-body-color dark:text-body-color-dark mb-6 text-lg">
              Higher membership tiers earn better commission rates and receive more weekly leads to grow your business.
            </p>
            <a 
              href="/#pricing"
              className="bg-primary hover:bg-primary/80 text-white py-3 px-8 rounded-lg font-semibold transition-all duration-300 inline-block"
            >
              View All Plans
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white dark:bg-gray-dark transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Affiliate Program Benefits
            </h2>
            <p className="text-lg text-body-color dark:text-body-color-dark max-w-2xl mx-auto">
              Everything you need to build a successful affiliate business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Instant USDC Payouts</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Receive your commissions instantly in USDC cryptocurrency. No waiting periods, no manual processing - 
                    payments are automated and sent directly to your wallet.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Recurring Commissions</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Earn monthly recurring commissions for as long as your referrals remain active members. 
                    Build sustainable passive income with compound growth.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Multi-Tier Structure</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Earn from up to 4 levels deep in your network. Higher membership tiers unlock deeper 
                    commission structures and better rates.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Easy Sharing Tools</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Get your personalized referral link and tracking tools from your member dashboard. 
                    Monitor your network growth and commission earnings in real-time.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Quality Leads Included</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Paid tiers receive weekly verified leads to help grow your business. Use these leads 
                    for your own network marketing while earning affiliate commissions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Experience Required</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Perfect for beginners and experienced marketers alike. Our system handles the technical 
                    aspects while you focus on sharing and growing your network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-20 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/network-connection-bg.jpg" 
            alt="Network background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-indigo-900/90"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Join Proleads Network today and start building your affiliate network. 
            Even our free tier gives you access to commission opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/register?tier=affiliate"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-10 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Join Free Now
            </a>
            <a 
              href="/#pricing"
              className="bg-white/20 backdrop-blur-md text-white py-4 px-10 rounded-xl font-bold text-lg hover:bg-white/30 transition-all duration-300 border-2 border-white/30"
            >
              View All Plans
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Privacy Policy Page Component
function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center space-x-3">
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold">Proleads Network</span>
            </a>
            <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Policies</h1>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Jump to:</h3>
            <ul className="space-y-2">
              <li><a href="#privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a></li>
              <li><a href="#refund-policy" className="text-blue-600 hover:text-blue-800">Refund Policy</a></li>
              <li><a href="#contact" className="text-blue-600 hover:text-blue-800">Contact Us</a></li>
            </ul>
          </div>

          <section id="privacy-policy" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h2>
            <p className="text-gray-600 mb-4"><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
            
            <p className="text-gray-700 mb-6">
              This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your 
              information when You use the Service and tells You about Your privacy rights and how the law protects You.
            </p>

            <p className="text-gray-700 mb-8">
              We use Your Personal data to provide and improve the Service. By using the Service, You agree to the 
              collection and use of information in accordance with this Privacy Policy.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Information We Collect</h3>
            <p className="text-gray-700 mb-4">
              While using Our Service, We may ask You to provide Us with certain personally identifiable information 
              that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Email address</li>
              <li>Username and password</li>
              <li>Cryptocurrency wallet addresses</li>
              <li>Usage Data</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">How We Use Your Information</h3>
            <p className="text-gray-700 mb-4">The Company may use Personal Data for the following purposes:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li><strong>To provide and maintain our Service:</strong> including monitoring usage of our Service</li>
              <li><strong>To manage Your Account:</strong> manage Your registration as a user of the Service</li>
              <li><strong>To process payments:</strong> handle cryptocurrency transactions and commission payments</li>
              <li><strong>To contact You:</strong> regarding updates, security notices, or support requests</li>
              <li><strong>For business transfers:</strong> in connection with mergers or asset transfers</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Data Security</h3>
            <p className="text-gray-700 mb-6">
              The security of Your Personal Data is important to Us, but remember that no method of transmission over 
              the Internet, or method of electronic storage is 100% secure. While We strive to use commercially 
              acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Blockchain and Cryptocurrency</h3>
            <p className="text-gray-700 mb-6">
              Our service involves cryptocurrency transactions on blockchain networks. Please note that blockchain 
              transactions are public and immutable. While wallet addresses may be pseudonymous, transaction data 
              is permanently recorded on the blockchain.
            </p>
          </section>

          <section id="refund-policy" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Return & Refund Policy</h2>
            <p className="text-gray-600 mb-4"><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
            
            <p className="text-gray-700 mb-6">
              All payments including commission payouts to our affiliates and members are made using USDC and are 
              processed, split and transferred instantly to the personal wallets of all members and affiliates who 
              are part of the respective sale - up to seven individual wallets.
            </p>

            <p className="text-gray-700 mb-6">
              Due to the nature of the blockchain and cryptocurrency in general, transactions can only be refunded 
              by the party receiving the funds, so it is not possible for us to offer refunds without the agreement 
              and action of the other parties involved.
            </p>

            <p className="text-gray-700 mb-6">
              If you have any questions, concerns, or complaints regarding this refund policy, we encourage you to 
              contact us using the details below.
            </p>
          </section>

          <section id="contact" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, You can contact us:
            </p>
            <ul className="text-gray-700 space-y-2">
              <li>By email: <a href="mailto:support@proleads.network" className="text-blue-600 hover:text-blue-800">support@proleads.network</a></li>
              <li>Through our member support system in your dashboard</li>
            </ul>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Terms of Service Page Component
function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center space-x-3">
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold">Proleads Network</span>
            </a>
            <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Jump to:</h3>
            <ul className="space-y-2">
              <li><a href="#terms-conditions" className="text-blue-600 hover:text-blue-800">Website Terms & Conditions</a></li>
              <li><a href="#kyc-policy" className="text-blue-600 hover:text-blue-800">Know Your Customer</a></li>
              <li><a href="#participation-terms" className="text-blue-600 hover:text-blue-800">Terms of Participation</a></li>
              <li><a href="#affiliate-terms" className="text-blue-600 hover:text-blue-800">Affiliate Terms & Conditions</a></li>
            </ul>
          </div>

          <section id="terms-conditions" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Website Terms & Conditions</h2>
            
            <p className="text-gray-700 mb-6">
              These Terms govern your access to, usage of all content, products and services available at our website 
              (the "Service") operated by Proleads Network ("us", "we", or "our").
            </p>

            <p className="text-gray-700 mb-8">
              Your access to our services are subject to your acceptance, without modification, of all of the terms 
              and conditions contained herein and all other operating rules and policies published and that may be 
              published from time to time by us.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">User Accounts</h3>
            <p className="text-gray-700 mb-6">
              Where use of any part of our Services requires an account, you agree to provide us with complete and 
              accurate information when you register for an account. You will be solely responsible and liable for 
              any activity that occurs under your account.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Cryptocurrency and Blockchain</h3>
            <p className="text-gray-700 mb-6">
              Our service involves cryptocurrency transactions and blockchain technology. You acknowledge and understand 
              the risks associated with cryptocurrency, including volatility, technical risks, and regulatory uncertainty. 
              All transactions are final and irreversible.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Termination</h3>
            <p className="text-gray-700 mb-6">
              We may terminate or suspend your access to all or any part of our Services at any time, with or without 
              cause, with or without notice, effective immediately. If you wish to terminate your account, you may 
              simply discontinue using our Services.
            </p>
          </section>

          <section id="kyc-policy" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Know Your Customer (KYC) Policy</h2>
            
            <p className="text-gray-700 mb-6">
              To comply with applicable laws and regulations, including anti-money laundering (AML) and 
              counter-terrorism financing (CTF) requirements, we may require you to provide certain information 
              and documentation to verify your identity.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">KYC Requirements</h3>
            <p className="text-gray-700 mb-4">Depending on your usage of our services, we may request:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Personal identification details (full name, date of birth, address)</li>
              <li>Government-issued identification documents</li>
              <li>Proof of address documentation</li>
              <li>Source of funds verification for large transactions</li>
            </ul>

            <p className="text-gray-700 mb-6">
              Failure to provide requested KYC information in a timely manner may result in restrictions on your 
              account, including withholding of commission payments or suspension of access to our services.
            </p>
          </section>

          <section id="participation-terms" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Terms of Participation</h2>
            
            <div className="space-y-4 text-gray-700">
              <p><strong>1.</strong> Members must be 18 years of age or older to participate. Members must provide accurate, complete and updated registration information.</p>
              
              <p><strong>2.</strong> We reserve the right to refuse applications for membership at our sole discretion.</p>
              
              <p><strong>3.</strong> Members may not activate or use more than one Member account or use false or misleading information.</p>
              
              <p><strong>4.</strong> We reserve the right to track Member activity and transactions for security and compliance purposes.</p>
              
              <p><strong>5.</strong> We have the right to suspend or cancel membership for violations of these terms. All earnings may be forfeited for fraudulent behavior.</p>
              
              <p><strong>6.</strong> Spamming is strictly prohibited and will result in immediate account termination.</p>
              
              <p><strong>7.</strong> All Members shall comply with applicable laws, rules, and regulations in their jurisdiction.</p>
            </div>
          </section>

          <section id="affiliate-terms" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Affiliate Terms & Conditions</h2>
            
            <p className="text-gray-700 mb-6">
              These terms apply to individuals participating in our affiliate program. By participating, you agree 
              to use the program in accordance with these terms.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Affiliate Registration</h3>
            <p className="text-gray-700 mb-6">
              We reserve the right to approve or reject any affiliate registration in our sole discretion. 
              All members automatically become affiliates and can earn commissions by referring new members.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Commissions and Payments</h3>
            <p className="text-gray-700 mb-6">
              Commission rates vary by membership tier and are paid instantly in USDC cryptocurrency. Payments 
              are made automatically to your specified wallet address when referrals join or make payments.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Network Building</h3>
            <p className="text-gray-700 mb-6">
              Affiliates can invite others to become their downline affiliates. Network commissions are paid 
              according to your membership tier's commission structure, up to 4 levels deep for higher tiers.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Compliance</h3>
            <p className="text-gray-700 mb-6">
              Affiliates must comply with all applicable laws regarding marketing, advertising, and financial 
              services. Misleading claims, spam, or fraudulent practices will result in immediate termination.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Landing Page Component - ProLeads Network Style
function LandingPage() {
  const { user } = useAuth();
  const { isDark, toggleDarkMode } = require('./DarkModeContext').useDarkMode();
  const [referralCode, setReferralCode] = useState('');
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [membershipTiers, setMembershipTiers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      fetchReferrerInfo(ref);
    }
    fetchMembershipTiers();
    
    // Handle hash navigation for smooth scrolling
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
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

  const fetchMembershipTiers = async () => {
    try {
      const response = await axios.get(`${API_URL}/membership/tiers`);
      setMembershipTiers(response.data.tiers);
    } catch (error) {
      console.error('Failed to fetch tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Modern Header with Dark Mode Toggle */}
      <header className="fixed top-0 left-0 z-40 w-full bg-white/80 dark:bg-gray-dark/80 backdrop-blur-sm shadow-sticky dark:shadow-sticky-dark transition-all duration-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-5 lg:py-2">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src={isDark 
                  ? "https://members.proleads.network/assets/images/hero-logo-2.png" 
                  : "https://customer-assets.emergentagent.com/job_membership-tier/artifacts/pnsgppw4_hero-logo-4.png"
                }
                alt="Proleads Network" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-black dark:text-white">Proleads Network</span>
            </div>

            {/* Right Side - Dark Mode Toggle + Login */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-dark text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-dark transition-colors duration-300"
              >
                {isDark ? (
                  <svg viewBox="0 0 25 24" fill="none" className="w-5 h-5">
                    <path d="M12.0508 16.5C10.8573 16.5 9.71271 16.0259 8.8688 15.182C8.02489 14.3381 7.55078 13.1935 7.55078 12C7.55078 10.8065 8.02489 9.66193 8.8688 8.81802C9.71271 7.97411 10.8573 7.5 12.0508 7.5C13.2443 7.5 14.3888 7.97411 15.2328 8.81802C16.0767 9.66193 16.5508 10.8065 16.5508 12C16.5508 13.1935 16.0767 14.3381 15.2328 15.182C14.3888 16.0259 13.2443 16.5 12.0508 16.5ZM12.0508 18C13.6421 18 15.1682 17.3679 16.2934 16.2426C17.4186 15.1174 18.0508 13.5913 18.0508 12C18.0508 10.4087 17.4186 8.88258 16.2934 7.75736C15.1682 6.63214 13.6421 6 12.0508 6C10.4595 6 8.93336 6.63214 7.80814 7.75736C6.68292 8.88258 6.05078 10.4087 6.05078 12C6.05078 13.5913 6.68292 15.1174 7.80814 16.2426C8.93336 17.3679 10.4595 18 12.0508 18Z" fill="currentColor" />
                    <path d="M12.0508 0C12.2497 0 12.4405 0.0790176 12.5811 0.21967C12.7218 0.360322 12.8008 0.551088 12.8008 0.75V3.75C12.8008 3.94891 12.7218 4.13968 12.5811 4.28033C12.4405 4.42098 12.2497 4.5 12.0508 4.5C11.8519 4.5 11.6611 4.42098 11.5205 4.28033C11.3798 4.13968 11.3008 3.94891 11.3008 3.75V0.75C11.3008 0.551088 11.3798 0.360322 11.5205 0.21967C11.6611 0.0790176 11.8519 0 12.0508 0ZM12.0508 19.5C12.2497 19.5 12.4405 19.579 12.5811 19.7197C12.7218 19.8603 12.8008 20.0511 12.8008 20.25V23.25C12.8008 23.4489 12.7218 23.6397 12.5811 23.7803C12.4405 23.921 12.2497 24 12.0508 24C11.8519 24 11.6611 23.921 11.5205 23.7803C11.3798 23.6397 11.3008 23.4489 11.3008 23.25V20.25C11.3008 20.0511 11.3798 19.8603 11.5205 19.7197C11.6611 19.579 11.8519 19.5 12.0508 19.5ZM24.0508 12C24.0508 12.1989 23.9718 12.3897 23.8311 12.5303C23.6905 12.671 23.4997 12.75 23.3008 12.75H20.3008C20.1019 12.75 19.9111 12.671 19.7705 12.5303C19.6298 12.3897 19.5508 12.1989 19.5508 12C19.5508 11.8011 19.6298 11.6103 19.7705 11.4697C19.9111 11.329 20.1019 11.25 20.3008 11.25H23.3008C23.4997 11.25 23.6905 11.329 23.8311 11.4697C23.9718 11.6103 24.0508 11.8011 24.0508 12ZM4.55078 12C4.55078 12.1989 4.47176 12.3897 4.33111 12.5303C4.19046 12.671 3.99969 12.75 3.80078 12.75H0.800781C0.601869 12.75 0.411103 12.671 0.270451 12.5303C0.129799 12.3897 0.0507813 12.1989 0.0507812 12C0.0507813 11.8011 0.129799 11.6103 0.270451 11.4697C0.411103 11.329 0.601869 11.25 0.800781 11.25H3.80078C3.99969 11.25 4.19046 11.329 4.33111 11.4697C4.47176 11.6103 4.55078 11.8011 4.55078 12Z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 23 23" className="w-5 h-5 stroke-current" fill="none">
                    <path d="M9.55078 1.5C5.80078 1.5 1.30078 5.25 1.30078 11.25C1.30078 17.25 5.80078 21.75 11.8008 21.75C17.8008 21.75 21.5508 17.25 21.5508 13.5C13.3008 18.75 4.30078 9.75 9.55078 1.5Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Login Button */}
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Hero Section with Video Background */}
      <section className="relative z-10 overflow-hidden pt-[120px] pb-16 md:pt-[150px] md:pb-[120px] xl:pt-[180px] xl:pb-[160px]">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-[-2]">
          <video 
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto transform -translate-x-1/2 -translate-y-1/2 object-cover"
            autoPlay 
            loop 
            muted 
            playsInline
          >
            <source 
              src="/grok-video-loop.mp4" 
              type="video/mp4" 
            />
          </video>
        </div>
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-[-1]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap -mx-4">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[800px] text-center">
                <div className="mb-8">
                  <img 
                    src={isDark 
                      ? "https://members.proleads.network/assets/images/hero-logo-2.png" 
                      : "https://customer-assets.emergentagent.com/job_membership-tier/artifacts/pnsgppw4_hero-logo-4.png"
                    }
                    alt="Proleads Network" 
                    className="h-16 w-auto mx-auto mb-6"
                  />
                </div>
                
                <h1 className="mb-5 text-3xl font-bold leading-tight text-white sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight drop-shadow-lg">
                  Welcome To Proleads Network
                </h1>
                
                <p className="mb-12 text-base leading-relaxed text-gray-100 sm:text-lg md:text-xl drop-shadow-md">
                  A Constant Supply Of Fresh Leads For Your Business. Network marketing made simple with blockchain-verified leads straight to your members area.
                </p>
                
                {referrerInfo && (
                  <div className="max-w-md mx-auto mb-8 p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                    <p className="text-white text-sm font-medium drop-shadow-md">
                      🎉 You're joining through <strong>{referrerInfo.referrer_username}</strong>'s network!
                    </p>
                    <p className="text-gray-100 text-xs mt-1 drop-shadow-sm">
                      Tier: {getTierDisplayName(referrerInfo.referrer_tier)}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <a
                    href={`/register${referralCode ? `?ref=${referralCode}` : ''}`}
                    className="rounded-lg bg-primary px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/90 shadow-lg"
                  >
                    Get Started
                  </a>
                  <a
                    href="#about"
                    className="inline-block rounded-lg bg-white/20 backdrop-blur-md px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-white/30 border border-white/30"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Keep SVG backgrounds hidden - video is primary background */}
        <div className="absolute right-0 top-0 z-[-3] opacity-0">
          <svg width="450" height="556" viewBox="0 0 450 556" fill="none">
            <circle cx="277" cy="63" r="225" fill="url(#paint0_linear_25:217)" />
            <circle cx="17.9997" cy="182" r="18" fill="url(#paint1_radial_25:217)" />
            <circle cx="76.9997" cy="288" r="34" fill="url(#paint2_radial_25:217)" />
            <circle cx="325.486" cy="302.87" r="180" transform="rotate(-37.6852 325.486 302.87)" fill="url(#paint3_linear_25:217)" />
            <circle opacity="0.8" cx="184.521" cy="315.521" r="132.862" transform="rotate(114.874 184.521 315.521)" stroke="url(#paint4_linear_25:217)" />
            <circle opacity="0.8" cx="356" cy="290" r="179.5" transform="rotate(-30 356 290)" stroke="url(#paint5_linear_25:217)" />
            <circle opacity="0.8" cx="191.659" cy="302.659" r="133.362" transform="rotate(133.319 191.659 302.659)" fill="url(#paint6_linear_25:217)" />
            <defs>
              <linearGradient id="paint0_linear_25:217" x1="-54.5003" y1="-178" x2="222" y2="288" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="paint1_radial_25:217" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(17.9997 182) rotate(90) scale(18)">
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient id="paint2_radial_25:217" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(76.9997 288) rotate(90) scale(34)">
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <linearGradient id="paint3_linear_25:217" x1="226.775" y1="-66.1548" x2="292.157" y2="351.421" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="paint4_linear_25:217" x1="184.521" y1="182.159" x2="184.521" y2="448.882" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="paint5_linear_25:217" x1="356" y1="110" x2="356" y2="470" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="paint6_linear_25:217" x1="118.524" y1="29.2497" x2="166.965" y2="338.63" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Keep SVG backgrounds hidden - video is primary background */}
        <div className="absolute bottom-0 left-0 z-[-3] opacity-0">
          <svg width="364" height="201" viewBox="0 0 364 201" fill="none">
            <path d="M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24" stroke="url(#paint0_linear_25:218)" />
            <path d="M-22.1107 72.3303C5.65989 66.4798 73.3965 64.9086 122.178 105.427C183.155 156.076 201.59 162.093 236.333 166.607C271.076 171.12 309.718 183.657 334.889 212.24" stroke="url(#paint1_linear_25:218)" />
            <path d="M-53.1107 72.3303C-25.3401 66.4798 42.3965 64.9086 91.1783 105.427C152.155 156.076 170.59 162.093 205.333 166.607C240.076 171.12 278.718 183.657 303.889 212.24" stroke="url(#paint2_linear_25:218)" />
            <path d="M-98.1618 65.0889C-68.1416 60.0601 4.73364 60.4882 56.0734 102.431C120.248 154.86 139.905 161.419 177.137 166.956C214.37 172.493 255.575 186.165 281.856 215.481" stroke="url(#paint3_linear_25:218)" />
            <circle opacity="0.8" cx="214.505" cy="60.5054" r="49.7205" transform="rotate(-13.421 214.505 60.5054)" stroke="url(#paint4_linear_25:218)" />
            <circle cx="220" cy="63" r="43" fill="url(#paint5_radial_25:218)" />
            <defs>
              <linearGradient id="paint0_linear_25:218" x1="184.389" y1="69.2405" x2="184.389" y2="212.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient id="paint1_linear_25:218" x1="156.389" y1="69.2405" x2="156.389" y2="212.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient id="paint2_linear_25:218" x1="125.389" y1="69.2405" x2="125.389" y2="212.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient id="paint3_linear_25:218" x1="93.8507" y1="67.2674" x2="89.9278" y2="210.214" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient id="paint4_linear_25:218" x1="214.505" y1="10.2849" x2="212.684" y2="99.5816" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="paint5_radial_25:218" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(220 63) rotate(90) scale(43)">
                <stop offset="0.145833" stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" stopOpacity="0.08" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50 dark:bg-bg-color-dark transition-colors duration-300" id="about">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              Innovate Your Network Marketing
            </h2>
            <p className="text-lg text-body-color dark:text-body-color-dark max-w-4xl mx-auto leading-relaxed">
              Network marketing isn't easy - building a thriving downline, chasing referrals, and securing steady income takes work. 
              If you're a network marketer with a growing network, Proleads Network is your edge. We deliver high quality, 
              blockchain-verified leads straight to you, so you can focus on growing your empire. Our exclusive tools and 
              done-for-you system make it simple to unlock predictable results and new ways to earn. Every network marketer 
              needs fresh leads - and Proleads Network delivers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">Predictable Results</h3>
              <p className="text-body-color dark:text-body-color-dark">
                No more wasting time on lead generation. Our service delivers fresh leads directly to your members area 
                every week, so you can focus on closing deals and building your team. With our proven system, you'll 
                connect with prospects ready to act, driving steady growth for your business.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">A New Idea</h3>
              <p className="text-body-color dark:text-body-color-dark">
                Proleads Network redefines lead generation. Get a consistent supply of high quality leads to fuel your network, 
                plus earn passive income by sharing the system. Refer just 4 new members, and their commissions can cover 
                your entire membership cost - making your growth practically free.
              </p>
              <a href="/affiliates" className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block">
                Explore Our Affiliate Program →
              </a>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">Exponential Growth</h3>
              <p className="text-body-color dark:text-body-color-dark">
                Our subscription model fuels your growth. Weekly leads keep your pipeline full and your downline thriving. 
                With Proleads Network, you're not just maintaining momentum - you're unlocking the potential to grow faster and smarter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Path Section */}
      <section className="py-16 bg-white dark:bg-gray-dark transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-full rounded-lg overflow-hidden shadow-lg">
                <video 
                  className="w-full h-auto"
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                >
                  <source 
                    src="https://customer-assets.emergentagent.com/job_membership-tier/artifacts/jrak2gxc_path-to-success.mp4" 
                    type="video/mp4" 
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-black dark:text-white mb-6">Your Path to Success</h3>
              <p className="text-body-color dark:text-body-color-dark leading-relaxed mb-6">
                Why Proleads Network? It's built for network marketers who demand results without the hassle. Our done-for-you 
                system delivers the leads you need - verified and ready to engage so you save time and connect with prospects 
                who matter. Perfect for those with established networks or those just starting out, our tools make growth effortless. 
                Plus, refer just 4 members, and your membership could be free through our{' '}
                <a href="/affiliates" className="text-blue-600 hover:text-blue-800 font-medium">affiliate program</a>. 
                With instant payouts and generous bonuses, Proleads Network is your path to predictable success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-bg-color-dark transition-colors duration-300">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-black dark:text-white mb-16">Your Leadgen Partner</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-12">
              <div className="flex space-x-6">
                <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3">Empowering Your Business Growth</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Proleads Network takes your network marketing to the next level by handling lead generation for you. 
                    Your leads arrive weekly, complete with verified information, so you can focus on building relationships 
                    and expanding your team. Designed for marketers like you, our system turns your existing reach into unstoppable momentum.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-6">
                <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3">Cost-Effective Lead Generation</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Why spend big on outdated lead sources? Proleads Network delivers quality leads every week at a fraction 
                    of the cost. With no long-term contracts, it's the smartest way to connect with prospects ready to join 
                    or buy, helping you grow your business without breaking the bank.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-12">
              <div className="flex space-x-6">
                <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3">Maximizing ROI with Targeted Leads</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Our leads are built for results. Each one is fresh, verified, and primed for network marketing, 
                    boosting your chances of turning prospects into customers or team members. By prioritizing quality, 
                    we help you maximize your return on investment with every subscription.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-6">
                <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3">Maximize Your Earnings Potential</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Proleads Network isn't just about growth — it's about income. Every member becomes an{' '}
                    <a href="/affiliates" className="text-blue-600 hover:text-blue-800 font-medium">affiliate</a>, 
                    earning up to 30% recurring commissions on referrals, plus bonuses up to four tiers deep. 
                    Refer just 4 members, and their payouts can cover your membership cost. It's passive income designed for network marketers ready to profit from their network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Tiers Section */}
      <EnhancedMembershipTiers tiers={membershipTiers} referralCode={referralCode} loading={loading} />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="relative py-16 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/network-connection-bg.jpg" 
            alt="Network background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-indigo-900/90"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to turn your network into a paycheck?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Pick your membership level and begin building your income today.
          </p>
          <a 
            href={`/register${referralCode ? `?ref=${referralCode}` : ''}`}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl inline-block"
          >
            Join Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Login Button Component for Landing Page
function LoginButton() {
  const { user } = useAuth();

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

  return (
    <a 
      href="/"
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 inline-block"
    >
      Login
    </a>
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
        const response = await axios.get(`${API_URL}/membership/tiers`);
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
      const response = await axios.post(`${API_URL}/payments/create`, {
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
                <p className="text-body-color dark:text-body-color-dark text-xs mt-1">
                  Tier: {referrerInfo.referrer_tier.toUpperCase()}
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

// Dashboard Component
function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [affiliateMenuOpen, setAffiliateMenuOpen] = useState(false);
  const [accountSubTab, setAccountSubTab] = useState('settings');
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [bellButtonRef, setBellButtonRef] = useState(null);
  const [selectedNotificationForView, setSelectedNotificationForView] = useState(null);
  const [showNotificationViewModal, setShowNotificationViewModal] = useState(false);
  
  // KYC Modal state
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchNotifications();
    checkKYCStatus();
    
    // Auto-refresh notifications every 30 seconds
    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(notificationInterval);
  }, []);

  const checkKYCStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycStatus(response.data);
      
      // Show modal if user has earned $50+ and is unverified
      if (response.data.earnings_capped && response.data.kyc_status === 'unverified') {
        setShowKYCModal(true);
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error);
    }
  };

  // Click outside handling is now managed by NotificationPanel component

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch recent notifications for bell icon (show last 10)
      const response = await axios.get(`${API_URL}/users/notifications?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const clearNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      // Find notification to check if it was unread
      const notification = notifications.find(n => n.notification_id === notificationId);
      const wasUnread = notification && !notification.read;
      
      // Mark as read in backend
      await axios.put(`${API_URL}/users/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.notification_id === notificationId ? { ...n, read: true } : n
      ));
      
      // Decrease unread count if notification was unread
      if (wasUnread) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      alert('Failed to update notification');
    }
  };

  const viewNotification = async (notification) => {
    // Mark as read when viewing
    if (!notification.read) {
      await clearNotification(notification.notification_id);
    }
    // Close notification panel and open modal
    setNotificationsPanelOpen(false);
    setSelectedNotificationForView(notification);
    setShowNotificationViewModal(true);
  };

  const markAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users/notifications/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read_status: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
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
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-white">Proleads Network</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-300">Welcome back</p>
                <p className="text-white font-medium">{user?.username}</p>
              </div>
              
              {/* Notification Bell */}
              <div className="relative notification-panel">
                <button
                  ref={setBellButtonRef}
                  onClick={() => {
                    setNotificationsPanelOpen(!notificationsPanelOpen);
                  }}
                  className="relative p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Notification Panel Portal */}
              {notificationsPanelOpen && bellButtonRef && (
                <NotificationPanel
                  bellButtonRef={bellButtonRef}
                  notifications={notifications}
                  onClose={() => setNotificationsPanelOpen(false)}
                  onClearNotification={clearNotification}
                  onViewNotification={viewNotification}
                  setActiveTab={setActiveTab}
                />
              )}
              
              {/* Notification View Slide-Out Panel (Header Bell) */}
              {showNotificationViewModal && selectedNotificationForView && ReactDOM.createPortal(
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                    style={{ zIndex: 1000 }}
                    onClick={() => {
                      setShowNotificationViewModal(false);
                      setSelectedNotificationForView(null);
                    }}
                  />
                  
                  {/* Slide-out Panel */}
                  <div 
                    className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col"
                    style={{ zIndex: 1001 }}
                  >
                    {/* Panel Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-white">Notification</h2>
                          <p className="text-blue-100 text-sm mt-1">
                            {new Date(selectedNotificationForView.created_at).toLocaleDateString()} {new Date(selectedNotificationForView.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowNotificationViewModal(false);
                            setSelectedNotificationForView(null);
                          }}
                          className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Panel Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-4">{selectedNotificationForView.subject}</h3>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-4">
                          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {selectedNotificationForView.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>,
                document.body
              )}
              
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
          {activeTab === 'overview' && <OverviewTab stats={stats} user={user} onNavigateToKYC={() => {
            setActiveTab('account');
            setAccountSubTab('kyc');
          }} />}
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

      {/* KYC Warning Modal */}
      {showKYCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-yellow-500 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full mb-4">
                <AlertTriangle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">KYC Verification Required</h2>
              <p className="text-gray-300">You've reached the $50 earning limit for unverified accounts</p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Current Earnings:</span>
                <span className="text-white font-bold">${kycStatus?.total_earnings?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Earning Limit:</span>
                <span className="text-yellow-400 font-bold">$50.00</span>
              </div>
            </div>

            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 border-opacity-30 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">
                <strong>Action Required:</strong> Complete KYC verification to continue earning commissions. Your funds will be held until verification is complete.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowKYCModal(false);
                  setActiveTab('account');
                  setAccountSubTab('kyc');
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Shield className="h-5 w-5" />
                <span>Complete KYC Now</span>
              </button>
              <button
                onClick={() => setShowKYCModal(false)}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Notification Panel Component (using Portal)
function NotificationPanel({ bellButtonRef, notifications, onClose, onClearNotification, onViewNotification, setActiveTab }) {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (bellButtonRef) {
      const rect = bellButtonRef.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px gap below the button
        right: window.innerWidth - rect.right, // Align to right edge of button
      });
    }
  }, [bellButtonRef]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div 
      className="notification-dropdown fixed w-80 bg-gray-900 rounded-xl shadow-xl border border-gray-700"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 9999
      }}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.notification_id}
              className={`p-4 border-b border-gray-700 last:border-b-0 cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors ${
                !notification.read ? 'bg-blue-900 bg-opacity-20' : ''
              }`}
              onClick={() => onViewNotification(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {notification.type === 'new_referral' && <Users className="h-4 w-4 text-blue-500" />}
                    {notification.type === 'commission_payout' && <DollarSign className="h-4 w-4 text-green-500" />}
                    {notification.type === 'lead_distribution' && <Gift className="h-4 w-4 text-purple-500" />}
                    {notification.type === 'payment_confirmation' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {notification.type === 'referral_upgrade' && <TrendingUp className="h-4 w-4 text-yellow-500" />}
                    {notification.type === 'subscription_reminder' && <Clock className="h-4 w-4 text-orange-500" />}
                    <h4 className="text-sm font-medium text-white">{notification.subject}</h4>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{notification.body}</p>
                  {notification.type === 'ticket' && (
                    <button
                      onClick={() => {
                        onClose(); // Close notification panel
                        // Navigate to tickets tab
                        setActiveTab('tickets');
                      }}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      View Message →
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => onClearNotification(notification.notification_id)}
                  className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
// Admin Notification Panel Component (using Portal)
function AdminNotificationPanel({ bellButtonRef, notifications, onClose, onClearNotification, onViewNotification }) {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (bellButtonRef) {
      const rect = bellButtonRef.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px gap below the button
        right: window.innerWidth - rect.right, // Align to right edge of button
      });
    }
  }, [bellButtonRef]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.admin-notification-dropdown')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div 
      className="admin-notification-dropdown fixed w-80 bg-gray-900 rounded-xl shadow-xl border border-gray-700"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 9999
      }}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Admin Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No admin notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.notification_id}
              className={`p-4 border-b border-gray-700 last:border-b-0 ${
                !notification.read ? 'bg-blue-900 bg-opacity-20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {notification.type === 'payment' && <DollarSign className="h-4 w-4 text-green-500" />}
                    {notification.type === 'payment_confirmation' && <DollarSign className="h-4 w-4 text-green-500" />}
                    {notification.type === 'milestone' && <Award className="h-4 w-4 text-yellow-500" />}
                    {notification.type === 'kyc' && <Shield className="h-4 w-4 text-purple-500" />}
                    {notification.type === 'lead_distribution' && <Gift className="h-4 w-4 text-purple-500" />}
                    <h4 className="text-sm font-medium text-white">{notification.title || notification.subject}</h4>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{notification.message || notification.body}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => onClearNotification(notification.notification_id)}
                  className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

// Dashboard Tab Components
// KYC Stats Row Component
function KYCStatsRow({ stats, user, onNavigateToKYC }) {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/users/kyc/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKycStatus(response.data);
      } catch (error) {
        console.error('Failed to fetch KYC status:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKYCStatus();
  }, []);

  const isVerified = kycStatus?.kyc_status === 'verified';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${isVerified ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-8`}>
      <StatCard
        icon={<DollarSign className="h-8 w-8 text-green-400" />}
        title="Total Earnings"
        value={`$${stats?.total_earnings?.toFixed(2) || '0.00'} USDC`}
        subtitle="Completed payments"
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
        value={getTierDisplayName(user?.membership_tier || 'affiliate').toUpperCase()}
        subtitle={(() => {
          const tier = user?.membership_tier;
          if (tier === 'affiliate' || tier === 'vip_affiliate') return 'Free';
          if (tier === 'test') return '$2/month';
          if (tier === 'bronze') return '$20/month';
          if (tier === 'silver') return '$50/month';
          if (tier === 'gold') return '$100/month';
          return 'Free';
        })()}
        action={
          <button
            onClick={() => window.location.href = '/payment'}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-300"
          >
            Upgrade
          </button>
        }
      />
      {isVerified && !loading && (
        <StatCard
          icon={<Shield className="h-8 w-8 text-green-400" />}
          title="KYC Status"
          value={
            <span className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <span>Verified</span>
            </span>
          }
          subtitle="Unlimited earnings"
        />
      )}
    </div>
  );
}

function OverviewTab({ stats, user, onNavigateToKYC }) {
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
      <KYCStatsRow stats={stats} user={user} onNavigateToKYC={onNavigateToKYC} />

      {/* KYC Earnings Card - Full Width for Unverified Users */}
      <KYCEarningsCard user={user} onNavigateToKYC={onNavigateToKYC} />

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

// KYC Earnings Card Component
function KYCEarningsCard({ user, onNavigateToKYC }) {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  // Don't render for verified users (they have the StatCard instead)
  const isVerified = kycStatus?.kyc_status === 'verified';
  if (isVerified) return null;

  const earningLimit = 50.0;
  const displayEarnings = Math.min(kycStatus?.total_earnings || 0, earningLimit);

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 mb-8 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">KYC Earnings Status</h3>
            <p className="text-blue-100 text-sm">Your commission earning capacity</p>
          </div>
        </div>
        <span className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Unverified</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
          <p className="text-blue-100 text-sm mb-1">Current Earnings</p>
          <p className="text-3xl font-bold text-white">${displayEarnings?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
          <p className="text-blue-100 text-sm mb-1">Earning Limit</p>
          <p className="text-3xl font-bold text-white">${earningLimit.toFixed(2)}</p>
        </div>
      </div>

      {!isVerified && (
        <div className="mt-4 flex items-center justify-between bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-white" />
            <div>
              <p className="text-white font-medium">Complete KYC to unlock unlimited earnings</p>
              <p className="text-blue-100 text-sm">Verify your identity in just a few minutes</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateToKYC) {
                onNavigateToKYC();
              }
            }}
            className="px-6 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-all duration-300 flex items-center space-x-2"
          >
            <span>Verify Now</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {kycStatus?.earnings_capped && (
        <div className="mt-4 p-4 bg-red-500 bg-opacity-90 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-white mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-bold">Earning Limit Reached!</p>
              <p className="text-white text-sm mt-1">
                You've reached the $50 earning limit for unverified accounts. Complete KYC verification now to continue earning commissions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NetworkTreeTab() {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depth, setDepth] = useState(3);
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    fetchNetworkTree();
  }, [depth]);

  const fetchNetworkTree = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/network-tree?depth=${depth}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNetworkData(response.data);
      
      // Transform API data to react-d3-tree format
      if (response.data?.network_tree) {
        const transformedData = transformToTreeData(response.data.network_tree);
        setTreeData(transformedData);
      }
    } catch (error) {
      console.error('Failed to fetch network tree:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform API data structure to react-d3-tree format
  const transformToTreeData = (apiNode) => {
    const transformNode = (node) => {
      const status = node.suspended ? 'Suspended' : 'Active';
      const tierDisplay = getTierDisplayName(node.membership_tier);
      
      return {
        name: node.username || 'Unknown User',
        attributes: {
          membership_tier: tierDisplay,
          status: status,
          total_referrals: node.total_referrals || 0,
          is_root: false
        },
        children: node.children ? node.children.map(transformNode) : []
      };
    };

    // Create root node (current user)
    // Use network stats direct_referrals if root total_referrals is 0 or missing
    const rootReferrals = apiNode.root.total_referrals || 
                         (networkData?.network_stats?.direct_referrals) || 0;
                         
    const rootNode = {
      name: apiNode.root.username,
      attributes: {
        membership_tier: getTierDisplayName(apiNode.root.membership_tier),
        status: 'Active',
        total_referrals: rootReferrals,
        is_root: true
      },
      children: apiNode.children ? apiNode.children.map(transformNode) : []
    };

    return [rootNode];
  };

  // Custom node label component
  const CustomNodeLabel = ({ nodeData, toggleNode }) => {
    const isRoot = nodeData.attributes?.is_root;
    const tier = nodeData.attributes?.membership_tier || 'Unknown';
    const status = nodeData.attributes?.status || 'Unknown';
    const referrals = nodeData.attributes?.total_referrals || 0;
    
    // Get tier border color (actual metallic colors)
    const getTierBorderColor = (tier) => {
      switch (tier?.toLowerCase()) {
        case 'gold': return '#FFD700';  // Gold
        case 'silver': return '#C0C0C0';  // Silver
        case 'bronze': return '#CD7F32';  // Bronze
        case 'test': return '#10B981';
        case 'vip affiliate': return '#A855F7';
        case 'affiliate':
        default: return '#3B82F6';  // Blue
      }
    };

    // Get tier badge color
    const getTierBadgeColor = (tier) => {
      switch (tier?.toLowerCase()) {
        case 'gold': return '#F59E0B';
        case 'silver': return '#6B7280';  
        case 'bronze': return '#EA580C';
        case 'test': return '#059669';
        case 'vip affiliate': return '#7C3AED';
        case 'affiliate':
        default: return '#2563EB';
      }
    };

    const borderColor = getTierBorderColor(tier);
    const badgeColor = getTierBadgeColor(tier);
    const statusColor = status === 'Active' ? '#059669' : '#DC2626';

    return (
      <div
        onClick={toggleNode}
        style={{
          background: isRoot 
            ? 'linear-gradient(135deg, #1E40AF 0%, #3730A3 100%)' 
            : 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
          border: `3px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '14px',
          width: '240px',
          height: '140px',
          boxShadow: isRoot 
            ? '0 4px 15px rgba(59, 130, 246, 0.2)' 
            : '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          color: 'white',
          fontSize: '12px',
          textAlign: 'center',
          position: 'relative',
          backdropFilter: isRoot ? 'none' : 'blur(10px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Top Section - Username */}
        <div style={{
          fontWeight: 'bold',
          fontSize: '15px',
          color: '#FFFFFF',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          marginBottom: '8px'
        }}>
          {isRoot ? nodeData.name : nodeData.name}
        </div>

        {/* Middle Section - Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '8px',
          flexWrap: 'wrap'
        }}>
          {/* Membership Tier Badge */}
          <div style={{
            background: `linear-gradient(135deg, ${badgeColor} 0%, ${badgeColor}CC 100%)`,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            letterSpacing: '0.5px'
          }}>
            {tier}
          </div>

          {/* Status Badge */}
          <div style={{
            background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '10px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {status}
          </div>
        </div>

        {/* Bottom Section - Referrals Count */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '6px 10px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#E5E7EB',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{ color: '#F3F4F6', fontSize: '10px', marginBottom: '1px' }}>
            Referrals
          </div>
          <div style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold' }}>
            {referrals}
          </div>
        </div>

        {/* Root indicator for "YOU" */}
        {isRoot && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '-6px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: 'white',
            padding: '3px 7px',
            borderRadius: '10px',
            fontSize: '9px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
            letterSpacing: '0.5px',
            zIndex: 10
          }}>
            YOU
          </div>
        )}

        {/* Expandable indicator */}
        {nodeData.children && nodeData.children.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            padding: '4px',
            borderRadius: '50%',
            fontSize: '10px',
            fontWeight: 'bold',
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {nodeData.__rd3t?.collapsed ? '+' : '−'}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Interactive Network Genealogy</h3>
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
        
        {/* Instructions */}
        <div className="text-gray-300 text-sm mb-4">
          💡 <strong>Tips:</strong> Click on any node to expand/collapse their downline. Drag to pan around the tree. Use mouse wheel to zoom in/out.
        </div>
        
        {networkData?.network_stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Interactive Network Tree */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white border-opacity-10">
          <h4 className="text-lg font-bold text-white">Your Network Tree</h4>
        </div>
        
        {treeData && treeData.length > 0 ? (
          <div style={{ width: '100%', height: '700px', background: '#111827' }}>
            <Tree
              data={treeData}
              orientation="vertical"
              pathFunc="step"
              translate={{ x: 400, y: 150 }}
              separation={{ siblings: 1.2, nonSiblings: 1.5 }}
              nodeSize={{ x: 280, y: 220 }}
              allowForeignObjects
              pathClassFunc={() => 'custom-tree-link'}
              renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
                <g>
                  <foreignObject
                    width="260"
                    height="200"
                    x="-130"
                    y="-60"
                    onClick={toggleNode}
                    style={{ cursor: 'pointer', overflow: 'visible' }}
                  >
                    <CustomNodeLabel nodeData={nodeDatum} toggleNode={toggleNode} />
                  </foreignObject>
                </g>
              )}
              nodeSvgShape={{
                shape: 'circle',
                shapeProps: {
                  r: 0,
                  fill: 'transparent'
                }
              }}
              initialDepth={depth > 3 ? 2 : depth}
              collapsible={true}
              zoom={0.8}
              enableLegacyTransitions={true}
              transitionDuration={500}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <Network className="h-16 w-16 text-gray-400 mx-auto" />
            </div>
            <p className="text-gray-400 text-lg">No referrals yet</p>
            <p className="text-gray-500 text-sm mt-2">Share your referral link to build your network tree!</p>
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

      const response = await axios.get(`${API_URL}/users/earnings?${params}`, {
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

      const response = await axios.get(`${API_URL}/users/earnings/export?${params}`, {
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
                        <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-medium mt-1 ${getTierBadgeClass(earning.new_member_tier)}`}>
                          {getTierDisplayName(earning.new_member_tier)}
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

      const response = await axios.get(`${API_URL}/users/payments?${params}`, {
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

      const response = await axios.get(`${API_URL}/users/payments/export?${params}`, {
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
                      <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-medium ${getTierBadgeClass(payment.tier)}`}>
                        {getTierDisplayName(payment.tier)}
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
      const response = await axios.get(`${API_URL}/users/milestones`, {
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
      const response = await axios.put(`${API_URL}/users/profile`, updateData, {
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
      await axios.delete(`${API_URL}/users/cancel-account`, {
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
  const [stats, setStats] = useState({
    total_referrals: 0,
    active_referrals: 0,
    tier_counts: {},
    total_sub_referrals: 0
  });
  const limit = 10;

  useEffect(() => {
    fetchReferrals();
  }, [currentPage]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/referrals?page=${currentPage}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReferrals(response.data.referrals || []);
      setTotalReferrals(response.data.total_count || 0);
      setTotalPages(response.data.total_pages || 1);
      setStats(response.data.stats || {
        total_referrals: 0,
        active_referrals: 0,
        tier_counts: {},
        total_sub_referrals: 0
      });
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
              <div className="text-2xl font-bold text-white">{stats.total_referrals}</div>
              <div className="text-gray-300 text-sm">Total Referrals</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.active_referrals}
              </div>
              <div className="text-gray-300 text-sm">Active</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {stats.tier_counts?.bronze || 0}
              </div>
              <div className="text-gray-300 text-sm">Bronze Members</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats.total_sub_referrals}
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
                          {getTierDisplayName(referral.membership_tier)}
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
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'view'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    page: 1
  });

  // Form states
  const [createForm, setCreateForm] = useState({
    contact_type: 'admin',
    recipient_address: '',
    category: 'general',
    priority: 'medium',
    subject: '',
    message: ''
  });
  
  const [replyMessage, setReplyMessage] = useState('');
  const [downlineContacts, setDownlineContacts] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTickets();
    if (createForm.contact_type === 'downline_individual') {
      fetchDownlineContacts();
    }
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '10'
      });
      
      if (filters.status) params.append('status_filter', filters.status);
      if (filters.category) params.append('category_filter', filters.category);

      const response = await axios.get(
        `${API_URL}/tickets/user?${params}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      alert('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDownlineContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/tickets/downline-contacts`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setDownlineContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(
          `${API_URL}/tickets/upload-attachment`,
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        setAttachments(prev => [...prev, {
          id: response.data.attachment_id,
          filename: response.data.filename,
          size: response.data.file_size
        }]);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const createTicket = async () => {
    try {
      if (!createForm.subject.trim() || !createForm.message.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add form data
      formData.append('contact_type', createForm.contact_type);
      formData.append('category', createForm.category);
      formData.append('priority', createForm.priority);
      formData.append('subject', createForm.subject);
      formData.append('message', createForm.message);
      
      if (createForm.recipient_address) {
        formData.append('recipient_address', createForm.recipient_address);
      }
      
      if (attachments.length > 0) {
        formData.append('attachment_ids', JSON.stringify(attachments.map(a => a.id)));
      }

      await axios.post(
        `${API_URL}/tickets/create`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert('Ticket created successfully!');
      
      // Reset form
      setCreateForm({
        contact_type: 'admin',
        recipient_address: '',
        category: 'general',
        priority: 'medium',
        subject: '',
        message: ''
      });
      setAttachments([]);
      setActiveView('list');
      fetchTickets();
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setSelectedTicket(response.data);
      setActiveView('view');
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      alert('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const replyToTicket = async () => {
    if (!replyMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('message', replyMessage);
      
      if (attachments.length > 0) {
        formData.append('attachment_ids', JSON.stringify(attachments.map(a => a.id)));
      }

      await axios.post(
        `${API_URL}/tickets/${selectedTicket.ticket.ticket_id}/reply`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setReplyMessage('');
      setAttachments([]);
      fetchTicketDetails(selectedTicket.ticket.ticket_id);
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    }
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Ticket deleted successfully');
      fetchTickets();
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Failed to delete ticket. Only closed tickets can be deleted.');
    }
  };

  const openAttachmentModal = async (url, filename) => {
    try {
      const token = localStorage.getItem('token');
      // Handle URLs that might already have /api prefix
      const attachmentUrl = url.startsWith('/api/') ? `${BACKEND_URL}${url}` : `${API_URL}${url}`;
      const response = await fetch(attachmentUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load attachment');
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const contentType = response.headers.get('content-type') || '';
      
      // Open in new window with the blob URL
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>${filename || 'Attachment'}</title>
            <style>
              body { 
                margin: 0; padding: 20px; font-family: Arial, sans-serif; 
                background: #f5f5f5; text-align: center;
              }
              .container { max-width: 100%; }
              .header { 
                background: white; padding: 15px; margin-bottom: 20px; 
                border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .content { 
                background: white; padding: 20px; border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-height: 70vh;
              }
              .download-btn { 
                background: #3b82f6; color: white; padding: 10px 20px; 
                border: none; border-radius: 4px; cursor: pointer; margin: 5px;
                text-decoration: none; display: inline-block;
              }
              .download-btn:hover { background: #2563eb; }
              .close-btn { background: #6b7280; }
              .close-btn:hover { background: #4b5563; }
              img { max-width: 100%; height: auto; }
              iframe { width: 100%; height: 70vh; border: none; }
              .file-info { color: #6b7280; font-size: 14px; margin-bottom: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0 0 10px 0;">${filename || 'Attachment'}</h2>
                <div class="file-info">Type: ${contentType}</div>
                <a href="${fileUrl}" download="${filename || 'attachment'}" class="download-btn">
                  📥 Download
                </a>
                <button onclick="window.close()" class="download-btn close-btn">
                  ❌ Close
                </button>
              </div>
              <div class="content">
                ${contentType.startsWith('image/') ? 
                  `<img src="${fileUrl}" alt="${filename}" />` :
                  contentType === 'application/pdf' ?
                  `<iframe src="${fileUrl}" type="application/pdf"></iframe>` :
                  contentType.startsWith('text/') ?
                  `<iframe src="${fileUrl}"></iframe>` :
                  `<div style="padding: 40px;">
                     <h3>Preview not available for this file type</h3>
                     <p>Click the download button above to save the file.</p>
                   </div>`
                }
              </div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 60000); // Clean up after 1 minute
      
    } catch (error) {
      console.error('Failed to open attachment:', error);
      alert('Failed to open attachment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-600 text-blue-100';
      case 'in_progress': return 'bg-yellow-600 text-yellow-100';
      case 'closed': return 'bg-gray-600 text-gray-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-red-100';
      case 'medium': return 'bg-orange-600 text-orange-100';
      case 'low': return 'bg-green-600 text-green-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Tickets</span>
          </button>
          <h2 className="text-2xl font-bold text-white">Create New Ticket</h2>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contact Type */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Contact Type *</label>
              <select
                value={createForm.contact_type}
                onChange={(e) => {
                  setCreateForm({...createForm, contact_type: e.target.value, recipient_address: ''});
                  if (e.target.value === 'downline_individual') {
                    fetchDownlineContacts();
                  }
                }}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              >
                <option value="admin">Contact Admin</option>
                <option value="sponsor">Contact Sponsor</option>
                <option value="downline_individual">Contact Individual Downline</option>
                <option value="downline_mass">Message All Downlines</option>
              </select>
            </div>

            {/* Recipient Selection for Individual Downline */}
            {createForm.contact_type === 'downline_individual' && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">Select Recipient *</label>
                <select
                  value={createForm.recipient_address}
                  onChange={(e) => setCreateForm({...createForm, recipient_address: e.target.value})}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select a downline member</option>
                  {downlineContacts.map(contact => (
                    <option key={contact.address} value={contact.address}>
                      {contact.username} ({contact.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Category *</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({...createForm, category: e.target.value})}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              >
                <option value="general">General</option>
                <option value="billing">Billing</option>
                <option value="leads">Leads</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Priority</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({...createForm, priority: e.target.value})}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">Subject *</label>
            <input
              type="text"
              value={createForm.subject}
              onChange={(e) => setCreateForm({...createForm, subject: e.target.value})}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              placeholder="Enter ticket subject"
            />
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">Message *</label>
            <textarea
              value={createForm.message}
              onChange={(e) => setCreateForm({...createForm, message: e.target.value})}
              rows={6}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none"
              placeholder="Describe your issue or message..."
            />
          </div>

          {/* File Attachments */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">Attachments</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">
                <Paperclip className="h-4 w-4" />
                <span>Choose Files</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                />
              </label>
              {uploading && <span className="text-yellow-400">Uploading...</span>}
            </div>
            
            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <span className="text-gray-300">{attachment.filename}</span>
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              onClick={createTicket}
              disabled={!createForm.subject || !createForm.message}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send Ticket</span>
            </button>
            <button
              onClick={() => setActiveView('list')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'view' && selectedTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Tickets</span>
          </button>
          <h2 className="text-2xl font-bold text-white">Ticket Details</h2>
        </div>

        {/* Ticket Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedTicket.ticket.subject}</h3>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-medium ${getStatusColor(selectedTicket.ticket.status)}`}>
                  {selectedTicket.ticket.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-medium ${getPriorityColor(selectedTicket.ticket.priority)}`}>
                  {selectedTicket.ticket.priority}
                </span>
                <span className="text-gray-400 text-sm">
                  {selectedTicket.ticket.category.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right text-gray-400 text-sm">
              <p>Created: {new Date(selectedTicket.ticket.created_at).toLocaleString()}</p>
              <p>Updated: {new Date(selectedTicket.ticket.updated_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">From: </span>
              <span className="text-white">{selectedTicket.ticket.sender_username}</span>
            </div>
            <div>
              <span className="text-gray-400">To: </span>
              <span className="text-white">
                {selectedTicket.ticket.recipient_username || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4">Conversation</h4>
          
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {selectedTicket.messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.sender_role === 'admin' 
                    ? 'bg-red-600 bg-opacity-20 border-l-4 border-red-400' 
                    : 'bg-blue-600 bg-opacity-20 border-l-4 border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">
                      {message.sender_username}
                    </span>
                    {message.sender_role === 'admin' && (
                      <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-xs">Admin</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{message.message}</p>
                
                {/* Attachments */}
                {message.attachment_urls && message.attachment_urls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachment_urls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => openAttachmentModal(url, `attachment-${i + 1}`)}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 cursor-pointer"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>View Attachment {i + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reply Section */}
          {selectedTicket.ticket.status !== 'closed' && (
            <div className="border-t border-gray-600 pt-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none mb-4"
                placeholder="Type your reply..."
              />
              
              {/* Reply Attachments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded cursor-pointer">
                    <Paperclip className="h-4 w-4" />
                    <span>Attach</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                    />
                  </label>
                  {uploading && <span className="text-yellow-400">Uploading...</span>}
                </div>
                
                <button
                  onClick={replyToTicket}
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Reply</span>
                </button>
              </div>
              
              {/* Reply Attachment List */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                      <span className="text-gray-300 text-sm">{attachment.filename}</span>
                      <button
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchTickets()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Circle className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActiveView('create')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="leads">Leads</option>
              <option value="technical">Technical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tickets Found</h3>
            <p className="text-gray-300 mb-4">You haven't created any tickets yet.</p>
            <button
              onClick={() => setActiveView('create')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-600">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="p-6 hover:bg-white hover:bg-opacity-5 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-white hover:text-blue-300 cursor-pointer"
                          onClick={() => fetchTicketDetails(ticket.ticket_id)}>
                        {ticket.subject}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <span>#{ticket.ticket_id.slice(0, 8)}</span>
                      <span className="capitalize">{ticket.category}</span>
                      <span>
                        {ticket.contact_type === 'admin' ? 'To Admin' : 
                         ticket.contact_type === 'sponsor' ? 'To Sponsor' :
                         ticket.contact_type === 'downline_individual' ? 'To Downline' :
                         ticket.contact_type === 'news' ? 'News Message' :
                         'Mass Message'}
                      </span>
                      {ticket.recipient_username && (
                        <span>→ {ticket.recipient_username}</span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-sm">
                      Updated {new Date(ticket.updated_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {ticket.attachment_count > 0 && (
                      <Paperclip className="h-4 w-4 text-gray-400" />
                    )}
                    
                    {/* View Button */}
                    <button
                      onClick={() => fetchTicketDetails(ticket.ticket_id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    {/* Delete Button - Only for closed tickets */}
                    {ticket.status === 'closed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the row click
                          deleteTicket(ticket.ticket_id);
                        }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-200"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
      {accountSubTab === 'notifications' && <NotificationSettingsTab user={user} />}
      {accountSubTab === 'kyc' && <KYCVerificationTab user={user} />}
      {accountSubTab === 'cancel' && <CancelAccountTab />}
    </div>
  );
}

// Notification Settings Tab Component
function NotificationSettingsTab({ user }) {
  const [preferences, setPreferences] = useState({
    new_referrals: true,
    lead_distribution: true,
    payment_confirmation: true,
    subscription_reminders: true,
    commission_payouts: true,
    referral_upgrade: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Notification history state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPreferences();
    fetchNotifications();
  }, [currentPage]);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(response.data.email_notifications);
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/users/notifications?page=${currentPage}&limit=${itemsPerPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data.notifications);
      setTotalPages(response.data.total_pages);
      setTotalNotifications(response.data.total);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const viewNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/users/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedNotification(response.data);
      setShowNotificationPanel(true);
      // Refresh the notifications list to update read status
      fetchNotifications();
    } catch (error) {
      console.error('Failed to fetch notification details:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggle = async (key) => {
    const newValue = !preferences[key];
    const newPreferences = { ...preferences, [key]: newValue };
    
    // Update UI immediately
    setPreferences(newPreferences);
    
    // Save to backend
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/users/notification-preferences`,
        { [key]: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveMessage('Preferences saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      // Revert on error
      setPreferences(preferences);
      setSaveMessage('Failed to save preferences. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-300 mt-4">Loading preferences...</p>
      </div>
    );
  }

  const notificationTypes = [
    {
      key: 'new_referrals',
      label: 'New Referrals',
      description: 'Get notified when someone signs up using your referral link'
    },
    {
      key: 'lead_distribution',
      label: 'Lead Distribution',
      description: 'Get notified when new leads are distributed to your account'
    },
    {
      key: 'payment_confirmation',
      label: 'Payment Confirmation',
      description: 'Get notified when your payment is confirmed'
    },
    {
      key: 'subscription_reminders',
      label: 'Subscription Reminders',
      description: 'Get reminded 3 days before your subscription renewal'
    },
    {
      key: 'commission_payouts',
      label: 'Commission Payouts',
      description: 'Get notified when your milestone commission is paid'
    },
    {
      key: 'referral_upgrade',
      label: 'Referral Upgrades',
      description: 'Get notified when your referrals upgrade their membership'
    }
  ];

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Email Notification Settings</h3>
          <p className="text-gray-300 text-sm">Manage which email notifications you want to receive</p>
        </div>
        {saveMessage && (
          <div className={`px-4 py-2 rounded-lg ${
            saveMessage.includes('success') ? 'bg-green-600' : 'bg-red-600'
          } text-white text-sm`}>
            {saveMessage}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {notificationTypes.map((type) => (
          <div
            key={type.key}
            className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all duration-300"
          >
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1">{type.label}</h4>
              <p className="text-gray-400 text-sm">{type.description}</p>
            </div>
            <button
              onClick={() => handleToggle(type.key)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                preferences[type.key] ? 'bg-blue-600' : 'bg-gray-600'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-500 border-opacity-30">
        <div className="flex items-start space-x-3">
          <Bell className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-300 text-sm">
              <strong>Note:</strong> Email notifications are currently configured for testing with Ethereal Email.
              After deployment, these will be sent to your registered email address ({user?.email}).
            </p>
          </div>
        </div>
      </div>

      {/* Notification History Section */}
      <div className="mt-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Notification History</h3>
            <p className="text-gray-300 text-sm">View all your past notifications</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotificationPanel(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <Bell className="h-5 w-5" />
              <span className="font-medium">Quick View</span>
            </button>
            {totalNotifications > 0 && (
              <div className="px-4 py-2 bg-blue-600 bg-opacity-30 rounded-lg">
                <span className="text-white text-sm font-medium">{totalNotifications} Total</span>
              </div>
            )}
          </div>
        </div>

        {notificationsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">You'll see your notifications here when you receive them</p>
          </div>
        ) : (
          <>
            {/* Notifications Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white border-opacity-10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Date</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Subject</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Status</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => (
                    <tr 
                      key={notification.notification_id} 
                      className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-300 text-sm">
                        {formatDate(notification.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                          <span className={`text-sm ${notification.read ? 'text-gray-400' : 'text-white font-medium'}`}>
                            {notification.subject}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.read 
                            ? 'bg-gray-600 bg-opacity-50 text-gray-300' 
                            : 'bg-blue-600 bg-opacity-50 text-blue-300'
                        }`}>
                          {notification.read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => viewNotification(notification.notification_id)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white border-opacity-10">
                <div className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Slide-Out Panel */}
      {showNotificationPanel && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            style={{ zIndex: 1000 }}
            onClick={() => {
              setShowNotificationPanel(false);
              setSelectedNotification(null);
            }}
          />
          
          {/* Slide-out Panel */}
          <div 
            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col"
            style={{ zIndex: 1001 }}
          >
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Notifications</h2>
                  <p className="text-blue-100 text-sm mt-1">{totalNotifications} total notifications</p>
                </div>
                <button
                  onClick={() => {
                    setShowNotificationPanel(false);
                    setSelectedNotification(null);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Panel Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {selectedNotification ? (
                /* Notification Detail View */
                <div className="p-6">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>Back to list</span>
                  </button>
                  
                  <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{selectedNotification.subject}</h3>
                      <p className="text-gray-400 text-sm flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(selectedNotification.created_at)}</span>
                      </p>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4">
                      <div className="prose prose-invert max-w-none">
                        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {selectedNotification.body}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Notification List View */
                <div className="p-4 space-y-2">
                  {notificationsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-400 mt-4">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No notifications yet</p>
                      <p className="text-gray-500 text-sm mt-2">You'll see updates here when you receive notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.notification_id}
                        onClick={() => viewNotification(notification.notification_id)}
                        className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-gray-700/50 border ${
                          notification.read ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-900/20 border-blue-700/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {!notification.read && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                              <h4 className="text-white font-medium truncate">{notification.subject}</h4>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">{notification.body}</p>
                            <p className="text-gray-500 text-xs mt-2">{formatDate(notification.created_at)}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-500 ml-2 flex-shrink-0" />
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 pb-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-gray-400 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// KYC Verification Tab Component
function KYCVerificationTab({ user }) {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idDocument, setIdDocument] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [idDocumentFile, setIdDocumentFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, docType) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/users/kyc/upload-document`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (docType === 'id_document') {
        setIdDocument(response.data.file_path);
      } else {
        setSelfie(response.data.file_path);
      }

      return response.data.file_path;
    } catch (error) {
      console.error('Failed to upload document:', error);
      setMessage('Failed to upload document. Please try again.');
      setTimeout(() => setMessage(''), 3000);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitKYC = async () => {
    if (!idDocument || !selfie) {
      setMessage('Please upload both documents before submitting');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/users/kyc/submit`,
        { id_document: idDocument, selfie: selfie },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('KYC submitted successfully! Your documents are under review.');
      setTimeout(() => {
        setMessage('');
        fetchKYCStatus();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit KYC:', error);
      setMessage('Failed to submit KYC. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-300 mt-4">Loading KYC status...</p>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (kycStatus?.kyc_status) {
      case 'verified':
        return <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">✓ Verified</span>;
      case 'pending':
        return <span className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium">⏳ Pending Review</span>;
      case 'rejected':
        return <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">✗ Rejected</span>;
      default:
        return <span className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium">Unverified</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h3 className="text-xl font-semibold text-white">KYC Verification Status</h3>
              <p className="text-gray-400 text-sm">Verify your identity to unlock unlimited earnings</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Earnings</p>
            <p className="text-2xl font-bold text-white">${kycStatus?.total_earnings?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Earning Limit</p>
            <p className="text-2xl font-bold text-white">
              {kycStatus?.earning_limit ? `$${kycStatus.earning_limit.toFixed(2)}` : 'Unlimited'}
            </p>
          </div>
        </div>

        {kycStatus?.earnings_capped && (
          <div className="mt-4 p-4 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-500 border-opacity-30">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-300 text-sm">
                  <strong>Earning Limit Reached!</strong> You've reached the $50 earning limit for unverified accounts. Complete KYC verification to continue earning commissions.
                </p>
              </div>
            </div>
          </div>
        )}

        {kycStatus?.kyc_status === 'rejected' && kycStatus?.kyc_rejection_reason && (
          <div className="mt-4 p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-500 border-opacity-30">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-300 text-sm">
                  <strong>Rejection Reason:</strong> {kycStatus.kyc_rejection_reason}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Form */}
      {(kycStatus?.kyc_status === 'unverified' || kycStatus?.kyc_status === 'rejected') && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Submit KYC Documents</h3>
          
          <div className="space-y-4">
            {/* ID Document Upload */}
            <div>
              <label className="block text-white font-medium mb-2">
                Government-Issued ID Document
                <span className="text-gray-400 text-sm ml-2">(Passport, Driver's License, ID Card)</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setIdDocumentFile(file);
                    handleFileUpload(file, 'id_document');
                  }
                }}
                disabled={uploading}
                className="w-full p-3 bg-white bg-opacity-10 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
              />
              {uploading && idDocumentFile && !idDocument && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <p className="text-blue-400 text-sm">Uploading ID document...</p>
                </div>
              )}
              {idDocument && (
                <p className="text-green-400 text-sm mt-2 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>✓ ID document uploaded successfully</span>
                </p>
              )}
            </div>

            {/* Selfie Upload */}
            <div>
              <label className="block text-white font-medium mb-2">
                Selfie Photo
                <span className="text-gray-400 text-sm ml-2">(Hold your ID next to your face)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelfieFile(file);
                    handleFileUpload(file, 'selfie');
                  }
                }}
                disabled={uploading}
                className="w-full p-3 bg-white bg-opacity-10 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
              />
              {uploading && selfieFile && !selfie && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <p className="text-blue-400 text-sm">Uploading selfie...</p>
                </div>
              )}
              {selfie && (
                <p className="text-green-400 text-sm mt-2 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>✓ Selfie uploaded successfully</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitKYC}
              disabled={!idDocument || !selfie || submitting || uploading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.includes('success') ? 'bg-green-600' : 'bg-red-600'
            } text-white text-sm`}>
              {message}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-500 border-opacity-30">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <strong>Why KYC?</strong> KYC verification helps prevent fraud and ensures compliance with financial regulations. Your documents are securely stored and only reviewed by authorized administrators.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {kycStatus?.kyc_status === 'pending' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
          <Clock className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Verification In Progress</h3>
          <p className="text-gray-300">Your KYC documents are being reviewed. This typically takes 24-48 hours. You'll be notified once the review is complete.</p>
        </div>
      )}

      {kycStatus?.kyc_status === 'verified' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">KYC Verified!</h3>
          <p className="text-gray-300">Congratulations! Your identity has been verified. You can now earn unlimited commissions without any restrictions.</p>
          {kycStatus?.kyc_verified_at && (
            <p className="text-gray-400 text-sm mt-2">
              Verified on: {new Date(kycStatus.kyc_verified_at).toLocaleDateString()}
            </p>
          )}
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
      const response = await axios.get(`${API_URL}/payments/recent`, {
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
        const response = await axios.get(`${API_URL}/membership/tiers`);
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
      const response = await axios.post(`${API_URL}/payments/create`, {
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
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-white">Proleads Network</span>
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
      const response = await axios.post(`${API_URL}/admin/login`, credentials);
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
  
  // Admin notification states
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [adminNotificationsPanelOpen, setAdminNotificationsPanelOpen] = useState(false);
  const [adminBellButtonRef, setAdminBellButtonRef] = useState(null);
  
  // Admin tickets management state
  const [adminTickets, setAdminTickets] = useState([]);
  const [selectedAdminTicket, setSelectedAdminTicket] = useState(null);
  const [adminTicketPage, setAdminTicketPage] = useState(1);
  const [adminTicketTotalPages, setAdminTicketTotalPages] = useState(1);
  const [adminTicketFilters, setAdminTicketFilters] = useState({
    status: '',
    category: '',
    contact_type: '',
    user: ''
  });
  const [showMassMessageModal, setShowMassMessageModal] = useState(false);
  const [massMessageForm, setMassMessageForm] = useState({
    target_type: 'all_users',
    target_tiers: [],
    target_users: [],
    subject: '',
    message: ''
  });
  const [adminReplyMessage, setAdminReplyMessage] = useState('');

  // Milestones management state
  const [milestones, setMilestones] = useState([]);
  const [milestonePage, setMilestonePage] = useState(1);
  const [milestoneTotalPages, setMilestoneTotalPages] = useState(1);
  const [milestoneFilters, setMilestoneFilters] = useState({
    user: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    status: ''
  });
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // KYC management state
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [kycPage, setKycPage] = useState(1);
  const [kycTotalPages, setKycTotalPages] = useState(1);
  const [kycStatusFilter, setKycStatusFilter] = useState('pending');
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showKYCReviewModal, setShowKYCReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAdminData();
    fetchAdminNotifications();
    
    // Auto-refresh admin notifications every 30 seconds
    const adminNotificationInterval = setInterval(() => {
      fetchAdminNotifications();
    }, 30000);
    
    return () => clearInterval(adminNotificationInterval);
  }, []);

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers(memberFilter, memberPage);
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'commissions') {
      fetchCommissions();
    } else if (activeTab === 'milestones') {
      fetchMilestones();
    } else if (activeTab === 'kyc') {
      fetchKYCSubmissions();
    }
  }, [activeTab, memberFilter, memberPage, sortField, sortDirection, paymentUserFilter, paymentTierFilter, paymentStatusFilter, paymentDateFrom, paymentDateTo, paymentPage, commissionUserFilter, commissionTierFilter, commissionStatusFilter, commissionDateFrom, commissionDateTo, commissionPage, milestoneFilters, milestonePage, kycStatusFilter, kycPage]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch dashboard overview
      const overviewResponse = await axios.get(`${API_URL}/admin/dashboard/overview`, { headers });
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
  
  const fetchAdminNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminNotifications(response.data.notifications);
      setAdminUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error);
    }
  };

  const clearAdminNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from local state
      setAdminNotifications(adminNotifications.filter(n => n.notification_id !== notificationId));
      setAdminUnreadCount(Math.max(0, adminUnreadCount - 1));
    } catch (error) {
      console.error('Failed to clear admin notification:', error);
      alert('Failed to clear notification');
    }
  };

  const markAllAdminNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/admin/notifications/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setAdminNotifications(adminNotifications.map(n => ({ ...n, read_status: true })));
      setAdminUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark admin notifications as read:', error);
    }
  };

  const fetchMembers = async (tier = '', page = 1) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (tier) params.append('tier', tier);
      if (sortField) params.append('sort_by', sortField);
      if (sortDirection) params.append('sort_direction', sortDirection);
      params.append('page', page.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/admin/members?${params}`, { headers });
      
      // Backend now handles sorting, no need to sort on frontend
      setMembers(response.data.members || []);
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
      
      const response = await axios.get(`${API_URL}/admin/payments?${params}`, { headers });
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
      
      const response = await axios.get(`${API_URL}/admin/commissions?${params}`, { headers });
      setCommissions(response.data.commissions || []);
      setCommissionTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (milestoneFilters.user) params.append('username_filter', milestoneFilters.user);
      if (milestoneFilters.dateFrom) params.append('date_from', milestoneFilters.dateFrom);
      if (milestoneFilters.dateTo) params.append('date_to', milestoneFilters.dateTo);
      if (milestoneFilters.minAmount) params.append('award_filter', milestoneFilters.minAmount);
      if (milestoneFilters.status) params.append('status_filter', milestoneFilters.status);
      params.append('page', milestonePage.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/admin/milestones?${params}`, { headers });
      setMilestones(response.data.milestones || []);
      setMilestoneTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    }
  };

  const markMilestoneAsPaid = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to mark this milestone as paid?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/admin/milestones/${milestoneId}/mark-paid`, {}, { headers });
      
      // Refresh milestones list
      fetchMilestones();
      alert('Milestone marked as paid successfully');
      
    } catch (error) {
      console.error('Failed to mark milestone as paid:', error);
      alert('Failed to mark milestone as paid: ' + (error.response?.data?.detail || error.message));
    }
  };

  const exportMilestones = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (milestoneFilters.user) params.append('username_filter', milestoneFilters.user);
      if (milestoneFilters.dateFrom) params.append('date_from', milestoneFilters.dateFrom);
      if (milestoneFilters.dateTo) params.append('date_to', milestoneFilters.dateTo);
      if (milestoneFilters.minAmount) params.append('award_filter', milestoneFilters.minAmount);
      if (milestoneFilters.status) params.append('status_filter', milestoneFilters.status);
      
      const response = await axios.get(`${API_URL}/admin/milestones/export?${params}`, { 
        headers, 
        responseType: 'blob' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `milestones_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export milestones:', error);
      alert('Failed to export milestones: ' + (error.response?.data?.detail || error.message));
    }
  };

  // KYC Management Functions
  const fetchKYCSubmissions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (kycStatusFilter) params.append('status_filter', kycStatusFilter);
      params.append('page', kycPage.toString());
      params.append('limit', '20');
      
      const response = await axios.get(`${API_URL}/admin/kyc/submissions?${params}`, { headers });
      setKycSubmissions(response.data.submissions || []);
      setKycTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
    }
  };

  const handleApproveKYC = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this KYC submission?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/admin/kyc/${userId}/review`, { approved: true }, { headers });
      
      // Refresh KYC list
      fetchKYCSubmissions();
      setShowKYCReviewModal(false);
      setSelectedKYC(null);
      alert('KYC approved successfully');
      
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      alert('Failed to approve KYC: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRejectKYC = async (userId) => {
    if (!rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }
    
    if (!window.confirm('Are you sure you want to reject this KYC submission?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/admin/kyc/${userId}/review`, { 
        approved: false, 
        rejection_reason: rejectionReason 
      }, { headers });
      
      // Refresh KYC list
      fetchKYCSubmissions();
      setShowKYCReviewModal(false);
      setSelectedKYC(null);
      setRejectionReason('');
      alert('KYC rejected');
      
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      alert('Failed to reject KYC: ' + (error.response?.data?.detail || error.message));
    }
  };

  const fetchMemberDetails = async (memberId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_URL}/admin/members/${memberId}`, { headers });
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
      
      await axios.put(`${API_URL}/admin/members/${memberId}`, updateData, { headers });
      
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
      
      await axios.delete(`${API_URL}/admin/members/${memberId}`, { headers });
      
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
      
      await axios.post(`${API_URL}/admin/members/${memberId}/unsuspend`, {}, { headers });
      
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
      
      const response = await axios.get(`${API_URL}/admin/payments/export?${params}`, { 
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
      
      const response = await axios.get(`${API_URL}/admin/commissions/export?${params}`, { 
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
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-white">Proleads Network - Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Administrator</span>
              
              {/* Admin Notification Bell */}
              <div className="relative notification-panel">
                <button
                  ref={setAdminBellButtonRef}
                  onClick={() => {
                    setAdminNotificationsPanelOpen(!adminNotificationsPanelOpen);
                  }}
                  className="relative p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300"
                >
                  <Bell className="h-6 w-6" />
                  {adminUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                    </span>
                  )}
                </button>
              </div>
              
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
      
      {/* Admin Notification Panel Portal */}
      {adminNotificationsPanelOpen && adminBellButtonRef && (
        <AdminNotificationPanel
          bellButtonRef={adminBellButtonRef}
          notifications={adminNotifications}
          onClose={() => setAdminNotificationsPanelOpen(false)}
          onClearNotification={clearAdminNotification}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-red-900 bg-opacity-30 backdrop-blur-sm border-r border-red-800">
          <div className="p-6">
            <h2 className="text-lg font-bold text-white mb-6">Admin Panel</h2>
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'members', label: 'Members', icon: Users },
                { id: 'payments', label: 'Payments', icon: DollarSign },
                { id: 'commissions', label: 'Commissions', icon: Activity },
                { id: 'milestones', label: 'Milestones', icon: Award },
                { id: 'kyc', label: 'KYC Verification', icon: Shield },
                { id: 'leads', label: 'Leads Distribution', icon: FileText },
                { id: 'tickets', label: 'Tickets', icon: MessageCircle },
                { id: 'configuration', label: 'Configuration', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-3 text-left ${
                    activeTab === id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-red-800 hover:bg-opacity-30'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">

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
                icon={<FileText className="h-8 w-8 text-yellow-400" />}
                title="Leads Status"
                value={stats?.leads?.remaining || 0}
                subtitle={stats?.leads?.csv_status || "No CSV uploaded"}
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

            {/* Recent Activity Cards */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentMembersCard />
                <RecentPaymentsCard />
                <RecentMilestonesCard />
                <RecentTicketsCard />
              </div>
            </div>
          </div>
        )}


        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AnalyticsTab />}


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
                    <option value="test">Test</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="vip_affiliate">VIP Affiliate</option>
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
                          <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getTierBadgeClass(member.membership_tier)}`}>
                            {getTierDisplayName(member.membership_tier)}
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
                        <option value="test">Test</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="vip_affiliate">VIP Affiliate</option>
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
                          <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getTierBadgeClass(payment.tier)}`}>
                            {getTierDisplayName(payment.tier)}
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
                        <option value="test">Test</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="vip_affiliate">VIP Affiliate</option>
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
                            <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-medium mt-1 ${getTierBadgeClass(commission.new_member_tier)}`}>
                              {getTierDisplayName(commission.new_member_tier)}
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

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <AdminMilestonesTab 
            milestones={milestones}
            page={milestonePage}
            setPage={setMilestonePage}
            totalPages={milestoneTotalPages}
            filters={milestoneFilters}
            setFilters={setMilestoneFilters}
            onMarkAsPaid={markMilestoneAsPaid}
            onExport={exportMilestones}
            selectedMilestone={selectedMilestone}
            setSelectedMilestone={setSelectedMilestone}
            showModal={showMilestoneModal}
            setShowModal={setShowMilestoneModal}
          />
        )}

        {activeTab === 'kyc' && (
          <AdminKYCTab 
            submissions={kycSubmissions}
            page={kycPage}
            setPage={setKycPage}
            totalPages={kycTotalPages}
            statusFilter={kycStatusFilter}
            setStatusFilter={setKycStatusFilter}
            selectedKYC={selectedKYC}
            setSelectedKYC={setSelectedKYC}
            showModal={showKYCReviewModal}
            setShowModal={setShowKYCReviewModal}
            onApprove={handleApproveKYC}
            onReject={handleRejectKYC}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
          />
        )}

        {/* Leads Management Tab */}
        {activeTab === 'leads' && (
          <LeadsManagementTab />
        )}

        {/* Configuration Tab */}
        {activeTab === 'configuration' && (
          <ConfigurationTab />
        )}

        {/* Admin Tickets Tab */}
        {activeTab === 'tickets' && (
          <AdminTicketsTab 
            tickets={adminTickets}
            setTickets={setAdminTickets}
            selectedTicket={selectedAdminTicket}
            setSelectedTicket={setSelectedAdminTicket}
            page={adminTicketPage}
            setPage={setAdminTicketPage}
            totalPages={adminTicketTotalPages}
            setTotalPages={setAdminTicketTotalPages}
            filters={adminTicketFilters}
            setFilters={setAdminTicketFilters}
            showMassMessageModal={showMassMessageModal}
            setShowMassMessageModal={setShowMassMessageModal}
            massMessageForm={massMessageForm}
            setMassMessageForm={setMassMessageForm}
            adminReplyMessage={adminReplyMessage}
            setAdminReplyMessage={setAdminReplyMessage}
          />
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
      const response = await axios.get(`${API_URL}/users/leads?page=${currentPage}&limit=${limit}`, {
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
      const response = await axios.get(`${API_URL}/users/leads/download/${fileId}`, {
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
          {/* Summary Stats - Moved to top */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          file.member_tier === 'test' ? 'bg-green-600 bg-opacity-20 text-green-300' :
                          file.member_tier === 'vip_affiliate' ? 'bg-purple-600 bg-opacity-20 text-purple-300' :
                          'bg-orange-600 bg-opacity-20 text-orange-300'
                        }`}>
                          {getTierDisplayName(file.member_tier)}
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
      const response = await axios.get(`${API_URL}/admin/leads/distributions?page=${page}&limit=10`, {
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

      const response = await axios.post(`${API_URL}/admin/leads/upload`, formData, {
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
      await axios.post(`${API_URL}/admin/leads/distribute/${distributionId}`, {}, {
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

// Admin Tickets Tab Component
function AdminTicketsTab({ 
  tickets, setTickets, selectedTicket, setSelectedTicket, 
  page, setPage, totalPages, setTotalPages, filters, setFilters,
  showMassMessageModal, setShowMassMessageModal, massMessageForm, setMassMessageForm,
  adminReplyMessage, setAdminReplyMessage
}) {
  const [activeView, setActiveView] = useState('list'); // 'list', 'view', 'mass-message'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminTickets();
  }, [page, filters]);

  const fetchAdminTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (filters.status) params.append('status_filter', filters.status);
      if (filters.category) params.append('category_filter', filters.category);
      if (filters.contact_type) params.append('contact_type_filter', filters.contact_type);
      if (filters.user) params.append('user_filter', filters.user);

      const response = await axios.get(
        `${API_URL}/admin/tickets?${params}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setTickets(response.data.tickets || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch admin tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${API_URL}/admin/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setSelectedTicket(response.data);
      setActiveView('view');
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      alert('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_URL}/admin/tickets/${ticketId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update local ticket status
      if (selectedTicket && selectedTicket.ticket.ticket_id === ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          ticket: { ...selectedTicket.ticket, status: newStatus }
        });
      }
      
      // Refresh ticket list
      fetchAdminTickets();
      alert('Ticket status updated successfully');
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const replyToTicket = async () => {
    if (!adminReplyMessage.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('message', adminReplyMessage);

      await axios.post(
        `${API_URL}/admin/tickets/${selectedTicket.ticket.ticket_id}/reply`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setAdminReplyMessage('');
      fetchTicketDetails(selectedTicket.ticket.ticket_id);
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    }
  };

  const sendMassMessage = async () => {
    try {
      if (!massMessageForm.subject.trim() || !massMessageForm.message.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URL}/admin/tickets/mass-message`,
        massMessageForm,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Mass message sent successfully!');
      setShowMassMessageModal(false);
      setMassMessageForm({
        target_type: 'all_users',
        target_tiers: [],
        target_users: [],
        subject: '',
        message: ''
      });
      fetchAdminTickets();
    } catch (error) {
      console.error('Failed to send mass message:', error);
      alert('Failed to send mass message');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-600 text-blue-100';
      case 'in_progress': return 'bg-yellow-600 text-yellow-100';
      case 'closed': return 'bg-gray-600 text-gray-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-red-100';
      case 'medium': return 'bg-orange-600 text-orange-100';
      case 'low': return 'bg-green-600 text-green-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const downloadAttachment = async (url, filename) => {
    try {
      const token = localStorage.getItem('adminToken');
      // Handle URLs that might already have /api prefix
      const attachmentUrl = url.startsWith('/api/') ? `${BACKEND_URL}${url}` : `${API_URL}${url}`;
      const response = await fetch(attachmentUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load attachment');
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const contentType = response.headers.get('content-type') || '';
      
      // Open in new window with the blob URL
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>${filename || 'Attachment'}</title>
            <style>
              body { 
                margin: 0; padding: 20px; font-family: Arial, sans-serif; 
                background: #f5f5f5; text-align: center;
              }
              .container { max-width: 100%; }
              .header { 
                background: white; padding: 15px; margin-bottom: 20px; 
                border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .content { 
                background: white; padding: 20px; border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-height: 70vh;
              }
              .download-btn { 
                background: #dc2626; color: white; padding: 10px 20px; 
                border: none; border-radius: 4px; cursor: pointer; margin: 5px;
                text-decoration: none; display: inline-block;
              }
              .download-btn:hover { background: #b91c1c; }
              .close-btn { background: #6b7280; }
              .close-btn:hover { background: #4b5563; }
              img { max-width: 100%; height: auto; }
              iframe { width: 100%; height: 70vh; border: none; }
              .file-info { color: #6b7280; font-size: 14px; margin-bottom: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0 0 10px 0;">${filename || 'Attachment'} [ADMIN VIEW]</h2>
                <div class="file-info">Type: ${contentType}</div>
                <a href="${fileUrl}" download="${filename || 'attachment'}" class="download-btn">
                  📥 Download
                </a>
                <button onclick="window.close()" class="download-btn close-btn">
                  ❌ Close
                </button>
              </div>
              <div class="content">
                ${contentType.startsWith('image/') ? 
                  `<img src="${fileUrl}" alt="${filename}" />` :
                  contentType === 'application/pdf' ?
                  `<iframe src="${fileUrl}" type="application/pdf"></iframe>` :
                  contentType.startsWith('text/') ?
                  `<iframe src="${fileUrl}"></iframe>` :
                  `<div style="padding: 40px;">
                     <h3>Preview not available for this file type</h3>
                     <p>Click the download button above to save the file.</p>
                   </div>`
                }
              </div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 60000); // Clean up after 1 minute
      
    } catch (error) {
      console.error('Failed to open attachment:', error);
      alert('Failed to open attachment');
    }
  };

  // Ticket Details View
  if (activeView === 'view' && selectedTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Tickets</span>
          </button>
          <h3 className="text-2xl font-bold text-white">Ticket Details</h3>
        </div>

        {/* Ticket Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-bold text-white mb-2">{selectedTicket.ticket.subject}</h4>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-medium ${getStatusColor(selectedTicket.ticket.status)}`}>
                  {selectedTicket.ticket.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-medium ${getPriorityColor(selectedTicket.ticket.priority)}`}>
                  {selectedTicket.ticket.priority}
                </span>
                <span className="text-gray-400 text-sm">
                  {selectedTicket.ticket.category.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedTicket.ticket.status}
                onChange={(e) => updateTicketStatus(selectedTicket.ticket.ticket_id, e.target.value)}
                className="px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">From: </span>
              <span className="text-white">{selectedTicket.ticket.sender_username}</span>
            </div>
            <div>
              <span className="text-gray-400">To: </span>
              <span className="text-white">
                {selectedTicket.ticket.recipient_username || 'Admin'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Type: </span>
              <span className="text-white capitalize">{selectedTicket.ticket.contact_type.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-gray-400">Created: </span>
              <span className="text-white">{new Date(selectedTicket.ticket.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h5 className="text-lg font-bold text-white mb-4">Conversation</h5>
          
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {selectedTicket.messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.sender_role === 'admin' 
                    ? 'bg-red-600 bg-opacity-20 border-l-4 border-red-400' 
                    : 'bg-blue-600 bg-opacity-20 border-l-4 border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">
                      {message.sender_username}
                    </span>
                    {message.sender_role === 'admin' && (
                      <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-xs">Admin</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{message.message}</p>
                
                {/* Attachments */}
                {message.attachment_urls && message.attachment_urls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachment_urls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => downloadAttachment(url, `attachment-${i + 1}`)}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 cursor-pointer"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>View Attachment {i + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Admin Reply Section */}
          <div className="border-t border-gray-600 pt-4">
            <textarea
              value={adminReplyMessage}
              onChange={(e) => setAdminReplyMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none mb-4"
              placeholder="Type your admin reply..."
            />
            
            <div className="flex justify-end">
              <button
                onClick={replyToTicket}
                disabled={!adminReplyMessage.trim()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send Admin Reply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Ticket Management</h3>
        <button
          onClick={() => setShowMassMessageModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
        >
          <Mail className="h-4 w-4" />
          <span>Send Mass Message</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="leads">Leads</option>
              <option value="technical">Technical</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Contact Type</label>
            <select
              value={filters.contact_type}
              onChange={(e) => setFilters({...filters, contact_type: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Types</option>
              <option value="admin">Admin Tickets</option>
              <option value="sponsor">Sponsor Messages</option>
              <option value="downline_individual">Downline Messages</option>
              <option value="news">News Messages</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">User Search</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => setFilters({...filters, user: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
              placeholder="Search username/email"
            />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">No Tickets Found</h4>
            <p className="text-gray-300">No tickets match the current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black bg-opacity-30">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-medium">Subject</th>
                    <th className="px-6 py-4 text-left text-white font-medium">From</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Type</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Category</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Priority</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Status</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Updated</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.ticket_id}
                      className="hover:bg-white hover:bg-opacity-5"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="text-white font-medium">{ticket.subject}</h4>
                          <p className="text-gray-400 text-sm">#{ticket.ticket_id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{ticket.sender_username}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-300">
                          {ticket.contact_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-300">{ticket.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(ticket.updated_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => fetchTicketDetails(ticket.ticket_id)}
                          className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center py-4 space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded"
                >
                  Previous
                </button>
                
                <span className="text-white">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mass Message Modal */}
      {showMassMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">Send Mass Message</h4>
              <button
                onClick={() => setShowMassMessageModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Target Audience</label>
                <select
                  value={massMessageForm.target_type}
                  onChange={(e) => setMassMessageForm({...massMessageForm, target_type: e.target.value})}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all_users">All Users</option>
                  <option value="specific_tiers">Specific Tiers</option>
                </select>
              </div>

              {massMessageForm.target_type === 'specific_tiers' && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Select Tiers</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['affiliate', 'bronze', 'silver', 'gold'].map(tier => (
                      <label key={tier} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={massMessageForm.target_tiers.includes(tier)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMassMessageForm({
                                ...massMessageForm,
                                target_tiers: [...massMessageForm.target_tiers, tier]
                              });
                            } else {
                              setMassMessageForm({
                                ...massMessageForm,
                                target_tiers: massMessageForm.target_tiers.filter(t => t !== tier)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-white capitalize">{tier}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white text-sm font-medium mb-2">Subject *</label>
                <input
                  type="text"
                  value={massMessageForm.subject}
                  onChange={(e) => setMassMessageForm({...massMessageForm, subject: e.target.value})}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
                  placeholder="Message subject"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Message *</label>
                <textarea
                  value={massMessageForm.message}
                  onChange={(e) => setMassMessageForm({...massMessageForm, message: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none"
                  placeholder="Your message content..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={sendMassMessage}
                  disabled={!massMessageForm.subject || !massMessageForm.message}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg"
                >
                  Send Message
                </button>
                <button
                  onClick={() => setShowMassMessageModal(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
      const response = await axios.get(`${API_URL}/admin/config/system`, {
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

      const response = await axios.put(`${API_URL}/admin/config/membership-tiers`, tiersData, {
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

      const response = await axios.put(`${API_URL}/admin/config/payment-processors`, processorsData, {
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
      const response = await axios.post(`${API_URL}/admin/config/reset-to-defaults`, {}, {
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
        <button
          onClick={() => setActiveSection('tools')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            activeSection === 'tools'
              ? 'bg-red-600 text-white'
              : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
          }`}
        >
          System Tools
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

      {/* System Tools Section */}
      {activeSection === 'tools' && (
        <div className="space-y-6">
          {/* Referral Code Migration Tool */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                <RefreshCcw className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Migrate Referral Codes</h3>
                <p className="text-gray-300">
                  Update all user referral codes to use the new username-based format. This will change referral URLs from 
                  <code className="mx-1 px-2 py-1 bg-black bg-opacity-30 rounded text-blue-300">REFFIRSTUSER5DCBEE</code>
                  to 
                  <code className="mx-1 px-2 py-1 bg-black bg-opacity-30 rounded text-green-300">firstuser</code>
                </p>
              </div>
            </div>

            <MigrationButton />
          </div>

          {/* Future tools can be added here */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-center text-gray-400 py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>More system tools will be added here in future updates</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Migration Button Component
function MigrationButton() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const runMigration = async () => {
    if (!window.confirm('Are you sure you want to migrate all referral codes? This will update all users in the production database.')) {
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/migrate/referral-codes`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResult({
        success: true,
        data: response.data
      });

      alert(`Migration completed successfully!\n\nTotal users: ${response.data.total_users}\nUpdated: ${response.data.updated}\nSkipped: ${response.data.skipped}`);

    } catch (error) {
      console.error('Migration failed:', error);
      setResult({
        success: false,
        error: error.response?.data?.detail || error.message
      });
      alert('Migration failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={runMigration}
        disabled={migrating}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
          migrating
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {migrating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Migrating...</span>
          </>
        ) : (
          <>
            <RefreshCcw className="h-5 w-5" />
            <span>Run Migration</span>
          </>
        )}
      </button>

      {result && (
        <div className={`border rounded-lg p-4 ${
          result.success
            ? 'bg-green-900 bg-opacity-20 border-green-500'
            : 'bg-red-900 bg-opacity-20 border-red-500'
        }`}>
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-bold mb-2 ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                {result.success ? 'Migration Successful!' : 'Migration Failed'}
              </h4>
              {result.success ? (
                <div className="text-gray-300 space-y-1">
                  <p><strong>Total Users:</strong> {result.data.total_users}</p>
                  <p><strong>Updated:</strong> {result.data.updated}</p>
                  <p><strong>Skipped:</strong> {result.data.skipped}</p>
                  {result.data.errors && result.data.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-yellow-300"><strong>Warnings:</strong></p>
                      <ul className="list-disc list-inside text-sm">
                        {result.data.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-gray-400">
                    ✅ All users can now log out and log back in to see their new referral URLs
                  </p>
                </div>
              ) : (
                <p className="text-red-300">{result.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <p className="font-semibold mb-2">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This migration is safe to run multiple times</li>
              <li>Users will need to log out and log back in to see updated URLs</li>
              <li>Old referral links will continue to work</li>
              <li>This only updates the database - no code changes required</li>
            </ul>
          </div>
        </div>
      </div>
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
                <option value="test">Test</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="vip_affiliate">VIP Affiliate</option>
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
                    <span className="text-gray-400">Tier:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs uppercase font-medium ${getTierBadgeClass(memberData.membership_tier)}`}>
                      {getTierDisplayName(memberData.membership_tier)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white ml-2">{memberData.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{memberData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Sponsor:</span>
                    <span className="text-white ml-2">
                      {member?.sponsor?.username || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Joined:</span>
                    <span className="text-white ml-2">
                      {new Date(memberData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Subscription Expires:</span>
                    <span className="text-white ml-2">
                      {memberData.subscription_expires_at ? 
                        new Date(memberData.subscription_expires_at).toLocaleDateString() : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Wallet:</span>
                    <span className="text-white ml-2 font-mono text-sm">
                      {memberData.wallet_address || memberData.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <div className="ml-2 flex gap-2 items-center">
                      {memberData.is_expired && (
                        <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-yellow-100">
                          Expired
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        memberData.suspended ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'
                      }`}>
                        {memberData.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">KYC Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs uppercase font-medium ${
                      memberData.kyc_status === 'verified' ? 'bg-green-600 text-green-100' :
                      memberData.kyc_status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                      memberData.kyc_status === 'rejected' ? 'bg-red-600 text-red-100' :
                      'bg-gray-600 text-gray-100'
                    }`}>
                      {memberData.kyc_status === 'verified' && '✓ Verified'}
                      {memberData.kyc_status === 'pending' && '⏳ Pending'}
                      {memberData.kyc_status === 'rejected' && '✗ Rejected'}
                      {(!memberData.kyc_status || memberData.kyc_status === 'unverified') && 'Unverified'}
                    </span>
                  </div>
                  {memberData.kyc_verified_at && (
                    <div>
                      <span className="text-gray-400">KYC Verified:</span>
                      <span className="text-white ml-2">
                        {new Date(memberData.kyc_verified_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
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
                    <span className="text-gray-400">Total Payments:</span>
                    <span className="text-white ml-2">{member?.stats?.total_payments || 0}</span>
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
              {memberData.suspended ? (
                <button
                  onClick={handleUnsuspend}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  Unsuspend Member
                </button>
              ) : (
                <button
                  onClick={handleSuspend}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  Suspend Member
                </button>
              )}
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

// Admin Milestones Tab Component
function AdminMilestonesTab({ 
  milestones, 
  page, 
  setPage, 
  totalPages, 
  filters, 
  setFilters, 
  onMarkAsPaid, 
  onExport,
  selectedMilestone,
  setSelectedMilestone,
  showModal,
  setShowModal
}) {
  // Get last 30 days date for default filter
  const getLast30DaysDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  // Set default date filter to last 30 days if not set
  useEffect(() => {
    if (!filters.dateFrom && !filters.dateTo) {
      setFilters(prev => ({
        ...prev,
        dateFrom: getLast30DaysDate()
      }));
    }
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      user: '',
      dateFrom: getLast30DaysDate(),
      dateTo: '',
      minAmount: '',
      status: ''
    });
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Milestones Management</h2>
        <button
          onClick={onExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              placeholder="Filter by username"
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Award Amount</label>
            <select
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Awards</option>
              <option value="25">$25 (25 referrals)</option>
              <option value="100">$100 (100 referrals)</option>
              <option value="250">$250 (250 referrals)</option>
              <option value="1000">$1000 (1000 referrals)</option>
              <option value="2500">$2500 (5000 referrals)</option>
              <option value="5000">$5000 (10000 referrals)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={clearFilters}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Milestones Table */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white bg-opacity-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Referrals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Milestone Award</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {milestones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No milestones found
                  </td>
                </tr>
              ) : (
                milestones.map((milestone) => (
                  <tr key={milestone.milestone_id} className="hover:bg-white hover:bg-opacity-5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(milestone.achieved_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{milestone.username}</div>
                      <div className="text-sm text-gray-400">{milestone.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {milestone.total_referrals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                      ${milestone.bonus_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeClass(milestone.status)}`}>
                        {milestone.status === 'pending' ? 'Pending' : 'Paid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewMilestone(milestone)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white bg-opacity-10 px-6 py-3 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  Showing page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNumber
                            ? 'z-10 bg-red-600 border-red-600 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Milestone Details Modal */}
      {showModal && selectedMilestone && (
        <MilestoneDetailsModal
          milestone={selectedMilestone}
          onClose={() => {
            setShowModal(false);
            setSelectedMilestone(null);
          }}
          onMarkAsPaid={onMarkAsPaid}
        />
      )}
    </div>
  );
}

// Milestone Details Modal Component
function MilestoneDetailsModal({ milestone, onClose, onMarkAsPaid }) {
  const handleMarkAsPaid = () => {
    onMarkAsPaid(milestone.milestone_id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-white">Milestone Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* User Information */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">User Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Username:</span>
                <span className="text-white font-medium">{milestone.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Email:</span>
                <span className="text-white font-medium">{milestone.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Wallet Address:</span>
                <span className="text-white font-medium text-xs break-all">{milestone.wallet_address}</span>
              </div>
            </div>
          </div>

          {/* Milestone Information */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Milestone Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Achievement Date:</span>
                <span className="text-white font-medium">
                  {new Date(milestone.achieved_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Milestone Target:</span>
                <span className="text-white font-medium">{milestone.milestone_count} referrals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Current Referrals:</span>
                <span className="text-white font-medium">{milestone.total_referrals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Bonus Amount:</span>
                <span className="text-green-400 font-bold text-lg">${milestone.bonus_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  milestone.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {milestone.status === 'pending' ? 'Pending' : 'Paid'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {milestone.status === 'pending' && (
              <button
                onClick={handleMarkAsPaid}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                Mark as Paid
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [graphsData, setGraphsData] = useState(null);
  const [timeFilter, setTimeFilter] = useState('1month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsSummary();
  }, []);

  useEffect(() => {
    fetchGraphsData();
  }, [timeFilter]);

  const fetchAnalyticsSummary = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphsData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/analytics/graphs?time_filter=${timeFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGraphsData(response.data);
    } catch (error) {
      console.error('Failed to fetch graphs data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-gray-400">Track your platform's financial performance and growth metrics</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 font-medium">Total Income</h3>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">${analyticsData?.total_income?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400 mt-1">All confirmed payments</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 font-medium">Total Commissions</h3>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">${analyticsData?.total_commission?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400 mt-1">Paid to affiliates</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 font-medium">Net Profit</h3>
            <Activity className="h-8 w-8 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">${analyticsData?.net_profit?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400 mt-1">Income - Commissions</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 font-medium">Held Payments</h3>
            <Shield className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">${analyticsData?.held_payments?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400 mt-1">KYC pending over $50</p>
        </div>
      </div>

      {/* Time Filter Buttons */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex flex-wrap gap-3">
          <span className="text-white font-medium mr-4">Time Period:</span>
          {['1day', '1week', '1month', '1year', 'all'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                timeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-black bg-opacity-30 text-gray-300 hover:bg-opacity-50'
              }`}
            >
              {filter === '1day' ? '1 Day' : filter === '1week' ? '1 Week' : filter === '1month' ? '1 Month' : filter === '1year' ? '1 Year' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Graphs */}
      {graphsData && (
        <div className="grid grid-cols-1 gap-6">
          {/* Member Growth Graph */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Member Growth</h3>
            <AnalyticsGraph 
              data={graphsData.member_growth} 
              dataKey="count" 
              color="#3B82F6"
              yAxisLabel="Members"
            />
          </div>

          {/* Income Growth Graph */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Income Growth</h3>
            <AnalyticsGraph 
              data={graphsData.income_growth} 
              dataKey="amount" 
              color="#10B981"
              yAxisLabel="Income ($)"
              formatValue={(value) => `$${value.toFixed(2)}`}
            />
          </div>

          {/* Profit Growth Graph */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Profit Growth</h3>
            <AnalyticsGraph 
              data={graphsData.profit_growth} 
              dataKey="amount" 
              color="#A855F7"
              yAxisLabel="Profit ($)"
              formatValue={(value) => `$${value.toFixed(2)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Graph Component using Recharts
function AnalyticsGraph({ data, dataKey, color, yAxisLabel, formatValue }) {
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = require('recharts');

  // Transform data for Recharts
  const chartData = data.map(item => ({
    name: item._id,
    value: item[dataKey]
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg">
          <p className="text-white font-medium">{payload[0].payload.name}</p>
          <p className="text-blue-400">{formatValue ? formatValue(value) : value}</p>
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return <p className="text-gray-400 text-center py-8">No data available for this period</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="name" 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={3}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Recent Activity Card Components
function RecentMembersCard() {
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentMembers();
  }, []);

  const fetchRecentMembers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/recent/members?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentMembers(response.data.recent_members);
    } catch (error) {
      console.error('Failed to fetch recent members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Recent Members
        </h4>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading...</p>
        ) : recentMembers.length > 0 ? (
          recentMembers.map((member, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div>
                <p className="text-white font-medium">{member.username}</p>
                <p className="text-gray-400 text-sm">{getTierDisplayName(member.tier)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-300 text-sm">{new Date(member.join_date).toLocaleDateString()}</p>
                <span className={`text-xs px-2 py-1 rounded ${member.status === 'Active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {member.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent members</p>
        )}
      </div>
    </div>
  );
}

function RecentPaymentsCard() {
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/recent/payments?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentPayments(response.data.recent_payments);
    } catch (error) {
      console.error('Failed to fetch recent payments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Recent Payments
        </h4>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading...</p>
        ) : recentPayments.length > 0 ? (
          recentPayments.map((payment, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div>
                <p className="text-white font-medium">{payment.member_name}</p>
                <p className="text-gray-400 text-sm">{getTierDisplayName(payment.tier)}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">${payment.amount}</p>
                <p className="text-gray-300 text-xs">{new Date(payment.payment_date).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent payments</p>
        )}
      </div>
    </div>
  );
}

function RecentMilestonesCard() {
  const [recentMilestones, setRecentMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentMilestones();
  }, []);

  const fetchRecentMilestones = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/recent/milestones?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentMilestones(response.data.recent_milestones);
    } catch (error) {
      console.error('Failed to fetch recent milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Award className="h-5 w-5 mr-2" />
          Recent Milestones
        </h4>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading...</p>
        ) : recentMilestones.length > 0 ? (
          recentMilestones.map((milestone, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div>
                <p className="text-white font-medium">{milestone.member_name}</p>
                <p className="text-gray-400 text-sm">{milestone.referral_count} referrals</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-bold">${milestone.milestone_amount}</p>
                <span className={`text-xs px-2 py-1 rounded ${milestone.status === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                  {milestone.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent milestones</p>
        )}
      </div>
    </div>
  );
}

function RecentTicketsCard() {
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTickets();
  }, []);

  const fetchRecentTickets = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/recent/tickets?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentTickets(response.data.recent_tickets);
    } catch (error) {
      console.error('Failed to fetch recent tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-500 text-white';
      case 'in_progress': return 'bg-yellow-500 text-black';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Recent Tickets
        </h4>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading...</p>
        ) : recentTickets.length > 0 ? (
          recentTickets.map((ticket, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div className="flex-1">
                <p className="text-white font-medium">#{ticket.ticket_id.slice(0, 8)}</p>
                <p className="text-gray-400 text-sm truncate">{ticket.subject}</p>
                <p className="text-gray-500 text-xs">{ticket.member_name} • {ticket.department}</p>
              </div>
              <div className="text-right ml-4">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent tickets</p>
        )}
      </div>
    </div>
  );
}


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
      const response = await axios.put(`${API_URL}/users/profile`, updateData, {
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
      await axios.delete(`${API_URL}/users/cancel-account`, {
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

// KYC Document Image Component with Auth
function KYCDocumentImage({ filename, alt }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${API_URL}/users/kyc/document/${filename}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        
        const url = URL.createObjectURL(response.data);
        setImageUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load KYC document:', err);
        setError(true);
        setLoading(false);
      }
    };

    if (filename) {
      fetchImage();
    }

    // Cleanup - revoke URL when component unmounts or filename changes
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [filename]); // Only depend on filename, not imageUrl

  if (loading) {
    return (
      <div className="w-full h-64 bg-black rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-64 bg-black rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Failed to load image</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative group">
        <img
          src={imageUrl}
          alt={alt}
          onClick={() => setShowFullSize(true)}
          className="w-full h-64 object-contain bg-black rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg pointer-events-none">
          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
            Click to view full size
          </span>
        </div>
      </div>

      {/* Full Size Modal */}
      {showFullSize && (
        <div 
          className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowFullSize(false)}
        >
          <div className="relative max-w-7xl max-h-screen">
            <button
              onClick={() => setShowFullSize(false)}
              className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full z-10 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
              <p className="text-sm">{alt}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Admin KYC Tab Component
function AdminKYCTab({ submissions, page, setPage, totalPages, statusFilter, setStatusFilter, selectedKYC, setSelectedKYC, showModal, setShowModal, onApprove, onReject, rejectionReason, setRejectionReason }) {
  return (
    <div>
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-6">KYC Verification Management</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        {/* KYC Submissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 text-gray-300">User</th>
                <th className="text-left py-3 px-4 text-gray-300">Email</th>
                <th className="text-left py-3 px-4 text-gray-300">Earnings</th>
                <th className="text-left py-3 px-4 text-gray-300">Status</th>
                <th className="text-left py-3 px-4 text-gray-300">Submitted</th>
                <th className="text-center py-3 px-4 text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length > 0 ? (
                submissions.map((submission) => (
                  <tr key={submission.user_id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                    <td className="py-3 px-4 text-white font-medium">{submission.username}</td>
                    <td className="py-3 px-4 text-gray-300">{submission.email}</td>
                    <td className="py-3 px-4 text-white">${submission.total_earnings?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        submission.kyc_status === 'verified' ? 'bg-green-600 text-white' :
                        submission.kyc_status === 'pending' ? 'bg-yellow-600 text-white' :
                        submission.kyc_status === 'rejected' ? 'bg-red-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {submission.kyc_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {submission.kyc_submitted_at ? new Date(submission.kyc_submitted_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedKYC(submission);
                          setShowModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all duration-300"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No KYC submissions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-white">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* KYC Review Modal */}
      {showModal && selectedKYC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">KYC Review - {selectedKYC.username}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Username</p>
                <p className="text-white font-medium">{selectedKYC.username}</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white font-medium">{selectedKYC.email}</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-white font-medium">${selectedKYC.total_earnings?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Membership Tier</p>
                <p className="text-white font-medium">{selectedKYC.membership_tier}</p>
              </div>
            </div>

            {/* Documents */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-white mb-4">Submitted Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedKYC.kyc_documents?.id_document && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">ID Document</p>
                    <KYCDocumentImage filename={selectedKYC.kyc_documents.id_document} alt="ID Document" />
                  </div>
                )}
                {selectedKYC.kyc_documents?.selfie && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">Selfie</p>
                    <KYCDocumentImage filename={selectedKYC.kyc_documents.selfie} alt="Selfie" />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {selectedKYC.kyc_status === 'pending' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
                    rows="3"
                    placeholder="Enter reason for rejection..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => onApprove(selectedKYC.user_id)}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Approve KYC</span>
                  </button>
                  <button
                    onClick={() => onReject(selectedKYC.user_id)}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Reject KYC</span>
                  </button>
                </div>
              </div>
            )}

            {selectedKYC.kyc_status === 'rejected' && selectedKYC.kyc_rejection_reason && (
              <div className="bg-red-900 bg-opacity-30 border border-red-500 border-opacity-30 rounded-lg p-4">
                <p className="text-red-300 text-sm">
                  <strong>Rejection Reason:</strong> {selectedKYC.kyc_rejection_reason}
                </p>
              </div>
            )}

            {selectedKYC.kyc_status === 'verified' && (
              <div className="bg-green-900 bg-opacity-30 border border-green-500 border-opacity-30 rounded-lg p-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-bold">KYC Verified</p>
                <p className="text-gray-400 text-sm mt-1">
                  Verified on: {selectedKYC.kyc_verified_at ? new Date(selectedKYC.kyc_verified_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
