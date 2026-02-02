require('dotenv').config();
const mongoose = require('mongoose');
const Achievement = require('./models/Achievement.model');

async function testAchievementSave() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test user ID (use a real one from your database)
    const testStudentId = '507f1f77bcf86cd799439011'; // Replace with actual student ID

    // Try to create an achievement
    console.log('\n🧪 Testing Achievement.create()...');
    
    const testBadge = {
      studentId: testStudentId,
      badgeType: 'first_quiz',
      badgeName: 'First Steps',
      badgeDescription: 'Completed your first quiz',
      badgeIcon: '🎯',
      badgeColor: '#4CAF50',
      level: 'bronze',
      points: 10,
      context: {
        metric: 'Test achievement'
      }
    };

    console.log('Attempting to create badge with data:', testBadge);
    
    const badge = await Achievement.create(testBadge);
    
    console.log('✅ Achievement created successfully!');
    console.log('Badge ID:', badge._id);
    console.log('Badge data:', JSON.stringify(badge, null, 2));

    // Verify it was saved
    const saved = await Achievement.findById(badge._id);
    console.log('\n✅ Achievement verified in database!');
    console.log('Saved badge:', saved);

    // Clean up test data
    await Achievement.deleteOne({ _id: badge._id });
    console.log('\n🧹 Test data cleaned up');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

testAchievementSave();
