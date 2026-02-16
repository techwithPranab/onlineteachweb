/**
 * Answer Evaluation Utility
 * 
 * Centralized logic for evaluating quiz answers
 * Used by backend to determine if answers are correct before storage
 */

/**
 * Evaluate if an answer is correct
 * @param {Object} question - Question object with correctAnswer
 * @param {*} userAnswer - User's submitted answer
 * @returns {boolean} - Whether the answer is correct
 */
function evaluateAnswer(question, userAnswer) {
  // No answer provided
  if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
    return false;
  }
  
  if (!question || !question.type) {
    console.warn('Invalid question for evaluation:', question);
    return false;
  }
  
  try {
    switch (question.type) {
      case 'mcq-single':
      case 'mcq':
      case 'true-false':
        return evaluateSingleChoice(question, userAnswer);
      
      case 'mcq-multiple':
      case 'multiple-select':
        return evaluateMultipleChoice(question, userAnswer);
      
      case 'numerical':
        return evaluateNumerical(question, userAnswer);
      
      case 'short-answer':
      case 'long-answer':
        return evaluateTextAnswer(question, userAnswer);
      
      default:
        console.warn('Unknown question type:', question.type);
        return false;
    }
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return false;
  }
}

/**
 * Evaluate single choice answer (MCQ, True/False)
 */
function evaluateSingleChoice(question, userAnswer) {
  if (!question.correctAnswer || !question.options) {
    console.warn('Missing correctAnswer or options:', { 
      hasCorrectAnswer: !!question.correctAnswer, 
      hasOptions: !!question.options 
    });
    return false;
  }
  
  // First, check if correctAnswer is already an option ID
  const directMatch = question.options.find(opt => 
    (opt._id || opt.id)?.toString() === question.correctAnswer?.toString()
  );
  
  if (directMatch) {
    const correctId = directMatch._id || directMatch.id;
    const isCorrect = correctId?.toString() === userAnswer?.toString();
    console.log('Direct ID match evaluation:', { 
      correctId, 
      userAnswer, 
      isCorrect 
    });
    return isCorrect;
  }
  
  // If not, try to match by text (original behavior)
  const correctOption = question.options.find(opt => 
    opt.text === question.correctAnswer || 
    opt.text?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase()
  );
  
  if (!correctOption) {
    console.warn('Correct option not found by text match:', { 
      correctAnswer: question.correctAnswer,
      availableOptions: question.options.map(o => ({ id: o._id || o.id, text: o.text }))
    });
    return false;
  }
  
  const correctId = correctOption._id || correctOption.id;
  const isCorrect = correctId?.toString() === userAnswer?.toString();
  console.log('Text match evaluation:', { 
    correctText: question.correctAnswer,
    correctId, 
    userAnswer, 
    isCorrect 
  });
  return isCorrect;
}

/**
 * Evaluate multiple choice answer
 */
function evaluateMultipleChoice(question, userAnswer) {
  if (!Array.isArray(userAnswer)) {
    return false;
  }
  
  if (!question.correctAnswer || !question.options) {
    return false;
  }
  
  // Split correct answer by comma and trim
  const correctTexts = question.correctAnswer
    .split(',')
    .map(text => text.trim().toLowerCase());
  
  // Find all options that match correct answers
  const correctOptionIds = question.options
    .filter(opt => correctTexts.includes(opt.text?.trim().toLowerCase()))
    .map(opt => (opt._id || opt.id)?.toString());
  
  if (correctOptionIds.length === 0) {
    console.warn('No correct options found for multiple choice');
    return false;
  }
  
  // Check if arrays match (same length and all elements present)
  if (correctOptionIds.length !== userAnswer.length) {
    return false;
  }
  
  const userAnswerStrings = userAnswer.map(id => id?.toString());
  return correctOptionIds.every(id => userAnswerStrings.includes(id));
}

/**
 * Evaluate numerical answer
 */
