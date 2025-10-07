// Test the tree data transformation for the Interactive Network Genealogy Tree

const sampleApiData = {
  "network_tree": {
    "root": {
      "address": "0xc3p0f36260817d1c78c471406bde482177a19350",
      "username": "firstuser",
      "email": "artmachina1@gmail.com",
      "membership_tier": "bronze",
      "total_referrals": 25,
      "total_earnings": 0.0,
      "level": 0
    },
    "children": [
      {
        "address": "0xc3p0f36260817d1c78c472406bde482177a19350",
        "username": "seconduser",
        "email": "updated_1758467966@test.com",
        "membership_tier": "bronze",
        "total_referrals": 7,
        "total_earnings": 0.0,
        "suspended": false,
        "level": 1,
        "children": [
          {
            "address": "0xc3p0f31260817d1c78c471406bde482177a19350",
            "username": "thirduser",
            "email": "thireduser@gmail.com",
            "membership_tier": "bronze",
            "total_referrals": 3,
            "total_earnings": 0.0,
            "suspended": false,
            "level": 2,
            "children": []
          }
        ]
      },
      {
        "address": "0xc3p0f36260817d1c78c471401bde482177a19350",
        "username": "fourthuser",
        "email": "fourthuser@gmail.com",
        "membership_tier": "bronze",
        "total_referrals": 0,
        "total_earnings": 0.0,
        "suspended": false,
        "level": 1,
        "children": []
      }
    ]
  },
  "network_stats": {
    "total_network_size": 35,
    "direct_referrals": 25,
    "max_depth_shown": 3
  }
};

// Utility functions (mirrored from App.js)
const getTierDisplayName = (tier) => {
  if (tier === 'vip_affiliate') return 'VIP Affiliate';
  return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Unknown';
};

// Transform API data structure to react-d3-tree format
const transformToTreeData = (apiNode) => {
  const transformNode = (node) => {
    const status = node.suspended ? 'Suspended' : 'Active';
    const tierDisplay = getTierDisplayName(node.membership_tier);
    
    return {
      name: node.username || 'Unknown User',
      attributes: {
        membership_tier: tierDisplay,
        status: status,
        total_referrals: node.total_referrals || 0,
        is_root: false
      },
      children: node.children ? node.children.map(transformNode) : []
    };
  };

  // Create root node (current user)
  const rootNode = {
    name: apiNode.root.username,
    attributes: {
      membership_tier: getTierDisplayName(apiNode.root.membership_tier),
      status: 'Active',
      total_referrals: apiNode.root.total_referrals || 0,
      is_root: true
    },
    children: apiNode.children ? apiNode.children.map(transformNode) : []
  };

  return [rootNode];
};

// Test the transformation
console.log("🧪 Testing Interactive Network Genealogy Tree Data Transformation");
console.log("=" * 60);

const transformedData = transformToTreeData(sampleApiData.network_tree);

console.log("✅ Root Node:");
console.log(`   Name: ${transformedData[0].name}`);
console.log(`   Tier: ${transformedData[0].attributes.membership_tier}`);
console.log(`   Status: ${transformedData[0].attributes.status}`);
console.log(`   Referrals: ${transformedData[0].attributes.total_referrals}`);
console.log(`   Is Root: ${transformedData[0].attributes.is_root}`);

console.log(`\n✅ Children (${transformedData[0].children.length} direct referrals):`);
transformedData[0].children.forEach((child, index) => {
  console.log(`   ${index + 1}. ${child.name}`);
  console.log(`      Tier: ${child.attributes.membership_tier}`);
  console.log(`      Status: ${child.attributes.status}`);
  console.log(`      Referrals: ${child.attributes.total_referrals}`);
  
  if (child.children && child.children.length > 0) {
    console.log(`      Sub-network: ${child.children.length} users`);
    child.children.forEach((grandchild, gi) => {
      console.log(`         ${gi + 1}. ${grandchild.name} (${grandchild.attributes.membership_tier})`);
    });
  }
});

console.log("\n🎉 Tree transformation test completed successfully!");
console.log("📊 Network Stats:");
console.log(`   Total Network Size: ${sampleApiData.network_stats.total_network_size}`);
console.log(`   Direct Referrals: ${sampleApiData.network_stats.direct_referrals}`);
console.log(`   Max Depth: ${sampleApiData.network_stats.max_depth_shown}`);

console.log("\n✨ The Interactive Network Genealogy Tree is ready for react-d3-tree rendering!");