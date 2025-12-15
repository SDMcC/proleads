import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileSpreadsheet, ChevronLeft, ChevronRight, Download, Eye, Upload, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function LeadsManagementTab() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'distributions', 'duplicates', 'schedules'
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Enhancement options
  const [checkDuplicates, setCheckDuplicates] = useState(true);
  const [validateEmails, setValidateEmails] = useState(false);

  // Schedules state
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Duplicates state
  const [duplicates, setDuplicates] = useState([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(true);

  // Overview state
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Scheduler status state
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [schedulerEvents, setSchedulerEvents] = useState([]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    } else if (activeTab === 'distributions') {
      fetchDistributions();
    } else if (activeTab === 'schedules') {
      fetchSchedules();
    } else if (activeTab === 'duplicates') {
      fetchDuplicates();
    }
  }, [page, activeTab]);

  const fetchDistributions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/leads/distributions?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDistributions(response.data.distributions || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/leads/schedules?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSchedules(response.data.schedules || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchDuplicates = async () => {
    try {
      setDuplicatesLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/leads/duplicates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDuplicates(response.data.duplicates || []);
    } catch (error) {
      console.error('Failed to fetch duplicates:', error);
    } finally {
      setDuplicatesLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/leads/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [statusRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/scheduler/status`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/scheduler/events?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setSchedulerStatus(statusRes.data);
      setSchedulerEvents(eventsRes.data.events || []);
    } catch (error) {
      console.error('Failed to fetch scheduler status:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setUploading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('csv_file', csvFile);
      formData.append('check_duplicates', checkDuplicates);
      // Always skip duplicates automatically when check is enabled
      formData.append('skip_duplicates', checkDuplicates ? 'true' : 'false');
      formData.append('validate_emails', validateEmails);

      const response = await axios.post(`${API_URL}/admin/leads/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Check for duplicate error (shouldn't happen with auto-skip, but handle anyway)
      if (response.data.error === 'duplicate_in_csv' || response.data.error === 'duplicate_in_database') {
        // Auto-retry with skip_duplicates enabled
        const retryFormData = new FormData();
        retryFormData.append('csv_file', csvFile);
        retryFormData.append('check_duplicates', 'true');
        retryFormData.append('skip_duplicates', 'true');
        retryFormData.append('validate_emails', validateEmails);
        
        const retryResponse = await axios.post(`${API_URL}/admin/leads/upload`, retryFormData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        let message = `Successfully uploaded ${retryResponse.data.total_leads} valid leads (skipped ${response.data.total_duplicates} duplicates)!`;
        if (retryResponse.data.validation) {
          const stats = retryResponse.data.validation;
          if (stats.invalid_skipped > 0) {
            message = `Successfully uploaded ${retryResponse.data.total_leads} valid leads (skipped ${response.data.total_duplicates} duplicates + ${stats.invalid_skipped} invalid emails)!`;
          }
          message += `\n\nEmail Validation (${stats.total_checked} checked):\n✓ Valid & Uploaded: ${stats.valid}`;
          if (stats.invalid_skipped > 0) {
            message += `\n✗ Invalid & Skipped: ${stats.invalid_skipped}`;
            if (stats.invalid_format > 0) message += `\n  • Invalid Format: ${stats.invalid_format}`;
            if (stats.invalid_domain > 0) message += `\n  • Invalid Domain: ${stats.invalid_domain}`;
            if (stats.disposable > 0) message += `\n  • Disposable Email: ${stats.disposable}`;
            if (stats.role_based > 0) message += `\n  • Role-based Email: ${stats.role_based}`;
          }
        }
        
        alert(message);
        setCsvFile(null);
        fetchDistributions();
        setUploading(false);
        return;
      }

      let message = `Successfully uploaded ${response.data.total_leads} valid leads!`;
      if (response.data.validation) {
        const stats = response.data.validation;
        if (stats.invalid_skipped > 0) {
          message = `Successfully uploaded ${response.data.total_leads} valid leads (skipped ${stats.invalid_skipped} invalid emails)!`;
        }
        message += `\n\nEmail Validation (${stats.total_checked} checked):\n✓ Valid & Uploaded: ${stats.valid}`;
        if (stats.invalid_skipped > 0) {
          message += `\n✗ Invalid & Skipped: ${stats.invalid_skipped}`;
          if (stats.invalid_format > 0) message += `\n  • Invalid Format: ${stats.invalid_format}`;
          if (stats.invalid_domain > 0) message += `\n  • Invalid Domain: ${stats.invalid_domain}`;
          if (stats.disposable > 0) message += `\n  • Disposable Email: ${stats.disposable}`;
          if (stats.role_based > 0) message += `\n  • Role-based Email: ${stats.role_based}`;
        }
      }
      
      alert(message);
      setCsvFile(null);
      fetchDistributions();
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      alert('Failed to upload CSV file: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const triggerDistribution = async (distributionId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/admin/leads/distribute/${distributionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Lead distribution started successfully!');
      fetchDistributions();
    } catch (error) {
      console.error('Failed to trigger distribution:', error);
      alert('Failed to trigger distribution: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/admin/leads/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Schedule deleted successfully!');
      fetchSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleSchedule = async (scheduleId, currentEnabled) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/admin/leads/schedules/${scheduleId}`, {
        enabled: !currentEnabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      alert('Failed to update schedule');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-600 text-green-100';
      case 'processing': return 'bg-yellow-600 text-yellow-100';
      case 'queued': return 'bg-blue-600 text-blue-100';
      case 'failed': return 'bg-red-600 text-red-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getDayName = (dayNum) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum - 1] || dayNum;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => { setActiveTab('overview'); setPage(1); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => { setActiveTab('distributions'); setPage(1); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'distributions'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Distributions
          </button>
          <button
            onClick={() => { setActiveTab('schedules'); setPage(1); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'schedules'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Schedules
          </button>
          <button
            onClick={() => { setActiveTab('duplicates'); setPage(1); }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'duplicates'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Duplicates
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : overview ? (
            <>
              {/* Global Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Leads</p>
                  <p className="text-3xl font-bold text-white">{overview.total_leads.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Remaining</p>
                  <p className="text-3xl font-bold text-green-400">{overview.remaining_leads.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Distributed</p>
                  <p className="text-3xl font-bold text-blue-400">{overview.distributed_leads.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Est. Weeks Left</p>
                  <p className="text-3xl font-bold text-purple-400">{overview.estimated_weeks_remaining}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-white">Overall Distribution Progress</h3>
                  <span className="text-gray-400 text-sm">
                    {overview.total_leads > 0 ? Math.round((overview.distributed_leads / (overview.total_leads * 10)) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                    style={{width: `${overview.total_leads > 0 ? Math.min(100, (overview.distributed_leads / (overview.total_leads * 10)) * 100) : 0}%`}}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {overview.distributed_leads.toLocaleString()} of {(overview.total_leads * 10).toLocaleString()} possible distributions
                </p>
              </div>

              {/* Next Scheduled Run */}
              {overview.next_scheduled_run && (
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-blue-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Next Scheduled Distribution</h3>
                  <p className="text-gray-300"><span className="font-medium">{overview.next_schedule_name}</span></p>
                  <p className="text-blue-300 text-lg font-medium mt-1">
                    {new Date(overview.next_scheduled_run).toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Will distribute leads to {overview.eligible_members} eligible members
                  </p>
                </div>
              )}

              {/* Active CSVs */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Active CSVs ({overview.active_csvs_count})
                </h3>
                {overview.active_csvs && overview.active_csvs.length > 0 ? (
                  <div className="space-y-4">
                    {overview.active_csvs.map((csv, index) => (
                      <div key={csv.distribution_id} className="bg-black bg-opacity-30 rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {index === 0 && (
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">NEXT</span>
                              )}
                              <h4 className="text-white font-semibold">{csv.filename}</h4>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">Uploaded: {new Date(csv.uploaded_at).toLocaleDateString()}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-900 bg-opacity-50 text-green-300 text-sm rounded">
                            Active
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-gray-500 text-xs">Total</p>
                            <p className="text-white font-medium">{csv.total_leads}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Distributed</p>
                            <p className="text-blue-400 font-medium">{csv.leads_distributed}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Remaining</p>
                            <p className="text-green-400 font-medium">{csv.leads_remaining}</p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{width: `${csv.progress_percentage}%`}}
                          ></div>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{csv.progress_percentage}% distributed</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No active CSVs. Upload new leads to get started.</p>
                )}
              </div>

              {/* Exhausted CSVs */}
              {overview.exhausted_csvs && overview.exhausted_csvs.length > 0 && (
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Completed CSVs ({overview.exhausted_csvs_count})
                  </h3>
                  <div className="space-y-3">
                    {overview.exhausted_csvs.slice(0, 5).map((csv) => (
                      <div key={csv.distribution_id} className="bg-black bg-opacity-20 rounded-lg p-3 border border-gray-800">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">{csv.filename}</h4>
                            <p className="text-gray-500 text-xs mt-1">
                              {csv.total_leads} leads • Uploaded {new Date(csv.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            Completed
                          </span>
                        </div>
                      </div>
                    ))}
                    {overview.exhausted_csvs.length > 5 && (
                      <p className="text-gray-400 text-sm text-center">
                        + {overview.exhausted_csvs.length - 5} more completed
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">No overview data available</p>
          )}
        </div>
      )}

      {/* Distributions Tab */}
      {activeTab === 'distributions' && (
        <>
          {/* Upload CSV Section */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Upload Lead CSV</h3>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  CSV File (must contain: Name, Email, Address columns)
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  required
                />
              </div>

              {/* Enhancement Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkDuplicates}
                    onChange={(e) => setCheckDuplicates(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Skip Duplicates (auto-removes duplicate emails)</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validateEmails}
                    onChange={(e) => setValidateEmails(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Validate Emails (checks format & deliverability)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </form>
          </div>

          {/* Distributions List */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Lead Distributions</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="pb-3 text-gray-300 font-medium">Filename</th>
                      <th className="pb-3 text-gray-300 font-medium">Total Leads</th>
                      <th className="pb-3 text-gray-300 font-medium">Distributed</th>
                      <th className="pb-3 text-gray-300 font-medium">Remaining</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Uploaded</th>
                      <th className="pb-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map((dist, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-b-0">
                        <td className="py-3">
                          <p className="text-white font-medium">{dist.filename}</p>
                          <p className="text-gray-400 text-sm">Uploaded by {dist.uploaded_by}</p>
                        </td>
                        <td className="py-3 text-white">{dist.total_leads}</td>
                        <td className="py-3 text-green-400">{dist.distributed_count}</td>
                        <td className="py-3 text-orange-400">{dist.remaining_leads}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(dist.status)}`}>
                            {dist.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">
                          {new Date(dist.uploaded_at).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          {(dist.status === 'queued' || dist.status === 'failed') && (
                            <button
                              onClick={() => triggerDistribution(dist.distribution_id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all duration-300"
                            >
                              {dist.status === 'failed' ? 'Retry' : 'Distribute'}
                            </button>
                          )}
                          {dist.status === 'processing' && (
                            <span className="text-yellow-400 text-sm">Processing...</span>
                          )}
                          {dist.status === 'completed' && (
                            <span className="text-green-400 text-sm">✓ Complete</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {distributions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No lead distributions found</p>
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
        </>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Distribution Schedules</h3>
            <button
              onClick={() => { setEditingSchedule(null); setShowScheduleModal(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
            >
              + Create Schedule
            </button>
          </div>

          {schedulesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No schedules configured yet</p>
              <button
                onClick={() => { setEditingSchedule(null); setShowScheduleModal(true); }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
              >
                Create Your First Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.schedule_id} className="bg-black bg-opacity-30 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg">{schedule.name}</h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {schedule.frequency === 'weekly' ? `Every ${getDayName(schedule.day_of_week)}` : `Monthly on day ${schedule.day_of_month}`} at {schedule.time} UTC
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={() => toggleSchedule(schedule.schedule_id, schedule.enabled)}
                          className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">
                          {schedule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
                    <div>
                      <p className="text-gray-500 text-xs">Next Run</p>
                      <p className="text-white text-sm">
                        {schedule.next_run ? new Date(schedule.next_run).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Last Run</p>
                      <p className="text-white text-sm">
                        {schedule.last_run ? new Date(schedule.last_run).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Run Count</p>
                      <p className="text-white text-sm">{schedule.run_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Min Leads Required</p>
                      <p className="text-white text-sm">{schedule.min_leads_required}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => { setEditingSchedule(schedule); setShowScheduleModal(true); }}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.schedule_id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-all duration-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Duplicates Tab */}
      {activeTab === 'duplicates' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Duplicate Email Addresses</h3>

          {duplicatesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : duplicates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No duplicate email addresses found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 mb-4">Found {duplicates.length} emails with duplicates</p>
              {duplicates.map((dup, index) => (
                <div key={index} className="bg-black bg-opacity-30 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{dup._id}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {dup.count} occurrences across {dup.distributions.filter((v, i, a) => a.indexOf(v) === i).length} distributions
                      </p>
                      {dup.names && dup.names.length > 0 && (
                        <p className="text-gray-500 text-xs mt-1">
                          Names: {dup.names.filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ')}
                          {dup.names.length > 3 && '...'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-yellow-900 bg-opacity-50 text-yellow-300 text-sm rounded">
                        {dup.count}x
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          schedule={editingSchedule}
          onClose={() => { setShowScheduleModal(false); setEditingSchedule(null); }}
          onSuccess={() => { fetchSchedules(); setShowScheduleModal(false); setEditingSchedule(null); }}
        />
      )}
    </div>
  );
}

// Schedule Creation/Edit Modal Component
function ScheduleModal({ schedule, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    frequency: schedule?.frequency || 'weekly',
    day_of_week: schedule?.day_of_week || 1,
    day_of_month: schedule?.day_of_month || 1,
    time: schedule?.time || '09:00',
    min_leads_required: schedule?.min_leads_required || 50,
    enabled: schedule?.enabled !== undefined ? schedule.enabled : true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      if (schedule) {
        // Update existing schedule
        await axios.put(`${API_URL}/admin/leads/schedules/${schedule.schedule_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Schedule updated successfully!');
      } else {
        // Create new schedule
        await axios.post(`${API_URL}/admin/leads/schedules`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Schedule created successfully!');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {schedule ? 'Edit Schedule' : 'Create Schedule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Schedule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Weekly Bronze Distribution"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {formData.frequency === 'weekly' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Day of Week</label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="7">Sunday</option>
              </select>
            </div>
          )}

          {formData.frequency === 'monthly' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.day_of_month}
                onChange={(e) => setFormData({ ...formData, day_of_month: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Time (UTC)</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Minimum Leads Required</label>
            <input
              type="number"
              min="1"
              value={formData.min_leads_required}
              onChange={(e) => setFormData({ ...formData, min_leads_required: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
            <p className="text-gray-500 text-xs mt-1">Schedule will be skipped if fewer leads are available</p>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-300 text-sm">Enable schedule immediately</span>
          </label>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {saving ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Admin Tickets Tab Component

export default LeadsManagementTab;
