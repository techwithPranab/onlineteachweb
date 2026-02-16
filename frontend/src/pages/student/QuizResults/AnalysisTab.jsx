import React from 'react';

export default function AnalysisTab({ enhancedAnalysis, evaluation }) {
  React.useEffect(() => {
    console.log('📊 AnalysisTab received:', {
      hasDifficultyAnalysis: !!enhancedAnalysis?.difficultyAnalysis,
      difficultyAnalysisType: typeof enhancedAnalysis?.difficultyAnalysis,
      difficultyAnalysisKeys: Object.keys(enhancedAnalysis?.difficultyAnalysis || {}),
      difficultyAnalysisData: enhancedAnalysis?.difficultyAnalysis
    });
  }, [enhancedAnalysis]);
  return (
    <div className="space-y-8">
      {/* Topic Analysis */}
      {enhancedAnalysis?.topicAnalysis && enhancedAnalysis.topicAnalysis.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic-wise Performance</h3>
          <div className="space-y-4">
            {enhancedAnalysis.topicAnalysis.map((topic) => (
              <div key={topic.topic} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{topic.topic}</span>
                  <span className={`font-bold ${
                    topic.accuracy >= 70 ? 'text-green-600' :
                    topic.accuracy >= 40 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(topic.accuracy)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      topic.accuracy >= 70 ? 'bg-green-500' :
                      topic.accuracy >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, topic.accuracy)}%` }}
                  ></div>
                </div>
                <div className="flex text-sm text-gray-500 mt-1">
                  <span className="mr-4">Correct: {topic.correct}</span>
                  <span className="mr-4">Wrong: {topic.wrong}</span>
                  <span>Unattempted: {topic.unattempted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty Analysis */}
      {enhancedAnalysis?.difficultyAnalysis && Object.keys(enhancedAnalysis.difficultyAnalysis).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty-wise Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['easy', 'medium', 'hard'].map((level) => {
              const data = enhancedAnalysis.difficultyAnalysis[level]
              if (!data || data.total === 0) return null;
              return (
                <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 capitalize mb-2">{level}</h4>
                  <div className="text-3xl font-bold mb-1" style={{
                    color: level === 'easy' ? '#22c55e' : level === 'medium' ? '#eab308' : '#ef4444'
                  }}>
                    {Math.round(data.accuracy || 0)}%
                  </div>
                  <p className="text-sm text-gray-500">
                    {data.correct || 0} / {data.total || 0} correct
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Time Management Analysis */}
      {enhancedAnalysis?.timeAnalysis && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Time Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Time</h4>
              <div className="text-2xl font-bold text-gray-900">
                {Math.floor(enhancedAnalysis.timeAnalysis.totalTimeSpent / 60)}m {enhancedAnalysis.timeAnalysis.totalTimeSpent % 60}s
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Avg per Question</h4>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(enhancedAnalysis.timeAnalysis.avgTimePerQuestion)}s
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Time Utilization</h4>
              <div className="text-2xl font-bold text-indigo-600">
                {Math.round(Number(enhancedAnalysis.timeAnalysis.timeUtilization || 0))}%
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            enhancedAnalysis.timeAnalysis.rating === 'excellent' ? 'bg-green-50' :
            enhancedAnalysis.timeAnalysis.rating === 'good' ? 'bg-blue-50' :
            enhancedAnalysis.timeAnalysis.rating === 'rushed' ? 'bg-red-50' :
            'bg-yellow-50'
          }`}>
            <p className={`font-medium capitalize ${
              enhancedAnalysis.timeAnalysis.rating === 'excellent' ? 'text-green-800' :
              enhancedAnalysis.timeAnalysis.rating === 'good' ? 'text-blue-800' :
              enhancedAnalysis.timeAnalysis.rating === 'rushed' ? 'text-red-800' :
              'text-yellow-800'
            }`}>
              {enhancedAnalysis.timeAnalysis.rating} Time Management
            </p>
            {enhancedAnalysis.timeAnalysis.recommendations && enhancedAnalysis.timeAnalysis.recommendations.length > 0 && (
              <ul className="mt-2 space-y-1">
                {enhancedAnalysis.timeAnalysis.recommendations.map((rec, i) => {
                  const text = typeof rec === 'string' ? rec : (rec.description || rec.message || rec.title || 'Recommendation');
                  return (
                    <li key={i} className="text-sm text-gray-700">• {text}</li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Comparison with Previous Attempts */}
      {evaluation?.comparison && evaluation.comparison.previousAttempts > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <span className={`text-3xl font-bold ${
                evaluation.comparison.scoreImprovement > 0 ? 'text-green-600' :
                evaluation.comparison.scoreImprovement < 0 ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {evaluation.comparison.scoreImprovement > 0 ? '+' : ''}
                {evaluation.comparison.scoreImprovement}
              </span>
              <span className="ml-2 text-gray-500">marks vs last attempt</span>
            </div>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                evaluation.comparison.trend === 'improving' ? 'bg-green-100 text-green-800' :
                evaluation.comparison.trend === 'declining' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {evaluation.comparison.trend}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
