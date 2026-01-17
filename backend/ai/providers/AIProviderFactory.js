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
   * Get a specific provider by name with optional config
   */
  get(name, config = {}) {
    // Case-insensitive provider lookup
    const providerName = name.toLowerCase();
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`AI provider not found: ${name}`);
    }
    
    // If config is provided, create a new instance with config
    if (Object.keys(config).length > 0) {
      const ProviderClass = provider.constructor;
      return new ProviderClass(config);
    }
    
    return provider;
  }

  /**
   * Get the best available provider
   * Returns default provider if available, otherwise fallback
   */
  async getBestAvailable() {
    // Try default provider first
    const defaultProviderName = this.defaultProvider.toLowerCase();
    const defaultProvider = this.providers.get(defaultProviderName);
    if (defaultProvider && await defaultProvider.isAvailable()) {
      return defaultProvider;
    }
    
    logger.warn(`Default provider ${this.defaultProvider} not available, using fallback`);
    
    // Try other providers
    for (const [name, provider] of this.providers) {
      if (name !== defaultProviderName && await provider.isAvailable()) {
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
    const providerName = name.toLowerCase();
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider not found: ${name}`);
    }
    this.defaultProvider = providerName;
  }
}

// Singleton instance
const factory = new AIProviderFactory();

module.exports = factory;
