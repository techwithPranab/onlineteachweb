require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Course = require('../models/Course.model');
const User = require('../models/User.model');

/**
 * Seed Grade 5 Mathematics courses from JSON file
 */
const seedGrade5MathCourses = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    console.log(`✅ Found admin user: ${admin.email}`);

    // Read JSON file
    const jsonPath = path.join(__dirname, '../../Data/grade5_mathematics_courses.json');
    const coursesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`✅ Loaded ${coursesData.length} courses from JSON file`);

    // Delete existing Grade 5 Mathematics courses
    const deleteResult = await Course.deleteMany({ 
      grade: 5, 
      subject: 'Mathematics' 
    });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing Grade 5 Mathematics courses`);

    // Replace placeholder with actual admin ID
    const coursesToCreate = coursesData.map(course => ({
      ...course,
      createdBy: admin._id
    }));

    // Insert courses
    const createdCourses = await Course.insertMany(coursesToCreate);
    console.log(`✅ Successfully created ${createdCourses.length} Grade 5 Mathematics courses`);

    // Display summary
    console.log('\n📚 CREATED COURSES:');
    console.log('='.repeat(80));
    createdCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   📖 Topics: ${course.topics.length} | Chapters: ${course.chapters.length}`);
      console.log(`   💰 Price: ₹${course.price} | Level: ${course.level} | Difficulty: ${course.difficulty}/5`);
      console.log(`   ⏱️  Duration: ${course.duration} (${course.estimatedHours} hours)`);
      console.log(`   📋 Status: ${course.status} | Active: ${course.isActive}`);
      console.log('-'.repeat(80));
    });

    console.log('\n✨ Grade 5 Mathematics courses seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding Grade 5 Mathematics courses:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedGrade5MathCourses();
}

module.exports = seedGrade5MathCourses;
