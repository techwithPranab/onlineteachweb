/**
 * Diagram tags used to choose SVG diagrams without requiring a manual
 * selection in the question-generation form.
 */
const DIAGRAM_TAGS = {
  clock: { grades: [1, 2, 3, 4, 5], subjects: ['Mathematics'], topics: ['Time', 'Clocks', 'Hours and Minutes', 'Reading time on analog and digital clocks', 'Duration and elapsed time'] },
  fraction: { grades: [2, 3, 4, 5], subjects: ['Mathematics'], topics: ['Fractions', 'Parts of a Whole', 'Equivalent Fractions', 'Unit fractions', 'Fractions on number line', 'Addition of like fractions'] },
  rightTriangle: { grades: [4, 5, 6, 7, 8, 9, 10], subjects: ['Mathematics'], topics: ['Geometry', 'Triangles', 'Trigonometry', 'Pythagoras', 'Properties of triangles'] },
  angle: { grades: [4, 5, 6, 7], subjects: ['Mathematics'], topics: ['Angles', 'Geometry', 'Measurement', 'Introduction to angles', 'Right angles', 'Acute and obtuse angles', 'Complementary and supplementary angles'] },
  numberLine: { grades: [1, 2, 3, 4, 5], subjects: ['Mathematics'], topics: ['Numbers', 'Counting', 'Fractions on Number Line', 'Integers', 'Number line representation', 'Rounding off numbers'] },
  shapes: { grades: [1, 2, 3, 4, 5, 6], subjects: ['Mathematics'], topics: ['Shapes', 'Geometry', 'Area', 'Perimeter', 'Properties of triangles and quadrilaterals', 'Area of rectangles', 'Perimeter of rectangles and squares'] },
  barGraph: { grades: [3, 4, 5, 6], subjects: ['Mathematics'], topics: ['Data Handling', 'Statistics', 'Bar Graphs', 'Reading bar graphs', 'Drawing bar graphs (single and double)'] },
  placeValue: { grades: [1, 2, 3, 4, 5], subjects: ['Mathematics'], topics: ['Place Value', 'Numbers', 'Expanded Form', 'Place value and face value', '4-Digit Numbers'] },
  pattern: { grades: [1, 2, 3, 4, 5], subjects: ['Mathematics'], topics: ['Patterns', 'Sequences', 'Number Patterns', 'Tessellations and tiling patterns', 'Geometric patterns in art'] },
  coordGrid: { grades: [4, 5, 6, 7, 8], subjects: ['Mathematics'], topics: ['Coordinates', 'Geometry', 'Graphing', 'Linear Equations'] },
  decimalGrid: { grades: [4, 5], subjects: ['Mathematics'], topics: ['Decimals', 'Tenths place', 'Hundredths place', 'Decimal and fraction relationship', 'Converting fractions to decimals', 'Place value in decimals'] },
  pieChart: { grades: [4, 5], subjects: ['Mathematics'], topics: ['Data Handling', 'Pie Charts', 'Percentage', 'Reading and interpreting pie charts', 'Finding percentage of a quantity'] },
  lineGraph: { grades: [4, 5], subjects: ['Mathematics'], topics: ['Data Handling', 'Line Graphs', 'Reading and interpreting line graphs', 'Drawing line graphs', 'Speed and Distance', 'Relationship between speed, distance, and time'] },
  circleLabeled: { grades: [4, 5, 6], subjects: ['Mathematics'], topics: ['Geometry', 'Circles', 'Radius', 'Diameter', 'Chord', 'Arc', 'Sector', 'Circumference and Area of circles'] },
  factorTree: { grades: [4, 5], subjects: ['Mathematics'], topics: ['Factors and Multiples', 'Prime factorization', 'Factor tree method', 'HCF and LCM', 'Finding HCF by prime factorization', 'Finding LCM by prime factorization'] },
  shape3d: { grades: [4, 5, 6], subjects: ['Mathematics'], topics: ['Geometry', '3D shapes', 'Cube', 'Cuboid', 'Sphere', 'Cylinder', 'Cone', 'Faces edges and vertices', 'Nets of 3D shapes', 'Volume of cubes', 'Volume of cuboids'] },
  symmetry: { grades: [4, 5, 6], subjects: ['Mathematics'], topics: ['Geometry', 'Line symmetry', 'Symmetrical shapes', 'Creating symmetrical patterns', 'Symmetry in shapes', 'Tessellations'] },
  vennDiagram: { grades: [4, 5], subjects: ['Mathematics'], topics: ['Factors and Multiples', 'HCF and LCM', 'Common factors and common multiples', 'Highest Common Factor', 'Lowest Common Multiple'] },
  moneyIndia: { grades: [2, 3, 4, 5], subjects: ['Mathematics'], topics: ['Money', 'Indian currency', 'Rupees and paisa', 'Addition of money', 'Making change', 'Bill preparation', 'Shopping and billing'] },
  ratioBar: { grades: [4, 5, 6], subjects: ['Mathematics'], topics: ['Ratio and Proportion', 'Concept of ratio', 'Dividing quantities in given ratios', 'Equivalent ratios', 'Unitary method', 'Direct proportion', 'Percentage'] }
};

const normalise = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const matchesTags = (text, tags) => {
  const candidate = normalise(text);
  return candidate && tags.some(tag => {
    const tagged = normalise(tag);
    return candidate.includes(tagged) || tagged.includes(candidate);
  });
};

/**
 * Selects the diagrams tagged for a course and its current chapter/topic.
 * Topic matches take precedence, followed by chapter/course matches. A
 * grade-and-subject fallback keeps image questions usable for new curriculum
 * wording that has not yet been explicitly tagged.
 */
function getDiagramTypesForContext({ grade, subject, courseTitle = '', courseTags = [], chapterName = '', topic = '' }) {
  const numericGrade = Number(grade);
  const normalisedSubject = normalise(subject);
  const compatible = Object.entries(DIAGRAM_TAGS).filter(([, tags]) =>
    (!numericGrade || tags.grades.includes(numericGrade)) &&
    (!normalisedSubject || tags.subjects.some(tag => normalise(tag) === normalisedSubject))
  );

  const byTopic = compatible.filter(([, tags]) => matchesTags(topic, tags.topics));
  if (byTopic.length) return byTopic.map(([type]) => type);

  const courseContext = [chapterName, courseTitle, ...courseTags].filter(Boolean).join(' ');
  const byCourse = compatible.filter(([, tags]) => matchesTags(courseContext, tags.topics));
  if (byCourse.length) return byCourse.map(([type]) => type);

  return compatible.map(([type]) => type);
}

module.exports = { DIAGRAM_TAGS, getDiagramTypesForContext };
