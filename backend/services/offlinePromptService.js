const fs = require('fs').promises;
const path = require('path');
const QuestionOfflinePrompt = require('../models/QuestionOfflinePrompt.model');
const Course = require('../models/Course.model');
const logger = require('../utils/logger');

/**
 * Offline Prompt Service
 * Handles generation of prompts and JSON file creation
 */

class OfflinePromptService {
  /**
   * Generate prompt template for offline question generation
   */
  generatePromptTemplate(params) {
    const {
      courseId,
      chapterId,
      courseName,
      grade,
      subject,
      chapterName,
      topic,
      difficultyLevel,
      questionType,
      questionsCount,
      includeExplanations = true,
      includeHints = false,
      syllabus = '',
      learningObjectives = '',
      additionalContext = ''
    } = params;

    // Sanitize names for filename
    const sanitizedCourse = courseName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const sanitizedChapter = chapterName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const sanitizedTopic = topic.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    // Map difficulty level to description
    const difficultyDescriptions = {
      easy: 'Direct recall, definitions, basic examples\n- Cognitive Level: Knowledge and Comprehension\n- Complexity: Single concept, straightforward application\n- Example Types: Define terms, identify facts, simple calculations',
      medium: 'Application of concepts, multi-step problems\n- Cognitive Level: Application and Analysis\n- Complexity: Multiple concepts, requires reasoning\n- Example Types: Apply formulas, analyze situations, compare/contrast',
      hard: 'Complex problems, critical thinking, synthesis\n- Cognitive Level: Analysis, Synthesis, and Evaluation\n- Complexity: Multiple concepts integration, creative thinking\n- Example Types: Solve complex problems, evaluate arguments, create solutions'
    };

    // Map question type to description
    const questionTypeDescriptions = {
      'mcq-single': 'Multiple Choice (Single Answer)\n- Instructions: Generate a question with exactly 4 options where only ONE option is correct.',
      'mcq-multiple': 'Multiple Choice (Multiple Answers)\n- Instructions: Generate a question with 4-6 options where 2-3 options are correct.',
      'true-false': 'True/False\n- Instructions: Generate a statement that is definitively true or false.',
      'numerical': 'Numerical Answer\n- Instructions: Generate a problem that requires a numerical answer with units.',
      'short-answer': 'Short Answer\n- Instructions: Generate a question requiring 1-3 sentence response.',
      'long-answer': 'Long Answer\n- Instructions: Generate a question requiring detailed 5-10 sentence response.',
      'case-based': 'Case-Based\n- Instructions: Generate a scenario with 3-5 related sub-questions.'
    };

    let promptText = `You are an expert educational content creator specializing in creating high-quality quiz questions for students. Your questions must be:

1. ACCURATE: Factually correct and pedagogically sound
2. CLEAR: Unambiguous and easy to understand
3. CURRICULUM-ALIGNED: Relevant to the topic and learning objectives
4. DIFFICULTY-APPROPRIATE: Matching the specified difficulty level exactly
5. WELL-STRUCTURED: Following the exact output format specified

CRITICAL RULES:
- Never generate inappropriate, offensive, or biased content
- Ensure all answer options are plausible (no obviously wrong distractors)
- Provide educational explanations for answers
- Match the cognitive level to the difficulty
- Output ONLY valid JSON, no additional text

Generate exactly ${questionsCount} ${questionType} question(s) about the following topic.

TOPIC: ${topic}

SOURCE CONTENT:
# ${grade} ${subject} - ${chapterName}

---

${syllabus || 'Exploring concepts related to ' + topic}

---

## Syllabus

---

${syllabus || '- ' + topic}

---

## Topics

---

- ${subject}
- ${chapterName}
- ${topic}

---

## Chapters

---

### ${chapterName}

---

- ${topic}

---

**Learning Objectives:**

---

${learningObjectives || '- Understand and apply concepts related to ' + topic}

---

ADDITIONAL CONTEXT:
- Learning Objectives: ${learningObjectives || 'Master the fundamentals of ' + topic}
- Prerequisites: None
- Grade Level: ${grade}
- Subject: ${subject}
- Board: ICSE,CBSE
${additionalContext ? '\n- Additional Notes: ' + additionalContext : ''}

DIFFICULTY LEVEL: ${difficultyLevel.toUpperCase()}
- Description: ${difficultyDescriptions[difficultyLevel] || difficultyDescriptions.medium}

QUESTION TYPE: ${questionTypeDescriptions[questionType] || questionTypeDescriptions['mcq-single']}

OUTPUT FORMAT:
Return a JSON array of question objects. Each question MUST have this exact structure and save to a file at Data/Grade${grade}/${subject}/${sanitizedCourse}_${sanitizedChapter}_${sanitizedTopic}_SEQUENCE.json
[
  {
    "_id": {
      "$oid": "GENERATE_24_CHAR_HEX_STRING"
    },
    "questionPayload": {
      "courseId": {
        "$oid": "${courseId}"
      },
      "courseTitle": "${courseName}",
      "chapterId": {
        "$oid": "${chapterId || '507f1f77bcf86cd799439011'}"
      },
      "chapterName": "${chapterName}",
      "grade": "${grade}",
      "subject": "${subject}",
      "text": "Your question text here?",
      "topic": "${topic}",
      "difficultyLevel": "${difficultyLevel}",
      "type": "${questionType}",
      "correctAnswer": "The correct answer text or normalized value",
      "explanation": "Detailed explanation of the correct answer and why other options are incorrect.",
      "marks": 1,
      "negativeMarks": 0,
      "recommendedTime": 60,
      "tags": [],
      "options": [
        {
          "text": "Option 1 text",
          "isCorrect": false,
          "explanation": "Why this option is incorrect"
        },
        {
          "text": "Option 2 text",
          "isCorrect": true,
          "explanation": "Why this option is correct"
        },
        {
          "text": "Option 3 text",
          "isCorrect": false,
          "explanation": "Why this option is incorrect"
        },
        {
          "text": "Option 4 text",
          "isCorrect": false,
          "explanation": "Why this option is incorrect"
        }
      ],
      "_metadata": {
        "provider": "openai",
        "model": "gpt-4.1-nano",
        "version": "1.0.0",
        "generatedAt": "ISO_DATE_HERE",
        "temperature": 0.3,
        "promptVersion": "1.0.0"
      }
    },
    "sourceType": "ai_generated",
    "sourceMaterials": [],
    "modelUsed": "openai/1.0.0",
    "promptVersion": "1.0.0",
    "confidenceScore": 0.8,
    "validationFlags": [],
    "status": "draft",
    "jobId": "qgen_TIMESTAMP_RANDOMID",
    "createdBy": {
      "$oid": "696464a013ae03e5728399c5"
    },
    "editHistory": [],
    "createdAt": {
      "$date": "ISO_DATE_HERE"
    },
    "updatedAt": {
      "$date": "ISO_DATE_HERE"
    },
    "__v": 0
  }
]

CRITICAL ANSWER REQUIREMENTS:
- EVERY question MUST include ALL answer options (for MCQ: exactly 4 options)
- EVERY question MUST clearly mark which answer is correct using "isCorrect": true
- ALL options must have explanations for why they are correct or incorrect

IMPORTANT:
- Generate EXACTLY ${questionsCount} question(s)
- Return ONLY the JSON array, no other text
- EVERY question MUST have complete answer options with ONE marked as correct
- Ensure variety in questions (don't repeat similar concepts)
- All questions must be answerable from the given content or standard knowledge
- Include detailed explanations for BOTH correct and incorrect options
- For "_id"."$oid", generate a unique 24-character hexadecimal string for each question (e.g., "507f1f77bcf86cd799439011")
- For "jobId", use format "qgen_TIMESTAMP_RANDOMID" where TIMESTAMP is current timestamp and RANDOMID is random string
- For dates, use current ISO date string (e.g., "2026-01-17T00:00:00.000Z")
`;

    return promptText;
  }



