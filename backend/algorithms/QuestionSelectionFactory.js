const DefaultQuestionSelectionStrategy = require('./DefaultQuestionSelectionStrategy');
const AdaptiveQuestionSelectionStrategy = require('./AdaptiveQuestionSelectionStrategy');

/**
 * Question Selection Factory
 * Creates the appropriate selection strategy based on configuration
 * Supports pluggable strategies for future extensions
 */
class QuestionSelectionFactory {
  constructor() {
    // Registry of available strategies
    this.strategies = new Map([
      ['default', DefaultQuestionSelectionStrategy],
      ['adaptive', AdaptiveQuestionSelectionStrategy]
    ]);
    
    // Default strategy
    this.defaultStrategy = 'default';
  }
  
  /**
   * Register a new strategy
   * @param {string} name - Strategy identifier
   * @param {class} StrategyClass - Strategy class implementing QuestionSelectionStrategy
   */
  registerStrategy(name, StrategyClass) {
    this.strategies.set(name, StrategyClass);
  }
  
  /**
   * Get a strategy instance
   * @param {string} strategyName - Name of the strategy
   * @returns {QuestionSelectionStrategy} Strategy instance
   */
  getStrategy(strategyName = null) {
    const name = strategyName || this.defaultStrategy;
    const StrategyClass = this.strategies.get(name);
    
    if (!StrategyClass) {
      throw new Error(`Unknown question selection strategy: ${name}`);
    }
    
    return new StrategyClass();
  }
  
  /**
   * Get list of available strategies
   * @returns {Array<string>} Strategy names
   */
  getAvailableStrategies() {
    return Array.from(this.strategies.keys());
  }
  
  /**
   * Set default strategy
   * @param {string} strategyName - Strategy name to set as default
   */
  setDefaultStrategy(strategyName) {
    if (!this.strategies.has(strategyName)) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }
    this.defaultStrategy = strategyName;
  }
}

// Export singleton instance
module.exports = new QuestionSelectionFactory();
