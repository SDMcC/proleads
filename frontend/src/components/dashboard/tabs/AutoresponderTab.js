import React from 'react';
import axios from 'axios';
import { Mail, ExternalLink, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function AutoresponderTab() {
  const openSendloop = async () => {
    try {
      // Initiate SSO to Sendloop
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/sso/initiate`,
        {
          target_app: 'sendloop',
          redirect_url: 'https://drip-campaign-hub.preview.emergentagent.com/dashboard'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Open Sendloop with SSO token
      if (response.data.redirect_url) {
        window.open(response.data.redirect_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to initiate SSO:', error);
      alert('Failed to open Sendloop. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Autoresponder</h2>
        <button
          onClick={openSendloop}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center space-x-2"
        >
          <ExternalLink className="h-5 w-5" />
          <span>Open Sendloop</span>
        </button>
      </div>
      
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <Mail className="h-16 w-16 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-3">Sendloop Integration</h3>
            <p className="text-gray-300 mb-4">
              Set up automated email sequences and campaigns using Sendloop. Export your leads and create 
              powerful email campaigns to engage with your network.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-black bg-opacity-30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">📧 Email Campaigns</h4>
                <p className="text-gray-400 text-sm">Create and manage automated email sequences</p>
              </div>
              <div className="bg-black bg-opacity-30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">📊 Analytics</h4>
                <p className="text-gray-400 text-sm">Track open rates, clicks, and conversions</p>
              </div>
              <div className="bg-black bg-opacity-30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">🎯 Lead Management</h4>
                <p className="text-gray-400 text-sm">Import and organize your leads easily</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Quick Start Guide</h4>
            <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
              <li>Click "Open Sendloop" to access your email automation platform</li>
              <li>Go to "My Lead Files" tab to export your leads to Sendloop</li>
              <li>Create email campaigns and sequences in Sendloop</li>
              <li>Track your campaign performance and optimize</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tickets Tab Component (placeholder)

export default AutoresponderTab;
