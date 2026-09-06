import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from 'react-query'
import { Search, Filter, BookOpen, Users, Clock, Star } from 'lucide-react'
import { courseService } from '../../../services/apiServices'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import ErrorMessage from '../../../components/common/ErrorMessage'
import MeritaiCard from '../../../components/ui/MeritaiCard'
import SEOHead from '../../../components/SEO/SEOHead'
import BreadcrumbSchema from '../../../components/Schema/BreadcrumbSchema'

export default function Courses() {
  const router = useRouter()
  const { grade, subject, search } = router.query

  const [searchTerm, setSearchTerm] = useState(search || '')
  const [selectedGrade, setSelectedGrade] = useState(grade || '')
  const [selectedSubject, setSelectedSubject] = useState(subject || '')
  const [sortBy, setSortBy] = useState('popular')

  // Fetch courses
  const { data: coursesData, isLoading, error } = useQuery(
    ['courses', { grade: selectedGrade, subject: selectedSubject, search: searchTerm }],
    () => courseService.getCourses({
      grade: selectedGrade,
      subject: selectedSubject,
      search: searchTerm,
      sort: sortBy
    })
  )

  const courses = coursesData?.courses || []

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedGrade) params.set('grade', selectedGrade)
    if (selectedSubject) params.set('subject', selectedSubject)
    if (searchTerm) params.set('search', searchTerm)

    const newUrl = `/courses${params.toString() ? `?${params.toString()}` : ''}`
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, undefined, { shallow: true })
    }
  }, [selectedGrade, selectedSubject, searchTerm, router])

  // Available grades and subjects
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Computer Science', 'Physics', 'Chemistry', 'Biology']

  // SEO Data
  const getPageTitle = () => {
    if (selectedGrade && selectedSubject) {
      return `Grade ${selectedGrade} ${selectedSubject} Courses | MeritAI`
    } else if (selectedGrade) {
      return `Grade ${selectedGrade} Courses | MeritAI`
    } else if (selectedSubject) {
      return `${selectedSubject} Courses | MeritAI`
    } else if (searchTerm) {
      return `Search Results: "${searchTerm}" | MeritAI Courses`
    }
    return 'Online Courses for Grades 1-12 | MeritAI'
  }

  const getPageDescription = () => {
    if (selectedGrade && selectedSubject) {
      return `Browse ${courses.length}+ Grade ${selectedGrade} ${selectedSubject} courses. AI-powered learning with personalized assessments and adaptive AI practice.`
    } else if (selectedGrade) {
      return `Explore comprehensive Grade ${selectedGrade} courses across Math, Science, English and more. Personalized learning for CBSE, ICSE students.`
    } else if (selectedSubject) {
      return `Learn ${selectedSubject} with our AI-powered courses for Grades 1-12. Interactive lessons, quizzes, and personalized practice.`
    }
    return 'Browse 100+ courses across Math, Science, English and more. AI-powered personalized learning for CBSE, ICSE students from Grade 1-12.'
  }

  const seoData = {
    title: getPageTitle(),
    description: getPageDescription(),
    keywords: `online courses, ${selectedGrade ? `grade ${selectedGrade}, ` : ''}${selectedSubject ? `${selectedSubject}, ` : ''}CBSE courses, ICSE courses, personalized learning, AI education`,
    canonical: `/courses${selectedGrade || selectedSubject || searchTerm ? '?' : ''}${selectedGrade ? `grade=${selectedGrade}` : ''}${selectedSubject ? `${selectedGrade ? '&' : ''}subject=${selectedSubject}` : ''}${searchTerm ? `${(selectedGrade || selectedSubject) ? '&' : ''}search=${encodeURIComponent(searchTerm)}` : ''}`,
  }

  // Breadcrumb data
  const getBreadcrumbs = () => {
    const breadcrumbs = [{ name: 'Home', url: '/' }, { name: 'Courses', url: '/courses' }]

    if (selectedGrade) {
      breadcrumbs.push({ name: `Grade ${selectedGrade}`, url: `/courses?grade=${selectedGrade}` })
    }
    if (selectedSubject) {
      breadcrumbs.push({ name: selectedSubject, url: `/courses?grade=${selectedGrade}&subject=${selectedSubject}` })
    }

    return breadcrumbs
  }

  const handleCourseClick = (courseId) => {
    router.push(`/courses/${courseId}`)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Failed to load courses" />

  return (
    <>
      <SEOHead {...seoData} />
      <BreadcrumbSchema breadcrumbs={getBreadcrumbs()} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {selectedGrade && selectedSubject
                  ? `Grade ${selectedGrade} ${selectedSubject} Courses`
                  : selectedGrade
                  ? `Grade ${selectedGrade} Courses`
                  : selectedSubject
                  ? `${selectedSubject} Courses`
                  : 'All Courses'
                }
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {selectedGrade && selectedSubject
                  ? `Master ${selectedSubject} concepts for Grade ${selectedGrade} with AI-powered personalized learning.`
                  : selectedGrade
                  ? `Explore comprehensive courses for Grade ${selectedGrade} across all subjects.`
                  : selectedSubject
                  ? `Learn ${selectedSubject} with our interactive courses for Grades 1-12.`
                  : 'Browse our comprehensive collection of courses designed for CBSE and ICSE students.'
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
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Grade Filter */}
              <div className="w-full lg:w-48">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Grades</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div className="w-full lg:w-48">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="w-full lg:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              {courses.length} course{courses.length !== 1 ? 's' : ''} found
              {selectedGrade && ` for Grade ${selectedGrade}`}
              {selectedSubject && ` in ${selectedSubject}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>

          {/* Courses Grid */}
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <MeritaiCard
                  key={course._id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCourseClick(course._id)}
                >
                  {/* Course Image */}
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}

                  <div className="p-6">
                    {/* Grade and Subject Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Grade {course.grade}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {course.subject}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{course.enrolledCount || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{course.duration || 'Self-paced'}</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        <span>{course.chapters?.length || 0} chapters</span>
                      </div>
                    </div>

                    {/* Rating */}
                    {course.averageRating && (
                      <div className="flex items-center mb-4">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= course.averageRating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          {course.averageRating.toFixed(1)} ({course.reviews?.length || 0})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">
                        {course.price === 0 ? 'Free' : `₹${course.price}`}
                      </div>
                      {course.price > 0 && course.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">
                          ₹{course.originalPrice}
                        </div>
                      )}
                    </div>
                  </div>
                </MeritaiCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or browse all courses.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedGrade('')
                  setSelectedSubject('')
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View All Courses
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
