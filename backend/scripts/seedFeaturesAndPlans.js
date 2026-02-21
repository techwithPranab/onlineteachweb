/**
 * Comprehensive Seed Script for Features and Subscription Plans
 * 
 * This script will:
 * 1. Seed all 35+ feature definitions
 * 2. Configure existing subscription plans with features
 * 3. Set appropriate limits for each plan tier
 * 
 * Usage:
 *   node scripts/seedFeaturesAndPlans.js
 * 
 * Or from project root:
 *   node backend/scripts/seedFeaturesAndPlans.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const FeatureDefinition = require('../models/FeatureDefinition.model');
const { SubscriptionPlan } = require('../models/Subscription.model');

// Import service
const featureDefinitionService = require('../services/featureDefinition.service');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online_teaching', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Subscription Plan Configurations
 * 
 * Only Two Plans:
 * - Free: Limited features for getting started
 * - Premium: Unlimited access to all features
 */
const planConfigurations = {
  'Free': {
    description: 'Basic features for getting started',
    features: {
      // Course Access (Limited)
      'courses.enroll': { enabled: true, limit: 3 },
      'courses.premium': { enabled: false },
      'courses.create': { enabled: false },
      'courses.export': { enabled: false },
      'courses.analytics': { enabled: false },

      // Live Sessions (Limited)
      'live_sessions.join': { enabled: true, limit: 10 },
      'live_sessions.hd_video': { enabled: false },
      'live_sessions.recording': { enabled: false },
      'live_sessions.screen_share': { enabled: false },
      'live_sessions.unlimited': { enabled: false },
      'live_sessions.priority_support': { enabled: false },

      // Quiz Features (Limited)
      'quiz.take': { enabled: true, limit: 20 },
      'quiz.create': { enabled: false },
      'quiz.unlimited_attempts': { enabled: false },
      'quiz.detailed_analytics': { enabled: false },
      'quiz.ai_generation': { enabled: false },
      'quiz.export': { enabled: false },

      // Materials & Downloads (Limited)
      'materials.view': { enabled: true, limit: null },
      'materials.download': { enabled: true, limit: 50 },
      'materials.unlimited': { enabled: false },
      'materials.upload': { enabled: false },
      'materials.advanced_formats': { enabled: false },

      // Performance Tracking (Basic only)
      'performance.basic_reports': { enabled: true, limit: null },
      'performance.detailed_analytics': { enabled: false },
      'performance.comparison': { enabled: false },
      'performance.export': { enabled: false },
      'performance.real_time': { enabled: false },

      // AI Features (Limited)
      'ai.question_generation': { enabled: false },
      'ai.answer_evaluation': { enabled: false },
      'ai.performance_insights': { enabled: false },
      'ai.personalized_recommendations': { enabled: true, limit: null },

      // Community Features (Limited)
      'community.discussion_boards': { enabled: true, limit: null },
      'community.peer_learning': { enabled: false },
      'community.study_groups': { enabled: false },

      // Support & Help (Basic only)
      'support.email': { enabled: true, limit: null },
      'support.priority': { enabled: false },
      'support.dedicated_manager': { enabled: false },
    }
  },

  'Premium': {
    description: 'All features unlocked - unlimited access',
    features: {
      // Course Access (Unlimited)
      'courses.enroll': { enabled: true, limit: null },
      'courses.premium': { enabled: true, limit: null },
      'courses.create': { enabled: true, limit: null },
      'courses.export': { enabled: true, limit: null },
      'courses.analytics': { enabled: true, limit: null },

      // Live Sessions (Unlimited)
      'live_sessions.join': { enabled: true, limit: null },
      'live_sessions.hd_video': { enabled: true, limit: null },
      'live_sessions.recording': { enabled: true, limit: null },
      'live_sessions.screen_share': { enabled: true, limit: null },
      'live_sessions.unlimited': { enabled: true, limit: null },
      'live_sessions.priority_support': { enabled: true, limit: null },

      // Quiz Features (Unlimited)
      'quiz.take': { enabled: true, limit: null },
      'quiz.create': { enabled: true, limit: null },
      'quiz.unlimited_attempts': { enabled: true, limit: null },
      'quiz.detailed_analytics': { enabled: true, limit: null },
      'quiz.ai_generation': { enabled: true, limit: null },
      'quiz.export': { enabled: true, limit: null },

      // Materials & Downloads (Unlimited)
      'materials.view': { enabled: true, limit: null },
      'materials.download': { enabled: true, limit: null },
      'materials.unlimited': { enabled: true, limit: null },
      'materials.upload': { enabled: true, limit: null },
      'materials.advanced_formats': { enabled: true, limit: null },

      // Performance Tracking (Unlimited)
      'performance.basic_reports': { enabled: true, limit: null },
      'performance.detailed_analytics': { enabled: true, limit: null },
      'performance.comparison': { enabled: true, limit: null },
      'performance.export': { enabled: true, limit: null },
      'performance.real_time': { enabled: true, limit: null },

      // AI Features (Unlimited)
      'ai.question_generation': { enabled: true, limit: null },
      'ai.answer_evaluation': { enabled: true, limit: null },
      'ai.performance_insights': { enabled: true, limit: null },
      'ai.personalized_recommendations': { enabled: true, limit: null },

      // Community Features (Unlimited)
      'community.discussion_boards': { enabled: true, limit: null },
      'community.peer_learning': { enabled: true, limit: null },
      'community.study_groups': { enabled: true, limit: null },

      // Support & Help (Premium)
      'support.email': { enabled: true, limit: null },
      'support.priority': { enabled: true, limit: null },
      'support.dedicated_manager': { enabled: true, limit: null },
    }
  }
};

