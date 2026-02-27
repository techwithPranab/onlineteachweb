import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowRight, 
  Brain, 
  Target, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award,
  Search,
  BarChart3,
  Route as RouteIcon,
  UserCheck,
  RefreshCw,
  GraduationCap,
  Briefcase,
  BookMarked,
  Trophy,
  Star,
  Rocket,
  CalendarDays,
  Bell
} from 'lucide-react'
import SEOHead from '../../components/SEO/SEOHead'
import { reviewService } from '../../services/apiServices'
import { OrganizationSchema, WebsiteSchema } from '../../components/Schema'

export default function LandingPage() {
  const seoData = {
    title: 'AI-Powered Personalized Learning & Gap Analysis',
    description: 'Find your learning gaps with AI precision. Get personalized assessments, expert mentorship, and master every concept with our adaptive learning platform for CBSE & ICSE students.',
    keywords: 'AI learning platform, personalized education, learning gap analysis, online tutoring, CBSE courses, ICSE courses, adaptive learning, online classes for students, AI tutor',
    ogType: 'website',
    canonical: typeof window !== 'undefined' ? window.location.href : 'https://meritai.com'
  };

  return (
    <>
      <SEOHead {...seoData} />
      <OrganizationSchema />
      <WebsiteSchema searchUrl={typeof window !== 'undefined' ? `${window.location.origin}/courses` : undefined} />
      
      <div className="min-h-screen">
        {/* Hero Section - AI-Powered Gap Identification */}
        <HeroSection />

        {/* Launch Date Announcement */}
        <LaunchAnnouncementSection />
        
        {/* How It Works - 4-Step Flow */}
        <HowItWorksSection />
        
        {/* Key Features Section */}
        <KeyFeaturesSection />
        
        {/* Learning Journey Section */}
        <LearningJourneySection />
        
        {/* Audience Section */}
        <AudienceSection />
        
        {/* Trust & Value Section */}
        <TrustValueSection />
        
        {/* Final Call to Action */}
        <FinalCTASection />
      </div>
    </>
  )
}

// =============================================
// 1. HERO SECTION
// =============================================
function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Brain className="h-5 w-5 text-primary-200" />
            <span className="text-sm font-medium text-primary-100">AI-Powered Learning Platform</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Find Your Learning Gaps
            <span className="block text-primary-200 mt-2">with AI Precision</span>
          </h1>
          
          {/* Sub-headline */}
          <p className="text-lg md:text-xl lg:text-2xl mb-10 text-primary-100 leading-relaxed">
            Identify exactly what you don't know through AI-driven quizzes, get personalized 
            evaluations, and receive expert mentorship to master every concept.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              className="group bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="text-lg">Start Free Assessment</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-200 text-lg"
            >
              How It Works
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-primary-200 text-sm">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>AI-Driven Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Expert Mentors</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Proven Results</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =============================================
// LAUNCH ANNOUNCEMENT SECTION
// =============================================
function LaunchAnnouncementSection() {
  // Set your official launch date here
  const LAUNCH_DATE = new Date('2026-04-01T00:00:00')

  const [timeLeft, setTimeLeft] = useState(getTimeLeft())

  function getTimeLeft() {
    const diff = LAUNCH_DATE - new Date()
    if (diff <= 0) return null
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [])

  const launched = timeLeft === null

  return (
    <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold mb-5 tracking-wide uppercase">
          <Rocket className="h-4 w-4 animate-bounce" />
          {launched ? 'Now Live!' : 'Coming Soon'}
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight drop-shadow">
          {launched
            ? '🎉 MeritAI is officially live!'
            : 'MeritAI is Launching Soon!'}
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          {launched
            ? 'Start your personalised AI-powered learning journey today.'
            : 'Get ready for AI-powered personalised learning — designed for every student. Mark your calendar and be first in line!'}
        </p>

        {/* Countdown or Launch Date */}
        {!launched && timeLeft ? (
          <div className="flex justify-center gap-4 sm:gap-8 mb-8">
            {[
              { label: 'Days',    value: timeLeft.days },
              { label: 'Hours',   value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 min-w-[64px] sm:min-w-[80px]">
                  <span className="text-3xl sm:text-4xl font-extrabold tabular-nums">
                    {String(value).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-medium mt-1.5 text-white/80 uppercase tracking-widest">
                  {label}
                </span>
              </div>
            ))}
          </div>
        ) : !launched ? (
          <div className="flex items-center justify-center gap-2 mb-8 text-white/90">
            <CalendarDays className="h-5 w-5" />
            <span className="text-lg font-semibold">
              {LAUNCH_DATE.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        ) : null}

        {/* CTA */}
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-3.5 rounded-lg font-bold text-base hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {launched ? (
            <>
              <Rocket className="h-5 w-5" />
              Get Started Free
            </>
          ) : (
            <>
              <Bell className="h-5 w-5" />
              Sign Up & Get Early Access
            </>
          )}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

// =============================================
// 2. HOW IT WORKS SECTION
// =============================================
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: <Brain className="h-10 w-10" />,
      title: "AI-Powered Assessment",
      description: "Take intelligent quizzes that adapt to your level and identify knowledge gaps with precision."
    },
    {
      number: "02",
      icon: <BarChart3 className="h-10 w-10" />,
      title: "Smart Evaluation & Gap Analysis",
      description: "Get detailed reports showing exactly which concepts you've mastered and which need attention."
    },
    {
      number: "03",
      icon: <RouteIcon className="h-10 w-10" />,
      title: "Personalized Learning Path",
      description: "Receive custom study materials and resources tailored to your specific learning gaps."
    },
    {
      number: "04",
      icon: <UserCheck className="h-10 w-10" />,
      title: "Mentorship & Re-Evaluation",
      description: "Learn with expert tutors through live sessions and track improvement with continuous assessments."
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A systematic approach to identify, understand, and overcome your learning challenges
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <StepCard key={index} {...step} />
          ))}
        </div>
      </div>
    </section>
  )
}

