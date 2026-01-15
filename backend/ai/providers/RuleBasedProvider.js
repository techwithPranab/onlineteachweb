const AIProviderInterface = require('./AIProviderInterface');
const { DIFFICULTY_DEFINITIONS, QUESTION_TYPE_SPECS } = require('../prompts/questionPrompts');
const logger = require('../../utils/logger');

/**
 * Rule-Based Provider Implementation
 * Fallback provider using template-based question generation
 * Used when AI providers are unavailable
 */
class RuleBasedProvider extends AIProviderInterface {
  constructor(config = {}) {
    super();
    this.version = '1.0.0';
    
    // Question templates per type
    this.templates = {
      'mcq-single': [
        { pattern: 'What is {concept}?', answerType: 'definition' },
        { pattern: 'Which of the following best describes {concept}?', answerType: 'description' },
        { pattern: 'What is the main purpose of {concept}?', answerType: 'purpose' },
        { pattern: 'Which statement about {concept} is correct?', answerType: 'fact' },
        { pattern: 'How does {concept} work?', answerType: 'mechanism' }
      ],
      'true-false': [
        { pattern: '{statement}', answerType: 'verification' },
        { pattern: '{concept} is {attribute}.', answerType: 'attribute' }
      ],
      'short-answer': [
        { pattern: 'Define {concept} in your own words.', answerType: 'definition' },
        { pattern: 'Briefly explain the significance of {concept}.', answerType: 'significance' },
        { pattern: 'List the key characteristics of {concept}.', answerType: 'characteristics' }
      ],
      'numerical': [
        { pattern: 'Calculate the value of {calculation}.', answerType: 'calculation' },
        { pattern: 'If {condition}, what is the result?', answerType: 'conditional' }
      ]
    };
  }

  getName() {
    return 'rule-based';
  }

  getVersion() {
    return this.version;
  }

  getConfig() {
    return {
      name: this.getName(),
      version: this.version,
      model: 'template-based',
      isRuleBased: true
    };
  }

  async isAvailable() {
    // Rule-based provider is always available
    return true;
  }

  /**
   * Generate questions using templates
   * Note: This is a fallback and produces lower quality questions
   */
  async generateQuestions(input) {
    const { topic, content, difficultyLevel, questionType, count, context } = input;
    
    logger.info(`Rule-based provider generating ${count} ${questionType} questions for topic: ${topic}`);
    
    // Extract key terms from content
    const keyTerms = this._extractKeyTerms(content || topic);
    const templates = this.templates[questionType] || this.templates['mcq-single'];
    
    const questions = [];
    
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const term = keyTerms[i % keyTerms.length] || topic;
      
      const question = this._generateFromTemplate(template, term, {
        topic,
        difficultyLevel,
        questionType,
        context
      });
      
      questions.push({
        ...question,
        _metadata: {
          provider: this.getName(),
          model: 'template-based',
          version: this.version,
          generatedAt: new Date().toISOString(),
          isRuleBased: true,
          confidenceScore: 0.5 // Lower confidence for rule-based
        }
      });
    }
    
