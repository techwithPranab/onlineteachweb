import api from './api';

/**
 * AI Question Generation API Service
 */
const aiQuestionService = {
  /**
   * Generate questions using AI
   * @param {Object} params - Generation parameters
   */
  generateQuestions: async (params) => {
    const response = await api.post('/ai/questions/generate', params);
    return response.data;
  },

  /**
   * Get draft questions for review
   * @param {Object} params - Query parameters
   */
  getDrafts: async (params = {}) => {
    const response = await api.get('/ai/questions/drafts', { params });
    return response.data;
  },

  /**
   * Get single draft by ID
   * @param {string} id - Draft ID
   */
  getDraftById: async (id) => {
    const response = await api.get(`/ai/questions/drafts/${id}`);
    return response.data;
  },

  /**
   * Edit a draft
   * @param {string} id - Draft ID
   * @param {Object} data - Updated data
   */
  editDraft: async (id, data) => {
    const response = await api.put(`/ai/questions/drafts/${id}`, data);
    return response.data;
  },

  /**
   * Approve a draft
   * @param {string} id - Draft ID
   * @param {Object} edits - Optional edits to apply
   */
  approveDraft: async (id, edits = null) => {
    const response = await api.post(`/ai/questions/approve/${id}`, { edits });
    return response.data;
  },

  /**
   * Reject a draft
   * @param {string} id - Draft ID
   * @param {string} reason - Rejection reason
   */
  rejectDraft: async (id, reason) => {
    const response = await api.post(`/ai/questions/reject/${id}`, { reason });
    return response.data;
  },

  /**
   * Bulk approve drafts
   * @param {string[]} draftIds - Array of draft IDs
   */
  bulkApprove: async (draftIds) => {
    const response = await api.post('/ai/questions/bulk-approve', { draftIds });
    return response.data;
  },

  /**
   * Bulk reject drafts
   * @param {string[]} draftIds - Array of draft IDs
   * @param {string} reason - Rejection reason
   */
  bulkReject: async (draftIds, reason) => {
    const response = await api.post('/ai/questions/bulk-reject', { draftIds, reason });
    return response.data;
  },

  /**
   * Get generation statistics
   * @param {string} courseId - Optional course ID filter
   */
  getStatistics: async (courseId = null) => {
    const params = courseId ? { courseId } : {};
    const response = await api.get('/ai/questions/stats', { params });
    return response.data;
  },

  /**
   * Get drafts by job ID
   * @param {string} jobId - Job ID
   */
  getDraftsByJob: async (jobId) => {
    const response = await api.get(`/ai/questions/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Get AI provider status (admin only)
   */
  getProviderStatus: async () => {
    const response = await api.get('/ai/providers/status');
    console.log('AI Provider Status:', response.data);
    return response.data;
  },

  /**
   * Get available AI providers (for tutors and admins)
   */
  getAvailableProviders: async () => {
    const response = await api.get('/ai/providers');
    return response.data;
  },

  // ============ Async Generation Methods ============

  /**
   * Start async generation job (for large batches)
   * @param {Object} params - Generation parameters
   */
  generateQuestionsAsync: async (params) => {
    const response = await api.post('/ai/questions/generate-async', params);
    return response.data;
  },

  /**
   * Get async job status
   * @param {string} jobId - Job ID
   */
  getJobStatus: async (jobId) => {
    const response = await api.get(`/ai/questions/jobs/${jobId}/status`);
    return response.data;
  },

  /**
   * Get async job results
   * @param {string} jobId - Job ID
   */
  getJobResults: async (jobId) => {
    const response = await api.get(`/ai/questions/jobs/${jobId}/results`);
    return response.data;
  },

  /**
   * Cancel async generation job
   * @param {string} jobId - Job ID
   */
  cancelJob: async (jobId) => {
    const response = await api.delete(`/ai/questions/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Get queue stats (admin only)
   */
  getQueueStats: async () => {
    const response = await api.get('/ai/questions/queue/stats');
    return response.data;
  }
};

export default aiQuestionService;
