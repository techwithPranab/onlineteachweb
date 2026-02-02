const mongoose = require('mongoose');

/**
 * Achievement Badge Schema
 * Tracks student achievements and badges earned through quiz performance
 */
const achievementSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeType: {
    type: String,
    required: true,
    enum: [
      // Quiz Performance Badges
      'first_quiz',
      'quiz_master_10',
      'quiz_master_25',
      'quiz_master_50',
      'quiz_master_100',
      'perfect_score',
      'perfect_streak_3',
      'perfect_streak_5',
      'perfect_streak_10',
      
      // Speed Badges
      'speed_demon',
      'quick_thinker',
      
      // Accuracy Badges
      'sharp_shooter_80',
      'sharp_shooter_90',
      'sharp_shooter_95',
      
      // Topic Mastery
      'topic_champion',
      'subject_expert',
      
      // Consistency Badges
      'daily_learner_7',
      'daily_learner_30',
      'weekly_warrior',
      
      // Difficulty Badges
      'easy_master',
      'medium_conqueror',
      'hard_hero',
      'difficulty_champion',
      
      // Improvement Badges
      'rising_star',
      'comeback_king',
      'persistent_learner'
    ]
  },
  badgeName: {
    type: String,
    required: true
  },
  badgeDescription: {
    type: String,
    required: true
  },
  badgeIcon: {
    type: String, // Emoji or icon class
    default: '🏆'
  },
  badgeColor: {
    type: String, // Color hex code
    default: '#FFD700'
  },
  earnedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Context information
  context: {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizSession'
    },
    score: Number,
    metric: String, // e.g., "10 quizzes", "90% accuracy"
    additionalData: mongoose.Schema.Types.Mixed
  },
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  points: {
    type: Number,
    default: 10,
    min: 0
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
achievementSchema.index({ studentId: 1, badgeType: 1 });
achievementSchema.index({ studentId: 1, earnedAt: -1 });
achievementSchema.index({ badgeType: 1, level: 1 });

// Prevent duplicate badges of same type (except stackable ones)
achievementSchema.index(
  { studentId: 1, badgeType: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      badgeType: { 
        $nin: ['perfect_score', 'speed_demon', 'topic_champion'] 
      } 
    }
  }
);

