const express = require('express');
const router = express.Router();
const OpenAIProvider = require('../ai/providers/OpenAIProvider');
const logger = require('../utils/logger');

// Test route to check OpenAI API connectivity without authentication
router.post('/openai-test', async (req, res) => {
  try {
    logger.info('Testing OpenAI API connectivity...');
    
    const { course, topic, difficulty, questionType } = req.body;
    
    // Use provided parameters or defaults
    const testCourse = course || 'Grade 1 Mathematics';
    const testTopic = topic || 'basic addition';
    const testDifficulty = difficulty || 'easy';
    const testQuestionType = questionType || 'mcq-single';
    
    const openAI = new OpenAIProvider();
    
    // Test the OpenAI connection
    const result = await openAI.generateQuestions({
      topic: testTopic,
      content: `${testCourse} - ${testTopic}`,
      difficultyLevel: testDifficulty,
      questionType: testQuestionType,
      count: 1,
      context: { course: testCourse }
    });
    
    if (result.success) {
      logger.info('OpenAI API test successful');
      res.json({
        success: true,
        message: 'OpenAI API is working correctly',
        model: openAI.model,
        testResult: result
      });
    } else {
      logger.error(`OpenAI API test failed: ${result.error}`);
      res.status(500).json({
        success: false,
        message: 'OpenAI API test failed',
        error: result.error
      });
    }
  } catch (error) {
    logger.error(`OpenAI test error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Test route to check server health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test route for prompt saving functionality
router.post('/test-prompt-saving', async (req, res) => {
  try {
    logger.info('Testing prompt saving functionality...');
    
    const AIQuestionGenerationService = require('../ai/AIQuestionGenerationService');
    const Course = require('../models/Course.model');
    const QuestionGeneration = require('../models/QuestionGeneration.model');
    
    // Try to find an existing course or create a test course
    let testCourse = await Course.findOne();
    if (!testCourse) {
      testCourse = await Course.create({
        title: 'Test Course for Prompt Saving',
        subject: 'Mathematics',
        grade: '5',
        board: 'Test Board',
        description: 'A test course for verifying prompt saving functionality'
      });
      logger.info('Created test course:', testCourse._id);
    }
    
    // Test the AI service with a simple generation
    const testParams = {
      courseId: testCourse._id,
      topics: ['Basic Addition'],
      difficultyLevels: ['easy'],
      questionTypes: ['mcq-single'],
      questionsPerTopic: 1,
      sources: ['syllabus'],
      userId: null, // Test without user
      providerName: 'openai'
    };
    
    // Check generation records before
    const beforeCount = await QuestionGeneration.countDocuments({ courseId: testCourse._id });
    logger.info(`QuestionGeneration records before test: ${beforeCount}`);
    
    // Call the service (this will fail due to OpenAI quota, but should still save prompts)
    try {
      await AIQuestionGenerationService.generateQuestions(testParams);
    } catch (error) {
      logger.info(`Expected error during generation (likely quota): ${error.message}`);
    }
    
    // Check generation records after
    const afterCount = await QuestionGeneration.countDocuments({ courseId: testCourse._id });
    logger.info(`QuestionGeneration records after test: ${afterCount}`);
    
    // Get the latest generation record
    const latestRecord = await QuestionGeneration.findOne({ courseId: testCourse._id })
      .sort({ createdAt: -1 });
    
    if (latestRecord) {
      logger.info(`Latest generation record prompt length: ${latestRecord.prompt?.length || 0}`);
      logger.info(`Latest generation record final prompt length: ${latestRecord.finalPrompt?.length || 0}`);
      
      res.json({
        success: true,
        message: 'Prompt saving test completed',
        results: {
          recordsBeforeTest: beforeCount,
          recordsAfterTest: afterCount,
          recordsCreated: afterCount - beforeCount,
          latestRecord: {
            id: latestRecord._id,
            topic: latestRecord.topic,
            aiProvider: latestRecord.aiProvider,
            model: latestRecord.model,
            promptLength: latestRecord.prompt?.length || 0,
            finalPromptLength: latestRecord.finalPrompt?.length || 0,
            status: latestRecord.status,
            errorMessage: latestRecord.errorMessage
          }
        }
      });
    } else {
      res.json({
        success: false,
        message: 'No generation records found',
        results: {
          recordsBeforeTest: beforeCount,
          recordsAfterTest: afterCount
        }
      });
    }
    
  } catch (error) {
    logger.error(`Prompt saving test error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Prompt saving test failed',
      error: error.message
    });
  }
});

module.exports = router;
