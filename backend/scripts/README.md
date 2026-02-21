# Database Seeding Scripts

This directory contains scripts for seeding the database with features and subscription plan configurations.

## 📋 Available Scripts

### 1. `seedFeaturesAndPlans.js`

**Purpose**: Comprehensive script that seeds all 35+ feature definitions and configures subscription plans (Free & Premium) with appropriate feature access and limits.

**What it does**:
- ✅ Seeds all feature definitions (35+ features across 8 categories)
- ✅ Configures Free and Premium subscription plans with features
- ✅ Sets appropriate limits for Free plan
- ✅ Enables unlimited access for Premium plan
- ✅ Displays summary of seeded data

**Usage**:
```bash
# From backend directory
cd backend
node scripts/seedFeaturesAndPlans.js

# Or from project root
node backend/scripts/seedFeaturesAndPlans.js
```

**Output Example**:
```
🚀 Feature & Plan Seeding Script
============================================================
✅ MongoDB connected successfully

📦 Starting feature seeding...
✅ Successfully seeded 37 features
ℹ️  Skipped 0 existing features

⚙️  Starting plan configuration...
✅ Configured Free plan with [X] features
✅ Configured Premium plan with 37 features

✅ Successfully configured 2 plans

============================================================
📊 SUMMARY
============================================================

📦 Features: 37 total
   - AI Features: 4 features
   - Community Features: 3 features
   - Course Access: 5 features
   - Live Sessions: 6 features
   - Materials & Downloads: 5 features
   - Performance Tracking: 5 features
   - Quiz Features: 6 features
   - Support & Help: 3 features

📋 Subscription Plans: 2 total
   - Free: [X] features ([Y] unlimited)
   - Premium: 37 features (37 unlimited)

============================================================

✅ Seeding completed successfully!

💡 Next steps:
   1. Visit /admin/features to verify configuration
   2. Adjust limits if needed
   3. Test with different user roles
```

---

## 🎯 Plan Configurations

### 🆓 Free Plan
**Features**: Limited access for getting started

**Enabled Features**:
- ✅ Course Enrollment: 3 courses
- ✅ Live Sessions: 10 sessions
- ✅ Quiz Taking: 20 quizzes
- ✅ Material Downloads: 50 downloads
- ✅ Material Viewing: Unlimited
- ✅ Basic Reports: Unlimited
- ✅ Discussion Boards: Unlimited
- ✅ AI Recommendations: Unlimited
- ✅ Email Support: Unlimited

**Disabled Features**:
- ❌ Premium courses
- ❌ HD video & recordings
- ❌ Quiz creation
- ❌ Advanced analytics
- ❌ AI question generation
- ❌ Priority support
- ❌ Advanced community features
- ❌ Premium courses, AI features, advanced analytics


### 💎 Premium Plan
**Features**: All 37 features enabled (unlimited access)

**What's Included**:
- ✅ **Everything Unlimited!**
- ✅ All course features (including premium)
- ✅ All live session features (HD, recordings, etc.)
- ✅ All quiz features (create, unlimited attempts)
- ✅ All material features (download, upload, advanced formats)
- ✅ All performance tracking features
- ✅ All AI features (generation, insights, recommendations)
- ✅ All community features (chat, study groups)
- ✅ Priority support with dedicated manager

---

## 🛠️ Feature Categories

### 1. Course Access (5 features)
- `courses.enroll` - Enroll in courses
- `courses.premium` - Access premium courses
- `courses.create` - Create courses (tutors)
- `courses.export` - Export course data
- `courses.analytics` - View course analytics

### 2. Live Sessions (6 features)
- `live_sessions.join` - Join live sessions
- `live_sessions.hd_video` - HD video quality
- `live_sessions.recording` - Access recordings
- `live_sessions.screen_share` - Screen sharing
- `live_sessions.unlimited` - Unlimited sessions
- `live_sessions.priority_support` - Priority support

### 3. Quiz Features (6 features)
- `quiz.take` - Take quizzes
- `quiz.create` - Create quizzes (tutors)
- `quiz.unlimited_attempts` - Unlimited attempts
- `quiz.detailed_analytics` - Detailed analytics
- `quiz.ai_generation` - AI question generation
- `quiz.export` - Export quiz data

