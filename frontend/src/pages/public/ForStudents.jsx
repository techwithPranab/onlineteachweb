import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Video, Award, TrendingUp, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react'
import SEOHead from '../../components/SEO/SEOHead'
import Breadcrumb from '../../components/common/Breadcrumb'

export default function ForStudents() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const seoData = {
    title: 'For Students - AI-Powered Learning Platform',
    description: 'Master concepts with AI-driven gap analysis, personalized quizzes, and expert mentorship. Track your progress and achieve academic excellence with MeritAI.',
    keywords: 'online learning for students, personalized learning, AI quizzes, exam preparation, CBSE study, ICSE study, student dashboard, progress tracking'
  };

  const breadcrumbItems = [
    { label: 'For Students', path: '/for-students' }
  ];

  return (
    <>
      <SEOHead {...seoData} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        
        {/* Hero Section (MeritAI primary theme) */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Master Your Subjects Through Quiz-Based Evaluation
            </h1>
            <p className="text-lg md:text-xl mb-8 text-primary-100">
              Take personalized quizzes, track your progress, and achieve academic excellence with AI-powered learning
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center justify-center space-x-2"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/pricing"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition"
              >
                View Pricing Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Students Excel with Our Quiz-Based Learning
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive evaluation system designed to maximize your learning potential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BenefitCard
              icon={<Award className="h-12 w-12 text-primary-600" />}
              title="Adaptive Quizzes"
              description="AI-powered quizzes that adjust difficulty based on your performance and learning pace."
            />
            <BenefitCard
              icon={<TrendingUp className="h-12 w-12 text-primary-600" />}
              title="Performance Analytics"
              description="Detailed insights into your strengths, weaknesses, and progress across all subjects."
            />
            <BenefitCard
              icon={<BookOpen className="h-12 w-12 text-primary-600" />}
              title="Comprehensive Question Bank"
              description="Thousands of questions covering all grades, subjects, and difficulty levels."
            />
            <BenefitCard
              icon={<CheckCircle className="h-12 w-12 text-primary-600" />}
              title="Instant Feedback"
              description="Get immediate results and explanations for every question to reinforce learning."
            />
            <BenefitCard
              icon={<Clock className="h-12 w-12 text-primary-600" />}
              title="Flexible Practice"
              description="Take quizzes anytime, anywhere with customizable time limits and question counts."
            />
            <BenefitCard
              icon={<Users className="h-12 w-12 text-primary-600" />}
              title="Expert Tutor Support"
              description="Connect with qualified tutors for personalized guidance and doubt clearing."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Quiz-Based Evaluation Works
            </h2>
            <p className="text-lg text-gray-600">
              Master subjects through intelligent assessment and personalized learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Take Adaptive Quizzes"
              description="Start with AI-powered quizzes that assess your current knowledge level and adapt to your learning needs."
            />
            <StepCard
              number="2"
              title="Get Instant Results"
              description="Receive immediate feedback, detailed explanations, and performance analytics for every quiz attempt."
            />
            <StepCard
              number="3"
              title="Track & Improve"
              description="Monitor your progress, identify weak areas, and focus on targeted practice to achieve mastery."
            />
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Comprehensive Quiz-Based Learning System
              </h2>
              <div className="space-y-4">
                <FeatureItem text="AI-powered adaptive quizzes that adjust to your skill level" />
                <FeatureItem text="Extensive question bank covering all grades and subjects" />
                <FeatureItem text="Instant feedback and detailed explanations for every question" />
                <FeatureItem text="Performance analytics and progress tracking" />
                <FeatureItem text="Weak topic identification and targeted practice recommendations" />
                <FeatureItem text="Custom quiz creation with flexible parameters" />
                <FeatureItem text="Mobile-friendly platform for learning on-the-go" />
                <FeatureItem text="Expert tutor support for doubt clearing and guidance" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 text-center">
              <div className="text-6xl font-bold text-primary-600 mb-4">🎯</div>
              <p className="text-xl text-gray-700 mb-2">Quiz-Based Mastery</p>
              <p className="text-gray-600">Learn through intelligent evaluation and achieve academic excellence</p>
              <div className="mt-8 text-left">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Evaluation Features:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary-600" />
                    Adaptive difficulty adjustment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary-600" />
                    Real-time performance tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary-600" />
                    Comprehensive progress reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary-600" />
                    Personalized learning paths
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Master Subjects Through Quiz-Based Evaluation?</h2>
          <p className="text-lg mb-8 text-primary-100">
            Join thousands of students achieving academic excellence with our intelligent evaluation system
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
          >
            <span>Start Your Quiz Journey</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-blue-200">No credit card required • Start evaluating your knowledge today</p>
        </div>
      </section>
      </div>
    </>
  )
}

function BenefitCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function FeatureItem({ text }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
      <span className="text-gray-700">{text}</span>
    </div>
  )
}
