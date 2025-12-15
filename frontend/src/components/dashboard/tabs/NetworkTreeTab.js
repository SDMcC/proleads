import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Tree from 'react-d3-tree';
import { Network } from 'lucide-react';
import { getTierDisplayName } from '../../../utils/helpers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function NetworkTreeTab() {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depth, setDepth] = useState(3);
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    fetchNetworkTree();
  }, [depth]);

  const fetchNetworkTree = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/network-tree?depth=${depth}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNetworkData(response.data);
      
      // Transform API data to react-d3-tree format
      if (response.data?.network_tree) {
        const transformedData = transformToTreeData(response.data.network_tree);
        setTreeData(transformedData);
      }
    } catch (error) {
      console.error('Failed to fetch network tree:', error);
    } finally {
      setLoading(false);
    }
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
    // Use network stats direct_referrals if root total_referrals is 0 or missing
    const rootReferrals = apiNode.root.total_referrals || 
                         (networkData?.network_stats?.direct_referrals) || 0;
                         
    const rootNode = {
      name: apiNode.root.username,
      attributes: {
        membership_tier: getTierDisplayName(apiNode.root.membership_tier),
        status: 'Active',
        total_referrals: rootReferrals,
        is_root: true
      },
      children: apiNode.children ? apiNode.children.map(transformNode) : []
    };

    return [rootNode];
  };

  // Custom node label component
  const CustomNodeLabel = ({ nodeData, toggleNode }) => {
    const isRoot = nodeData.attributes?.is_root;
    const tier = nodeData.attributes?.membership_tier || 'Unknown';
    const status = nodeData.attributes?.status || 'Unknown';
    const referrals = nodeData.attributes?.total_referrals || 0;
    
    // Get tier border color (actual metallic colors)
    const getTierBorderColor = (tier) => {
      switch (tier?.toLowerCase()) {
        case 'gold': return '#FFD700';  // Gold
        case 'silver': return '#C0C0C0';  // Silver
        case 'bronze': return '#CD7F32';  // Bronze
        case 'test': return '#10B981';
        case 'vip affiliate': return '#A855F7';
        case 'affiliate':
        default: return '#3B82F6';  // Blue
      }
    };

    // Get tier badge color
    const getTierBadgeColor = (tier) => {
      switch (tier?.toLowerCase()) {
        case 'gold': return '#F59E0B';
        case 'silver': return '#6B7280';  
        case 'bronze': return '#EA580C';
        case 'test': return '#059669';
        case 'vip affiliate': return '#7C3AED';
        case 'affiliate':
        default: return '#2563EB';
      }
    };

    const borderColor = getTierBorderColor(tier);
    const badgeColor = getTierBadgeColor(tier);
    const statusColor = status === 'Active' ? '#059669' : '#DC2626';

    return (
      <div
        onClick={toggleNode}
        style={{
          background: isRoot 
            ? 'linear-gradient(135deg, #1E40AF 0%, #3730A3 100%)' 
            : 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
          border: `3px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '14px',
          width: '240px',
          height: '140px',
          boxShadow: isRoot 
            ? '0 4px 15px rgba(59, 130, 246, 0.2)' 
            : '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          color: 'white',
          fontSize: '12px',
          textAlign: 'center',
          position: 'relative',
          backdropFilter: isRoot ? 'none' : 'blur(10px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Top Section - Username */}
        <div style={{
          fontWeight: 'bold',
          fontSize: '15px',
          color: '#FFFFFF',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          marginBottom: '8px'
        }}>
          {isRoot ? nodeData.name : nodeData.name}
        </div>

        {/* Middle Section - Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '8px',
          flexWrap: 'wrap'
        }}>
          {/* Membership Tier Badge */}
          <div style={{
            background: `linear-gradient(135deg, ${badgeColor} 0%, ${badgeColor}CC 100%)`,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            letterSpacing: '0.5px'
          }}>
            {tier}
          </div>

          {/* Status Badge */}
          <div style={{
            background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '10px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {status}
          </div>
        </div>

        {/* Bottom Section - Referrals Count */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '6px 10px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#E5E7EB',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{ color: '#F3F4F6', fontSize: '10px', marginBottom: '1px' }}>
            Referrals
          </div>
          <div style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold' }}>
            {referrals}
          </div>
        </div>

        {/* Root indicator for "YOU" */}
        {isRoot && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '-6px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: 'white',
            padding: '3px 7px',
            borderRadius: '10px',
            fontSize: '9px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
            letterSpacing: '0.5px',
            zIndex: 10
          }}>
            YOU
          </div>
        )}

        {/* Expandable indicator */}
        {nodeData.children && nodeData.children.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            padding: '4px',
            borderRadius: '50%',
            fontSize: '10px',
            fontWeight: 'bold',
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {nodeData.__rd3t?.collapsed ? '+' : '−'}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Interactive Network Genealogy</h3>
          <div className="flex items-center space-x-4">
            <label className="text-gray-300">Depth:</label>
            <select
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value={1}>1 Level</option>
              <option value={2}>2 Levels</option>
              <option value={3}>3 Levels</option>
              <option value={4}>4 Levels</option>
              <option value={5}>5 Levels</option>
            </select>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="text-gray-300 text-sm mb-4">
          💡 <strong>Tips:</strong> Click on any node to expand/collapse their downline. Drag to pan around the tree. Use mouse wheel to zoom in/out.
        </div>
        
        {networkData?.network_stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{networkData.network_stats.direct_referrals}</p>
              <p className="text-gray-400">Direct Referrals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{networkData.network_stats.total_network_size}</p>
              <p className="text-gray-400">Total Network</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{depth}</p>
              <p className="text-gray-400">Levels Shown</p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Network Tree */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white border-opacity-10">
          <h4 className="text-lg font-bold text-white">Your Network Tree</h4>
        </div>
        
        {treeData && treeData.length > 0 ? (
          <div style={{ width: '100%', height: '700px', background: '#111827' }}>
            <Tree
              data={treeData}
              orientation="vertical"
              pathFunc="step"
              translate={{ x: 400, y: 150 }}
              separation={{ siblings: 1.2, nonSiblings: 1.5 }}
              nodeSize={{ x: 280, y: 220 }}
              allowForeignObjects
              pathClassFunc={() => 'custom-tree-link'}
              renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
                <g>
                  <foreignObject
                    width="260"
                    height="200"
                    x="-130"
                    y="-60"
                    onClick={toggleNode}
                    style={{ cursor: 'pointer', overflow: 'visible' }}
                  >
                    <CustomNodeLabel nodeData={nodeDatum} toggleNode={toggleNode} />
                  </foreignObject>
                </g>
              )}
              nodeSvgShape={{
                shape: 'circle',
                shapeProps: {
                  r: 0,
                  fill: 'transparent'
                }
              }}
              initialDepth={depth > 3 ? 2 : depth}
              collapsible={true}
              zoom={0.8}
              enableLegacyTransitions={true}
              transitionDuration={500}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <Network className="h-16 w-16 text-gray-400 mx-auto" />
            </div>
            <p className="text-gray-400 text-lg">No referrals yet</p>
            <p className="text-gray-500 text-sm mt-2">Share your referral link to build your network tree!</p>
          </div>
        )}
      </div>
    </div>
  );
}


export default NetworkTreeTab;
