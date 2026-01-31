const mongoose = require('mongoose');
const QuizSession = require('./models/QuizSession.model');
const ActiveQuiz = require('./models/ActiveQuiz.model');

async function createTestSession() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online_teaching');

    const completedQuiz = await ActiveQuiz.findOne({ status: 'completed' });
    if (!completedQuiz) {
      console.log('No completed quiz found');
      process.exit(0);
    }

    console.log('Found completed quiz:', completedQuiz._id, 'quizId:', completedQuiz.quizId);

    const quizSessionData = {
      quizId: completedQuiz._id,
      studentId: completedQuiz.userId,
      courseId: completedQuiz.courseId || null,
      attemptNumber: 1,
      status: 'completed',
      score: completedQuiz.score || 0,
      totalScore: completedQuiz.totalMarks || 0,
      totalMarks: completedQuiz.totalMarks || 0,
      accuracy: completedQuiz.accuracy || 0,
      timeTaken: completedQuiz.timeSpent || 0,
      duration: completedQuiz.duration || 30,
      difficulty: completedQuiz.difficulty || 'medium',
      totalQuestions: completedQuiz.questions?.length || 0,
      startedAt: completedQuiz.createdAt || new Date(),
      expiresAt: new Date(Date.now() + (completedQuiz.duration * 60 * 1000)),
      submittedAt: new Date(),
      passingPercentage: 60,
      algorithmVersion: 'algorithm-v1',
      metadata: {
        subject: completedQuiz.subject,
        courseName: completedQuiz.courseName,
        questionCount: completedQuiz.questionCount,
        isAlgorithmGenerated: true
      }
    };

    console.log('Creating QuizSession with data...');

    const session = await QuizSession.create(quizSessionData);
    console.log('Created QuizSession:', session._id);

    process.exit(0);
  } catch (error) {
    console.error('Error creating QuizSession:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

createTestSession();
