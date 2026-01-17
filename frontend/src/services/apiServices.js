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

  getGrades: async () => {
    const { data } = await api.get('/courses/grades')
    return data
  },

  getSubjects: async () => {
    const { data } = await api.get('/courses/subjects')
    return data
  },

  getSubjectsByGrade: async (grade) => {
    const { data } = await api.get(`/courses/grades/${grade}/subjects`)
    return data
  },

  getCoursesByGradeAndSubject: async (grade, subject) => {
    const { data } = await api.get(`/courses/grades/${grade}/subjects/${subject}/courses`)
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
    console.log('Session data:', data);
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

  startSession: async (id) => {
    const { data } = await api.post(`/live/start`, { sessionId: id })
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

// =====================
// QUIZ & QUESTION SERVICES
// =====================

export const questionService = {
  // Create a new question
  createQuestion: async (questionData) => {
    const { data } = await api.post('/questions', questionData)
    return data
  },

  // Create multiple questions
  createBulkQuestions: async (questions) => {
    const { data } = await api.post('/questions/bulk', { questions })
    return data
  },

  // Get questions with filters
  getQuestions: async (params = {}) => {
    const { data } = await api.get('/questions', { params })
    return data
  },

  // Get a single question
  getQuestionById: async (id) => {
    const { data } = await api.get(`/questions/${id}`)
    return data
  },

  // Update a question
  updateQuestion: async (id, questionData) => {
    const { data } = await api.put(`/questions/${id}`, questionData)
    return data
  },

  // Delete a question
  deleteQuestion: async (id) => {
    const { data } = await api.delete(`/questions/${id}`)
    return data
  },

  // Get topics for a course
  getTopicsForCourse: async (courseId) => {
    const { data } = await api.get(`/questions/topics/${courseId}`)
    return data
  },

  // Get question statistics
  getQuestionStats: async (courseId) => {
    const { data } = await api.get(`/questions/stats/${courseId}`)
    return data
  },

  // Get course structure (chapters and topics)
  getCourseStructure: async (courseId) => {
    const { data } = await api.get(`/questions/course/${courseId}/structure`)
    return data
  },

  // AI Generation APIs
  generateQuestionsWithAI: async (generationParams) => {
    const { data } = await api.post('/questions/generate', generationParams)
    return data
  },

  // Get generation history
  getGenerationHistory: async (params = {}) => {
    const { data } = await api.get('/questions/generate/history', { params })
    return data
  },

  // Get generation by ID
  getGenerationById: async (id) => {
    const { data } = await api.get(`/questions/generate/${id}`)
    return data
  },
}

export const quizService = {
  // Create a new quiz
  createQuiz: async (quizData) => {
    const { data } = await api.post('/quizzes', quizData)
    return data
  },

  // Get all quizzes (for tutor/admin)
  getQuizzes: async (params = {}) => {
    const { data } = await api.get('/quizzes', { params })
    return data
  },

  // Get available quizzes for a course (student)
  getAvailableQuizzes: async (courseId) => {
    const { data } = await api.get(`/quizzes/course/${courseId}/available`)
    return data
  },

  // Get quiz by ID
  getQuizById: async (id) => {
    const { data } = await api.get(`/quizzes/${id}`)
    return data
  },

  // Update quiz
  updateQuiz: async (id, quizData) => {
    const { data } = await api.put(`/quizzes/${id}`, quizData)
    return data
  },

  // Delete quiz
  deleteQuiz: async (id) => {
    const { data } = await api.delete(`/quizzes/${id}`)
    return data
  },

  // Publish quiz
  publishQuiz: async (id) => {
    const { data } = await api.post(`/quizzes/${id}/publish`)
    return data
  },

  // Get quiz attempts (tutor/admin)
  getQuizAttempts: async (quizId, params = {}) => {
    const { data } = await api.get(`/quizzes/${quizId}/attempts`, { params })
    return data
  },

  // Start a quiz (student)
  startQuiz: async (quizId, strategyName = null) => {
    const { data } = await api.post(`/quizzes/${quizId}/start`, { strategyName })
    return data
  },

  // Save answer
  saveAnswer: async (sessionId, questionId, answer, timeSpent = 0) => {
    const { data } = await api.post(`/quizzes/sessions/${sessionId}/answer`, {
      questionId,
      answer,
      timeSpent
    })
    return data
  },

  // Mark question for review
  markForReview: async (sessionId, questionId, marked) => {
    const { data } = await api.post(`/quizzes/sessions/${sessionId}/mark-review`, {
      questionId,
      marked
    })
    return data
  },

  // Submit quiz
  submitQuiz: async (quizId, sessionId, answers = []) => {
    const { data } = await api.post(`/quizzes/${quizId}/submit`, {
      sessionId,
      answers
    })
    return data
  },

  // Get quiz result
  getQuizResult: async (quizId, sessionId = null) => {
    const params = sessionId ? { sessionId } : {}
    const { data } = await api.get(`/quizzes/${quizId}/result`, { params })
    return data
  },

  // Get session details (tutor/admin)
  getSessionDetails: async (sessionId) => {
    const { data } = await api.get(`/quizzes/sessions/${sessionId}`)
    return data
  },
}

export const quizEvaluationService = {
  // Get pending evaluations
  getPendingEvaluations: async (params = {}) => {
    const { data } = await api.get('/quiz-evaluations/pending', { params })
    return data
  },

  // Get session for manual evaluation
  getSessionForEvaluation: async (sessionId) => {
    const { data } = await api.get(`/quiz-evaluations/session/${sessionId}`)
    return data
  },

  // Submit manual evaluation (single question)
  submitSingleEvaluation: async (sessionId, questionId, marksAwarded, feedback = '') => {
    const { data } = await api.post('/quiz-evaluations/manual', {
      sessionId,
      questionId,
      marksAwarded,
      feedback
    })
    return data
  },

  // Submit manual evaluation (bulk - used by ManualEvaluation.jsx)
  submitManualEvaluation: async (sessionId, evaluationPayload) => {
    const { data } = await api.post('/quiz-evaluations/manual/bulk', {
      sessionId,
      evaluations: evaluationPayload.evaluations,
      overallFeedback: evaluationPayload.overallFeedback
    })
    return data
  },

  // Submit bulk evaluations
  submitBulkEvaluations: async (sessionId, evaluations) => {
    const { data } = await api.post('/quiz-evaluations/manual/bulk', {
      sessionId,
      evaluations
    })
    return data
  },

  // Override score
  overrideScore: async (sessionId, questionId, newMarks, reason) => {
    const { data } = await api.post('/quiz-evaluations/override', {
      sessionId,
      questionId,
      newMarks,
      reason
    })
    return data
  },

  // Get student analytics
  getStudentAnalytics: async (studentId, courseId = null) => {
    const params = courseId ? { courseId } : {}
    const { data } = await api.get(`/quiz-evaluations/analytics/student/${studentId}`, { params })
    return data
  },

  // Get quiz analytics
  getQuizAnalytics: async (quizId) => {
    const { data } = await api.get(`/quiz-evaluations/analytics/quiz/${quizId}`)
    return data
  },

  // Publish evaluation
  publishEvaluation: async (evaluationId) => {
    const { data } = await api.post(`/quiz-evaluations/${evaluationId}/publish`)
    return data
  },
}
