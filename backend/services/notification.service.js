/**
 * Notification Service
 * Handles creating and managing notifications for users
 */

const Notification = require('../models/Notification.model');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Create a notification
   */
  static async create({ userId, type, title, message, relatedId, relatedType, data = {} }) {
    try {
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        data,
        isRead: false
      });
      
      await notification.save();
      logger.info(`Notification created for user ${userId}: ${type}`);
      
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notify tutor when AI generation completes
   */
  static async notifyAIGenerationComplete(userId, courseId, questionsCount, errorsCount = 0) {
    return this.create({
      userId,
      type: 'ai_generation_complete',
      title: 'AI Question Generation Complete',
      message: `Successfully generated ${questionsCount} questions.${errorsCount > 0 ? ` (${errorsCount} errors)` : ''} Review them in AI Questions dashboard.`,
      relatedId: courseId,
      relatedType: 'Course'
    });
  }

  /**
   * Notify student when quiz results are published
   */
  static async notifyQuizResultsPublished(userId, quizId, quizTitle, score) {
    return this.create({
      userId,
      type: 'quiz_results_published',
      title: 'Quiz Results Available',
      message: `Your results for "${quizTitle}" are now available. You scored ${score}%.`,
      relatedId: quizId,
      relatedType: 'Quiz',
      data: { score }
    });
  }

  /**
   * Notify tutor when manual evaluation is needed
   */
  static async notifyManualEvaluationNeeded(userId, sessionId, studentName, quizTitle) {
    return this.create({
      userId,
      type: 'manual_evaluation_needed',
      title: 'Manual Evaluation Required',
      message: `${studentName}'s submission for "${quizTitle}" requires manual evaluation.`,
      relatedId: sessionId,
      relatedType: 'QuizSession'
    });
  }

  /**
   * Notify tutor when quiz is auto-published
   */
  static async notifyQuizPublished(userId, quizId, quizTitle) {
    return this.create({
      userId,
      type: 'quiz_published',
      title: 'Quiz Auto-Published',
      message: `Your quiz "${quizTitle}" has been automatically published as scheduled.`,
      relatedId: quizId,
      relatedType: 'Quiz'
    });
  }

  /**
   * Notify tutor when quiz is auto-archived
   */
  static async notifyQuizArchived(userId, quizId, quizTitle) {
    return this.create({
      userId,
      type: 'quiz_archived',
      title: 'Quiz Auto-Archived',
      message: `Your quiz "${quizTitle}" has been automatically archived as scheduled.`,
      relatedId: quizId,
      relatedType: 'Quiz'
    });
  }

  /**
   * Notify student about upcoming quiz
   */
  static async notifyUpcomingQuiz(userId, quizId, quizTitle, startTime) {
    return this.create({
      userId,
      type: 'upcoming_quiz',
      title: 'Upcoming Quiz Reminder',
      message: `Quiz "${quizTitle}" starts at ${new Date(startTime).toLocaleString()}. Get ready!`,
      relatedId: quizId,
      relatedType: 'Quiz',
      data: { startTime }
    });
  }

  /**
   * Get user's notifications
   */
  static async getUserNotifications(userId, { limit = 20, skip = 0, unreadOnly = false } = {}) {
    const query = { user: userId };
    
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    return {
      notifications,
      total,
      unreadCount
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    return notification;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * Delete notification
   */
  static async delete(notificationId, userId) {
    await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  }

  /**
   * Delete all read notifications
   */
  static async deleteAllRead(userId) {
    await Notification.deleteMany({ user: userId, isRead: true });
  }
}

module.exports = NotificationService;
