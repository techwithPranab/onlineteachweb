import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import SEOHead from '../../components/SEO/SEOHead'
import Breadcrumb from '../../components/common/Breadcrumb'
import { FAQSchema } from '../../components/Schema'

export default function FAQs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'general', name: 'General' },
    { id: 'students', name: 'For Students' },
    { id: 'quizzes', name: 'Quiz & Assessment' },
    { id: 'billing', name: 'Billing & Payments' },
    { id: 'technical', name: 'Technical' }
  ]

  const faqs = [
    // General
    {
      category: 'general',
      question: 'What is MeritAI?',
      answer: 'MeritAI is an AI-powered personalized learning platform that identifies your knowledge gaps through intelligent assessments and provides targeted learning resources for comprehensive skill development.'
    },
    {
      category: 'general',
      question: 'Do I need to download any software?',
      answer: 'No downloads are required. MeritAI works directly in a modern web browser such as Chrome, Firefox, Safari, or Edge. You only need a stable internet connection and a supported computer, tablet, or smartphone.'
    },
    {
      category: 'general',
      question: 'What makes MeritAI different from other learning platforms?',
      answer: 'MeritAI combines AI-powered personalized learning with adaptive practice. Our intelligent quiz system adapts to your learning pace, identifies knowledge gaps, and creates custom practice materials. You also get comprehensive progress tracking and an extensive question bank for unlimited practice.'
    },
    {
      category: 'general',
      question: 'Is MeritAI suitable for all grade levels?',
      answer: 'Yes! We offer courses and quizzes for students from Grade 1 to Grade 12. Our AI algorithms automatically adjust content difficulty and teaching methods based on the selected grade level, ensuring age-appropriate and effective learning for every student.'
    },
    {
      category: 'general',
      question: 'How does the AI personalization work?',
      answer: 'Our AI analyzes your quiz performance, identifies weak topics, tracks learning patterns, and adapts content delivery accordingly. It creates personalized quiz questions, suggests relevant courses, recommends study materials, and provides targeted practice in areas where you need improvement. The more you use the platform, the smarter it gets at helping you learn.'
    },
    {
      category: 'general',
      question: 'Can parents track their child\'s progress?',
      answer: 'Yes! Parent accounts (coming soon) will have access to comprehensive dashboards showing their child\'s quiz scores, attendance records, course progress, time spent learning, weak and strong subjects, and improvement trends. Parents can also receive weekly email reports about their child\'s performance.'
    },

    // For Students
    {
      category: 'students',
      question: 'How do I enroll in a course?',
      answer: 'After creating your account, browse the course catalog, select a course you are interested in, and click "Enroll Now". An active subscription may be required to access the complete course and its study materials.'
    },
    {
      category: 'students',
      question: 'How do I access my performance reports?',
      answer: 'Go to your student dashboard and click on "Progress Reports" or "Quiz History". You\'ll find detailed analytics including overall scores, topic-wise performance, quiz completion rates, time spent learning, improvement trends, and personalized recommendations for each subject you\'re studying.'
    },
    {
      category: 'students',
      question: 'Can I study multiple subjects at once?',
      answer: 'Absolutely! Your subscription allows you to enroll in multiple courses across different subjects and grade levels simultaneously. You can create quizzes for any enrolled course and track your progress separately for each subject. This flexibility lets you learn at your own pace across multiple areas.'
    },
    // Quiz & Assessment
    {
      category: 'quizzes',
      question: 'How do AI-powered quizzes work?',
      answer: 'Our intelligent quiz system uses AI algorithms to analyze your performance and create personalized quizzes based on your knowledge gaps. The system adapts question difficulty and topics based on your previous answers, ensuring you get the most relevant practice questions to improve your learning.'
    },
    {
      category: 'quizzes',
      question: 'How do I create a quiz?',
      answer: 'Students can create custom quizzes from the Quiz Setup page. Select your subject, course, grade level, difficulty (Easy/Medium/Hard/Olympiad), number of questions (1-100), and duration (1-300 minutes). The AI will generate personalized questions based on your selected criteria. You can also choose between different question selection strategies like adaptive or random.'
    },
    {
      category: 'quizzes',
      question: 'What types of questions are available in quizzes?',
      answer: 'Our platform supports multiple question types: Single Choice (MCQ), Multiple Choice, True/False, Numerical answers, Short answers, Long answers, and Case-based questions. The AI automatically selects appropriate question types based on the subject and topic.'
    },
    {
      category: 'quizzes',
      question: 'Can I pause a quiz and resume it later?',
      answer: 'Yes! You can safely close your browser or navigate away during a quiz. Your progress is automatically saved to our servers. Simply go to "Active Quizzes" from your dashboard to resume exactly where you left off. However, the timer continues running in the background.'
    },
    {
      category: 'quizzes',
      question: 'What happens if I run out of time during a quiz?',
      answer: 'If the timer reaches zero, the quiz will be automatically submitted with your current answers. You\'ll receive a results page showing which questions you answered and your score. It\'s important to manage your time wisely during quizzes!'
    },
    {
      category: 'quizzes',
      question: 'How is my quiz scored?',
      answer: 'Each question carries equal marks. Your final score is calculated as (Correct Answers / Total Questions) × 100. The system also provides detailed performance analysis including topic-wise accuracy, difficulty-wise performance, time spent per question, and identifies your weak areas for improvement.'
    },
    {
      category: 'quizzes',
      question: 'Can I review my quiz answers after submission?',
      answer: 'Absolutely! After completing a quiz, you can access detailed results from Quiz History. You\'ll see: (1) Your overall score and accuracy, (2) Each question with your answer and the correct answer, (3) Topic-wise performance breakdown, (4) Difficulty-wise analysis, (5) Time spent on each question, and (6) Personalized recommendations for improvement.'
    },
    {
      category: 'quizzes',
      question: 'What is the difference between Active Quizzes and Quiz History?',
      answer: 'Active Quizzes shows all quizzes you\'ve created but haven\'t completed yet. You can start a new quiz or resume an in-progress quiz from here. Quiz History displays all your completed quizzes with detailed results, performance analytics, and recommendations. You can review past quizzes anytime to track your progress.'
    },
    {
      category: 'quizzes',
      question: 'Can I retake a quiz?',
      answer: 'Each quiz is unique and generated specifically for your learning needs. While you cannot retake the exact same quiz, you can create a new quiz with the same settings (subject, difficulty, topics) to get similar practice questions. This ensures you get fresh questions for better learning.'
    },
    {
      category: 'quizzes',
      question: 'What is the marking system for review?',
      answer: 'During a quiz, you can mark questions for review by clicking the "Mark for Review" button. Marked questions are highlighted in yellow/orange in the question navigator, making it easy to find them later. This helps you flag uncertain questions and return to them before submitting.'
    },
    {
      category: 'quizzes',
      question: 'How many quizzes can I take in a day?',
      answer: 'There\'s no daily limit! You can create and take as many quizzes as you want. However, you can only have one quiz in progress at a time. Complete or abandon your current quiz before starting a new one. This ensures focused learning and better performance tracking.'
    },
    {
      category: 'quizzes',
      question: 'What is adaptive question selection?',
      answer: 'Adaptive question selection is an AI-powered feature that adjusts question difficulty based on your performance. If you answer correctly, the next question may be slightly harder. If you struggle, you\'ll get easier questions. This personalized approach ensures optimal learning and keeps you challenged without being overwhelmed.'
    },
    {
      category: 'quizzes',
      question: 'Can I delete an active quiz?',
      answer: 'Yes, you can delete any quiz from your Active Quizzes page that you no longer want to take. Simply click the delete (trash) icon next to the quiz. Note: This action cannot be undone, and you\'ll lose any answers you\'ve already entered for that quiz.'
    },
    {
      category: 'quizzes',
      question: 'How does the performance tracking work?',
      answer: 'Our advanced analytics track multiple metrics: (1) Overall accuracy and score trends over time, (2) Topic-wise performance to identify strengths and weaknesses, (3) Difficulty-wise analysis showing how you perform at different levels, (4) Time management patterns, (5) Most missed topics for focused revision, and (6) Improvement recommendations based on your performance data.'
    },
    {
      category: 'quizzes',
      question: 'What are weak topics and how are they identified?',
      answer: 'Weak topics are subjects or areas where your accuracy is below 60%. The AI analyzes your quiz results to identify patterns in incorrect answers and categorizes them by topic. These weak areas are highlighted in your performance dashboard with specific recommendations for improvement and suggested practice topics.'
    },
    {
      category: 'quizzes',
      question: 'Is there a question bank I can practice from?',
      answer: 'Yes! The platform has an extensive question bank organized by grade, subject, topic, and difficulty. Students can create targeted quizzes from this bank and receive fresh questions for continued practice.'
    },
    {
      category: 'quizzes',
      question: 'What happens to my quiz data if I cancel my subscription?',
      answer: 'Your quiz history and performance data are saved permanently. Even after canceling your subscription, you can reactivate and access all your past quiz results, performance analytics, and progress tracking. However, you won\'t be able to create new quizzes without an active subscription.'
    },
    {
      category: 'quizzes',
      question: 'Can I export my quiz results?',
      answer: 'Yes! You can export your quiz results as PDF reports from the Quiz History page. The export includes your score, detailed question-by-question analysis, performance metrics, and recommendations. This is useful for tracking progress, sharing with parents/teachers, or maintaining personal study records.'
    },

    // Billing & Payments
    {
      category: 'billing',
      question: 'What subscription plans are available?',
      answer: 'We offer plans with different levels of access to courses, study materials, quizzes, and progress tracking. Visit the Pricing page for the currently available plans, limits, and prices.'
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
      answer: 'Any currently available trial or introductory access will be shown on the Pricing and Signup pages. Review those pages for the latest eligibility, duration, and included features.'
    },
    {
      category: 'billing',
      question: 'Are there any hidden fees?',
      answer: 'No hidden fees! The subscription price you see is what you pay. There are no enrollment fees, setup fees, or additional charges for accessing courses or materials.'
    },

    // Technical
    {
      category: 'technical',
      question: 'Can I download course materials?',
      answer: 'Downloadable PDFs, documents, presentations, and other resources can be saved for offline study. Look for the download button beside an eligible material in your course dashboard.'
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
    },
    {
      category: 'technical',
      question: 'Why am I not receiving email notifications?',
      answer: 'First, check your spam/junk folder - our emails might be filtered there. Add noreply@meritai.com to your contacts. Verify your email address in account settings. Check your notification preferences to ensure emails are enabled. If issues persist, contact support to verify your email address in our system.'
    },
    {
      category: 'technical',
      question: 'What should I do if the platform is running slowly?',
      answer: 'Try these steps: (1) Clear your browser cache and cookies, (2) Close unnecessary tabs and applications, (3) Check your internet connection speed (minimum 5 Mbps recommended), (4) Update your browser to the latest version, (5) Try a different browser, (6) Restart your device. If problems continue, contact technical support with details about your device and browser.'
    },
    {
      category: 'technical',
      question: 'Can I access MeritAI offline?',
      answer: 'An internet connection is required for quizzes, synchronization, and account features. Downloadable course materials can be saved for offline study when a download option is available.'
    },
    {
      category: 'technical',
      question: 'Is there a mobile app?',
      answer: 'Currently, MeritAI works as a responsive web application accessible through any mobile browser. A dedicated mobile app for iOS and Android is coming soon! For the best experience on mobile, use Chrome or Safari and add the website to your home screen for quick access.'
    },
    {
      category: 'technical',
      question: 'How do I report a bug or technical issue?',
      answer: 'Go to Help Center → Report an Issue, or email support@meritai.com with: (1) Detailed description of the problem, (2) Screenshots or screen recordings if possible, (3) Your device and browser information, (4) Steps to reproduce the issue. Our technical team typically responds within 24 hours and will work to resolve issues quickly.'
    },
    {
      category: 'technical',
      question: 'What happens if I lose internet connection during a quiz?',
      answer: 'Don\'t worry! Your answers are automatically saved to our servers every time you answer a question. If you lose connection, reconnect and navigate to "Active Quizzes" - you can resume exactly where you left off. However, the quiz timer continues running even when disconnected, so reconnect as quickly as possible.'
    },
    {
      category: 'technical',
      question: 'How do I update my profile information?',
      answer: 'Click your profile icon, select "Profile Settings", and update your name, email, phone number, avatar, grade, and notification preferences. Some changes, such as a new email address, may require verification.'
    },
    {
      category: 'technical',
      question: 'Can I use MeritAI on multiple devices?',
      answer: 'Yes! You can access your account from any device - computer, tablet, or smartphone. Your progress, quiz history, course enrollments, and settings are synchronized across all devices. However, you can only be logged in and taking a quiz on one device at a time for security reasons.'
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

  const seoData = {
    title: 'Frequently Asked Questions (FAQs)',
    description: 'Find answers to common questions about MeritAI, including courses, study materials, pricing, quizzes, billing, and technical support.',
    keywords: 'FAQs, frequently asked questions, help, support, online learning help, quiz help, course help'
  };

  const breadcrumbItems = [
    { label: 'FAQs', path: '/faqs' }
  ];

  // Prepare FAQ data for schema (all FAQs for better SEO)
  const faqSchemaData = faqs.map(faq => ({
    question: faq.question,
    answer: faq.answer
  }));

  return (
    <>
      <SEOHead {...seoData} />
      <FAQSchema faqs={faqSchemaData} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        
        {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-500 to-teal-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-teal-100">
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
              className="w-full pl-14 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                    ? 'bg-teal-600 text-white'
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
                className="mt-4 text-teal-600 hover:text-teal-700 font-semibold"
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
                      <ChevronUp className="h-5 w-5 text-teal-600 flex-shrink-0 ml-4" />
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
              className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}
