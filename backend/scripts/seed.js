require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User.model');
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
    await SubscriptionPlan.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@meritai.in',
      password: 'Kolkata@84',
      role: 'admin',
      status: 'active',
      emailVerified: true
    });
    
    console.log('Created admin user');
    
    // Create sample tutors
    const tutors = await User.create([
      {
        name: 'Pranab Kumar',
        email: 'pranabpiitk2024@gmail.com',
        password: 'Kolkata@84',
        role: 'tutor',
        status: 'active',
        subjects: ['Mathematics', 'Physics'],
        bio: 'Experienced mathematics and physics teacher.',
        qualifications: [
          { degree: 'MSc in Mathematics', institution: 'IIT', year: 2016 }
        ],
        experience: 6,
        rating: 4.8,
        emailVerified: true
      }
    ]);
    
    console.log('Created sample tutors');
    
    // Create sample students
    const students = await User.create([
      {
        name: 'Pranab Student',
        email: 'pranabpiitk@gmail.com',
        password: 'Kolkata@84',
        role: 'student',
        grade: 4,
        status: 'active',
        emailVerified: true
      }
    ]);
    
    console.log('Created sample students');
    
    console.log('Created sample students');
    
    // Create subscription plans (Free + Standard Monthly + Standard Annual)
    const plans = await SubscriptionPlan.create([
      {
        name: 'Free',
        description: 'Free plan - 5 quizzes per subject per month, progress reports, and access to online study material',
        price: 0,
        interval: 'month',
        features: [
          '5 Quizzes per Subject / month',
          'Progress Report',
          'Online Study Material'
        ],
        maxCourses: 0,
        maxLiveSessions: 0,
        priority: 1,
        currency: 'INR',
        isActive: true
      },
      {
        name: 'Standard (Monthly)',
        description: 'Standard monthly subscription - unlimited quizzes, study material, progress tracking & analytics, and AI question generation',
        price: 100,
        currency: 'INR',
        interval: 'month',
        features: [
          'Unlimited Quizzes',
          'Study Material',
          'Progress Tracking & Analytics',
          'AI Question Generation & Practice',
          'Detailed Explanations & Solutions',
          'Full Access to Question Bank'
        ],
        maxCourses: -1,
        maxLiveSessions: -1,
        priority: 2,
        isActive: true
      },
      {
        name: 'Standard (Annual)',
        description: 'Standard annual subscription (best value)',
        price: 1000,
        currency: 'INR',
        interval: 'year',
        features: [
          'Unlimited Quizzes',
          'Study Material',
          'Progress Tracking & Analytics',
          'AI Question Generation & Practice',
          'Detailed Explanations & Solutions',
          'Full Access to Question Bank'
        ],
        maxCourses: -1,
        maxLiveSessions: -1,
        priority: 3,
        isActive: true
      }
    ]);
    
    console.log('Created subscription plans');
    
    console.log('\n=== Seed Data Summary ===');
    console.log('Admin:', admin.email, '/ Kolkata@84');
    console.log('\nTutors:');
    tutors.forEach(t => console.log(`  - ${t.email} / Kolkata@84`));
    console.log('\nStudents:');
    students.forEach(s => console.log(`  - ${s.email} / Kolkata@84`));
    console.log('\nSubscription Plans:', plans.length);
    
    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