// =============================================
// 3. KEY FEATURES SECTION
// =============================================
function KeyFeaturesSection() {
  const features = [
    {
      icon: <Brain className="h-10 w-10 text-primary-600" />,
      title: "AI-Based Quiz Engine",
      description: "Adaptive assessments that intelligently probe your understanding and identify weak areas."
    },
    {
      icon: <Target className="h-10 w-10 text-primary-600" />,
      title: "Concept-Level Performance Analysis",
      description: "Detailed breakdowns of your performance on every topic, subtopic, and concept."
    },
    {
      icon: <BookOpen className="h-10 w-10 text-primary-600" />,
      title: "Personalized Study Material",
      description: "Curated resources, PDFs, videos, and exercises based on your specific gaps."
    },
    {
      icon: <Users className="h-10 w-10 text-primary-600" />,
      title: "1-on-1 Online Mentorship",
      description: "Connect with experienced tutors for personalized guidance and doubt clearing."
    },
    {
      icon: <RefreshCw className="h-10 w-10 text-primary-600" />,
      title: "Continuous Re-Assessment",
      description: "Regular evaluations to track improvement and ensure concepts are truly mastered."
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-primary-600" />,
      title: "Progress Tracking",
      description: "Visual dashboards showing your learning journey and growth over time."
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features for Effective Learning
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to identify gaps, learn effectively, and achieve mastery
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

// =============================================
// 4. LEARNING JOURNEY SECTION
// =============================================
function LearningJourneySection() {
  const journeySteps = [
    { label: "Assess", icon: <Search className="h-8 w-8" />, color: "bg-blue-500" },
    { label: "Analyze", icon: <BarChart3 className="h-8 w-8" />, color: "bg-purple-500" },
    { label: "Learn", icon: <BookOpen className="h-8 w-8" />, color: "bg-green-500" },
    { label: "Mentor", icon: <Users className="h-8 w-8" />, color: "bg-orange-500" },
    { label: "Re-Evaluate", icon: <RefreshCw className="h-8 w-8" />, color: "bg-pink-500" }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Learning Journey
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A continuous cycle of improvement that ensures lasting mastery
          </p>
        </div>

        {/* Journey Timeline */}
        <div className="relative">
          {/* Desktop View - Horizontal Timeline */}
          <div className="hidden md:flex items-center justify-between max-w-5xl mx-auto">
            {journeySteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center relative">
                {/* Connector Line */}
                {index < journeySteps.length - 1 && (
                  <div className="absolute top-12 left-full w-full h-1 bg-gray-300">
                    <div className="h-full bg-primary-500 w-0 animate-pulse"></div>
                  </div>
                )}
                
                {/* Step Icon */}
                <div className={`${step.color} text-white p-4 rounded-full mb-4 shadow-lg transform hover:scale-110 transition-transform duration-200`}>
                  {step.icon}
                </div>
                
                {/* Step Label */}
                <span className="text-lg font-semibold text-gray-800">{step.label}</span>
              </div>
            ))}
          </div>

          {/* Mobile View - Vertical Timeline */}
          <div className="md:hidden space-y-6">
            {journeySteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`${step.color} text-white p-4 rounded-full shadow-lg flex-shrink-0`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{step.label}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Journey Description */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Continuous Improvement Cycle
          </h3>
          <p className="text-gray-600 text-center leading-relaxed">
            Students don't just learn once—they continuously improve through repeated assessments, 
            targeted learning, expert mentorship, and re-evaluation. This cycle ensures deep 
            understanding and long-term retention of every concept.
          </p>
        </div>
      </div>
    </section>
  )
}

// =============================================
// 5. AUDIENCE SECTION (Updated: Only School Students - Class 4–12)
// =============================================
function AudienceSection() {
  const audiences = [
    {
      icon: <GraduationCap className="h-12 w-12 text-primary-600" />, // school focused icon
      title: "School Students",
      subtitle: "Class 4–12",
      description:
        "Build strong foundations and advance confidently with curriculum-aligned assessments and concept-level clarity tailored for Classes 4 through 12.",
      benefits: ["Curriculum-aligned quizzes", "Concept-level performance analysis", "Regular progress tracking"]
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Built for School Students</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Focused support for Classes 4–12 to strengthen fundamentals and accelerate learning.</p>
        </div>

        {/* Single Audience Card (centered) */}
        <div className="max-w-lg mx-auto">
          {audiences.map((audience, index) => (
            <AudienceCard key={index} {...audience} />
          ))}
        </div>
      </div>
    </section>
  )
}

// =============================================
// 6. TRUST & VALUE SECTION
// =============================================
function TrustValueSection() {
  const benefits = [
    {
      icon: <Target className="h-8 w-8 text-primary-600" />,
      title: "Learn Exactly What You Don't Know",
      description: "No more guessing. AI identifies your precise knowledge gaps so you focus only on what matters."
    },
    {
      icon: <RouteIcon className="h-8 w-8 text-primary-600" />,
      title: "No Generic Learning Paths",
      description: "Every student's journey is unique. Get a personalized curriculum based on your assessment results."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary-600" />,
      title: "Data-Driven Improvement",
      description: "Track your progress with detailed analytics and see measurable improvement over time."
    }
  ]

  // Step 1: fetch reviews that are both approved AND featured
  const { data: featuredData, isLoading: featuredLoading } = useQuery(
    'featuredReviews',
    () => reviewService.getFeaturedReviews(3),
    { staleTime: 5 * 60 * 1000 }
  )
  const featuredReviews = featuredData?.reviews || []

  // Step 2: if no featured reviews exist, fall back to latest approved reviews from any course
  // We reuse the getCourseReviews approach but target a generic approved-reviews endpoint.
  // Since the backend doesn't have a standalone "all approved" public endpoint, we use
  // a per-course call only when we have a courseId — so instead we just widen the featured
  // query to also try any approved review from the first available course.
  // Best approach: call getFeaturedReviews with a large limit then pick top 3; if that
  // returns nothing, call getCourseReviews without a courseId isn't possible, so we
  // add a new service method using the admin reviews list but filtered to approved.
  // Simplest real fix: backend already supports getCourseReviews per course.
  // We use the isFeatured:false fallback by fetching recent reviews across all courses
  // via a dedicated endpoint we'll call inline.
  const needsFallback = !featuredLoading && featuredReviews.length === 0
  const { data: fallbackData } = useQuery(
    'recentApprovedReviews',
    () => reviewService.getAllApprovedReviews(3),
    {
      enabled: needsFallback,
      staleTime: 5 * 60 * 1000
    }
  )
  const fallbackReviews = fallbackData?.reviews || []

  // Use featured if available, otherwise approved, otherwise nothing
  const displayReviews = featuredReviews.length > 0 ? featuredReviews : fallbackReviews

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose Us
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A smarter way to learn that puts you in control of your education
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow duration-200">
              <div className="bg-primary-50 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* What Our Students Say */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            What Our Students Say
          </h3>
          <p className="text-center text-gray-500 mb-8">Real reviews from our learners</p>

          {displayReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayReviews.map((review, index) => (
                <TestimonialCard
                  key={review._id || index}
                  title={review.reviewTitle || ''}
                  quote={review.reviewText || ''}
                  author={review.student?.name || 'MeritAI Student'}
                  role={
                    review.course?.subject && review.course?.grade
                      ? `Grade ${review.course.grade} — ${review.course.subject}`
                      : review.course?.title || 'MeritAI Student'
                  }
                  rating={review.rating || 5}
                />
              ))}
            </div>
          ) : !featuredLoading ? (
            <p className="text-center text-gray-400 py-8">No student reviews yet.</p>
          ) : (
            /* Loading skeleton */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-4/6 mb-6" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// =============================================
// 8. FINAL CALL TO ACTION SECTION
// =============================================
function FinalCTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Discover Your Learning Gaps?
        </h2>
        <p className="text-xl md:text-2xl mb-10 text-primary-100 leading-relaxed">
          Start your free AI assessment today and get a personalized learning diagnosis 
          that shows exactly what you need to improve.
        </p>
        
        <Link
          to="/signup"
          className="group inline-flex items-center space-x-3 bg-white text-primary-600 px-10 py-5 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
        >
          <span>Start Your Learning Diagnosis</span>
          <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
        </Link>
        
        <p className="mt-8 text-primary-200">
          No credit card required • Free forever • Get results in minutes
        </p>
      </div>
    </section>
  )
}

// =============================================
// REUSABLE COMPONENTS
// =============================================

// Step Card Component (for How It Works)
function StepCard({ number, icon, title, description }) {
  return (
    <div className="relative bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300 border-t-4 border-primary-500">
      {/* Step Number */}
      <div className="absolute -top-4 -left-4 bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
        {number}
      </div>
      
      {/* Icon */}
      <div className="text-primary-600 mb-4 mt-2">
        {icon}
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">{title}</h3>
      <p className="text-gray-600 text-center leading-relaxed">{description}</p>
    </div>
  )
}

// Audience Card Component
function AudienceCard({ icon, title, subtitle, description, benefits }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-b-4 border-primary-500">
      {/* Icon */}
      <div className="flex justify-center mb-4">{icon}</div>
      
      {/* Title & Subtitle */}
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-1">{title}</h3>
      <p className="text-primary-600 font-semibold text-center mb-4">{subtitle}</p>
      
      {/* Description */}
      <p className="text-gray-600 text-center mb-6 leading-relaxed">{description}</p>
      
      {/* Benefits List */}
      <ul className="space-y-2">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center text-sm text-gray-700">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></div>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Testimonial Card Component
function TestimonialCard({ title, quote, author, role, rating = 5 }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col">
      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <div className="text-primary-500 text-3xl leading-none mb-2">"</div>
      {title && (
        <p className="font-semibold text-gray-900 mb-1">{title}</p>
      )}
      <p className="text-gray-700 mb-6 italic leading-relaxed flex-1">{quote}</p>
      <div className="border-t border-gray-200 pt-4">
        <p className="font-semibold text-gray-900">{author}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
  )
}
