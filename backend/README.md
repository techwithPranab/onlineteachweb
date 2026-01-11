# Online Teaching Platform - Backend

A comprehensive backend API for an online teaching platform with role-based authentication, live classes, and subscription management.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (Student, Tutor, Admin)
  - Secure password hashing with bcrypt

- **Course Management**
  - Create, update, and delete courses
  - Filter and search courses
  - Course materials and resources

- **Live Classes**
  - WebRTC video conferencing
  - Real-time whiteboard
  - Chat functionality
  - Attendance tracking
  - Screen sharing support

- **Subscription & Payments**
  - Multiple subscription tiers
  - Stripe integration
  - Payment history

- **Student Features**
  - Course enrollment
  - Progress tracking
  - Evaluation reports

- **Tutor Features**
  - Session scheduling
  - Student evaluation
  - Material uploads
  - Performance analytics

- **Admin Features**
  - User management
  - Tutor approval workflow
  - Platform analytics
  - Subscription plan management

## Tech Stack

- Node.js & Express.js
- MongoDB & Mongoose
- Socket.IO (WebRTC signaling)
- JWT authentication
- Stripe payments
- Winston logging

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Seed the database (optional)
```bash
npm run seed
```

5. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

See `.env.example` for all required environment variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_REFRESH_SECRET` - Refresh token secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `FRONTEND_URL` - Frontend URL for CORS

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile

### Courses
- `POST /api/courses` - Create course (Tutor/Admin)
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Sessions
- `POST /api/sessions` - Create session (Tutor)
- `GET /api/sessions` - Get sessions
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Materials
- `POST /api/materials` - Upload material (Tutor)
- `GET /api/materials/:courseId` - Get course materials

### Evaluations
- `POST /api/evaluations` - Create evaluation (Tutor)
- `GET /api/evaluations/student/:id` - Get student evaluations
- `GET /api/evaluations/session/:id` - Get session evaluations

### Subscriptions
- `POST /api/subscriptions/checkout` - Create subscription
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription

### Live Classes
- `POST /api/live/token` - Generate room token
- `POST /api/live/start` - Start session (Tutor)
- `POST /api/live/end` - End session (Tutor)

### Reports
- `GET /api/reports/student/:id` - Get student report
- `GET /api/reports/tutor/:id` - Get tutor report

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/tutors/pending` - Get pending tutors
- `PUT /api/admin/tutors/:id/approve` - Approve/reject tutor
- `GET /api/admin/analytics` - Get platform analytics

## Socket.IO Events

### Client → Server
- `chat:message` - Send chat message
- `whiteboard:update` - Update whiteboard
- `whiteboard:save` - Save whiteboard state
- `screen:share:start` - Start screen sharing
- `screen:share:stop` - Stop screen sharing
- `hand:raise` - Raise hand
- `hand:lower` - Lower hand
- `webrtc:offer` - WebRTC offer
- `webrtc:answer` - WebRTC answer
- `webrtc:ice-candidate` - ICE candidate

### Server → Client
- `user:joined` - User joined room
- `user:left` - User left room
- `chat:message` - New chat message
- `whiteboard:update` - Whiteboard updated
- `screen:share:started` - Screen sharing started
- `screen:share:stopped` - Screen sharing stopped
- `hand:raised` - Hand raised
- `hand:lowered` - Hand lowered
- `session:started` - Session started
- `session:ended` - Session ended

## Database Models

- User
- Course
- Session
- Material
- Evaluation
- Subscription
- SubscriptionPlan
- Payment
- Attendance
- Notification

## Default Seed Users

After running `npm run seed`:

**Admin:**
- Email: admin@teachingplatform.com
- Password: admin123

**Tutors:**
- Email: john.smith@example.com / Password: tutor123
- Email: sarah.johnson@example.com / Password: tutor123
- Email: michael.chen@example.com / Password: tutor123

**Students:**
- Email: emily.davis@example.com / Password: student123
- Email: david.wilson@example.com / Password: student123
- Email: lisa.anderson@example.com / Password: student123

## Project Structure

```
backend/
├── controllers/      # Request handlers
├── models/          # Mongoose schemas
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── sockets/         # Socket.IO handlers
├── scripts/         # Database seeds
├── logs/            # Log files
└── server.js        # Entry point
```

## Security Features

- Helmet.js for HTTP headers
- Rate limiting
- CORS protection
- Password hashing
- JWT token expiration
- Input validation
- SQL injection prevention (NoSQL)

## Error Handling

All errors are handled centrally with appropriate HTTP status codes and descriptive messages.

## Logging

Winston logger with file rotation for production environments.

## License

MIT
