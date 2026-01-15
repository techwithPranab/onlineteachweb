/**
 * Quiz Scheduler Service
 * Handles automatic publishing and archiving of quizzes based on scheduled times
 */

const Quiz = require('../models/Quiz.model');
const Notification = require('../models/Notification.model');
const logger = require('../utils/logger');

class QuizSchedulerService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 60 * 1000; // Check every minute
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Quiz scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Quiz scheduler started');

    // Run immediately on start
    this.runScheduledTasks();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.runScheduledTasks();
    }, this.checkInterval);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Quiz scheduler stopped');
  }

  /**
   * Run all scheduled tasks
   */
  async runScheduledTasks() {
    try {
      await Promise.all([
        this.publishScheduledQuizzes(),
        this.archiveExpiredQuizzes(),
        this.makeQuizzesVisible()
      ]);
    } catch (error) {
      logger.error('Error running scheduled tasks:', error);
    }
  }

  /**
   * Auto-publish quizzes that have reached their scheduled start time
   */
  async publishScheduledQuizzes() {
    const now = new Date();

    try {
      const quizzesToPublish = await Quiz.find({
        status: 'scheduled',
        'scheduling.autoPublish': true,
        'scheduling.startTime': { $lte: now }
      }).populate('createdBy', 'name email');

      for (const quiz of quizzesToPublish) {
        quiz.status = 'published';
        quiz.publishedAt = now;
        await quiz.save();

        logger.info(`Auto-published quiz: ${quiz.title} (${quiz._id})`);

        // Create notification for tutor
        if (quiz.createdBy) {
          await this.createNotification({
            userId: quiz.createdBy._id,
            type: 'quiz_published',
            title: 'Quiz Auto-Published',
            message: `Your quiz "${quiz.title}" has been automatically published as scheduled.`,
            relatedId: quiz._id,
            relatedType: 'Quiz'
          });
        }
      }

      if (quizzesToPublish.length > 0) {
        logger.info(`Auto-published ${quizzesToPublish.length} quizzes`);
      }
    } catch (error) {
      logger.error('Error auto-publishing quizzes:', error);
    }
  }

  /**
   * Archive quizzes that have passed their scheduled end time
   */
  async archiveExpiredQuizzes() {
    const now = new Date();

    try {
      const quizzesToArchive = await Quiz.find({
        status: 'published',
        'scheduling.autoArchive': true,
        'scheduling.endTime': { $lte: now }
      }).populate('createdBy', 'name email');

      for (const quiz of quizzesToArchive) {
        quiz.status = 'archived';
        quiz.archivedAt = now;
        await quiz.save();

        logger.info(`Auto-archived quiz: ${quiz.title} (${quiz._id})`);

        // Create notification for tutor
        if (quiz.createdBy) {
          await this.createNotification({
            userId: quiz.createdBy._id,
            type: 'quiz_archived',
            title: 'Quiz Auto-Archived',
            message: `Your quiz "${quiz.title}" has been automatically archived as scheduled.`,
            relatedId: quiz._id,
            relatedType: 'Quiz'
          });
        }
      }

      if (quizzesToArchive.length > 0) {
        logger.info(`Auto-archived ${quizzesToArchive.length} quizzes`);
      }
    } catch (error) {
      logger.error('Error auto-archiving quizzes:', error);
    }
  }

  /**
   * Make quizzes visible when their visibility start time is reached
   */
  async makeQuizzesVisible() {
    const now = new Date();

    try {
      const quizzesToShow = await Quiz.find({
        status: { $in: ['draft', 'scheduled'] },
        'scheduling.visibleFrom': { $lte: now },
        isVisible: false
      });

      for (const quiz of quizzesToShow) {
        quiz.isVisible = true;
        await quiz.save();

        logger.info(`Made quiz visible: ${quiz.title} (${quiz._id})`);
      }

      if (quizzesToShow.length > 0) {
        logger.info(`Made ${quizzesToShow.length} quizzes visible`);
      }
    } catch (error) {
      logger.error('Error making quizzes visible:', error);
    }
  }

  /**
   * Create a notification
   */
  async createNotification({ userId, type, title, message, relatedId, relatedType }) {
    try {
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        isRead: false
      });
      await notification.save();
    } catch (error) {
      logger.error('Error creating notification:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval
    };
  }
}

// Export singleton instance
const quizScheduler = new QuizSchedulerService();
module.exports = quizScheduler;
