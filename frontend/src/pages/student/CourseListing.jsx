import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Search, BookOpen, Star, Filter, X } from 'lucide-react'
import { courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'

export default function CourseListing() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Set default grade to student's grade on mount
  useEffect(() => {
    if (user?.grade && !selectedGrade) {
      setSelectedGrade(user.grade.toString())
    }
  }, [user, selectedGrade])

  const { data: coursesData, isLoading, error, refetch } = useQuery(
    ['courses', { search: searchQuery, grade: selectedGrade, subject: selectedSubject }],
    () => courseService.getCourses({ 
      search: searchQuery, 
      grade: selectedGrade, 
      subject: selectedSubject 
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
  }

  const hasActiveFilters = searchQuery || selectedGrade || selectedSubject

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Browse Courses</h1>
        <p className="text-gray-600 text-sm sm:text-base">Find the perfect course to enhance your learning journey</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full min-h-[44px] text-sm sm:text-base"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap min-h-[44px] px-4"
          >
            <Filter className="w-4 h-4" />
            Filters
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
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Course Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Grade {course.grade} • {course.subject}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    <span>{course.averageRating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="text-gray-500">
                    {course.level && <span className="capitalize">{course.level}</span>}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/student/courses/${course._id}`)
                    }}
                    className="btn-primary text-xs sm:text-sm w-full min-h-[36px] sm:min-h-[40px]"
                  >
                    View Details
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
          Showing {coursesData.courses.length} course{coursesData.courses.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
