import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SuggestionsTab({ result, enhancedAnalysis }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Backend Weak Topics */}
      {result?.evaluation?.weakTopics && result.evaluation.weakTopics.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Focus Areas (from Quiz Analysis)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.evaluation.weakTopics.map((topic, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border-l-4 border-yellow-500">
                <div className="font-medium text-gray-900">{topic.topic}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Accuracy: <span className="font-bold text-yellow-600">{topic.accuracy}%</span>
                  {' '}({topic.correct}/{topic.total} correct)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backend Recommendations */}
      {result?.evaluation?.recommendations && Array.isArray(result.evaluation.recommendations) && result.evaluation.recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">💡 Personalized Recommendations</h3>
          <div className="space-y-3">
            {result.evaluation.recommendations.map((rec, index) => {
              if (!rec) return null;
              
              if (typeof rec === 'string') {
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <span className="text-xl flex-shrink-0">📌</span>
                    <p className="text-gray-700">{rec}</p>
                  </div>
                );
              } else if (typeof rec === 'object') {
                const icon = typeof rec.icon === 'string' ? rec.icon : '💡';
                const title = rec.title || rec.message || 'Recommendation';
                const description = rec.description || rec.message || title;
                const priority = rec.priority || 'medium';
                
                const titleText = String(title);
                const descriptionText = String(description);
                const priorityText = String(priority);
                
                return (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      priorityText === 'high' ? 'bg-red-50 border-red-500' :
                      priorityText === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{icon}</span>
                        <span className="font-medium text-gray-900">{titleText}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        priorityText === 'high' ? 'bg-red-100 text-red-800' :
                        priorityText === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {priorityText}
                      </span>
                    </div>
                    <p className="text-gray-700">{descriptionText}</p>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
      
      {/* Weak Areas */}
      {enhancedAnalysis?.improvementAreas?.weakAreas?.length > 0 && (
        <div className="bg-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">🎯 Areas to Improve</h3>
          <div className="space-y-3">
            {enhancedAnalysis.improvementAreas.weakAreas.map((area, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{area.area}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      area.priority === 'high' ? 'bg-red-100 text-red-800' :
                      area.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {area.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{area.reason}</p>
                  {area.suggestions?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {area.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm text-gray-500 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {area.accuracy !== undefined && (
                  <span className="text-red-600 font-bold ml-4">{Math.round(area.accuracy)}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Areas */}
      {enhancedAnalysis?.improvementAreas?.strongAreas?.length > 0 && (
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">💪 Your Strengths</h3>
          <div className="flex flex-wrap gap-2">
            {enhancedAnalysis.improvementAreas.strongAreas.map((area, index) => (
              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {area.area} ({Math.round(area.accuracy)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Actions */}
      {enhancedAnalysis?.nextActions?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Recommended Next Steps</h3>
          <div className="space-y-4">
            {enhancedAnalysis.nextActions.map((action, index) => {
              if (!action || typeof action !== 'object') return null;
              
              const icon = typeof action.icon === 'string' ? action.icon : '📌';
              const title = String(action.title || 'Action Item');
              const description = String(action.description || '');
              const priority = String(action.priority || 'medium');
              
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    priority === 'high' ? 'bg-red-50 border-red-500' :
                    priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{icon}</span>
                      <span className="font-medium text-gray-900">{title}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      priority === 'high' ? 'bg-red-100 text-red-800' :
                      priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {priority}
                    </span>
                  </div>
                  <p className="text-gray-700">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/student/quizzes')}
            className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition-transform">📝</span>
              <div>
                <span className="font-medium text-indigo-900 block">Take Another Quiz</span>
                <p className="text-sm text-indigo-600">Practice makes perfect!</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/student/quiz-history')}
            className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              <div>
                <span className="font-medium text-indigo-900 block">View Quiz History</span>
                <p className="text-sm text-indigo-600">Track your progress</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/student/courses')}
            className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
              <div>
                <span className="font-medium text-indigo-900 block">Review Materials</span>
                <p className="text-sm text-indigo-600">Strengthen understanding</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/student/progress')}
            className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition-transform">📈</span>
              <div>
                <span className="font-medium text-indigo-900 block">Progress Reports</span>
                <p className="text-sm text-indigo-600">See overall performance</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
