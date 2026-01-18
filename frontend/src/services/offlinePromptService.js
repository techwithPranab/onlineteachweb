import api from './api';

/**
 * Offline Prompt API Service
 */
const offlinePromptService = {
  /**
   * Generate offline prompt
   * @param {Object} params - Generation parameters
   */
  generatePrompt: async (params) => {
    const response = await api.post('/offline-prompts/generate', params);
    return response.data;
  },

  /**
   * Get all prompts with pagination and filters
   * @param {Object} params - Query parameters
   */
  getPrompts: async (params = {}) => {
    const response = await api.get('/offline-prompts', { params });
    return response.data;
  },

  /**
   * Get single prompt by ID
   * @param {string} id - Prompt ID
   */
  getPromptById: async (id) => {
    const response = await api.get(`/offline-prompts/${id}`);
    return response.data;
  },

  /**
   * Delete prompt
   * @param {string} id - Prompt ID
   */
  deletePrompt: async (id) => {
    const response = await api.delete(`/offline-prompts/${id}`);
    return response.data;
  },

  /**
   * Get statistics
   * @param {Object} params - Filter parameters
   */
  getStatistics: async (params = {}) => {
    const response = await api.get('/offline-prompts/statistics', { params });
    return response.data;
  },

  /**
   * Download prompt JSON file
   * @param {string} id - Prompt ID
   */
  downloadPromptFile: async (id) => {
    const response = await api.get(`/offline-prompts/${id}/download`, {
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Get filter values for dropdowns
   */
  getFilterValues: async () => {
    const response = await api.get('/offline-prompts/filters/values');
    return response.data;
  }
};

export default offlinePromptService;
