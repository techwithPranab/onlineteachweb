import { Link } from 'react-router-dom'
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Heart, 
  Zap, 
  Trophy, 
  Sparkles,
  Mail
} from 'lucide-react'

/**
 * Gen-Z Style Student Footer
 * 
 * Features:
 * - Vibrant gradient backgrounds
 * - Modern social media integration
 * - Gamification elements
 * - Emoji and icon-rich design
 * - Mobile-first responsive layout
 * - Engaging call-to-actions
 */
export default function StudentFooter() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: '🎯 Active Quizzes', path: '/student/active-quizzes' },
    { name: '📚 My Courses', path: '/student/courses' },
    { name: '📊 Progress', path: '/student/progress-reports' },
    { name: '🏆 Quiz History', path: '/student/quiz-history' }
  ]

  const supportLinks = [
    { name: 'Contact Us', path: '/contact', icon: Mail },
    { name: 'FAQs', path: '/faqs', icon: Sparkles }
  ]

  const socialLinks = [
    { name: 'Instagram', icon: Instagram, url: '#', color: 'hover:text-pink-400' },
    { name: 'Twitter', icon: Twitter, url: '#', color: 'hover:text-blue-400' },
    { name: 'YouTube', icon: Youtube, url: '#', color: 'hover:text-red-400' }
  ]

  return (
    <footer className="relative overflow-hidden bg-white text-gray-900 mt-16">
      {/* Thin MeriTai top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>

      {/* Subtle background shapes (toned-down MeriTai palette) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-8 right-1/4 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold meritai-title-gradient">
                MeritAI
              </h3>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              Level up your learning with AI-powered quizzes — subtle, focused, and professional.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-indigo-100 hover:scale-110`}
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-yellow-300" />
              Quick Access
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-600 hover:text-gray-900 transition-all duration-300 flex items-center group text-sm"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-300" />
              Get Help
            </h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-600 hover:text-gray-900 transition-all duration-300 flex items-center group text-sm"
                  >
                    <link.icon className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats & Motivation */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-300" />
              Your Journey
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Keep Learning!</span>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Stay Curious!</span>
                <span className="text-2xl">🧠</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Achieve More!</span>
                <span className="text-2xl">⚡</span>
              </div>
            </div>
            <Link
              to="/student/quiz-setup"
              className="mt-4 w-full meritai-btn-accent font-bold py-2 px-4 rounded-lg flex items-center justify-center text-sm"
            >
              Start New Quiz 🚀
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-600 text-sm text-center md:text-left">
              <p className="flex items-center justify-center md:justify-start flex-wrap text-gray-600">
                Made with
                <Heart className="w-4 h-4 mx-1 text-pink-300 fill-current" />
                for Students • © {currentYear} MeritAI
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end space-x-4 text-sm">
              <Link to="/privacy-policy" className="text-gray-600 hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <span className="text-gray-400">•</span>
              <Link to="/terms-of-service" className="text-gray-600 hover:text-gray-900 transition-colors">
                Terms
              </Link>
              <span className="text-gray-400">•</span>
              <Link to="/cookies" className="text-gray-600 hover:text-gray-900 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>

        {/* Fun Quote */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm italic font-light">
            "The best way to predict your future is to create it! 🌟"
          </p>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        /* Reduced animation intensity for MeriTai theme */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(10px, -10px) scale(1.02); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 12s infinite;
        }
      `}</style>
    </footer>
  )
}
