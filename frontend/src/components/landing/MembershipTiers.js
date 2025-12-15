import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TierCard from './TierCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function MembershipTiers({ referralCode }) {
  const [tiers, setTiers] = useState({});

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await axios.get(`${API_URL}/membership/tiers`);
        setTiers(response.data.tiers || {});
      } catch (error) {
        console.error('Failed to fetch tiers:', error);
      }
    };
    fetchTiers();
  }, []);

  const tierConfigs = [
    { name: 'affiliate', popular: false },
    { name: 'bronze', popular: false },
    { name: 'silver', popular: true },
    { name: 'gold', popular: false }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {tierConfigs.map(({ name, popular }) => {
        const tierData = tiers[name];
        if (!tierData) return null;

        return (
          <TierCard 
            key={name} 
            tier={{
              name: name.charAt(0).toUpperCase() + name.slice(1),
              price: tierData.price,
              currency: tierData.price === 0 ? 'FREE' : 'USD',
              commissions: tierData.commissions.map(rate => `${Math.round(rate * 100)}%`),
              popular
            }} 
            referralCode={referralCode} 
          />
        );
      })}
    </div>
  );
}

export default MembershipTiers;
