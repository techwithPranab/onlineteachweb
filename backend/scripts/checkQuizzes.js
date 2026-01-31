const mongoose = require('mongoose');
require('dotenv').config();

const ActiveQuiz = require('../models/ActiveQuiz.model');

async function checkQuizzes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Count total quizzes
    const totalCount = await ActiveQuiz.countDocuments();
    console.log(`\n📊 Total Active Quizzes in DB: ${totalCount}`);
    
    // Get all quizzes
    const quizzes = await ActiveQuiz.find()
      .select('quizId subject courseName difficulty questionCount status createdAt userId')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('\n📋 Latest 10 Quizzes:');
    console.log('='.repeat(80));
    
    quizzes.forEach((quiz, index) => {
      console.log(`\n${index + 1}. Quiz ID: ${quiz.quizId}`);
      console.log(`   Subject: ${quiz.subject}`);
      console.log(`   Course: ${quiz.courseName}`);
      console.log(`   Difficulty: ${quiz.difficulty}`);
      console.log(`   Questions: ${quiz.questionCount}`);
      console.log(`   Status: ${quiz.status}`);
      console.log(`   User ID: ${quiz.userId}`);
      console.log(`   Created: ${quiz.createdAt}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkQuizzes();
