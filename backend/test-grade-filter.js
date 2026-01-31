const mongoose = require('mongoose');
const Course = require('./models/Course.model');
const User = require('./models/User.model');

async function testGradeFilter() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online_teaching');

    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('No student found');
      process.exit(0);
    }

    console.log('Testing for student grade:', student.grade);

    const subjectsWithCourses = await Course.aggregate([
      { $match: { grade: student.grade } },
      { $group: { _id: '$subject', courses: { $push: { _id: '$_id', title: '$title', grade: '$grade' } } } },
      { $project: { _id: 0, name: '$_id', courses: 1 } },
      { $sort: { name: 1 } }
    ]);

    console.log('Subjects for grade', student.grade, ':', subjectsWithCourses.length, 'subjects found');
    subjectsWithCourses.forEach(s => console.log('- Subject:', s.name, 'Courses:', s.courses.length));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testGradeFilter();
