import React from 'react';

export default function DetailedTab({ detailedAnswers }) {
  const getUserAnswerDisplay = (answer) => {
    if (!answer.yourAnswer) return 'Not Answered';
    console.log('User Answer:', answer.yourAnswer);
    // Handle MCQ options - convert ID to text if needed
    if ((answer.type === 'mcq-single' || answer.type === 'mcq' || answer.type === 'true-false') && answer.options && answer.options.length > 0) {
      // Check if answer is already text
      const isAlreadyText = answer.options.some(opt => opt.text === answer.yourAnswer);
      if (isAlreadyText) {
        return answer.yourAnswer;
      }
      
      // Try to find matching option by ID
      const selectedOption = answer.options.find(opt => 
        String(opt._id) === String(answer.yourAnswer) || 
        String(opt.id) === String(answer.yourAnswer) ||
        String(opt.value) === String(answer.yourAnswer)
      );
      return selectedOption ? selectedOption.text : answer.yourAnswer;
    }
    
    // Handle multiple choice
    if ((answer.type === 'mcq-multiple' || answer.type === 'multiple-select') && answer.options) {
      if (Array.isArray(answer.yourAnswer)) {
        const selectedOptions = answer.options.filter(opt => 
          answer.yourAnswer.some(ans =>
            String(opt._id) === String(ans) || 
            String(opt.id) === String(ans) ||
            String(opt.value) === String(ans) ||
            opt.text === ans
          )
        );
        return selectedOptions.length > 0 
          ? selectedOptions.map(opt => opt.text).join(', ') 
          : Array.isArray(answer.yourAnswer) ? answer.yourAnswer.join(', ') : answer.yourAnswer;
      }
      return answer.yourAnswer;
    }
    
    // For other types, show the answer directly
    return answer.yourAnswer;
  };

  const getCorrectAnswerDisplay = (answer) => {
    if (!answer.correctAnswer) return null;

    // Handle MCQ options
    if ((answer.type === 'mcq-single' || answer.type === 'mcq' || answer.type === 'true-false') && answer.options) {
      const correctOption = answer.options.find(opt => 
        String(opt._id) === String(answer.correctAnswer) || 
        String(opt.id) === String(answer.correctAnswer) ||
        opt.text === answer.correctAnswer
      );
      return correctOption ? correctOption.text : answer.correctAnswer;
    }
    
    // For other types
    return typeof answer.correctAnswer === 'string' 
      ? answer.correctAnswer
      : answer.expectedAnswer || answer.numericalAnswer?.value || 'N/A';
  };

  return (
    <div className="space-y-4">
      {detailedAnswers.map((answer, index) => (
        <div 
          key={answer.questionId}
          className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
            answer.isCorrect === true ? 'border-green-500' :
            answer.isCorrect === false ? 'border-red-500' :
            'border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-medium text-gray-900">Q{index + 1}.</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  answer.isCorrect === true ? 'bg-green-100 text-green-800' :
                  answer.isCorrect === false ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {answer.isCorrect === true ? 'Correct' : answer.isCorrect === false ? 'Wrong' : 'Pending'}
                </span>
              </div>
              
              <p className="text-gray-900 font-medium mb-3">{answer.questionText}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Your Answer:</h4>
                  <p className="text-gray-900">
                    {getUserAnswerDisplay(answer)}
                  </p>
                </div>
                
                {answer.correctAnswer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Correct Answer:</h4>
                    <p className="text-green-600">
                      {getCorrectAnswerDisplay(answer)}
                    </p>
                  </div>
                )}
              </div>
              
              {answer.explanation && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Explanation:</h4>
                  <p className="text-blue-700 text-sm">{answer.explanation}</p>
                </div>
              )}
              
              {answer.feedback && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Tutor Feedback:</h4>
                  <p className="text-yellow-700 text-sm">{answer.feedback}</p>
                </div>
              )}
            </div>
            
            <div className="ml-4 text-right">
              <span className="text-lg font-bold text-gray-900">
                {answer.marksAwarded || 0}
              </span>
              <span className="text-gray-500">
                /{answer.questionSnapshot?.marks || answer.marks || 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
