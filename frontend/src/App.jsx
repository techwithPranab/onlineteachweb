import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useAuthStore } from './store/authStore'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import Login from './pages/public/Login'
import Signup from './pages/public/Signup'
import SignupSuccess from './pages/public/SignupSuccess'
import PricingPage from './pages/public/PricingPage'
import Courses from './pages/public/Courses'
import CourseList from './pages/public/CourseList'
import ForStudents from './pages/public/ForStudents'
import ForTutors from './pages/public/ForTutors'
import HelpCenter from './pages/public/HelpCenter'
import ContactUs from './pages/public/ContactUs'
import FAQs from './pages/public/FAQs'
import PrivacyPolicy from './pages/public/PrivacyPolicy'
import TermsOfService from './pages/public/TermsOfService'
import CourseDetails from './pages/public/CourseDetails'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import CourseListing from './pages/student/CourseListing'
import CourseDetail from './pages/student/CourseDetail'
import LiveClassRoom from './pages/student/LiveClassRoom'
import ProgressReports from './pages/student/ProgressReports'
import SubscriptionManagement from './pages/student/SubscriptionManagement'
import SessionDetail from './pages/student/SessionDetail'
import UpcomingSessions from './pages/student/UpcomingSessions'
import QuizListing from './pages/student/QuizListing'
import QuizAttempt from './pages/student/QuizAttempt'
import QuizResults from './pages/student/QuizResults'

// Tutor Pages
import TutorDashboard from './pages/tutor/TutorDashboard'
import ScheduleManagement from './pages/tutor/ScheduleManagement'
import SessionCreation from './pages/tutor/SessionCreation'
import UploadMaterials from './pages/tutor/UploadMaterials'
import StudentEvaluation from './pages/tutor/StudentEvaluation'
import QuizManagement from './pages/tutor/QuizManagement'
import QuizCreate from './pages/tutor/QuizCreate'
import QuizPreview from './pages/tutor/QuizPreview'
import QuestionBank from './pages/tutor/QuestionBank'
import ManualEvaluation from './pages/tutor/ManualEvaluation'
import QuizAnalytics from './pages/tutor/QuizAnalytics'
import AIQuestionGenerator from './pages/tutor/AIQuestionGenerator'
import AIQuestionReview from './pages/tutor/AIQuestionReview'
import QuestionImportExport from './pages/tutor/QuestionImportExport'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import TutorApproval from './pages/admin/TutorApproval'
import AdminCourseManagement from './pages/admin/AdminCourseManagement'
import AdminCourseCreation from './pages/admin/AdminCourseCreation'
import AdminCourseEdit from './pages/admin/AdminCourseEdit'
import AdminCourseView from './pages/admin/AdminCourseView'
import RevenueAnalytics from './pages/admin/RevenueAnalytics'
import PaymentManagement from './pages/admin/PaymentManagement'
import SessionManagement from './pages/admin/SessionManagement'
import AdminSubscriptionManagement from './pages/admin/SubscriptionManagement'
import AdminAIQuestionsDashboard from './pages/admin/AIQuestionsDashboard'

// Shared
import ProfileSettings from './pages/shared/ProfileSettings'
import NotificationsPage from './pages/shared/NotificationsPage'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient()

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup-success" element={<SignupSuccess />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:grade/:subject" element={<CourseList />} />
            <Route path="/course/:id" element={<CourseDetails />} />
            <Route path="/for-students" element={<ForStudents />} />
            <Route path="/for-tutors" element={<ForTutors />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Route>

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="courses" element={<CourseListing />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="sessions" element={<UpcomingSessions />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            <Route path="session/:id" element={<LiveClassRoom />} />
            <Route path="progress" element={<ProgressReports />} />
            <Route path="subscription" element={<SubscriptionManagement />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="notifications" element={<NotificationsPage />} />
            {/* Quiz Routes */}
            <Route path="quizzes" element={<QuizListing />} />
            <Route path="quiz/:quizId/attempt" element={<QuizAttempt />} />
            <Route path="quiz/:sessionId/results" element={<QuizResults />} />
          </Route>

          {/* Tutor Routes */}
          <Route
            path="/tutor"
            element={
              <ProtectedRoute allowedRoles={['tutor']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TutorDashboard />} />
            <Route path="schedule" element={<ScheduleManagement />} />
            <Route path="sessions/new" element={<SessionCreation />} />
            <Route path="materials" element={<UploadMaterials />} />
            <Route path="evaluation" element={<StudentEvaluation />} />
            <Route path="session/:id" element={<LiveClassRoom />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="notifications" element={<NotificationsPage />} />
            {/* Quiz Routes */}
            <Route path="quizzes" element={<QuizManagement />} />
            <Route path="quizzes/new" element={<QuizCreate />} />
            <Route path="quizzes/:quizId/edit" element={<QuizCreate />} />
            <Route path="quizzes/:quizId/preview" element={<QuizPreview />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="ai-questions" element={<AIQuestionReview />} />
            <Route path="ai-questions/generate" element={<AIQuestionGenerator />} />
            <Route path="ai-questions/review" element={<AIQuestionReview />} />
            <Route path="questions/import-export" element={<QuestionImportExport />} />
            <Route path="evaluate" element={<ManualEvaluation />} />
            <Route path="evaluate/:sessionId" element={<ManualEvaluation />} />
            <Route path="analytics" element={<QuizAnalytics />} />
            <Route path="analytics/:quizId" element={<QuizAnalytics />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="tutors/approval" element={<TutorApproval />} />
            <Route path="courses" element={<AdminCourseManagement />} />
            <Route path="courses/new" element={<AdminCourseCreation />} />
            <Route path="courses/:id/view" element={<AdminCourseView />} />
            <Route path="courses/:id/edit" element={<AdminCourseEdit />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="sessions" element={<SessionManagement />} />
            <Route path="subscriptions" element={<AdminSubscriptionManagement />} />
            <Route path="analytics" element={<RevenueAnalytics />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="notifications" element={<NotificationsPage />} />
            {/* Quiz Routes - Admin can also manage */}
            <Route path="quizzes" element={<QuizManagement />} />
            <Route path="quizzes/new" element={<QuizCreate />} />
            <Route path="quizzes/:quizId/edit" element={<QuizCreate />} />
            <Route path="quizzes/:quizId/preview" element={<QuizPreview />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="ai-questions" element={<AdminAIQuestionsDashboard />} />
            <Route path="ai-questions/generate" element={<AIQuestionGenerator />} />
            <Route path="ai-questions/review" element={<AIQuestionReview />} />
            <Route path="quiz-analytics" element={<QuizAnalytics />} />
            <Route path="quiz-analytics/:quizId" element={<QuizAnalytics />} />
            <Route path="evaluate" element={<ManualEvaluation />} />
            <Route path="evaluate/:sessionId" element={<ManualEvaluation />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
