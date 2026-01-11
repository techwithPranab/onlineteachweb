import { useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

export default function FAQs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'general', name: 'General' },
    { id: 'students', name: 'For Students' },
    { id: 'tutors', name: 'For Tutors' },
    { id: 'billing', name: 'Billing & Payments' },
    { id: 'technical', name: 'Technical' }
  ]

  const faqs = [
    // General
    {
      category: 'general',
      question: 'What is Online Teaching Platform?',
      answer: 'Online Teaching Platform is a comprehensive e-learning solution that connects students with qualified tutors for live, interactive classes. We offer courses across various subjects and grade levels, providing flexible and personalized learning experiences.'
    },
    {
      category: 'general',
      question: 'How does the platform work?',
      answer: 'Students can browse courses, enroll in subjects they\'re interested in, and attend live video classes with tutors. Tutors create courses, upload materials, schedule sessions, and teach students in real-time. All interactions happen through our secure, easy-to-use platform.'
    },
    {
      category: 'general',
      question: 'Do I need to download any software?',
      answer: 'No downloads required! Our platform works directly in your web browser. However, you\'ll need a stable internet connection, a device with a camera and microphone, and a modern web browser (Chrome, Firefox, Safari, or Edge).'
    },

    // For Students
    {
      category: 'students',
      question: 'How do I enroll in a course?',
      answer: 'After creating your account, browse the course catalog, select a course you\'re interested in, and click "Enroll Now". You\'ll need an active subscription to access courses. Once enrolled, you can attend scheduled classes and access all course materials.'
    },
    {
      category: 'students',
      question: 'Can I attend classes on my mobile device?',
      answer: 'Yes! Our platform is fully responsive and works on smartphones and tablets. However, for the best experience with screen sharing and interactive features, we recommend using a laptop or desktop computer.'
    },
    {
      category: 'students',
      question: 'What if I miss a live class?',
      answer: 'While we recommend attending live classes for the best interactive experience, recordings may be available depending on the tutor\'s settings. You can also access all course materials, assignments, and reach out to your tutor for catch-up support.'
    },
    {
      category: 'students',
      question: 'How do I contact my tutor?',
      answer: 'You can message your tutor directly through the platform using our built-in messaging system. Tutors typically respond within 24 hours. You can also ask questions during live class sessions.'
    },
    {
      category: 'students',
      question: 'Can I switch tutors or courses?',
      answer: 'Yes, you can unenroll from a course and enroll in a different one at any time during your subscription period. However, please note that refunds are subject to our refund policy.'
    },

    // For Tutors
    {
      category: 'tutors',
      question: 'How do I become a tutor?',
      answer: 'Click "Become a Tutor" and complete the application form with your qualifications, experience, and subject expertise. Our team reviews applications within 48 hours. Once approved, you can create courses and start teaching immediately.'
    },
    {
      category: 'tutors',
      question: 'What are the requirements to teach?',
      answer: 'You need: (1) A bachelor\'s degree or relevant certification, (2) At least 1 year of teaching/tutoring experience, (3) Reliable internet connection, (4) Computer with webcam and microphone, (5) Quiet teaching environment, and (6) Passion for teaching!'
    },
    {
      category: 'tutors',
      question: 'How much can I earn as a tutor?',
      answer: 'Tutors keep 80% of their course revenue. Earnings vary based on your rates, number of students, and hours taught. Beginner tutors typically earn ₹500-₹1,500/month part-time, while experienced tutors can earn ₹2,000-₹5,000+ monthly.'
    },
    {
      category: 'tutors',
      question: 'When and how do I get paid?',
      answer: 'Payments are processed weekly via direct deposit or PayPal. You can track your earnings in real-time through your tutor dashboard. A minimum balance of ₹50 is required for withdrawal.'
    },
    {
      category: 'tutors',
      question: 'Can I set my own schedule?',
      answer: 'Absolutely! You have complete control over your schedule. Create sessions at times that work for you, and students will book based on your availability. You can update your schedule anytime.'
    },
    {
      category: 'tutors',
      question: 'How many students can attend my classes?',
      answer: 'This depends on your course setup. You can offer one-on-one tutoring, small group classes (up to 10 students), or larger sessions (up to 50 students). You set the maximum class size when creating your course.'
    },

    // Billing & Payments
    {
      category: 'billing',
      question: 'What subscription plans are available?',
      answer: 'We offer three plans: Basic (₹19/month for 5 courses), Standard (₹39/month for 15 courses), and Premium (₹79/month for unlimited courses). All plans include access to live classes, materials, and progress tracking.'
    },
    {
      category: 'billing',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and direct bank transfers. All payments are processed securely through encrypted connections.'
    },
    {
      category: 'billing',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period, and you won\'t be charged again.'
    },
    {
      category: 'billing',
      question: 'Do you offer refunds?',
      answer: 'We offer a 7-day money-back guarantee for new subscriptions. If you\'re not satisfied within the first 7 days, contact support for a full refund. After 7 days, refunds are provided on a case-by-case basis.'
    },
    {
      category: 'billing',
      question: 'Is there a free trial?',
      answer: 'Yes! New users get a 7-day free trial with access to all features. No credit card required to start. You can explore courses, attend classes, and experience the platform before subscribing.'
    },
    {
      category: 'billing',
      question: 'Are there any hidden fees?',
      answer: 'No hidden fees! The subscription price you see is what you pay. There are no enrollment fees, setup fees, or additional charges for accessing courses or materials.'
    },

    // Technical
    {
      category: 'technical',
      question: 'What are the system requirements?',
      answer: 'You need: (1) Internet connection with 5+ Mbps speed, (2) Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+), (3) Webcam and microphone for video classes, (4) Speakers or headphones, and (5) Windows 10+, macOS 10.14+, or recent Linux distribution.'
    },
    {
      category: 'technical',
      question: 'I\'m having video/audio issues. What should I do?',
      answer: 'First, check your internet connection and refresh the page. Ensure your browser has permission to access your camera and microphone. Try closing other applications and tabs. If issues persist, contact our technical support team.'
    },
    {
      category: 'technical',
      question: 'How do I enable camera and microphone permissions?',
      answer: 'When you join a class, your browser will prompt you to allow camera and microphone access. Click "Allow". If you previously denied access, go to your browser settings, find site permissions, and enable camera/microphone for our domain.'
    },
    {
      category: 'technical',
      question: 'Can I download course materials?',
      answer: 'Yes! Tutors can upload PDFs, documents, presentations, and other materials that students can download and access offline. Look for the download button on each material in your course dashboard.'
    },
    {
      category: 'technical',
      question: 'Is my data secure?',
      answer: 'Absolutely. We use bank-level encryption (SSL/TLS) for all data transmission, secure servers for storage, and comply with GDPR and other privacy regulations. We never share your personal information without consent.'
    },
    {
      category: 'technical',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a password reset link. Follow the link to create a new password. If you don\'t receive the email, check your spam folder.'
    }
  ]

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-purple-100">
              Find quick answers to common questions about our platform
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  activeCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No FAQs found matching your search.</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('all')
                }}
                className="mt-4 text-purple-600 hover:text-purple-700 font-semibold"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <span className="font-semibold text-left text-gray-900">{faq.question}</span>
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-purple-600 flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still have questions?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Contact Support
            </a>
            <a
              href="/help-center"
              className="border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
            >
              Visit Help Center
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
