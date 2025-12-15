import React, { useEffect } from 'react';
import { Award, Download, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';

function AdminMilestonesTab({ 
  milestones, 
  page, 
  setPage, 
  totalPages, 
  filters, 
  setFilters, 
  onMarkAsPaid, 
  onExport,
  selectedMilestone,
  setSelectedMilestone,
  showModal,
  setShowModal
}) {
  // Get last 30 days date for default filter
  const getLast30DaysDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  // Set default date filter to last 30 days if not set
  useEffect(() => {
    if (!filters.dateFrom && !filters.dateTo) {
      setFilters(prev => ({
        ...prev,
        dateFrom: getLast30DaysDate()
      }));
    }
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      user: '',
      dateFrom: getLast30DaysDate(),
      dateTo: '',
      minAmount: '',
      status: ''
    });
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Milestones Management</h2>
        <button
          onClick={onExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              placeholder="Filter by username"
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Award Amount</label>
            <select
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Awards</option>
              <option value="25">$25 (25 referrals)</option>
              <option value="100">$100 (100 referrals)</option>
              <option value="250">$250 (250 referrals)</option>
              <option value="1000">$1000 (1000 referrals)</option>
              <option value="2500">$2500 (5000 referrals)</option>
              <option value="5000">$5000 (10000 referrals)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={clearFilters}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Milestones Table */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white bg-opacity-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Referrals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Milestone Award</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {milestones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No milestones found
                  </td>
                </tr>
              ) : (
                milestones.map((milestone) => (
                  <tr key={milestone.milestone_id} className="hover:bg-white hover:bg-opacity-5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(milestone.achieved_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{milestone.username}</div>
                      <div className="text-sm text-gray-400">{milestone.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {milestone.total_referrals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                      ${milestone.bonus_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeClass(milestone.status)}`}>
                        {milestone.status === 'pending' ? 'Pending' : 'Paid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewMilestone(milestone)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white bg-opacity-10 px-6 py-3 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  Showing page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNumber
                            ? 'z-10 bg-red-600 border-red-600 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Milestone Details Modal */}
      {showModal && selectedMilestone && (
        <MilestoneDetailsModal
          milestone={selectedMilestone}
          onClose={() => {
            setShowModal(false);
            setSelectedMilestone(null);
          }}
          onMarkAsPaid={onMarkAsPaid}
        />
      )}
    </div>
  );
}

// Milestone Details Modal Component
function MilestoneDetailsModal({ milestone, onClose, onMarkAsPaid }) {
  const handleMarkAsPaid = () => {
    onMarkAsPaid(milestone.milestone_id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-white">Milestone Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* User Information */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">User Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Username:</span>
                <span className="text-white font-medium">{milestone.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Email:</span>
                <span className="text-white font-medium">{milestone.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Wallet Address:</span>
                <span className="text-white font-medium text-xs break-all">{milestone.wallet_address}</span>
              </div>
            </div>
          </div>

          {/* Milestone Information */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Milestone Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Achievement Date:</span>
                <span className="text-white font-medium">
                  {new Date(milestone.achieved_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Milestone Target:</span>
                <span className="text-white font-medium">{milestone.milestone_count} referrals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Current Referrals:</span>
                <span className="text-white font-medium">{milestone.total_referrals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Bonus Amount:</span>
                <span className="text-green-400 font-bold text-lg">${milestone.bonus_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  milestone.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {milestone.status === 'pending' ? 'Pending' : 'Paid'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {milestone.status === 'pending' && (
              <button
                onClick={handleMarkAsPaid}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                Mark as Paid
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Tab Component

export default AdminMilestonesTab;
