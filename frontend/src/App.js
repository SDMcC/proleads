import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tiers, setTiers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/membership/tiers`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTiers(data.tiers || {});
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tiers:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchTiers();
  }, []);

  return (
    <div className="App">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4">Web3 Membership Platform</h1>
          <p className="text-xl mb-6">Join our exclusive membership program with 4-tier affiliate system</p>
          <button className="btn-primary">Connect Wallet</button>
        </div>
      </header>

      <main className="container mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Membership Tiers</h2>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="spinner w-12 h-12"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">
            Error loading membership tiers: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(tiers).map(([key, tier]) => (
              <div key={key} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className={`bg-${key === 'affiliate' ? 'gray' : key === 'bronze' ? 'yellow' : key === 'silver' ? 'gray' : 'yellow'}-500 p-4`}>
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                </div>
                <div className="p-6">
                  <p className="text-3xl font-bold mb-4">${tier.price}</p>
                  <ul className="mb-6">
                    {tier.benefits && tier.benefits.map((benefit, index) => (
                      <li key={index} className="mb-2 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full btn-primary">Select</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
