/**
 * AI Provider Interface (Strategy Pattern)
 * All AI providers must implement this interface
 * This enables pluggable AI backends (OpenAI, Local LLM, etc.)
 */
class AIProviderInterface {
  /**
   * Generate questions based on input parameters
   * @param {Object} input - Generation input
   * @param {string} input.topic - Topic to generate questions for
   * @param {string} input.content - Source content for question generation
   * @param {string} input.difficultyLevel - easy | medium | hard
   * @param {string} input.questionType - Type of question to generate
   * @param {number} input.count - Number of questions to generate
   * @param {Object} input.context - Additional context (learning objectives, etc.)
   * @returns {Promise<Array>} Generated questions
   */
  async generateQuestions(input) {
    throw new Error('Method generateQuestions() must be implemented');
  }

  /**
   * Validate if provider is configured and ready
   * @returns {Promise<boolean>} Provider availability status
   */
  async isAvailable() {
    throw new Error('Method isAvailable() must be implemented');
  }

  /**
   * Get provider name
   * @returns {string} Provider identifier
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * Get provider version
   * @returns {string} Version identifier
   */
  getVersion() {
    throw new Error('Method getVersion() must be implemented');
  }

  /**
   * Get model configuration
   * @returns {Object} Model configuration details
   */
  getConfig() {
    throw new Error('Method getConfig() must be implemented');
  }
}

module.exports = AIProviderInterface;
