import React from 'react';
import { User, Settings, Bell, Shield, UserX } from 'lucide-react';
import AccountSettingsTab from './AccountSettingsTab';
import NotificationSettingsTab from './NotificationSettingsTab';
import KYCVerificationTab from './KYCVerificationTab';

function AccountTab({ user, accountSubTab, setAccountSubTab }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Account Management</h2>
      </div>

      {/* Account Sub-tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'settings', label: 'Account Settings', icon: Settings },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'kyc', label: 'KYC', icon: Shield },
          { id: 'cancel', label: 'Cancel Account', icon: UserX }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAccountSubTab(id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              accountSubTab === id
                ? 'bg-blue-600 text-white'
                : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Account Sub-tab Content */}
      {accountSubTab === 'settings' && <AccountSettingsTab user={user} />}
      {accountSubTab === 'notifications' && <NotificationSettingsTab user={user} />}
      {accountSubTab === 'kyc' && <KYCVerificationTab user={user} />}
      {accountSubTab === 'cancel' && <CancelAccountTab />}
    </div>
  );
}

// Cancel Account Tab Component
function CancelAccountTab() {
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Cancel Account</h3>
      <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4 mb-6">
        <p className="text-red-300 text-sm">
          <strong>Warning:</strong> Account cancellation is permanent and cannot be undone. All your data will be deleted.
        </p>
      </div>
      <p className="text-gray-300 mb-6">
        If you wish to cancel your account, please contact support for assistance.
      </p>
      <button
        onClick={() => alert('Please contact support to cancel your account')}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300"
      >
        Contact Support
      </button>
    </div>
  );
}

export default AccountTab;
