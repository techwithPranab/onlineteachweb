const FeatureDefinition = require('../models/FeatureDefinition.model');
const logger = require('../utils/logger');

class FeatureDefinitionService {
  /**
   * Get all features with optional filters
   */
  async getAllFeatures(filters = {}) {
    try {
      return await FeatureDefinition.find(filters)
        .sort({ category: 1, displayOrder: 1 });
    } catch (error) {
      logger.error('Error getting all features:', error);
      throw error;
    }
  }

  /**
   * Get features by category
   */
  async getFeaturesByCategory(category) {
    try {
      return await FeatureDefinition.find({ 
        category, 
        isActive: true 
      }).sort({ displayOrder: 1 });
    } catch (error) {
      logger.error(`Error getting features for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get feature by key
   */
  async getFeatureByKey(key) {
    try {
      return await FeatureDefinition.findOne({ key, isActive: true });
    } catch (error) {
      logger.error(`Error getting feature ${key}:`, error);
      throw error;
    }
  }

  /**
   * Create new feature definition (admin only)
   */
  async createFeature(data) {
    try {
      return await FeatureDefinition.create(data);
    } catch (error) {
      logger.error('Error creating feature:', error);
      throw error;
    }
  }

  /**
   * Update feature definition
   */
  async updateFeature(key, updates) {
    try {
      return await FeatureDefinition.findOneAndUpdate(
        { key },
        updates,
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error(`Error updating feature ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete feature definition
   */
  async deleteFeature(key) {
    try {
      return await FeatureDefinition.findOneAndDelete({ key });
    } catch (error) {
      logger.error(`Error deleting feature ${key}:`, error);
      throw error;
    }
  }

  /**
   * Seed default features into database
   */
  async seedDefaultFeatures() {
    try {
      const features = [
        // Course Access Features
        {
          key: 'courses.enroll',
          name: 'Course Enrollment',
          description: 'Allows students to enroll in courses',
          category: 'courses',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 1,
          icon: 'book-open'
        },
        {
          key: 'courses.unlimited',
          name: 'Unlimited Courses',
          description: 'Access unlimited number of courses',
          category: 'courses',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 2,
          icon: 'infinity'
        },
        {
          key: 'courses.premium',
          name: 'Premium Courses',
          description: 'Access to premium-marked courses',
          category: 'courses',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 3,
          icon: 'crown'
        },
        {
          key: 'courses.offline_access',
          name: 'Offline Access',
          description: 'Download courses for offline access',
          category: 'courses',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 4,
          icon: 'download-cloud'
        },

        // Live Session Features
        {
          key: 'live_sessions.join',
          name: 'Join Live Sessions',
          description: 'Participate in live teaching sessions',
          category: 'live_sessions',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 1,
          icon: 'video'
        },
        {
          key: 'live_sessions.unlimited',
          name: 'Unlimited Live Sessions',
          description: 'Join unlimited live sessions per month',
          category: 'live_sessions',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 2,
          icon: 'infinity'
        },
        {
          key: 'live_sessions.recording_access',
          name: 'Recording Access',
          description: 'Access recorded sessions',
          category: 'live_sessions',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 3,
          icon: 'play-circle'
        },
        {
          key: 'live_sessions.priority_entry',
          name: 'Priority Entry',
          description: 'Priority entry when sessions are full',
          category: 'live_sessions',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 4,
          icon: 'zap'
        },
        {
          key: 'live_sessions.hd_video',
          name: 'HD Video Quality',
          description: 'High definition video streaming',
          category: 'live_sessions',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 5,
          icon: 'monitor'
        },

        // Quiz & Assessment Features
        {
          key: 'quiz.take',
          name: 'Take Quizzes',
          description: 'Participate in quizzes and assessments',
          category: 'quiz',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 1,
          icon: 'clipboard-check'
        },
        {
          key: 'quiz.unlimited',
          name: 'Unlimited Quiz Attempts',
          description: 'Unlimited quiz attempts per day',
          category: 'quiz',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 2,
          icon: 'repeat'
        },
        {
          key: 'quiz.detailed_feedback',
          name: 'Detailed Feedback',
          description: 'Detailed explanations for quiz answers',
          category: 'quiz',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 3,
          icon: 'message-square'
        },
        {
          key: 'quiz.performance_analytics',
          name: 'Performance Analytics',
          description: 'Advanced analytics and insights',
          category: 'quiz',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 4,
          icon: 'bar-chart'
        },
        {
          key: 'quiz.ai_generated',
          name: 'AI-Generated Quizzes',
          description: 'Personalized AI-generated practice quizzes',
          category: 'quiz',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 5,
          icon: 'cpu'
        },

        // Interactive Features
        {
          key: 'interactive.whiteboard',
          name: 'Whiteboard Access',
          description: 'Use whiteboard during live sessions',
          category: 'interactive',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 1,
          icon: 'edit-3'
        },
        {
          key: 'interactive.screen_share',
          name: 'Screen Sharing',
          description: 'Share screen during sessions',
          category: 'interactive',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 2,
          icon: 'share-2'
        },

        // Content Features
        {
          key: 'materials.download',
          name: 'Download Materials',
          description: 'Download learning materials',
          category: 'content',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 1,
          icon: 'download'
        },
        {
          key: 'materials.print',
          name: 'Print Materials',
          description: 'Print learning materials',
          category: 'content',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 2,
          icon: 'printer'
        },
        {
          key: 'videos.quality_hd',
          name: 'HD Video Quality',
          description: 'High definition video content',
          category: 'content',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 3,
          icon: 'film'
        },
        {
          key: 'videos.download',
          name: 'Video Downloads',
          description: 'Download video content',
          category: 'content',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 4,
          icon: 'video'
        },

        // Support Features
        {
          key: 'support.basic',
          name: 'Basic Support',
          description: 'Email support within 48 hours',
          category: 'support',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 1,
          icon: 'help-circle'
        },
        {
          key: 'support.priority',
          name: 'Priority Support',
          description: 'Priority support with faster response',
          category: 'support',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 2,
          icon: 'shield'
        },
        {
          key: 'support.24x7',
          name: '24/7 Support',
          description: 'Round-the-clock support access',
          category: 'support',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 3,
          icon: 'clock'
        },
        {
          key: 'support.phone',
          name: 'Phone Support',
          description: 'Direct phone support access',
          category: 'support',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 4,
          icon: 'phone'
        },
        {
          key: 'tutor.one_on_one',
          name: '1-on-1 Tutor Sessions',
          description: 'Private sessions with tutors',
          category: 'support',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 5,
          icon: 'user-check'
        },

        // Analytics Features
        {
          key: 'analytics.basic',
          name: 'Basic Progress Reports',
          description: 'View basic learning progress',
          category: 'analytics',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 1,
          icon: 'trending-up'
        },
        {
          key: 'analytics.advanced',
          name: 'Advanced Analytics',
          description: 'Detailed performance analytics',
          category: 'analytics',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 2,
          icon: 'activity'
        },
        {
          key: 'analytics.export',
          name: 'Export Reports',
          description: 'Download and export reports',
          category: 'analytics',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 3,
          icon: 'file-text'
        },
        {
          key: 'analytics.parent_dashboard',
          name: 'Parent Dashboard',
          description: 'Separate dashboard for parents',
          category: 'analytics',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 4,
          icon: 'users'
        },

        // Communication Features
        {
          key: 'chat.basic',
          name: 'Basic Chat',
          description: 'Group chat in sessions',
          category: 'communication',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 1,
          icon: 'message-circle'
        },
        {
          key: 'chat.private',
          name: 'Private Chat',
          description: 'Private messaging with tutors',
          category: 'communication',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 2,
          icon: 'message-square'
        },
        {
          key: 'forum.access',
          name: 'Forum Access',
          description: 'Access community forums',
          category: 'communication',
          type: 'boolean',
          defaultValue: true,
          applicableRoles: ['student'],
          displayOrder: 3,
          icon: 'users'
        },
        {
          key: 'forum.post',
          name: 'Forum Posting',
          description: 'Create posts in forums',
          category: 'communication',
          type: 'boolean',
          defaultValue: false,
          applicableRoles: ['student'],
          displayOrder: 4,
          icon: 'edit'
        }
      ];

      // Use insertMany with ordered: false to continue on duplicate key errors
      const result = await FeatureDefinition.insertMany(features, { ordered: false });
      logger.info(`Successfully seeded ${result.length} features`);
      return result;
    } catch (error) {
      // If error is duplicate key, that's okay
      if (error.code === 11000) {
        logger.info('Some features already exist, skipping duplicates');
        return { message: 'Features seeded (some already existed)' };
      }
      logger.error('Error seeding features:', error);
      throw error;
    }
  }
}

module.exports = new FeatureDefinitionService();
