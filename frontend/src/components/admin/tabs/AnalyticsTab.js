import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, TrendingUp, Users, DollarSign, Activity, Shield, Award, MessageCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTierDisplayName } from '../../../utils/helpers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [graphsData, setGraphsData] = useState(null);
  const [timeFilter, setTimeFilter] = useState('1month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsSummary();
  }, []);

  useEffect(() => {
    fetchGraphsData();
  }, [timeFilter]);

  const fetchAnalyticsSummary = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphsData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/analytics/graphs?time_filter=${timeFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGraphsData(response.data);
    } catch (error) {
      console.error('Failed to fetch graphs data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-gray-400">Track your platform's financial performance and growth metrics</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 font-medium">Total Income</h3>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">${analyticsData?.total_income?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400 mt-1">All confirmed payments</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 font-medium">Total Commissions</h3>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">${analyticsData?.total_commission?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400 mt-1">Paid to affiliates</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 font-medium">Net Profit</h3>
            <Activity className="h-8 w-8 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">${analyticsData?.net_profit?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400 mt-1">Income - Commissions</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-300 font-medium">Held Payments</h3>
            <Shield className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">${analyticsData?.held_payments?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-400 mt-1">KYC pending over $50</p>
        </div>
      </div>

      {/* Time Filter Buttons */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex flex-wrap gap-3">
          <span className="text-white font-medium mr-4">Time Period:</span>
          {['1day', '1week', '1month', '1year', 'all'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                timeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-black bg-opacity-30 text-gray-300 hover:bg-opacity-50'
              }`}
            >
              {filter === '1day' ? '1 Day' : filter === '1week' ? '1 Week' : filter === '1month' ? '1 Month' : filter === '1year' ? '1 Year' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Graphs */}
      {graphsData && (
        <div className="grid grid-cols-1 gap-6">
          {/* Member Growth Graph */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Member Growth</h3>
            <AnalyticsGraph 
              data={graphsData.member_growth} 
              dataKey="count" 
              color="#3B82F6"
              yAxisLabel="Members"
            />
          </div>

          {/* Income Growth Graph */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Income Growth</h3>
            <AnalyticsGraph 
              data={graphsData.income_growth} 
              dataKey="amount" 
              color="#10B981"
              yAxisLabel="Income ($)"
              formatValue={(value) => `$${value.toFixed(2)}`}
            />
          </div>

          {/* Profit Growth Graph */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Profit Growth</h3>
            <AnalyticsGraph 
              data={graphsData.profit_growth} 
              dataKey="amount" 
              color="#A855F7"
              yAxisLabel="Profit ($)"
              formatValue={(value) => `$${value.toFixed(2)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Graph Component using Recharts
function AnalyticsGraph({ data, dataKey, color, yAxisLabel, formatValue }) {
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = require('recharts');

  // Transform data for Recharts
  const chartData = data.map(item => ({
    name: item._id,
    value: item[dataKey]
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg">
          <p className="text-white font-medium">{payload[0].payload.name}</p>
          <p className="text-blue-400">{formatValue ? formatValue(value) : value}</p>
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return <p className="text-gray-400 text-center py-8">No data available for this period</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="name" 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={3}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Recent Activity Card Components
function RecentMembersCard() {
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentMembers();
  }, []);

  const fetchRecentMembers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/recent/members?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentMembers(response.data.recent_members);
    } catch (error) {
      console.error('Failed to fetch recent members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Recent Members
        </h4>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading...</p>
        ) : recentMembers.length > 0 ? (
          recentMembers.map((member, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div>
                <p className="text-white font-medium">{member.username}</p>
                <p className="text-gray-400 text-sm">{getTierDisplayName(member.tier)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-300 text-sm">{new Date(member.join_date).toLocaleDateString()}</p>
                <span className={`text-xs px-2 py-1 rounded ${member.status === 'Active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {member.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent members</p>
        )}
      </div>
    </div>
  );
}

function RecentPaymentsCard() {
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/recent/payments?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentPayments(response.data.recent_payments);
    } catch (error) {
      console.error('Failed to fetch recent payments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Recent Payments
        </h4>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading...</p>
        ) : recentPayments.length > 0 ? (
          recentPayments.map((payment, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div>
                <p className="text-white font-medium">{payment.member_name}</p>
                <p className="text-gray-400 text-sm">{getTierDisplayName(payment.tier)}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">${payment.amount}</p>
                <p className="text-gray-300 text-xs">{new Date(payment.payment_date).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent payments</p>
        )}
      </div>
    </div>
  );
}

function RecentMilestonesCard() {
  const [recentMilestones, setRecentMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentMilestones();
  }, []);

  const fetchRecentMilestones = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/recent/milestones?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentMilestones(response.data.recent_milestones);
    } catch (error) {
      console.error('Failed to fetch recent milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <Award className="h-5 w-5 mr-2" />
          Recent Milestones
        </h4>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading...</p>
        ) : recentMilestones.length > 0 ? (
          recentMilestones.map((milestone, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div>
                <p className="text-white font-medium">{milestone.member_name}</p>
                <p className="text-gray-400 text-sm">{milestone.referral_count} referrals</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-bold">${milestone.milestone_amount}</p>
                <span className={`text-xs px-2 py-1 rounded ${milestone.status === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                  {milestone.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent milestones</p>
        )}
      </div>
    </div>
  );
}

function RecentTicketsCard() {
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTickets();
  }, []);

  const fetchRecentTickets = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/recent/tickets?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentTickets(response.data.recent_tickets);
    } catch (error) {
      console.error('Failed to fetch recent tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-500 text-white';
      case 'in_progress': return 'bg-yellow-500 text-black';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Recent Tickets
        </h4>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading...</p>
        ) : recentTickets.length > 0 ? (
          recentTickets.map((ticket, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div className="flex-1">
                <p className="text-white font-medium">#{ticket.ticket_id.slice(0, 8)}</p>
                <p className="text-gray-400 text-sm truncate">{ticket.subject}</p>
                <p className="text-gray-500 text-xs">{ticket.member_name} • {ticket.department}</p>
              </div>
              <div className="text-right ml-4">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No recent tickets</p>
        )}
      </div>
    </div>
  );
}



export default AnalyticsTab;
