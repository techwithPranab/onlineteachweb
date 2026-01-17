const mongoose = require('mongoose');
const AIQuestionGenerationService = require('./ai/AIQuestionGenerationService');

async function testApprove() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online-teaching', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Test with edits that don't include correctAnswer
    const result = await AIQuestionGenerationService.approveDraft(
      '696ad0d008385cf501f0c146', // draft ID
      '696ad023a92f798790cd7048', // user ID
      { text: 'What is the sum of 2 and 2?' } // edits without correctAnswer
    );

    console.log('Approve successful!');
    console.log('Question created with correctAnswer:', result.question.correctAnswer);
    console.log('Draft status:', result.draft.status);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testApprove();
