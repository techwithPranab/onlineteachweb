# Fix for 404 Error on /api/student-performance

## Problem
Getting 404 error: `GET /api/api/student-performance HTTP/1.1" 404`

Notice the **double `/api/`** in the URL!

## Root Cause
The `api.js` service already has `baseURL: 'http://localhost:5000/api'`, so when you call:
```javascript
api.get('/api/student-performance')
```

It becomes:
- baseURL: `http://localhost:5000/api`
- + path: `/api/student-performance`
- = **Result**: `http://localhost:5000/api/api/student-performance` ❌

## Fix Applied ✅

Changed in `frontend/src/pages/student/ProgressReports.jsx`:

```javascript
// BEFORE (Wrong):
const response = await api.get('/api/student-performance')

// AFTER (Correct):
const response = await api.get('/student-performance')
```

## How to Apply

1. **Clear browser cache** (important!):
   - Chrome: Press `Cmd + Shift + Delete` (Mac) or `Ctrl + Shift + Delete` (Windows)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard refresh** the page:
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

Or simply:

3. **Restart the frontend dev server**:
   ```bash
   cd frontend
   # Stop the dev server (Ctrl+C)
   rm -rf .next
   npm run dev
   ```

## Rule for Using api.get()

Since `api.js` already has `baseURL: 'http://localhost:5000/api'`:

### ✅ Correct Usage:
```javascript
api.get('/users')              → http://localhost:5000/api/users
api.get('/student-performance') → http://localhost:5000/api/student-performance
api.post('/auth/login')        → http://localhost:5000/api/auth/login
```

### ❌ Wrong Usage:
```javascript
api.get('/api/users')              → http://localhost:5000/api/api/users (404)
api.get('/api/student-performance') → http://localhost:5000/api/api/student-performance (404)
api.post('/api/auth/login')        → http://localhost:5000/api/api/auth/login (404)
```

## Verification

After applying the fix, check the backend logs. You should see:
```
✅ GET /api/student-performance HTTP/1.1" 200
```

Instead of:
```
❌ GET /api/api/student-performance HTTP/1.1" 404
```

## Backend Status

✅ Backend server is running on port 5000
✅ Route `/api/student-performance` is registered
✅ `studentPerformance.routes.js` exists and is properly exported

The backend is working perfectly. It was just a frontend URL issue!