// Static method to get badge metadata
achievementSchema.statics.getBadgeMetadata = function(badgeType) {
  const metadata = {
    // First Quiz
    first_quiz: {
      name: 'First Steps',
      description: 'Complete your first quiz',
      icon: '🎯',
      color: '#4CAF50',
      level: 'bronze',
      points: 10,
      rule: 'Complete 1 quiz'
    },
    
    // Quiz Completion Milestones
    quiz_master_10: {
      name: 'Quiz Enthusiast',
      description: 'Complete 10 quizzes',
      icon: '📚',
      color: '#2196F3',
      level: 'bronze',
      points: 20,
      rule: 'Complete 10 quizzes'
    },
    quiz_master_25: {
      name: 'Quiz Addict',
      description: 'Complete 25 quizzes',
      icon: '🔥',
      color: '#FF9800',
      level: 'silver',
      points: 50,
      rule: 'Complete 25 quizzes'
    },
    quiz_master_50: {
      name: 'Quiz Legend',
      description: 'Complete 50 quizzes',
      icon: '⭐',
      color: '#FFD700',
      level: 'gold',
      points: 100,
      rule: 'Complete 50 quizzes'
    },
    quiz_master_100: {
      name: 'Quiz Titan',
      description: 'Complete 100 quizzes',
      icon: '👑',
      color: '#9C27B0',
      level: 'platinum',
      points: 250,
      rule: 'Complete 100 quizzes'
    },
    
    // Perfect Scores
    perfect_score: {
      name: 'Perfect!',
      description: 'Score 100% in a quiz',
      icon: '💯',
      color: '#4CAF50',
      level: 'gold',
      points: 30,
      rule: 'Score 100% in any quiz (stackable)'
    },
    perfect_streak_3: {
      name: 'Hat Trick',
      description: 'Score 100% in 3 consecutive quizzes',
      icon: '🎩',
      color: '#FF5722',
      level: 'gold',
      points: 100,
      rule: 'Score 100% in 3 consecutive quizzes'
    },
    perfect_streak_5: {
      name: 'Unstoppable',
      description: 'Score 100% in 5 consecutive quizzes',
      icon: '🔥',
      color: '#E91E63',
      level: 'platinum',
      points: 200,
      rule: 'Score 100% in 5 consecutive quizzes'
    },
    perfect_streak_10: {
      name: 'Legendary Streak',
      description: 'Score 100% in 10 consecutive quizzes',
      icon: '💎',
      color: '#3F51B5',
      level: 'diamond',
      points: 500,
      rule: 'Score 100% in 10 consecutive quizzes'
    },
    
    // Speed Badges
    speed_demon: {
      name: 'Speed Demon',
      description: 'Complete a quiz in record time with high accuracy',
      icon: '⚡',
      color: '#FFEB3B',
      level: 'silver',
      points: 40,
      rule: 'Complete quiz in <50% of allotted time with >80% score (stackable)'
    },
    quick_thinker: {
      name: 'Quick Thinker',
      description: 'Answer questions rapidly with accuracy',
      icon: '💨',
      color: '#00BCD4',
      level: 'bronze',
      points: 20,
      rule: 'Average <30 seconds per question with >75% accuracy'
    },
    
    // Accuracy Badges
    sharp_shooter_80: {
      name: 'Sharp Shooter',
      description: 'Maintain 80%+ accuracy',
      icon: '🎯',
      color: '#8BC34A',
      level: 'bronze',
      points: 25,
      rule: 'Achieve 80%+ accuracy in a quiz'
    },
    sharp_shooter_90: {
      name: 'Marksman',
      description: 'Maintain 90%+ accuracy',
      icon: '🏹',
      color: '#4CAF50',
      level: 'silver',
      points: 50,
      rule: 'Achieve 90%+ accuracy in a quiz'
    },
    sharp_shooter_95: {
      name: 'Sniper',
      description: 'Maintain 95%+ accuracy',
      icon: '🎖️',
      color: '#2E7D32',
      level: 'gold',
      points: 100,
      rule: 'Achieve 95%+ accuracy in a quiz'
    },
    
    // Topic Mastery
    topic_champion: {
      name: 'Topic Champion',
      description: 'Master a specific topic',
      icon: '🏆',
      color: '#FF9800',
      level: 'gold',
      points: 75,
      rule: 'Score >90% in 5 quizzes on the same topic (stackable per topic)'
    },
    subject_expert: {
      name: 'Subject Expert',
      description: 'Excel across all topics in a subject',
      icon: '📖',
      color: '#9C27B0',
      level: 'platinum',
      points: 150,
      rule: 'Score >85% average across all topics in a subject'
    },
    
    // Consistency Badges
    daily_learner_7: {
      name: 'Week Warrior',
      description: 'Take quizzes for 7 consecutive days',
      icon: '📅',
      color: '#03A9F4',
      level: 'silver',
      points: 50,
      rule: 'Complete at least 1 quiz for 7 consecutive days'
    },
    daily_learner_30: {
      name: 'Monthly Master',
      description: 'Take quizzes for 30 consecutive days',
      icon: '🗓️',
      color: '#673AB7',
      level: 'platinum',
      points: 200,
      rule: 'Complete at least 1 quiz for 30 consecutive days'
    },
    weekly_warrior: {
      name: 'Weekly Warrior',
      description: 'Complete quizzes every week',
      icon: '⚔️',
      color: '#F44336',
      level: 'gold',
      points: 100,
      rule: 'Complete quizzes in 4 consecutive weeks'
    },
    
    // Difficulty Badges
    easy_master: {
      name: 'Easy Master',
      description: 'Conquer all easy quizzes',
      icon: '🌱',
      color: '#8BC34A',
      level: 'bronze',
      points: 30,
      rule: 'Score >85% average in 10 easy quizzes'
    },
    medium_conqueror: {
      name: 'Medium Conqueror',
      description: 'Dominate medium difficulty',
      icon: '🌿',
      color: '#4CAF50',
      level: 'silver',
      points: 60,
      rule: 'Score >80% average in 10 medium quizzes'
    },
    hard_hero: {
      name: 'Hard Hero',
      description: 'Triumph over hard challenges',
      icon: '🌳',
      color: '#2E7D32',
      level: 'gold',
      points: 120,
      rule: 'Score >75% average in 10 hard quizzes'
    },
    difficulty_champion: {
      name: 'All-Rounder',
      description: 'Master all difficulty levels',
      icon: '🌟',
      color: '#FFD700',
      level: 'platinum',
      points: 250,
      rule: 'Earn Easy Master, Medium Conqueror, and Hard Hero badges'
    },
    
    // Improvement Badges
    rising_star: {
      name: 'Rising Star',
      description: 'Show consistent improvement',
      icon: '🌠',
      color: '#FF6F00',
      level: 'silver',
      points: 60,
      rule: 'Improve average score by 20% over 5 quizzes'
    },
    comeback_king: {
      name: 'Comeback King',
      description: 'Bounce back from setbacks',
      icon: '👑',
      color: '#D32F2F',
      level: 'gold',
      points: 80,
      rule: 'Score >90% after scoring <50% in previous quiz'
    },
    persistent_learner: {
      name: 'Never Give Up',
      description: 'Keep trying until you succeed',
      icon: '💪',
      color: '#1976D2',
      level: 'bronze',
      points: 40,
      rule: 'Retake a quiz 3+ times and improve score each time'
    }
  };
  
  return metadata[badgeType] || null;
};

module.exports = mongoose.model('Achievement', achievementSchema);
