import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { User, Mail, Lock, GraduationCap, Check } from 'lucide-react'
import SEOHead from '../../components/SEO/SEOHead'

const STUDENT_GRADES = Array.from({ length: 7 }, (_, index) => index + 4)

export default function Signup() {
  const seoData = {
    title: 'Sign Up - MeritAI',
    description: 'Create your MeritAI account to start your personalized online learning journey.',
    noindex: true,
    nofollow: true
  };

  const navigate = useNavigate()
  const { register } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('role') === 'tutor') {
      // Redirect tutor signups to the tutor information page
      navigate('/for-tutors')
    }
  }, [location.search, navigate])

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    grade: '',
    subjects: [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setLoading(true)

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }

      if (formData.role === 'student' && formData.grade) {
        userData.grade = parseInt(formData.grade)
      }

      if (formData.role === 'tutor' && formData.subjects.length > 0) {
        userData.subjects = formData.subjects
      }

      await register(userData)
      
      // Handle different flows based on role
      if (formData.role === 'tutor') {
        // Show success message for tutor registration
        navigate('/signup-success', { 
          state: { 
            role: 'tutor',
            message: 'Your tutor application has been submitted successfully! Your account is currently under review by our administrators. You will receive an email notification once your application is approved, after which you can log in to start teaching.'
          }
        })
      } else {
        // Redirect students to dashboard
        navigate('/student')
      }
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEOHead {...seoData} />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
            <p className="mt-2 text-gray-600">Join our learning community and discover your learning gaps with AI</p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left: Signup Form */}
          <div className="card">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
               {/* Name & Email - Row 1 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                   <input
                     type="text"
                     required
                     className="input-field"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                   <input
                     type="email"
                     required
                     className="input-field"
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                   />
                 </div>
               </div>

               {/* Password + Confirm Password - Row 2 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                   <input
                     type="password"
                     required
                     minLength={6}
                     className="input-field"
                     value={formData.password}
                     onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                   <input
                     type="password"
                     required
                     className="input-field"
                     value={formData.confirmPassword}
                     onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                   />
                 </div>
               </div>

               {/* Grade for Students */}
               {formData.role === 'student' && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                   <select
                     required
                     className="input-field"
                     value={formData.grade}
                     onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                   >
                     <option value="">Select Grade</option>
                     {STUDENT_GRADES.map(grade => (
                       <option key={grade} value={grade}>Grade {grade}</option>
                     ))}
                   </select>
                 </div>
               )}

               <button
                 type="submit"
                 disabled={loading}
                 className="w-full btn-primary disabled:opacity-50"
               >
                 {loading ? 'Creating account...' : 'Create Account'}
               </button>
             </form>
 
             <div className="mt-6 text-center">
               <p className="text-sm text-gray-600">
                 Already have an account?{' '}
                 <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                   Sign in
                 </Link>
               </p>
             </div>
           </div>

          {/* Right: Benefits / Info Panel */}
          <aside className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
            <h3 className="text-2xl font-bold mb-4">Why join MeritAI?</h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">AI-Powered Assessments</div>
                  <div className="text-sm text-gray-600">Understand precise concept-level gaps with intelligent quizzes.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Personalized Study Paths</div>
                  <div className="text-sm text-gray-600">Receive tailored resources and practice based on your needs.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Personalized Learning & Progress Tracking</div>
                  <div className="text-sm text-gray-600">Follow a tailored learning plan and track measurable improvement.</div>
                </div>
              </li>
            </ul>

            <div className="mt-6">
              <Link to="/pricing" className="btn-outline w-full inline-flex items-center justify-center">
                View Plans
              </Link>
            </div>
          </aside>
         </div>
       </div>
     </div>
     </>
   )
 }
