import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const createAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Question Import/Export Service
 */
const questionExportService = {
  /**
   * Export questions to JSON
   * @param {Object} filters - Filter options
   * @returns {Promise<Blob>} - JSON file blob
   */
  exportJSON: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.topic) params.append('topic', filters.topic);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.questionTypes) params.append('questionTypes', filters.questionTypes.join(','));
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await axios.get(
      `${API_URL}/questions/export/json?${params.toString()}`,
      {
        ...createAuthConfig(),
        responseType: 'blob'
      }
    );
    
    return response.data;
  },
  
  /**
   * Export questions to CSV
   * @param {Object} filters - Filter options
   * @returns {Promise<Blob>} - CSV file blob
   */
  exportCSV: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.topic) params.append('topic', filters.topic);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.questionTypes) params.append('questionTypes', filters.questionTypes.join(','));
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await axios.get(
      `${API_URL}/questions/export/csv?${params.toString()}`,
      {
        ...createAuthConfig(),
        responseType: 'blob'
      }
    );
    
    return response.data;
  },
  
  /**
   * Get import template
   * @returns {Promise<Object>} - Template with sample data
   */
  getImportTemplate: async () => {
    const response = await axios.get(
      `${API_URL}/questions/import/template`,
      createAuthConfig()
    );
    return response.data;
  },
  
  /**
   * Validate import data before importing
   * @param {Array} questions - Questions to validate
   * @returns {Promise<Object>} - Validation results
   */
  validateImportData: async (questions) => {
    const response = await axios.post(
      `${API_URL}/questions/import/validate`,
      { questions },
      createAuthConfig()
    );
    return response.data;
  },
  
  /**
   * Import questions to a course
   * @param {string} courseId - Target course ID
   * @param {Array} questions - Questions to import
   * @param {boolean} skipDuplicates - Whether to skip duplicate questions
   * @returns {Promise<Object>} - Import results
   */
  importQuestions: async (courseId, questions, skipDuplicates = true) => {
    const response = await axios.post(
      `${API_URL}/questions/import/${courseId}`,
      { questions, skipDuplicates },
      createAuthConfig()
    );
    return response.data;
  },
  
  /**
   * Download exported file
   * @param {Blob} blob - File blob
   * @param {string} filename - File name
   */
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  
  /**
   * Parse uploaded JSON file
   * @param {File} file - JSON file
   * @returns {Promise<Object>} - Parsed data
   */
  parseJSONFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
  
  /**
   * Parse uploaded CSV file
   * @param {File} file - CSV file
   * @returns {Promise<Array>} - Parsed questions
   */
  parseCSVFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          const questions = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = parseCSVLine(lines[i]);
            const question = {};
            
            headers.forEach((header, index) => {
              const value = values[index]?.trim();
              
              switch (header) {
                case 'Question Text':
                  question.questionText = value;
                  break;
                case 'Question Type':
                  question.questionType = value;
                  break;
                case 'Difficulty':
                  question.difficulty = value;
                  break;
                case 'Topic':
                  question.topic = value;
                  break;
                case 'Sub Topic':
                  question.subTopic = value;
                  break;
                case 'Options (pipe separated)':
                  if (value) {
                    question.options = value.split('|').map((text, idx) => ({
                      text: text.trim(),
                      isCorrect: false
                    }));
                  }
                  break;
                case 'Correct Answer':
                  question.correctAnswer = value;
                  break;
                case 'Correct Answer Index':
                  question.correctAnswerIndex = parseInt(value) || 0;
                  if (question.options) {
                    question.options[question.correctAnswerIndex].isCorrect = true;
                  }
                  break;
                case 'Explanation':
                  question.explanation = value;
                  break;
                case 'Points':
                  question.points = parseInt(value) || 1;
                  break;
                case 'Tags (comma separated)':
                  question.tags = value ? value.split(',').map(t => t.trim()) : [];
                  break;
              }
            });
            
            if (question.questionText) {
              questions.push(question);
            }
          }
          
          resolve(questions);
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  
  return values;
}

export default questionExportService;