function evaluateNumerical(question, userAnswer) {
  if (!question.numericalAnswer || !question.numericalAnswer.value) {
    return false;
  }
  
  const userNum = parseFloat(userAnswer);
  const correctNum = parseFloat(question.numericalAnswer.value);
  
  if (isNaN(userNum) || isNaN(correctNum)) {
    return false;
  }
  
  const tolerance = question.numericalAnswer.tolerance || 0;
  return Math.abs(userNum - correctNum) <= tolerance;
}

/**
 * Evaluate text answer (short/long answer)
 */
function evaluateTextAnswer(question, userAnswer) {
  if (!question.expectedAnswer && !question.correctAnswer) {
    return false;
  }
  
  const expectedAnswer = question.expectedAnswer || question.correctAnswer;
  const userText = userAnswer.trim().toLowerCase();
  const expectedText = expectedAnswer.trim().toLowerCase();
  
  // Exact match (case-insensitive, trimmed)
  return userText === expectedText;
}

/**
 * Calculate marks awarded for an answer
 * @param {Object} question - Question object
 * @param {*} userAnswer - User's answer
 * @param {boolean} isCorrect - Whether the answer is correct (optional, will evaluate if not provided)
 * @returns {number} - Marks awarded
 */
function calculateMarksAwarded(question, userAnswer, isCorrect = null) {
  // If isCorrect not provided, evaluate it
  if (isCorrect === null) {
    isCorrect = evaluateAnswer(question, userAnswer);
  }
  
  const marks = question.marks || 1;
  const negativeMarks = question.negativeMarks || 0;
  
  if (isCorrect) {
    return marks;
  } else if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
    // Wrong answer - apply negative marking
    return -negativeMarks;
  } else {
    // Unattempted - no marks
    return 0;
  }
}

/**
 * Evaluate all answers for a quiz
 * @param {Array} questions - Array of questions
 * @param {Array} answers - Array of user answers
 * @returns {Object} - Evaluation results
 */
function evaluateQuizAnswers(questions, answers) {
  let totalScore = 0;
  let totalMarks = 0;
  let correct = 0;
  let wrong = 0;
  let unattempted = 0;
  
  const evaluatedAnswers = questions.map(question => {
    const questionId = question.id || question._id || question.questionId;
    const answer = answers.find(a => a.questionId === questionId);
    
    const marks = question.marks || 1;
    totalMarks += marks;
    
    if (!answer || answer.answer === null || answer.answer === undefined || answer.answer === '') {
      unattempted++;
      return {
        questionId,
        answer: answer?.answer || null,
        isCorrect: false,
        marksAwarded: 0,
        timeSpent: answer?.timeSpent || 0
      };
    }
    
    const isCorrect = evaluateAnswer(question, answer.answer);
    const marksAwarded = calculateMarksAwarded(question, answer.answer, isCorrect);
    
    totalScore += marksAwarded;
    
    if (isCorrect) {
      correct++;
    } else {
      wrong++;
    }
    
    return {
      questionId,
      answer: answer.answer,
      isCorrect,
      marksAwarded,
      timeSpent: answer?.timeSpent || 0,
      markedForReview: answer?.markedForReview || false
    };
  });
  
  const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  const accuracy = questions.length > 0 ? (correct / questions.length) * 100 : 0;
  
  return {
    evaluatedAnswers,
    summary: {
      totalQuestions: questions.length,
      correct,
      wrong,
      unattempted,
      totalScore: Math.max(0, totalScore), // Don't allow negative total scores
      totalMarks,
      percentage: Math.max(0, percentage),
      accuracy
    }
  };
}

module.exports = {
  evaluateAnswer,
  calculateMarksAwarded,
  evaluateQuizAnswers,
  // Export individual evaluators for testing
  evaluateSingleChoice,
  evaluateMultipleChoice,
  evaluateNumerical,
  evaluateTextAnswer
};