  /**
   * Create sample output structure matching AIQuestionDraft format
   */
  createOutputStructure(params) {
    const {
      courseId,
      chapterId,
      courseName,
      grade,
      subject,
      chapterName,
      topic,
      difficultyLevel,
      questionType,
      questionsCount
    } = params;

    return [
      {
        _id: {
          $oid: "GENERATE_UNIQUE_ID"
        },
        questionPayload: {
          courseId: {
            $oid: courseId
          },
          courseTitle: courseName,
          chapterId: {
            $oid: chapterId || "507f1f77bcf86cd799439011"
          },
          chapterName: chapterName,
          grade: grade,
          subject: subject,
          text: "Your question text here?",
          topic: topic,
          difficultyLevel: difficultyLevel,
          type: questionType,
          correctAnswer: "The correct answer text or normalized value",
          explanation: "Detailed explanation of the correct answer and why other options are incorrect.",
          marks: 1,
          negativeMarks: 0,
          recommendedTime: 60,
          tags: [],
          options: [
            {
              text: "Option 1 text",
              isCorrect: false,
              explanation: "Why this option is incorrect"
            },
            {
              text: "Option 2 text",
              isCorrect: true,
              explanation: "Why this option is correct"
            },
            {
              text: "Option 3 text",
              isCorrect: false,
              explanation: "Why this option is incorrect"
            },
            {
              text: "Option 4 text",
              isCorrect: false,
              explanation: "Why this option is incorrect"
            }
          ],
          _metadata: {
            provider: "openai",
            model: "gpt-4.1-nano",
            version: "1.0.0",
            generatedAt: new Date().toISOString(),
            temperature: 0.3,
            promptVersion: "1.0.0"
          }
        },
        sourceType: "ai_generated",
        sourceMaterials: [],
        modelUsed: "openai/1.0.0",
        promptVersion: "1.0.0",
        confidenceScore: 0.8,
        validationFlags: [],
        status: "draft",
        jobId: `qgen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdBy: {
          $oid: "USER_ID_HERE"
        },
        editHistory: [],
        createdAt: {
          $date: new Date().toISOString()
        },
        updatedAt: {
          $date: new Date().toISOString()
        },
        __v: 0
      }
    ];
  }

  /**
   * Save JSON file to Data folder
   */
  async saveJsonFile(fileName, data, grade, subject) {
    try {
      // Create folder structure: Data/Grade{X}/{Subject}/
      const folderName = `Grade${grade}/${subject}`;
      const dataDir = path.join(process.cwd(), '..', 'Data', folderName);
      
      // Ensure directory exists
      await fs.mkdir(dataDir, { recursive: true });

      const filePath = path.join(dataDir, fileName);
      
      // Write JSON file with pretty formatting
      await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      logger.info(`Offline prompt JSON saved: ${filePath}`);
      
      return {
        fileName,
        filePath,
        fullPath: filePath
      };
    } catch (error) {
      logger.error('Error saving JSON file:', error);
      throw new Error(`Failed to save JSON file: ${error.message}`);
    }
  }

  /**
   * Generate offline prompt and save to database and file
   */
  async generateOfflinePrompt(params, userId) {
    try {
      const {
        courseId,
        chapterId,
        grade,
        subject,
        chapterName,
        topic,
        difficultyLevel,
        questionType,
        questionsCount,
        sources = ['syllabus'],
        includeExplanations = true,
        includeHints = false,
        notes,
        saveToFile = true
      } = params;

      // Fetch course details
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const courseName = course.title;

      // Generate prompt text
      const promptText = this.generatePromptTemplate({
        courseId,
        chapterId,
        courseName,
        grade,
        subject,
        chapterName,
        topic,
        difficultyLevel,
        questionType,
        questionsCount,
        includeExplanations,
        includeHints
      });

      // Create output structure
      const outputStructure = this.createOutputStructure({
        courseId,
        chapterId,
        courseName,
        grade,
        subject,
        chapterName,
        topic,
        difficultyLevel,
        questionType,
        questionsCount
      });

      // Generate file name and save JSON file if requested
      let fileInfo = null;
      if (saveToFile) {
        const sequence = Date.now();
        const sanitizedCourse = courseName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const sanitizedChapter = chapterName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const sanitizedTopic = topic.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const fileName = `${sanitizedCourse}_${sanitizedChapter}_${sanitizedTopic}_${sequence}.json`;

        fileInfo = await this.saveJsonFile(
          fileName,
          {
            prompt: promptText,
            outputStructure: outputStructure
          },
          grade,
          subject
        );
      }

      // Create database record
      const offlinePrompt = await QuestionOfflinePrompt.create({
        courseId,
        chapterId,
        courseName,
        grade,
        subject,
        chapterName,
        topic,
        difficultyLevel,
        questionType,
        questionsCount,
        promptText,
        fileName: fileInfo?.fileName || null,
        filePath: fileInfo?.filePath || null,
        outputStructure,
        generatedBy: userId,
        generationOptions: {
          sources,
          includeExplanations,
          includeHints
        },
        notes: notes || ''
      });

      logger.info(`Offline prompt generated: ${offlinePrompt._id}`);

      return {
        success: true,
        prompt: offlinePrompt,
        fileInfo: fileInfo ? {
          fileName: fileInfo.fileName,
          filePath: fileInfo.filePath
        } : null
      };
    } catch (error) {
      logger.error('Error generating offline prompt:', error);
      throw error;
    }
  }

  /**
   * Get prompts with pagination and filters
   */
  async getPrompts(filters, page = 1, limit = 20) {
    try {
      const result = await QuestionOfflinePrompt.getPaginatedPrompts(filters, page, limit);
      return {
        success: true,
        ...result
      };
    } catch (error) {
      logger.error('Error fetching prompts:', error);
      throw error;
    }
  }

  /**
   * Get single prompt by ID
   */
  async getPromptById(promptId) {
    try {
      const prompt = await QuestionOfflinePrompt.findById(promptId)
        .populate('courseId', 'title grade subject chapters')
        .populate('generatedBy', 'name email');

      if (!prompt) {
        throw new Error('Prompt not found');
      }

      return {
        success: true,
        prompt
      };
    } catch (error) {
      logger.error('Error fetching prompt:', error);
      throw error;
    }
  }

  /**
   * Delete prompt and associated JSON file
   */
  async deletePrompt(promptId) {
    try {
      const prompt = await QuestionOfflinePrompt.findById(promptId);
      
      if (!prompt) {
        throw new Error('Prompt not found');
      }

      // Delete JSON file if it exists
      if (prompt.filePath) {
        try {
          await fs.unlink(prompt.filePath);
          logger.info(`Deleted file: ${prompt.filePath}`);
        } catch (fileError) {
          logger.warn(`Could not delete file ${prompt.filePath}:`, fileError);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete database record
      await QuestionOfflinePrompt.findByIdAndDelete(promptId);

      logger.info(`Deleted offline prompt: ${promptId}`);

      return {
        success: true,
        message: 'Prompt deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting prompt:', error);
      throw error;
    }
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(filters = {}) {
    try {
      const query = {};
      if (filters.grade) query.grade = filters.grade;
      if (filters.subject) query.subject = filters.subject;
      if (filters.generatedBy) query.generatedBy = filters.generatedBy;

      const [total, byDifficulty, byStatus, bySubject, recent] = await Promise.all([
        QuestionOfflinePrompt.countDocuments(query),
        QuestionOfflinePrompt.aggregate([
          { $match: query },
          { $group: { _id: '$difficultyLevel', count: { $sum: 1 } } }
        ]),
        QuestionOfflinePrompt.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        QuestionOfflinePrompt.aggregate([
          { $match: query },
          { $group: { _id: { grade: '$grade', subject: '$subject' }, count: { $sum: 1 } } }
        ]),
        QuestionOfflinePrompt.find(query)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('courseId', 'title')
          .select('courseName chapterName topic createdAt')
      ]);

      return {
        success: true,
        statistics: {
          total,
          byDifficulty,
          byStatus,
          bySubject,
          recent
        }
      };
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      throw error;
    }
  }
}

module.exports = new OfflinePromptService();
