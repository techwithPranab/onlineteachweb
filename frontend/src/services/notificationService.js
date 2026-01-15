import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const createAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Notification Service
 */
const notificationService = {
  /**
   * Get user's notifications
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Notifications and metadata
   */
  getNotifications: async (options = {}) => {
    const { limit = 20, skip = 0, unreadOnly = false } = options;
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
      unreadOnly: unreadOnly.toString()
    });
    
    const response = await axios.get(
      `${API_URL}/notifications?${params.toString()}`,
      createAuthConfig()
    );
    return response.data;
  },
  
  /**
   * Get unread count
   * @returns {Promise<Object>} - Unread count
   */
  getUnreadCount: async () => {
    const response = await axios.get(
      `${API_URL}/notifications/unread-count`,
      createAuthConfig()
    );
    return response.data;
  },
  
  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  markAsRead: async (id) => {
    const response = await axios.patch(
      `${API_URL}/notifications/${id}/read`,
      {},
      createAuthConfig()
    );
    return response.data;
  },
  
  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} - Success message
   */
  markAllAsRead: async () => {
    const response = await axios.patch(
      `${API_URL}/notifications/read-all`,
      {},
      createAuthConfig()
    );
    return response.data;
  },
  
  /**
   * Delete notification
   * @param {string} id - Notification ID
   * @returns {Promise<Object>} - Success message
   */
  delete: async (id) => {
    const response = await axios.delete(
      `${API_URL}/notifications/${id}`,
      createAuthConfig()
    );
    return response.data;
  },
  
  /**
   * Delete all read notifications
   * @returns {Promise<Object>} - Success message
   */
  deleteAllRead: async () => {
    const response = await axios.delete(
      `${API_URL}/notifications/read/all`,
      createAuthConfig()
    );
    return response.data;
  }
};

export default notificationService;