// Seed features
const seedFeatures = async () => {
  try {
    console.log('\n📦 Starting feature seeding...');
    
    const result = await featureDefinitionService.seedDefaultFeatures();
    
    console.log(`✅ Successfully seeded ${result.created} features`);
    console.log(`ℹ️  Skipped ${result.skipped} existing features`);
    
    return result;
  } catch (error) {
    console.error('❌ Error seeding features:', error);
    throw error;
  }
};

// Configure subscription plans
const configurePlans = async () => {
  try {
    console.log('\n⚙️  Starting plan configuration...');
    
    const plans = await SubscriptionPlan.find();
    
    if (plans.length === 0) {
      console.log('⚠️  No subscription plans found in database');
      console.log('💡 Please create subscription plans first before running this script');
      return { configured: 0, skipped: 0 };
    }

    let configured = 0;
    let skipped = 0;

    for (const plan of plans) {
      const planName = plan.name;
      const config = planConfigurations[planName];

      if (!config) {
        console.log(`⚠️  No configuration found for plan: ${planName} - skipping`);
        skipped++;
        continue;
      }

      // Build allowedFeatures array
      const allowedFeatures = [];
      
      for (const [featureKey, settings] of Object.entries(config.features)) {
        if (settings.enabled) {
          allowedFeatures.push({
            featureKey,
            enabled: true,
            limit: settings.limit
          });
        }
      }

      // Update plan
      plan.allowedFeatures = allowedFeatures;
      plan.description = config.description || plan.description;
      await plan.save();

      console.log(`✅ Configured ${planName} plan with ${allowedFeatures.length} features`);
      configured++;
    }

    console.log(`\n✅ Successfully configured ${configured} plans`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} plans (no configuration available)`);
    }

    return { configured, skipped };
  } catch (error) {
    console.error('❌ Error configuring plans:', error);
    throw error;
  }
};

// Display summary
const displaySummary = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    // Count features
    const featureCount = await FeatureDefinition.countDocuments();
    const featuresByCategory = await FeatureDefinition.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log(`\n📦 Features: ${featureCount} total`);
    featuresByCategory.forEach(cat => {
      console.log(`   - ${cat._id}: ${cat.count} features`);
    });

    // Count plans
    const plans = await SubscriptionPlan.find().select('name allowedFeatures');
    console.log(`\n📋 Subscription Plans: ${plans.length} total`);
    
    for (const plan of plans) {
      const enabledCount = plan.allowedFeatures?.length || 0;
      const unlimitedCount = plan.allowedFeatures?.filter(f => f.limit === null).length || 0;
      console.log(`   - ${plan.name}: ${enabledCount} features (${unlimitedCount} unlimited)`);
    }

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Error displaying summary:', error);
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Feature & Plan Seeding Script');
    console.log('='.repeat(60));

    // Connect to database
    await connectDB();

    // Seed features
    const featureResult = await seedFeatures();

    // Configure plans
    const planResult = await configurePlans();

    // Display summary
    await displaySummary();

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Visit /admin/features to verify configuration');
    console.log('   2. Adjust limits if needed');
    console.log('   3. Test with different user roles');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  seedFeatures,
  configurePlans,
  planConfigurations
};
