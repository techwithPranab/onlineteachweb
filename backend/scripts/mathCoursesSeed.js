require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course.model');
const User = require('../models/User.model');

const mathCoursesData = {
  class5: {
    title: "Mathematics - Class 5 (CBSE/ICSE)",
    description: "Foundational mathematics for Class 5 students covering basic arithmetic, fractions, decimals, and geometry fundamentals.",
    grade: 5,
    syllabus: [
      "Large Numbers and Place Value",
      "Addition and Subtraction of Large Numbers", 
      "Multiplication and Division",
      "Factors and Multiples",
      "Fractions - Introduction and Basic Operations",
      "Decimals - Introduction and Place Value",
      "Measurement - Length, Weight, Capacity",
      "Time and Calendar",
      "Money - Addition and Subtraction",
      "Geometry - Basic Shapes and Patterns",
      "Perimeter and Area - Introduction",
      "Data Handling - Simple Graphs and Charts"
    ],
    chapters: [
      {
        name: "Number System",
        topics: ["Place Value", "Comparing Numbers", "Rounding Off", "Roman Numerals"],
        learningObjectives: ["Understand place value up to lakhs", "Compare and order large numbers", "Use Roman numerals I to C"]
      },
      {
        name: "Basic Operations", 
        topics: ["Addition", "Subtraction", "Multiplication", "Division", "Word Problems"],
        learningObjectives: ["Perform operations on large numbers", "Solve multi-step word problems", "Estimate answers"]
      },
      {
        name: "Fractions",
        topics: ["Understanding Fractions", "Equivalent Fractions", "Comparing Fractions", "Adding Fractions"],
        learningObjectives: ["Identify and represent fractions", "Find equivalent fractions", "Compare fractions with same denominators"]
      },
      {
        name: "Decimals",
        topics: ["Decimal Place Value", "Reading Decimals", "Comparing Decimals", "Money as Decimals"],
        learningObjectives: ["Understand decimal notation", "Compare decimals", "Use decimals in money contexts"]
      },
      {
        name: "Measurement",
        topics: ["Length", "Weight", "Capacity", "Time", "Temperature"],
        learningObjectives: ["Use standard units of measurement", "Convert between units", "Solve measurement problems"]
      },
      {
        name: "Geometry",
        topics: ["2D Shapes", "3D Shapes", "Lines and Angles", "Symmetry", "Patterns"],
        learningObjectives: ["Identify properties of shapes", "Recognize symmetry", "Create and extend patterns"]
      }
    ]
  },

  class6: {
    title: "Mathematics - Class 6 (CBSE/ICSE)",
    description: "Intermediate mathematics for Class 6 covering integers, fractions, algebra basics, and geometric concepts.",
    grade: 6,
    syllabus: [
      "Knowing Our Numbers",
      "Whole Numbers", 
      "Playing with Numbers",
      "Basic Geometrical Ideas",
      "Understanding Elementary Shapes",
      "Integers",
      "Fractions and Decimals",
      "Data Handling",
      "Mensuration",
      "Algebra - Introduction",
      "Ratio and Proportion",
      "Symmetry",
      "Practical Geometry"
    ],
    chapters: [
      {
        name: "Number System",
        topics: ["Large Numbers", "Estimation", "Number Line", "Whole Numbers Properties"],
        learningObjectives: ["Read and write numbers up to crores", "Estimate to nearest hundreds and thousands", "Use number line for operations"]
      },
      {
        name: "Integers", 
        topics: ["Positive and Negative Numbers", "Integer Operations", "Number Line with Integers"],
        learningObjectives: ["Understand concept of negative numbers", "Perform addition and subtraction of integers", "Represent integers on number line"]
      },
      {
        name: "Fractions and Decimals",
        topics: ["Proper and Improper Fractions", "Mixed Numbers", "Decimal Operations", "Fraction-Decimal Conversion"],
        learningObjectives: ["Convert between different fraction forms", "Add and subtract fractions", "Perform decimal operations"]
      },
      {
        name: "Basic Algebra",
        topics: ["Variables", "Simple Equations", "Expressions", "Substitution"],
        learningObjectives: ["Use variables to represent unknowns", "Form simple algebraic expressions", "Solve basic equations"]
      },
      {
        name: "Geometry",
        topics: ["Points, Lines, Rays", "Angles", "Triangles", "Quadrilaterals", "Circles"],
        learningObjectives: ["Identify geometric elements", "Classify angles and shapes", "Draw geometric figures"]
      },
      {
        name: "Mensuration",
        topics: ["Perimeter", "Area of Rectangle and Square", "Area of Triangle"],
        learningObjectives: ["Calculate perimeter of polygons", "Find area of basic shapes", "Apply formulas to solve problems"]
      }
    ]
  },

  class7: {
    title: "Mathematics - Class 7 (CBSE/ICSE)",
    description: "Advanced mathematics for Class 7 including integers, fractions, decimals, data handling, and simple equations.",
    grade: 7,
    syllabus: [
      "Integers",
      "Fractions and Decimals", 
      "Data Handling",
      "Simple Equations",
      "Lines and Angles",
      "The Triangle and its Properties",
      "Congruence of Triangles",
      "Comparing Quantities",
      "Rational Numbers",
      "Practical Geometry",
      "Perimeter and Area",
      "Algebraic Expressions",
      "Exponents and Powers",
      "Symmetry",
      "Visualising Solid Shapes"
    ],
    chapters: [
      {
        name: "Integers",
        topics: ["Integer Operations", "Properties of Operations", "Multiplication and Division of Integers"],
        learningObjectives: ["Master all four operations on integers", "Apply properties of integers", "Solve word problems involving integers"]
      },
      {
        name: "Rational Numbers",
        topics: ["Rational Numbers on Number Line", "Operations on Rational Numbers", "Properties"],
        learningObjectives: ["Understand rational numbers", "Perform operations on rational numbers", "Apply properties in calculations"]
      },
      {
        name: "Simple Equations",
        topics: ["Setting up Equations", "Solving Linear Equations", "Applications"],
        learningObjectives: ["Set up equations from word problems", "Solve linear equations in one variable", "Apply equations to real situations"]
      },
      {
        name: "Lines and Angles",
        topics: ["Types of Angles", "Parallel Lines and Transversals", "Angle Relationships"],
        learningObjectives: ["Identify different types of angles", "Use properties of parallel lines", "Find unknown angles"]
      },
      {
        name: "Triangles",
        topics: ["Triangle Properties", "Angle Sum Property", "Exterior Angle Property", "Triangle Inequality"],
        learningObjectives: ["Apply angle sum property", "Use exterior angle theorem", "Apply triangle inequality"]
      },
      {
        name: "Algebraic Expressions",
        topics: ["Terms and Factors", "Like and Unlike Terms", "Addition and Subtraction of Expressions"],
        learningObjectives: ["Identify terms in expressions", "Combine like terms", "Perform operations on algebraic expressions"]
      }
    ]
  },

  class8: {
    title: "Mathematics - Class 8 (CBSE/ICSE)", 
    description: "Comprehensive mathematics for Class 8 covering rational numbers, linear equations, quadrilaterals, and data handling.",
    grade: 8,
    syllabus: [
      "Rational Numbers",
      "Linear Equations in One Variable",
      "Understanding Quadrilaterals",
      "Practical Geometry",
      "Data Handling",
      "Squares and Square Roots",
      "Cubes and Cube Roots",
      "Comparing Quantities",
      "Algebraic Expressions and Identities",
      "Mensuration",
      "Exponents and Powers",
      "Direct and Inverse Proportions",
      "Factorisation",
      "Introduction to Graphs",
      "Playing with Numbers"
    ],
    chapters: [
      {
        name: "Rational Numbers",
        topics: ["Properties of Rational Numbers", "Representation on Number Line", "Operations and Properties"],
        learningObjectives: ["Master operations on rational numbers", "Apply distributive property", "Represent rational numbers on number line"]
      },
      {
        name: "Linear Equations",
        topics: ["Solving Linear Equations", "Equations with Variables on Both Sides", "Word Problems"],
        learningObjectives: ["Solve complex linear equations", "Apply equations to real-world problems", "Verify solutions"]
      },
      {
        name: "Quadrilaterals",
        topics: ["Properties of Parallelograms", "Special Parallelograms", "Constructing Quadrilaterals"],
        learningObjectives: ["Identify properties of quadrilaterals", "Construct quadrilaterals", "Apply properties to solve problems"]
      },
      {
        name: "Algebraic Expressions",
        topics: ["Multiplication of Algebraic Expressions", "Identities", "Factorisation"],
        learningObjectives: ["Multiply algebraic expressions", "Apply algebraic identities", "Factorize algebraic expressions"]
      },
      {
        name: "Mensuration",
        topics: ["Area of Trapezium", "Area of General Quadrilateral", "Surface Area of Cube and Cuboid", "Volume"],
        learningObjectives: ["Calculate areas of complex shapes", "Find surface area and volume", "Apply mensuration to real problems"]
      },
      {
        name: "Squares and Cubes",
        topics: ["Square Numbers", "Square Roots", "Cube Numbers", "Cube Roots", "Estimation"],
        learningObjectives: ["Find squares and square roots", "Calculate cubes and cube roots", "Estimate square roots"]
      }
    ]
  },

  class9: {
    title: "Mathematics - Class 9 (CBSE/ICSE)",
    description: "Foundation mathematics for Class 9 including number systems, polynomials, coordinate geometry, and Euclid's geometry.",
    grade: 9,
    syllabus: [
      "Number Systems",
      "Polynomials",
      "Coordinate Geometry", 
      "Linear Equations in Two Variables",
      "Introduction to Euclid's Geometry",
      "Lines and Angles",
      "Triangles",
      "Quadrilaterals",
      "Areas of Parallelograms and Triangles",
      "Circles",
      "Constructions",
      "Heron's Formula",
      "Surface Areas and Volumes",
      "Statistics",
      "Probability"
    ],
    chapters: [
      {
        name: "Number Systems",
        topics: ["Rational Numbers", "Irrational Numbers", "Real Numbers", "Laws of Exponents", "Rationalization"],
        learningObjectives: ["Distinguish between rational and irrational numbers", "Represent real numbers on number line", "Apply laws of exponents"]
      },
      {
        name: "Polynomials",
        topics: ["Polynomials in One Variable", "Zeroes of Polynomial", "Remainder Theorem", "Factor Theorem", "Factorisation"],
        learningObjectives: ["Understand polynomial terminology", "Find zeroes of polynomials", "Apply remainder and factor theorems"]
      },
      {
        name: "Coordinate Geometry",
        topics: ["Cartesian System", "Plotting Points", "Distance Formula", "Section Formula"],
        learningObjectives: ["Plot points in coordinate plane", "Calculate distances between points", "Find coordinates of points dividing line segments"]
      },
      {
        name: "Linear Equations in Two Variables", 
        topics: ["Solution of Linear Equation", "Graph of Linear Equation", "Equations of Lines Parallel to Axes"],
        learningObjectives: ["Solve systems of linear equations", "Graph linear equations", "Interpret graphs"]
      },
      {
        name: "Triangles",
        topics: ["Congruence of Triangles", "Criteria for Congruence", "Inequalities in Triangle", "Isosceles Triangle Properties"],
        learningObjectives: ["Apply congruence criteria", "Use triangle inequalities", "Prove triangle properties"]
      },
      {
        name: "Circles", 
        topics: ["Circles and its Related Terms", "Angle Subtended by a Chord", "Perpendicular from Centre to Chord"],
        learningObjectives: ["Understand circle properties", "Apply angle and chord theorems", "Solve circle-related problems"]
      }
    ]
  },

  class10: {
    title: "Mathematics - Class 10 (CBSE/ICSE)",
    description: "Advanced mathematics for Class 10 covering real numbers, polynomials, quadratic equations, trigonometry, and statistics.",
    grade: 10,
    syllabus: [
      "Real Numbers",
      "Polynomials",
      "Pair of Linear Equations in Two Variables",
      "Quadratic Equations",
      "Arithmetic Progressions", 
      "Triangles",
      "Coordinate Geometry",
      "Introduction to Trigonometry",
      "Some Applications of Trigonometry",
      "Circles",
      "Constructions",
      "Areas Related to Circles",
      "Surface Areas and Volumes", 
      "Statistics",
      "Probability"
    ],
    chapters: [
      {
        name: "Real Numbers",
        topics: ["Euclid's Division Lemma", "Fundamental Theorem of Arithmetic", "HCF and LCM", "Rational and Irrational Numbers"],
        learningObjectives: ["Apply Euclid's division algorithm", "Find HCF and LCM using prime factorization", "Prove irrationality of numbers"]
      },
      {
        name: "Polynomials", 
        topics: ["Relationship between Zeroes and Coefficients", "Division Algorithm for Polynomials"],
        learningObjectives: ["Find relationship between zeroes and coefficients", "Apply division algorithm for polynomials", "Find polynomials with given zeroes"]
      },
      {
        name: "Quadratic Equations",
        topics: ["Standard Form", "Factorization Method", "Quadratic Formula", "Nature of Roots"],
        learningObjectives: ["Solve quadratic equations by various methods", "Determine nature of roots", "Apply quadratic equations to real problems"]
      },
      {
        name: "Arithmetic Progressions",
        topics: ["General Term", "Sum of First n Terms", "Applications"],
        learningObjectives: ["Identify arithmetic progressions", "Find nth term and sum of n terms", "Solve AP-related problems"]
      },
      {
        name: "Coordinate Geometry",
        topics: ["Distance Formula", "Section Formula", "Area of Triangle", "Equation of Line"],
        learningObjectives: ["Apply distance and section formulas", "Find area using coordinates", "Derive equation of line"]
      },
      {
        name: "Trigonometry",
        topics: ["Trigonometric Ratios", "Trigonometric Identities", "Heights and Distances"],
        learningObjectives: ["Calculate trigonometric ratios", "Prove trigonometric identities", "Solve height and distance problems"]
      },
      {
        name: "Circles",
        topics: ["Tangent to Circle", "Number of Tangents from External Point", "Length of Tangent"],
        learningObjectives: ["Understand tangent properties", "Find length of tangents", "Solve tangent-related problems"]
      },
      {
        name: "Statistics",
        topics: ["Mean of Grouped Data", "Median of Grouped Data", "Mode of Grouped Data", "Cumulative Frequency"],
        learningObjectives: ["Calculate central tendencies for grouped data", "Draw and interpret cumulative frequency curves", "Analyze statistical data"]
      },
      {
        name: "Probability",
        topics: ["Theoretical Probability", "Experimental Probability", "Elementary Events", "Complementary Events"],
        learningObjectives: ["Calculate theoretical and experimental probability", "Apply probability rules", "Solve probability problems"]
      }
    ]
  }
};

