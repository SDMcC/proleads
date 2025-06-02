
import React, { useState, useEffect } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { arbitrum, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Wallet, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  ExternalLink,
  Activity,
  Award,
  Network
} from 'lucide-react';
import './App.css';

// Components
const Navbar = ({ isConnected, address, handleConnect, handleDisconnect }) => {
  return (
    <nav className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">Web3 Membership</Link>
        <div className="flex space-x-4">
          <Link to="/" className="text-white hover:text-blue-200">Home</Link>
          {isConnected && (
            <Link to="/dashboard" className="text-white hover:text-blue-200">Dashboard</Link>
          )}
          {isConnected ? (
            <div className="flex items-center">
              <span className="text-green-300 mr-2">{address.slice(0, 6)}...{address.slice(-4)}</span>
              <button 
                onClick={handleDisconnect}
                className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnect}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// Home Page
const Home = ({ isConnected, handleConnect }) => {
  const [tiers, setTiers] = useState({});
  
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/membership/tiers`);
        setTiers(response.data.tiers || {});
      } catch (error) {
        console.error("Error fetching tiers:", error);
      }
    };
    
    fetchTiers();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-lg p-8 mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Web3 Membership Platform</h1>
        <p className="text-xl text-blue-100 mb-6">Join our blockchain-powered affiliate program and earn commissions</p>
        <img 
          src="https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2232&q=80" 
          alt="Blockchain" 
          className="rounded-lg mx-auto mb-6 max-w-full h-auto"
          style={{ maxHeight: "400px" }}
        />
        <Link 
          to="/register" 
          className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
        >
          Join Now
        </Link>
      </div>
      
      {/* Membership Tiers */}
      <h2 className="text-3xl font-bold text-center mb-8">Membership Tiers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {Object.entries(tiers).map(([tier, details]) => (
          <div key={tier} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className={`p-4 text-white text-center ${
              tier === 'affiliate' ? 'bg-gray-600' :
              tier === 'bronze' ? 'bg-yellow-700' :
              tier === 'silver' ? 'bg-gray-400' :
              'bg-yellow-500'
            }`}>
              <h3 className="text-xl font-bold">{tier.charAt(0).toUpperCase() + tier.slice(1)}</h3>
            </div>
            <div className="p-6">
              <p className="text-2xl font-bold text-center mb-4">
                ${details.price}
                {tier === 'affiliate' && <span className="text-green-600"> FREE</span>}
              </p>
              <h4 className="font-semibold mb-2">Commission Levels:</h4>
              <ul className="mb-6">
                {details.commissions.map((rate, index) => (
                  <li key={index} className="mb-1">
                    Level {index + 1}: {(rate * 100).toFixed(0)}%
                  </li>
                ))}
              </ul>
              <div className="text-center">
                <Link 
                  to="/register" 
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Select
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Commission Structure */}
      <h2 className="text-3xl font-bold text-center mb-8">Commission Structure Example</h2>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left">Tier</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left">Sale Amount</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left">Level 1 Commission</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left">Level 2 Commission</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left">Level 3 Commission</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left">Level 4 Commission</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b border-gray-200">Gold</td>
                <td className="py-2 px-4 border-b border-gray-200">$100</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$30.00</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$15.00</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$10.00</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$5.00</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-gray-200">Silver</td>
                <td className="py-2 px-4 border-b border-gray-200">$50</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$13.50</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$5.00</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$2.50</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$1.50</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-gray-200">Bronze</td>
                <td className="py-2 px-4 border-b border-gray-200">$20</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$5.00</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$1.00</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$0.60</td>
                <td className="py-2 px-4 border-b border-gray-200 text-green-600">$0.40</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Register Page
const Register = ({ isConnected, handleConnect }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    referrerCode: ''
  });
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Registration logic would go here
    console.log("Registration data:", formData);
  };
  
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Connect Your Wallet to Register</h1>
        <p className="mb-6 text-gray-600">You need to connect your Web3 wallet to create an account</p>
        <button 
          onClick={handleConnect}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Create Your Account</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="referrerCode">
              Referrer Code (Optional)
            </label>
            <input
              type="text"
              id="referrerCode"
              name="referrerCode"
              value={formData.referrerCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

// Dashboard Page
const Dashboard = ({ isConnected }) => {
  if (!isConnected) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
        <p>Dashboard content would go here</p>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const handleConnect = async () => {
    await open();
  };
  
  const handleDisconnect = () => {
    disconnect();
  };
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar 
          isConnected={isConnected} 
          address={address || ''} 
          handleConnect={handleConnect}
          handleDisconnect={handleDisconnect}
        />
        <Routes>
          <Route path="/" element={<Home isConnected={isConnected} handleConnect={handleConnect} />} />
          <Route path="/register" element={<Register isConnected={isConnected} handleConnect={handleConnect} />} />
          <Route path="/dashboard" element={<Dashboard isConnected={isConnected} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
