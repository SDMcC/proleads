// Utility function to get tier display name
export const getTierDisplayName = (tier) => {
  if (tier === 'vip_affiliate') return 'VIP Affiliate';
  if (!tier) return 'Free';
  const tierNames = {
    'affiliate': 'Free Affiliate',
    'bronze': 'Bronze',
    'silver': 'Silver',
    'gold': 'Gold'
  };
  return tierNames[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
};

// Utility function to get tier badge colors
export const getTierBadgeClass = (tier) => {
  switch (tier) {
    case 'gold':
      return 'bg-yellow-600 text-yellow-100';
    case 'silver':
      return 'bg-gray-600 text-gray-100';
    case 'bronze':
      return 'bg-orange-600 text-orange-100';
    case 'test':
      return 'bg-green-600 text-green-100';
    case 'vip_affiliate':
      return 'bg-purple-600 text-purple-100';
    case 'affiliate':
    default:
      return 'bg-blue-600 text-blue-100';
  }
};
