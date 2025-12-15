import React from 'react';
import { Copy } from 'lucide-react';
import KYCStatsRow from '../KYCStatsRow';
import KYCEarningsCard from '../KYCEarningsCard';

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


export default OverviewTab;
