/**
 * AI Question Generation Module
 * Entry point for the AI-driven question generation framework
 */

const AIQuestionGenerationService = require('./AIQuestionGenerationService');
const AIProviderFactory = require('./providers/AIProviderFactory');
const QuestionValidator = require('./validation/QuestionValidator');
const DuplicateDetector = require('./validation/DuplicateDetector');
const ContentFilter = require('./validation/ContentFilter');
const ContentNormalizer = require('./ingestion/ContentNormalizer');
const MaterialExtractor = require('./ingestion/MaterialExtractor');
const prompts = require('./prompts/questionPrompts');

module.exports = {
  // Main service
  AIQuestionGenerationService,
  
  // Providers
  AIProviderFactory,
  
  // Validation
  QuestionValidator,
  DuplicateDetector,
  ContentFilter,
  
  // Ingestion
  ContentNormalizer,
  MaterialExtractor,
  
  // Prompts
  prompts
};
