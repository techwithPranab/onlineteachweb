import { useRouter } from 'next/router'
import Link from 'next/link'
import { Calendar, Clock, User, Tag, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react'
import SEOHead from '../../../components/SEO/SEOHead'
import BreadcrumbSchema from '../../../components/Schema/BreadcrumbSchema'
import MeritaiCard from '../../../components/ui/MeritaiCard'

// Mock blog data - In production, this would come from a CMS or API
const blogPosts = [
  {
    id: '10-effective-study-techniques-grade-10',
    title: '10 Effective Study Techniques for Grade 10 Students',
    excerpt: 'Master your Grade 10 studies with these proven study techniques that combine traditional methods with modern learning strategies.',
    content: `
# 10 Effective Study Techniques for Grade 10 Students

As you navigate through Grade 10, mastering effective study techniques becomes crucial for academic success. Here are 10 proven strategies that combine traditional methods with modern learning approaches.

## 1. Active Recall
Instead of passively reading your notes, actively test yourself on the material. This strengthens memory retention and helps identify knowledge gaps.

## 2. Spaced Repetition
Review material at increasing intervals rather than cramming. This technique leverages the brain's forgetting curve to improve long-term retention.

## 3. Pomodoro Technique
Study for 25 minutes straight, then take a 5-minute break. After four cycles, take a longer 15-30 minute break. This maintains focus and prevents burnout.

## 4. Feynman Technique
Explain concepts in simple terms as if teaching someone else. This reveals misunderstandings and deepens your comprehension.

## 5. Mind Mapping
Create visual diagrams connecting ideas and concepts. This is especially useful for subjects like Biology, History, and Literature.

## 6. Practice Testing
Regularly take practice tests under exam conditions. This builds confidence and familiarizes you with the exam format.

## 7. Interleaved Practice
Mix different subjects or topics in a single study session rather than focusing on one topic at a time.

## 8. Dual Coding
Combine verbal and visual information. Draw diagrams, create charts, or use color-coding alongside written notes.

## 9. Self-Explanation
After solving a problem, explain each step to yourself. This reinforces understanding and reveals logical gaps.

## 10. Teaching Others
The best way to learn is to teach. Explain concepts to friends, family, or even record yourself teaching the material.

## Conclusion
Remember, the most effective study technique is the one you'll actually use consistently. Experiment with these methods and find what works best for your learning style and schedule.
    `,
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
    content: `
# How to Create a Personalized Study Plan

A well-designed study plan is your roadmap to academic success. Here's how to create one that actually works for you.

## Assess Your Current Situation
Start by evaluating your strengths, weaknesses, available time, and academic goals.

## Set Realistic Goals
Break down big goals into smaller, achievable milestones.

## Schedule Strategically
Allocate study time during your peak energy hours and include breaks.

## Track Progress
Regularly review and adjust your plan based on what's working and what isn't.
    `,
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
    content: `
# Mastering Math: Grade-wise Learning Strategies for Algebra

Algebra forms the foundation of higher mathematics. Here's your comprehensive guide to mastering algebraic concepts.

## Understanding Variables and Expressions
Learn to work with variables, coefficients, and algebraic expressions.

## Solving Equations
Master one-step, two-step, and multi-step equations.

## Working with Inequalities
Understand and solve linear inequalities.

## Functions and Graphs
Learn about linear functions and their graphical representations.
    `,
    author: 'Prof. Rajesh Kumar',
    date: '2024-01-10',
    readTime: '12 min read',
    category: 'Subject Guides',
    tags: ['mathematics', 'algebra', 'grade-wise learning', 'problem solving'],
    featured: true,
    image: '/images/blog/math-algebra.jpg'
  }
]

export default function BlogPost() {
  const router = useRouter()
  const { slug } = router.query

  const post = blogPosts.find(p => p.id === slug)

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist.</p>
          <Link href="/blog" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  // SEO Data
  const seoData = {
    title: `${post.title} | MeritAI Blog`,
    description: post.excerpt,
    keywords: `${post.tags.join(', ')}, ${post.category}, education blog, study tips`,
    canonical: `/blog/${post.id}`,
    ogImage: post.image,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: post.image,
      author: {
        '@type': 'Person',
        name: post.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'MeritAI'
      },
      datePublished: post.date,
      dateModified: post.date,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `/blog/${post.id}`
      },
      keywords: post.tags.join(', ')
    }
  }

  // Breadcrumb data
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.category, url: `/blog?category=${encodeURIComponent(post.category)}` },
    { name: post.title, url: `/blog/${post.id}` }
  ]

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${post.id}` : `/blog/${post.id}`

  const handleShare = (platform) => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <>
      <SEOHead {...seoData} />
      <BreadcrumbSchema breadcrumbs={breadcrumbs} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link href="/blog" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {post.category}
              </span>
              {post.featured && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-gray-600 mb-6">
              {post.excerpt}
            </p>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-200 pb-6">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.image && (
            <div className="mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-sm"
                onError={(e) => {
                  e.target.src = '/images/blog/default.jpg'
                }}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-8">
            <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
          </div>

          {/* Tags */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?search=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Share Section */}
          <MeritaiCard className="mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </button>
              </div>
            </div>
          </MeritaiCard>

          {/* Related Articles */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogPosts
                .filter(p => p.id !== post.id && p.category === post.category)
                .slice(0, 2)
                .map((relatedPost) => (
                  <MeritaiCard
                    key={relatedPost.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/blog/${relatedPost.id}`)}
                  >
                    <div className="flex">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover rounded-l-lg"
                          onError={(e) => {
                            e.target.src = '/images/blog/default.jpg'
                          }}
                        />
                      </div>
                      <div className="p-4 flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{new Date(relatedPost.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </MeritaiCard>
                ))}
            </div>
          </div>

          {/* Author Bio */}
          <MeritaiCard>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">About {post.author}</h4>
                <p className="text-gray-600 text-sm">
                  {post.author === 'MeritAI Team'
                    ? 'Our team of education experts and experienced tutors are dedicated to helping students achieve academic excellence through innovative learning solutions.'
                    : 'An experienced educator passionate about helping students reach their full potential through effective teaching and personalized learning strategies.'
                  }
                </p>
              </div>
            </div>
          </MeritaiCard>
        </article>
      </div>
    </>
  )
}
