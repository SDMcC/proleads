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
        {notifications.filter(n => !n.read).length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No unread notifications</p>
          </div>
        ) : (
          notifications.filter(n => !n.read).map((notification) => (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearNotification(notification.notification_id);
                  }}
                  className="ml-2 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Clear from list"
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
// OverviewTab Component - Now imported from components/dashboard/tabs/OverviewTab.js
// KYCEarningsCard Component - Now imported from components/dashboard/KYCEarningsCard.js
// NetworkTreeTab Component - Now imported from components/dashboard/tabs/NetworkTreeTab.js

// AffiliateToolsTab Component - Now imported from components/dashboard/tabs/AffiliateToolsTab.js

// EarningsTab Component - Now imported from components/dashboard/tabs/EarningsTab.js

// PaymentHistoryTab Component - Now imported from components/dashboard/tabs/PaymentHistoryTab.js

// MilestonesTab Component - Now imported from components/dashboard/tabs/MilestonesTab.js

// AccountSettingsTab Component - Now imported from components/dashboard/tabs/AccountSettingsTab.js
// Referrals Tab Component 
// ReferralsTab Component - Now imported from components/dashboard/tabs/ReferralsTab.js
// Autoresponder Tab Component
// AutoresponderTab Component - Now imported from components/dashboard/tabs/AutoresponderTab.js
// Tickets Tab Component (placeholder)
// TicketsTab Component - Now imported from components/dashboard/tabs/TicketsTab.js
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

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/users/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh the notifications list
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      alert('Failed to delete notification. Please try again.');
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
                        className={`p-4 rounded-lg transition-all border ${
                          notification.read ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-900/20 border-blue-700/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer hover:opacity-80"
                            onClick={() => viewNotification(notification.notification_id)}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {!notification.read && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                              <h4 className="text-white font-medium truncate">{notification.subject}</h4>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">{notification.body}</p>
                            <p className="text-gray-500 text-xs mt-2">{formatDate(notification.created_at)}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.notification_id);
                            }}
                            className="ml-2 p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-all flex-shrink-0"
                            title="Clear from list"
                          >
                            <X className="h-5 w-5" />
                          </button>
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
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [tiers, setTiers] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState('waiting');

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

  // Poll payment status
  useEffect(() => {
    if (!paymentData || paymentStatus !== 'waiting') return;
    
    const pollStatus = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/payments/${paymentData.payment_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.status === 'completed' || response.data.status === 'finished') {
          setPaymentStatus('confirmed');
          clearInterval(pollStatus);
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      }
    }, 5000);
    
    return () => clearInterval(pollStatus);
  }, [paymentData, paymentStatus]);

  const supportedCurrencies = [
    { code: 'USDCMATIC', name: 'USDC', icon: '💵', networks: ['Polygon'] },
    { code: 'USDT', name: 'USDT', icon: '₮', networks: ['Ethereum', 'Tron', 'BSC'] },
    { code: 'BTC', name: 'Bitcoin', icon: '₿', networks: ['Bitcoin'] },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ', networks: ['Ethereum'] },
    { code: 'LTC', name: 'Litecoin', icon: 'Ł', networks: ['Litecoin'] },
    { code: 'SOL', name: 'Solana', icon: '◎', networks: ['Solana'] }
  ];

  const handleStartPayment = () => {
    const currentTier = tiers[selectedTier];
    if (currentTier?.price === 0) {
      handleCreatePayment();
    } else {
      setShowPaymentModal(true);
      setPaymentStep(1);
    }
  };

  const handleSelectCurrency = (currency) => {
    setSelectedCurrency(currency);
    const currencyData = supportedCurrencies.find(c => c.code === currency);
    if (currencyData && currencyData.networks.length === 1) {
      setSelectedNetwork(currencyData.networks[0]);
      setPaymentStep(3);
    } else {
      setPaymentStep(2);
    }
  };

  const handleSelectNetwork = (network) => {
    setSelectedNetwork(network);
    setPaymentStep(3);
  };

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // For free tier
      if (tiers[selectedTier]?.price === 0) {
        const response = await axios.post(`${API_URL}/payments/create-depay`, {
          tier: selectedTier
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.payment_required === false) {
          alert('Membership upgraded to Affiliate!');
          window.location.href = '/dashboard';
        }
        return;
      }

      // For paid tiers - Create DePay payment
      const response = await axios.post(`${API_URL}/payments/create-depay`, {
        tier: selectedTier
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // DePay payment created - now open widget
      if (response.data.payment_id && response.data.integration_id) {
        const paymentInfo = response.data;
        
        // Close the modal
        setShowPaymentModal(false);
        
        // Wait for DePay script to load
        if (typeof window.DePayWidgets === 'undefined') {
          alert('Payment system is loading. Please try again in a moment.');
          return;
        }
        
        // Open DePay widget (using global DePayWidgets from CDN)
        console.log('Opening DePay widget with config:', {
          integration: paymentInfo.integration_id,
          payload: {
            payment_id: paymentInfo.payment_id,
            tier: paymentInfo.tier,
            user_address: paymentInfo.user_address
          }
        });
        
        try {
          // Start polling for payment status
          const pollInterval = setInterval(async () => {
            try {
              const statusResponse = await axios.get(`${API_URL}/payments/${paymentInfo.payment_id}`);
              console.log('Payment status check:', statusResponse.data.status);
              
              if (statusResponse.data.status === 'completed') {
                clearInterval(pollInterval);
                console.log('Payment completed! Redirecting to dashboard...');
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 1000);
              }
            } catch (pollError) {
              console.error('Status poll error:', pollError);
            }
          }, 3000); // Check every 3 seconds
          
          // Stop polling after 5 minutes (failsafe)
          setTimeout(() => clearInterval(pollInterval), 300000);
          
          await window.DePayWidgets.Payment({
            integration: paymentInfo.integration_id,
            payload: {
              payment_id: paymentInfo.payment_id,
              tier: paymentInfo.tier,
              user_address: paymentInfo.user_address
            },
            success: () => {
              // Payment successful - polling will handle redirect
              console.log('DePay widget success callback triggered');
            },
            error: (error) => {
              // Payment failed
              clearInterval(pollInterval);
              console.error('Payment failed:', error);
              alert('Payment failed. Please try again.');
            },
            close: () => {
              // Widget closed - keep polling in case payment completed
              console.log('Payment widget closed');
            }
          });
          
          console.log('DePay widget opened successfully for payment:', paymentInfo.payment_id);
        } catch (widgetError) {
          console.error('DePay widget error:', widgetError);
          alert('Payment widget error: ' + widgetError.message);
        }
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Payment creation failed. Please try again.');
      setShowPaymentModal(false);
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

  // Escrow management state
  const [escrowRecords, setEscrowRecords] = useState([]);
  const [escrowPage, setEscrowPage] = useState(1);
  const [escrowTotalPages, setEscrowTotalPages] = useState(1);
  const [escrowFilters, setEscrowFilters] = useState({
    status: 'pending_review',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [releasingEscrow, setReleasingEscrow] = useState(null);

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
    } else if (activeTab === 'escrow') {
      fetchEscrowRecords();
    } else if (activeTab === 'milestones') {
      fetchMilestones();
    } else if (activeTab === 'kyc') {
      fetchKYCSubmissions();
    }
  }, [activeTab, memberFilter, memberPage, sortField, sortDirection, paymentUserFilter, paymentTierFilter, paymentStatusFilter, paymentDateFrom, paymentDateTo, paymentPage, commissionUserFilter, commissionTierFilter, commissionStatusFilter, commissionDateFrom, commissionDateTo, commissionPage, escrowFilters, escrowPage, milestoneFilters, milestonePage, kycStatusFilter, kycPage]);

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

  const fetchEscrowRecords = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (escrowFilters.status) params.append('status_filter', escrowFilters.status);
      if (escrowFilters.dateFrom) params.append('date_from', escrowFilters.dateFrom);
      if (escrowFilters.dateTo) params.append('date_to', escrowFilters.dateTo);
      params.append('page', escrowPage.toString());
      params.append('limit', '50');
      
      const response = await axios.get(`${API_URL}/admin/escrow?${params}`, { headers });
      setEscrowRecords(response.data.escrow_records || []);
      setEscrowTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch escrow records:', error);
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
                { id: 'escrow', label: 'Escrow', icon: AlertCircle },
                { id: 'milestones', label: 'Milestones', icon: Award },
                { id: 'kyc', label: 'KYC Verification', icon: Shield },
                { id: 'leads', label: 'Leads Distribution', icon: FileText },
                { id: 'tickets', label: 'Tickets', icon: MessageCircle },
                { id: 'integrations', label: 'Integrations', icon: Link },
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
                        <option value="">All</option>
                        <option value="completed">Completed</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
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
                          <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${
                            payment.status === 'completed' || payment.status === 'success' ? 'bg-green-600 text-green-100' :
                            payment.status === 'pending' || payment.status === 'processing' ? 'bg-yellow-600 text-yellow-100' :
                            payment.status === 'failed' ? 'bg-red-600 text-red-100' :
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

        {/* Escrow Tab */}
        {activeTab === 'escrow' && (
          <div className="space-y-6">
            {/* Escrow Header & Filters */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">Escrow Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                      <select
                        value={escrowFilters.status}
                        onChange={(e) => setEscrowFilters({...escrowFilters, status: e.target.value})}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Status</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="processing">Processing</option>
                        <option value="released">Released</option>
                        <option value="partial_release">Partial Release</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                      <input
                        type="date"
                        value={escrowFilters.dateFrom}
                        onChange={(e) => setEscrowFilters({...escrowFilters, dateFrom: e.target.value})}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                      <input
                        type="date"
                        value={escrowFilters.dateTo}
                        onChange={(e) => setEscrowFilters({...escrowFilters, dateTo: e.target.value})}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEscrowFilters({ status: 'pending_review', dateFrom: '', dateTo: '' });
                      setEscrowPage(1);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const params = new URLSearchParams();
                        if (escrowFilters.status) params.append('status_filter', escrowFilters.status);
                        if (escrowFilters.dateFrom) params.append('date_from', escrowFilters.dateFrom);
                        if (escrowFilters.dateTo) params.append('date_to', escrowFilters.dateTo);
                        
                        const response = await axios.get(
                          `${process.env.REACT_APP_BACKEND_URL}/api/admin/escrow/export?${params.toString()}`,
                          { 
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                            responseType: 'blob'
                          }
                        );
                        
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `escrow_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch (error) {
                        console.error('Export failed:', error);
                        alert('Failed to export escrow data');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Escrow Table */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="pb-3 text-gray-300 font-medium">Escrow ID</th>
                      <th className="pb-3 text-gray-300 font-medium">Payment ID</th>
                      <th className="pb-3 text-gray-300 font-medium">Amount</th>
                      <th className="pb-3 text-gray-300 font-medium">Recipients</th>
                      <th className="pb-3 text-gray-300 font-medium">Reason</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Created</th>
                      <th className="pb-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrowRecords.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-400">
                          No escrow records found
                        </td>
                      </tr>
                    ) : (
                      escrowRecords.map((record) => (
                        <tr key={record.escrow_id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                          <td className="py-4 text-white">
                            <span className="text-xs font-mono">{record.escrow_id.substring(0, 8)}...</span>
                          </td>
                          <td className="py-4 text-gray-300">
                            <span className="text-xs font-mono">{record.payment_id}</span>
                          </td>
                          <td className="py-4 text-white font-semibold">
                            ${record.amount.toFixed(2)}
                          </td>
                          <td className="py-4 text-gray-300">
                            {record.commissions && record.commissions.length > 0 ? (
                              <div className="space-y-1">
                                {record.commissions.map((comm, idx) => (
                                  <div key={idx} className="text-xs">
                                    <div className="font-semibold">{comm.recipient_username}</div>
                                    <div className="text-gray-400">{comm.recipient_email}</div>
                                    <div className="text-gray-500">${comm.amount.toFixed(2)}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="py-4 text-gray-400 text-sm max-w-xs truncate">
                            {record.reason}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              record.status === 'pending_review' ? 'bg-yellow-900 bg-opacity-50 text-yellow-300' :
                              record.status === 'processing' ? 'bg-blue-900 bg-opacity-50 text-blue-300' :
                              record.status === 'released' ? 'bg-green-900 bg-opacity-50 text-green-300' :
                              record.status === 'partial_release' ? 'bg-orange-900 bg-opacity-50 text-orange-300' :
                              'bg-gray-900 bg-opacity-50 text-gray-300'
                            }`}>
                              {record.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 text-gray-400 text-sm">
                            {new Date(record.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            {record.status === 'pending_review' && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Release this escrow amount to the recipient(s)?')) return;
                                  
                                  setReleasingEscrow(record.escrow_id);
                                  try {
                                    const response = await axios.post(
                                      `${process.env.REACT_APP_BACKEND_URL}/api/admin/escrow/${record.escrow_id}/release`,
                                      {},
                                      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                                    );
                                    
                                    alert(`Escrow release ${response.data.status}: ${response.data.successful_payouts}/${response.data.total_commissions} payouts successful`);
                                    
                                    // Refresh escrow list
                                    const escrowResponse = await axios.get(
                                      `${process.env.REACT_APP_BACKEND_URL}/api/admin/escrow?page=${escrowPage}&limit=50&status_filter=${escrowFilters.status || ''}`,
                                      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                                    );
                                    setEscrowRecords(escrowResponse.data.escrow_records);
                                    setEscrowTotalPages(escrowResponse.data.total_pages);
                                  } catch (error) {
                                    console.error('Release failed:', error);
                                    alert('Failed to release escrow: ' + (error.response?.data?.detail || error.message));
                                  } finally {
                                    setReleasingEscrow(null);
                                  }
                                }}
                                disabled={releasingEscrow === record.escrow_id}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all duration-300 disabled:opacity-50"
                              >
                                {releasingEscrow === record.escrow_id ? 'Releasing...' : 'Release'}
                              </button>
                            )}
                            {record.status === 'released' && (
                              <span className="text-green-400 text-sm">✓ Complete</span>
                            )}
                            {record.status === 'partial_release' && (
                              <button
                                onClick={() => setSelectedEscrow(record)}
                                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-all duration-300"
                              >
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {escrowTotalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <button
                    onClick={() => setEscrowPage(Math.max(1, escrowPage - 1))}
                    disabled={escrowPage === 1}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <span className="text-gray-400 text-sm">
                    Page {escrowPage} of {escrowTotalPages}
                  </span>
                  
                  <button
                    onClick={() => setEscrowPage(Math.min(escrowTotalPages, escrowPage + 1))}
                    disabled={escrowPage === escrowTotalPages}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
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

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <IntegrationsTab />
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

      {/* Sendloop Integration Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 bg-opacity-50 border border-blue-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 bg-opacity-30 rounded-full p-3">
              <Mail className="h-8 w-8 text-blue-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Export to Sendloop</h3>
              <p className="text-blue-200 text-sm">
                Create automated email campaigns with your leads. Click "Export" on any file to open Sendloop.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.post(
                  `${API_URL}/sso/initiate`,
                  {
                    target_app: 'sendloop',
                    redirect_url: 'https://drip-campaign-hub.preview.emergentagent.com/dashboard'
                  },
                  { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (response.data.redirect_url) {
                  window.open(response.data.redirect_url, '_blank');
                }
              } catch (error) {
                console.error('Failed to initiate SSO:', error);
                alert('Failed to open Sendloop. Please try again.');
              }
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 whitespace-nowrap"
          >
            <ExternalLink className="h-5 w-5" />
            <span>Open Sendloop</span>
          </button>
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
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadCsvFile(file.file_id, file.filename)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                
                                // Get current user info
                                const userResponse = await axios.get(`${API_URL}/users/me`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                const userId = userResponse.data.user_id;
                                
                                // Initiate SSO with file information in redirect URL
                                const redirectUrl = `https://drip-campaign-hub.preview.emergentagent.com/import?user_id=${userId}&file_id=${file.file_id}&source=proleads`;
                                
                                const response = await axios.post(
                                  `${API_URL}/sso/initiate`,
                                  {
                                    target_app: 'sendloop',
                                    redirect_url: redirectUrl
                                  },
                                  { headers: { 'Authorization': `Bearer ${token}` } }
                                );
                                
                                if (response.data.redirect_url) {
                                  window.open(response.data.redirect_url, '_blank');
                                }
                              } catch (error) {
                                console.error('Failed to initiate SSO:', error);
                                alert('Failed to open Sendloop. Please try again.');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                            title="Export to Sendloop"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Export</span>
                          </button>
                        </div>
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

// Leads Management Tab Component for Admin (Enhanced with Duplicate Detection, Email Verification, and Scheduling)
function LeadsManagementTab() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'distributions', 'duplicates', 'schedules'
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Enhancement options
  const [checkDuplicates, setCheckDuplicates] = useState(true);
  const [validateEmails, setValidateEmails] = useState(false);

  // Schedules state
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Duplicates state
  const [duplicates, setDuplicates] = useState([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(true);

  // Overview state
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Scheduler status state
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [schedulerEvents, setSchedulerEvents] = useState([]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    } else if (activeTab === 'distributions') {
      fetchDistributions();
    } else if (activeTab === 'schedules') {
      fetchSchedules();
    } else if (activeTab === 'duplicates') {
      fetchDuplicates();
    }
  }, [page, activeTab]);

  const fetchDistributions = async () => {
    try {
      setLoading(true);
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

  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/leads/schedules?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSchedules(response.data.schedules || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchDuplicates = async () => {
    try {
      setDuplicatesLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/leads/duplicates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDuplicates(response.data.duplicates || []);
    } catch (error) {
      console.error('Failed to fetch duplicates:', error);
    } finally {
      setDuplicatesLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/leads/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [statusRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/scheduler/status`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/scheduler/events?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setSchedulerStatus(statusRes.data);
      setSchedulerEvents(eventsRes.data.events || []);
    } catch (error) {
      console.error('Failed to fetch scheduler status:', error);
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
      formData.append('check_duplicates', checkDuplicates);
      // Always skip duplicates automatically when check is enabled
      formData.append('skip_duplicates', checkDuplicates ? 'true' : 'false');
      formData.append('validate_emails', validateEmails);

      const response = await axios.post(`${API_URL}/admin/leads/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Check for duplicate error (shouldn't happen with auto-skip, but handle anyway)
      if (response.data.error === 'duplicate_in_csv' || response.data.error === 'duplicate_in_database') {
        // Auto-retry with skip_duplicates enabled
        const retryFormData = new FormData();
        retryFormData.append('csv_file', csvFile);
        retryFormData.append('check_duplicates', 'true');
        retryFormData.append('skip_duplicates', 'true');
        retryFormData.append('validate_emails', validateEmails);
        
        const retryResponse = await axios.post(`${API_URL}/admin/leads/upload`, retryFormData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        let message = `Successfully uploaded ${retryResponse.data.total_leads} valid leads (skipped ${response.data.total_duplicates} duplicates)!`;
        if (retryResponse.data.validation) {
          const stats = retryResponse.data.validation;
          if (stats.invalid_skipped > 0) {
            message = `Successfully uploaded ${retryResponse.data.total_leads} valid leads (skipped ${response.data.total_duplicates} duplicates + ${stats.invalid_skipped} invalid emails)!`;
          }
          message += `\n\nEmail Validation (${stats.total_checked} checked):\n✓ Valid & Uploaded: ${stats.valid}`;
          if (stats.invalid_skipped > 0) {
            message += `\n✗ Invalid & Skipped: ${stats.invalid_skipped}`;
            if (stats.invalid_format > 0) message += `\n  • Invalid Format: ${stats.invalid_format}`;
            if (stats.invalid_domain > 0) message += `\n  • Invalid Domain: ${stats.invalid_domain}`;
            if (stats.disposable > 0) message += `\n  • Disposable Email: ${stats.disposable}`;
            if (stats.role_based > 0) message += `\n  • Role-based Email: ${stats.role_based}`;
          }
        }
        
        alert(message);
        setCsvFile(null);
        fetchDistributions();
        setUploading(false);
        return;
      }

      let message = `Successfully uploaded ${response.data.total_leads} valid leads!`;
      if (response.data.validation) {
        const stats = response.data.validation;
        if (stats.invalid_skipped > 0) {
          message = `Successfully uploaded ${response.data.total_leads} valid leads (skipped ${stats.invalid_skipped} invalid emails)!`;
        }
        message += `\n\nEmail Validation (${stats.total_checked} checked):\n✓ Valid & Uploaded: ${stats.valid}`;
        if (stats.invalid_skipped > 0) {
          message += `\n✗ Invalid & Skipped: ${stats.invalid_skipped}`;
          if (stats.invalid_format > 0) message += `\n  • Invalid Format: ${stats.invalid_format}`;
          if (stats.invalid_domain > 0) message += `\n  • Invalid Domain: ${stats.invalid_domain}`;
          if (stats.disposable > 0) message += `\n  • Disposable Email: ${stats.disposable}`;
          if (stats.role_based > 0) message += `\n  • Role-based Email: ${stats.role_based}`;
        }
      }
      
      alert(message);
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

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/admin/leads/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Schedule deleted successfully!');
      fetchSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleSchedule = async (scheduleId, currentEnabled) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/admin/leads/schedules/${scheduleId}`, {
        enabled: !currentEnabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      alert('Failed to update schedule');
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

  const getDayName = (dayNum) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum - 1] || dayNum;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => { setActiveTab('overview'); setPage(1); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => { setActiveTab('distributions'); setPage(1); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'distributions'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Distributions
          </button>
          <button
            onClick={() => { setActiveTab('schedules'); setPage(1); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'schedules'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Schedules
          </button>
          <button
            onClick={() => { setActiveTab('duplicates'); setPage(1); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'duplicates'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Duplicates
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : overview ? (
            <>
              {/* Global Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Leads</p>
                  <p className="text-3xl font-bold text-white">{overview.total_leads.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Remaining</p>
                  <p className="text-3xl font-bold text-green-400">{overview.remaining_leads.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Distributed</p>
                  <p className="text-3xl font-bold text-blue-400">{overview.distributed_leads.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Est. Weeks Left</p>
                  <p className="text-3xl font-bold text-purple-400">{overview.estimated_weeks_remaining}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-white">Overall Distribution Progress</h3>
                  <span className="text-gray-400 text-sm">
                    {overview.total_leads > 0 ? Math.round((overview.distributed_leads / (overview.total_leads * 10)) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                    style={{width: `${overview.total_leads > 0 ? Math.min(100, (overview.distributed_leads / (overview.total_leads * 10)) * 100) : 0}%`}}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {overview.distributed_leads.toLocaleString()} of {(overview.total_leads * 10).toLocaleString()} possible distributions
                </p>
              </div>

              {/* Next Scheduled Run */}
              {overview.next_scheduled_run && (
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-blue-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Next Scheduled Distribution</h3>
                  <p className="text-gray-300"><span className="font-medium">{overview.next_schedule_name}</span></p>
                  <p className="text-blue-300 text-lg font-medium mt-1">
                    {new Date(overview.next_scheduled_run).toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Will distribute leads to {overview.eligible_members} eligible members
                  </p>
                </div>
              )}

              {/* Active CSVs */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Active CSVs ({overview.active_csvs_count})
                </h3>
                {overview.active_csvs && overview.active_csvs.length > 0 ? (
                  <div className="space-y-4">
                    {overview.active_csvs.map((csv, index) => (
                      <div key={csv.distribution_id} className="bg-black bg-opacity-30 rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {index === 0 && (
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">NEXT</span>
                              )}
                              <h4 className="text-white font-semibold">{csv.filename}</h4>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">Uploaded: {new Date(csv.uploaded_at).toLocaleDateString()}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-900 bg-opacity-50 text-green-300 text-sm rounded">
                            Active
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-gray-500 text-xs">Total</p>
                            <p className="text-white font-medium">{csv.total_leads}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Distributed</p>
                            <p className="text-blue-400 font-medium">{csv.leads_distributed}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Remaining</p>
                            <p className="text-green-400 font-medium">{csv.leads_remaining}</p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{width: `${csv.progress_percentage}%`}}
                          ></div>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{csv.progress_percentage}% distributed</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No active CSVs. Upload new leads to get started.</p>
                )}
              </div>

              {/* Exhausted CSVs */}
              {overview.exhausted_csvs && overview.exhausted_csvs.length > 0 && (
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Completed CSVs ({overview.exhausted_csvs_count})
                  </h3>
                  <div className="space-y-3">
                    {overview.exhausted_csvs.slice(0, 5).map((csv) => (
                      <div key={csv.distribution_id} className="bg-black bg-opacity-20 rounded-lg p-3 border border-gray-800">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">{csv.filename}</h4>
                            <p className="text-gray-500 text-xs mt-1">
                              {csv.total_leads} leads • Uploaded {new Date(csv.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            Completed
                          </span>
                        </div>
                      </div>
                    ))}
                    {overview.exhausted_csvs.length > 5 && (
                      <p className="text-gray-400 text-sm text-center">
                        + {overview.exhausted_csvs.length - 5} more completed
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">No overview data available</p>
          )}
        </div>
      )}

      {/* Distributions Tab */}
      {activeTab === 'distributions' && (
        <>
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

              {/* Enhancement Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkDuplicates}
                    onChange={(e) => setCheckDuplicates(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Skip Duplicates (auto-removes duplicate emails)</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validateEmails}
                    onChange={(e) => setValidateEmails(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Validate Emails (checks format & deliverability)</span>
                </label>
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
        </>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Distribution Schedules</h3>
            <button
              onClick={() => { setEditingSchedule(null); setShowScheduleModal(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
            >
              + Create Schedule
            </button>
          </div>

          {schedulesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No schedules configured yet</p>
              <button
                onClick={() => { setEditingSchedule(null); setShowScheduleModal(true); }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
              >
                Create Your First Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.schedule_id} className="bg-black bg-opacity-30 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg">{schedule.name}</h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {schedule.frequency === 'weekly' ? `Every ${getDayName(schedule.day_of_week)}` : `Monthly on day ${schedule.day_of_month}`} at {schedule.time} UTC
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={() => toggleSchedule(schedule.schedule_id, schedule.enabled)}
                          className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">
                          {schedule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
                    <div>
                      <p className="text-gray-500 text-xs">Next Run</p>
                      <p className="text-white text-sm">
                        {schedule.next_run ? new Date(schedule.next_run).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Last Run</p>
                      <p className="text-white text-sm">
                        {schedule.last_run ? new Date(schedule.last_run).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Run Count</p>
                      <p className="text-white text-sm">{schedule.run_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Min Leads Required</p>
                      <p className="text-white text-sm">{schedule.min_leads_required}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => { setEditingSchedule(schedule); setShowScheduleModal(true); }}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.schedule_id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-all duration-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Duplicates Tab */}
      {activeTab === 'duplicates' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Duplicate Email Addresses</h3>

          {duplicatesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : duplicates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No duplicate email addresses found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 mb-4">Found {duplicates.length} emails with duplicates</p>
              {duplicates.map((dup, index) => (
                <div key={index} className="bg-black bg-opacity-30 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{dup._id}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {dup.count} occurrences across {dup.distributions.filter((v, i, a) => a.indexOf(v) === i).length} distributions
                      </p>
                      {dup.names && dup.names.length > 0 && (
                        <p className="text-gray-500 text-xs mt-1">
                          Names: {dup.names.filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ')}
                          {dup.names.length > 3 && '...'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-yellow-900 bg-opacity-50 text-yellow-300 text-sm rounded">
                        {dup.count}x
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          schedule={editingSchedule}
          onClose={() => { setShowScheduleModal(false); setEditingSchedule(null); }}
          onSuccess={() => { fetchSchedules(); setShowScheduleModal(false); setEditingSchedule(null); }}
        />
      )}
    </div>
  );
}

// Schedule Creation/Edit Modal Component
function ScheduleModal({ schedule, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    frequency: schedule?.frequency || 'weekly',
    day_of_week: schedule?.day_of_week || 1,
    day_of_month: schedule?.day_of_month || 1,
    time: schedule?.time || '09:00',
    min_leads_required: schedule?.min_leads_required || 50,
    enabled: schedule?.enabled !== undefined ? schedule.enabled : true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      if (schedule) {
        // Update existing schedule
        await axios.put(`${API_URL}/admin/leads/schedules/${schedule.schedule_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Schedule updated successfully!');
      } else {
        // Create new schedule
        await axios.post(`${API_URL}/admin/leads/schedules`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Schedule created successfully!');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {schedule ? 'Edit Schedule' : 'Create Schedule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Schedule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Weekly Bronze Distribution"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {formData.frequency === 'weekly' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Day of Week</label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="7">Sunday</option>
              </select>
            </div>
          )}

          {formData.frequency === 'monthly' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.day_of_month}
                onChange={(e) => setFormData({ ...formData, day_of_month: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Time (UTC)</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Minimum Leads Required</label>
            <input
              type="number"
              min="1"
              value={formData.min_leads_required}
              onChange={(e) => setFormData({ ...formData, min_leads_required: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
            <p className="text-gray-500 text-xs mt-1">Schedule will be skipped if fewer leads are available</p>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-300 text-sm">Enable schedule immediately</span>
          </label>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {saving ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
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

// Integrations Tab Component for Admin (API Key Management)
function IntegrationsTab() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);
  const [formData, setFormData] = useState({
    integration_name: 'automailer',
    description: '',
    permissions: ['csv_export', 'user_info', 'sso_verify'],
    rate_limit: 100
  });

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/integrations/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApiKeys(response.data.api_keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      alert('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_URL}/admin/integrations/api-keys`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Show the created key (only shown once!)
      setCreatedKey(response.data.api_key);
      setShowCreateModal(false);
      
      // Refresh the list
      fetchAPIKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/admin/integrations/api-keys/${keyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('API key revoked successfully');
      fetchAPIKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Failed to revoke API key');
    }
  };

  const handleRotateKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to rotate this API key? The old key will be valid for 24 hours.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_URL}/admin/integrations/api-keys/${keyId}/rotate`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Show the new key
      setCreatedKey({ api_key: response.data.new_api_key, key_id: keyId });
      fetchAPIKeys();
    } catch (error) {
      console.error('Failed to rotate API key:', error);
      alert('Failed to rotate API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">API Key Management</h2>
          <p className="text-gray-400 mt-2">Manage API keys for external integrations (AutoMailer, etc.)</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create API Key</span>
        </button>
      </div>

      {/* API Keys List */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API keys created yet</p>
            <p className="text-sm mt-2">Create your first API key to enable integrations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black bg-opacity-30 text-gray-300 text-sm">
                  <th className="px-6 py-4 text-left font-medium">Integration</th>
                  <th className="px-6 py-4 text-left font-medium">Description</th>
                  <th className="px-6 py-4 text-left font-medium">Permissions</th>
                  <th className="px-6 py-4 text-left font-medium">Rate Limit</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-left font-medium">Usage</th>
                  <th className="px-6 py-4 text-left font-medium">Last Used</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {apiKeys.map((key) => (
                  <tr key={key.key_id} className="text-gray-300 hover:bg-white hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link className="h-5 w-5 text-red-400" />
                        <span className="font-medium text-white">{key.integration_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{key.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 bg-blue-600 bg-opacity-30 text-blue-300 text-xs rounded"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {key.rate_limit}/{key.rate_limit_period}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          key.status === 'active'
                            ? 'bg-green-600 bg-opacity-30 text-green-300'
                            : key.status === 'rotating'
                            ? 'bg-yellow-600 bg-opacity-30 text-yellow-300'
                            : 'bg-red-600 bg-opacity-30 text-red-300'
                        }`}
                      >
                        {key.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{key.usage_count || 0} requests</td>
                    <td className="px-6 py-4 text-sm">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleRotateKey(key.key_id)}
                          className="p-2 hover:bg-yellow-600 hover:bg-opacity-20 rounded-lg transition-colors"
                          title="Rotate API Key"
                        >
                          <RotateCw className="h-4 w-4 text-yellow-400" />
                        </button>
                        <button
                          onClick={() => handleRevokeKey(key.key_id)}
                          className="p-2 hover:bg-red-600 hover:bg-opacity-20 rounded-lg transition-colors"
                          title="Revoke API Key"
                          disabled={key.status === 'revoked'}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-red-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Create New API Key</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Integration Name</label>
                <input
                  type="text"
                  value={formData.integration_name}
                  onChange={(e) => setFormData({ ...formData, integration_name: e.target.value })}
                  className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., automailer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  rows="3"
                  placeholder="e.g., Production API key for AutoMailer integration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
                <div className="space-y-2">
                  {['csv_export', 'user_info', 'sso_verify'].map((perm) => (
                    <label key={perm} className="flex items-center space-x-3 text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [...formData.permissions, perm]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter((p) => p !== perm)
                            });
                          }
                        }}
                        className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rate Limit (requests per hour)</label>
                <input
                  type="number"
                  value={formData.rate_limit}
                  onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all"
              >
                Create API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show Created Key Modal (Only shown once!) */}
      {createdKey && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-green-900 rounded-xl p-8 max-w-2xl w-full">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <h3 className="text-2xl font-bold text-white">API Key Created Successfully!</h3>
            </div>
            
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 font-medium mb-2">⚠️ Important: Save this key now!</p>
              <p className="text-yellow-200 text-sm">
                This API key will only be displayed once. Make sure to copy and store it securely.
              </p>
            </div>

            <div className="bg-black bg-opacity-50 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">API Key:</span>
                <button
                  onClick={() => copyToClipboard(createdKey.api_key)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-all flex items-center space-x-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              </div>
              <code className="text-green-400 text-sm break-all">{createdKey.api_key}</code>
            </div>

            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <p>• Store this key in a secure location (password manager, secrets vault)</p>
              <p>• Add it to your AutoMailer environment variables</p>
              <p>• Never expose it in client-side code or public repositories</p>
            </div>

            <button
              onClick={() => setCreatedKey(null)}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all"
            >
              I've Saved the Key
            </button>
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
