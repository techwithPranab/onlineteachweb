#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Course = require('../models/Course.model');
const Material = require('../models/Material.model');

const DATA_DIRECTORY = path.resolve(__dirname, '../../Data');
const GRADES = [4, 5, 6, 7, 8, 9, 10];
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const confirmed = args.has('--yes');

const printUsage = () => {
  console.log(`
Replace all courses and materials with Grade 4-10 Mathematics data.

Usage:
  node backend/scripts/replace-grade4-10-math-data.js --dry-run
  node backend/scripts/replace-grade4-10-math-data.js --yes

Options:
  --dry-run  Validate every source file without connecting to or changing MongoDB.
  --yes      Confirm deletion of every document in the courses and materials collections.
  --help     Show this help message.
`);
};

const deserializeExtendedJson = value => {
  if (Array.isArray(value)) return value.map(deserializeExtendedJson);
  if (!value || typeof value !== 'object') return value;

  const keys = Object.keys(value);
  if (keys.length === 1 && typeof value.$oid === 'string') {
    if (!mongoose.isObjectIdOrHexString(value.$oid)) {
      throw new Error(`Invalid MongoDB ObjectId: ${value.$oid}`);
    }
    return new mongoose.Types.ObjectId(value.$oid);
  }
  if (keys.length === 1 && typeof value.$date === 'string') {
    const parsedDate = new Date(value.$date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid MongoDB date: ${value.$date}`);
    }
    return parsedDate;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, deserializeExtendedJson(entry)])
  );
};

const readJsonArray = filePath => {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read ${filePath}: ${error.message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON array.`);
  }
  return parsed.map(deserializeExtendedJson);
};

const loadAndValidateData = () => {
  const courses = [];
  const materials = [];
  const sourceSummary = [];

  for (const grade of GRADES) {
    const gradeDirectory = path.join(DATA_DIRECTORY, `Grade${grade}`);
    const coursePath = path.join(gradeDirectory, `grade${grade}_math_courses.json`);
    const materialPath = path.join(gradeDirectory, `grade${grade}_math_materials.json`);

    if (!fs.existsSync(coursePath)) throw new Error(`Missing course file: ${coursePath}`);
    if (!fs.existsSync(materialPath)) throw new Error(`Missing material file: ${materialPath}`);

    const gradeCourses = readJsonArray(coursePath);
    const gradeMaterials = readJsonArray(materialPath);

    for (const course of gradeCourses) {
      if (course.grade !== grade) {
        throw new Error(`${coursePath} contains a course whose grade is ${course.grade}.`);
      }
      if (course.subject !== 'Mathematics') {
        throw new Error(`${coursePath} contains a non-Mathematics course: ${course.title}.`);
      }
    }

    courses.push(...gradeCourses);
    materials.push(...gradeMaterials);
    sourceSummary.push({ grade, courses: gradeCourses.length, materials: gradeMaterials.length });
  }

  const courseIds = new Set();
  const materialIds = new Set();
  for (const course of courses) {
    const id = course._id?.toString();
    if (!id) throw new Error(`Course is missing _id: ${course.title || 'untitled course'}.`);
    if (courseIds.has(id)) throw new Error(`Duplicate course _id: ${id}.`);
    courseIds.add(id);

    const validationError = new Course(course).validateSync();
    if (validationError) throw new Error(`Invalid course "${course.title}": ${validationError.message}`);
  }

  for (const material of materials) {
    const id = material._id?.toString();
    const linkedCourseId = material.course?.toString();
    if (!id) throw new Error(`Material is missing _id: ${material.title || 'untitled material'}.`);
    if (materialIds.has(id)) throw new Error(`Duplicate material _id: ${id}.`);
    if (!courseIds.has(linkedCourseId)) {
      throw new Error(`Material "${material.title}" references missing course ${linkedCourseId}.`);
    }
    materialIds.add(id);

    const validationError = new Material(material).validateSync();
    if (validationError) throw new Error(`Invalid material "${material.title}": ${validationError.message}`);
  }

  return { courses, materials, sourceSummary };
};

const printSummary = ({ courses, materials, sourceSummary }) => {
  console.log('\nValidated source data:');
  console.table(sourceSummary);
  console.log(`Total courses:   ${courses.length}`);
  console.log(`Total materials: ${materials.length}`);
};

const replaceCollections = async (data, session = null) => {
  const options = session ? { session } : {};
  const deletedMaterials = await Material.deleteMany({}, options);
  const deletedCourses = await Course.deleteMany({}, options);

  await Course.insertMany(data.courses, { ...options, ordered: true });
  await Material.insertMany(data.materials, { ...options, ordered: true });

  return {
    deletedCourses: deletedCourses.deletedCount,
    deletedMaterials: deletedMaterials.deletedCount,
    insertedCourses: data.courses.length,
    insertedMaterials: data.materials.length
  };
};

const main = async () => {
  if (args.has('--help')) {
    printUsage();
    return;
  }

  const unknownArgs = [...args].filter(arg => !['--dry-run', '--yes', '--help'].includes(arg));
  if (unknownArgs.length) throw new Error(`Unknown option(s): ${unknownArgs.join(', ')}`);

  console.log('Loading and validating Grade 4-10 Mathematics JSON files...');
  const data = loadAndValidateData();
  printSummary(data);

  if (dryRun) {
    console.log('\nDry run completed. MongoDB was not contacted or changed.');
    return;
  }

  if (!confirmed) {
    console.error('\nNo database changes were made. This operation deletes ALL courses and materials.');
    console.error('Run again with --yes after reviewing a database backup and the dry-run output.');
    process.exitCode = 1;
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined. Add it to backend/.env or the terminal environment.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`\nConnected to MongoDB database: ${mongoose.connection.name}`);

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  const supportsTransactions = Boolean(hello.setName || hello.msg === 'isdbgrid');
  let result;

  if (supportsTransactions) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        result = await replaceCollections(data, session);
      });
      console.log('Replacement committed in a MongoDB transaction.');
    } finally {
      await session.endSession();
    }
  } else {
    console.warn('MongoDB is running without transaction support; replacement will run sequentially.');
    result = await replaceCollections(data);
  }

  const finalCourseCount = await Course.countDocuments();
  const finalMaterialCount = await Material.countDocuments();
  if (finalCourseCount !== data.courses.length || finalMaterialCount !== data.materials.length) {
    throw new Error(
      `Post-insert count mismatch: expected ${data.courses.length}/${data.materials.length}, ` +
      `found ${finalCourseCount}/${finalMaterialCount} courses/materials.`
    );
  }

  console.log('\nDatabase replacement completed successfully:');
  console.table(result);
  console.log(`Verified database totals: ${finalCourseCount} courses, ${finalMaterialCount} materials.`);
};

main()
  .catch(error => {
    console.error(`\nDatabase replacement failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });

