import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

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
    { id: 'tutors', name: 'For Tutors' },
    { id: 'quizzes', name: 'Quiz & Assessment' },
    { id: 'billing', name: 'Billing & Payments' },
    { id: 'technical', name: 'Technical' }
  ]

  const faqs = [
    // General
    {
      category: 'general',
      question: 'What is MeritAI?',
      answer: 'MeritAI is an AI-powered personalized learning platform that identifies your knowledge gaps through intelligent assessments, provides targeted learning resources, and connects you with expert mentors for comprehensive skill development.'
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
    {
      category: 'general',
      question: 'What makes MeritAI different from other learning platforms?',
      answer: 'MeritAI combines AI-powered personalized learning with live expert tutoring. Our intelligent quiz system adapts to your learning pace, identifies knowledge gaps, and creates custom practice materials. Plus, you get real-time interaction with qualified tutors, comprehensive progress tracking, and an extensive question bank for unlimited practice.'
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
    {
      category: 'students',
      question: 'What is the recommended study schedule?',
      answer: 'We recommend spending 30-60 minutes daily on the platform: attend 2-3 live classes per week, take 1-2 practice quizzes per subject weekly, review weak topics identified by the AI, and spend 15 minutes reviewing quiz results and recommendations. Consistency is key to better learning outcomes!'
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
      answer: 'Students can create custom quizzes from the Quiz Setup page. Select your subject, course, grade level, difficulty (Easy/Medium/Hard), number of questions (1-100), and duration (1-300 minutes). The AI will generate personalized questions based on your selected criteria. You can also choose between different question selection strategies like adaptive or random.'
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
      question: 'Can tutors create quizzes for students?',
      answer: 'Yes! Tutors have access to advanced quiz creation tools. They can create custom quizzes manually or use AI to generate questions. Tutors can also use our AI Question Generator to bulk-create questions by uploading course materials (PDFs, DOC, TXT files). Generated questions can be reviewed, edited, and added to the question bank.'
    },
    {
      category: 'quizzes',
      question: 'How does AI question generation work for tutors?',
      answer: 'Tutors can upload course materials (lecture notes, textbooks, PDFs), and our AI analyzes the content to generate relevant questions across all difficulty levels. The AI creates MCQs, True/False, and descriptive questions with proper answers and explanations. Tutors can review, edit, approve, or reject each question before adding them to their question bank.'
    },
    {
      category: 'quizzes',
      question: 'Is there a question bank I can practice from?',
      answer: 'Yes! The platform has an extensive question bank organized by grade, subject, topic, and difficulty. Students can create quizzes from this bank, and tutors can contribute by adding their own questions or using AI to generate new ones. The question bank is constantly growing with high-quality, verified questions.'
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
      question: 'How do I create and manage quizzes for my students?',
      answer: 'Access the Quiz Management section from your tutor dashboard. You can: (1) Create custom quizzes manually by selecting questions from the bank, (2) Use AI to generate questions from your uploaded course materials, (3) Review and approve AI-generated questions, (4) Set quiz parameters (time, difficulty, topics), (5) Track student quiz performance, and (6) Analyze class-wide quiz statistics to adjust your teaching.'
    },
    {
      category: 'tutors',
      question: 'Can I see how my students perform on quizzes?',
      answer: 'Yes! The tutor dashboard provides comprehensive quiz analytics: view average scores by class and subject, identify common weak topics across students, track quiz completion rates, see time-on-task metrics, compare performance across different difficulty levels, and access individual student quiz histories to provide personalized support.'
    },
    {
      category: 'tutors',
      question: 'How does the AI Question Generator help me?',
      answer: 'Upload your teaching materials (PDFs, Word docs, lecture notes, textbooks) and our AI automatically generates relevant quiz questions. The AI creates questions across all difficulty levels, provides correct answers and explanations, categorizes by topics, and ensures alignment with the curriculum. You review and approve questions before they\'re added to your question bank.'
    },
    {
      category: 'tutors',
      question: 'Can I reuse questions across different courses?',
      answer: 'Yes! Questions you create or approve are added to your personal question bank and can be reused in any course you teach. You can also filter questions by grade, subject, topic, difficulty, and question type to quickly build targeted quizzes. The platform also supports importing/exporting questions in standard formats.'
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
      answer: 'The platform requires internet connection for live classes, quiz synchronization, and real-time features. However, you can download course materials (PDFs, documents) for offline study. Active quizzes require internet but your progress is auto-saved, so you can resume if disconnected.'
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
      answer: 'Click on your profile icon in the top right corner, select "Profile Settings", and you can update your name, email, phone number, avatar, bio, grade (for students), subjects (for tutors), and notification preferences. Changes are saved automatically. Some changes like email may require verification.'
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
          </div>
        </div>
      </section>
    </div>
  )
}
