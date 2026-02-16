import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizService, userService } from '@/services/apiServices'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import SEOHead from '@/components/SEO/SEOHead'
import { UserCheck, UserX, Plus, Trash2, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'

export default function QuizAssignment() {
  const { id: quizId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [quizId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch quiz details
      const quizResponse = await quizService.getQuizById(quizId)
      setQuiz(quizResponse.quiz)
      
      // Fetch all students
      const studentsResponse = await userService.getUsers({ role: 'student' })
      setStudents(studentsResponse.users || [])
      
      // Fetch existing assignments
      await fetchAssignments()
      
      setError(null)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.response?.data?.message || 'Failed to load quiz assignment data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}/assignments`)
      setAssignments(response.data.assignments || [])
    } catch (err) {
      console.error('Failed to load assignments:', err)
    }
  }

  const handleAssignQuiz = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      await api.post(
        `/quizzes/${quizId}/assign`,
        {
          studentIds: selectedStudents,
          dueDate: dueDate || null
        }
      )
      
      setSuccess(`Quiz assigned to ${selectedStudents.length} student(s)`)
      setSelectedStudents([])
      setDueDate('')
      
      // Refresh assignments
      await fetchAssignments()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to assign quiz:', err)
      setError(err.response?.data?.message || 'Failed to assign quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return
    }

    try {
      await api.delete(`/quizzes/${quizId}/assignments/${assignmentId}`)
      
      setSuccess('Assignment removed successfully')
      await fetchAssignments()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to remove assignment:', err)
      setError(err.response?.data?.message || 'Failed to remove assignment')
    }
  }

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const selectAllStudents = () => {
    setSelectedStudents(students.map(s => s._id))
  }

  const deselectAllStudents = () => {
    setSelectedStudents([])
  }

  // Get already assigned student IDs
  const assignedStudentIds = assignments.flatMap(assignment => 
    assignment.students.map(s => s.studentId)
  )

  // Filter out already assigned students
  const availableStudents = students.filter(s => !assignedStudentIds.includes(s._id))

  if (loading) return <LoadingSpinner fullScreen />
  if (error && !quiz) return <ErrorMessage message={error} />

  return (
    <>
      <SEOHead title={`Assign Quiz - ${quiz?.title}`} noIndex noFollow />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Quizzes
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Assign Quiz: {quiz?.title}
            </h1>
            <p className="text-gray-600 mt-2">
              Select students to assign this quiz to
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <CheckCircle className="w-5 h-5 inline mr-2" />
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <XCircle className="w-5 h-5 inline mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Student Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Select Students</h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllStudents}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={deselectAllStudents}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedStudents.length}</strong> student(s) selected
                </p>
              </div>

              {/* Student List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No available students. All students have been assigned this quiz.
                  </p>
                ) : (
                  availableStudents.map(student => (
                    <label
                      key={student._id}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedStudents.includes(student._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => toggleStudentSelection(student._id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Assign Button */}
              <button
                onClick={handleAssignQuiz}
                disabled={selectedStudents.length === 0 || submitting}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {submitting ? 'Assigning...' : `Assign to ${selectedStudents.length} Student(s)`}
              </button>
            </div>

            {/* Right: Current Assignments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Current Assignments</h2>
              
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No students assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map(assignment => (
                    <div key={assignment.assignmentId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">
                            {assignment.totalStudents} Students
                          </span>
                          <span className="text-sm text-gray-500">
                            ({assignment.completedCount} completed)
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(assignment.assignmentId)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Student Details */}
                      <div className="space-y-2">
                        {assignment.students.map(student => (
                          <div
                            key={student.studentId}
                            className={`flex items-center justify-between p-2 rounded ${
                              student.completed ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {student.studentName}
                              </p>
                              <p className="text-xs text-gray-500">{student.studentEmail}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {student.completed ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">
                                    {student.percentage?.toFixed(0)}%
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-yellow-600" />
                                  <span className="text-xs text-yellow-600">Pending</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quiz Stats */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz?.questionConfig?.totalQuestions || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-gray-900">{quiz?.duration} min</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.reduce((sum, a) => sum + a.totalStudents, 0)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {assignments.reduce((sum, a) => sum + a.completedCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
