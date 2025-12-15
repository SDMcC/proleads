import React from 'react';
import { CheckCircle } from 'lucide-react';

const getTierDisplayName = (tier) => {
  const tierNames = {
    'affiliate': 'Free Affiliate',
    'bronze': 'Bronze',
    'silver': 'Silver',
    'gold': 'Gold',
    'vip_affiliate': 'VIP Affiliate',
    'test': 'Test'
  };
  return tierNames[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
};

function EnhancedMembershipTiers({ tiers, referralCode, loading }) {
  const publicTiers = ['affiliate', 'bronze', 'silver', 'gold'];
  
  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-dark transition-colors duration-300" id="pricing">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-dark transition-colors duration-300" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
            Choose Your Membership Level
          </h2>
          <p className="text-lg text-body-color dark:text-body-color-dark max-w-3xl mx-auto">
            Select the tier that matches your growth goals. Every plan includes weekly leads, full dashboard access, and the referral program.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {publicTiers.map((tierId) => {
            const tier = tiers[tierId];
            if (!tier) return null;
            
            const isAffiliate = tierId === 'affiliate';
            const price = tier.price;
            const commissions = tier.commissions || [];
            
            // Define leads per week
            const leadsPerWeek = {
              affiliate: 0,
              bronze: 100,
              silver: 250,
              gold: 500
            }[tierId] || 0;

            return (
              <div key={tierId} className={`relative bg-white dark:bg-dark border-2 rounded-lg shadow-lg overflow-hidden transition-colors duration-300 ${
                tierId === 'silver' ? 'border-blue-500 dark:border-blue-400 transform scale-105' : 'border-stroke dark:border-stroke-dark'
              }`}>
                {tierId === 'silver' && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-500 dark:bg-blue-400 text-white dark:text-black text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-black dark:text-white capitalize mb-2">
                      {getTierDisplayName(tierId)}
                    </h3>
                    <div className="text-3xl font-bold text-black dark:text-white mb-2">
                      {isAffiliate ? 'FREE' : `$${price}`}
                      {!isAffiliate && <span className="text-lg text-body-color dark:text-body-color-dark">/month</span>}
                    </div>
                    {isAffiliate && (
                      <p className="text-sm text-body-color dark:text-body-color-dark">Lifetime Access</p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
                      <span className="text-body-color dark:text-body-color-dark">
                        {leadsPerWeek > 0 ? `${leadsPerWeek} leads/week` : 'Affiliate program access'}
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
                      <span className="text-body-color dark:text-body-color-dark">
                        {commissions.length === 4 ? '4-tier commissions' : '2-tier commissions'}
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
                      <span className="text-body-color dark:text-body-color-dark">Instant USDC payouts</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
                      <span className="text-body-color dark:text-body-color-dark">Member dashboard</span>
                    </li>
                  </ul>

                  {commissions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-black dark:text-white mb-2">Commission Structure:</h4>
                      <div className="text-xs text-body-color dark:text-body-color-dark space-y-1">
                        {commissions.map((rate, index) => (
                          <div key={index}>Tier {index + 1}: {Math.round(rate * 100)}%</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <a 
                    href={`/register?tier=${tierId}${referralCode ? `&ref=${referralCode}` : ''}`}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      tierId === 'silver' 
                        ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white dark:text-black' 
                        : 'bg-primary hover:bg-primary/80 text-white'
                    }`}
                  >
                    {isAffiliate ? 'Join Free' : 'Choose Plan'}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default EnhancedMembershipTiers;
