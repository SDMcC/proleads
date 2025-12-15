import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Home, FileSpreadsheet, Settings, BarChart, Shield, MessageCircle, Award, Users, DollarSign, Bell, Zap, Key, Link, BarChart3, TrendingUp, Activity, AlertCircle, FileText, Gift, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTierBadgeClass, getTierDisplayName } from '../../utils/helpers';
import AnalyticsTab from '../../components/admin/tabs/AnalyticsTab';
import AdminMilestonesTab from '../../components/admin/tabs/AdminMilestonesTab';
import AdminKYCTab from '../../components/admin/tabs/AdminKYCTab';
import LeadsManagementTab from '../../components/admin/tabs/LeadsManagementTab';
import IntegrationsTab from '../../components/admin/tabs/IntegrationsTab';
import ConfigurationTab from '../../components/admin/tabs/ConfigurationTab';
import AdminTicketsTab from '../../components/admin/tabs/AdminTicketsTab';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Helper Components
const AdminStatCard = ({ icon, title, value, subtitle }) => (
  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      {icon}
    </div>
    <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-gray-400 text-xs">{subtitle}</p>
  </div>
);

const RecentMembersCard = ({ stats }) => (
  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
      <Users className="h-5 w-5 mr-2 text-blue-400" />
      Recent Members
    </h4>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Total Members:</span>
        <span className="text-white font-medium">{stats?.members?.total || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">This Month:</span>
        <span className="text-green-400 font-medium">+{stats?.members?.recent_30_days || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Today:</span>
        <span className="text-blue-400 font-medium">+{stats?.members?.today || 0}</span>
      </div>
    </div>
  </div>
);

const RecentPaymentsCard = ({ stats }) => (
  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
      <DollarSign className="h-5 w-5 mr-2 text-green-400" />
      Recent Payments
    </h4>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Total Revenue:</span>
        <span className="text-white font-medium">${stats?.payments?.total_revenue?.toFixed(2) || '0.00'}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">This Month:</span>
        <span className="text-green-400 font-medium">{stats?.payments?.recent_30_days || 0} payments</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Pending:</span>
        <span className="text-yellow-400 font-medium">{stats?.payments?.pending || 0}</span>
      </div>
    </div>
  </div>
);

const RecentMilestonesCard = ({ stats }) => (
  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
      <Award className="h-5 w-5 mr-2 text-yellow-400" />
      Recent Milestones
    </h4>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Total Achieved:</span>
        <span className="text-white font-medium">{stats?.milestones?.total_achieved || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">This Month:</span>
        <span className="text-green-400 font-medium">+{stats?.milestones?.recent_30_days || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Total Rewards:</span>
        <span className="text-yellow-400 font-medium">${stats?.milestones?.total_rewards?.toFixed(2) || '0.00'}</span>
      </div>
    </div>
  </div>
);

const RecentTicketsCard = ({ stats }) => (
  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
      <MessageCircle className="h-5 w-5 mr-2 text-purple-400" />
      Recent Tickets
    </h4>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Total Tickets:</span>
        <span className="text-white font-medium">{stats?.tickets?.total || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Open:</span>
        <span className="text-yellow-400 font-medium">{stats?.tickets?.open || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Resolved:</span>
        <span className="text-green-400 font-medium">{stats?.tickets?.closed || 0}</span>
      </div>
    </div>
  </div>
);

const AdminNotificationPanel = ({ notifications }) => (
  <div className="absolute right-0 top-16 w-80 bg-gray-800 rounded-lg shadow-xl p-4 z-50">
    <h3 className="text-white font-bold mb-2">Notifications</h3>
    {notifications?.length > 0 ? (
      notifications.map((notif, idx) => (
        <div key={idx} className="text-gray-300 text-sm py-2 border-b border-gray-700">
          {notif.message}
        </div>
      ))
    ) : (
      <p className="text-gray-400">No notifications</p>
    )}
  </div>
);

const MemberModal = ({ member, onClose, onSave }) => {
  const [editedTier, setEditedTier] = React.useState(member?.membership_tier);
  
  React.useEffect(() => {
    setEditedTier(member?.membership_tier);
  }, [member]);

  const handleSave = () => {
    if (editedTier !== member.membership_tier) {
      onSave({ ...member, membership_tier: editedTier });
    } else {
      onClose();
    }
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Member Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Username</label>
              <p className="text-white font-medium text-lg">{member.username}</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Email Address</label>
              <p className="text-white font-medium">{member.email}</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">User ID</label>
              <p className="text-white font-mono text-sm">{member.id}</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Wallet Address</label>
              <p className="text-white font-mono text-xs break-all">{member.wallet_address || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Referral Code</label>
              <p className="text-white font-medium">{member.referral_code || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Referred By</label>
              <p className="text-white font-medium">{member.referred_by || 'Direct Signup'}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Membership Tier</label>
              <select
                value={editedTier}
                onChange={(e) => setEditedTier(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
              >
                <option value="affiliate">Affiliate</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="test">Test</option>
                <option value="vip_affiliate">VIP Affiliate</option>
              </select>
              {editedTier !== member.membership_tier && (
                <p className="text-yellow-400 text-xs mt-1">* Tier will be updated when you save</p>
              )}
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Total Referrals</label>
              <p className="text-white font-medium text-lg">{member.total_referrals || 0}</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Total Earnings</label>
              <p className="text-green-400 font-bold text-xl">${member.total_earnings?.toFixed(2) || '0.00'}</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Member Since</label>
              <p className="text-white font-medium">
                {member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Subscription Expires</label>
              <p className="text-white font-medium">
                {member.subscription_expires_at ? 
                  new Date(member.subscription_expires_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Account Status</label>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                member.suspended ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {member.suspended ? 'Suspended' : 'Active'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            {editedTier !== member.membership_tier ? 'Save Changes' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [memberFilter, setMemberFilter] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Payments management state
  const [paymentUserFilter, setPaymentUserFilter] = useState('');
  const [paymentTierFilter, setPaymentTierFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentDateFrom, setPaymentDateFrom] = useState('');
  const [paymentDateTo, setPaymentDateTo] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  
  // Commissions management state
  const [commissionUserFilter, setCommissionUserFilter] = useState('');
  const [commissionTierFilter, setCommissionTierFilter] = useState('');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('');
  const [commissionDateFrom, setCommissionDateFrom] = useState('');
  const [commissionDateTo, setCommissionDateTo] = useState('');
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionTotalPages, setCommissionTotalPages] = useState(1);
  
  // Admin notification states
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [adminNotificationsPanelOpen, setAdminNotificationsPanelOpen] = useState(false);
  const [adminBellButtonRef, setAdminBellButtonRef] = useState(null);
  
  // Admin tickets management state
  const [adminTickets, setAdminTickets] = useState([]);
  const [selectedAdminTicket, setSelectedAdminTicket] = useState(null);
  const [adminTicketPage, setAdminTicketPage] = useState(1);
  const [adminTicketTotalPages, setAdminTicketTotalPages] = useState(1);
  const [adminTicketFilters, setAdminTicketFilters] = useState({
    status: '',
    category: '',
    contact_type: '',
    user: ''
  });
  const [showMassMessageModal, setShowMassMessageModal] = useState(false);
  const [massMessageForm, setMassMessageForm] = useState({
    target_type: 'all_users',
    target_tiers: [],
    target_users: [],
    subject: '',
    message: ''
  });
  const [adminReplyMessage, setAdminReplyMessage] = useState('');

  // Milestones management state
  const [milestones, setMilestones] = useState([]);
  const [milestonePage, setMilestonePage] = useState(1);
  const [milestoneTotalPages, setMilestoneTotalPages] = useState(1);
  const [milestoneFilters, setMilestoneFilters] = useState({
    user: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    status: ''
  });
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // Escrow management state
  const [escrowRecords, setEscrowRecords] = useState([]);
  const [escrowPage, setEscrowPage] = useState(1);
  const [escrowTotalPages, setEscrowTotalPages] = useState(1);
  const [escrowFilters, setEscrowFilters] = useState({
    status: 'pending_review',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [releasingEscrow, setReleasingEscrow] = useState(null);

  // KYC management state
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [kycPage, setKycPage] = useState(1);
  const [kycTotalPages, setKycTotalPages] = useState(1);
  const [kycStatusFilter, setKycStatusFilter] = useState('pending');
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showKYCReviewModal, setShowKYCReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAdminData();
    fetchAdminNotifications();
    
    // Auto-refresh admin notifications every 30 seconds
    const adminNotificationInterval = setInterval(() => {
      fetchAdminNotifications();
    }, 30000);
    
    return () => clearInterval(adminNotificationInterval);
  }, []);

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers(memberFilter, memberPage);
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'commissions') {
      fetchCommissions();
    } else if (activeTab === 'escrow') {
      fetchEscrowRecords();
    } else if (activeTab === 'milestones') {
      fetchMilestones();
    } else if (activeTab === 'kyc') {
      fetchKYCSubmissions();
    }
  }, [activeTab, memberFilter, memberPage, sortField, sortDirection, paymentUserFilter, paymentTierFilter, paymentStatusFilter, paymentDateFrom, paymentDateTo, paymentPage, commissionUserFilter, commissionTierFilter, commissionStatusFilter, commissionDateFrom, commissionDateTo, commissionPage, escrowFilters, escrowPage, milestoneFilters, milestonePage, kycStatusFilter, kycPage]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch dashboard overview
      const overviewResponse = await axios.get(`${API_URL}/admin/dashboard/overview`, { headers });
      setStats(overviewResponse.data);
      
      // Fetch members data if on members tab
      if (activeTab === 'members') {
        fetchMembers();
      }
      
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAdminNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminNotifications(response.data.notifications);
      setAdminUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error);
    }
  };

  const clearAdminNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from local state
      setAdminNotifications(adminNotifications.filter(n => n.notification_id !== notificationId));
      setAdminUnreadCount(Math.max(0, adminUnreadCount - 1));
    } catch (error) {
      console.error('Failed to clear admin notification:', error);
      alert('Failed to clear notification');
    }
  };

  const markAllAdminNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/admin/notifications/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setAdminNotifications(adminNotifications.map(n => ({ ...n, read_status: true })));
      setAdminUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark admin notifications as read:', error);
    }
  };

  const fetchMembers = async (tier = '', page = 1) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (tier) params.append('tier', tier);
      if (sortField) params.append('sort_by', sortField);
      if (sortDirection) params.append('sort_direction', sortDirection);
      params.append('page', page.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/admin/members?${params}`, { headers });
      
      // Backend now handles sorting, no need to sort on frontend
      setMembers(response.data.members || []);
      setTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (paymentUserFilter) params.append('user', paymentUserFilter);
      if (paymentTierFilter) params.append('tier', paymentTierFilter);
      if (paymentStatusFilter) params.append('status', paymentStatusFilter);
      if (paymentDateFrom) params.append('date_from', paymentDateFrom);
      if (paymentDateTo) params.append('date_to', paymentDateTo);
      params.append('page', paymentPage.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/admin/payments?${params}`, { headers });
      setPayments(response.data.payments || []);
      setPaymentTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (commissionUserFilter) params.append('user', commissionUserFilter);
      if (commissionTierFilter) params.append('tier', commissionTierFilter);
      if (commissionStatusFilter) params.append('status', commissionStatusFilter);
      if (commissionDateFrom) params.append('date_from', commissionDateFrom);
      if (commissionDateTo) params.append('date_to', commissionDateTo);
      params.append('page', commissionPage.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/admin/commissions?${params}`, { headers });
      setCommissions(response.data.commissions || []);
      setCommissionTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
    }
  };

  const fetchEscrowRecords = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (escrowFilters.status) params.append('status_filter', escrowFilters.status);
      if (escrowFilters.dateFrom) params.append('date_from', escrowFilters.dateFrom);
      if (escrowFilters.dateTo) params.append('date_to', escrowFilters.dateTo);
      params.append('page', escrowPage.toString());
      params.append('limit', '50');
      
      const response = await axios.get(`${API_URL}/admin/escrow?${params}`, { headers });
      setEscrowRecords(response.data.escrow_records || []);
      setEscrowTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch escrow records:', error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (milestoneFilters.user) params.append('username_filter', milestoneFilters.user);
      if (milestoneFilters.dateFrom) params.append('date_from', milestoneFilters.dateFrom);
      if (milestoneFilters.dateTo) params.append('date_to', milestoneFilters.dateTo);
      if (milestoneFilters.minAmount) params.append('award_filter', milestoneFilters.minAmount);
      if (milestoneFilters.status) params.append('status_filter', milestoneFilters.status);
      params.append('page', milestonePage.toString());
      params.append('limit', '10');
      
      const response = await axios.get(`${API_URL}/admin/milestones?${params}`, { headers });
      setMilestones(response.data.milestones || []);
      setMilestoneTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    }
  };

  const markMilestoneAsPaid = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to mark this milestone as paid?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/admin/milestones/${milestoneId}/mark-paid`, {}, { headers });
      
      // Refresh milestones list
      fetchMilestones();
      alert('Milestone marked as paid successfully');
      
    } catch (error) {
      console.error('Failed to mark milestone as paid:', error);
      alert('Failed to mark milestone as paid: ' + (error.response?.data?.detail || error.message));
    }
  };

  const exportMilestones = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (milestoneFilters.user) params.append('username_filter', milestoneFilters.user);
      if (milestoneFilters.dateFrom) params.append('date_from', milestoneFilters.dateFrom);
      if (milestoneFilters.dateTo) params.append('date_to', milestoneFilters.dateTo);
      if (milestoneFilters.minAmount) params.append('award_filter', milestoneFilters.minAmount);
      if (milestoneFilters.status) params.append('status_filter', milestoneFilters.status);
      
      const response = await axios.get(`${API_URL}/admin/milestones/export?${params}`, { 
        headers, 
        responseType: 'blob' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `milestones_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export milestones:', error);
      alert('Failed to export milestones: ' + (error.response?.data?.detail || error.message));
    }
  };

  // KYC Management Functions
  const fetchKYCSubmissions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (kycStatusFilter) params.append('status_filter', kycStatusFilter);
      params.append('page', kycPage.toString());
      params.append('limit', '20');
      
      const response = await axios.get(`${API_URL}/admin/kyc/submissions?${params}`, { headers });
      setKycSubmissions(response.data.submissions || []);
      setKycTotalPages(response.data.total_pages || 1);
      
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
    }
  };

  const handleApproveKYC = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this KYC submission?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/admin/kyc/${userId}/review`, { approved: true }, { headers });
      
      // Refresh KYC list
      fetchKYCSubmissions();
      setShowKYCReviewModal(false);
      setSelectedKYC(null);
      alert('KYC approved successfully');
      
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      alert('Failed to approve KYC: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRejectKYC = async (userId) => {
    if (!rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }
    
    if (!window.confirm('Are you sure you want to reject this KYC submission?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/admin/kyc/${userId}/review`, { 
        approved: false, 
        rejection_reason: rejectionReason 
      }, { headers });
      
      // Refresh KYC list
      fetchKYCSubmissions();
      setShowKYCReviewModal(false);
      setSelectedKYC(null);
      setRejectionReason('');
      alert('KYC rejected');
      
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      alert('Failed to reject KYC: ' + (error.response?.data?.detail || error.message));
    }
  };

  const fetchMemberDetails = async (memberId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_URL}/admin/members/${memberId}`, { headers });
      setSelectedMember(response.data);
      setShowMemberModal(true);
      
    } catch (error) {
      console.error('Failed to fetch member details:', error);
      alert('Failed to fetch member details');
    }
  };

  const updateMember = async (memberId, updateData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`${API_URL}/admin/members/${memberId}`, updateData, { headers });
      
      // Refresh members list
      fetchMembers(memberFilter, memberPage);
      setShowMemberModal(false);
      setEditingMember(null);
      setSelectedMember(null);
      alert('Member updated successfully');
      
    } catch (error) {
      console.error('Failed to update member:', error);
      alert('Failed to update member: ' + (error.response?.data?.detail || error.message));
    }
  };

  const suspendMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to suspend this member?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.delete(`${API_URL}/admin/members/${memberId}`, { headers });
      
      // Refresh members list
      fetchMembers(memberFilter, memberPage);
      setShowMemberModal(false);
      setSelectedMember(null);
      alert('Member suspended successfully');
      
    } catch (error) {
      console.error('Failed to suspend member:', error);
      alert('Failed to suspend member: ' + (error.response?.data?.detail || error.message));
    }
  };
  const unsuspendMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to unsuspend this member?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post(`${API_URL}/admin/members/${memberId}/unsuspend`, {}, { headers });
      
      // Refresh members list
      fetchMembers(memberFilter, memberPage);
      setShowMemberModal(false);
      setSelectedMember(null);
      alert('Member unsuspended successfully');
      
    } catch (error) {
      console.error('Failed to unsuspend member:', error);
      alert('Failed to unsuspend member: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportPaymentsCSV = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (paymentUserFilter) params.append('user_filter', paymentUserFilter);
      if (paymentTierFilter) params.append('tier_filter', paymentTierFilter);
      if (paymentStatusFilter) params.append('status_filter', paymentStatusFilter);
      if (paymentDateFrom) params.append('date_from', paymentDateFrom);
      if (paymentDateTo) params.append('date_to', paymentDateTo);
      
      const response = await axios.get(`${API_URL}/admin/payments/export?${params}`, { 
        headers,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'payments_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).+?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export payments:', error);
      alert('Failed to export payments CSV');
    }
  };

  const exportCommissionsCSV = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (commissionUserFilter) params.append('user_filter', commissionUserFilter);
      if (commissionTierFilter) params.append('tier_filter', commissionTierFilter);
      if (commissionStatusFilter) params.append('status_filter', commissionStatusFilter);
      if (commissionDateFrom) params.append('date_from', commissionDateFrom);
      if (commissionDateTo) params.append('date_to', commissionDateTo);
      
      const response = await axios.get(`${API_URL}/admin/commissions/export?${params}`, { 
        headers,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'commissions_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).+?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export commissions:', error);
      alert('Failed to export commissions CSV');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Admin Navigation */}
      <nav className="bg-red-900 bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <img 
                src="https://members.proleads.network/assets/images/hero-logo-2.png" 
                alt="Proleads Network" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-white">Proleads Network - Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Administrator</span>
              
              {/* Admin Notification Bell */}
              <div className="relative notification-panel">
                <button
                  ref={setAdminBellButtonRef}
                  onClick={() => {
                    setAdminNotificationsPanelOpen(!adminNotificationsPanelOpen);
                  }}
                  className="relative p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300"
                >
                  <Bell className="h-6 w-6" />
                  {adminUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                    </span>
                  )}
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Admin Notification Panel Portal */}
      {adminNotificationsPanelOpen && adminBellButtonRef && (
        <AdminNotificationPanel
          bellButtonRef={adminBellButtonRef}
          notifications={adminNotifications}
          onClose={() => setAdminNotificationsPanelOpen(false)}
          onClearNotification={clearAdminNotification}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-red-900 bg-opacity-30 backdrop-blur-sm border-r border-red-800">
          <div className="p-6">
            <h2 className="text-lg font-bold text-white mb-6">Admin Panel</h2>
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'members', label: 'Members', icon: Users },
                { id: 'payments', label: 'Payments', icon: DollarSign },
                { id: 'commissions', label: 'Commissions', icon: Activity },
                { id: 'escrow', label: 'Escrow', icon: AlertCircle },
                { id: 'milestones', label: 'Milestones', icon: Award },
                { id: 'kyc', label: 'KYC Verification', icon: Shield },
                { id: 'leads', label: 'Leads Distribution', icon: FileText },
                { id: 'tickets', label: 'Tickets', icon: MessageCircle },
                { id: 'integrations', label: 'Integrations', icon: Link },
                { id: 'configuration', label: 'Configuration', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-3 text-left ${
                    activeTab === id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-red-800 hover:bg-opacity-30'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <AdminStatCard
                icon={<Users className="h-8 w-8 text-blue-400" />}
                title="Total Members"
                value={stats?.members?.total || 0}
                subtitle={`${stats?.members?.recent_30_days || 0} this month`}
              />
              <AdminStatCard
                icon={<DollarSign className="h-8 w-8 text-green-400" />}
                title="Total Revenue"
                value={`$${stats?.payments?.total_revenue?.toFixed(2) || '0.00'}`}
                subtitle={`${stats?.payments?.recent_30_days || 0} payments this month`}
              />
              <AdminStatCard
                icon={<FileText className="h-8 w-8 text-yellow-400" />}
                title="Leads Status"
                value={stats?.leads?.remaining || 0}
                subtitle={stats?.leads?.csv_status || "No CSV uploaded"}
              />
              <AdminStatCard
                icon={<TrendingUp className="h-8 w-8 text-purple-400" />}
                title="Commission Payouts"
                value={`$${stats?.commissions?.total_payouts?.toFixed(2) || '0.00'}`}
                subtitle={`${stats?.commissions?.recent_30_days || 0} this month`}
              />
              <AdminStatCard
                icon={<Gift className="h-8 w-8 text-pink-400" />}
                title="Milestones"
                value={stats?.milestones?.total_achieved || 0}
                subtitle="Achieved this month"
              />
            </div>

            {/* Recent Activity Cards */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentMembersCard stats={stats} />
                <RecentPaymentsCard stats={stats} />
                <RecentMilestonesCard stats={stats} />
                <RecentTicketsCard stats={stats} />
              </div>
            </div>
          </div>
        )}


        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AnalyticsTab />}


        {/* Members Management Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Members Filter */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <h3 className="text-xl font-bold text-white">Members Management</h3>
                <div className="flex gap-2 ml-auto">
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="px-4 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                  >
                    <option value="">All Tiers</option>
                    <option value="affiliate">Affiliate</option>
                    <option value="test">Test</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="vip_affiliate">VIP Affiliate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('username')}
                      >
                        Member {sortField === 'username' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('membership_tier')}
                      >
                        Tier {sortField === 'membership_tier' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('total_referrals')}
                      >
                        Referrals {sortField === 'total_referrals' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('total_earnings')}
                      >
                        Earnings {sortField === 'total_earnings' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                        onClick={() => handleSort('created_at')}
                      >
                        Joined {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="pb-3 text-gray-300 font-medium">Expiry Date</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-b-0">
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{member.username}</p>
                            <p className="text-gray-400 text-sm">{member.email}</p>
                            <p className="text-gray-500 text-xs font-mono">{member.wallet_address.slice(0, 8)}...{member.wallet_address.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getTierBadgeClass(member.membership_tier)}`}>
                            {getTierDisplayName(member.membership_tier)}
                          </span>
                        </td>
                        <td className="py-3 text-white">{member.total_referrals || 0}</td>
                        <td className="py-3 text-white">${member.total_earnings?.toFixed(2) || '0.00'}</td>
                        <td className="py-3 text-gray-400">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-gray-400">
                          {member.subscription_expires_at ? 
                            new Date(member.subscription_expires_at).toLocaleDateString() : 
                            'N/A'
                          }
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {member.is_expired && (
                              <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-yellow-100">
                                Expired
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs ${
                              member.suspended ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'
                            }`}>
                              {member.suspended ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => fetchMemberDetails(member.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all duration-300"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditMember(member)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all duration-300"
                            >
                              Edit
                            </button>
                            {!member.suspended && (
                              <button
                                onClick={() => suspendMember(member.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-all duration-300"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {members.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No members found</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setMemberPage(Math.max(1, memberPage - 1))}
                    disabled={memberPage === 1}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(1, memberPage - 2);
                      if (page > totalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setMemberPage(page)}
                          className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                            memberPage === page
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setMemberPage(Math.min(totalPages, memberPage + 1))}
                    disabled={memberPage === totalPages}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Next
                  </button>
                  
                  <span className="text-gray-400 text-sm">
                    Page {memberPage} of {totalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Management Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payments Filters */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">Payments Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">User Search</label>
                      <input
                        type="text"
                        value={paymentUserFilter}
                        onChange={(e) => setPaymentUserFilter(e.target.value)}
                        placeholder="Username or email"
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Tier</label>
                      <select
                        value={paymentTierFilter}
                        onChange={(e) => setPaymentTierFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Tiers</option>
                        <option value="affiliate">Affiliate</option>
                        <option value="test">Test</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="vip_affiliate">VIP Affiliate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                      <select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All</option>
                        <option value="completed">Completed</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                      <input
                        type="date"
                        value={paymentDateFrom}
                        onChange={(e) => setPaymentDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                      <input
                        type="date"
                        value={paymentDateTo}
                        onChange={(e) => setPaymentDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPaymentUserFilter('');
                      setPaymentTierFilter('');
                      setPaymentStatusFilter('');
                      setPaymentDateFrom('');
                      setPaymentDateTo('');
                      setPaymentPage(1);
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
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="pb-3 text-gray-300 font-medium">Payment ID</th>
                      <th className="pb-3 text-gray-300 font-medium">User</th>
                      <th className="pb-3 text-gray-300 font-medium">Amount</th>
                      <th className="pb-3 text-gray-300 font-medium">Tier</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-b-0">
                        <td className="py-3">
                          <div>
                            <p className="text-white font-mono text-sm">{payment.id.slice(0, 8)}...{payment.id.slice(-6)}</p>
                            {payment.nowpayments_id && (
                              <p className="text-gray-400 text-xs">NP: {payment.nowpayments_id}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{payment.username}</p>
                            <p className="text-gray-400 text-sm">{payment.email}</p>
                            <p className="text-gray-500 text-xs font-mono">{payment.user_address.slice(0, 8)}...{payment.user_address.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">${payment.amount}</p>
                            <p className="text-gray-400 text-sm">{payment.currency}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getTierBadgeClass(payment.tier)}`}>
                            {getTierDisplayName(payment.tier)}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${
                            payment.status === 'completed' || payment.status === 'success' ? 'bg-green-600 text-green-100' :
                            payment.status === 'pending' || payment.status === 'processing' ? 'bg-yellow-600 text-yellow-100' :
                            payment.status === 'failed' ? 'bg-red-600 text-red-100' :
                            'bg-gray-600 text-gray-100'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">
                          {new Date(payment.created_at).toLocaleDateString()}
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

              {/* Pagination Controls */}
              {paymentTotalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))}
                    disabled={paymentPage === 1}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(5, paymentTotalPages) }, (_, i) => {
                      const page = i + Math.max(1, paymentPage - 2);
                      if (page > paymentTotalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setPaymentPage(page)}
                          className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                            paymentPage === page
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPaymentPage(Math.min(paymentTotalPages, paymentPage + 1))}
                    disabled={paymentPage === paymentTotalPages}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Next
                  </button>
                  
                  <span className="text-gray-400 text-sm">
                    Page {paymentPage} of {paymentTotalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commissions Management Tab */}
        {activeTab === 'commissions' && (
          <div className="space-y-6">
            {/* Commissions Filters */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">Commissions Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Recipient Search</label>
                      <input
                        type="text"
                        value={commissionUserFilter}
                        onChange={(e) => setCommissionUserFilter(e.target.value)}
                        placeholder="Username or email"
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">New Member Tier</label>
                      <select
                        value={commissionTierFilter}
                        onChange={(e) => setCommissionTierFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Tiers</option>
                        <option value="affiliate">Affiliate</option>
                        <option value="test">Test</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="vip_affiliate">VIP Affiliate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                      <select
                        value={commissionStatusFilter}
                        onChange={(e) => setCommissionStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                      <input
                        type="date"
                        value={commissionDateFrom}
                        onChange={(e) => setCommissionDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                      <input
                        type="date"
                        value={commissionDateTo}
                        onChange={(e) => setCommissionDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCommissionUserFilter('');
                      setCommissionTierFilter('');
                      setCommissionStatusFilter('');
                      setCommissionDateFrom('');
                      setCommissionDateTo('');
                      setCommissionPage(1);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={exportCommissionsCSV}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Commissions Table */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="pb-3 text-gray-300 font-medium">Commission ID</th>
                      <th className="pb-3 text-gray-300 font-medium">Recipient</th>
                      <th className="pb-3 text-gray-300 font-medium">New Member</th>
                      <th className="pb-3 text-gray-300 font-medium">Amount</th>
                      <th className="pb-3 text-gray-300 font-medium">Level</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((commission, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-b-0">
                        <td className="py-3">
                          <div>
                            <p className="text-white font-mono text-sm">{commission.id.slice(0, 8)}...{commission.id.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{commission.recipient_username}</p>
                            <p className="text-gray-400 text-sm">{commission.recipient_email}</p>
                            <p className="text-gray-500 text-xs font-mono">{commission.recipient_address.slice(0, 8)}...{commission.recipient_address.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{commission.new_member_username}</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-medium mt-1 ${getTierBadgeClass(commission.new_member_tier)}`}>
                              {getTierDisplayName(commission.new_member_tier)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="text-white font-medium">${commission.amount}</p>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-purple-600 text-purple-100 rounded text-xs font-medium">
                            Level {commission.level}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            commission.status === 'completed' ? 'bg-green-600 text-green-100' :
                            commission.status === 'processing' ? 'bg-yellow-600 text-yellow-100' :
                            commission.status === 'pending' ? 'bg-blue-600 text-blue-100' :
                            'bg-red-600 text-red-100'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {commissions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No commissions found</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {commissionTotalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setCommissionPage(Math.max(1, commissionPage - 1))}
                    disabled={commissionPage === 1}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(5, commissionTotalPages) }, (_, i) => {
                      const page = i + Math.max(1, commissionPage - 2);
                      if (page > commissionTotalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCommissionPage(page)}
                          className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                            commissionPage === page
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCommissionPage(Math.min(commissionTotalPages, commissionPage + 1))}
                    disabled={commissionPage === commissionTotalPages}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-all duration-300"
                  >
                    Next
                  </button>
                  
                  <span className="text-gray-400 text-sm">
                    Page {commissionPage} of {commissionTotalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Escrow Tab */}
        {activeTab === 'escrow' && (
          <div className="space-y-6">
            {/* Escrow Header & Filters */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">Escrow Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                      <select
                        value={escrowFilters.status}
                        onChange={(e) => setEscrowFilters({...escrowFilters, status: e.target.value})}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      >
                        <option value="">All Status</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="processing">Processing</option>
                        <option value="released">Released</option>
                        <option value="partial_release">Partial Release</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date From</label>
                      <input
                        type="date"
                        value={escrowFilters.dateFrom}
                        onChange={(e) => setEscrowFilters({...escrowFilters, dateFrom: e.target.value})}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Date To</label>
                      <input
                        type="date"
                        value={escrowFilters.dateTo}
                        onChange={(e) => setEscrowFilters({...escrowFilters, dateTo: e.target.value})}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEscrowFilters({ status: 'pending_review', dateFrom: '', dateTo: '' });
                      setEscrowPage(1);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const params = new URLSearchParams();
                        if (escrowFilters.status) params.append('status_filter', escrowFilters.status);
                        if (escrowFilters.dateFrom) params.append('date_from', escrowFilters.dateFrom);
                        if (escrowFilters.dateTo) params.append('date_to', escrowFilters.dateTo);
                        
                        const response = await axios.get(
                          `${process.env.REACT_APP_BACKEND_URL}/api/admin/escrow/export?${params.toString()}`,
                          { 
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                            responseType: 'blob'
                          }
                        );
                        
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `escrow_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch (error) {
                        console.error('Export failed:', error);
                        alert('Failed to export escrow data');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Escrow Table */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="pb-3 text-gray-300 font-medium">Escrow ID</th>
                      <th className="pb-3 text-gray-300 font-medium">Payment ID</th>
                      <th className="pb-3 text-gray-300 font-medium">Amount</th>
                      <th className="pb-3 text-gray-300 font-medium">Recipients</th>
                      <th className="pb-3 text-gray-300 font-medium">Reason</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Created</th>
                      <th className="pb-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrowRecords.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-400">
                          No escrow records found
                        </td>
                      </tr>
                    ) : (
                      escrowRecords.map((record) => (
                        <tr key={record.escrow_id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                          <td className="py-4 text-white">
                            <span className="text-xs font-mono">{record.escrow_id.substring(0, 8)}...</span>
                          </td>
                          <td className="py-4 text-gray-300">
                            <span className="text-xs font-mono">{record.payment_id}</span>
                          </td>
                          <td className="py-4 text-white font-semibold">
                            ${record.amount.toFixed(2)}
                          </td>
                          <td className="py-4 text-gray-300">
                            {record.commissions && record.commissions.length > 0 ? (
                              <div className="space-y-1">
                                {record.commissions.map((comm, idx) => (
                                  <div key={idx} className="text-xs">
                                    <div className="font-semibold">{comm.recipient_username}</div>
                                    <div className="text-gray-400">{comm.recipient_email}</div>
                                    <div className="text-gray-500">${comm.amount.toFixed(2)}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="py-4 text-gray-400 text-sm max-w-xs truncate">
                            {record.reason}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              record.status === 'pending_review' ? 'bg-yellow-900 bg-opacity-50 text-yellow-300' :
                              record.status === 'processing' ? 'bg-blue-900 bg-opacity-50 text-blue-300' :
                              record.status === 'released' ? 'bg-green-900 bg-opacity-50 text-green-300' :
                              record.status === 'partial_release' ? 'bg-orange-900 bg-opacity-50 text-orange-300' :
                              'bg-gray-900 bg-opacity-50 text-gray-300'
                            }`}>
                              {record.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 text-gray-400 text-sm">
                            {new Date(record.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            {record.status === 'pending_review' && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Release this escrow amount to the recipient(s)?')) return;
                                  
                                  setReleasingEscrow(record.escrow_id);
                                  try {
                                    const response = await axios.post(
                                      `${process.env.REACT_APP_BACKEND_URL}/api/admin/escrow/${record.escrow_id}/release`,
                                      {},
                                      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                                    );
                                    
                                    alert(`Escrow release ${response.data.status}: ${response.data.successful_payouts}/${response.data.total_commissions} payouts successful`);
                                    
                                    // Refresh escrow list
                                    const escrowResponse = await axios.get(
                                      `${process.env.REACT_APP_BACKEND_URL}/api/admin/escrow?page=${escrowPage}&limit=50&status_filter=${escrowFilters.status || ''}`,
                                      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                                    );
                                    setEscrowRecords(escrowResponse.data.escrow_records);
                                    setEscrowTotalPages(escrowResponse.data.total_pages);
                                  } catch (error) {
                                    console.error('Release failed:', error);
                                    alert('Failed to release escrow: ' + (error.response?.data?.detail || error.message));
                                  } finally {
                                    setReleasingEscrow(null);
                                  }
                                }}
                                disabled={releasingEscrow === record.escrow_id}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all duration-300 disabled:opacity-50"
                              >
                                {releasingEscrow === record.escrow_id ? 'Releasing...' : 'Release'}
                              </button>
                            )}
                            {record.status === 'released' && (
                              <span className="text-green-400 text-sm">✓ Complete</span>
                            )}
                            {record.status === 'partial_release' && (
                              <button
                                onClick={() => setSelectedEscrow(record)}
                                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-all duration-300"
                              >
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {escrowTotalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <button
                    onClick={() => setEscrowPage(Math.max(1, escrowPage - 1))}
                    disabled={escrowPage === 1}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <span className="text-gray-400 text-sm">
                    Page {escrowPage} of {escrowTotalPages}
                  </span>
                  
                  <button
                    onClick={() => setEscrowPage(Math.min(escrowTotalPages, escrowPage + 1))}
                    disabled={escrowPage === escrowTotalPages}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <AdminMilestonesTab 
            milestones={milestones}
            page={milestonePage}
            setPage={setMilestonePage}
            totalPages={milestoneTotalPages}
            filters={milestoneFilters}
            setFilters={setMilestoneFilters}
            onMarkAsPaid={markMilestoneAsPaid}
            onExport={exportMilestones}
            selectedMilestone={selectedMilestone}
            setSelectedMilestone={setSelectedMilestone}
            showModal={showMilestoneModal}
            setShowModal={setShowMilestoneModal}
          />
        )}

        {activeTab === 'kyc' && (
          <AdminKYCTab 
            submissions={kycSubmissions}
            page={kycPage}
            setPage={setKycPage}
            totalPages={kycTotalPages}
            statusFilter={kycStatusFilter}
            setStatusFilter={setKycStatusFilter}
            selectedKYC={selectedKYC}
            setSelectedKYC={setSelectedKYC}
            showModal={showKYCReviewModal}
            setShowModal={setShowKYCReviewModal}
            onApprove={handleApproveKYC}
            onReject={handleRejectKYC}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
          />
        )}

        {/* Leads Management Tab */}
        {activeTab === 'leads' && (
          <LeadsManagementTab />
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <IntegrationsTab />
        )}

        {/* Configuration Tab */}
        {activeTab === 'configuration' && (
          <ConfigurationTab />
        )}

        {/* Admin Tickets Tab */}
        {activeTab === 'tickets' && (
          <AdminTicketsTab 
            tickets={adminTickets}
            setTickets={setAdminTickets}
            selectedTicket={selectedAdminTicket}
            setSelectedTicket={setSelectedAdminTicket}
            page={adminTicketPage}
            setPage={setAdminTicketPage}
            totalPages={adminTicketTotalPages}
            setTotalPages={setAdminTicketTotalPages}
            filters={adminTicketFilters}
            setFilters={setAdminTicketFilters}
            showMassMessageModal={showMassMessageModal}
            setShowMassMessageModal={setShowMassMessageModal}
            massMessageForm={massMessageForm}
            setMassMessageForm={setMassMessageForm}
            adminReplyMessage={adminReplyMessage}
            setAdminReplyMessage={setAdminReplyMessage}
          />
        )}
      </div>

      {/* Member Details Modal */}
      {showMemberModal && (
        <MemberModal
          member={selectedMember}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
          onSave={(updatedMember) => updateMember(updatedMember.id, { membership_tier: updatedMember.membership_tier })}
        />
      )}
      </div>
    </div>
  );
}

// Leads Tab Component (for users)
// LeadsTab Component - Now imported from components/dashboard/tabs/LeadsTab.js
// Leads Management Tab Component for Admin (Enhanced with Duplicate Detection, Email Verification, and Scheduling)

export default AdminDashboard;
