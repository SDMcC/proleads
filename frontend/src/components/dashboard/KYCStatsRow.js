import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, DollarSign, TrendingUp, Award, Shield, CheckCircle, Copy } from 'lucide-react';
import { getTierDisplayName } from '../../utils/helpers';
import KYCEarningsCard from './KYCEarningsCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// StatCard component
function StatCard({ icon, title, value, subtitle, bgColor, action }) {
  return (
    <div className={`${bgColor} backdrop-blur-sm rounded-xl p-6 flex items-center justify-between`}>
      <div>
        <div className="flex items-center space-x-2 mb-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-sm text-gray-300 mt-1">{subtitle}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

function KYCStatsRow({ stats, user, onNavigateToKYC, subscriptionInfo, handleRenewSubscription }) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Earnings */}
      <StatCard
        icon={<DollarSign className="h-8 w-8 text-green-400" />}
        title="Total Earnings"
        value={`$${stats?.total_earnings?.toFixed(2) || '0.00'} USDC`}
        subtitle="Completed payments"
      />

      {/* Total Referrals */}
      <StatCard
        icon={<Users className="h-8 w-8 text-blue-400" />}
        title="Total Referrals"
        value={stats?.total_referrals || 0}
        subtitle="All levels"
      />

      {/* Membership Tier with Expiry */}
      <StatCard
        icon={<Award className="h-8 w-8 text-purple-400" />}
        title="Membership Tier"
        value={getTierDisplayName(user?.membership_tier || 'affiliate').toUpperCase()}
        subtitle={(() => {
          const tier = user?.membership_tier;
          // Show subscription expiry if available
          if (subscriptionInfo) {
            if (subscriptionInfo.isExpired) {
              return <span className="text-red-400">Expired {subscriptionInfo.date}</span>;
            } else if (subscriptionInfo.isExpiringSoon) {
              return <span className="text-yellow-400">Expires in {subscriptionInfo.daysRemaining} days</span>;
            } else {
              return <span className="text-green-400">Expires {subscriptionInfo.date}</span>;
            }
          }
          // No expiry date and free tier
          if (tier === 'affiliate' || tier === 'vip_affiliate') return 'Free Tier';
          // Paid tier but no expiry date set
          return <span className="text-gray-400">No active subscription</span>;
        })()}
        action={
          <div className="flex flex-col gap-2 mt-2 w-full">
            {(() => {
              const currentTier = user?.membership_tier;
              const isPaidTier = currentTier && currentTier !== 'affiliate' && currentTier !== 'vip_affiliate';
              
              return (
                <>
                  {/* Always show Upgrade button */}
                  <button
                    onClick={() => window.location.href = '/payment'}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-300"
                  >
                    {isPaidTier ? 'Change Tier' : 'Upgrade'}
                  </button>
                  
                  {/* Show Renew button only for paid tiers */}
                  {isPaidTier && (
                    <button
                      onClick={() => handleRenewSubscription(currentTier)}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-300"
                    >
                      Renew
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        }
      />

      {/* KYC Status */}
      <StatCard
        icon={<Shield className={`h-8 w-8 ${isVerified ? 'text-green-400' : 'text-gray-400'}`} />}
        title="KYC Status"
        value={
          isVerified ? (
            <span className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <span>Verified</span>
            </span>
          ) : (
            <span className="text-gray-400">Not Verified</span>
          )
        }
        subtitle={isVerified ? "Unlimited earnings" : "Verify to unlock"}
        action={
          !isVerified && !loading && (
            <button
              onClick={onNavigateToKYC}
              className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-300"
            >
              Verify Now
            </button>
          )
        }
      />
    </div>
  );
}

function OverviewTab({ stats, user, onNavigateToKYC, handleRenewSubscription }) {
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

  // Calculate subscription expiry
  const getSubscriptionExpiry = () => {
    if (!user?.subscription_expires_at) return null;
    const expiryDate = new Date(user.subscription_expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      date: expiryDate.toLocaleDateString(),
      daysRemaining: daysRemaining,
      isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
      isExpired: daysRemaining <= 0
    };
  };

  const subscriptionInfo = getSubscriptionExpiry();

  return (
    <div>
      {/* Top Stats Cards Row */}
      <KYCStatsRow stats={stats} user={user} onNavigateToKYC={onNavigateToKYC} subscriptionInfo={subscriptionInfo} handleRenewSubscription={handleRenewSubscription} />

      {/* KYC Earnings Card - Full Width for Unverified Users */}
      <KYCEarningsCard user={user} onNavigateToKYC={onNavigateToKYC} />

      {/* Referral Link - Full Width */}
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

      {/* Two Column Layout - Recent Commissions & Recent Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Commissions */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Recent Commissions</h3>
          <div className="space-y-4">
            {stats?.recent_commissions?.length > 0 ? (
              stats.recent_commissions.slice(0, 5).map((commission, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-600 last:border-b-0">
                  <div>
                    <p className="text-white font-medium">${commission.amount?.toFixed(2)} USDC</p>
                    <p className="text-gray-400 text-sm">
                      Level {commission.level} • {Math.round((commission.commission_rate || 0) * 100)}%
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
              <p className="text-gray-400 text-center py-8">No commissions yet. Start referring to earn!</p>
            )}
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Recent Referrals</h3>
          <div className="space-y-4">
            {stats?.recent_referrals?.length > 0 ? (
              stats.recent_referrals.slice(0, 5).map((referral, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-600 last:border-b-0">
                  <div>
                    <p className="text-white font-medium">{referral.username || 'Unknown User'}</p>
                    <p className="text-gray-400 text-sm">
                      {referral.membership_tier?.toUpperCase() || 'AFFILIATE'} • Level {referral.level || 1}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No referrals yet. Share your link to grow your network!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// KYC Earnings Card Component

export default KYCStatsRow;
