const mongoose = require('mongoose');
const Question = require('../models/Question.model');
require('dotenv').config();

/**
 * Migration Script: Fix Questions Missing correctAnswer
 * 
 * This script finds all questions where correctAnswer is missing, null, or empty
 * and attempts to derive the correct answer from other fields based on question type.
 * 
 * Usage:
 *   cd backend
 *   node scripts/fix-question-correct-answers.js
 */

async function fixQuestionCorrectAnswers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find questions with missing or empty correctAnswer
    const questions = await Question.find({ 
      $or: [
        { correctAnswer: { $exists: false } },
        { correctAnswer: null },
        { correctAnswer: '' }
      ]
    });
    
    console.log(`📊 Found ${questions.length} questions with missing correctAnswer\n`);
    
    if (questions.length === 0) {
      console.log('✅ All questions already have correctAnswer. Nothing to fix!');
      return;
    }
    
    let fixed = 0;
    let skipped = 0;
    const skippedDetails = [];
    
    for (const question of questions) {
      let correctAnswer = '';
      let derivedFrom = '';
      
      // Try to derive correctAnswer based on question type
      if (question.type === 'mcq-single' || question.type === 'mcq-multiple' || question.type === 'true-false') {
        // For MCQ questions, find the option marked as correct
        const correctOption = question.options?.find(opt => opt.isCorrect);
        if (correctOption) {
          correctAnswer = correctOption.text;
          derivedFrom = `MCQ option with isCorrect=true`;
        }
      } else if (question.type === 'numerical') {
        // For numerical questions, use numericalAnswer.value
        if (question.numericalAnswer?.value !== undefined && question.numericalAnswer?.value !== null) {
          correctAnswer = question.numericalAnswer.value.toString();
          if (question.numericalAnswer.unit) {
            correctAnswer += ` ${question.numericalAnswer.unit}`;
          }
          derivedFrom = `numericalAnswer.value`;
        }
      } else if (question.type === 'short-answer' || question.type === 'long-answer') {
        // For text-based questions, use expectedAnswer
        if (question.expectedAnswer) {
          correctAnswer = question.expectedAnswer;
          derivedFrom = `expectedAnswer field`;
        }
      } else if (question.type === 'case-based') {
        // For case-based questions, might have MCQ-style options or expectedAnswer
        const correctOption = question.options?.find(opt => opt.isCorrect);
        if (correctOption) {
          correctAnswer = correctOption.text;
          derivedFrom = `case-based MCQ option`;
        } else if (question.expectedAnswer) {
          correctAnswer = question.expectedAnswer;
          derivedFrom = `case-based expectedAnswer`;
        }
      }
      
      if (correctAnswer) {
        question.correctAnswer = correctAnswer;
        await question.save();
        fixed++;
        
        const truncatedAnswer = correctAnswer.length > 50 
          ? correctAnswer.substring(0, 50) + '...' 
          : correctAnswer;
        
        console.log(`✅ Fixed question ${question._id}`);
        console.log(`   Type: ${question.type}`);
        console.log(`   Topic: ${question.topic}`);
        console.log(`   Derived from: ${derivedFrom}`);
        console.log(`   Answer: "${truncatedAnswer}"\n`);
      } else {
        skipped++;
        skippedDetails.push({
          id: question._id,
          type: question.type,
          topic: question.topic,
          text: question.text?.substring(0, 80) + '...',
          reason: getSkipReason(question)
        });
        
        console.log(`⚠️  Skipped question ${question._id}`);
        console.log(`   Type: ${question.type}`);
        console.log(`   Topic: ${question.topic}`);
        console.log(`   Reason: ${getSkipReason(question)}\n`);
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Fixed:   ${fixed} questions`);
    console.log(`⚠️  Skipped: ${skipped} questions`);
    console.log(`📝 Total:   ${questions.length} questions`);
    console.log('='.repeat(60) + '\n');
    
    // Print details of skipped questions
    if (skippedDetails.length > 0) {
      console.log('\n⚠️  SKIPPED QUESTIONS - MANUAL REVIEW REQUIRED:');
      console.log('='.repeat(60));
      skippedDetails.forEach((q, idx) => {
        console.log(`\n${idx + 1}. Question ID: ${q.id}`);
        console.log(`   Type: ${q.type}`);
        console.log(`   Topic: ${q.topic}`);
        console.log(`   Text: ${q.text}`);
        console.log(`   Reason: ${q.reason}`);
      });
      console.log('\n' + '='.repeat(60));
      console.log('💡 TIP: You can manually update these questions in the admin panel');
      console.log('='.repeat(60) + '\n');
    }
    
    // Save report to file
    if (skippedDetails.length > 0) {
      const fs = require('fs');
      const reportPath = './logs/question-migration-report.json';
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: { fixed, skipped, total: questions.length },
        skippedQuestions: skippedDetails
      }, null, 2));
      console.log(`📄 Detailed report saved to: ${reportPath}\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected\n');
  }
}

/**
 * Get human-readable reason for why a question was skipped
 */
function getSkipReason(question) {
  if (question.type === 'mcq-single' || question.type === 'mcq-multiple' || question.type === 'true-false') {
    if (!question.options || question.options.length === 0) {
      return 'No options available';
    }
    const hasCorrectOption = question.options.some(opt => opt.isCorrect);
    if (!hasCorrectOption) {
      return 'No option marked as correct (isCorrect=true)';
    }
  } else if (question.type === 'numerical') {
    if (!question.numericalAnswer || question.numericalAnswer.value === undefined) {
      return 'numericalAnswer.value is missing';
    }
  } else if (question.type === 'short-answer' || question.type === 'long-answer') {
    if (!question.expectedAnswer) {
      return 'expectedAnswer field is missing';
    }
  } else if (question.type === 'case-based') {
    return 'Unable to determine correct answer from options or expectedAnswer';
  }
  
  return 'Unknown reason - please review manually';
}

// Run the migration
console.log('\n' + '='.repeat(60));
console.log('🔧 QUESTION MIGRATION SCRIPT');
console.log('='.repeat(60));
console.log('Purpose: Fix questions missing correctAnswer field');
console.log('Date: ' + new Date().toISOString());
console.log('='.repeat(60) + '\n');

fixQuestionCorrectAnswers()
  .then(() => {
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
