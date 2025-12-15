import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, Shield, AlertCircle, CheckCircle, Clock, AlertTriangle, XCircle, Award, X } from 'lucide-react';

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

//=====================================================
// ADMIN DASHBOARD COMPONENT
//=====================================================

export default KYCVerificationTab;
