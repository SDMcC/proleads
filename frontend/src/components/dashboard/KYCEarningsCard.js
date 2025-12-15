import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

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


export default KYCEarningsCard;
