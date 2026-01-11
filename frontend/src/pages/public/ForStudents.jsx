import { Link } from 'react-router-dom'
import { BookOpen, Video, Award, TrendingUp, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react'

export default function ForStudents() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Learn Smarter, Not Harder
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Connect with expert tutors and accelerate your learning journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center justify-center space-x-2"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/pricing"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Students Love Our Platform
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to excel in your studies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BenefitCard
              icon={<Users className="h-12 w-12 text-blue-600" />}
              title="Expert Tutors"
              description="Learn from qualified and experienced tutors across all subjects and grade levels."
            />
            <BenefitCard
              icon={<Video className="h-12 w-12 text-green-600" />}
              title="Live Interactive Classes"
              description="Join real-time video sessions with screen sharing, whiteboard, and chat features."
            />
            <BenefitCard
              icon={<BookOpen className="h-12 w-12 text-purple-600" />}
              title="Comprehensive Materials"
              description="Access PDFs, videos, presentations, and study materials anytime, anywhere."
            />
            <BenefitCard
              icon={<TrendingUp className="h-12 w-12 text-orange-600" />}
              title="Track Your Progress"
              description="Monitor your learning journey with detailed reports and performance analytics."
            />
            <BenefitCard
              icon={<Clock className="h-12 w-12 text-red-600" />}
              title="Flexible Scheduling"
              description="Book sessions at times that work for you. Study at your own pace."
            />
            <BenefitCard
              icon={<Award className="h-12 w-12 text-yellow-600" />}
              title="Achievements & Badges"
              description="Earn recognition for your progress and stay motivated to reach your goals."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create Your Account"
              description="Sign up for free and complete your student profile with your grade level and subjects of interest."
            />
            <StepCard
              number="2"
              title="Browse & Enroll"
              description="Explore courses, check tutor profiles and ratings, then enroll in courses that match your needs."
            />
            <StepCard
              number="3"
              title="Start Learning"
              description="Join live classes, access materials, complete assignments, and track your progress."
            />
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Everything You Need to Succeed
              </h2>
              <div className="space-y-4">
                <FeatureItem text="Access to thousands of courses across all subjects" />
                <FeatureItem text="Live video classes with interactive whiteboard" />
                <FeatureItem text="Downloadable study materials and resources" />
                <FeatureItem text="Real-time chat with tutors and classmates" />
                <FeatureItem text="Progress tracking and performance reports" />
                <FeatureItem text="Regular evaluations and personalized feedback" />
                <FeatureItem text="Mobile-friendly platform - learn anywhere" />
                <FeatureItem text="24/7 support to help you succeed" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">10,000+</div>
              <p className="text-xl text-gray-700 mb-2">Active Students</p>
              <p className="text-gray-600">Join thousands of students already learning with us</p>
              <div className="mt-8 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-purple-600">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">500+</div>
                  <div className="text-sm text-gray-600">Expert Tutors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students already learning with expert tutors
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-blue-200">No credit card required • Start learning in minutes</p>
        </div>
      </section>
    </div>
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
      <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
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
      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
      <span className="text-gray-700">{text}</span>
    </div>
  )
}
