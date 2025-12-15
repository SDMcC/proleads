import React from 'react';
import { Trophy, Award, Target } from 'lucide-react';

function MilestonesTab() {
  const [milestones, setMilestones] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/milestones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMilestones(response.data);
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Progress */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Milestone Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{milestones?.paid_downlines || 0}</p>
            <p className="text-gray-400">Paid Downlines</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{milestones?.achieved_milestones?.length || 0}</p>
            <p className="text-gray-400">Milestones Achieved</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">
              ${milestones?.achieved_milestones?.reduce((sum, m) => sum + m.bonus_amount, 0) || 0}
            </p>
            <p className="text-gray-400">Total Bonuses Earned</p>
          </div>
        </div>

        {/* Next Milestone Progress */}
        {milestones?.next_milestone && (
          <div className="bg-black bg-opacity-20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-medium">Next Milestone: {milestones.next_milestone.milestone_count} Downlines</h4>
              <span className="text-green-400 font-bold">${milestones.next_milestone.bonus_amount} Bonus</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage(milestones.next_milestone.progress, milestones.next_milestone.milestone_count)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {milestones.next_milestone.progress} / {milestones.next_milestone.milestone_count} downlines
              </span>
              <span className="text-gray-400">
                {milestones.next_milestone.remaining} remaining
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Achieved Milestones */}
      {milestones?.achieved_milestones && milestones.achieved_milestones.length > 0 && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Achieved Milestones</h3>
          <div className="space-y-4">
            {milestones.achieved_milestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-green-600 bg-opacity-20 border border-green-500 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{milestone.milestone_count} Downlines Milestone</h4>
                    <p className="text-green-200 text-sm">
                      Achieved on {new Date(milestone.achieved_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">${milestone.bonus_amount}</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    milestone.status === 'completed' ? 'bg-green-600 text-green-100' :
                    milestone.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                    'bg-gray-600 text-gray-100'
                  }`}>
                    {milestone.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Milestones Overview */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Milestone System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones?.all_milestones?.map((milestone, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border-2 ${
                milestone.achieved 
                  ? 'bg-green-600 bg-opacity-20 border-green-500' 
                  : 'bg-gray-600 bg-opacity-20 border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  milestone.achieved ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {milestone.achieved ? (
                    <Award className="h-8 w-8 text-white" />
                  ) : (
                    <span className="text-white font-bold">{milestone.milestone_count}</span>
                  )}
                </div>
                <h4 className={`font-bold mb-1 ${
                  milestone.achieved ? 'text-green-400' : 'text-white'
                }`}>
                  {milestone.milestone_count} Downlines
                </h4>
                <p className={`text-lg font-bold ${
                  milestone.achieved ? 'text-green-400' : 'text-gray-400'
                }`}>
                  ${milestone.bonus_amount} Bonus
                </p>
                {milestone.achieved && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-600 text-green-100 rounded text-xs">
                    ✓ Achieved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg">
          <h4 className="text-blue-300 font-bold mb-2">How It Works</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Earn bonus rewards when you reach milestone numbers of paid downlines</li>
            <li>• Only active, non-cancelled members count toward your milestones</li>
            <li>• Bonuses are paid automatically when milestones are achieved</li>
            <li>• Build your network to unlock higher bonus tiers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


export default MilestonesTab;
