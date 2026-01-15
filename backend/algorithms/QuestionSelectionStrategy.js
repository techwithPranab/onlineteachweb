/**
 * Question Selection Strategy Interface
 * All selection strategies must implement this interface
 */
class QuestionSelectionStrategy {
  /**
   * Select questions based on criteria
   * @param {Object} criteria - Selection criteria
   * @returns {Promise<Array>} Selected questions
   */
  async select(criteria) {
    throw new Error('Method select() must be implemented');
  }
  
  /**
   * Get algorithm version
   * @returns {string} Version identifier
   */
  getVersion() {
    throw new Error('Method getVersion() must be implemented');
  }
}

module.exports = QuestionSelectionStrategy;
