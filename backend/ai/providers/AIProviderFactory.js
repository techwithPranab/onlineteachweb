const OpenAIProvider = require('./OpenAIProvider');
const RuleBasedProvider = require('./RuleBasedProvider');
const logger = require('../../utils/logger');

/**
 * AI Provider Factory
 * Manages AI provider instances and fallback logic
 */
class AIProviderFactory {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = 'openai';
    this.fallbackProvider = 'rule-based';
    
    // Register built-in providers
    this._registerBuiltInProviders();
  }

  /**
   * Register built-in providers
   */
  _registerBuiltInProviders() {
    // OpenAI Provider
    this.register('openai', new OpenAIProvider());
    
    // Rule-based fallback provider
    this.register('rule-based', new RuleBasedProvider());
    
    logger.info('AI providers registered: ' + Array.from(this.providers.keys()).join(', '));
  }

  /**
   * Register a new provider
   */
  register(name, provider) {
    this.providers.set(name, provider);
  }

  /**
   * Get a specific provider by name
   */
  get(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI provider not found: ${name}`);
    }
    return provider;
  }

  /**
   * Get the best available provider
   * Returns default provider if available, otherwise fallback
   */
  async getBestAvailable() {
    // Try default provider first
    const defaultProvider = this.providers.get(this.defaultProvider);
    if (defaultProvider && await defaultProvider.isAvailable()) {
      return defaultProvider;
    }
    
    logger.warn(`Default provider ${this.defaultProvider} not available, using fallback`);
    
    // Try other providers
    for (const [name, provider] of this.providers) {
      if (name !== this.defaultProvider && await provider.isAvailable()) {
        return provider;
      }
    }
    
    // Return fallback (always available)
    return this.providers.get(this.fallbackProvider);
  }

  /**
   * Get all registered providers
   */
  getAll() {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      version: provider.getVersion(),
      config: provider.getConfig()
    }));
  }

  /**
   * Check availability of all providers
   */
  async checkAvailability() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      results[name] = await provider.isAvailable();
    }
    
    return results;
  }

  /**
   * Set default provider
   */
  setDefault(name) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider not found: ${name}`);
    }
    this.defaultProvider = name;
  }
}

// Singleton instance
const factory = new AIProviderFactory();

module.exports = factory;
