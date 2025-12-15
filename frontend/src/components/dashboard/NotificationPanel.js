import React from 'react';
import { X, Check, Eye } from 'lucide-react';

function NotificationPanel({ bellButtonRef, notifications, onClose, onClearNotification, onViewNotification, setActiveTab }) {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (bellButtonRef) {
      const rect = bellButtonRef.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px gap below the button
        right: window.innerWidth - rect.right, // Align to right edge of button
      });
    }
  }, [bellButtonRef]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div 
      className="notification-dropdown fixed w-80 bg-gray-900 rounded-xl shadow-xl border border-gray-700"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 9999
      }}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.filter(n => !n.read).length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No unread notifications</p>
          </div>
        ) : (
          notifications.filter(n => !n.read).map((notification) => (
            <div 
              key={notification.notification_id}
              className={`p-4 border-b border-gray-700 last:border-b-0 cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors ${
                !notification.read ? 'bg-blue-900 bg-opacity-20' : ''
              }`}
              onClick={() => onViewNotification(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {notification.type === 'new_referral' && <Users className="h-4 w-4 text-blue-500" />}
                    {notification.type === 'commission_payout' && <DollarSign className="h-4 w-4 text-green-500" />}
                    {notification.type === 'lead_distribution' && <Gift className="h-4 w-4 text-purple-500" />}
                    {notification.type === 'payment_confirmation' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {notification.type === 'referral_upgrade' && <TrendingUp className="h-4 w-4 text-yellow-500" />}
                    {notification.type === 'subscription_reminder' && <Clock className="h-4 w-4 text-orange-500" />}
                    <h4 className="text-sm font-medium text-white">{notification.subject}</h4>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{notification.body}</p>
                  {notification.type === 'ticket' && (
                    <button
                      onClick={() => {
                        onClose(); // Close notification panel
                        // Navigate to tickets tab
                        setActiveTab('tickets');
                      }}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      View Message →
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearNotification(notification.notification_id);
                  }}
                  className="ml-2 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Clear from list"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
// Admin Notification Panel Component (using Portal)
function AdminNotificationPanel({ bellButtonRef, notifications, onClose, onClearNotification, onViewNotification }) {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (bellButtonRef) {
      const rect = bellButtonRef.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px gap below the button
        right: window.innerWidth - rect.right, // Align to right edge of button
      });
    }
  }, [bellButtonRef]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.admin-notification-dropdown')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div 
      className="admin-notification-dropdown fixed w-80 bg-gray-900 rounded-xl shadow-xl border border-gray-700"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 9999
      }}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Admin Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No admin notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.notification_id}
              className={`p-4 border-b border-gray-700 last:border-b-0 ${
                !notification.read ? 'bg-blue-900 bg-opacity-20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {notification.type === 'payment' && <DollarSign className="h-4 w-4 text-green-500" />}
                    {notification.type === 'payment_confirmation' && <DollarSign className="h-4 w-4 text-green-500" />}
                    {notification.type === 'milestone' && <Award className="h-4 w-4 text-yellow-500" />}
                    {notification.type === 'kyc' && <Shield className="h-4 w-4 text-purple-500" />}
                    {notification.type === 'lead_distribution' && <Gift className="h-4 w-4 text-purple-500" />}
                    <h4 className="text-sm font-medium text-white">{notification.title || notification.subject}</h4>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{notification.message || notification.body}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => onClearNotification(notification.notification_id)}
                  className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

// Dashboard Tab Components
// OverviewTab Component - Now imported from components/dashboard/tabs/OverviewTab.js
// KYCEarningsCard Component - Now imported from components/dashboard/KYCEarningsCard.js
// NetworkTreeTab Component - Now imported from components/dashboard/tabs/NetworkTreeTab.js

// AffiliateToolsTab Component - Now imported from components/dashboard/tabs/AffiliateToolsTab.js

// EarningsTab Component - Now imported from components/dashboard/tabs/EarningsTab.js

// PaymentHistoryTab Component - Now imported from components/dashboard/tabs/PaymentHistoryTab.js

// MilestonesTab Component - Now imported from components/dashboard/tabs/MilestonesTab.js

// AccountSettingsTab Component - Now imported from components/dashboard/tabs/AccountSettingsTab.js
// Referrals Tab Component 
// ReferralsTab Component - Now imported from components/dashboard/tabs/ReferralsTab.js
// Autoresponder Tab Component
// AutoresponderTab Component - Now imported from components/dashboard/tabs/AutoresponderTab.js
// Tickets Tab Component (placeholder)
// TicketsTab Component - Now imported from components/dashboard/tabs/TicketsTab.js
// Enhanced Account Tab Component with sub-tabs

export default NotificationPanel;
