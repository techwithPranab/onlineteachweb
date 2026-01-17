const AIProviderInterface = require('./AIProviderInterface');
const { generateQuestionPrompt, generateContentExtractionPrompt, generateValidationPrompt } = require('../prompts/questionPrompts');
const logger = require('../../utils/logger');

/**
 * OpenAI Provider Implementation
 * Implements the AIProviderInterface for OpenAI API
 */
class OpenAIProvider extends AIProviderInterface {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || process.env.OPENAI_MODEL || 'gpt-4.1-nano';
    this.baseUrl = config.OPENAI_BASEURL || 'https://api.openai.com/v1';
    this.version = '1.0.0';
    
    // Temperature settings per difficulty (lower = more deterministic)
    this.temperatureSettings = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.7
    };
    
    // Max tokens per question type
    this.maxTokenSettings = {
      'mcq-single': 800,
      'mcq-multiple': 1000,
      'true-false': 500,
      'numerical': 600,
      'short-answer': 700,
      'long-answer': 1200,
      'case-based': 1500
    };
  }

  getName() {
    return 'openai';
  }

  getVersion() {
    return this.version;
  }

  getConfig() {
    return {
      name: this.getName(),
      version: this.version,
      model: this.model,
      temperatureSettings: this.temperatureSettings
    };
  }

  async isAvailable() {
    if (!this.apiKey) {
      logger.warn('OpenAI API key not configured');
      return false;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      logger.error('OpenAI availability check failed:', error);
      return false;
    }
  }

  /**
   * Generate questions using OpenAI
   */
  async generateQuestions(input) {
    const { topic, content, difficultyLevel, questionType, count, context } = input;
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { systemPrompt, userPrompt } = generateQuestionPrompt({
      topic,
      content,
      difficultyLevel,
      questionType,
      count,
      context
    });

    const temperature = this.temperatureSettings[difficultyLevel] || 0.5;
    const maxTokens = (this.maxTokenSettings[questionType] || 800) * count;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse and validate response
      const parsed = JSON.parse(content);
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
      
      // Add metadata and ensure correct answer is properly set
      const result = questions.map(q => {
        // Ensure correctAnswer is set for MCQ questions
        if ((q.type?.startsWith('mcq') || q.type === 'true-false') && q.options) {
          const correctOption = q.options.find(opt => opt.isCorrect === true);
          if (correctOption && !q.correctAnswer) {
            q.correctAnswer = correctOption.text;
          }
          // Set correctAnswerIndex if not present
          if (q.correctAnswerIndex === undefined) {
            q.correctAnswerIndex = q.options.findIndex(opt => opt.isCorrect === true);
          }
        }
        
        // Ensure correctAnswer is set for numerical questions
        if (q.type === 'numerical' && q.numericalAnswer && !q.correctAnswer) {
          q.correctAnswer = `${q.numericalAnswer.value}${q.numericalAnswer.unit ? ' ' + q.numericalAnswer.unit : ''}`;
        }
        
        // Ensure correctAnswer is set for short/long answer
        if ((q.type === 'short-answer' || q.type === 'long-answer') && q.expectedAnswer && !q.correctAnswer) {
          q.correctAnswer = q.expectedAnswer;
        }
        
        return {
          ...q,
          _metadata: {
            provider: this.getName(),
            model: this.model,
            version: this.version,
            generatedAt: new Date().toISOString(),
            temperature,
            promptVersion: require('../prompts/questionPrompts').PROMPT_VERSION
          }
        };
      });

      // Return result with final prompt
      return result;

    } catch (error) {
      logger.error('OpenAI question generation failed:', error);
      throw error;
    }
  }

  /**
   * Extract content from materials
   */
  async extractContent(materialText, topic) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { systemPrompt, userPrompt } = generateContentExtractionPrompt(materialText, topic);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0]?.message?.content || '{}');

    } catch (error) {
      logger.error('OpenAI content extraction failed:', error);
      throw error;
    }
  }

  /**
   * Validate question quality
   */
  async validateQuestion(question) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { systemPrompt, userPrompt } = generateValidationPrompt(question);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0]?.message?.content || '{}');

    } catch (error) {
      logger.error('OpenAI question validation failed:', error);
      throw error;
    }
  }
}

module.exports = OpenAIProvider;