    return questions;
  }

  /**
   * Extract key terms from content
   */
  _extractKeyTerms(content) {
    if (!content) return [];
    
    // Simple extraction - split by common delimiters and filter
    const words = content.split(/[\s,.:;!?]+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 
      'may', 'might', 'must', 'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 
      'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or',
      'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'only', 'own', 'same',
      'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'when', 'where',
      'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'this', 'that']);
    
    const filtered = words.filter(word => {
      const lower = word.toLowerCase();
      return word.length > 3 && !stopWords.has(lower) && !/^\d+$/.test(word);
    });
    
    // Get unique terms
    return [...new Set(filtered)].slice(0, 10);
  }

  /**
   * Generate question from template
   */
  _generateFromTemplate(template, term, options) {
    const { topic, difficultyLevel, questionType, context } = options;
    const difficulty = DIFFICULTY_DEFINITIONS[difficultyLevel];
    
    const questionText = template.pattern.replace('{concept}', term);
    
    const baseQuestion = {
      text: questionText,
      difficultyLevel,
      type: questionType,
      topic,
      explanation: `This question tests understanding of ${term} in the context of ${topic}.`,
      marks: difficultyLevel === 'easy' ? 1 : difficultyLevel === 'medium' ? 2 : 3,
      negativeMarks: difficultyLevel === 'easy' ? 0 : difficultyLevel === 'medium' ? 0.5 : 1,
      recommendedTime: difficultyLevel === 'easy' ? 60 : difficultyLevel === 'medium' ? 120 : 180,
      tags: [topic, term, difficultyLevel]
    };

    // Add type-specific fields
    switch (questionType) {
      case 'mcq-single':
      case 'mcq-multiple':
        baseQuestion.options = this._generateMCQOptions(term, topic, questionType === 'mcq-multiple');
        const correctOpt = baseQuestion.options.find(opt => opt.isCorrect);
        baseQuestion.correctAnswer = correctOpt ? correctOpt.text : '';
        baseQuestion.correctAnswerIndex = baseQuestion.options.findIndex(opt => opt.isCorrect);
        break;
        
      case 'true-false':
        baseQuestion.options = [
          { text: 'True', isCorrect: true, explanation: 'This statement is true based on the given topic.' },
          { text: 'False', isCorrect: false, explanation: 'This statement is actually true, not false.' }
        ];
        baseQuestion.correctAnswer = 'True';
        baseQuestion.correctAnswerIndex = 0;
        break;
        
      case 'numerical':
        baseQuestion.numericalAnswer = {
          value: 0, // Placeholder
          tolerance: 0.01,
          unit: ''
        };
        baseQuestion.correctAnswer = '0';
        baseQuestion.solutionSteps = ['Step 1: Identify the given values', 'Step 2: Apply the formula', 'Step 3: Calculate the result'];
        baseQuestion.text = `Calculate the value related to ${term} in ${topic}. [Requires manual input]`;
        break;
        
      case 'short-answer':
        baseQuestion.expectedAnswer = `A proper answer should explain ${term} in the context of ${topic}.`;
        baseQuestion.correctAnswer = `${term} is a key concept in ${topic} that refers to the fundamental principle or element being discussed.`;
        baseQuestion.sampleAnswer = `${term} is a key concept in ${topic} that refers to the fundamental principle or element being discussed. It plays an important role in understanding the broader subject matter.`;
        baseQuestion.keywords = [term, topic];
        break;
        
      case 'long-answer':
        baseQuestion.expectedAnswer = `A comprehensive answer should cover all aspects of ${term} including its definition, importance, and application in ${topic}.`;
        baseQuestion.correctAnswer = `${term} is defined as a core concept within ${topic}. Its importance lies in providing foundational understanding of the subject. Applications include practical use cases in real-world scenarios.`;
        baseQuestion.sampleAnswer = `${term} is defined as a core concept within ${topic}. Its importance lies in providing foundational understanding of the subject. Applications include practical use cases in real-world scenarios. Students should also consider the historical context and future implications.`;
        baseQuestion.keywords = [term, topic, 'definition', 'importance', 'application'];
        break;
        
      case 'case-based':
        baseQuestion.caseStudy = `Consider a scenario involving ${term} in the context of ${topic}. [Case study needs manual input]`;
        baseQuestion.options = this._generateMCQOptions(term, topic, false);
        const correctCaseOpt = baseQuestion.options.find(opt => opt.isCorrect);
        baseQuestion.correctAnswer = correctCaseOpt ? correctCaseOpt.text : '';
        baseQuestion.correctAnswerIndex = baseQuestion.options.findIndex(opt => opt.isCorrect);
        break;
    }
    
    return baseQuestion;
  }

  /**
   * Generate MCQ options
   */
  _generateMCQOptions(term, topic, isMultiple) {
    // Generate placeholder options
    const options = [
      { text: `Correct definition/answer about ${term}`, isCorrect: true, explanation: 'This is the correct answer.' },
      { text: `Incorrect option 1 - partially related to ${topic}`, isCorrect: false, explanation: 'This is incorrect because it misrepresents the concept.' },
      { text: `Incorrect option 2 - common misconception`, isCorrect: false, explanation: 'This is a common misconception about the topic.' },
      { text: `Incorrect option 3 - unrelated but plausible`, isCorrect: false, explanation: 'This option is not applicable in this context.' }
    ];
    
    if (isMultiple) {
      options[1].isCorrect = true;
      options[1].text = `Another correct aspect of ${term}`;
      options[1].explanation = 'This is also correct.';
    }
    
    return options;
  }
}

module.exports = RuleBasedProvider;
