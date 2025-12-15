import React from 'react';
import { User } from 'lucide-react';

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
      {accountSubTab === 'settings' && <AccountSettingsOnlyTab user={user} />}
      {accountSubTab === 'notifications' && <NotificationSettingsTab user={user} />}
      {accountSubTab === 'kyc' && <KYCVerificationTab user={user} />}
      {accountSubTab === 'cancel' && <CancelAccountTab />}
    </div>
  );
}

// Notification Settings Tab Component

export default AccountTab;
