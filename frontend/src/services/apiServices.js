import api from './api'

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },

  logout: async (refreshToken) => {
    const { data } = await api.post('/auth/logout', { refreshToken })
    return data
  },

  refreshToken: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', { refreshToken })
    return data
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/users/me')
    return data
  },
}

export const courseService = {
  getCourses: async (params = {}) => {
    const { data } = await api.get('/courses', { params })
    console.log('Courses data:', data);
    return data
  },

  getPublicCourses: async (params = {}) => {
    const { data } = await api.get('/courses/public', { params })
    console.log('Public courses data:', data);
    return data.courses || data
  },

  getCourseById: async (id) => {
    const { data } = await api.get(`/courses/${id}`)
    console.log('Course data:', data);
    return data
  },

  createCourse: async (courseData) => {
    const { data } = await api.post('/courses', courseData)
    return data
  },

  updateCourse: async (id, courseData) => {
    const { data } = await api.put(`/courses/${id}`, courseData)
    return data
  },

  deleteCourse: async (id) => {
    const { data } = await api.delete(`/courses/${id}`)
    return data
  },

  submitReview: async (courseId, reviewData) => {
    const { data } = await api.post(`/courses/${courseId}/review`, reviewData)
    return data
  },

  getCourseStudents: async (courseId) => {
    const { data } = await api.get(`/courses/${courseId}/students`)
    return data
  },
}

export const sessionService = {
  getSessions: async (params = {}) => {
    const { data } = await api.get('/sessions', { params })
    console.log('Sessions data:', data);
    return data
  },

  getAllSessions: async (params = {}) => {
    const { data } = await api.get('/admin/sessions', { params })
    return data
  },

  getSessionStats: async () => {
    const { data } = await api.get('/admin/sessions/stats')
    return data
  },

  getSessionById: async (id) => {
    const { data } = await api.get(`/sessions/${id}`)
    return data
  },

  createSession: async (sessionData) => {
    const { data } = await api.post('/sessions', sessionData)
    return data
  },

  updateSession: async (id, sessionData) => {
    const { data } = await api.put(`/sessions/${id}`, sessionData)
    return data
  },

  deleteSession: async (id) => {
    const { data } = await api.delete(`/sessions/${id}`)
    return data
  },

  endSession: async (id) => {
    const { data } = await api.post(`/live/end`, { sessionId: id })
    return data
  },

  approveSession: async (id) => {
    const { data } = await api.put(`/sessions/${id}/approve`)
    return data
  },

  rejectSession: async (id, reason) => {
    const { data } = await api.put(`/sessions/${id}/reject`, { reason })
    return data
  },

  getPendingSessions: async (params = {}) => {
    const { data } = await api.get('/sessions/pending', { params })
    return data
  },

  cancelSession: async (id, reason) => {
    const { data } = await api.put(`/sessions/${id}/cancel`, { reason })
    return data
  },

  reassignSession: async (id, newTutorId) => {
    const { data } = await api.put(`/sessions/${id}/reassign`, { newTutorId })
    return data
  },

  enrollInSession: async (id) => {
    const { data } = await api.post(`/sessions/${id}/enroll`)
    return data
  },
}

export const materialService = {
  getMaterialsByCourse: async (courseId, params = {}) => {
    const { data } = await api.get(`/materials/${courseId}`, { params })
    return data
  },

  getMaterials: async (params = {}) => {
    const { data } = await api.get('/materials', { params })
    return data
  },

  getRecentMaterials: async (params = {}) => {
    const { data } = await api.get('/materials/student/recent', { params })
    return data
  },

  uploadMaterial: async (materialData) => {
    const { data } = await api.post('/materials', materialData)
    return data
  },

  updateMaterial: async (id, materialData) => {
    const { data } = await api.put(`/materials/${id}`, materialData)
    return data
  },

  deleteMaterial: async (id) => {
    const { data } = await api.delete(`/materials/${id}`)
    return data
  },
}

