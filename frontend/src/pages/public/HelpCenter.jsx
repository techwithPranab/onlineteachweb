import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Book, Video, CreditCard, Settings, MessageCircle, FileText, ChevronRight, HelpCircle, Mail } from 'lucide-react'

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    {
      icon: <Book className="h-8 w-8 text-blue-600" />,
      title: 'Getting Started',
      description: 'Learn the basics of our platform',
      articles: 12,
      slug: 'getting-started'
    },
    {
      icon: <Video className="h-8 w-8 text-purple-600" />,
      title: 'Live Classes',
      description: 'Everything about attending and hosting classes',
      articles: 18,
      slug: 'live-classes'
    },
    {
      icon: <CreditCard className="h-8 w-8 text-green-600" />,
      title: 'Billing & Payments',
      description: 'Subscriptions, refunds, and payment methods',
      articles: 15,
      slug: 'billing'
    },
    {
      icon: <Settings className="h-8 w-8 text-orange-600" />,
      title: 'Account Settings',
      description: 'Manage your profile and preferences',
      articles: 10,
      slug: 'account'
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-red-600" />,
      title: 'Communication',
      description: 'Chat, notifications, and messaging',
      articles: 8,
      slug: 'communication'
    },
    {
      icon: <FileText className="h-8 w-8 text-yellow-600" />,
      title: 'Course Materials',
      description: 'Uploading and accessing study materials',
      articles: 14,
      slug: 'materials'
    }
  ]

  const popularArticles = [
    {
      title: 'How do I join a live class?',
      category: 'Live Classes',
      views: '2.5K'
    },
    {
      title: 'How to enroll in a course?',
      category: 'Getting Started',
      views: '2.2K'
    },
    {
      title: 'What payment methods do you accept?',
      category: 'Billing & Payments',
      views: '1.8K'
    },
    {
      title: 'How to download course materials?',
      category: 'Course Materials',
      views: '1.6K'
    },
    {
      title: 'How to become a tutor?',
      category: 'Getting Started',
      views: '1.5K'
    },
    {
      title: 'Can I get a refund for my subscription?',
      category: 'Billing & Payments',
      views: '1.4K'
    },
    {
      title: 'How to reset my password?',
      category: 'Account Settings',
      views: '1.3K'
    },
    {
      title: 'How to contact my tutor?',
      category: 'Communication',
      views: '1.2K'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">How can we help you?</h1>
            <p className="text-xl text-blue-100">
              Search our knowledge base or browse categories below
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search for articles, topics, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <CategoryCard key={index} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularArticles.map((article, index) => (
              <ArticleCard key={index} {...article} />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <QuickLinkCard
              icon={<HelpCircle className="h-12 w-12 text-blue-600" />}
              title="FAQs"
              description="Quick answers to common questions"
              linkText="View FAQs"
              linkTo="/faqs"
            />
            <QuickLinkCard
              icon={<Mail className="h-12 w-12 text-purple-600" />}
              title="Contact Support"
              description="Can't find what you're looking for?"
              linkText="Contact Us"
              linkTo="/contact"
            />
            <QuickLinkCard
              icon={<MessageCircle className="h-12 w-12 text-green-600" />}
              title="Live Chat"
              description="Chat with our support team"
              linkText="Start Chat"
              linkTo="#"
              onClick={() => alert('Live chat feature coming soon!')}
            />
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Video Tutorials</h2>
            <p className="text-xl text-gray-600">Learn visually with our step-by-step video guides</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <VideoCard
              title="Platform Overview for Students"
              duration="5:30"
              thumbnail="https://via.placeholder.com/400x225/667eea/ffffff?text=Student+Tour"
            />
            <VideoCard
              title="How to Join Your First Class"
              duration="3:45"
              thumbnail="https://via.placeholder.com/400x225/764ba2/ffffff?text=Join+Class"
            />
            <VideoCard
              title="Getting Started as a Tutor"
              duration="8:15"
              thumbnail="https://via.placeholder.com/400x225/f093fb/ffffff?text=Tutor+Guide"
            />
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Our support team is here to assist you 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Contact Support
            </Link>
            <Link
              to="/faqs"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function CategoryCard({ icon, title, description, articles, slug }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-200 cursor-pointer group">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
        {title}
      </h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{articles} articles</span>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition" />
      </div>
    </div>
  )
}

function ArticleCard({ title, category, views }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
            {title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{category}</span>
            <span>•</span>
            <span>{views} views</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition flex-shrink-0 mt-1" />
      </div>
    </div>
  )
}

function QuickLinkCard({ icon, title, description, linkText, linkTo, onClick }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {onClick ? (
        <button
          onClick={onClick}
          className="text-blue-600 font-semibold hover:text-blue-700 transition inline-flex items-center gap-1"
        >
          {linkText}
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <Link
          to={linkTo}
          className="text-blue-600 font-semibold hover:text-blue-700 transition inline-flex items-center gap-1"
        >
          {linkText}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function VideoCard({ title, duration, thumbnail }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer group">
      <div className="relative">
        <img src={thumbnail} alt={title} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition flex items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition">
            <div className="w-0 h-0 border-l-[16px] border-l-blue-600 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
          {title}
        </h3>
      </div>
    </div>
  )
}
