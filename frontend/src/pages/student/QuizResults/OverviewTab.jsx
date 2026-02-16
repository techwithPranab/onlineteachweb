import React from 'react';

export default function OverviewTab({ session, evaluation, formatTime }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Questions</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {evaluation?.overallAnalysis?.totalQuestions || 0}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Correct Answers</h3>
        <p className="mt-2 text-3xl font-bold text-green-600">
          {evaluation?.overallAnalysis?.correct || 0}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Wrong Answers</h3>
        <p className="mt-2 text-3xl font-bold text-red-600">
          {evaluation?.overallAnalysis?.wrong || 0}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Unattempted</h3>
        <p className="mt-2 text-3xl font-bold text-gray-400">
          {evaluation?.overallAnalysis?.unattempted || 0}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Accuracy</h3>
        <p className="mt-2 text-3xl font-bold text-indigo-600">
          {Math.round(evaluation?.overallAnalysis?.accuracy || 0)}%
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Time Taken</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {formatTime(session.timeSpent)}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Attempt Number</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {session.attemptNumber}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Time Management</h3>
        <p className={`mt-2 text-xl font-bold capitalize ${
          evaluation?.timeAnalysis?.timeManagementRating === 'excellent' ? 'text-green-600' :
          evaluation?.timeAnalysis?.timeManagementRating === 'good' ? 'text-blue-600' :
          evaluation?.timeAnalysis?.timeManagementRating === 'average' ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {evaluation?.timeAnalysis?.timeManagementRating || 'N/A'}
        </p>
      </div>
    </div>
  );
}
