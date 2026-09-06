#!/usr/bin/env node

const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User.model');

const GRADES = [4, 5, 6, 7, 8, 9, 10];
const STUDENTS_PER_GRADE = 1;
const FALLBACK_PASSWORD = 'MeritAI@123';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const confirmed = args.includes('--yes');
const passwordArgument = args.find(argument => argument.startsWith('--password='));
const password = passwordArgument?.slice('--password='.length)
  || process.env.DEFAULT_STUDENT_PASSWORD
  || FALLBACK_PASSWORD;

const printUsage = () => {
  console.log(`
Create or update 10 student accounts for each grade from Grade 4 through Grade 10.

Usage:
  node backend/scripts/seed-grade4-10-students.js --dry-run
  node backend/scripts/seed-grade4-10-students.js --yes
  node backend/scripts/seed-grade4-10-students.js --yes --password=YourSecurePassword

Options:
  --dry-run             Preview and validate accounts without connecting to MongoDB.
  --yes                 Confirm creation or update of the generated student accounts.
  --password=<password> Override DEFAULT_STUDENT_PASSWORD or the fallback password.
  --help                Show this help message.

Default password: ${FALLBACK_PASSWORD}
`);
};

const buildStudents = () => GRADES.flatMap(grade =>
  Array.from({ length: STUDENTS_PER_GRADE }, (_, index) => {
    const studentNumber = String(index + 1).padStart(2, '0');
    return {
      name: `Grade ${grade} Student ${studentNumber}`,
      email: `student-grade${grade}-${studentNumber}@meritai.test`,
      role: 'student',
      grade,
      status: 'active',
      emailVerified: true
    };
  })
);

const validateInput = students => {
  if (password.length < 6) throw new Error('The default password must contain at least 6 characters.');

  const emails = new Set();
  for (const student of students) {
    if (emails.has(student.email)) throw new Error(`Duplicate generated email: ${student.email}`);
    emails.add(student.email);

    const validationError = new User({ ...student, password }).validateSync();
    if (validationError) throw new Error(`Invalid student ${student.email}: ${validationError.message}`);
  }
};

const printSummary = students => {
  const summary = GRADES.map(grade => {
    const gradeStudents = students.filter(student => student.grade === grade);
    return {
      grade,
      students: gradeStudents.length,
      firstEmail: gradeStudents[0].email,
      lastEmail: gradeStudents.at(-1).email
    };
  });

  console.table(summary);
  console.log(`Total student accounts: ${students.length}`);
  console.log(`Default password: ${password}`);
};

const main = async () => {
  if (args.includes('--help')) {
    printUsage();
    return;
  }

  const unknownArgs = args.filter(argument =>
    !['--dry-run', '--yes', '--help'].includes(argument)
    && !argument.startsWith('--password=')
  );
  if (unknownArgs.length) throw new Error(`Unknown option(s): ${unknownArgs.join(', ')}`);

  const students = buildStudents();
  validateInput(students);
  console.log('Validated generated Grade 4-10 student accounts:');
  printSummary(students);

  if (dryRun) {
    console.log('\nDry run completed. MongoDB was not contacted or changed.');
    return;
  }

  if (!confirmed) {
    console.error('\nNo database changes were made. Run again with --yes to create the accounts.');
    process.exitCode = 1;
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined. Add it to backend/.env or the terminal environment.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`\nConnected to MongoDB database: ${mongoose.connection.name}`);

  const existingEmails = new Set(
    (await User.find({ email: { $in: students.map(student => student.email) } })
      .select('email')
      .lean())
      .map(user => user.email)
  );

  const result = await User.bulkWrite(
    students.map(student => ({
      updateOne: {
        filter: { email: student.email },
        update: {
          $set: { ...student, password: passwordHash },
          $setOnInsert: {
            enrolledCourses: [],
            featureUsage: [],
            restrictedFeatures: [],
            refreshTokens: []
          }
        },
        upsert: true
      }
    })),
    { ordered: true }
  );

  const verifiedCounts = await User.aggregate([
    {
      $match: {
        email: { $in: students.map(student => student.email) },
        role: 'student',
        grade: { $in: GRADES }
      }
    },
    { $group: { _id: '$grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const countByGrade = new Map(verifiedCounts.map(item => [item._id, item.count]));
  const invalidGrade = GRADES.find(grade => countByGrade.get(grade) !== STUDENTS_PER_GRADE);
  if (invalidGrade) {
    throw new Error(`Post-seed verification failed for Grade ${invalidGrade}.`);
  }

  console.log('\nStudent seeding completed successfully:');
  console.table({
    created: students.length - existingEmails.size,
    updated: existingEmails.size,
    totalMatched: result.matchedCount,
    totalUpserted: result.upsertedCount
  });
  console.log(`Verified ${STUDENTS_PER_GRADE} generated students in each Grade 4-10.`);
  console.warn('All generated students share the displayed password. Change it for production use.');
};

main()
  .catch(error => {
    console.error(`\nStudent seeding failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });

