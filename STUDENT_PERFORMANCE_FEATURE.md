# Student Performance Dashboard Feature

## Overview
A comprehensive admin dashboard for monitoring and analyzing student performance with advanced filtering, analytics, and export capabilities.

## Features Implemented

### 1. Backend Enhancements

#### New API Endpoints (`backend/routes/admin.routes.js`)

1. **GET /api/admin/students** (Enhanced)
   - Advanced filtering: grade, subject, date range, accuracy range
   - Server-side sorting: by name, accuracy, quizzes, creation date
   - Pagination support
   - Search by name/email

2. **GET /api/admin/performance/analytics**
   - Overall performance statistics
   - Subject-wise performance breakdown
   - Grade distribution analysis
   - Accuracy distribution (0-20%, 20-40%, 40-60%, 60-80%, 80-100%)
   - Top 10 performers
   - Recent activity (last 7 days)

3. **GET /api/admin/performance/leaderboard**
   - Ranked list of students by accuracy/quizzes/score
   - Filter by grade and subject
   - Configurable limit (default 50)
   - Medal indicators for top 3

4. **GET /api/admin/performance/export**
   - Export to CSV or JSON format
   - Filtered export based on grade, subject, date range
   - Comprehensive data including weak/strong areas

#### Controller Functions (`backend/controllers/admin.controller.js`)

- `getStudentsWithPerformance()` - Enhanced with advanced filters and ranking
- `getPerformanceAnalytics()` - Comprehensive analytics aggregation
- `getPerformanceLeaderboard()` - Ranked performance listing
- `exportPerformanceData()` - Data export in multiple formats
- `convertToCSV()` - Helper function for CSV conversion

### 2. Frontend Dashboard

#### Components (`frontend/src/pages/admin/StudentPerformanceDashboard.jsx`)

**Three Main Tabs:**

1. **Students List Tab**
   - Searchable, filterable table of all students
   - Display: Name, Email, Grade, Quizzes, Questions, Accuracy, Status
   - Color-coded accuracy badges (Red: <60%, Yellow: 60-80%, Green: 80%+)
   - Pagination controls
   - Real-time filtering

2. **Analytics & Charts Tab**
   - **Summary Cards:**
     - Total Students
     - Average Accuracy
     - Total Quizzes
     - Average Score
   
   - **Visual Charts:**
     - Subject-wise Performance (Bar Chart)
     - Grade Distribution (Bar Chart)
     - Accuracy Distribution (Pie Chart)
     - Recent Activity - Last 7 Days (Line Chart)
   
   - **Top Performers Table:**
     - Top 10 students by accuracy
     - Medal icons for top 3
     - Quick performance overview

3. **Leaderboard Tab**
   - Ranked list of top 50 students
   - Medal indicators for top 3
   - Detailed metrics per student
   - Filter by grade and subject

#### Filter Panel

**Available Filters:**
- Search (Name/Email) - Students list only
- Grade (1-12)
- Subject (Mathematics, Science, English, etc.)
- Date Range (From/To)
- Accuracy Range (Min/Max %) - Students list only

**Filter Actions:**
- Apply Filters
- Reset Filters

#### Export Features

**Export Buttons:**
- Export to CSV
- Export to JSON
- Includes all filtered data
- Automatic download with timestamp

### 3. Data Structure

#### Student Performance Metrics Tracked:
- Total quizzes taken
- Total questions attempted
- Total correct answers
- Overall accuracy percentage
- Average score
- Time spent (in seconds)
- Subject-wise performance
- Weak areas (topics with <50% success rate)
- Strong areas (topics with >80% success rate)

## Usage

### Admin Access
1. Navigate to `/admin/student-performance`
2. Use the tab navigation to switch between views
3. Apply filters to narrow down data
4. Export data as needed

### Filter Examples

**Find struggling students:**
- Set Max Accuracy: 50
- Apply filters

**View subject performance:**
- Select Subject: Mathematics
- Go to Analytics tab
- Review subject-specific charts

**Track recent activity:**
- Set Date From: 7 days ago
- Set Date To: Today
- Review Recent Activity chart

**Export top performers:**
- Go to Leaderboard tab
- Apply Grade/Subject filters
- Click Export CSV/JSON

## Technical Details

### Technologies Used
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React, React Query, Recharts, Tailwind CSS
- **Data Visualization:** Recharts (Bar, Line, Pie charts)
- **Icons:** Lucide React

### Performance Optimizations
- Server-side filtering and sorting
- Pagination to limit data transfer
- Aggregation pipelines for analytics
- React Query for caching and state management
- Indexed database queries

### Security
- Admin-only access (middleware protected)
- Input validation on filters
- Sanitized query parameters

## Route Structure

```
/admin/student-performance
  ├── Tab 1: Students List
  ├── Tab 2: Analytics & Charts
  └── Tab 3: Leaderboard
```

## API Response Examples

### Students List Response:
```json
{
  "success": true,
  "students": [...],
  "total": 150,
  "page": 1,
  "pages": 15
}
```

### Analytics Response:
```json
{
  "success": true,
  "analytics": {
    "overall": { "totalStudents": 150, "avgAccuracy": 75.5, ... },
    "bySubject": [...],
    "byGrade": [...],
    "accuracyDistribution": [...],
    "topPerformers": [...],
    "recentActivity": [...]
  }
}
```

### Leaderboard Response:
```json
{
  "success": true,
  "leaderboard": [...],
  "filters": { "grade": "5", "subject": "Mathematics" }
}
```

## Future Enhancements

Potential improvements:
1. Individual student drill-down pages
2. Comparison tools (compare students, grades, or subjects)
3. Time-series trend analysis
4. Custom report generation
5. Email reports to stakeholders
6. Real-time performance alerts
7. AI-powered insights and recommendations
8. Downloadable PDF reports
9. Schedule automated reports
10. Integration with parent portal

## Testing

Recommended test cases:
- [ ] Filter by each parameter individually
- [ ] Combine multiple filters
- [ ] Test pagination edge cases
- [ ] Verify export formats (CSV & JSON)
- [ ] Test with large datasets (1000+ students)
- [ ] Verify chart rendering with various data
- [ ] Test responsive design on mobile
- [ ] Verify access control (admin only)

## Deployment Notes

1. Ensure MongoDB indexes on:
   - `User.role`
   - `User.grade`
   - `StudentPerformance.studentId`
   - `StudentPerformance.updatedAt`
   - `StudentPerformance.overallAccuracy`

2. Environment variables required:
   - Standard MongoDB connection
   - JWT authentication tokens

3. No additional dependencies needed beyond existing ones

## Support

For issues or questions, refer to:
- Backend: `backend/controllers/admin.controller.js`
- Frontend: `frontend/src/pages/admin/StudentPerformanceDashboard.jsx`
- Routes: `backend/routes/admin.routes.js`
