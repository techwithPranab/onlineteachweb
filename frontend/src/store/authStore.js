import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const { data } = await api.post('/auth/login', { email, password })
          
          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          })
          
          // Set default auth header
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          return data
        } catch (error) {
          throw error.response?.data || error
        }
      },

      register: async (userData) => {
        try {
          const { data } = await api.post('/auth/register', userData)
          
          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          })
          
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          return data
        } catch (error) {
          throw error.response?.data || error
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get()
          await api.post('/auth/logout', { refreshToken })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          })
          delete api.defaults.headers.common['Authorization']
        }
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get()
          const { data } = await api.post('/auth/refresh', { refreshToken })
          
          set({ token: data.token })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          return data.token
        } catch (error) {
          get().logout()
          throw error
        }
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Initialize auth header on app load
const { token } = useAuthStore.getState()
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
