import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function NotificationSettingsTab({ user }) {
  const [preferences, setPreferences] = useState({
    new_referrals: true,
    lead_distribution: true,
    payment_confirmation: true,
    subscription_reminders: true,
    commission_payouts: true,
    referral_upgrade: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Notification history state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPreferences();
    fetchNotifications();
  }, [currentPage]);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(response.data.email_notifications);
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/users/notifications?page=${currentPage}&limit=${itemsPerPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data.notifications);
      setTotalPages(response.data.total_pages);
      setTotalNotifications(response.data.total);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const viewNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/users/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedNotification(response.data);
      setShowNotificationPanel(true);
      // Refresh the notifications list to update read status
      fetchNotifications();
    } catch (error) {
      console.error('Failed to fetch notification details:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/users/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh the notifications list
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      alert('Failed to delete notification. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggle = async (key) => {
    const newValue = !preferences[key];
    const newPreferences = { ...preferences, [key]: newValue };
    
    // Update UI immediately
    setPreferences(newPreferences);
    
    // Save to backend
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/users/notification-preferences`,
        { [key]: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveMessage('Preferences saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      // Revert on error
      setPreferences(preferences);
      setSaveMessage('Failed to save preferences. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-300 mt-4">Loading preferences...</p>
      </div>
    );
  }

  const notificationTypes = [
    {
      key: 'new_referrals',
      label: 'New Referrals',
      description: 'Get notified when someone signs up using your referral link'
    },
    {
      key: 'lead_distribution',
      label: 'Lead Distribution',
      description: 'Get notified when new leads are distributed to your account'
    },
    {
      key: 'payment_confirmation',
      label: 'Payment Confirmation',
      description: 'Get notified when your payment is confirmed'
    },
    {
      key: 'subscription_reminders',
      label: 'Subscription Reminders',
      description: 'Get reminded 3 days before your subscription renewal'
    },
    {
      key: 'commission_payouts',
      label: 'Commission Payouts',
      description: 'Get notified when your milestone commission is paid'
    },
    {
      key: 'referral_upgrade',
      label: 'Referral Upgrades',
      description: 'Get notified when your referrals upgrade their membership'
    }
  ];

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Email Notification Settings</h3>
          <p className="text-gray-300 text-sm">Manage which email notifications you want to receive</p>
        </div>
        {saveMessage && (
          <div className={`px-4 py-2 rounded-lg ${
            saveMessage.includes('success') ? 'bg-green-600' : 'bg-red-600'
          } text-white text-sm`}>
            {saveMessage}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {notificationTypes.map((type) => (
          <div
            key={type.key}
            className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all duration-300"
          >
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1">{type.label}</h4>
              <p className="text-gray-400 text-sm">{type.description}</p>
            </div>
            <button
              onClick={() => handleToggle(type.key)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                preferences[type.key] ? 'bg-blue-600' : 'bg-gray-600'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Notification History Section */}
      <div className="mt-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Notification History</h3>
            <p className="text-gray-300 text-sm">View all your past notifications</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotificationPanel(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <Bell className="h-5 w-5" />
              <span className="font-medium">Quick View</span>
            </button>
            {totalNotifications > 0 && (
              <div className="px-4 py-2 bg-blue-600 bg-opacity-30 rounded-lg">
                <span className="text-white text-sm font-medium">{totalNotifications} Total</span>
              </div>
            )}
          </div>
        </div>

        {notificationsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">You'll see your notifications here when you receive them</p>
          </div>
        ) : (
          <>
            {/* Notifications Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white border-opacity-10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Date</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Subject</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm">Status</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => (
                    <tr 
                      key={notification.notification_id} 
                      className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-300 text-sm">
                        {formatDate(notification.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                          <span className={`text-sm ${notification.read ? 'text-gray-400' : 'text-white font-medium'}`}>
                            {notification.subject}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.read 
                            ? 'bg-gray-600 bg-opacity-50 text-gray-300' 
                            : 'bg-blue-600 bg-opacity-50 text-blue-300'
                        }`}>
                          {notification.read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => viewNotification(notification.notification_id)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white border-opacity-10">
                <div className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Slide-Out Panel */}
      {showNotificationPanel && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            style={{ zIndex: 1000 }}
            onClick={() => {
              setShowNotificationPanel(false);
              setSelectedNotification(null);
            }}
          />
          
          {/* Slide-out Panel */}
          <div 
            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col"
            style={{ zIndex: 1001 }}
          >
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Notifications</h2>
                  <p className="text-blue-100 text-sm mt-1">{totalNotifications} total notifications</p>
                </div>
                <button
                  onClick={() => {
                    setShowNotificationPanel(false);
                    setSelectedNotification(null);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Panel Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {selectedNotification ? (
                /* Notification Detail View */
                <div className="p-6">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>Back to list</span>
                  </button>
                  
                  <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{selectedNotification.subject}</h3>
                      <p className="text-gray-400 text-sm flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(selectedNotification.created_at)}</span>
                      </p>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4">
                      <div className="prose prose-invert max-w-none">
                        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {selectedNotification.body}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Notification List View */
                <div className="p-4 space-y-2">
                  {notificationsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-400 mt-4">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No notifications yet</p>
                      <p className="text-gray-500 text-sm mt-2">You'll see updates here when you receive notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.notification_id}
                        className={`p-4 rounded-lg transition-all border ${
                          notification.read ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-900/20 border-blue-700/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer hover:opacity-80"
                            onClick={() => viewNotification(notification.notification_id)}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {!notification.read && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                              <h4 className="text-white font-medium truncate">{notification.subject}</h4>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">{notification.body}</p>
                            <p className="text-gray-500 text-xs mt-2">{formatDate(notification.created_at)}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.notification_id);
                            }}
                            className="ml-2 p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-all flex-shrink-0"
                            title="Clear from list"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 pb-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-gray-400 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// KYC Verification Tab Component

export default NotificationSettingsTab;