export const evaluationService = {
  createEvaluation: async (evaluationData) => {
    const { data } = await api.post('/evaluations', evaluationData)
    return data
  },

  getStudentEvaluations: async (studentId, params = {}) => {
    const { data } = await api.get(`/evaluations/student/${studentId}`, { params })
    return data
  },

  getSessionEvaluations: async (sessionId) => {
    const { data } = await api.get(`/evaluations/session/${sessionId}`)
    return data
  },
}

export const subscriptionService = {
  checkout: async (planId, paymentMethodId) => {
    const { data } = await api.post('/subscriptions/checkout', {
      planId,
      paymentMethodId,
    })
    return data
  },

  getStatus: async () => {
    const { data } = await api.get('/subscriptions/status')
    return data
  },

  cancel: async (reason) => {
    const { data } = await api.post('/subscriptions/cancel', { reason })
    return data
  },

  getPlans: async () => {
    const { data } = await api.get('/admin/subscription-plans')
    return data
  },

  createPlan: async (planData) => {
    const { data } = await api.post('/admin/subscription-plans', planData)
    return data
  },

  updatePlan: async (id, planData) => {
    const { data } = await api.put(`/admin/subscription-plans/${id}`, planData)
    return data
  },

  deletePlan: async (id) => {
    const { data } = await api.delete(`/admin/subscription-plans/${id}`)
    return data
  },

  getStats: async () => {
    const { data } = await api.get('/admin/subscriptions/stats')
    return data
  },
}

export const paymentService = {
  getPayments: async (params = {}) => {
    const { data } = await api.get('/admin/payments', { params })
    return data
  },

  getPaymentStats: async () => {
    const { data } = await api.get('/admin/payments/stats')
    return data
  },

  processRefund: async (paymentId) => {
    const { data } = await api.post(`/admin/payments/${paymentId}/refund`)
    return data
  },
}

export const reportService = {
  getStudentReport: async (studentId, params = {}) => {
    const { data } = await api.get(`/reports/student/${studentId}`, { params })
    return data
  },

  getTutorReport: async (tutorId, params = {}) => {
    const { data } = await api.get(`/reports/tutor/${tutorId}`, { params })
    return data
  },
}

export const adminService = {
  getUsers: async (params = {}) => {
    const { data } = await api.get('/admin/users', { params })
    return data
  },

  updateUserStatus: async (userId, status, reason) => {
    const { data } = await api.put(`/admin/users/${userId}/status`, {
      status,
      reason,
    })
    return data
  },

  updateUser: async (userId, userData) => {
    const { data } = await api.put(`/admin/users/${userId}`, userData)
    return data
  },

  deleteUser: async (userId) => {
    const { data } = await api.delete(`/admin/users/${userId}`)
    return data
  },

  getPendingTutors: async () => {
    const { data } = await api.get('/admin/tutors/pending')
    return data
  },

  approveTutor: async (tutorId, approved, reason) => {
    const { data } = await api.put(`/admin/tutors/${tutorId}/approve`, {
      approved,
      reason,
    })
    return data
  },

  getAnalytics: async (params = {}) => {
    const { data } = await api.get('/admin/analytics', { params })
    return data
  },

  getAdminCourses: async (params = {}) => {
    const { data } = await api.get('/admin/courses', { params })
    return data
  },

  getCourseStats: async () => {
    const { data } = await api.get('/admin/courses/stats')
    return data
  },
}

export const userService = {
  getUserById: async (id) => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },

  updateUser: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData)
    return data
  },

  getProfile: async () => {
    const { data } = await api.get('/users/me')
    return data
  },

  updateProfile: async (profileData) => {
    const { data } = await api.put('/users/me', profileData)
    return data
  },

  changePassword: async (passwordData) => {
    const { data } = await api.put('/users/me/password', passwordData)
    return data
  },

  updateNotifications: async (notifications) => {
    const { data } = await api.put('/users/me/notifications', { notifications })
    return data
  },

  deleteAccount: async () => {
    const { data } = await api.delete('/users/me')
    return data
  },

  uploadAvatar: async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const { data } = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },
}
