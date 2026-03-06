import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  Download,
  RefreshCw,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage';

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];
const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Physics', 'Chemistry', 'Biology'];

export default function StudentPerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentModalTab, setStudentModalTab] = useState('overview');
  const [filters, setFilters] = useState({
    search: '',
    grade: '',
    subject: '',
    dateFrom: '',
    dateTo: '',
    minAccuracy: '',
    maxAccuracy: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Fetch students with filters
  const { data: studentsData, isLoading: loadingStudents, error: studentsError, refetch: refetchStudents } = useQuery(
    ['students', filters, page, limit],
    async () => {
      const params = {
        page,
        limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      };
      const response = await api.get('/admin/students', { params });
      return response.data;
    },
    { enabled: activeTab === 'students' }
  );

  // Fetch analytics
  const { data: analyticsData, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useQuery(
    ['analytics', filters],
    async () => {
      const params = {
        grade: filters.grade,
        subject: filters.subject,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      };
      const response = await api.get('/admin/performance/analytics', { params });
      return response.data;
    },
    { enabled: activeTab === 'analytics' }
  );

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: loadingLeaderboard, refetch: refetchLeaderboard } = useQuery(
    ['leaderboard', filters],
    async () => {
      const params = {
        grade: filters.grade,
        subject: filters.subject,
        limit: 50,
        metric: 'accuracy'
      };
      const response = await api.get('/admin/performance/leaderboard', { params });
      return response.data;
    },
    { enabled: activeTab === 'leaderboard' }
  );

  // Fetch individual student performance
  const { data: studentPerformanceData, isLoading: loadingStudentPerformance } = useQuery(
    ['studentPerformance', selectedStudent?._id],
    async () => {
      if (!selectedStudent?._id) return null;
      const response = await api.get(`/admin/students/${selectedStudent._id}/performance`);
      return response.data;
    },
    { enabled: !!selectedStudent && showStudentModal }
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    if (activeTab === 'students') refetchStudents();
    else if (activeTab === 'analytics') refetchAnalytics();
    else if (activeTab === 'leaderboard') refetchLeaderboard();
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      grade: '',
      subject: '',
      dateFrom: '',
      dateTo: '',
      minAccuracy: '',
      maxAccuracy: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPage(1);
    if (activeTab === 'students') refetchStudents();
    else if (activeTab === 'analytics') refetchAnalytics();
    else if (activeTab === 'leaderboard') refetchLeaderboard();
  };

  const handleExport = async (format = 'json') => {
    try {
      const params = {
        grade: filters.grade,
        subject: filters.subject,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        format
      };

      const response = await api.get('/admin/performance/export', {
        params,
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `student-performance-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `student-performance-${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const handleCloseModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    setStudentModalTab('overview');
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-green-600 bg-green-100';
    if (accuracy >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Tab rendering functions
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Student Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Name:</span>
            <span className="ml-2 font-medium">{studentPerformanceData.student?.name}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Email:</span>
            <span className="ml-2 font-medium">{studentPerformanceData.student?.email}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Grade:</span>
            <span className="ml-2 font-medium">{studentPerformanceData.student?.grade || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              studentPerformanceData.student?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {studentPerformanceData.student?.status || 'active'}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      {studentPerformanceData.performance && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Performance Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {studentPerformanceData.performance.totalQuizzesTaken || 0}
              </div>
              <div className="text-sm text-gray-600">Total Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {studentPerformanceData.performance.totalQuestionsAttempted || 0}
              </div>
              <div className="text-sm text-gray-600">Questions Attempted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {(studentPerformanceData.performance.overallAccuracy || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(studentPerformanceData.performance.averageScore || 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Quiz Results */}
      {studentPerformanceData.recentQuizzes && studentPerformanceData.recentQuizzes.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <h4 className="font-semibold text-gray-900 p-4 bg-gray-50 border-b">Recent Quiz Results</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studentPerformanceData.recentQuizzes.slice(0, 5).map((quiz, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {quiz.quizId?.title || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {quiz.courseId?.title || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {quiz.score || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccuracyColor(quiz.accuracy || 0)}`}>
                        {(quiz.accuracy || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubjectsTab = () => (
    <div className="space-y-6">
      {/* Subject-wise Performance */}
      {studentPerformanceData.performance?.bySubject && studentPerformanceData.performance.bySubject.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <h4 className="font-semibold text-gray-900 p-4 bg-gray-50 border-b">Subject-wise Performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Quizzes</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Questions</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studentPerformanceData.performance.bySubject.map((subject, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {subject.subject}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {subject.quizzesTaken || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {subject.questionsAttempted || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccuracyColor(subject.accuracy || 0)}`}>
                        {(subject.accuracy || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {(subject.averageScore || 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        {(subject.accuracy || 0) >= 80 && <span className="text-green-500">⭐ Excellent</span>}
                        {(subject.accuracy || 0) >= 60 && (subject.accuracy || 0) < 80 && <span className="text-yellow-500">👍 Good</span>}
                        {(subject.accuracy || 0) < 60 && <span className="text-red-500">⚠️ Needs Improvement</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No subject-wise performance data available.</p>
        </div>
      )}
    </div>
  );

  const renderImprovementTab = () => {
    const weakAreas = studentPerformanceData.performance?.weakAreas || [];
    const strongAreas = studentPerformanceData.performance?.strongAreas || [];
    
    return (
      <>
    
      <SEOHead title="Student Performance Dashboard - Admin" noIndex={true} noFollow={true} />
    
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-2">Areas Needing Improvement</h4>
          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.map((subject, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{subject.subject}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getAccuracyColor(subject.accuracy || 0)}`}>
                      {(subject.accuracy || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>• Current accuracy: {(subject.accuracy || 0).toFixed(1)}%</p>
                    <p>• Quizzes taken: {subject.quizzesTaken || 0}</p>
                    <p>• Average score: {(subject.averageScore || 0).toFixed(1)}</p>
                  </div>
                  <div className="mt-2 text-sm text-blue-600">
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Focus on practicing more questions in this subject</li>
                      <li>Review fundamental concepts</li>
                      <li>Take additional quizzes to improve accuracy</li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-700">Great job! No major improvement areas identified. Keep up the good work!</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Strength Areas</h4>
          {strongAreas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strongAreas.map((subject, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{subject.subject}</span>
                    <span className="text-green-600 font-semibold">
                      {(subject.accuracy || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Keep working to build strong foundations in all subjects.</p>
          )}
        </div>
      </div>

    
      </>);
  };

  const renderWeeklyTab = () => {
    const weeklyData = studentPerformanceData.performance?.weeklyData || [];

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-4">Weekly Topic Performance</h4>
          
          {weeklyData.length > 0 ? (
            <div className="space-y-4">
              {weeklyData.map((week, index) => (
                <div key={index} className="bg-white p-4 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{week.week}: Performance Overview</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getAccuracyColor(week.accuracy)}`}>
                      {week.accuracy}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>• Weekly accuracy: {week.accuracy}%</p>
                    <p>• Quizzes completed: {week.quizzes}</p>
                    <p>• Topics covered: Algebra, Geometry, Problem Solving</p>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{width: `${week.accuracy}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Week 1: Basic Algebra</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">85%</span>
                </div>
                <div className="text-sm text-gray-600">
                  Topics: Linear equations, Basic operations, Simple word problems
                </div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Week 2: Geometry Fundamentals</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">72%</span>
                </div>
                <div className="text-sm text-gray-600">
                  Topics: Shapes, Angles, Perimeter, Area calculations
                </div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Week 3: Fractions & Decimals</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">65%</span>
                </div>
                <div className="text-sm text-gray-600">
                  Topics: Fraction operations, Decimal conversion, Mixed numbers
                </div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Week 4: Data Interpretation</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">88%</span>
                </div>
                <div className="text-sm text-gray-600">
                  Topics: Charts, Graphs, Mean/Median/Mode, Probability basics
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMetricsTab = () => {
    const metrics = studentPerformanceData.performance?.metrics || {};
    const weeklyData = studentPerformanceData.performance?.weeklyData || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detailed Performance Metrics */}
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Study Time</span>
                <span className="font-medium">{Math.round((metrics.totalStudyTime || 0) / 60)} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Time per Question</span>
                <span className="font-medium">{metrics.averageTimePerQuestion || 0} seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Quizzes</span>
                <span className="font-medium">{metrics.totalQuizzes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Questions</span>
                <span className="font-medium">{metrics.totalQuestions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overall Accuracy</span>
                <span className="font-medium">{(metrics.overallAccuracy || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className="font-medium">{(metrics.averageScore || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Difficulty Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Easy Questions</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Medium Questions</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '70%'}}></div>
                  </div>
                  <span className="text-sm font-medium">70%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hard Questions</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: '55%'}}></div>
                  </div>
                  <span className="text-sm font-medium">55%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Olympiad Questions</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '40%'}}></div>
                  </div>
                  <span className="text-sm font-medium">40%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Weekly Progress</h4>
          {weeklyData.length > 0 ? (
            <div className="h-48 flex items-end justify-center space-x-4">
              {weeklyData.map((week, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-500 w-8 rounded-t"
                    style={{height: `${week.accuracy * 1.2}px`}}
                  ></div>
                  <span className="text-xs text-gray-600 mt-2">{week.week}</span>
                  <span className="text-xs font-medium text-gray-900">{week.accuracy}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No weekly data available yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 'students' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Student Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Name or Email"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
          <select
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Grades</option>
            {GRADES.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={handleApplyFilters}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleResetFilters}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );

  const renderStudentsList = () => {
    if (loadingStudents) return <LoadingSpinner />;
    if (studentsError) return <ErrorMessage message="Failed to load students" />;

    const students = studentsData?.students || [];
    const total = studentsData?.total || 0;
    const totalPages = studentsData?.pages || 1;

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Students Performance</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={refetchStudents}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quizzes
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {student.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {student.performance?.totalQuizzesTaken || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {student.performance?.totalQuestionsAttempted || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccuracyColor(student.performance?.overallAccuracy || 0)}`}>
                        {(student.performance?.overallAccuracy || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {(student.performance?.averageScore || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-1 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (loadingAnalytics) return <LoadingSpinner />;
    if (!analyticsData) return null;

    const analytics = analyticsData.analytics;

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.overall?.totalStudents || 0}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Accuracy</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(analytics.overall?.avgAccuracy || 0).toFixed(1)}%
                </p>
              </div>
              <Target className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Quizzes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.overall?.totalQuizzes || 0}
                </p>
              </div>
              <BookOpen className="w-12 h-12 text-indigo-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(analytics.overall?.avgScore || 0).toFixed(1)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Subject-wise Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.bySubject || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgAccuracy" fill="#3b82f6" name="Avg Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byGrade?.map(g => ({ ...g, grade: `Grade ${g._id}` })) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="studentCount" fill="#ef4444" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Accuracy Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.accuracyDistribution?.map((d, idx) => ({
                    name: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'][idx],
                    value: d.count
                  })) || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.accuracyDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.recentActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quizCount" stroke="#10b981" name="Quiz Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Top Performers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quizzes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topPerformers?.slice(0, 10).map((student, index) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Award
                            className={`w-5 h-5 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              'text-amber-700'
                            }`}
                          />
                        )}
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {student.overallAccuracy.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {student.totalQuizzesTaken}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    if (loadingLeaderboard) return <LoadingSpinner />;
    if (!leaderboardData) return null;

    const leaderboard = leaderboardData.leaderboard || [];

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Performance Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quizzes
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                leaderboard.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {student.rank <= 3 && (
                          <Award
                            className={`w-5 h-5 ${
                              student.rank === 1 ? 'text-yellow-500' :
                              student.rank === 2 ? 'text-gray-400' :
                              'text-amber-700'
                            }`}
                          />
                        )}
                        <span className="text-sm font-medium">{student.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                      <div className="text-sm text-gray-500">{student.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccuracyColor(student.overallAccuracy || 0)}`}>
                        {(student.overallAccuracy || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {(student.averageScore || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {student.totalQuizzesTaken || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {student.totalQuestionsAttempted || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Performance Dashboard</h1>
        <p className="text-gray-600">Monitor and analyze student performance across grades and subjects</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Students List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics & Charts
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leaderboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Leaderboard
          </button>
        </nav>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Content */}
      {activeTab === 'students' && renderStudentsList()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'leaderboard' && renderLeaderboard()}

      {/* Student Performance Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Student Performance Details - {selectedStudent?.name}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setStudentModalTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      studentModalTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setStudentModalTab('subjects')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      studentModalTab === 'subjects'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Subject Performance
                  </button>
                  <button
                    onClick={() => setStudentModalTab('improvement')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      studentModalTab === 'improvement'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Improvement Areas
                  </button>
                  <button
                    onClick={() => setStudentModalTab('weekly')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      studentModalTab === 'weekly'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Weekly Topics
                  </button>
                  <button
                    onClick={() => setStudentModalTab('metrics')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      studentModalTab === 'metrics'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Performance Metrics
                  </button>
                </nav>
              </div>

              {loadingStudentPerformance ? (
                <LoadingSpinner />
              ) : studentPerformanceData ? (
                <div className="space-y-6">
                  {/* Tab Content */}
                  {studentModalTab === 'overview' && renderOverviewTab()}
                  {studentModalTab === 'subjects' && renderSubjectsTab()}
                  {studentModalTab === 'improvement' && renderImprovementTab()}
                  {studentModalTab === 'weekly' && renderWeeklyTab()}
                  {studentModalTab === 'metrics' && renderMetricsTab()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No performance data available for this student.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

