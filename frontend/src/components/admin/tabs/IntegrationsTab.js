import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, RefreshCcw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function IntegrationsTab() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);
  const [formData, setFormData] = useState({
    integration_name: 'automailer',
    description: '',
    permissions: ['csv_export', 'user_info', 'sso_verify'],
    rate_limit: 100
  });

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/integrations/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApiKeys(response.data.api_keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      alert('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_URL}/admin/integrations/api-keys`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Show the created key (only shown once!)
      setCreatedKey(response.data.api_key);
      setShowCreateModal(false);
      
      // Refresh the list
      fetchAPIKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/admin/integrations/api-keys/${keyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('API key revoked successfully');
      fetchAPIKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Failed to revoke API key');
    }
  };

  const handleRotateKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to rotate this API key? The old key will be valid for 24 hours.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_URL}/admin/integrations/api-keys/${keyId}/rotate`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Show the new key
      setCreatedKey({ api_key: response.data.new_api_key, key_id: keyId });
      fetchAPIKeys();
    } catch (error) {
      console.error('Failed to rotate API key:', error);
      alert('Failed to rotate API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">API Key Management</h2>
          <p className="text-gray-400 mt-2">Manage API keys for external integrations (AutoMailer, etc.)</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create API Key</span>
        </button>
      </div>

      {/* API Keys List */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API keys created yet</p>
            <p className="text-sm mt-2">Create your first API key to enable integrations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black bg-opacity-30 text-gray-300 text-sm">
                  <th className="px-6 py-4 text-left font-medium">Integration</th>
                  <th className="px-6 py-4 text-left font-medium">Description</th>
                  <th className="px-6 py-4 text-left font-medium">Permissions</th>
                  <th className="px-6 py-4 text-left font-medium">Rate Limit</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-left font-medium">Usage</th>
                  <th className="px-6 py-4 text-left font-medium">Last Used</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {apiKeys.map((key) => (
                  <tr key={key.key_id} className="text-gray-300 hover:bg-white hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link className="h-5 w-5 text-red-400" />
                        <span className="font-medium text-white">{key.integration_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{key.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 bg-blue-600 bg-opacity-30 text-blue-300 text-xs rounded"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {key.rate_limit}/{key.rate_limit_period}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          key.status === 'active'
                            ? 'bg-green-600 bg-opacity-30 text-green-300'
                            : key.status === 'rotating'
                            ? 'bg-yellow-600 bg-opacity-30 text-yellow-300'
                            : 'bg-red-600 bg-opacity-30 text-red-300'
                        }`}
                      >
                        {key.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{key.usage_count || 0} requests</td>
                    <td className="px-6 py-4 text-sm">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleRotateKey(key.key_id)}
                          className="p-2 hover:bg-yellow-600 hover:bg-opacity-20 rounded-lg transition-colors"
                          title="Rotate API Key"
                        >
                          <RotateCw className="h-4 w-4 text-yellow-400" />
                        </button>
                        <button
                          onClick={() => handleRevokeKey(key.key_id)}
                          className="p-2 hover:bg-red-600 hover:bg-opacity-20 rounded-lg transition-colors"
                          title="Revoke API Key"
                          disabled={key.status === 'revoked'}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-red-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Create New API Key</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Integration Name</label>
                <input
                  type="text"
                  value={formData.integration_name}
                  onChange={(e) => setFormData({ ...formData, integration_name: e.target.value })}
                  className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., automailer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  rows="3"
                  placeholder="e.g., Production API key for AutoMailer integration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
                <div className="space-y-2">
                  {['csv_export', 'user_info', 'sso_verify'].map((perm) => (
                    <label key={perm} className="flex items-center space-x-3 text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [...formData.permissions, perm]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter((p) => p !== perm)
                            });
                          }
                        }}
                        className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rate Limit (requests per hour)</label>
                <input
                  type="number"
                  value={formData.rate_limit}
                  onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-black bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all"
              >
                Create API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show Created Key Modal (Only shown once!) */}
      {createdKey && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-green-900 rounded-xl p-8 max-w-2xl w-full">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <h3 className="text-2xl font-bold text-white">API Key Created Successfully!</h3>
            </div>
            
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 font-medium mb-2">⚠️ Important: Save this key now!</p>
              <p className="text-yellow-200 text-sm">
                This API key will only be displayed once. Make sure to copy and store it securely.
              </p>
            </div>

            <div className="bg-black bg-opacity-50 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">API Key:</span>
                <button
                  onClick={() => copyToClipboard(createdKey.api_key)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-all flex items-center space-x-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              </div>
              <code className="text-green-400 text-sm break-all">{createdKey.api_key}</code>
            </div>

            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <p>• Store this key in a secure location (password manager, secrets vault)</p>
              <p>• Add it to your AutoMailer environment variables</p>
              <p>• Never expose it in client-side code or public repositories</p>
            </div>

            <button
              onClick={() => setCreatedKey(null)}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all"
            >
              I've Saved the Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Configuration Tab Component for Admin

export default IntegrationsTab;
