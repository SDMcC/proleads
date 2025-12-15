import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Download, FileSpreadsheet, Filter, Search, ChevronLeft, ChevronRight, Mail, ExternalLink, FileText, ArrowLeft, PaperClip, Send } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function LeadsTab() {
  const [csvFiles, setCsvFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchCsvFiles();
  }, [currentPage]);

  const fetchCsvFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/leads?page=${currentPage}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCsvFiles(response.data.csv_files || []);
      setTotalFiles(response.data.total_count || 0);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch CSV files:', error);
      alert('Failed to load CSV files');
    } finally {
      setLoading(false);
    }
  };

  const downloadCsvFile = async (fileId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/leads/download/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Refresh the files list to update download status
      fetchCsvFiles();
      
      alert('CSV file downloaded successfully!');
    } catch (error) {
      console.error('Failed to download CSV file:', error);
      alert('Failed to download CSV file');
    }
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
        <h2 className="text-2xl font-bold text-white">My Lead Files</h2>
        <div className="text-gray-300">
          {totalFiles} CSV file{totalFiles !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Sendloop Integration Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 bg-opacity-50 border border-blue-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 bg-opacity-30 rounded-full p-3">
              <Mail className="h-8 w-8 text-blue-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Export to Sendloop</h3>
              <p className="text-blue-200 text-sm">
                Create automated email campaigns with your leads. Click "Export" on any file to open Sendloop.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.post(
                  `${API_URL}/sso/initiate`,
                  {
                    target_app: 'sendloop',
                    redirect_url: 'https://proleads-refactor.preview.emergentagent.com/dashboard'
                  },
                  { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (response.data.redirect_url) {
                  window.open(response.data.redirect_url, '_blank');
                }
              } catch (error) {
                console.error('Failed to initiate SSO:', error);
                alert('Failed to open Sendloop. Please try again.');
              }
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 whitespace-nowrap"
          >
            <ExternalLink className="h-5 w-5" />
            <span>Open Sendloop</span>
          </button>
        </div>
      </div>

      {csvFiles.length === 0 ? (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Lead Files Available</h3>
          <p className="text-gray-300">Lead files will appear here when they are distributed by the admin.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats - Moved to top */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{totalFiles}</div>
              <div className="text-gray-300">Total Files</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {csvFiles.reduce((sum, file) => sum + file.lead_count, 0)}
              </div>
              <div className="text-gray-300">Total Leads</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {csvFiles.reduce((sum, file) => sum + file.download_count, 0)}
              </div>
              <div className="text-gray-300">Total Downloads</div>
            </div>
          </div>

          {/* CSV Files Table */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4 text-gray-300 font-medium">Filename</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Lead Count</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Tier</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Created</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Downloads</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {csvFiles.map((file) => (
                    <tr key={file.file_id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          <span className="text-white font-medium">{file.filename}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-600 bg-opacity-20 text-blue-300 px-2 py-1 rounded text-sm">
                          {file.lead_count} leads
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-sm capitalize ${
                          file.member_tier === 'gold' ? 'bg-yellow-600 bg-opacity-20 text-yellow-300' :
                          file.member_tier === 'silver' ? 'bg-gray-600 bg-opacity-20 text-gray-300' :
                          file.member_tier === 'test' ? 'bg-green-600 bg-opacity-20 text-green-300' :
                          file.member_tier === 'vip_affiliate' ? 'bg-purple-600 bg-opacity-20 text-purple-300' :
                          'bg-orange-600 bg-opacity-20 text-orange-300'
                        }`}>
                          {getTierDisplayName(file.member_tier)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        <div className="flex flex-col">
                          <span>{file.download_count} time{file.download_count !== 1 ? 's' : ''}</span>
                          {file.downloaded_at && (
                            <span className="text-xs text-gray-400">
                              Last: {new Date(file.downloaded_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadCsvFile(file.file_id, file.filename)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                
                                // Get current user info
                                const userResponse = await axios.get(`${API_URL}/users/me`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                const userId = userResponse.data.user_id;
                                
                                // Initiate SSO with file information in redirect URL
                                const redirectUrl = `https://proleads-refactor.preview.emergentagent.com/import?user_id=${userId}&file_id=${file.file_id}&source=proleads`;
                                
                                const response = await axios.post(
                                  `${API_URL}/sso/initiate`,
                                  {
                                    target_app: 'sendloop',
                                    redirect_url: redirectUrl
                                  },
                                  { headers: { 'Authorization': `Bearer ${token}` } }
                                );
                                
                                if (response.data.redirect_url) {
                                  window.open(response.data.redirect_url, '_blank');
                                }
                              } catch (error) {
                                console.error('Failed to initiate SSO:', error);
                                alert('Failed to open Sendloop. Please try again.');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                            title="Export to Sendloop"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Export</span>
                          </button>
                        </div>
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
                          ? 'bg-red-600 text-white'
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

// Leads Management Tab Component for Admin (Enhanced with Duplicate Detection, Email Verification, and Scheduling)
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
function AdminTicketsTab({ 
  tickets, setTickets, selectedTicket, setSelectedTicket, 
  page, setPage, totalPages, setTotalPages, filters, setFilters,
  showMassMessageModal, setShowMassMessageModal, massMessageForm, setMassMessageForm,
  adminReplyMessage, setAdminReplyMessage
}) {
  const [activeView, setActiveView] = useState('list'); // 'list', 'view', 'mass-message'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminTickets();
  }, [page, filters]);

  const fetchAdminTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (filters.status) params.append('status_filter', filters.status);
      if (filters.category) params.append('category_filter', filters.category);
      if (filters.contact_type) params.append('contact_type_filter', filters.contact_type);
      if (filters.user) params.append('user_filter', filters.user);

      const response = await axios.get(
        `${API_URL}/admin/tickets?${params}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setTickets(response.data.tickets || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch admin tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${API_URL}/admin/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setSelectedTicket(response.data);
      setActiveView('view');
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      alert('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_URL}/admin/tickets/${ticketId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update local ticket status
      if (selectedTicket && selectedTicket.ticket.ticket_id === ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          ticket: { ...selectedTicket.ticket, status: newStatus }
        });
      }
      
      // Refresh ticket list
      fetchAdminTickets();
      alert('Ticket status updated successfully');
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const replyToTicket = async () => {
    if (!adminReplyMessage.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('message', adminReplyMessage);

      await axios.post(
        `${API_URL}/admin/tickets/${selectedTicket.ticket.ticket_id}/reply`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setAdminReplyMessage('');
      fetchTicketDetails(selectedTicket.ticket.ticket_id);
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    }
  };

  const sendMassMessage = async () => {
    try {
      if (!massMessageForm.subject.trim() || !massMessageForm.message.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URL}/admin/tickets/mass-message`,
        massMessageForm,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Mass message sent successfully!');
      setShowMassMessageModal(false);
      setMassMessageForm({
        target_type: 'all_users',
        target_tiers: [],
        target_users: [],
        subject: '',
        message: ''
      });
      fetchAdminTickets();
    } catch (error) {
      console.error('Failed to send mass message:', error);
      alert('Failed to send mass message');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-600 text-blue-100';
      case 'in_progress': return 'bg-yellow-600 text-yellow-100';
      case 'closed': return 'bg-gray-600 text-gray-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-red-100';
      case 'medium': return 'bg-orange-600 text-orange-100';
      case 'low': return 'bg-green-600 text-green-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const downloadAttachment = async (url, filename) => {
    try {
      const token = localStorage.getItem('adminToken');
      // Handle URLs that might already have /api prefix
      const attachmentUrl = url.startsWith('/api/') ? `${BACKEND_URL}${url}` : `${API_URL}${url}`;
      const response = await fetch(attachmentUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load attachment');
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const contentType = response.headers.get('content-type') || '';
      
      // Open in new window with the blob URL
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>${filename || 'Attachment'}</title>
            <style>
              body { 
                margin: 0; padding: 20px; font-family: Arial, sans-serif; 
                background: #f5f5f5; text-align: center;
              }
              .container { max-width: 100%; }
              .header { 
                background: white; padding: 15px; margin-bottom: 20px; 
                border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .content { 
                background: white; padding: 20px; border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-height: 70vh;
              }
              .download-btn { 
                background: #dc2626; color: white; padding: 10px 20px; 
                border: none; border-radius: 4px; cursor: pointer; margin: 5px;
                text-decoration: none; display: inline-block;
              }
              .download-btn:hover { background: #b91c1c; }
              .close-btn { background: #6b7280; }
              .close-btn:hover { background: #4b5563; }
              img { max-width: 100%; height: auto; }
              iframe { width: 100%; height: 70vh; border: none; }
              .file-info { color: #6b7280; font-size: 14px; margin-bottom: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0 0 10px 0;">${filename || 'Attachment'} [ADMIN VIEW]</h2>
                <div class="file-info">Type: ${contentType}</div>
                <a href="${fileUrl}" download="${filename || 'attachment'}" class="download-btn">
                  📥 Download
                </a>
                <button onclick="window.close()" class="download-btn close-btn">
                  ❌ Close
                </button>
              </div>
              <div class="content">
                ${contentType.startsWith('image/') ? 
                  `<img src="${fileUrl}" alt="${filename}" />` :
                  contentType === 'application/pdf' ?
                  `<iframe src="${fileUrl}" type="application/pdf"></iframe>` :
                  contentType.startsWith('text/') ?
                  `<iframe src="${fileUrl}"></iframe>` :
                  `<div style="padding: 40px;">
                     <h3>Preview not available for this file type</h3>
                     <p>Click the download button above to save the file.</p>
                   </div>`
                }
              </div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 60000); // Clean up after 1 minute
      
    } catch (error) {
      console.error('Failed to open attachment:', error);
      alert('Failed to open attachment');
    }
  };

  // Ticket Details View
  if (activeView === 'view' && selectedTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Tickets</span>
          </button>
          <h3 className="text-2xl font-bold text-white">Ticket Details</h3>
        </div>

        {/* Ticket Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-bold text-white mb-2">{selectedTicket.ticket.subject}</h4>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-medium ${getStatusColor(selectedTicket.ticket.status)}`}>
                  {selectedTicket.ticket.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-medium ${getPriorityColor(selectedTicket.ticket.priority)}`}>
                  {selectedTicket.ticket.priority}
                </span>
                <span className="text-gray-400 text-sm">
                  {selectedTicket.ticket.category.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedTicket.ticket.status}
                onChange={(e) => updateTicketStatus(selectedTicket.ticket.ticket_id, e.target.value)}
                className="px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">From: </span>
              <span className="text-white">{selectedTicket.ticket.sender_username}</span>
            </div>
            <div>
              <span className="text-gray-400">To: </span>
              <span className="text-white">
                {selectedTicket.ticket.recipient_username || 'Admin'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Type: </span>
              <span className="text-white capitalize">{selectedTicket.ticket.contact_type.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-gray-400">Created: </span>
              <span className="text-white">{new Date(selectedTicket.ticket.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h5 className="text-lg font-bold text-white mb-4">Conversation</h5>
          
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {selectedTicket.messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.sender_role === 'admin' 
                    ? 'bg-red-600 bg-opacity-20 border-l-4 border-red-400' 
                    : 'bg-blue-600 bg-opacity-20 border-l-4 border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">
                      {message.sender_username}
                    </span>
                    {message.sender_role === 'admin' && (
                      <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-xs">Admin</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{message.message}</p>
                
                {/* Attachments */}
                {message.attachment_urls && message.attachment_urls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachment_urls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => downloadAttachment(url, `attachment-${i + 1}`)}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 cursor-pointer"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>View Attachment {i + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Admin Reply Section */}
          <div className="border-t border-gray-600 pt-4">
            <textarea
              value={adminReplyMessage}
              onChange={(e) => setAdminReplyMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none mb-4"
              placeholder="Type your admin reply..."
            />
            
            <div className="flex justify-end">
              <button
                onClick={replyToTicket}
                disabled={!adminReplyMessage.trim()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send Admin Reply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Ticket Management</h3>
        <button
          onClick={() => setShowMassMessageModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
        >
          <Mail className="h-4 w-4" />
          <span>Send Mass Message</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="leads">Leads</option>
              <option value="technical">Technical</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Contact Type</label>
            <select
              value={filters.contact_type}
              onChange={(e) => setFilters({...filters, contact_type: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Types</option>
              <option value="admin">Admin Tickets</option>
              <option value="sponsor">Sponsor Messages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Placeholder for tickets list */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <p className="text-gray-300">Ticket list will be displayed here</p>
      </div>
    </div>
  );
}

export default LeadsTab;
