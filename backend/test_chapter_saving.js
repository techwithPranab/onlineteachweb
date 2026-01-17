require('dotenv').config();
const mongoose = require('mongoose');
const AIQuestionGenerationService = require('./ai/AIQuestionGenerationService');

async function testChapterSaving() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-teaching');

    // Generate a test question to see if chapter info is saved
    const result = await AIQuestionGenerationService.generateQuestions({
      courseId: '6969ec00ef8889b51b160d94', // Use existing course ID
      topics: ['Mathematics'],
      difficultyLevels: ['easy'],
      questionTypes: ['mcq-single'],
      questionsPerTopic: 1,
      sources: ['syllabus'],
      userId: '696ad023a92f798790cd7048'
    });

    console.log('Generation result:', result);

    // Check the created draft
    if (result.summary.draftsCreated > 0) {
      const AIQuestionDraft = require('./models/AIQuestionDraft.model');
      const drafts = await AIQuestionDraft.find({ jobId: result.jobId }).limit(1);

      if (drafts.length > 0) {
        const draft = drafts[0];
        console.log('Draft questionPayload:');
        console.log(JSON.stringify(draft.questionPayload, null, 2));

        console.log('Chapter info in draft:');
        console.log('chapterId:', draft.questionPayload.chapterId);
        console.log('chapterName:', draft.questionPayload.chapterName);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testChapterSaving();
