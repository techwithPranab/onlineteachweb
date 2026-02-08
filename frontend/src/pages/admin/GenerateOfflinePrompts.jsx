import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import offlinePromptService from '../../services/offlinePromptService';
import { courseService, questionService } from '../../services/apiServices';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SEOHead from '../../components/SEO/SEOHead';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon as DownloadIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

export default function GenerateOfflinePrompts() {
  const queryClient = useQueryClient();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [selectedPromptText, setSelectedPromptText] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    grade: '',
    subject: '',
    courseId: '',
    chapterName: '',
    topic: '',
    difficultyLevel: '',
    status: ''
  });

  // Form state for generation
  const [formData, setFormData] = useState({
    grade: '',
    subject: '',
    courseId: '',
    chapterId: '',
    chapterName: '',
    topic: '',
    difficultyLevel: 'medium',
    questionType: 'mcq-single',
    questionsCount: 5,
    includeExplanations: true,
    includeHints: false,
    notes: ''
  });

  // Dropdown data
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);

  // Fetch filter values
  const { data: filterValues } = useQuery(
    'offlinePromptFilters',
    offlinePromptService.getFilterValues
  );

  // Fetch grades
  useQuery('grades', () => courseService.getGrades(), {
    onSuccess: (data) => {
      setGrades(data.grades || []);
    }
  });

  // Fetch subjects when grade is selected
  useQuery(
    ['subjects', formData.grade],
    () => courseService.getSubjectsByGrade(formData.grade),
    {
      enabled: !!formData.grade,
      onSuccess: (data) => {
        setSubjects(data.subjects || []);
      }
    }
  );

  // Fetch courses when grade and subject are selected
  useQuery(
    ['courses', formData.grade, formData.subject],
    () => courseService.getCoursesByGradeAndSubject(formData.grade, formData.subject),
    {
      enabled: !!formData.grade && !!formData.subject,
      onSuccess: (data) => {
        setCourses(data.courses || []);
      }
    }
  );

  // Fetch course structure when course is selected
  useQuery(
    ['courseStructure', formData.courseId],
    () => questionService.getCourseStructure(formData.courseId),
    {
      enabled: !!formData.courseId,
      onSuccess: (data) => {
        setChapters(data.chapters || []);
      }
    }
  );

  // Update topics when chapter is selected
  useEffect(() => {
    if (formData.chapterName && chapters.length > 0) {
      const selectedChapter = chapters.find(ch => ch.name === formData.chapterName);
      if (selectedChapter) {
        setTopics(selectedChapter.topics || []);
        // Also set the chapterId
        setFormData(prev => ({
          ...prev,
          chapterId: selectedChapter._id || ''
        }));
      }
    }
  }, [formData.chapterName, chapters]);

  // Fetch prompts
  const { data: promptsData, isLoading, refetch } = useQuery(
    ['offlinePrompts', filters, currentPage],
    () => offlinePromptService.getPrompts({
      ...filters,
      page: currentPage,
      limit: itemsPerPage
    }),
    {
      keepPreviousData: true
    }
  );

  // Generate prompt mutation
  const generateMutation = useMutation(
    offlinePromptService.generatePrompt,
    {
      onSuccess: (data) => {
        setSuccess('Prompt generated successfully!');
        setShowGenerateModal(false);
        queryClient.invalidateQueries('offlinePrompts');
        resetForm();
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to generate prompt');
        setTimeout(() => setError(null), 5000);
      }
    }
  );

  // Delete prompt mutation
  const deleteMutation = useMutation(
    offlinePromptService.deletePrompt,
    {
      onSuccess: () => {
        setSuccess('Prompt deleted successfully!');
        queryClient.invalidateQueries('offlinePrompts');
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to delete prompt');
        setTimeout(() => setError(null), 5000);
      }
    }
  );

  const resetForm = () => {
    setFormData({
      grade: '',
      subject: '',
      courseId: '',
      chapterId: '',
      chapterName: '',
      topic: '',
      difficultyLevel: 'medium',
      questionType: 'mcq-single',
      questionsCount: 5,
      includeExplanations: true,
      includeHints: false,
      notes: ''
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedPromptText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Reset dependent fields
    if (name === 'grade') {
      setFormData(prev => ({ ...prev, subject: '', courseId: '', chapterId: '', chapterName: '', topic: '' }));
      setSubjects([]);
      setCourses([]);
      setChapters([]);
      setTopics([]);
    } else if (name === 'subject') {
      setFormData(prev => ({ ...prev, courseId: '', chapterId: '', chapterName: '', topic: '' }));
      setCourses([]);
      setChapters([]);
      setTopics([]);
    } else if (name === 'courseId') {
      setFormData(prev => ({ ...prev, chapterId: '', chapterName: '', topic: '' }));
      setChapters([]);
      setTopics([]);
    } else if (name === 'chapterName') {
      setFormData(prev => ({ ...prev, chapterId: '', topic: '' }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      grade: '',
      subject: '',
      courseId: '',
      chapterId: '',
      chapterName: '',
      topic: '',
      difficultyLevel: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    generateMutation.mutate(formData);
  };

  const handleView = async (promptId) => {
    try {
      const response = await offlinePromptService.getPromptById(promptId);
      setSelectedPrompt(response.prompt);
      setShowViewModal(true);
    } catch (err) {
      setError('Failed to load prompt details');
    }
  };

  const handleViewPrompt = async (promptId) => {
    try {
      const response = await offlinePromptService.getPromptById(promptId);
      setSelectedPromptText(response.prompt.promptText);
      setShowPromptModal(true);
    } catch (err) {
      setError('Failed to load prompt text');
    }
  };

  const handleDownload = async (promptId, fileName) => {
    try {
      const response = await offlinePromptService.downloadPromptFile(promptId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('File downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to download file');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (promptId) => {
    if (window.confirm('Are you sure you want to delete this prompt? This will also delete the associated JSON file.')) {
      deleteMutation.mutate(promptId);
    }
  };

  const questionTypes = [
    { value: 'mcq-single', label: 'Multiple Choice (Single)' },
    { value: 'mcq-multiple', label: 'Multiple Choice (Multiple)' },
    { value: 'true-false', label: 'True/False' },
    { value: 'numerical', label: 'Numerical' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'long-answer', label: 'Long Answer' },
    { value: 'case-based', label: 'Case-Based' }
  ];

  const difficultyLevels = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  return (
    <>

    <SEOHead title="Generate Offline Prompts - Admin" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generate Offline Prompts</h1>
            <p className="mt-2 text-sm text-gray-600">
              Generate AI prompts for offline question generation with JSON output
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Generate New Prompt
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {Object.values(filters).some(v => v) && (
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-red-600 hover:text-red-700"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                name="grade"
                value={filters.grade}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Grades</option>
                {filterValues?.filters?.grades?.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Subjects</option>
                {filterValues?.filters?.subjects?.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                name="difficultyLevel"
                value={filters.difficultyLevel}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Levels</option>
                {difficultyLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                {filterValues?.filters?.statuses?.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input
                type="text"
                name="topic"
                value={filters.topic}
                onChange={handleFilterChange}
                placeholder="Search by topic..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Prompts Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course/Chapter/Topic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promptsData?.prompts?.length > 0 ? (
                promptsData.prompts.map((prompt) => (
                  <tr key={prompt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{prompt.courseName}</div>
                      <div className="text-xs text-gray-500">{prompt.grade} - {prompt.subject}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Chapter:</span> {prompt.chapterName}
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Topic:</span> {prompt.topic}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        prompt.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800' :
                        prompt.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {prompt.difficultyLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {prompt.questionType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <DocumentTextIcon className="h-5 w-5 inline mr-1" />
                      {prompt.fileName.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleView(prompt._id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleViewPrompt(prompt._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Prompt"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(prompt._id, prompt.fileName)}
                          className="text-green-600 hover:text-green-900"
                          title="Download JSON"
                        >
                          <DownloadIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prompt._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No prompts found. Generate your first prompt to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {promptsData?.pagination && promptsData.pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Page {promptsData.pagination.currentPage} of {promptsData.pagination.totalPages}
                {' '}({promptsData.pagination.totalItems} total)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= promptsData.pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Offline Prompt"
        size="large"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade <span className="text-red-500">*</span>
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Grade</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                disabled={!formData.grade}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                required
                disabled={!formData.subject}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter <span className="text-red-500">*</span>
              </label>
              <select
                name="chapterName"
                value={formData.chapterName}
                onChange={handleInputChange}
                required
                disabled={!formData.courseId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select Chapter</option>
                {chapters.map((chapter, idx) => (
                  <option key={idx} value={chapter.name}>{chapter.name}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-red-500">*</span>
              </label>
              <select
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                required
                disabled={!formData.chapterName}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select Topic</option>
                {topics.map((topic, idx) => (
                  <option key={idx} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {difficultyLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type <span className="text-red-500">*</span>
              </label>
              <select
                name="questionType"
                value={formData.questionType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Questions Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="questionsCount"
                value={formData.questionsCount}
                onChange={handleInputChange}
                min="1"
                max="50"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Options */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="includeExplanations"
                  checked={formData.includeExplanations}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Include Explanations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="includeHints"
                  checked={formData.includeHints}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Include Hints</span>
              </label>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Add any additional notes or instructions..."
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generateMutation.isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {generateMutation.isLoading ? 'Generating...' : 'Generate Prompt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="View Prompt Details"
        size="xlarge"
      >
        {selectedPrompt && (
          <div className="space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Course</p>
                <p className="font-medium">{selectedPrompt.courseName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grade & Subject</p>
                <p className="font-medium">{selectedPrompt.grade} - {selectedPrompt.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Chapter</p>
                <p className="font-medium">{selectedPrompt.chapterName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Topic</p>
                <p className="font-medium">{selectedPrompt.topic}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="font-medium capitalize">{selectedPrompt.difficultyLevel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Question Type</p>
                <p className="font-medium">{selectedPrompt.questionType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Questions Count</p>
                <p className="font-medium">{selectedPrompt.questionsCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">File Name</p>
                <p className="font-medium text-sm">{selectedPrompt.fileName}</p>
              </div>
            </div>

            {/* Prompt Text */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Prompt Text</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-sm whitespace-pre-wrap">{selectedPrompt.promptText}</pre>
              </div>
            </div>

            {/* Output Structure Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Output Structure</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-sm">{JSON.stringify(selectedPrompt.outputStructure, null, 2)}</pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => handleDownload(selectedPrompt._id, selectedPrompt.fileName)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <DownloadIcon className="h-5 w-5 mr-2" />
                Download JSON
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Prompt Modal */}
      <Modal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="View Prompt Text"
        size="xlarge"
      >
        {selectedPromptText && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">AI Prompt Text</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-sm whitespace-pre-wrap">{selectedPromptText}</pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
                <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>


    </>);
}
