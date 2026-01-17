const AIQuestionGenerationService = require('../ai/AIQuestionGenerationService');
const AIProviderFactory = require('../ai/providers/AIProviderFactory');
const logger = require('../utils/logger');

/**
 * Wrapper service for AI question generation
 * Integrates with existing AI service for chapter/topic-based generation
 */
class AIQuestionGenerator {
  constructor() {
    this.aiService = AIQuestionGenerationService; // Already instantiated
    this.providerFactory = AIProviderFactory; // Already instantiated
  }

  /**
   * Generate questions with AI based on course, chapter, and topic
   */
  async generateQuestionsWithAI({
    prompt,
    provider = 'openai',
    model = 'gpt-4',
    count = 5,
    courseId,
    chapterName,
    topic,
    difficultyLevel,
    questionType
  }) {
    try {
      logger.info(`Generating questions with ${provider}/${model}`);
      
      // Get AI provider instance
      const aiProvider = this.providerFactory.get(provider);
      
      if (!aiProvider) {
        throw new Error(`AI provider ${provider} not available`);
      }
      
      // Call AI provider with the structured parameters
      const result = await aiProvider.generateQuestions({
        topic,
        content: prompt, // Use the prompt as content
        difficultyLevel,
        questionType,
        count,
        context: {
          courseTitle: chapterName, // We don't have course title here, using chapter name
          subject: 'General', // We don't have subject
          grade: 'General', // We don't have grade
          chapterName,
          topic,
          difficultyLevel,
          questionType,
          count
        }
      });
      
      // Extract questions from result
      const questions = Array.isArray(result) ? result : (result.questions || []);
      const finalPrompt = result.finalPrompt || prompt; // Fallback to original prompt
      
      // Validate and format questions
      const formattedQuestions = questions.map(q => ({
        text: q.text || q.question || '',
        caseStudy: q.caseStudy || q.case || '',
        options: q.options || [],
        numericalAnswer: q.numericalAnswer || q.answer,
        expectedAnswer: q.expectedAnswer || q.modelAnswer || '',
        keywords: q.keywords || [],
        explanation: q.explanation || '',
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        recommendedTime: q.recommendedTime || 60,
        tags: q.tags || [topic, chapterName]
      }));
      
      return {
        success: true,
        questions: formattedQuestions,
        finalPrompt,
        raw: JSON.stringify(result),
        tokensUsed: result._metadata || {},
        costEstimate: this._calculateCost(result._metadata, provider, model),
        temperature: 0.7,
        maxTokens: 4000
      };
      
    } catch (error) {
      logger.error('AI question generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate estimated cost based on tokens used
   */
  _calculateCost(usage, provider, model) {
    if (!usage || !usage.total) return 0;
    
    // Pricing per 1K tokens (approximate)
    const pricing = {
      'openai': {
        'gpt-4': { prompt: 0.03, completion: 0.06 },
        'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
        'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 }
      }
    };
    
    const modelPricing = pricing[provider]?.[model];
    if (!modelPricing) return 0;
    
    const promptCost = (usage.prompt || 0) / 1000 * modelPricing.prompt;
    const completionCost = (usage.completion || 0) / 1000 * modelPricing.completion;
    
    return promptCost + completionCost;
  }

  /**
   * Get available AI providers
   */
  async getAvailableProviders() {
    return this.providerFactory.getAvailable();
  }
}

module.exports = new AIQuestionGenerator();
