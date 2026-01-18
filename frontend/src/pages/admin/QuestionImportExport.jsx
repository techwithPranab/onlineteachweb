import { useState, useRef } from 'react';
import { useQuery } from 'react-query';
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { courseService } from '@/services/apiServices';
import questionExportService from '@/services/questionExportService';

export default function QuestionImportExport() {
  const [activeTab, setActiveTab] = useState('export');
  const [exportFormat, setExportFormat] = useState('json');
  const [exportFilters, setExportFilters] = useState({
    courseId: '',
    topic: '',
    difficulty: '',
    questionTypes: [],
    limit: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Import state
  const [importCourseId, setImportCourseId] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showTemplate, setShowTemplate] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Fetch courses
  const { data: coursesData } = useQuery(
    'tutorCourses',
    () => courseService.getCourses({ status: 'published' })
  );
  
  const courses = coursesData?.courses || coursesData?.data || [];
  
  const questionTypes = [
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
    { value: 'numerical', label: 'Numerical' },
    { value: 'text', label: 'Short Answer' }
  ];
  
  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      let blob;
      let filename;
      
      if (exportFormat === 'json') {
        blob = await questionExportService.exportJSON(exportFilters);
        filename = `questions_export_${Date.now()}.json`;
      } else {
        blob = await questionExportService.exportCSV(exportFilters);
        filename = `questions_export_${Date.now()}.csv`;
      }
      
      questionExportService.downloadFile(blob, filename);
      setExportSuccess(true);
      
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export questions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportFile(file);
    setParsedQuestions([]);
    setValidationResults(null);
    setImportResults(null);
    
    try {
      let questions;
      
      if (file.name.endsWith('.json')) {
        const data = await questionExportService.parseJSONFile(file);
        questions = data.questions || data;
      } else if (file.name.endsWith('.csv')) {
        questions = await questionExportService.parseCSVFile(file);
      } else {
        alert('Please select a JSON or CSV file');
        return;
      }
      
      if (!Array.isArray(questions)) {
        throw new Error('Invalid file format');
      }
      
      setParsedQuestions(questions);
    } catch (error) {
      console.error('Parse error:', error);
      alert('Failed to parse file: ' + error.message);
    }
  };
  
  const handleValidate = async () => {
    if (parsedQuestions.length === 0) return;
    
    setIsValidating(true);
    
    try {
      const results = await questionExportService.validateImportData(parsedQuestions);
      setValidationResults(results.validationResults);
    } catch (error) {
      console.error('Validation error:', error);
      alert('Failed to validate questions');
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleImport = async () => {
    if (!importCourseId || parsedQuestions.length === 0) {
      alert('Please select a course and upload a file');
      return;
    }
    
    setIsImporting(true);
    
    try {
      const results = await questionExportService.importQuestions(
        importCourseId,
        parsedQuestions,
        skipDuplicates
      );
      setImportResults(results.results);
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import questions: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleDownloadTemplate = async () => {
    try {
      const template = await questionExportService.getImportTemplate();
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      questionExportService.downloadFile(blob, 'question_import_template.json');
    } catch (error) {
      console.error('Template download error:', error);
      alert('Failed to download template');
    }
  };
  
  const resetImport = () => {
    setImportFile(null);
    setParsedQuestions([]);
    setValidationResults(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import / Export Questions</h1>
        <p className="text-gray-600 mt-1">
          Export your question bank or import questions from JSON/CSV files
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('export')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'export'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Download className="w-4 h-4 inline-block mr-2" />
          Export Questions
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="w-4 h-4 inline-block mr-2" />
          Import Questions
        </button>
      </div>
      
      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course (Optional)
              </label>
              <select
                value={exportFilters.courseId}
                onChange={(e) => setExportFilters(prev => ({ ...prev, courseId: e.target.value }))}
                className="input"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty (Optional)
              </label>
              <select
                value={exportFilters.difficulty}
                onChange={(e) => setExportFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="input"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            {/* Topic Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic (Optional)
              </label>
              <input
                type="text"
                value={exportFilters.topic}
                onChange={(e) => setExportFilters(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Filter by topic..."
                className="input"
              />
            </div>
            
            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit (Optional)
              </label>
              <input
                type="number"
                value={exportFilters.limit}
                onChange={(e) => setExportFilters(prev => ({ ...prev, limit: e.target.value }))}
                placeholder="Max questions to export"
                className="input"
                min="1"
              />
            </div>
          </div>
          
          {/* Question Types */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Types (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {questionTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    setExportFilters(prev => ({
                      ...prev,
                      questionTypes: prev.questionTypes.includes(type.value)
                        ? prev.questionTypes.filter(t => t !== type.value)
                        : [...prev.questionTypes, type.value]
                    }));
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    exportFilters.questionTypes.includes(type.value)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Export Format */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={() => setExportFormat('json')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <FileJson className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium">JSON</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">CSV</span>
              </label>
            </div>
          </div>
          
          {/* Export Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn-primary flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Questions
                </>
              )}
            </button>
            
            {exportSuccess && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Export successful!
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Import Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Import Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload a JSON or CSV file containing questions</li>
                  <li>Each question must have at least: questionText, questionType</li>
                  <li>Validate your data before importing</li>
                  <li>Duplicate questions (same text) can be skipped</li>
                </ul>
                <button
                  onClick={handleDownloadTemplate}
                  className="mt-2 text-blue-700 hover:text-blue-900 underline font-medium"
                >
                  Download Template File
                </button>
              </div>
            </div>
          </div>
          
          {/* Course Selection */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Course</h3>
            <select
              value={importCourseId}
              onChange={(e) => setImportCourseId(e.target.value)}
              className="input max-w-md"
            >
              <option value="">Select a course...</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.title} (Grade {course.grade})
                </option>
              ))}
            </select>
          </div>
          
          {/* File Upload */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Upload File</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {importFile ? importFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">JSON or CSV files only</p>
              </label>
            </div>
            
            {parsedQuestions.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 inline-block text-green-500 mr-1" />
                  {parsedQuestions.length} questions found
                </span>
                <button
                  onClick={resetImport}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 inline-block mr-1" />
                  Clear
                </button>
              </div>
            )}
          </div>
          
          {/* Validation */}
          {parsedQuestions.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Validate Data</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="btn-secondary flex items-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Validate Questions
                    </>
                  )}
                </button>
                
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  Skip duplicate questions
                </label>
              </div>
              
              {validationResults && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-green-600 font-medium">
                      ✓ {validationResults.valid} valid
                    </span>
                    {validationResults.invalid > 0 && (
                      <span className="text-red-600 font-medium">
                        ✗ {validationResults.invalid} invalid
                      </span>
                    )}
                  </div>
                  
                  {validationResults.errors.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {validationResults.errors.map((err, i) => (
                        <div key={i} className="text-sm bg-red-50 text-red-700 rounded p-2">
                          <span className="font-medium">Row {err.index + 1}:</span>{' '}
                          {err.errors.join(', ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Import Button */}
          {parsedQuestions.length > 0 && importCourseId && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Import</h3>
              
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="btn-primary flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {parsedQuestions.length} Questions
                  </>
                )}
              </button>
              
              {importResults && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Import Complete!</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ {importResults.imported} questions imported</li>
                    <li>○ {importResults.skipped} duplicates skipped</li>
                    {importResults.errors.length > 0 && (
                      <li className="text-red-600">
                        ✗ {importResults.errors.length} errors occurred
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Template Preview */}
          <div className="card p-6">
            <button
              onClick={() => setShowTemplate(!showTemplate)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900">JSON Format Reference</h3>
              {showTemplate ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {showTemplate && (
              <pre className="mt-4 bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`{
  "questions": [
    {
      "questionText": "What is 2 + 2?",
      "questionType": "mcq",
      "difficulty": "easy",
      "topic": "Arithmetic",
      "options": [
        { "text": "3", "isCorrect": false },
        { "text": "4", "isCorrect": true },
        { "text": "5", "isCorrect": false }
      ],
      "correctAnswer": "4",
      "correctAnswerIndex": 1,
      "explanation": "2 + 2 = 4",
      "points": 1
    }
  ]
}`}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
