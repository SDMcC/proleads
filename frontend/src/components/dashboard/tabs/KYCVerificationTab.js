import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

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

export default KYCVerificationTab;
