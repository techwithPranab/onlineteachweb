import React, { useState, useEffect } from 'react';
import { X, Trophy, Star, Zap, Target, Calendar, TrendingUp, Award } from 'lucide-react';
import { achievementService } from '@/services/apiServices';

const AchievementBadgeModal = ({ isOpen, onClose }) => {
  const [badgeRules, setBadgeRules] = useState({
    milestones: [],
    performance: [],
    speed: [],
    difficulty: [],
    consistency: [],
    mastery: [],
    improvement: []
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('milestones');

  useEffect(() => {
    if (isOpen) {
      fetchBadgeRules();
    }
  }, [isOpen]);

  const fetchBadgeRules = async () => {
    try {
      setLoading(true);
      const response = await achievementService.getBadgeRules();
      if (response.success) {
        setBadgeRules(response.categorized);
      }
    } catch (error) {
      console.error('Error fetching badge rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      milestones: Trophy,
      performance: Star,
      speed: Zap,
      difficulty: Target,
      consistency: Calendar,
      mastery: Award,
      improvement: TrendingUp
    };
    return icons[category] || Trophy;
  };

  const getLevelColor = (level) => {
    const colors = {
      bronze: 'text-amber-700 bg-amber-100',
      silver: 'text-gray-600 bg-gray-200',
      gold: 'text-yellow-600 bg-yellow-100',
      platinum: 'text-purple-600 bg-purple-100',
      diamond: 'text-blue-600 bg-blue-100'
    };
    return colors[level] || 'text-gray-600 bg-gray-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold truncate">Achievement Badges</h2>
                <p className="text-primary-100 text-xs sm:text-sm">Earn badges and points by completing challenges</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition flex-shrink-0 ml-2"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col sm:flex-row h-[calc(95vh-8rem)] sm:h-[calc(90vh-8rem)]">
          {/* Category Sidebar */}
          <div className="w-full sm:w-64 bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-200 overflow-x-auto sm:overflow-x-visible">
            <div className="p-3 sm:p-4">
              <div className="flex sm:flex-col gap-2 sm:gap-0 sm:space-y-2">
                {Object.keys(badgeRules).map((category) => {
                  const Icon = getCategoryIcon(category);
                  const badgeCount = badgeRules[category].length;

                  return (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`flex-shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition text-sm sm:text-base ${
                        activeCategory === category
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold capitalize truncate">{category}</div>
                        <div className={`text-xs ${activeCategory === category ? 'text-primary-100' : 'text-gray-500'}`}>
                          {badgeCount} {badgeCount === 1 ? 'badge' : 'badges'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Badge List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-2 sm:mb-4"></div>
                  <p className="text-gray-600 text-sm sm:text-base">Loading badges...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 capitalize flex items-center gap-2">
                    {React.createElement(getCategoryIcon(activeCategory), { className: 'h-5 w-5 sm:h-6 sm:w-6 text-primary-600' })}
                    {activeCategory} Badges
                  </h3>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    {activeCategory === 'milestones' && 'Complete quizzes to unlock milestone badges'}
                    {activeCategory === 'performance' && 'Achieve high scores and perfect streaks'}
                    {activeCategory === 'speed' && 'Complete quizzes quickly with accuracy'}
                    {activeCategory === 'difficulty' && 'Master different difficulty levels'}
                    {activeCategory === 'consistency' && 'Build learning habits and streaks'}
                    {activeCategory === 'mastery' && 'Excel in specific topics and subjects'}
                    {activeCategory === 'improvement' && 'Show continuous improvement in performance'}
                  </p>
                </div>

                <div className="grid gap-3 sm:gap-4">
                  {badgeRules[activeCategory].map((badge) => (
                    <div
                      key={badge.type}
                      className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-5 hover:border-primary-300 hover:shadow-lg transition"
                      style={{ borderLeftColor: badge.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Badge Icon */}
                        <div
                          className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-md"
                          style={{ backgroundColor: badge.color + '20' }}
                        >
                          {badge.icon}
                        </div>

                        {/* Badge Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">{badge.name}</h4>
                              <p className="text-gray-600 text-xs sm:text-sm">{badge.description}</p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(badge.level)}`}>
                                {badge.level.toUpperCase()}
                              </span>
                              <span className="text-primary-600 font-bold text-sm">+{badge.points} pts</span>
                            </div>
                          </div>

                          {/* Rule */}
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mt-3">
                            <div className="flex items-start gap-2">
                              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">HOW TO EARN:</div>
                                <div className="text-xs sm:text-sm text-gray-900">{badge.rule}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray-600">
              <strong>Tip:</strong> Complete quizzes regularly to earn more badges and points!
            </div>
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-sm sm:text-base self-start sm:self-auto"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementBadgeModal;
