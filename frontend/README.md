# Online Teaching Platform - Frontend

Modern, responsive React frontend for an online teaching platform with role-based dashboards and real-time features.

## Features

- **Modern UI/UX**
  - Professional, clean design with Tailwind CSS
  - Fully responsive (mobile, tablet, desktop)
  - Smooth transitions and animations
  - Accessible components (WCAG compliant)

- **Authentication**
  - JWT-based authentication
  - Role-based routing and access control
  - Persistent sessions with Zustand

- **Role-Based Dashboards**
  - Student Dashboard
  - Tutor Dashboard
  - Admin Dashboard

- **Real-Time Features**
  - Live video classrooms with WebRTC
  - Real-time whiteboard
  - Chat functionality
  - Socket.IO integration

- **Student Features**
  - Browse and enroll in courses
  - Join live classes
  - View progress reports
  - Manage subscriptions
  - Access learning materials

- **Tutor Features**
  - Create and manage courses
  - Schedule live sessions
  - Upload materials
  - Evaluate students
  - Track performance

- **Admin Features**
  - User management
  - Tutor approval workflow
  - Platform analytics
  - Revenue tracking

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router v6** - Routing
- **Zustand** - State management
- **React Query** - Server state management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time communication
- **Simple Peer** - WebRTC
- **Recharts** - Charts and analytics
- **Lucide React** - Icons
- **React Hook Form** - Form handling
- **Stripe** - Payment integration

## Installation

1. Clone the repository
```bash
cd frontend
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

4. Start development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── layout/      # Layout components
│   │   ├── common/      # Common UI components
│   │   └── features/    # Feature-specific components
│   ├── layouts/         # Page layouts
│   ├── pages/           # Page components
│   │   ├── public/      # Public pages
│   │   ├── student/     # Student pages
│   │   ├── tutor/       # Tutor pages
│   │   └── admin/       # Admin pages
│   ├── services/        # API services
│   ├── store/           # State management
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Routes

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/pricing` - Pricing page

### Student Routes (Protected)
- `/student` - Student dashboard
- `/student/courses` - Browse courses
- `/student/courses/:id` - Course details
- `/student/session/:id` - Live class room
- `/student/progress` - Progress reports
- `/student/subscription` - Subscription management
- `/student/profile` - Profile settings

### Tutor Routes (Protected)
- `/tutor` - Tutor dashboard
- `/tutor/schedule` - Schedule management
- `/tutor/courses/new` - Create course
- `/tutor/materials` - Upload materials
- `/tutor/evaluation` - Student evaluation
- `/tutor/session/:id` - Live teaching room
- `/tutor/profile` - Profile settings

### Admin Routes (Protected)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/tutors/approval` - Tutor approval
- `/admin/analytics` - Revenue analytics
- `/admin/profile` - Profile settings

## Key Components

### Layouts
- `PublicLayout` - Layout for public pages (Landing, Login, Signup)
- `DashboardLayout` - Layout for authenticated pages with sidebar

### Common Components
- `Navbar` - Public navigation bar
- `Sidebar` - Dashboard navigation sidebar
- `DashboardHeader` - Dashboard top header
- `Footer` - Public footer

### State Management

**Auth Store (Zustand)**
```javascript
{
  user: Object,
  token: String,
  refreshToken: String,
  isAuthenticated: Boolean,
  login: Function,
  register: Function,
  logout: Function,
  refreshAccessToken: Function,
  updateUser: Function
}
```

## API Integration

The frontend uses Axios for API calls with automatic token refresh:

```javascript
import api from '@/services/api'

// GET request
const { data } = await api.get('/courses')

// POST request
const { data } = await api.post('/auth/login', { email, password })
```

## Styling

This project uses Tailwind CSS with custom utility classes:

- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.btn-outline` - Outlined button style
- `.input-field` - Input field style
- `.card` - Card container style

## Development

### Running the dev server
```bash
npm run dev
```

### Building for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## Features to Implement

The project structure is complete. Here are key features that need full implementation:

1. **Live Classroom**
   - WebRTC video streaming
   - Canvas-based whiteboard
   - Real-time chat
   - Screen sharing
   - Recording

2. **Course Management**
   - Course creation wizard
   - Material uploads
   - Session scheduling

3. **Progress Tracking**
   - Charts and graphs
   - Evaluation reports
   - Attendance tracking

4. **Payment Integration**
   - Stripe checkout
   - Subscription management
   - Invoice generation

5. **Admin Features**
   - User analytics
   - Platform monitoring
   - Revenue reports

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

- Lazy loading routes with React.lazy()
- Code splitting
- Image optimization
- API request caching with React Query
- Memoization of expensive calculations

## Security

- JWT authentication
- Protected routes
- XSS prevention
- CSRF protection
- Secure token storage

## License

MIT

## Support

For support, email support@eduplatform.com or join our Slack channel.
