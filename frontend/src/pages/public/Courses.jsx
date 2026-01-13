import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function Courses() {
  const navigate = useNavigate()
  const [groupedCourses, setGroupedCourses] = useState({})
  const [filteredGroups, setFilteredGroups] = useState({})
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')

  const { data: courses, isLoading, error } = useQuery('courses', courseService.getPublicCourses)

  useEffect(() => {
    if (courses) {
      const grouped = courses.reduce((acc, course) => {
        const key = `Grade ${course.grade} - ${course.subject}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(course)
        return acc
      }, {})
      setGroupedCourses(grouped)
      setFilteredGroups(grouped)
    }
  }, [courses])

  useEffect(() => {
    let filtered = { ...groupedCourses }

    if (selectedGrade) {
      filtered = Object.keys(filtered).reduce((acc, key) => {
        if (key.includes(`Grade ${selectedGrade}`)) {
          acc[key] = filtered[key]
        }
        return acc
      }, {})
    }

    if (selectedSubject) {
      filtered = Object.keys(filtered).reduce((acc, key) => {
        if (key.includes(`- ${selectedSubject}`)) {
          acc[key] = filtered[key]
        }
        return acc
      }, {})
    }

    setFilteredGroups(filtered)
  }, [groupedCourses, selectedGrade, selectedSubject])

  // Get unique grades and subjects for filter options
  const availableGrades = [...new Set(courses?.map(course => course.grade) || [])].sort((a, b) => a - b)
  const availableSubjects = [...new Set(courses?.map(course => course.subject) || [])].sort()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Failed to load courses" />

  const handleGroupClick = (groupKey) => {
    // Extract grade and subject from groupKey (format: "Grade X - Subject")
    const match = groupKey.match(/Grade (\d+) - (.+)/)
    if (match) {
      const grade = match[1]
      const subject = match[2]
      navigate(`/courses/${grade}/${subject}`)
    }
  }

  const clearFilters = () => {
    setSelectedGrade('')
    setSelectedSubject('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Explore Our Courses
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Discover comprehensive learning paths designed by expert educators to help you excel in your academic journey
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Courses</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="grade-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    id="grade-filter"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  >
                    <option value="">All Grades</option>
                    {availableGrades.map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject-filter"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  >
                    <option value="">All Subjects</option>
                    {availableSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Clear All Filters
                  </button>
                </div>

                {/* Active Filters Display */}
                {(selectedGrade || selectedSubject) && (
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500 block mb-3">Active filters:</span>
                    <div className="space-y-2">
                      {selectedGrade && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-200">
                          Grade {selectedGrade}
                          <button
                            onClick={() => setSelectedGrade('')}
                            className="ml-2 text-primary-500 hover:text-primary-700 text-lg leading-none"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {selectedSubject && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-200">
                          {selectedSubject}
                          <button
                            onClick={() => setSelectedSubject('')}
                            className="ml-2 text-primary-500 hover:text-primary-700 text-lg leading-none"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600 font-medium">
                Showing <span className="text-primary-600">{Object.keys(filteredGroups).length}</span> course categor{Object.keys(filteredGroups).length !== 1 ? 'ies' : 'y'}
                {selectedGrade && <span> for <span className="text-primary-600">Grade {selectedGrade}</span></span>}
                {selectedSubject && <span> in <span className="text-primary-600">{selectedSubject}</span></span>}
              </p>
            </div>

            {/* Course Categories Grid */}
            {Object.keys(filteredGroups).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No courses match your current filters. Try adjusting your search criteria.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(filteredGroups).map(([groupKey, coursesInGroup]) => (
                  <div
                    key={groupKey}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                  >
                    <div
                      className="p-6 cursor-pointer hover:bg-gradient-to-br hover:from-primary-50 hover:to-white transition-all duration-300"
                      onClick={() => handleGroupClick(groupKey)}
                    >
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                        <span className="text-xl">📖</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{groupKey}</h3>
                      <p className="text-gray-600 mb-4">
                        <span className="font-semibold text-primary-600">{coursesInGroup.length}</span> course{coursesInGroup.length !== 1 ? 's' : ''} available
                      </p>
                      <div className="flex items-center text-primary-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                        <span className="text-sm">Explore courses</span>
                        <svg
                          className="ml-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
