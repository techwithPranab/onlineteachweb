# 🚀 Quick Start Guide - Online Teaching Platform

## Prerequisites
- Node.js (v18+)
- MongoDB (running on localhost:27017)
- Modern browser (Chrome, Firefox, Edge)

## 1. Start MongoDB
```bash
# macOS (if using Homebrew)
brew services start mongodb-community

# Or using mongod directly
mongod --dbpath=/path/to/your/data
```

## 2. Start Backend Server
```bash
cd backend
npm start
# Server will run on http://localhost:5000
```

## 3. Start Frontend Server
```bash
cd frontend
npm run dev
# Frontend will run on http://localhost:3001
```

## 4. Access the Platform
Open your browser and navigate to: **http://localhost:3001**

## 5. Login Credentials

### Admin Login
- **Email:** `admin@teachingplatform.com`
- **Password:** `admin123`
- **Access:** Full platform management

### Tutor Login
- **Email:** `john.smith@example.com`
- **Password:** `tutor123`
- **Access:** Course creation, live sessions

### Student Login
- **Email:** `emily.davis@example.com`
- **Password:** `student123`
- **Access:** Enroll in courses, attend live classes

## 6. Key Features to Test

### As Admin
1. Navigate to **Admin Dashboard** → **User Management**
2. View and manage users (status updates)
3. Go to **Payment Management** → View transactions
4. Check **Session Management** → Monitor live sessions
5. Visit **Subscription Management** → Manage plans

### As Tutor
1. Navigate to **Dashboard** → View active courses
2. Go to **Schedule** → Create a session
3. Click **Start** on a session → Enter live classroom
4. Test video/audio controls
5. Share screen, use whiteboard, send chat messages

### As Student
1. Navigate to **Dashboard** → View enrolled courses
2. Check **Upcoming Classes**
3. Click on a session → Join live class
4. Test camera/mic, raise hand, send messages

## 7. Live Classroom Testing

### Create a Live Session (Tutor)
1. Login as tutor
2. Go to **Sessions** → **Create Session**
3. Fill in session details
4. Click **Start Session**

### Join Live Session (Student)
1. Login as student
2. Go to **Dashboard** → **Upcoming Classes**
3. Click **Join** on the live session
4. Allow camera/microphone permissions

### Test Features
- ✅ Video on/off
- ✅ Audio on/off
- ✅ Screen sharing
- ✅ Chat messages
- ✅ Whiteboard
- ✅ Raise hand
- ✅ View participants

## 8. API Testing

### Using curl
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teachingplatform.com","password":"admin123"}'

# Get Payment Stats (replace TOKEN)
curl http://localhost:5000/api/admin/payments/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Sessions
curl http://localhost:5000/api/admin/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman/Insomnia
Import this collection:
```json
{
  "name": "Online Teaching API",
  "requests": [
    {
      "name": "Login",
      "method": "POST",
      "url": "http://localhost:5000/api/auth/login",
      "body": {
        "email": "admin@teachingplatform.com",
        "password": "admin123"
      }
    },
    {
      "name": "Get Payments",
      "method": "GET",
      "url": "http://localhost:5000/api/admin/payments",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    }
  ]
}
```

## 9. Troubleshooting

### Backend not starting?
- Check MongoDB is running: `mongosh` or `mongo`
- Check port 5000 is free: `lsof -i :5000`
- Verify .env file exists with correct values

### Frontend not loading?
- Check backend is running on port 5000
- Verify `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- Clear browser cache and reload

### WebRTC not working?
- Allow camera/microphone permissions in browser
- Check browser console for errors
- Ensure both users are in the same session
- Try using HTTPS in production (required for getUserMedia)

### Socket.IO connection failing?
- Check backend Socket.IO server is running
- Verify WebSocket connection in browser DevTools → Network
- Check firewall settings

## 10. Development Tips

### Hot Reload
- Backend: Uses `nodemon` for auto-restart
- Frontend: Uses Next.js hot reload

### Database Seeding
```bash
cd backend
node scripts/seed.js
# Seeds users, courses, subscription plans
```

### View Logs
- Backend logs: `backend/logs/combined*.log`
- Console logs: Check terminal running backend server

### Reset Database
```bash
mongosh online_teaching --eval "db.dropDatabase()"
cd backend
node scripts/seed.js
```

## 11. Production Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas or production database
- [ ] HTTPS enabled for WebRTC
- [ ] CORS configured for production domain
- [ ] JWT secret changed
- [ ] File upload size limits set
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry, etc.)
- [ ] Logging configured
- [ ] STUN/TURN servers for WebRTC

## 12. Support & Documentation

- **Backend API:** See `backend/README.md`
- **Frontend:** See `frontend/README.md`
- **Phase 2 Completion:** See `PHASE_2_COMPLETION.md`
- **Final Summary:** See `FINAL_SUMMARY.md`

## Quick Commands Reference

```bash
# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Seed database
cd backend && node scripts/seed.js

# Run tests (when available)
cd backend && npm test

# Build frontend for production
cd frontend && npm run build

# Start production frontend
cd frontend && npm start
```

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs
3. Verify all prerequisites are met
4. Review documentation files

---

**Ready to go!** Start the servers and test the platform. 🚀
