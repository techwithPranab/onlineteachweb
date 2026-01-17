const mongoose = require('mongoose');
const AIQuestionDraft = require('./models/AIQuestionDraft.model');

async function debugDraft() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online-teaching', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const draft = await AIQuestionDraft.findById('696ad0d008385cf501f0c146');
    console.log('Original questionPayload:', JSON.stringify(draft.questionPayload, null, 2));

    const edits = { text: 'What is the sum of 2 and 2?' };
    console.log('Edits:', JSON.stringify(edits, null, 2));

    // Simulate the merge logic
    let questionData = draft.questionPayload;
    if (edits) {
      // Preserve required fields if not explicitly provided in edits
      const preservedFields = {};
      if (edits.correctAnswer === undefined && questionData.correctAnswer) {
        preservedFields.correctAnswer = questionData.correctAnswer;
        console.log('Preserving correctAnswer:', questionData.correctAnswer);
      }
      if (edits.chapterId === undefined && questionData.chapterId) {
        preservedFields.chapterId = questionData.chapterId;
        console.log('Preserving chapterId:', questionData.chapterId);
      }
      if (edits.chapterName === undefined && questionData.chapterName) {
        preservedFields.chapterName = questionData.chapterName;
        console.log('Preserving chapterName:', questionData.chapterName);
      }

      questionData = { ...questionData, ...edits, ...preservedFields };
      console.log('Final questionData:', JSON.stringify(questionData, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugDraft();
