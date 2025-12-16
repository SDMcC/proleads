import React from 'react';
import { Shield, Eye, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Helper component to display KYC document images
const KYCDocumentImage = ({ filename, alt }) => {
  if (!filename) return null;
  
  // Images are stored on FTP server at: https://files.proleads.network/uploads/kyc_documents/
  // Filename is just the file name (e.g., "0x123_id_document_abc123.jpg")
  let imageUrl;
  
  if (filename.startsWith('http')) {
    // Already a full URL
    imageUrl = filename;
  } else if (filename.includes('kyc_documents/')) {
    // Filename includes path, just add base URL
    imageUrl = `https://files.proleads.network/uploads/${filename}`;
  } else {
    // Just filename, add full path
    imageUrl = `https://files.proleads.network/uploads/kyc_documents/${filename}`;
  }
  
  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className="w-full rounded-lg"
      onError={(e) => {
        console.error('Failed to load KYC image:', imageUrl);
        e.target.onerror = null;
        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
      }}
    />
  );
};

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

export default AdminKYCTab;
