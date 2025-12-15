import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Filter, FileText } from 'lucide-react';
import { getTierDisplayName } from '../../../utils/helpers';

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
    default:
      return 'bg-blue-600 text-blue-100';
  }
};

function PaymentHistoryTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, tierFilter, dateFrom, dateTo, page]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (tierFilter) params.append('tier_filter', tierFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await axios.get(`${API_URL}/users/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPayments(response.data.payments || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPaymentsCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (tierFilter) params.append('tier_filter', tierFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await axios.get(`${API_URL}/users/payments/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export payments:', error);
      alert('Failed to export payments CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-4">Payment History</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Tier</label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Tiers</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter('');
                setTierFilter('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
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
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="pb-3 text-gray-300 font-medium">Payment ID</th>
                  <th className="pb-3 text-gray-300 font-medium">Amount</th>
                  <th className="pb-3 text-gray-300 font-medium">Currency</th>
                  <th className="pb-3 text-gray-300 font-medium">Tier</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Date</th>
                  <th className="pb-3 text-gray-300 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={index} className="border-b border-gray-700 last:border-b-0">
                    <td className="py-3">
                      <p className="text-white font-mono text-sm">{payment.id?.toString()?.slice(0, 8)}...{payment.id?.toString()?.slice(-6)}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-white font-bold">${payment.amount}</p>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-gray-600 text-gray-100 rounded text-xs uppercase font-medium">
                        {payment.currency}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-medium ${getTierBadgeClass(payment.tier)}`}>
                        {getTierDisplayName(payment.tier)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'confirmed' ? 'bg-green-600 text-green-100' :
                        payment.status === 'confirming' ? 'bg-yellow-600 text-yellow-100' :
                        payment.status === 'waiting' ? 'bg-blue-600 text-blue-100' :
                        payment.status === 'partially_paid' ? 'bg-orange-600 text-orange-100' :
                        payment.status === 'failed' ? 'bg-red-600 text-red-100' :
                        payment.status === 'expired' ? 'bg-gray-600 text-gray-100' :
                        payment.status === 'refunded' ? 'bg-purple-600 text-purple-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {payment.payment_url && payment.status === 'waiting' && (
                        <a
                          href={payment.payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all duration-300"
                        >
                          Pay Now
                        </a>
                      )}
                      {payment.status === 'confirmed' && (
                        <span className="text-green-400 text-sm font-medium">✓ Paid</span>
                      )}
                      {payment.status === 'failed' && (
                        <span className="text-red-400 text-sm font-medium">✗ Failed</span>
                      )}
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
    </div>
  );
}


export default PaymentHistoryTab;
