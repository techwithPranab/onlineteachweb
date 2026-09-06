import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Edit, Eye, FileText, Filter, Search } from 'lucide-react'
import SEOHead from '@/components/SEO/SEOHead'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import { adminService } from '@/services/apiServices'

const defaultFilters = {
  page: 1,
  limit: 10,
  search: '',
  grade: '',
  subject: '',
  courseId: '',
  chapter: '',
  type: '',
  difficulty: '',
  category: '',
  isActive: ''
}

const getId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value.$oid) return value.$oid
  if (value._id) return getId(value._id)
  return ''
}

export default function MaterialManagement() {
  const [filters, setFilters] = useState(defaultFilters)

  const { data: coursesData, isLoading: coursesLoading } = useQuery(
    ['adminMaterialCourseOptions'],
    () => adminService.getAdminCourses({ limit: 1000, page: 1 }),
    { staleTime: 5 * 60 * 1000 }
  )

  const { data, isLoading, error } = useQuery(
    ['adminMaterials', filters],
    () => adminService.getAdminMaterials(filters),
    { keepPreviousData: true }
  )

  const courses = coursesData?.courses || []
  const materials = data?.materials || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  const subjects = useMemo(() => (
    [...new Set(courses.map(course => course.subject).filter(Boolean))].sort()
  ), [courses])

  const grades = useMemo(() => (
    [...new Set(courses.map(course => course.grade).filter(Boolean))].sort((a, b) => a - b)
  ), [courses])

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      if (filters.grade && String(course.grade) !== String(filters.grade)) return false
      if (filters.subject && course.subject !== filters.subject) return false
      return true
    })
  }, [courses, filters.grade, filters.subject])

  const selectedCourse = courses.find(course => getId(course) === filters.courseId)
  const chapters = selectedCourse?.chapters || []

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
      ...(key === 'grade' || key === 'subject' ? { courseId: '', chapter: '' } : {}),
      ...(key === 'courseId' ? { chapter: '' } : {})
    }))
  }

  const resetFilters = () => setFilters(defaultFilters)

  if (isLoading && !data) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message || 'Failed to load materials'} />

  return (
    <>
      <SEOHead title="Material Management - Admin" noIndex={true} noFollow={true} />

      <div className="p-4 space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Material Management</h1>
            <p className="text-gray-600 mt-1">
              Search, review, edit and preview study materials by grade, subject, course and chapter.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
            <FileText className="inline h-4 w-4 mr-1" />
            {total} material{total === 1 ? '' : 's'} found
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Search Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search material text</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  value={filters.search}
                  onChange={(event) => handleFilterChange('search', event.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Title, description, tag or content"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select value={filters.grade} onChange={(event) => handleFilterChange('grade', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">All grades</option>
                {grades.map(grade => <option key={grade} value={grade}>Grade {grade}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select value={filters.subject} onChange={(event) => handleFilterChange('subject', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">All subjects</option>
                {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select value={filters.courseId} onChange={(event) => handleFilterChange('courseId', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">All matching courses</option>
                {filteredCourses.map(course => (
                  <option key={getId(course)} value={getId(course)}>
                    Grade {course.grade} • {course.subject} • {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
              <select value={filters.chapter} onChange={(event) => handleFilterChange('chapter', event.target.value)} disabled={!filters.courseId} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100">
                <option value="">{filters.courseId ? 'All chapters' : 'Select course first'}</option>
                {chapters.map(chapter => <option key={chapter.name} value={chapter.name}>{chapter.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={filters.difficulty} onChange={(event) => handleFilterChange('difficulty', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">All difficulties</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select value={filters.type} onChange={(event) => handleFilterChange('type', event.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">All types</option>
              <option value="article">Article</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="ppt">PPT</option>
              <option value="document">Document</option>
              <option value="image">Image</option>
              <option value="link">Link</option>
            </select>

            <select value={filters.category} onChange={(event) => handleFilterChange('category', event.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">All categories</option>
              <option value="lesson">Lesson</option>
              <option value="worked-example">Worked Example</option>
              <option value="worksheet">Worksheet</option>
              <option value="practice-quiz">Practice Quiz</option>
              <option value="reference">Reference</option>
              <option value="interactive">Interactive</option>
            </select>

            <select value={filters.isActive} onChange={(event) => handleFilterChange('isActive', event.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Any status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button onClick={resetFilters} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">
              Reset
            </button>

            {coursesLoading && <span className="text-sm text-gray-500">Loading filter options...</span>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Difficulty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                      No materials match the selected filters.
                    </td>
                  </tr>
                ) : materials.map(material => (
                  <tr key={getId(material)} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{material.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{material.description}</div>
                      {Array.isArray(material.tags) && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {material.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <div className="font-medium">{material.course?.title || 'No course'}</div>
                      <div className="text-gray-500">Grade {material.course?.grade || '-'} • {material.course?.subject || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{material.type}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">{material.difficulty}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {material.updatedAt ? new Date(material.updatedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/materials/${getId(material)}/edit`} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                        <Link to={`/admin/materials/${getId(material)}/edit?preview=1`} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">
                          <Eye className="h-4 w-4" />
                          Preview
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {filters.page} of {pages}
            </p>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => handleFilterChange('page', filters.page - 1)} className="px-3 py-2 rounded-lg border disabled:opacity-40 text-sm">
                Previous
              </button>
              <button disabled={filters.page >= pages} onClick={() => handleFilterChange('page', filters.page + 1)} className="px-3 py-2 rounded-lg border disabled:opacity-40 text-sm">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
