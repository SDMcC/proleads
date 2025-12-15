import React, { useState } from 'react';
import axios from 'axios';
import { Settings } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function AccountSettingsTab({ user }) {
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    wallet_address: user?.address || '',
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validation
    if (profileData.new_password && profileData.new_password !== profileData.confirm_new_password) {
      alert('New passwords do not match');
      return;
    }

    if (profileData.new_password && profileData.new_password.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    if (profileData.wallet_address && (!profileData.wallet_address.startsWith('0x') || profileData.wallet_address.length !== 42)) {
      alert('Please enter a valid Ethereum wallet address');
      return;
    }

    setLoading(true);
    try {
      const updateData = {};
      
      if (profileData.email !== user?.email) {
        updateData.email = profileData.email;
      }
      
      if (profileData.wallet_address !== user?.address) {
        updateData.wallet_address = profileData.wallet_address;
      }
      
      if (profileData.new_password) {
        updateData.current_password = profileData.current_password;
        updateData.new_password = profileData.new_password;
      }

      if (Object.keys(updateData).length === 0) {
        alert('No changes detected');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/users/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Profile updated successfully!');
      
      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      }));
      
    } catch (error) {
      console.error('Profile update failed:', error);
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = `Update failed: ${error.response.data.detail}`;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAccount = async () => {
    if (!window.confirm('Are you sure you want to cancel your account? This action cannot be undone.')) {
      return;
    }

    if (!window.confirm('WARNING: This will permanently delete your account and all associated data. Are you absolutely sure?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/cancel-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Your account has been cancelled successfully.');
      localStorage.removeItem('token');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Account cancellation failed:', error);
      alert('Failed to cancel account. Please contact support.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Account Settings</h3>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-gray-500 text-xs mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Wallet Address</label>
            <input
              type="text"
              value={profileData.wallet_address}
              onChange={(e) => setProfileData(prev => ({ ...prev, wallet_address: e.target.value }))}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              placeholder="0x1234567890123456789012345678901234567890"
              required
            />
            <p className="text-gray-400 text-xs mt-1">Update this if you lose access to your current wallet</p>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h4 className="text-lg font-semibold text-white mb-3">Change Password</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={profileData.current_password}
                  onChange={(e) => setProfileData(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={profileData.new_password}
                  onChange={(e) => setProfileData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={profileData.confirm_new_password}
                  onChange={(e) => setProfileData(prev => ({ ...prev, confirm_new_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Account Actions */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Account Actions</h3>
        
        <div className="space-y-4">
          <div className="border border-red-600 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-400 mb-2">Cancel Account</h4>
            <p className="text-gray-300 text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={handleCancelAccount}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
            >
              Cancel Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Referrals Tab Component 

export default AccountSettingsTab;
