# 📚 Online Teaching Platform - Complete Implementation

A comprehensive online teaching platform with live video conferencing, real-time collaboration, and complete admin management.

## 🎯 Project Status: Phase 2 Complete ✅

- ✅ **Authentication System** - JWT-based auth for Admin, Tutor, Student roles
- ✅ **Backend API** - Complete REST API with MongoDB
- ✅ **Admin Dashboard** - User, payment, session, subscription management
- ✅ **Live Classroom** - WebRTC video conferencing with chat & whiteboard
- ✅ **Real-time Features** - Socket.IO for chat, whiteboard, attendance
- ✅ **Student & Tutor Portals** - Complete dashboards with real data

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│                    Port 3001                                 │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Public     │   Student    │    Tutor     │     Admin      │
│   Pages      │   Dashboard  │  Dashboard   │   Dashboard    │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                  React Query + Zustand                       │
│                  Axios API Services                          │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express.js)                        │
│                    Port 5000                                 │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  REST API    │  Socket.IO   │   Auth JWT   │   Middleware   │
│  Routes      │  WebRTC      │              │                │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                      Controllers                             │
│   Auth │ Course │ Session │ Payment │ Subscription          │
└────────────────────────┬─────────────────────────────────────┘
                         │ Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Database                           │
│              mongodb://localhost:27017                       │
├──────────────────────────────────────────────────────────────┤
│  Users │ Courses │ Sessions │ Payments │ Subscriptions      │
│  Materials │ Evaluations │ Attendance │ Notifications       │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Key Features

### 🎥 Live Classroom
- **WebRTC Video Conferencing** - Multi-participant video/audio
- **Screen Sharing** - Share your screen or specific windows
- **Real-time Chat** - Text messaging during sessions
- **Interactive Whiteboard** - Collaborative drawing with math rendering
- **Hand Raise** - Students can raise hands for questions
- **Attendance Tracking** - Automatic attendance recording

### 👨‍💼 Admin Module
- **User Management** - View, update status, suspend users
- **Tutor Approval** - Approve/reject tutor applications
- **Payment Management** - Monitor transactions, process refunds
- **Session Monitoring** - Track live sessions, attendance stats
- **Subscription Plans** - CRUD operations for pricing plans
- **Analytics Dashboard** - Platform metrics and growth

### 👨‍🏫 Tutor Features
- **Course Creation** - Create courses with chapters, materials
- **Session Scheduling** - Schedule and manage live classes
- **Student Management** - View enrolled students, track progress
- **Material Upload** - Share study resources
- **Live Teaching** - Host live classroom sessions
- **Performance Reports** - View teaching metrics

### 👨‍🎓 Student Features
- **Course Enrollment** - Browse and enroll in courses
- **Live Classes** - Attend interactive video sessions
- **Study Materials** - Access course resources
- **Progress Tracking** - View attendance, grades, hours
- **Evaluations** - Receive feedback from tutors
- **Interactive Learning** - Chat, whiteboard, raise hand

## 🚀 Quick Start

### Prerequisites
```bash
# Required
- Node.js 18+
- MongoDB 5.0+
- Modern browser (Chrome, Firefox, Edge)
```

### Installation

1. **Clone and Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

2. **Environment Setup**

Backend `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/online_teaching
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRE=7d
NODE_ENV=development
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

3. **Seed Database**
```bash
cd backend
node scripts/seed.js
```

4. **Start Servers**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access Platform**
- Frontend: http://localhost:3001
- Backend API: http://localhost:5000/api

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@teachingplatform.com | admin123 |
| Tutor | john.smith@example.com | tutor123 |
| Student | emily.davis@example.com | student123 |

## 📁 Project Structure

```
OnlineTeachingWeb/
├── backend/
│   ├── controllers/        # Business logic
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── course.controller.js
│   │   ├── payment.controller.js  # NEW
│   │   └── ...
│   ├── models/            # MongoDB schemas
│   │   ├── User.model.js
│   │   ├── Course.model.js
│   │   ├── Session.model.js
│   │   ├── Payment.model.js
│   │   └── ...
│   ├── routes/            # API routes
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   └── ...
│   ├── sockets/           # WebSocket handlers
│   │   └── liveClass.socket.js  # Enhanced
│   ├── middleware/        # Auth, validation
│   ├── utils/            # Helpers
│   └── server.js         # Entry point
│
├── frontend/
│   ├── pages/
│   │   ├── _app.js
│   │   ├── index.js
│   │   └── [...slug].js  # Dynamic routing
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/    # Reusable components
│   │   │   ├── layout/    # Navbar, Sidebar, Footer
│   │   │   └── whiteboard/ # Canvas components
│   │   ├── pages/
│   │   │   ├── public/    # Landing, Login, etc.
│   │   │   ├── student/   # Student dashboard
│   │   │   ├── tutor/     # Tutor dashboard
│   │   │   │   └── LiveClassRoom.jsx  # NEW
│   │   │   └── admin/     # Admin dashboard
│   │   │       ├── PaymentManagement.jsx  # NEW
│   │   │       ├── SessionManagement.jsx  # NEW
│   │   │       └── SubscriptionManagement.jsx  # NEW
│   │   ├── services/      # API clients
│   │   │   └── apiServices.js  # Enhanced
│   │   ├── store/         # Zustand state
│   │   └── layouts/       # Page layouts
│   └── package.json
│
├── QUICK_START.md         # Quick start guide
├── FINAL_SUMMARY.md       # Complete documentation
└── README.md             # This file
```

## 🛠️ Tech Stack

### Backend
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (Access + Refresh tokens)
- **Real-time:** Socket.IO
- **Security:** Helmet, CORS, bcrypt
- **Logging:** Winston
- **Validation:** express-validator

### Frontend
- **Framework:** Next.js 14 (React 18)
- **State Management:** Zustand
- **Data Fetching:** React Query + Axios
- **Styling:** Tailwind CSS
- **WebRTC:** Simple-Peer
- **Real-time:** Socket.IO Client
- **Canvas:** Fabric.js (Whiteboard)
- **Math:** KaTeX (Math rendering)
- **Icons:** Lucide React

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/logout         - Logout user
POST   /api/auth/refresh        - Refresh access token
```

