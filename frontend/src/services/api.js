import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

console.log('API baseURL:', api.defaults.baseURL);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'Full URL:', `${config.baseURL}${config.url}`);
    
    // Add authorization header if token exists
    try {
      // Get token from localStorage (zustand persist stores it there)
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers['Authorization'] = `Bearer ${state.token}`;
          console.log('Token added to request');
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
)

// Response interceptor
let tokenRefreshPromise = null

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.message);
    
    const originalRequest = error.config

    // Handle token expiration
    const isAuthRequest = /^\/?auth\/(login|register|refresh|logout)(?:[/?]|$)/.test(originalRequest?.url || '')
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true

      try {
        const { useAuthStore } = await import('../store/authStore')
        // Share one refresh across simultaneous background requests. Never
        // refresh a failed refresh/logout request, which would recurse forever.
        if (!tokenRefreshPromise) {
          tokenRefreshPromise = useAuthStore.getState().refreshAccessToken()
            .finally(() => { tokenRefreshPromise = null })
        }
        const newToken = await tokenRefreshPromise

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
