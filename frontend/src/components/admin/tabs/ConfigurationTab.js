import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, RefreshCcw, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { getTierBadgeClass, getTierDisplayName } from '../../../utils/helpers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function ConfigurationTab() {
  const [config, setConfig] = useState(null);
  const [membershipTiers, setMembershipTiers] = useState({});
  const [paymentProcessors, setPaymentProcessors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('membership');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/config/system`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(response.data.config);
      setMembershipTiers(response.data.config.membership_tiers || {});
      setPaymentProcessors(response.data.config.payment_processors || {});
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      alert('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateMembershipTier = (tierName, field, value) => {
    setMembershipTiers(prev => ({
      ...prev,
      [tierName]: {
        ...prev[tierName],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const updatePaymentProcessor = (processorName, field, value) => {
    setPaymentProcessors(prev => ({
      ...prev,
      [processorName]: {
        ...prev[processorName],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const saveMembershipTiers = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Convert to the format expected by the API
      const tiersData = {};
      Object.keys(membershipTiers).forEach(tierName => {
        const tier = membershipTiers[tierName];
        tiersData[tierName] = {
          tier_name: tierName,
          price: parseFloat(tier.price) || 0,
          commissions: tier.commissions.map(c => parseFloat(c) || 0),
          enabled: tier.enabled !== false,
          description: tier.description || `${tierName.charAt(0).toUpperCase() + tierName.slice(1)} membership tier`
        };
      });

      const response = await axios.put(`${API_URL}/admin/config/membership-tiers`, tiersData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnsavedChanges(false);
      alert('Membership tiers updated successfully!');
      await fetchConfiguration(); // Refresh configuration
    } catch (error) {
      console.error('Failed to save membership tiers:', error);
      alert('Failed to save membership tiers: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const savePaymentProcessors = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Convert to the format expected by the API
      const processorsData = {};
      Object.keys(paymentProcessors).forEach(processorName => {
        const processor = paymentProcessors[processorName];
        processorsData[processorName] = {
          processor_name: processorName,
          api_key: processor.api_key || null,
          public_key: processor.public_key || null,
          ipn_secret: processor.ipn_secret || null,
          enabled: processor.enabled !== false,
          supported_currencies: processor.supported_currencies || ["BTC", "ETH", "USDC", "USDT"]
        };
      });

      const response = await axios.put(`${API_URL}/admin/config/payment-processors`, processorsData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnsavedChanges(false);
      alert('Payment processors updated successfully!');
      await fetchConfiguration(); // Refresh configuration
    } catch (error) {
      console.error('Failed to save payment processors:', error);
      alert('Failed to save payment processors: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all configuration to defaults? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/config/reset-to-defaults`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Configuration reset to defaults successfully!');
      await fetchConfiguration(); // Refresh configuration
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      alert('Failed to reset configuration: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
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
      {/* Section Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveSection('membership')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            activeSection === 'membership'
              ? 'bg-red-600 text-white'
              : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
          }`}
        >
          Membership Tiers
        </button>
        <button
          onClick={() => setActiveSection('payment')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            activeSection === 'payment'
              ? 'bg-red-600 text-white'
              : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
          }`}
        >
          Payment Processors
        </button>
        <button
          onClick={() => setActiveSection('tools')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            activeSection === 'tools'
              ? 'bg-red-600 text-white'
              : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
          }`}
        >
          System Tools
        </button>
      </div>

      {unsavedChanges && (
        <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-200 font-medium">You have unsaved changes</span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => fetchConfiguration().then(() => setUnsavedChanges(false))}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all duration-300"
              >
                Discard
              </button>
              <button
                onClick={activeSection === 'membership' ? saveMembershipTiers : savePaymentProcessors}
                disabled={saving}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-all duration-300"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Tiers Configuration */}
      {activeSection === 'membership' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Membership Tiers Configuration</h3>
            <div className="space-x-2">
              <button
                onClick={resetToDefaults}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
              >
                Reset to Defaults
              </button>
              <button
                onClick={saveMembershipTiers}
                disabled={saving || !unsavedChanges}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {Object.keys(membershipTiers).map(tierName => {
              const tier = membershipTiers[tierName];
              return (
                <div key={tierName} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-white capitalize">{tierName} Tier</h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tier.enabled !== false}
                        onChange={(e) => updateMembershipTier(tierName, 'enabled', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-300">Enabled</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.price || 0}
                        onChange={(e) => updateMembershipTier(tierName, 'price', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={tier.description || ''}
                        onChange={(e) => updateMembershipTier(tierName, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder={`${tierName.charAt(0).toUpperCase() + tierName.slice(1)} membership tier`}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Commission Rates (as decimals, e.g., 0.25 for 25%)
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {(tier.commissions || []).map((commission, index) => (
                        <div key={index}>
                          <label className="text-xs text-gray-400">Level {index + 1}</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={commission || 0}
                            onChange={(e) => {
                              const newCommissions = [...(tier.commissions || [])];
                              newCommissions[index] = parseFloat(e.target.value) || 0;
                              updateMembershipTier(tierName, 'commissions', newCommissions);
                            }}
                            className="w-full px-2 py-1 bg-black bg-opacity-30 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Processors Configuration */}
      {activeSection === 'payment' && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Payment Processors Configuration</h3>
            <button
              onClick={savePaymentProcessors}
              disabled={saving || !unsavedChanges}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="space-y-6">
            {Object.keys(paymentProcessors).map(processorName => {
              const processor = paymentProcessors[processorName];
              return (
                <div key={processorName} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-white capitalize">{processorName}</h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={processor.enabled !== false}
                        onChange={(e) => updatePaymentProcessor(processorName, 'enabled', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-300">Enabled</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={processor.api_key === '***HIDDEN***' ? '' : (processor.api_key || '')}
                        onChange={(e) => updatePaymentProcessor(processorName, 'api_key', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder={processor.api_key === '***HIDDEN***' ? 'Current value hidden' : 'Enter API key'}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Public Key
                      </label>
                      <input
                        type="text"
                        value={processor.public_key === '***HIDDEN***' ? '' : (processor.public_key || '')}
                        onChange={(e) => updatePaymentProcessor(processorName, 'public_key', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder={processor.public_key === '***HIDDEN***' ? 'Current value hidden' : 'Enter public key'}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        IPN Secret
                      </label>
                      <input
                        type="password"
                        value={processor.ipn_secret === '***HIDDEN***' ? '' : (processor.ipn_secret || '')}
                        onChange={(e) => updatePaymentProcessor(processorName, 'ipn_secret', e.target.value)}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder={processor.ipn_secret === '***HIDDEN***' ? 'Current value hidden' : 'Enter IPN secret'}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Supported Currencies (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(processor.supported_currencies || []).join(', ')}
                        onChange={(e) => updatePaymentProcessor(processorName, 'supported_currencies', e.target.value.split(',').map(c => c.trim()))}
                        className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
                        placeholder="BTC, ETH, USDC, USDT"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    <p><strong>Note:</strong> Changes to payment processor configuration may require application restart to take full effect.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* System Tools Section */}
      {activeSection === 'tools' && (
        <div className="space-y-6">
          {/* Referral Code Migration Tool */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                <RefreshCcw className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Migrate Referral Codes</h3>
                <p className="text-gray-300">
                  Update all user referral codes to use the new username-based format. This will change referral URLs from 
                  <code className="mx-1 px-2 py-1 bg-black bg-opacity-30 rounded text-blue-300">REFFIRSTUSER5DCBEE</code>
                  to 
                  <code className="mx-1 px-2 py-1 bg-black bg-opacity-30 rounded text-green-300">firstuser</code>
                </p>
              </div>
            </div>

            <MigrationButton />
          </div>

          {/* Future tools can be added here */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-center text-gray-400 py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>More system tools will be added here in future updates</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Migration Button Component
function MigrationButton() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const runMigration = async () => {
    if (!window.confirm('Are you sure you want to migrate all referral codes? This will update all users in the production database.')) {
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/admin/migrate/referral-codes`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResult({
        success: true,
        data: response.data
      });

      alert(`Migration completed successfully!\n\nTotal users: ${response.data.total_users}\nUpdated: ${response.data.updated}\nSkipped: ${response.data.skipped}`);

    } catch (error) {
      console.error('Migration failed:', error);
      setResult({
        success: false,
        error: error.response?.data?.detail || error.message
      });
      alert('Migration failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={runMigration}
        disabled={migrating}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
          migrating
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {migrating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Migrating...</span>
          </>
        ) : (
          <>
            <RefreshCcw className="h-5 w-5" />
            <span>Run Migration</span>
          </>
        )}
      </button>

      {result && (
        <div className={`border rounded-lg p-4 ${
          result.success
            ? 'bg-green-900 bg-opacity-20 border-green-500'
            : 'bg-red-900 bg-opacity-20 border-red-500'
        }`}>
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-bold mb-2 ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                {result.success ? 'Migration Successful!' : 'Migration Failed'}
              </h4>
              {result.success ? (
                <div className="text-gray-300 space-y-1">
                  <p><strong>Total Users:</strong> {result.data.total_users}</p>
                  <p><strong>Updated:</strong> {result.data.updated}</p>
                  <p><strong>Skipped:</strong> {result.data.skipped}</p>
                  {result.data.errors && result.data.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-yellow-300"><strong>Warnings:</strong></p>
                      <ul className="list-disc list-inside text-sm">
                        {result.data.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-gray-400">
                    ✅ All users can now log out and log back in to see their new referral URLs
                  </p>
                </div>
              ) : (
                <p className="text-red-300">{result.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <p className="font-semibold mb-2">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This migration is safe to run multiple times</li>
              <li>Users will need to log out and log back in to see updated URLs</li>
              <li>Old referral links will continue to work</li>
              <li>This only updates the database - no code changes required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Member Modal Component
function MemberModal({ member, editingMember, onClose, onUpdate, onSuspend, onUnsuspend, onEdit }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    membership_tier: 'affiliate'
  });

  // Get the actual member data (handle both detailed and list member objects)
  const memberData = member?.member || member;

  useEffect(() => {
    if (memberData) {
      setFormData({
        username: memberData.username || '',
        email: memberData.email || '',
        membership_tier: memberData.membership_tier || 'affiliate'
      });
    }
  }, [memberData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (memberData) {
      onUpdate(memberData.id || memberData.wallet_address, formData);
    }
  };

  const handleSuspend = () => {
    if (memberData) {
      onSuspend(memberData.id || memberData.wallet_address);
    }
  };

  const handleUnsuspend = () => {
    if (memberData) {
      onUnsuspend(memberData.id || memberData.wallet_address);
    }
  };

  const handleEditClick = () => {
    onEdit(memberData);
  };

  if (!memberData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {editingMember ? 'Edit Member' : 'Member Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {editingMember ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Membership Tier</label>
              <select
                value={formData.membership_tier}
                onChange={(e) => setFormData(prev => ({ ...prev, membership_tier: e.target.value }))}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-400"
              >
                <option value="affiliate">Affiliate</option>
                <option value="test">Test</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="vip_affiliate">VIP Affiliate</option>
              </select>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Update Member
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Member Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">Tier:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs uppercase font-medium ${getTierBadgeClass(memberData.membership_tier)}`}>
                      {getTierDisplayName(memberData.membership_tier)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white ml-2">{memberData.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{memberData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Sponsor:</span>
                    <span className="text-white ml-2">
                      {member?.sponsor?.username || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Joined:</span>
                    <span className="text-white ml-2">
                      {new Date(memberData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Subscription Expires:</span>
                    <span className="text-white ml-2">
                      {memberData.subscription_expires_at ? 
                        new Date(memberData.subscription_expires_at).toLocaleDateString() : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Wallet:</span>
                    <span className="text-white ml-2 font-mono text-sm">
                      {memberData.wallet_address || memberData.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <div className="ml-2 flex gap-2 items-center">
                      {memberData.is_expired && (
                        <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-yellow-100">
                          Expired
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        memberData.suspended ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'
                      }`}>
                        {memberData.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">KYC Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs uppercase font-medium ${
                      memberData.kyc_status === 'verified' ? 'bg-green-600 text-green-100' :
                      memberData.kyc_status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                      memberData.kyc_status === 'rejected' ? 'bg-red-600 text-red-100' :
                      'bg-gray-600 text-gray-100'
                    }`}>
                      {memberData.kyc_status === 'verified' && '✓ Verified'}
                      {memberData.kyc_status === 'pending' && '⏳ Pending'}
                      {memberData.kyc_status === 'rejected' && '✗ Rejected'}
                      {(!memberData.kyc_status || memberData.kyc_status === 'unverified') && 'Unverified'}
                    </span>
                  </div>
                  {memberData.kyc_verified_at && (
                    <div>
                      <span className="text-gray-400">KYC Verified:</span>
                      <span className="text-white ml-2">
                        {new Date(memberData.kyc_verified_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">Total Referrals:</span>
                    <span className="text-white ml-2">{member?.stats?.total_referrals || memberData.total_referrals || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Earnings:</span>
                    <span className="text-white ml-2">${(member?.stats?.total_earnings || memberData.total_earnings || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Payments:</span>
                    <span className="text-white ml-2">{member?.stats?.total_payments || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-6 border-t border-gray-700">
              <button
                onClick={handleEditClick}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Edit Member
              </button>
              {memberData.suspended ? (
                <button
                  onClick={handleUnsuspend}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  Unsuspend Member
                </button>
              ) : (
                <button
                  onClick={handleSuspend}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  Suspend Member
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
  );
}

// Admin Milestones Tab Component

export default ConfigurationTab;
