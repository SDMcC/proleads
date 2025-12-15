import React from 'react';
import { Sun, Moon, Users, ExternalLink, DollarSign, CheckCircle, Zap, TrendingUp, Award, Target, Activity } from 'lucide-react';
import Footer from '../components/landing/Footer';

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

export default AffiliatesPage;
