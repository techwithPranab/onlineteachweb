require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User.model');
const Course = require('../models/Course.model');
const { SubscriptionPlan } = require('../models/Subscription.model');

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB Connected');
    
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await SubscriptionPlan.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@teachingplatform.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      emailVerified: true
    });
    
    console.log('Created admin user');
    
    // Create sample tutors
    const tutors = await User.create([
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        password: 'tutor123',
        role: 'tutor',
        status: 'active',
        subjects: ['Mathematics', 'Physics'],
        bio: 'Experienced mathematics and physics teacher with 10+ years of experience.',
        qualifications: [
          { degree: 'MSc in Mathematics', institution: 'MIT', year: 2010 },
          { degree: 'BSc in Physics', institution: 'Harvard', year: 2008 }
        ],
        experience: 10,
        rating: 4.8,
        emailVerified: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: 'tutor123',
        role: 'tutor',
        status: 'active',
        subjects: ['English', 'Literature'],
        bio: 'Passionate English literature teacher helping students excel.',
        qualifications: [
          { degree: 'MA in English Literature', institution: 'Oxford', year: 2012 }
        ],
        experience: 8,
        rating: 4.9,
        emailVerified: true
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        password: 'tutor123',
        role: 'tutor',
        status: 'active',
        subjects: ['Computer Science', 'Programming'],
        bio: 'Software engineer turned educator, teaching programming and CS concepts.',
        qualifications: [
          { degree: 'BS in Computer Science', institution: 'Stanford', year: 2015 }
        ],
        experience: 5,
        rating: 4.7,
        emailVerified: true
      }
    ]);
    
    console.log('Created sample tutors');
    
    // Create sample students
    const students = await User.create([
      {
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        password: 'student123',
        role: 'student',
        grade: 10,
        status: 'active',
        emailVerified: true
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        password: 'student123',
        role: 'student',
        grade: 11,
        status: 'active',
        emailVerified: true
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.anderson@example.com',
        password: 'student123',
        role: 'student',
        grade: 12,
        status: 'active',
        emailVerified: true
      }
    ]);
    
    console.log('Created sample students');
    
    // Create sample courses
    const courses = await Course.create([
      {
        title: 'Advanced Mathematics - Grade 10',
        description: 'Comprehensive mathematics course covering algebra, geometry, and trigonometry for grade 10 students.',
        createdBy: admin._id,
        grade: 10,
        subject: 'Mathematics',
        price: 99.99,
        syllabus: [
          'Algebra fundamentals',
          'Linear equations',
          'Quadratic equations',
          'Geometry basics',
          'Trigonometry introduction'
        ],
        status: 'published',
        level: 'intermediate'
      },
      {
        title: 'Physics Fundamentals',
        description: 'Introduction to physics concepts including mechanics, thermodynamics, and electricity.',
        createdBy: admin._id,
        grade: 11,
        subject: 'Physics',
        price: 89.99,
        syllabus: [
          'Newton\'s laws',
          'Energy and work',
          'Thermodynamics',
          'Electricity basics',
          'Magnetism'
        ],
        status: 'published',
        level: 'beginner'
      },
      {
        title: 'English Literature - Classic Novels',
        description: 'Explore classic literature with in-depth analysis and discussion.',
        createdBy: admin._id,
        grade: 12,
        subject: 'English',
        price: 79.99,
        syllabus: [
          'Victorian literature',
          'Romantic poetry',
          'Modern prose',
          'Literary analysis',
          'Essay writing'
        ],
        status: 'published',
        level: 'advanced'
      },
      {
        title: 'Introduction to Programming with Python',
        description: 'Learn programming basics using Python. Perfect for beginners.',
        createdBy: admin._id,
        grade: 9,
        subject: 'Computer Science',
        price: 119.99,
        syllabus: [
          'Python basics',
          'Data types and variables',
          'Control structures',
          'Functions and modules',
          'Object-oriented programming'
        ],
        status: 'published',
        level: 'beginner'
      }
    ]);
    
    console.log('Created sample courses');
    
    // Create subscription plans
    const plans = await SubscriptionPlan.create([
      {
        name: 'Basic',
        description: 'Perfect for trying out our platform',
        price: 9.99,
        interval: 'month',
        features: [
          'Access to 3 courses',
          'Join 5 live sessions per month',
          'Download materials',
          'Email support'
        ],
        maxCourses: 3,
        maxLiveSessions: 5,
        priority: 1,
        isActive: true
      },
      {
        name: 'Standard',
        description: 'Most popular plan for regular students',
        price: 29.99,
        interval: 'month',
        features: [
          'Access to 10 courses',
          'Unlimited live sessions',
          'Download materials',
          'Priority support',
          'Progress tracking'
        ],
        maxCourses: 10,
        maxLiveSessions: -1,
        priority: 2,
        isActive: true
      },
      {
        name: 'Premium',
        description: 'Complete access for serious learners',
        price: 49.99,
        interval: 'month',
        features: [
          'Unlimited courses',
          'Unlimited live sessions',
          'Download materials',
          '24/7 support',
          'Progress tracking',
          'One-on-one tutoring',
          'Exam preparation'
        ],
        maxCourses: -1,
        maxLiveSessions: -1,
        priority: 3,
        isActive: true
      },
      {
        name: 'Annual Premium',
        description: 'Best value - Premium features for a full year',
        price: 499.99,
        interval: 'year',
        features: [
          'Unlimited courses',
          'Unlimited live sessions',
          'Download materials',
          '24/7 support',
          'Progress tracking',
          'One-on-one tutoring',
          'Exam preparation',
          '2 months free'
        ],
        maxCourses: -1,
        maxLiveSessions: -1,
        priority: 4,
        isActive: true
      }
    ]);
    
    console.log('Created subscription plans');
    
    console.log('\n=== Seed Data Summary ===');
    console.log('Admin:', admin.email, '/ admin123');
    console.log('\nTutors:');
    tutors.forEach(t => console.log(`  - ${t.email} / tutor123`));
    console.log('\nStudents:');
    students.forEach(s => console.log(`  - ${s.email} / student123`));
    console.log('\nCourses:', courses.length);
    console.log('Subscription Plans:', plans.length);
    
    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
