import React from 'react';

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

export default TermsPage;
