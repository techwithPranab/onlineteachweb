require('dotenv').config();
const mongoose = require('mongoose');

// Models
const ContactInfo = require('../models/ContactInfo.model');

const seedContactInfo = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected');

    // Clear existing contact info
    await ContactInfo.deleteMany({});
    console.log('Cleared existing contact info');

    // Create contact info
    const contactInfo = await ContactInfo.create({
      email: 'support@meritai.in',
      phone: '+91 98765 43210',
      address: '123 Education Street, Tech Park, Bangalore, Karnataka 560001, India',
      businessHours: 'Mon-Fri, 9:00 AM - 8:00 PM IST | Sat, 9:00 AM - 5:00 PM IST',
      responseTimes: {
        email: 'Within 24 hours',
        phone: 'Immediate (during business hours)',
        chat: 'Within 5 minutes (during business hours)'
      }
    });

    console.log('Created contact info');

    console.log('\n=== Contact Info Seeded Successfully ===');
    console.log('Email:', contactInfo.email);
    console.log('Phone:', contactInfo.phone);
    console.log('Address:', contactInfo.address);
    console.log('Business Hours:', contactInfo.businessHours);
    console.log('Response Times:');
    console.log('  - Email:', contactInfo.responseTimes.email);
    console.log('  - Phone:', contactInfo.responseTimes.phone);
    console.log('  - Chat:', contactInfo.responseTimes.chat);

    console.log('\nContact info seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding contact info:', error);
    process.exit(1);
  }
};

seedContactInfo();
