import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Search, BookOpen, Star, Filter, X } from 'lucide-react'
import { courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'
import MeritaiButton from '@/components/ui/MeritaiButton'
import Pagination from '@/components/common/Pagination'

export default function CourseListing() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // Show 12 courses per page

  // Set default grade to student's grade on mount
  useEffect(() => {
    if (user?.grade && !selectedGrade) {
      setSelectedGrade(user.grade.toString())
    }
  }, [user, selectedGrade])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGrade, selectedSubject])

  const { data: coursesData, isLoading, error, refetch } = useQuery(
    ['courses', {
      search: searchQuery,
      grade: selectedGrade,
      subject: selectedSubject,
      page: currentPage,
      limit: itemsPerPage
    }],
    () => courseService.getCourses({
      search: searchQuery,
      grade: selectedGrade,
      subject: selectedSubject,
      page: currentPage,
      limit: itemsPerPage
    }),
    { keepPreviousData: true }
  )

  const subjects = [
    'Mathematics', 'Science', 'English', 'Social Studies',
    'Physics', 'Chemistry', 'Biology', 'Computer Science'
  ]

  const grades = Array.from({ length: 12 }, (_, i) => i + 1)

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGrade('')
    setSelectedSubject('')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || selectedGrade || selectedSubject

  return (
    <>

    <SEOHead title="Course Listing - Student" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Gen-Z Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
          📚 Explore Courses
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          Find awesome courses to level up your skills! 🚀
        </p>
      </div>

      {/* Search and Filters with Gen-Z styling */}
      <div className="genz-card-glass p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-emerald-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
            <input
              type="text"
              placeholder="Search for amazing courses... 🔍"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="genz-input pl-10 w-full min-h-[44px] text-sm sm:text-base"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            Filters ✨
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="input-field w-full min-h-[44px] text-sm sm:text-base"
                >
                  <option value="">All Grades</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="input-field w-full min-h-[44px] text-sm sm:text-base"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 min-h-[44px] px-2 py-1"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : error ? (
        <ErrorMessage message={error.message || 'Failed to load courses'} onRetry={refetch} />
      ) : !coursesData?.courses?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try adjusting your search or filters"
          action={
            hasActiveFilters && (
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {coursesData.courses.map((course) => (
            <div
              key={course._id}
              onClick={() => navigate(`/student/courses/${course._id}`)}
              className="genz-card hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Gradient Top Bar */}
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              
              {/* Course Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="genz-badge genz-badge-purple text-xs">
                        Grade {course.grade}
                      </span>
                      <span className="genz-badge genz-badge-blue text-xs">
                        {course.subject}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>

                {/* Course Stats with Gen-Z styling */}
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm mb-4">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <span className="font-semibold">{course.averageRating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-semibold">{course.questionCount || 0}</span>
                  </div>
                  {course.level && (
                    <span className="genz-badge genz-badge-green text-xs capitalize">
                      {course.level}
                    </span>
                  )}
                </div>

                {/* Action Button with Gen-Z styling */}
                <div className="pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/student/courses/${course._id}`)
                    }}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                  >
                    View Details 🚀
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      {coursesData?.courses?.length > 0 && (
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, coursesData.total || coursesData.courses.length)} of {coursesData.total || coursesData.courses.length} course{coursesData.total !== 1 ? 's' : ''}
        </div>
      )}

      {/* Pagination */}
      {coursesData?.pages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={coursesData.pages}
          onPageChange={setCurrentPage}
          className="mt-6 sm:mt-8"
        />
      )}
    </div>


    </>)
}
