require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('../models/Session.model');
const Course = require('../models/Course.model');
const User = require('../models/User.model');

const seedSessions = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB Connected');
    
    // Find courses and tutors
    const courses = await Course.find({ status: 'published' }).limit(4);
    const tutors = await User.find({ role: 'tutor', status: 'active' });
    
    if (courses.length === 0 || tutors.length === 0) {
      console.log('No courses or tutors found. Please run the main seed script first.');
      process.exit(1);
    }
    
    // Clear existing sessions
    await Session.deleteMany({});
    console.log('Cleared existing sessions');
    
    // Create sample sessions
    const now = new Date();
    const sessions = [];
    
    courses.forEach((course, index) => {
      const tutor = tutors[index % tutors.length];
      
      // Create 3 sessions per course
      for (let i = 0; i < 3; i++) {
        const daysAhead = (index * 3 + i + 1);
        const scheduledDate = new Date(now);
        scheduledDate.setDate(now.getDate() + daysAhead);
        scheduledDate.setHours(10 + (i * 2), 0, 0, 0); // 10 AM, 12 PM, 2 PM
        
        sessions.push({
          course: course._id,
          tutor: tutor._id,
          title: `${course.title} - Session ${i + 1}`,
          description: `Interactive live session covering key topics from ${course.title}. Join us for an engaging learning experience with Q&A.`,
          scheduledAt: scheduledDate,
          duration: 60, // 60 minutes
          status: 'scheduled',
          approvedBy: tutor._id, // Auto-approved for demo
          approvedAt: new Date(),
          isPaid: false,
          maxStudents: 30,
          attendees: [],
          roomId: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      }
    });
    
    const createdSessions = await Session.create(sessions);
    
    console.log('\n=== Sessions Seed Data Summary ===');
    console.log(`Created ${createdSessions.length} sessions`);
    console.log('\nSample Sessions:');
    
    createdSessions.slice(0, 5).forEach(session => {
      console.log(`  - ${session.title}`);
      console.log(`    Scheduled: ${session.scheduledAt.toLocaleString()}`);
      console.log(`    Duration: ${session.duration} minutes`);
      console.log(`    Status: ${session.status}`);
    });
    
    console.log('\nSessions seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding sessions:', error);
    process.exit(1);
  }
};

seedSessions();
