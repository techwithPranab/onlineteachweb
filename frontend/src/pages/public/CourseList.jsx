import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { BookOpen, Star, ArrowLeft } from 'lucide-react'
import { courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function CourseList() {
  const navigate = useNavigate()
  const { grade, subject } = useParams()
  const [filteredCourses, setFilteredCourses] = useState([])

  const { data: courses, isLoading, error } = useQuery('courses', courseService.getPublicCourses)

  useEffect(() => {
    if (courses && grade && subject) {
      const filtered = courses.filter(course =>
        course.grade === parseInt(grade) && course.subject === subject
      )
      setFilteredCourses(filtered)
    }
  }, [courses, grade, subject])

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Failed to load courses" />

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Course Categories
          </button>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Grade {grade} - {subject}
          </h1>
          <p className="text-lg text-gray-600">
            Explore our <span className="font-semibold text-primary-600">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''} in {subject}
          </p>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No courses found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">There are no courses available for this category yet.</p>
            <Link
              to="/courses"
              className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg inline-block"
            >
              Browse Other Categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                onClick={() => navigate(`/course/${course._id}`)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 group"
              >
                {/* Course Header */}
                <div className="p-8">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Grade {course.grade} • {course.subject}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Tutor Info */}
                  {course.tutor && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {course.tutor.name?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">{course.tutor.name}</p>
                        <p className="text-gray-500 text-xs">Instructor</p>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{course.averageRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.enrolledStudents?.length || 0} students</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/course/${course._id}`)
                      }}
                      className="btn-primary text-sm"
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
        {filteredCourses.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
