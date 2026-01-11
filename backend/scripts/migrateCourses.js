const mongoose = require('mongoose');
const Course = require('../models/Course.model');
const User = require('../models/User.model');

// Migration script to update existing courses
async function migrateCourses() {
  try {
    console.log('Starting course migration...');

    // Find all courses with tutor field
    const courses = await Course.find({ tutor: { $exists: true } });
    console.log(`Found ${courses.length} courses to migrate`);

    // Find the first admin user to assign as creator
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create a default admin user if none exists
      console.log('No admin user found, creating default admin...');
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@onlineteaching.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      });
      console.log('Default admin created');
    }

    for (const course of courses) {
      // Update the course to use createdBy instead of tutor
      await Course.findByIdAndUpdate(course._id, {
        $set: { createdBy: adminUser._id },
        $unset: { tutor: 1 }
      });
      
      console.log(`Migrated course: ${course.title}`);
    }

    console.log('Course migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_teaching';
  
  mongoose.connect(mongoURI)
    .then(() => {
      console.log('Connected to MongoDB');
      return migrateCourses();
    })
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = { migrateCourses };
