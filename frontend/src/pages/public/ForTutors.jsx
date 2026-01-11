import { Link } from 'react-router-dom'
import { DollarSign, Users, Calendar, TrendingUp, Star, Globe, CheckCircle, ArrowRight, BarChart } from 'lucide-react'

export default function ForTutors() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Share Your Expertise, Earn Money
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Join our platform and connect with students eager to learn from you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center justify-center space-x-2"
              >
                <span>Become a Tutor</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/pricing"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition"
              >
                View Earning Potential
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Teach With Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Tutors Choose Our Platform
            </h2>
            <p className="text-xl text-gray-600">
              The best tools and support to grow your tutoring business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BenefitCard
              icon={<DollarSign className="h-12 w-12 text-green-600" />}
              title="Competitive Earnings"
              description="Set your own rates and earn up to 80% of your course revenue. Weekly payouts available."
            />
            <BenefitCard
              icon={<Users className="h-12 w-12 text-blue-600" />}
              title="Growing Student Base"
              description="Access thousands of students actively seeking tutors across all subjects and levels."
            />
            <BenefitCard
              icon={<Calendar className="h-12 w-12 text-purple-600" />}
              title="Flexible Schedule"
              description="Create your own schedule. Teach when you want, where you want, at your own pace."
            />
            <BenefitCard
              icon={<Globe className="h-12 w-12 text-orange-600" />}
              title="Teach From Anywhere"
              description="100% online platform. Teach from home or anywhere with an internet connection."
            />
            <BenefitCard
              icon={<BarChart className="h-12 w-12 text-red-600" />}
              title="Performance Analytics"
              description="Track your earnings, student engagement, and course performance with detailed reports."
            />
            <BenefitCard
              icon={<Star className="h-12 w-12 text-yellow-600" />}
              title="Build Your Reputation"
              description="Get reviewed by students and build a strong profile to attract more learners."
            />
          </div>
        </div>
      </section>

      {/* Earning Potential */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Average Tutor Earnings</h3>
              <div className="space-y-6">
                <EarningTier
                  level="Beginner Tutor"
                  amount="$500 - $1,500"
                  period="per month"
                  description="5-10 students, part-time schedule"
                />
                <EarningTier
                  level="Experienced Tutor"
                  amount="$2,000 - $4,000"
                  period="per month"
                  description="15-30 students, consistent schedule"
                />
                <EarningTier
                  level="Top Rated Tutor"
                  amount="$5,000+"
                  period="per month"
                  description="40+ students, full-time commitment"
                />
              </div>
              <p className="mt-6 text-sm text-gray-600">
                * Earnings vary based on subjects, rates, and hours taught. You keep 80% of revenue.
              </p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Your Success is Our Priority
              </h2>
              <div className="space-y-4">
                <FeatureItem text="No upfront costs - completely free to join" />
                <FeatureItem text="Quick approval process - start teaching in days" />
                <FeatureItem text="Comprehensive tutor dashboard and tools" />
                <FeatureItem text="Upload unlimited course materials" />
                <FeatureItem text="Automated scheduling and reminders" />
                <FeatureItem text="Student evaluation and grading system" />
                <FeatureItem text="Secure payment processing" />
                <FeatureItem text="Dedicated tutor support team" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Getting Started is Simple
            </h2>
            <p className="text-xl text-gray-600">
              From application to your first class in 4 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard
              number="1"
              title="Apply Online"
              description="Complete your tutor profile with qualifications, expertise, and experience."
            />
            <StepCard
              number="2"
              title="Get Approved"
              description="Our team reviews your application. Most tutors are approved within 48 hours."
            />
            <StepCard
              number="3"
              title="Create Courses"
              description="Set up your courses, upload materials, define pricing, and set your schedule."
            />
            <StepCard
              number="4"
              title="Start Teaching"
              description="Students enroll, you teach live classes, and earn money doing what you love."
            />
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Requirements to Become a Tutor
            </h2>
            <p className="text-xl text-gray-600">
              We maintain high standards to ensure quality education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RequirementCard
              title="Educational Qualification"
              items={[
                "Bachelor's degree or higher in relevant subject",
                "Professional certifications (if applicable)",
                "Academic transcripts"
              ]}
            />
            <RequirementCard
              title="Teaching Experience"
              items={[
                "Minimum 1 year of teaching/tutoring experience",
                "Demonstrated subject matter expertise",
                "References from previous students/institutions"
              ]}
            />
            <RequirementCard
              title="Technical Requirements"
              items={[
                "Reliable internet connection (5+ Mbps)",
                "Computer with webcam and microphone",
                "Quiet teaching environment"
              ]}
            />
            <RequirementCard
              title="Soft Skills"
              items={[
                "Excellent communication skills",
                "Patience and passion for teaching",
                "Commitment to student success"
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Tutoring Journey?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Join hundreds of tutors already earning and making an impact
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
          >
            <span>Apply Now</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-purple-200">Free to join • Fast approval • Start earning this week</p>
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
      <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
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

function EarningTier({ level, amount, period, description }) {
  return (
    <div className="bg-white rounded-lg p-6 border-l-4 border-purple-600">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-900">{level}</h4>
        <Star className="h-5 w-5 text-yellow-500" />
      </div>
      <div className="text-3xl font-bold text-purple-600 mb-1">{amount}</div>
      <div className="text-sm text-gray-600 mb-3">{period}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </div>
  )
}

function RequirementCard({ title, items }) {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
