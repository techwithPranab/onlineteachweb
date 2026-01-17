require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const sessionRoutes = require('./routes/session.routes');
const materialRoutes = require('./routes/material.routes');
const evaluationRoutes = require('./routes/evaluation.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const liveRoutes = require('./routes/live.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const questionRoutes = require('./routes/question.routes');
const quizRoutes = require('./routes/quiz.routes');
const quizEvaluationRoutes = require('./routes/quizEvaluation.routes');
const aiQuestionRoutes = require('./routes/aiQuestion.routes');
const questionExportRoutes = require('./routes/questionExport.routes');
const testRoutes = require('./routes/test.routes');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => logger.info('MongoDB Connected'))
  .catch(err => {
    logger.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Socket.IO setup
require('./sockets/liveClass.socket')(io);

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz-evaluations', quizEvaluationRoutes);
app.use('/api/ai', aiQuestionRoutes);
app.use('/api/questions', questionExportRoutes); // Import/Export endpoints (merged with question routes)
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/test', testRoutes); // Test endpoints (no auth required)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start quiz scheduler for auto-publish/archive
const quizScheduler = require('./services/quizScheduler.service');
quizScheduler.start();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info('Quiz scheduler started');
});

module.exports = { app, io };
