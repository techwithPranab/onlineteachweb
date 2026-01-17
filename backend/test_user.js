const mongoose = require('mongoose');
const User = require('./models/User.model');
const { generateToken } = require('./utils/tokenUtils');

async function createTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online-teaching', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Check if test user exists
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('Created test user');
    }

    const token = generateToken(user._id);
    console.log('JWT Token:', token);
    console.log('User ID:', user._id);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser();
