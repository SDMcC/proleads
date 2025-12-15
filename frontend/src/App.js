import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Tree from 'react-d3-tree';
import { QRCodeSVG as QRCode } from 'qrcode.react';
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
  AlertCircle,
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
  Moon,
  Link,
  Key,
  RotateCw
} from 'lucide-react';
import './App.css';
import FeatureCard from './components/shared/FeatureCard';
import FAQSection from './components/landing/FAQSection';
import Footer from './components/landing/Footer';
import LoginButton from './components/shared/LoginButton';
import TierCard from './components/landing/TierCard';
import CommissionStructure from './components/landing/CommissionStructure';
import MembershipTiers from './components/landing/MembershipTiers';
import EnhancedMembershipTiers from './components/landing/EnhancedMembershipTiers';
import AffiliatesPage from './pages/AffiliatesPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginModal from './components/auth/LoginModal';
import RegisterPage from './pages/RegisterPage';
import { getTierDisplayName } from './utils/helpers';
import KYCStatsRow from './components/dashboard/KYCStatsRow';
import KYCEarningsCard from './components/dashboard/KYCEarningsCard';
import OverviewTab from './components/dashboard/tabs/OverviewTab';
import NetworkTreeTab from './components/dashboard/tabs/NetworkTreeTab';
import AffiliateToolsTab from './components/dashboard/tabs/AffiliateToolsTab';
import EarningsTab from './components/dashboard/tabs/EarningsTab';
import PaymentHistoryTab from './components/dashboard/tabs/PaymentHistoryTab';
import MilestonesTab from './components/dashboard/tabs/MilestonesTab';
import AccountSettingsTab from './components/dashboard/tabs/AccountSettingsTab';
import ReferralsTab from './components/dashboard/tabs/ReferralsTab';
import AutoresponderTab from './components/dashboard/tabs/AutoresponderTab';
import TicketsTab from './components/dashboard/tabs/TicketsTab';
import NotificationPanel from './components/dashboard/NotificationPanel';
import AccountTab from './components/dashboard/tabs/AccountTab';
import NotificationSettingsTab from './components/dashboard/tabs/NotificationSettingsTab';
import KYCVerificationTab from './components/dashboard/tabs/KYCVerificationTab';
import LeadsTab from './components/dashboard/tabs/LeadsTab';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LeadsManagementTab from './components/admin/tabs/LeadsManagementTab';
import AdminTicketsTab from './components/admin/tabs/AdminTicketsTab';
import IntegrationsTab from './components/admin/tabs/IntegrationsTab';
import ConfigurationTab from './components/admin/tabs/ConfigurationTab';
import AdminMilestonesTab from './components/admin/tabs/AdminMilestonesTab';
import AnalyticsTab from './components/admin/tabs/AnalyticsTab';
import AdminKYCTab from './components/admin/tabs/AdminKYCTab';


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

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
  // Suppress MetaMask connection errors (we use DePay for payments)
  useEffect(() => {
    const handleError = (event) => {
      if (event.message && event.message.includes('MetaMask')) {
        event.preventDefault();
        console.log('MetaMask error suppressed (DePay is used for payments)');
        return true;
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

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

export const useAuth = () => {
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

// ProtectedRoute Component - Now imported from components/auth/ProtectedRoute.js

// LoginModal Component - Now imported from components/auth/LoginModal.js
// EnhancedMembershipTiers Component - Now imported from components/landing/EnhancedMembershipTiers.js

// FAQ Section Component - Now imported from components/landing/FAQSection.js

// Footer Component - Now imported from components/landing/Footer.js

// Affiliates Page Component - Now imported from pages/AffiliatesPage.js
// PrivacyPolicyPage Component - Now imported from pages/PrivacyPolicyPage.js
// TermsPage Component - Now imported from pages/TermsPage.js
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
                  Welcome to Proleads Network
                </h1>
                
                <p className="mb-12 text-base leading-relaxed text-gray-100 sm:text-lg md:text-xl drop-shadow-md">
                  A Reliable Weekly Supply of Fresh, High-Quality Leads for Your Business. Get vetted buyer leads delivered straight to your dashboard.
                </p>
                
                {referrerInfo && (
                  <div className="max-w-md mx-auto mb-8 p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                    <p className="text-white text-sm font-medium drop-shadow-md">
                      🎉 You're joining through <strong>{referrerInfo.referrer_username}</strong>'s network!
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
              Stop Struggling With Lead Flow
            </h2>
            <p className="text-lg text-body-color dark:text-body-color-dark max-w-4xl mx-auto leading-relaxed">
              Generating consistent leads is one of the hardest parts of growing an online business. Proleads Network removes that bottleneck. 
              Every week we deliver fresh, qualified leads directly to you so you can spend your time closing deals and scaling. 
              Plus, our built-in referral program lets active members earn generous recurring commissions — many cover (or exceed) 
              their membership cost with just a handful of referrals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">Predictable Lead Flow</h3>
              <p className="text-body-color dark:text-body-color-dark">
                Fresh leads arrive in your dashboard every week. No more cold outreach or expensive ads — just consistent prospects ready to talk business.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">A Smarter Way to Grow</h3>
              <p className="text-body-color dark:text-body-color-dark">
                Get a steady stream of high-quality leads + earn recurring income by sharing the system. Most members only need to refer 3–4 people for their membership to pay for itself.
              </p>
              <a href="/affiliates" className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block">
                Explore the Referral Program →
              </a>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-dark rounded-xl transition-colors duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">Scalable Momentum</h3>
              <p className="text-body-color dark:text-body-color-dark">
                Weekly leads keep your pipeline full while the referral program turns your network into an additional income stream. Grow faster without working harder.
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
              <h3 className="text-3xl font-bold text-black dark:text-white mb-6">Your Shortcut to Consistent Results</h3>
              <p className="text-body-color dark:text-body-color-dark leading-relaxed mb-6">
                Proleads Network is built for entrepreneurs and sales professionals who want growth without the daily lead-gen grind. 
                Our done-for-you system delivers the leads you need - verified and ready to engage so you save time and connect with 
                prospects who matter. With instant payouts and generous bonuses, Proleads Network is your path to predictable success.
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
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3">Effortless Scaling at Every Stage</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Whether you're just starting or already have an audience, our done-for-you system hands you qualified prospects on autopilot—saving you time and making expansion feel seamless.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-6">
                <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3">Cost-Effective Leads That Actually Work</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Stop overpaying for stale or low-quality leads. Get fresh, high-intent prospects delivered weekly at a fraction of traditional advertising costs—no contracts, cancel anytime.
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
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3">Higher ROI with Targeted Prospects</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Every lead is carefully vetted and actively seeking business opportunities, giving you significantly better conversion rates and maximizing the return on your subscription.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-6">
                <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3">Turn Your Network Into Recurring Income</h3>
                  <p className="text-body-color dark:text-body-color-dark">
                    Every member gets instant access to our{' '}
                    <a href="/affiliates" className="text-blue-600 hover:text-blue-800 font-medium">affiliate program</a>: 
                    earn up to 30% recurring commissions plus bonuses up to four tiers deep. Most members only need 3–4 referrals to make their membership free (or highly profitable).
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
            Ready to fill your pipeline and turn referrals into recurring revenue?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Pick your plan and get your first batch of leads this week.
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
// LoginButton Component - Now imported from components/shared/LoginButton.js

// Feature Card Component - Now imported from components/shared/FeatureCard.js

// Membership Tiers Component
// MembershipTiers Component - Now imported from components/landing/MembershipTiers.js

// Tier Card Component - Now imported from components/landing/TierCard.js

// Commission Structure Component - Now imported from components/landing/CommissionStructure.js

// RegisterPage Component - Now imported from pages/RegisterPage.js
// Dashboard Component
function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
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
    
    // Auto-refresh notifications and stats every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchNotifications();
      fetchDashboardStats(); // Also refresh stats to catch commission updates
    }, 30000);
    
    return () => clearInterval(refreshInterval);
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

  const handleRenewSubscription = async (currentTier) => {
    try {
      console.log('Renewing subscription for tier:', currentTier);
      
      const token = localStorage.getItem('token');
      
      // Create renewal payment
      const response = await axios.post(
        `${API_URL}/payments/renew`,
        { tier: currentTier },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const paymentInfo = response.data;
      console.log('Renewal payment created:', paymentInfo);
      
      // Open DePay widget
      await window.DePayWidgets.Payment({
        integration: paymentInfo.integration_id,
        payload: {
          payment_id: paymentInfo.payment_id,
          tier: paymentInfo.tier,
          user_address: paymentInfo.user_address
        }
      });
      
      // Start polling for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`${API_URL}/payments/${paymentInfo.payment_id}`);
          console.log('Renewal payment status:', statusResponse.data.status);
          
          if (statusResponse.data.status === 'completed') {
            clearInterval(pollInterval);
            console.log('Renewal completed! Refreshing...');
            // Refresh dashboard stats AND user profile to show new expiry
            await fetchDashboardStats();
            await refreshUser(); // This updates the user object with new expiry date
            alert('Subscription renewed successfully!');
          }
        } catch (pollError) {
          console.error('Status poll error:', pollError);
        }
      }, 3000);
      
      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
      
    } catch (error) {
      console.error('Renewal failed:', error);
      alert('Failed to start renewal: ' + (error.response?.data?.detail || error.message));
    }
  };

  const clearNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      // Find notification to check if it was unread
      const notification = notifications.find(n => n.notification_id === notificationId);
      const wasUnread = notification && !notification.read;
      
      // Mark notification as read (dismisses from bell dropdown, keeps in history)
      await axios.put(`${API_URL}/users/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state - remove from bell dropdown
      setNotifications(notifications.filter(n => n.notification_id !== notificationId));
      
      // Decrease unread count if notification was unread
      if (wasUnread) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to clear notification:', error);
      alert('Failed to clear notification');
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
                          title="Close"
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
          }} handleRenewSubscription={handleRenewSubscription} />}
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
                className="w-full px-6 py-3 bg-transparent border-2 border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg font-bold transition-all duration-300"
              >
                I'll Do This Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Payment Page Component
function PaymentPage() {
  const [selectedTier, setSelectedTier] = useState('silver');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentData, setPaymentData] = useState(null);
  
  const tiers = {
    free: {
      name: 'Free',
      price: 0,
      commissions: []
    },
    silver: {
      name: 'Silver',
      price: 49,
      commissions: ['10%', '5%', '3%', '2%', '1%']
    },
    gold: {
      name: 'Gold',
      price: 149,
      commissions: ['15%', '10%', '5%', '3%', '2%', '1%']
    },
    platinum: {
      name: 'Platinum',
      price: 499,
      commissions: ['20%', '15%', '10%', '5%', '3%', '2%', '1%']
    }
  };

  const handleStartPayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/payments/create`,
        { tier: selectedTier },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPaymentData(response.data);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Payment creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    // Payment logic handled in modal
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
          <p className="text-xl text-gray-300">Choose your tier and complete payment</p>
        </div>

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

          {/* Order Summary */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Order Summary</h3>
            
            <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Membership Tier:</span>
                <span className="capitalize text-white font-semibold">{selectedTier}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Commission Levels:</span>
                <span className="text-white font-semibold">{currentTier?.commissions?.length || 0}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Duration:</span>
                <span className="text-white font-semibold">{currentTier?.price === 0 ? 'Forever' : '1 Month'}</span>
              </div>
              <div className="border-t border-gray-600 pt-3 mt-3"></div>
              <div className="flex justify-between">
                <span className="text-lg text-gray-300">Total:</span>
                <span className="text-2xl font-bold text-white">${currentTier?.price || 0}</span>
              </div>
            </div>

            {currentTier?.price === 0 ? (
              <button
                onClick={handleStartPayment}
                disabled={loading}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Award className="h-5 w-5" />
                <span>{loading ? 'Activating...' : 'Activate Free Tier'}</span>
              </button>
            ) : (
              <button
                onClick={handleStartPayment}
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
              >
                {loading ? 'Processing...' : `Pay $${currentTier?.price} with Crypto`}
              </button>
            )}

            <p className="text-gray-400 text-sm mt-4 text-center">
              Secure crypto payment • Instant activation
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal - PayGate.to */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentStep(1);
            setPaymentData(null);
          }}
          step={paymentStep}
          amount={currentTier?.price}
          tier={selectedTier}
          paymentData={paymentData}
          loading={loading}
          onCreatePayment={handleCreatePayment}
        />
      )}
    </div>
  );
}

// Payment Modal Component - DePay
function PaymentModal({ 
  isOpen, 
  onClose, 
  step, 
  amount, 
  tier,
  paymentData,
  loading,
  onCreatePayment
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Confirmation Screen */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-white mb-2">Confirm Payment</h2>
          <p className="text-gray-400 mb-8">Pay securely with DePay</p>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <p className="text-gray-400 text-sm mb-2">Amount to Pay</p>
            <p className="text-4xl font-bold text-white">${amount}</p>
            <p className="text-gray-400 text-sm mt-2 capitalize">{tier} Membership</p>
          </div>

          <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm mb-2">✓ Secure Crypto Payments</p>
            <p className="text-gray-300 text-xs">
              Pay with USDC on multiple chains (Polygon, Ethereum, BSC, and more) or use credit card
            </p>
          </div>

          <button
            onClick={onCreatePayment}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
          >
            {loading ? 'Opening Payment Widget...' : 'Continue to Payment'}
          </button>
          
          <p className="text-gray-400 text-xs mt-4">
            Powered by DePay • Auto-converts to USDC Polygon
          </p>
        </div>
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