### 4. Materials & Downloads (5 features)
- `materials.view` - View materials
- `materials.download` - Download materials
- `materials.unlimited` - Unlimited downloads
- `materials.upload` - Upload materials (tutors)
- `materials.advanced_formats` - Advanced formats (video, interactive)

### 5. Performance Tracking (5 features)
- `performance.basic_reports` - Basic progress reports
- `performance.detailed_analytics` - Detailed analytics
- `performance.comparison` - Compare with peers
- `performance.export` - Export performance data
- `performance.real_time` - Real-time tracking

### 6. AI Features (4 features)
- `ai.question_generation` - AI question generation
- `ai.answer_evaluation` - AI answer evaluation
- `ai.performance_insights` - AI performance insights
- `ai.personalized_recommendations` - Personalized recommendations

### 7. Community Features (3 features)
- `community.discussion_boards` - Discussion boards
- `community.peer_learning` - Peer learning groups
- `community.study_groups` - Study groups

### 8. Support & Help (3 features)
- `support.email` - Email support
- `support.priority` - Priority support
- `support.dedicated_manager` - Dedicated account manager

---

## 📝 Customization

### Modify Feature Limits

Edit `planConfigurations` object in `seedFeaturesAndPlans.js`:

```javascript
'Standard': {
  features: {
    'courses.enroll': { enabled: true, limit: 10 }, // Change limit
    'quiz.take': { enabled: true, limit: null },    // null = unlimited
    'materials.download': { enabled: false },       // Disable feature
  }
}
```

### Add New Features

1. Add feature definition in `services/featureDefinition.service.js`
2. Add to `planConfigurations` in seed script
3. Run seed script

### Create Custom Plans

1. Create plan in database (via admin or manually)
2. Add configuration to `planConfigurations`
3. Run seed script

---

## 🧪 Testing

### Test Feature Access
```javascript
// In your code
const { allowed } = await featureAccessService.checkAccess(user, 'courses.enroll');
console.log(allowed); // true or false
```

### Test Usage Tracking
```javascript
// Track usage
await featureAccessService.trackUsage(user, 'courses.enroll');

// Check remaining
const usage = await featureAccessService.getUserFeatureUsage(user._id, 'courses.enroll');
console.log(usage.remaining); // e.g., 1 (if limit was 2)
```

### Test Plan Configuration
```bash
# Check plan features
curl http://localhost:5000/api/admin/features/plans

# Check user features
curl http://localhost:5000/api/users/me/features \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Important Notes

1. **Run Once**: This script is idempotent - features won't be duplicated if run multiple times
2. **Existing Plans**: Script only configures existing plans in the database
3. **Backup First**: Always backup your database before running seed scripts
4. **Environment**: Ensure `.env` file has correct `MONGODB_URI`

---

## 🚀 Quick Start

```bash
# 1. Ensure MongoDB is running
mongod

# 2. Ensure backend .env is configured
cat backend/.env | grep MONGODB_URI

# 3. Run seed script
cd backend
node scripts/seedFeaturesAndPlans.js

# 4. Verify in admin panel
# Navigate to: http://localhost:3000/admin/features

# 5. Test with different users
# Login as Free, Standard, Premium users
```

---

## 📚 Related Documentation

- **Backend API**: `SUBSCRIPTION_SYSTEM_COMPLETE.md`
- **Frontend Components**: `FRONTEND_COMPONENTS_COMPLETE.md`
- **Integration Guide**: `FRONTEND_PAGES_INTEGRATION_COMPLETE.md`
- **Quick Reference**: `QUICK_REFERENCE.md`

---

## 🆘 Troubleshooting

### Issue: "No subscription plans found"
**Solution**: Create subscription plans first via admin panel or database

### Issue: MongoDB connection error
**Solution**: Check `.env` file has correct `MONGODB_URI`

### Issue: Features not appearing in UI
**Solution**: Restart backend server after seeding

### Issue: Plan not configured
**Solution**: Check plan name matches exactly (case-sensitive)

---

**Need help?** Check the full documentation or run the script with `--help` flag.
