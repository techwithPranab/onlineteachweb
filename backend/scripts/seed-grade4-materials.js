require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course.model');
const Material = require('../models/Material.model');
const User = require('../models/User.model');

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in environment');

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Find a tutor or admin to assign as material owner
    const tutorUser = await User.findOne({ role: { $in: ['tutor', 'admin'] } });
    if (!tutorUser) throw new Error('No tutor or admin user found. Create one before running seed.');

    // Map of course title keyword to materials to add
    const seedPlan = [
      {
        keyword: 'Number System and Place Value',
        materials: [
          {
            title: 'Place Value Basics - Understanding units, tens and hundreds',
            description: 'A beginner-friendly explanation of place value with examples',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'lesson',
            isFree: true,
            previewContent: 'Learn the fundamentals of place value and how digits represent different values based on their position.',
            content: `### Place Value (Introduction)\n\nEvery digit in a number has a place value. For example, in 1,234:\n\n- 4 is in the units place\n- 3 is in the tens place (10s)\n- 2 is in the hundreds place (100s)\n- 1 is in the thousands place (1000s)\n\nThis helps us read and write large numbers easily.`
          },
          {
            title: 'Place Value Worksheets - Practice Exercises',
            description: 'Interactive worksheets for place value practice',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'worksheet',
            isFree: false,
            previewContent: 'Practice identifying place values with these interactive exercises.',
            content: `## Place Value Practice Worksheets\n\n### Exercise 1: Identify Place Values\n\nWrite the place value of the underlined digit:\n\n1. 2,345 (hundreds place)\n2. 67,891 (tens place)\n3. 123,456 (thousands place)\n\n### Exercise 2: Build Numbers\n\nWrite the number:\n- 3 thousands + 2 hundreds + 5 tens + 7 units = 3,257\n- 1 ten thousand + 4 thousands + 6 hundreds + 8 tens + 2 units = 14,682`
          },
          {
            title: 'Comparing and ordering numbers',
            description: 'How to compare numbers with place value',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'lesson',
            isFree: false,
            previewContent: 'Master the art of comparing large numbers using place value concepts.',
            content: `#### Comparing numbers\n\nTo compare numbers, look at the leftmost digit (highest place value). The larger digit means the number is larger. Example: 563 > 549 because 5 = 5 (hundreds), but 6 (tens) > 4 (tens).`
          },
          {
            title: 'Place Value Word Problems - Advanced',
            description: 'Complex word problems involving place value',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'advanced',
            category: 'practice-quiz',
            isFree: false,
            previewContent: 'Challenge yourself with advanced place value word problems.',
            content: `## Advanced Place Value Word Problems\n\n### Problem 1\nA town has 15,234 residents. Round this number to the nearest thousand.\n\n**Solution:** 15,234 rounded to nearest thousand is 15,000.\n\n### Problem 2\nWrite 5,00,000 in words and identify the place value of each digit.`
          }
        ]
      },
      {
        keyword: 'Addition and Subtraction',
        materials: [
          {
            title: 'Adding multi-digit numbers using column addition',
            description: 'Step-by-step column method',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'lesson',
            isFree: true,
            previewContent: 'Learn the column method for adding large numbers step by step.',
            content: `Practice column addition with carrying. Example:\n\n456 + 378 = 834\n\nExplain carry over to the next column.`
          },
          {
            title: 'Addition Word Problems - Basic',
            description: 'Simple word problems for addition practice',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'worked-example',
            isFree: true,
            previewContent: 'Solve real-world addition problems with step-by-step solutions.',
            content: `## Addition Word Problems\n\n### Example 1\nRahul has 245 marbles. He buys 178 more. How many marbles does he have now?\n\n**Solution:** 245 + 178 = 423 marbles\n\n### Example 2\nA school has 1,234 students in the morning. 567 more join in the afternoon. How many students are there now?`
          },
          {
            title: 'Subtraction using borrowing',
            description: 'Borrowing in subtraction explained with examples',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'lesson',
            isFree: false,
            previewContent: 'Master the borrowing technique for subtraction of large numbers.',
            content: `When subtracting, if a digit in the minuend is smaller than the corresponding digit in the subtrahend, borrow 1 from the next higher place value.`
          },
          {
            title: 'Mixed Addition and Subtraction Worksheets',
            description: 'Practice sheets combining addition and subtraction',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'worksheet',
            isFree: false,
            previewContent: 'Comprehensive worksheets covering both addition and subtraction operations.',
            content: `## Mixed Operations Practice\n\n### Exercise 1: Addition\n1. 2,345 + 1,678 = ?\n2. 5,432 + 2,891 = ?\n\n### Exercise 2: Subtraction\n1. 4,567 - 2,389 = ?\n2. 8,921 - 5,643 = ?\n\n### Exercise 3: Word Problems\n1. A shop sold 3,456 books on Monday and 2,189 on Tuesday. How many books were sold in total?\n2. There were 5,000 students. 1,234 left for vacation. How many remain?`
          },
          {
            title: 'Advanced Subtraction with Borrowing',
            description: 'Complex subtraction problems requiring multiple borrowing',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'advanced',
            category: 'practice-quiz',
            isFree: false,
            previewContent: 'Challenge your subtraction skills with complex borrowing scenarios.',
            content: `## Advanced Subtraction Practice\n\n### Problem 1\nSubtract 4,827 from 10,000\n\n**Solution:** 10,000 - 4,827 = 5,173\n\n### Problem 2\nCalculate: 50,000 - 27,839 = ?\n\n**Step-by-step:**\n1. Start from right: 000 - 839\n2. Borrow from thousands place\n3. Continue borrowing as needed`
          }
        ]
      },
      {
        keyword: 'Multiplication and Division',
        materials: [
          {
            title: 'Multiplication tables and techniques',
            description: 'Multiplication basics for quick recall',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'reference',
            isFree: true,
            previewContent: 'Master multiplication tables 2-12 with memory techniques.',
            content: `Memorize tables (2–12) and use doubling/halving tricks for fast calculation.`
          },
          {
            title: 'Multiplication Worksheets - Tables Practice',
            description: 'Practice sheets for multiplication tables',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'worksheet',
            isFree: true,
            previewContent: 'Interactive worksheets to practice multiplication tables.',
            content: `## Multiplication Tables Practice\n\n### Table of 2\n2 × 1 = 2\n2 × 2 = 4\n2 × 3 = 6\n... up to 2 × 10 = 20\n\n### Table of 5\n5 × 1 = 5\n5 × 2 = 10\n5 × 3 = 15\n... up to 5 × 10 = 50\n\n### Practice Questions\n1. 7 × 8 = ?\n2. 9 × 6 = ?\n3. 12 × 12 = ?`
          },
          {
            title: 'Long division (introduction)',
            description: 'How to divide larger numbers using long division',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'lesson',
            isFree: false,
            previewContent: 'Learn the step-by-step process of long division.',
            content: `Long division is breaking down a division into smaller steps. Practice with 3-digit dividends.`
          },
          {
            title: 'Multiplication Word Problems',
            description: 'Real-world problems requiring multiplication',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'worked-example',
            isFree: false,
            previewContent: 'Apply multiplication to solve everyday problems.',
            content: `## Multiplication Word Problems\n\n### Example 1\nA classroom has 25 students. Each student has 12 pencils. How many pencils are there?\n\n**Solution:** 25 × 12 = 300 pencils\n\n### Example 2\nA farmer has 15 cows. Each cow gives 8 liters of milk daily. How much milk does he get?`
          },
          {
            title: 'Division with Remainders - Practice Quiz',
            description: 'Advanced division problems with remainders',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'advanced',
            category: 'practice-quiz',
            isFree: false,
            previewContent: 'Master division with remainders through practice problems.',
            content: `## Division with Remainders Quiz\n\n### Problem 1\nDivide 47 ÷ 3\n\n**Solution:** 15 remainder 2 (47 = 15 × 3 + 2)\n\n### Problem 2\nShare 156 chocolates equally among 7 children. How many each and how many remain?\n\n**Solution:** 22 each with 2 remaining`
          }
        ]
      },
      {
        keyword: 'Fractions',
        materials: [
          {
            title: 'Introduction to fractions',
            description: 'Parts of a whole explained',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'lesson',
            isFree: true,
            previewContent: 'Learn what fractions are and how they represent parts of a whole.',
            content: `Fractions represent part of a whole. Example: $\\frac{1}{2}$ is one half.\\n\\nAdd fractions with like denominators: $\\frac{1}{4} + \\frac{1}{4} = \\frac{2}{4} = \\frac{1}{2}$.`
          },
          {
            title: 'Visual Fraction Worksheets',
            description: 'Interactive worksheets for understanding fractions visually',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'worksheet',
            isFree: true,
            previewContent: 'Practice identifying and shading fractions with visual aids.',
            content: `## Visual Fractions Practice\n\n### Exercise 1: Shade the fractions\n\n1. Shade $\\frac{1}{2}$ of the circle\n2. Shade $\\frac{3}{4}$ of the rectangle\n3. Shade $\\frac{2}{3}$ of the pizza\n\n### Exercise 2: Identify fractions\n\nLook at the shaded parts and write the fraction:\n1. [Half-shaded circle] = $\\frac{1}{2}$\n2. [Three-quarters shaded square] = $\\frac{3}{4}$`
          },
          {
            title: 'Equivalent fractions and simplification',
            description: 'How to find equivalent fractions',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'lesson',
            isFree: false,
            previewContent: 'Learn to simplify fractions and find equivalent forms.',
            content: `Two fractions are equivalent if they represent the same value, e.g., $\\frac{2}{4} = \\frac{1}{2}$.`
          },
          {
            title: 'Fraction Operations - Addition and Subtraction',
            description: 'Adding and subtracting fractions with like denominators',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'worked-example',
            isFree: false,
            previewContent: 'Step-by-step examples of fraction addition and subtraction.',
            content: `## Fraction Operations\n\n### Addition\n$\\frac{1}{4} + \\frac{2}{4} = \\frac{3}{4}$\n\n### Subtraction\n$\\frac{3}{5} - \\frac{1}{5} = \\frac{2}{5}$\n\n### Word Problem\nA pizza is divided into 8 equal slices. Rahul ate 3 slices and Priya ate 2 slices. What fraction of pizza remains?`
          },
          {
            title: 'Comparing Fractions - Advanced Problems',
            description: 'Complex fraction comparison and ordering',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'advanced',
            category: 'practice-quiz',
            isFree: false,
            previewContent: 'Challenge your fraction skills with comparison problems.',
            content: `## Advanced Fraction Comparison\n\n### Problem 1\nCompare: $\\frac{3}{4}$ and $\\frac{5}{6}$\n\n**Solution:** Find common denominator 12:\n$\\frac{3}{4} = \\frac{9}{12}$, $\\frac{5}{6} = \\frac{10}{12}$\nSo $\\frac{5}{6} > \\frac{3}{4}$\n\n### Problem 2\nOrder from smallest to largest: $\\frac{1}{2}, \\frac{2}{3}, \\frac{3}{4}, \\frac{4}{5}$`
          }
        ]
      },
      {
        keyword: 'Geometry',
        materials: [
          {
            title: 'Basic shapes and their properties',
            description: 'Lines, angles, polygons',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'lesson',
            isFree: true,
            previewContent: 'Explore the world of 2D and 3D shapes and their properties.',
            content: `Learn about triangles, quadrilaterals, circles and more. Angle basics and perimeter.`
          },
          {
            title: 'Shape Identification Worksheets',
            description: 'Practice identifying different geometric shapes',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'basic',
            category: 'worksheet',
            isFree: true,
            previewContent: 'Interactive exercises to identify and classify geometric shapes.',
            content: `## Shape Identification Practice\n\n### Exercise 1: Name the Shapes\n\n1. A shape with 3 sides: Triangle\n2. A shape with 4 equal sides: Square\n3. A shape with no sides, perfectly round: Circle\n\n### Exercise 2: Properties\n\n- Triangle: 3 sides, 3 angles\n- Rectangle: 4 sides, opposite sides equal, 4 right angles\n- Circle: No sides, all points equidistant from center`
          },
          {
            title: 'Understanding Angles',
            description: 'Types of angles and angle measurement',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'lesson',
            isFree: false,
            previewContent: 'Learn about acute, obtuse, and right angles with examples.',
            content: `## Types of Angles\n\n- **Right Angle**: 90° (like corner of a book)\n- **Acute Angle**: Less than 90°\n- **Obtuse Angle**: More than 90° but less than 180°\n- **Straight Angle**: 180°\n\n### Measuring Angles\nUse a protractor to measure angles accurately.`
          },
          {
            title: 'Perimeter and Area Calculations',
            description: 'Calculating perimeter and area of basic shapes',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'intermediate',
            category: 'worked-example',
            isFree: false,
            previewContent: 'Step-by-step examples of perimeter and area calculations.',
            content: `## Perimeter and Area\n\n### Rectangle\n- Perimeter = 2 × (length + width)\n- Area = length × width\n\n### Square\n- Perimeter = 4 × side\n- Area = side × side\n\n### Triangle\n- Area = $\\frac{1}{2}$ × base × height\n\n### Example\nRectangle: length=8cm, width=5cm\n- Perimeter = 2×(8+5) = 26cm\n- Area = 8×5 = 40cm²`
          },
          {
            title: 'Geometry Problem Solving Quiz',
            description: 'Complex geometry problems combining multiple concepts',
            type: 'article',
            contentFormat: 'markdown',
            difficulty: 'advanced',
            category: 'practice-quiz',
            isFree: false,
            previewContent: 'Challenge your geometry skills with comprehensive problems.',
            content: `## Advanced Geometry Problems\n\n### Problem 1\nA rectangular garden is 12m long and 8m wide. Find its perimeter and area. Also, find the cost of fencing it at ₹50 per meter.\n\n**Solution:**\n- Perimeter = 2×(12+8) = 40m\n- Area = 12×8 = 96m²\n- Fencing cost = 40×50 = ₹2,000\n\n### Problem 2\nA triangle has base 10cm and height 6cm. Find its area. If the same area is covered by a square, find the side of the square.`
          }
        ]
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const plan of seedPlan) {
      const courses = await Course.find({ title: new RegExp(plan.keyword, 'i') });
      if (!courses || courses.length === 0) {
        console.log(`No courses found for keyword: ${plan.keyword}`);
        continue;
      }

      for (const course of courses) {
        for (const mat of plan.materials) {
          const existing = await Material.findOne({ course: course._id, title: mat.title });
          if (existing) {
            // Update existing material with new fields if missing
            const updateData = {};
            if (!existing.previewContent && mat.previewContent) {
              updateData.previewContent = mat.previewContent;
            }
            if (!existing.difficulty && mat.difficulty) {
              updateData.difficulty = mat.difficulty;
            }
            if (!existing.category && mat.category) {
              updateData.category = mat.category;
            }
            
            if (Object.keys(updateData).length > 0) {
              await Material.findByIdAndUpdate(existing._id, updateData);
              console.log(`Updated material: ${mat.title} for course ${course.title}`);
              updatedCount++;
            } else {
              console.log(`Material already up-to-date: ${mat.title} for course ${course.title}`);
            }
            continue;
          }

          const created = await Material.create({
            course: course._id,
            tutor: tutorUser._id,
            title: mat.title,
            description: mat.description,
            type: mat.type,
            content: mat.content,
            contentFormat: mat.contentFormat,
            previewContent: mat.previewContent,
            difficulty: mat.difficulty,
            category: mat.category,
            isFree: mat.isFree,
            tags: mat.tags || (course.board && course.board.length ? course.board : [])
          });

          console.log(`Created material: ${created.title} for course ${course.title}`);
          createdCount++;
        }
      }
    }

    console.log(`Seed complete. Materials created: ${createdCount}, Materials updated: ${updatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