const seedMathCourses = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');

    // Find admin user
    const admin = await User.findOne({ role: 'admin', email: 'admin@teachingplatform.com' });
    if (!admin) {
      console.error('❌ Admin user not found. Please run the main seed script first.');
      process.exit(1);
    }

    // Delete existing math courses for classes 5-10
    await Course.deleteMany({ 
      subject: 'Mathematics', 
      grade: { $gte: 5, $lte: 10 } 
    });
    console.log('🗑️  Cleared existing mathematics courses (Classes 5-10)');

    // Create comprehensive math courses
    const coursesToCreate = [];
    
    for (const [classKey, courseData] of Object.entries(mathCoursesData)) {
      coursesToCreate.push({
        title: courseData.title,
        description: courseData.description,
        createdBy: admin._id,
        grade: courseData.grade,
        subject: 'Mathematics',
        board: ['CBSE', 'ICSE'], // Both boards supported
        price: courseData.grade <= 7 ? 79.99 : 99.99, // Lower price for elementary classes
        syllabus: courseData.syllabus,
        chapters: courseData.chapters,
        status: 'published',
        level: courseData.grade <= 6 ? 'beginner' : courseData.grade <= 8 ? 'intermediate' : 'advanced',
        duration: '12 months', // Full academic year
        language: 'English',
        prerequisites: courseData.grade > 5 ? [`Mathematics - Class ${courseData.grade - 1}`] : [],
        learningOutcomes: [
          'Master fundamental mathematical concepts',
          'Develop problem-solving skills',
          'Prepare for higher grade mathematics',
          'Build strong foundation for competitive exams'
        ],
        tags: ['CBSE', 'ICSE', 'Mathematics', `Class ${courseData.grade}`, 'Foundation', 'Board Exam'],
        difficulty: courseData.grade <= 6 ? 1 : courseData.grade <= 8 ? 2 : 3, // 1-5 scale
        estimatedHours: courseData.grade * 20, // Rough estimate based on grade
        certificate: true,
        isActive: true,
        enrollmentCount: Math.floor(Math.random() * 100) + 20, // Random enrollment for demo
        rating: 4.5 + Math.random() * 0.4, // Rating between 4.5-4.9
        reviewCount: Math.floor(Math.random() * 50) + 10
      });
    }

    const createdCourses = await Course.insertMany(coursesToCreate);
    console.log(`✅ Created ${createdCourses.length} comprehensive mathematics courses (Classes 5-10)`);

    // Display summary
    console.log('\n📚 MATHEMATICS COURSES SUMMARY:');
    console.log('=====================================');
    createdCourses.forEach(course => {
      console.log(`📖 ${course.title}`);
      console.log(`   Grade: ${course.grade} | Price: ₹${course.price} | Chapters: ${course.chapters?.length || 0}`);
      console.log(`   Syllabus Topics: ${course.syllabus.length}`);
      console.log('---');
    });

    console.log('\n🎯 Course Features Added:');
    console.log('• Comprehensive CBSE/ICSE aligned syllabus');
    console.log('• Chapter-wise breakdown with learning objectives');
    console.log('• Progressive difficulty levels');
    console.log('• Grade-appropriate pricing');
    console.log('• Prerequisites mapping');
    console.log('• Learning outcomes defined');
    console.log('• Board exam preparation focus');

    console.log('\n✨ Mathematics courses seed completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding mathematics courses:', error);
    process.exit(1);
  }
};

// Run the seed function
if (require.main === module) {
  seedMathCourses();
}

module.exports = seedMathCourses;
