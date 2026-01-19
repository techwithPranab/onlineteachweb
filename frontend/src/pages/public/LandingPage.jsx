import { Link } from 'react-router-dom'
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
  Trophy
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - AI-Powered Gap Identification */}
      <HeroSection />
      
      {/* How It Works - 4-Step Flow */}
      <HowItWorksSection />
      
      {/* Key Features Section */}
      <KeyFeaturesSection />
      
      {/* Learning Journey Section */}
      <LearningJourneySection />
      
      {/* Audience Section */}
      <AudienceSection />
      
      {/* Tutor & Mentorship Section */}
      <TutorMentorshipSection />
      
      {/* Trust & Value Section */}
      <TrustValueSection />
      
      {/* Final Call to Action */}
      <FinalCTASection />
    </div>
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
// 6. TUTOR & MENTORSHIP SECTION
// =============================================
function TutorMentorshipSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Learn from Experienced Tutors
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Our expert mentors don't just teach—they understand your unique learning gaps 
              and guide you step-by-step to mastery.
            </p>
            
            {/* Mentor Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-lg mt-1">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Live Online Sessions</h3>
                  <p className="text-primary-100">Interactive classes with screen sharing and whiteboard</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-lg mt-1">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Personalized Doubt Clearing</h3>
                  <p className="text-primary-100">One-on-one attention to address your specific questions</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-lg mt-1">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Progress Tracking & Feedback</h3>
                  <p className="text-primary-100">Regular assessments and detailed performance reports</p>
                </div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup?role=student"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition text-center"
              >
                Talk to a Tutor
              </Link>
              <Link
                to="/for-tutors"
                 className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition text-center"
               >
                 Become a Mentor
               </Link>
            </div>
          </div>

          {/* Right Content - Stats/Visual */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Our Mentors</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-primary-200">Expert Tutors</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">15+</div>
                <div className="text-primary-200">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-primary-200">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">50k+</div>
                <div className="text-primary-200">Sessions Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =============================================
// 7. TRUST & VALUE SECTION
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

        {/* Testimonials Placeholder */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            What Our Students Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="The AI assessment showed me exactly where I was weak. After 3 months, my scores improved by 40%!"
              author="Priya Sharma"
              role="Class 10 Student"
            />
            <TestimonialCard
              quote="Personalized mentorship made all the difference. My tutor understood my learning style perfectly."
              author="Rahul Verma"
              role="JEE Aspirant"
            />
            <TestimonialCard
              quote="Finally, a platform that doesn't waste time on what I already know. Super efficient!"
              author="Anita Desai"
              role="College Student"
            />
          </div>
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
function TestimonialCard({ quote, author, role }) {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="text-primary-600 text-4xl mb-4">"</div>
      <p className="text-gray-700 mb-6 italic leading-relaxed">{quote}</p>
      <div className="border-t pt-4">
        <p className="font-semibold text-gray-900">{author}</p>
        <p className="text-sm text-gray-600">{role}</p>
      </div>
    </div>
  )
}
