import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Copy, Check } from 'lucide-react';
import { getTierDisplayName } from '../../../utils/helpers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function ReferralsTab() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total_referrals: 0,
    active_referrals: 0,
    tier_counts: {},
    total_sub_referrals: 0
  });
  const limit = 10;

  useEffect(() => {
    fetchReferrals();
  }, [currentPage]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/referrals?page=${currentPage}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReferrals(response.data.referrals || []);
      setTotalReferrals(response.data.total_count || 0);
      setTotalPages(response.data.total_pages || 1);
      setStats(response.data.stats || {
        total_referrals: 0,
        active_referrals: 0,
        tier_counts: {},
        total_sub_referrals: 0
      });
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
      alert('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'gold':
        return 'bg-yellow-600 bg-opacity-20 text-yellow-300';
      case 'silver':
        return 'bg-gray-600 bg-opacity-20 text-gray-300';
      case 'bronze':
        return 'bg-orange-600 bg-opacity-20 text-orange-300';
      default:
        return 'bg-blue-600 bg-opacity-20 text-blue-300';
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active'
      ? 'bg-green-600 bg-opacity-20 text-green-300'
      : 'bg-red-600 bg-opacity-20 text-red-300';
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
        <h2 className="text-2xl font-bold text-white">My Referrals</h2>
        <div className="text-gray-300">
          {totalReferrals} referral{totalReferrals !== 1 ? 's' : ''} total
        </div>
      </div>

      {referrals.length === 0 ? (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Referrals Yet</h3>
          <p className="text-gray-300">Start sharing your referral link to build your network!</p>
        </div>
      ) : (
        <>
          {/* Referrals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total_referrals}</div>
              <div className="text-gray-300 text-sm">Total Referrals</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.active_referrals}
              </div>
              <div className="text-gray-300 text-sm">Active</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {stats.tier_counts?.bronze || 0}
              </div>
              <div className="text-gray-300 text-sm">Bronze Members</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats.total_sub_referrals}
              </div>
              <div className="text-gray-300 text-sm">Sub-Referrals</div>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 text-gray-300 font-medium">Member</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Email</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Tier</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Referrals</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.user_id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {referral.username ? referral.username.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-white font-medium">{referral.username || 'Unknown'}</div>
                            <div className="text-gray-400 text-sm">{referral.address?.slice(0, 8)}...{referral.address?.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{referral.email || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-sm font-medium capitalize ${getTierBadgeClass(referral.membership_tier)}`}>
                          {getTierDisplayName(referral.membership_tier)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-sm font-medium capitalize ${getStatusBadgeClass(referral.status)}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{referral.referral_count}</span>
                          {referral.referral_count > 0 && (
                            <Users className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {referral.joined_date ? new Date(referral.joined_date).toLocaleDateString() : 'N/A'}
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
                          ? 'bg-blue-600 text-white'
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

// Autoresponder Tab Component

export default ReferralsTab;