### Courses
```
GET    /api/courses             - List courses
GET    /api/courses/:id         - Get course details
POST   /api/courses             - Create course (Tutor/Admin)
PUT    /api/courses/:id         - Update course
DELETE /api/courses/:id         - Delete course
```

### Sessions
```
GET    /api/sessions            - List sessions
POST   /api/sessions            - Create session
PUT    /api/sessions/:id        - Update session
DELETE /api/sessions/:id        - Delete session
```

### Admin - Payments
```
GET    /api/admin/payments           - List all payments
GET    /api/admin/payments/stats     - Payment statistics
POST   /api/admin/payments/:id/refund - Process refund
```

### Admin - Sessions
```
GET    /api/admin/sessions           - List all sessions
GET    /api/admin/sessions/stats     - Session statistics
```

### Admin - Subscriptions
```
GET    /api/admin/subscription-plans      - List plans
POST   /api/admin/subscription-plans      - Create plan
PUT    /api/admin/subscription-plans/:id  - Update plan
DELETE /api/admin/subscription-plans/:id  - Delete plan
GET    /api/admin/subscriptions/stats     - Subscription stats
```

### Admin - Users
```
GET    /api/admin/users               - List all users
PUT    /api/admin/users/:id/status    - Update user status
GET    /api/admin/tutors/pending      - Pending tutor approvals
PUT    /api/admin/tutors/:id/approve  - Approve/reject tutor
```

## 🎮 WebSocket Events

### Connection
- `join-class` - Join session room
- `disconnect` - Leave session

### WebRTC Signaling
- `sending-signal` - Send connection signal
- `returning-signal` - Return connection signal
- `user-joined` - Notify user joined
- `user-left` - Notify user left

### Chat
- `chat-message` - Send/receive messages

### Whiteboard
- `whiteboard:update` - Real-time drawing
- `whiteboard:clear` - Clear canvas
- `whiteboard:save` - Save state
- `whiteboard:load` - Load state

### Interactions
- `raise-hand` / `hand:lower` - Hand raise
- `screen-share-start` / `screen-share-stop` - Screen sharing

## 📊 Database Schema

### Users
- name, email, password (hashed)
- role: admin | tutor | student
- avatar, bio, qualifications
- subjects, grades
- status: active | inactive | suspended

### Courses
- title, description, subject, grade
- tutor (ref: User)
- price, duration
- chapters[], syllabus[]
- board: CBSE | ICSE | State
- enrolledStudents[]

### Sessions
- title, course (ref: Course)
- tutor (ref: User)
- scheduledAt, duration
- status: scheduled | live | completed
- attendees[], maxStudents
- whiteboardData

### Payments
- user (ref: User)
- subscription (ref: Subscription)
- amount, status
- transactionId, paymentMethod
- refundRequested, refundProcessed

### Subscriptions
- user (ref: User)
- plan (ref: SubscriptionPlan)
- status: active | expired | cancelled
- startDate, endDate

## 🧪 Testing

### Manual Testing
1. Login as different roles
2. Test CRUD operations
3. Join live session
4. Test video/audio
5. Send chat messages
6. Use whiteboard
7. Process payment
8. Update user status

### API Testing
Use Postman/Insomnia or curl:
```bash
# Example: Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teachingplatform.com","password":"admin123"}'
```

## 🚧 Phase 3 Roadmap

### High Priority
- [ ] File Upload System (Multer + AWS S3)
- [ ] Stripe Payment Integration
- [ ] Session Recording

### Medium Priority
- [ ] Content Moderation
- [ ] System Settings Page
- [ ] Email Notifications
- [ ] Advanced Analytics

### Low Priority
- [ ] Mobile App
- [ ] Breakout Rooms
- [ ] Live Polls/Quizzes
- [ ] AI-powered Features

## 📄 Documentation

- **Quick Start:** See [QUICK_START.md](./QUICK_START.md)
- **Implementation Summary:** See [FINAL_SUMMARY.md](./FINAL_SUMMARY.md)
- **Phase 2 Completion:** See [PHASE_2_COMPLETION.md](./PHASE_2_COMPLETION.md)
- **Backend README:** See [backend/README.md](./backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Support

For issues or questions:
- Check documentation files
- Review browser console errors
- Check backend logs
- Verify all prerequisites

---

**Built with ❤️ for online education**

**Status:** ✅ Phase 2 Complete - Ready for Testing!
