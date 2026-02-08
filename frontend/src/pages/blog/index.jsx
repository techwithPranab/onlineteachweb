import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Calendar, Clock, User, Tag, Search, ArrowRight } from 'lucide-react'
import SEOHead from '../../../components/SEO/SEOHead'
import BreadcrumbSchema from '../../../components/Schema/BreadcrumbSchema'
import MeritaiCard from '../../../components/ui/MeritaiCard'

// Mock blog data - In production, this would come from a CMS or API
const blogPosts = [
  {
    id: '10-effective-study-techniques-grade-10',
    title: '10 Effective Study Techniques for Grade 10 Students',
    excerpt: 'Master your Grade 10 studies with these proven study techniques that combine traditional methods with modern learning strategies.',
    content: 'Full blog post content here...',
    author: 'MeritAI Team',
    date: '2024-01-15',
    readTime: '8 min read',
    category: 'Study Tips',
    tags: ['study techniques', 'grade 10', 'exam preparation', 'time management'],
    featured: true,
    image: '/images/blog/study-techniques.jpg'
  },
  {
    id: 'how-to-create-personalized-study-plan',
    title: 'How to Create a Personalized Study Plan',
    excerpt: 'Learn how to design a study plan that fits your learning style, schedule, and academic goals.',
    content: 'Full blog post content here...',
    author: 'Dr. Priya Sharma',
    date: '2024-01-12',
    readTime: '6 min read',
    category: 'Study Tips',
    tags: ['study plan', 'personalized learning', 'academic goals', 'time management'],
    featured: false,
    image: '/images/blog/study-plan.jpg'
  },
  {
    id: 'mastering-math-grade-10-algebra',
    title: 'Mastering Math: Grade-wise Learning Strategies for Algebra',
    excerpt: 'Comprehensive guide to mastering algebra concepts from basic to advanced levels across different grades.',
    content: 'Full blog post content here...',
    author: 'Prof. Rajesh Kumar',
    date: '2024-01-10',
    readTime: '12 min read',
    category: 'Subject Guides',
    tags: ['mathematics', 'algebra', 'grade-wise learning', 'problem solving'],
    featured: true,
    image: '/images/blog/math-algebra.jpg'
  },
  {
    id: 'cbse-board-exam-preparation-guide-2025',
    title: 'CBSE Board Exam Preparation Guide 2025',
    excerpt: 'Complete preparation strategy for CBSE board exams 2025 with timeline, resources, and expert tips.',
    content: 'Full blog post content here...',
    author: 'MeritAI Team',
    date: '2024-01-08',
    readTime: '15 min read',
    category: 'Exam Preparation',
    tags: ['CBSE', 'board exams', '2025', 'exam preparation', 'study strategy'],
    featured: true,
    image: '/images/blog/cbse-exam-guide.jpg'
  },
  {
    id: 'ai-powered-personalized-learning-benefits',
    title: 'How AI is Transforming Personalized Learning',
    excerpt: 'Explore how artificial intelligence is revolutionizing education through personalized learning experiences.',
    content: 'Full blog post content here...',
    author: 'Dr. Amit Patel',
    date: '2024-01-05',
    readTime: '10 min read',
    category: 'Education Technology',
    tags: ['AI', 'personalized learning', 'education technology', 'future of education'],
    featured: false,
    image: '/images/blog/ai-education.jpg'
  },
  {
    id: 'physics-problem-solving-strategies',
    title: 'Physics Problem-Solving Strategies That Actually Work',
    excerpt: 'Master physics problem-solving with these proven strategies and techniques used by top students.',
    content: 'Full blog post content here...',
    author: 'Prof. Meera Singh',
    date: '2024-01-03',
    readTime: '9 min read',
    category: 'Subject Guides',
    tags: ['physics', 'problem solving', 'study strategies', 'science'],
    featured: false,
    image: '/images/blog/physics-problems.jpg'
  }
]

const categories = ['All', 'Study Tips', 'Subject Guides', 'Exam Preparation', 'Education Technology', 'Parent Resources', 'Career Guidance']

export default function Blog() {
  const router = useRouter()
  const { category, search } = router.query

  const [searchTerm, setSearchTerm] = useState(search || '')
  const [selectedCategory, setSelectedCategory] = useState(category || 'All')
  const [filteredPosts, setFilteredPosts] = useState(blogPosts)

  // Filter posts based on search and category
  useEffect(() => {
    let filtered = blogPosts

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(post => post.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredPosts(filtered)
  }, [selectedCategory, searchTerm])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategory !== 'All') params.set('category', selectedCategory)
    if (searchTerm) params.set('search', searchTerm)

    const newUrl = `/blog${params.toString() ? `?${params.toString()}` : ''}`
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, undefined, { shallow: true })
    }
  }, [selectedCategory, searchTerm, router])

  // SEO Data
  const seoData = {
    title: selectedCategory !== 'All'
      ? `${selectedCategory} - Education Blog | MeritAI`
      : 'Education Blog & Study Resources | MeritAI',
    description: selectedCategory !== 'All'
      ? `Read our expert ${selectedCategory.toLowerCase()} articles, guides, and resources for better learning outcomes.`
      : 'Expert educational content, study tips, subject guides, and resources to help students excel in their academic journey.',
    keywords: `education blog, study tips, ${selectedCategory.toLowerCase()}, academic resources, learning guides, exam preparation`,
    canonical: `/blog${selectedCategory !== 'All' || searchTerm ? '?' : ''}${selectedCategory !== 'All' ? `category=${encodeURIComponent(selectedCategory)}` : ''}${searchTerm ? `${selectedCategory !== 'All' ? '&' : ''}search=${encodeURIComponent(searchTerm)}` : ''}`,
  }

  // Breadcrumb data
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' }
  ]

  if (selectedCategory !== 'All') {
    breadcrumbs.push({ name: selectedCategory, url: `/blog?category=${encodeURIComponent(selectedCategory)}` })
  }

  const featuredPosts = filteredPosts.filter(post => post.featured)
  const regularPosts = filteredPosts.filter(post => !post.featured)

  return (
    <>
      <SEOHead {...seoData} />
      <BreadcrumbSchema breadcrumbs={breadcrumbs} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {selectedCategory !== 'All' ? `${selectedCategory}` : 'Education Blog'}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {selectedCategory !== 'All'
                  ? `Expert insights and resources on ${selectedCategory.toLowerCase()} to help you excel academically.`
                  : 'Expert educational content, study tips, subject guides, and resources to help students excel in their academic journey.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <MeritaiCard
                    key={post.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/blog/${post.id}`)}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-2/5">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-48 md:h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/images/blog/default.jpg'
                          }}
                        />
                      </div>
                      <div className="md:w-3/5 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-500">Featured</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              <span>{post.author}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{new Date(post.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </MeritaiCard>
                ))}
              </div>
            </div>
          )}

          {/* Regular Posts */}
          {regularPosts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {featuredPosts.length > 0 ? 'More Articles' : 'Latest Articles'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post) => (
                  <MeritaiCard
                    key={post.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/blog/${post.id}`)}
                  >
                    <div className="mb-4">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                        onError={(e) => {
                          e.target.src = '/images/blog/default.jpg'
                        }}
                      />
                    </div>
                    <div className="p-6 pt-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>{post.author}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(post.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>
                  </MeritaiCard>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or browse all articles.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('All')
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View All Articles
              </button>
            </div>
          )}

          {/* Load More / Pagination could go here */}
          {filteredPosts.length > 0 && (
            <div className="text-center mt-12">
              <p className="text-gray-600">
                Showing {filteredPosts.length} of {blogPosts.length} articles
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
