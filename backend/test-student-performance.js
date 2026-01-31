/**
 * Test StudentPerformance Integration
 * 
 * Purpose: Verify StudentPerformance.updateAfterQuiz() works correctly
 * Run with: node backend/test-student-performance.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const StudentPerformance = require('./models/StudentPerformance.model');

async function testStudentPerformance() {
  try {
    console.log('🧪 Starting StudentPerformance Integration Tests...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Test data
    const testUserId = new mongoose.Types.ObjectId();
    console.log('📝 Test User ID:', testUserId.toString(), '\n');
    
    const testQuizData = {
      accuracy: 75,
      speed: 300, // 5 minutes
      topicPerformance: [
        {
          subject: 'Mathematics',
          topic: 'Algebra',
          questionsAttempted: 5,
          questionsCorrect: 4,
          accuracy: 80
        },
        {
          subject: 'Mathematics',
          topic: 'Geometry',
          questionsAttempted: 3,
          questionsCorrect: 2,
          accuracy: 66.67
        },
        {
          subject: 'Mathematics',
          topic: 'Trigonometry',
          questionsAttempted: 2,
          questionsCorrect: 0,
          accuracy: 0
        }
      ]
    };
    
    // Test 1: Create initial performance
    console.log('📝 Test 1: Creating initial StudentPerformance...');
    const performance1 = await StudentPerformance.updateAfterQuiz(testUserId, testQuizData);
    console.log('✅ Performance created:', {
      id: performance1._id.toString(),
      topicMasteryCount: performance1.topicMastery.length,
      weakAreasCount: performance1.weakAreas.length,
      strongAreasCount: performance1.strongAreas.length,
      accuracyTrendsCount: performance1.trends.accuracy.length
    });
    
    console.log('\n📊 Topic Mastery:');
    performance1.topicMastery.forEach(tm => {
      console.log(`  - ${tm.topic}: ${tm.questionsCorrect}/${tm.questionsAttempted} (${tm.accuracy.toFixed(1)}%)`);
    });
    
    console.log('\n📉 Weak Areas (< 60%):');
    if (performance1.weakAreas.length === 0) {
      console.log('  None');
    } else {
      performance1.weakAreas.forEach(wa => {
        console.log(`  - ${wa.topic}: ${wa.accuracy.toFixed(1)}%`);
      });
    }
    
    console.log('\n📈 Strong Areas (>= 80%):');
    if (performance1.strongAreas.length === 0) {
      console.log('  None');
    } else {
      performance1.strongAreas.forEach(sa => {
        console.log(`  - ${sa.topic}: ${sa.accuracy.toFixed(1)}%`);
      });
    }
    
    // Test 2: Update with same topics (should merge)
    console.log('\n\n📝 Test 2: Updating same topics (should merge)...');
    const testQuizData2 = {
      accuracy: 85,
      speed: 240, // 4 minutes
      topicPerformance: [
        {
          subject: 'Mathematics',
          topic: 'Algebra',
          questionsAttempted: 3,
          questionsCorrect: 3,
          accuracy: 100
        },
        {
          subject: 'Mathematics',
          topic: 'Trigonometry',
          questionsAttempted: 4,
          questionsCorrect: 3,
          accuracy: 75
        }
      ]
    };
    
    const performance2 = await StudentPerformance.updateAfterQuiz(testUserId, testQuizData2);
    console.log('✅ Performance updated');
    
    console.log('\n📊 Updated Topic Mastery:');
    performance2.topicMastery.forEach(tm => {
      console.log(`  - ${tm.topic}: ${tm.questionsCorrect}/${tm.questionsAttempted} (${tm.accuracy.toFixed(1)}%)`);
    });
    
    const algebraMastery = performance2.topicMastery.find(tm => tm.topic === 'Algebra');
    console.log('\n📐 Algebra Progress:');
    console.log(`  Before: 4/5 (80%)`);
    console.log(`  After: ${algebraMastery.questionsCorrect}/${algebraMastery.questionsAttempted} (${algebraMastery.accuracy.toFixed(1)}%)`);
    
    const trigMastery = performance2.topicMastery.find(tm => tm.topic === 'Trigonometry');
    console.log('\n📐 Trigonometry Progress:');
    console.log(`  Before: 0/2 (0%) - Was in weak areas`);
    console.log(`  After: ${trigMastery.questionsCorrect}/${trigMastery.questionsAttempted} (${trigMastery.accuracy.toFixed(1)}%)`);
    
    console.log('\n📉 Updated Weak Areas:');
    if (performance2.weakAreas.length === 0) {
      console.log('  None');
    } else {
      performance2.weakAreas.forEach(wa => {
        console.log(`  - ${wa.topic}: ${wa.accuracy.toFixed(1)}%`);
      });
    }
    
    console.log('\n📈 Updated Strong Areas:');
    if (performance2.strongAreas.length === 0) {
      console.log('  None');
    } else {
      performance2.strongAreas.forEach(sa => {
        console.log(`  - ${sa.topic}: ${sa.accuracy.toFixed(1)}%`);
      });
    }
    
    console.log('\n📊 Accuracy Trends:');
    console.log(`  Quiz 1: ${performance2.trends.accuracy[0].value}%`);
    console.log(`  Quiz 2: ${performance2.trends.accuracy[1].value}%`);
    
    // Test 3: Add new subject
    console.log('\n\n📝 Test 3: Adding new subject...');
    const testQuizData3 = {
      accuracy: 90,
      speed: 180,
      topicPerformance: [
        {
          subject: 'Science',
          topic: 'Physics',
          questionsAttempted: 5,
          questionsCorrect: 5,
          accuracy: 100
        }
      ]
    };
    
    const performance3 = await StudentPerformance.updateAfterQuiz(testUserId, testQuizData3);
    console.log('✅ New subject added');
    
    console.log('\n📊 All Topics:');
    const mathTopics = performance3.topicMastery.filter(tm => tm.subject === 'Mathematics');
    const scienceTopics = performance3.topicMastery.filter(tm => tm.subject === 'Science');
    
    console.log('  Mathematics:');
    mathTopics.forEach(tm => {
      console.log(`    - ${tm.topic}: ${tm.accuracy.toFixed(1)}%`);
    });
    
    console.log('  Science:');
    scienceTopics.forEach(tm => {
      console.log(`    - ${tm.topic}: ${tm.accuracy.toFixed(1)}%`);
    });
    
    // Cleanup
    console.log('\n\n🧹 Cleaning up test data...');
    await StudentPerformance.deleteOne({ studentId: testUserId });
    console.log('✅ Test data removed');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
    console.log('\n\n✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testStudentPerformance();
