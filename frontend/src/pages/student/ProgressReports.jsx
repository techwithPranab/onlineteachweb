import { useState } from 'react'
import { useQuery } from 'react-query'
import { Award } from 'lucide-react'
import { achievementService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'
import AchievementBadgeModal from '@/components/common/AchievementBadgeModal'
import api from '@/services/api'

export default function ProgressReports() {
  const { user } = useAuthStore()
  const [showBadgeModal, setShowBadgeModal] = useState(false)

  // Fetch student performance data
  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useQuery(
    ['studentPerformance', user?._id],
    async () => {
      const response = await api.get('/student-performance')
      return response.data
    },
    {
      enabled: !!user?._id
    }
  )

  const { data: achievementsData, isLoading: achievementsLoading } = useQuery(
    ['achievements', user?._id],
    () => achievementService.getStudentAchievements(),
    {
      refetchOnWindowFocus: true,
      refetchOnMount: true
    }
  )

  if (performanceLoading || achievementsLoading) return <LoadingSpinner fullScreen />
  if (performanceError) return <ErrorMessage message={performanceError.message || 'Failed to load performance data'} />

  const studentPerformance = performanceData?.data || {}
  const achievements = Array.isArray(achievementsData?.achievements) ? achievementsData.achievements : []

  // Debug logging
  console.log('Student Performance Data:', studentPerformance)
  console.log('Subject Performance Map:', studentPerformance.subjectPerformance)
  
  // Extract subject-wise performance from Map to Array
  // subjectPerformance is a Map in MongoDB, converted to object in JSON
  const subjectPerformanceMap = studentPerformance.subjectPerformance || {}
  const subjectPerformance = Object.entries(subjectPerformanceMap).map(([subject, data]) => ({
    subject,
    ...data,
    // Add weak/strong topics from the subject's data
    weakTopics: studentPerformance.weakAreas
      ?.filter(area => area.subject === subject)
      ?.map(area => area.topic) || [],
    strongTopics: studentPerformance.strongAreas
      ?.filter(area => area.subject === subject)
      ?.map(area => area.topic) || []
  }))
  
  console.log('Processed Subject Performance Array:', subjectPerformance)

  // Helper function to get performance level
  const getPerformanceLevel = (accuracy) => {
    if (accuracy >= 80) return { label: 'Excellent', color: 'emerald', emoji: '🌟' }
    if (accuracy >= 60) return { label: 'Good', color: 'blue', emoji: '👍' }
    if (accuracy >= 40) return { label: 'Average', color: 'yellow', emoji: '📈' }
    return { label: 'Needs Improvement', color: 'red', emoji: '💪' }
  }

  return (
    <>
    <SEOHead title="Progress Reports - Student" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-shimmer mb-2">
            📊 Progress & Reports
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Track your learning journey and achievements 🚀</p>
        </div>
      </div>

      {/* Subject-wise Performance Reports */}
      <div className="genz-card relative overflow-hidden mb-4 sm:mb-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 sm:mb-6 flex items-center gap-2">
            📚 Subject-wise Performance Reports
          </h3>
          
          {subjectPerformance.length > 0 ? (
            <div className="space-y-4">
              {subjectPerformance.map((subject, index) => {
                const perfLevel = getPerformanceLevel(subject.averageAccuracy || 0)
                
                return (
                  <div key={index} className="genz-card hover:shadow-lg transition-all border-2 border-gray-100 hover:border-blue-300">
                    <div className="p-4 sm:p-5">
                      {/* Subject Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl">
                            📖
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-xl font-bold text-gray-900">{subject.subject}</h4>
                            <p className="text-sm text-gray-600">{subject.totalQuizzes || 0} Quizzes Completed</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full bg-${perfLevel.color}-100 border-2 border-${perfLevel.color}-300 flex items-center gap-2`}>
                          <span className="text-2xl">{perfLevel.emoji}</span>
                          <span className={`text-sm sm:text-base font-bold text-${perfLevel.color}-700`}>
                            {perfLevel.label}
                          </span>
                        </div>
                      </div>

                      {/* Performance Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                        {/* Average Score */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border-2 border-emerald-200">
                          <div className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">Average Score</div>
                          <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                            {subject.averageScore?.toFixed(1) || 0}%
                          </div>
                        </div>

                        {/* Accuracy */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border-2 border-blue-200">
                          <div className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">Accuracy</div>
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">
                            {subject.averageAccuracy?.toFixed(1) || 0}%
                          </div>
                        </div>

                        {/* Total Questions */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 border-2 border-purple-200">
                          <div className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">Questions</div>
                          <div className="text-xl sm:text-2xl font-bold text-purple-600">
                            {subject.totalQuestions || 0}
                          </div>
                        </div>

                        {/* Correct Answers */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border-2 border-green-200">
                          <div className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">Correct</div>
                          <div className="text-xl sm:text-2xl font-bold text-green-600">
                            {subject.correctAnswers || 0}
                          </div>
                        </div>
                      </div>

                      {/* Time Spent */}
                      <div className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">⏱️ Total Time Spent</span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.floor((subject.totalTimeSpent || 0) / 60)} minutes
                          </span>
                        </div>
                      </div>

                      {/* Weak Topics */}
                      {subject.weakTopics && subject.weakTopics.length > 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                          <h5 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            � Topics to Focus On
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {subject.weakTopics.slice(0, 5).map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-white border border-yellow-300 rounded-full text-xs font-medium text-gray-700"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strong Topics */}
                      {subject.strongTopics && subject.strongTopics.length > 0 && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 mt-3">
                          <h5 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                            ⭐ Your Strengths
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {subject.strongTopics.slice(0, 5).map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-white border border-green-300 rounded-full text-xs font-medium text-gray-700"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                📚
              </div>
              <h4 className="text-lg font-bold text-gray-700 mb-2">No Performance Data Available</h4>
              <p className="text-gray-600 mb-4">
                Start taking quizzes to see your subject-wise performance reports here!
              </p>
              <a
                href="/student/quiz"
                className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Take Your First Quiz 🚀
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="genz-card relative overflow-hidden mt-4 sm:mt-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              🏆 Achievements & Badges
            </h3>
            <button
              onClick={() => setShowBadgeModal(true)}
              className="genz-button-secondary text-sm px-3 py-1.5 rounded-lg hover:scale-105 transition-all flex items-center gap-1"
            >
              📋 View Rules
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {achievements.length > 0 ? achievements.slice(0, 12).map((badge, index) => (
              <div
                key={badge._id || index}
                className="text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:scale-105 genz-card border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg"
              >
                <div className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 animate-bounce-slow">
                  {badge.badgeIcon}
                </div>
                <p className="text-xs sm:text-sm font-bold break-words leading-tight text-gray-800">
                  {badge.badgeName}
                </p>
                <div className="mt-1 space-y-1">
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold">
                    ✅ Earned
                  </span>
                  <div className="text-xs text-gray-600 font-medium">
                    {badge.points} pts
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-gray-600 mb-2">No achievements yet</p>
                <p className="text-sm text-gray-500">Complete quizzes to earn your first badge!</p>
              </div>
            )}
          </div>
          {achievements.length > 12 && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowBadgeModal(true)}
                className="genz-button-primary text-sm"
              >
                View All {achievements.length} Achievements
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Badge Modal */}
      <AchievementBadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
      />
    </div>

    </>
  )
}
