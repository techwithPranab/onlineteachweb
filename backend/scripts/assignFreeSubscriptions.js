/**
 * Script to assign free subscription to all existing students
 * and create the "Free" plan if it doesn't exist.
 *
 * Usage: node backend/scripts/assignFreeSubscriptions.js
 */

const mongoose = require('mongoose');
const User = require('../models/User.model');
const { SubscriptionPlan, Subscription } = require('../models/Subscription.model');
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('Connected to MongoDB');

  let freePlan = await SubscriptionPlan.findOne({ name: 'Free' });
  if (!freePlan) {
    freePlan = await SubscriptionPlan.create({
      name: 'Free',
      description: 'Free plan with limited features',
      price: 0,
      interval: 'month',
      features: [],
      allowedFeatures: [],
      limits: {},
      quality: {}
    });
    console.log('Created Free plan');
  }

  const students = await User.find({ role: 'student' });
  console.log(`Found ${students.length} students`);

  for (const student of students) {
    if (!student.subscription) {
      const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const sub = await Subscription.create({
        user: student._id,
        plan: freePlan._id,
        status: 'active',
        startDate: new Date(),
        endDate,
        autoRenew: false
      });
      student.subscription = sub._id;
      student.activeSubscription = sub._id;
      await student.save();
      console.log(`Assigned free subscription to user ${student.email}`);
    }
  }

  console.log('Script complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
