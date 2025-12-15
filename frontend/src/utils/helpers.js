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
