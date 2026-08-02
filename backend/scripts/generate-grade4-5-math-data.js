const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const ADMIN_ID = '696d8e8098d47cbd00770abd';
const TUTOR_ID = '696d8e8098d47cbd00770ac0';
const DATE = '2026-08-02T00:00:00.000Z';

const oid = value => ({ $oid: value });
const date = value => ({ $date: value });
const courseId = (grade, index) => `${grade === 4 ? '74' : '75'}${String(index + 1).padStart(22, '0')}`;
const materialId = (grade, index) => `${grade === 4 ? '74a' : '75a'}${String(index + 1).padStart(21, '0')}`;

const cleanTopic = topic => topic
  .replace(/\s*\([^)]*\)/g, '')
  .replace(/\bWhat are?\s+/i, '')
  .replace(/\bintroduction to\s+/i, '')
  .trim();

const diagramFor = (text, grade) => {
  const value = text.toLowerCase();
  if (/fraction/.test(value)) return { type: 'fraction', params: { numerator: 3, denominator: 4 }, caption: 'Three of four equal parts are shaded.' };
  if (/decimal/.test(value)) return { type: 'decimalGrid', params: { value: 0.45 }, caption: 'A hundred-grid model of 0.45.' };
  if (/place value|number system|large number/.test(value)) return { type: 'placeValue', params: { thousands: 4, hundreds: 3, tens: 8, ones: 6, showLabel: true }, caption: 'The number 4,386 organized by place value.' };
  if (/time|clock/.test(value)) return { type: 'clock', params: { hours: 3, minutes: 30, showLabels: true }, caption: 'An analogue clock showing half past three.' };
  if (/money|profit|loss|interest|bill/.test(value)) return { type: 'moneyIndia', params: { amounts: [{ denomination: 100, count: 2 }, { denomination: 50, count: 1 }, { denomination: 20, count: 1 }, { denomination: 5, count: 1 }], totalLabel: true }, caption: 'Indian currency representing ₹275.' };
  if (/data|graph|statistic|mean|median|mode/.test(value)) return { type: 'barGraph', params: { data: [{ label: 'Mon', value: 4 }, { label: 'Tue', value: 7 }, { label: 'Wed', value: 5 }, { label: 'Thu', value: 8 }], title: 'Books Read', xLabel: 'Day', yLabel: 'Books' }, caption: 'A bar graph for reading and comparing data.' };
  if (/factor|multiple|prime|composite/.test(value)) return { type: 'factorTree', params: { number: 24 }, caption: 'A factor tree that breaks 24 into prime factors.' };
  if (/ratio|proportion|percentage/.test(value)) return { type: 'ratioBar', params: { ratio: [2, 3], labels: ['Red', 'Blue'], total: 20, showRatio: true, showValues: true }, caption: 'A tape model comparing quantities in the ratio 2:3.' };
  if (/angle|line|parallel|perpendicular/.test(value)) return { type: 'angle', params: { degrees: 60 }, caption: 'An angle model used to discuss size and type.' };
  if (/volume|cube|cuboid|3d|solid/.test(value)) return { type: 'shape3d', params: { shape: 'cuboid', dimensions: { length: 5, width: 3, height: 4 }, showLabels: true }, caption: 'A labelled cuboid model showing a three-dimensional solid.' };
  if (/symmetr|pattern|sequence/.test(value)) return { type: 'pattern', params: { sequence: ['circle', 'square', 'circle', 'square', 'circle', 'square'], missingIndex: 5, showIndex: false }, caption: 'A repeating pattern whose rule can be continued.' };
  if (/area|perimeter|shape|triangle|quadrilateral|circle|geometry/.test(value)) return { type: 'shapes', params: { shape: 'rectangle', dimensions: { width: 8, height: 5 }, showLabels: true }, caption: 'A rectangle with labelled dimensions.' };
  return { type: 'numberLine', params: { start: 0, end: 10, step: 1, marked: [2, 5, 8] }, caption: 'A number line for ordering and estimating values.' };
};

const guidanceFor = text => {
  const value = text.toLowerCase();
  if (/place value|face value|number system|expanded|number words|reading numbers|writing numbers/.test(value)) return 'A digit’s face value is the digit itself; its place value is the digit multiplied by the value of its position. Use a place-value chart to move between numerals, number words, and expanded form.';
  if (/compare|comparing|ordering|ascending|descending/.test(value)) return 'Compare the number of digits first, then compare equal place values from left to right. On a number line, values increase as you move right.';
  if (/round|estimat|approximation/.test(value)) return 'Locate the rounding place, inspect the digit immediately to its right, and decide which nearby multiple is closer. Use the rounded result to check reasonableness.';
  if (/successor|predecessor/.test(value)) return 'The successor is one more and the predecessor is one less. Show both on a number line to make the relationship visible.';
  if (/addition/.test(value)) return 'Line up equal place values, add from right to left, and regroup whenever a column totals 10 or more.';
  if (/subtraction/.test(value)) return 'Line up equal place values, subtract from right to left, and exchange one unit from the next place when needed.';
  if (/multiplication/.test(value)) return 'Use known facts and place value. Split a large factor into friendly parts, multiply each part, then combine the partial products.';
  if (/division/.test(value)) return 'Think about equal groups. Estimate each quotient digit, multiply back, subtract, and check that the remainder is smaller than the divisor.';
  if (/fraction/.test(value)) return 'The denominator names the number of equal parts; the numerator counts the selected parts. Draw equal parts before comparing or calculating.';
  if (/decimal/.test(value)) return 'Read digits by place value and align decimal points before calculating. Add zero placeholders only when they help show equal places.';
  if (/percentage/.test(value)) return 'Percent means out of 100. Move between fractions, decimals, and percentages using equivalent values rather than memorized tricks alone.';
  if (/ratio|proportion/.test(value)) return 'Keep the same multiplicative relationship on both sides. A tape diagram or unitary method makes the scale factor visible.';
  if (/perimeter/.test(value)) return 'Perimeter is the distance around a boundary. Add every outside side once and always include a length unit.';
  if (/area/.test(value)) return 'Area measures surface covered in equal square units. Decompose an unfamiliar figure into rectangles or count unit squares.';
  if (/volume|capacity/.test(value)) return 'Volume counts cubic units inside a solid; capacity tells how much a container can hold. Track cubic units and liquid units carefully.';
  if (/length|weight|mass|measurement|convert|unit/.test(value)) return 'Choose a unit suited to the object, record the unit with every value, and convert to a common unit before calculating. A conversion table helps preserve the scale factor.';
  if (/time|speed|distance/.test(value)) return 'Draw a timeline or write the known quantities with units. Use consistent units before adding durations or applying a relationship.';
  if (/money|profit|loss|interest/.test(value)) return 'Write rupees and paise in aligned columns, identify what is paid or received, and check whether the final amount is sensible.';
  if (/data|graph|statistic/.test(value)) return 'Read the title, labels, scale, and key before interpreting a graph. Support every conclusion with a value from the data.';
  if (/probability|certain|possible|impossible|chance|likelihood/.test(value)) return 'List the possible outcomes and use words such as certain, likely, unlikely, or impossible. Repeat simple experiments because a single outcome may not show the long-run pattern.';
  if (/geometry|angle|shape|line|symmetr/.test(value)) return 'Observe, measure, and name the defining properties. A careful labelled sketch helps separate what looks true from what is mathematically true.';
  if (/factor|multiple|prime|composite/.test(value)) return 'Use multiplication facts systematically. Factors divide exactly; multiples are obtained by multiplying by whole numbers.';
  if (/pattern|sequence|algebra|variable/.test(value)) return 'Describe how one term changes to the next, test the rule on several terms, and use a symbol when a value is unknown.';
  if (/mental|vedic|shortcut|doubling|halving|number bond|compensat/.test(value)) return 'Break numbers into friendly parts, use number bonds, doubling, halving, or compensation, and explain why the shortcut preserves the value. Verify fast work with a standard method.';
  return 'Represent the information clearly, choose an operation or rule, solve in small steps, and check the result with estimation or an inverse operation.';
};

const exampleFor = text => {
  const value = text.toLowerCase();
  if (/addition/.test(value)) return ['Find $2,478 + 1,356$.', '$2,478 + 1,356 = 3,834$. Add by place value and regroup tens and hundreds.', '3,834'];
  if (/subtraction/.test(value)) return ['Find $5,000 - 2,746$.', '$5,000 - 2,746 = 2,254$. Exchange across the zeroes, then check: $2,254 + 2,746 = 5,000$.', '2,254'];
  if (/multiplication/.test(value)) return ['Find $36 \\times 24$.', '$36 \\times 20 = 720$ and $36 \\times 4 = 144$; therefore $720 + 144 = 864$.', '864'];
  if (/division/.test(value)) return ['Share 157 objects equally among 6 groups.', '$157 \\div 6 = 26$ remainder $1$, because $6 \\times 26 + 1 = 157$.', '26 in each group, 1 left'];
  if (/fraction/.test(value)) return ['Add $\\frac{2}{7}+\\frac{3}{7}$.', 'The parts are the same size, so add the numerators: $\\frac{2+3}{7}=\\frac{5}{7}$.', '$\\frac{5}{7}$'];
  if (/decimal/.test(value)) return ['Find $3.45 + 2.30$.', 'Align decimal points: $3.45 + 2.30 = 5.75$.', '5.75'];
  if (/percentage/.test(value)) return ['Find 25% of 80.', '$25\% = \\frac14$, so $80 \\div 4 = 20$.', '20'];
  if (/ratio|proportion/.test(value)) return ['Red and blue beads are in the ratio $2:3$. If there are 8 red beads, how many blue?', 'The scale factor is $8 \\div 2 = 4$, so blue beads $=3 \\times 4=12$.', '12 blue beads'];
  if (/perimeter/.test(value)) return ['Find the perimeter of a rectangle 8 cm long and 5 cm wide.', '$2 \\times (8+5)=26$ cm.', '26 cm'];
  if (/area/.test(value)) return ['Find the area of a rectangle 8 cm by 5 cm.', '$8 \\times 5=40$ square centimetres.', '40 cm²'];
  if (/volume/.test(value)) return ['Find the volume of a cuboid 4 cm by 3 cm by 2 cm.', '$4 \\times 3 \\times 2=24$ cubic centimetres.', '24 cm³'];
  if (/speed|distance/.test(value)) return ['A cyclist travels 36 km in 3 hours. Find the speed.', '$36 \\div 3=12$ kilometres per hour.', '12 km/h'];
  if (/time|clock/.test(value)) return ['A lesson begins at 10:35 a.m. and lasts 50 minutes. When does it end?', '25 minutes reaches 11:00 a.m.; 25 more minutes reaches 11:25 a.m.', '11:25 a.m.'];
  if (/money|profit|loss|interest/.test(value)) return ['A book costs ₹145.50 and a pen costs ₹28.75. Find the total.', '₹145.50 + ₹28.75 = ₹174.25.', '₹174.25'];
  if (/mean|average/.test(value)) return ['Find the mean of 4, 7, 5, and 8.', 'The total is 24 and there are 4 values, so $24 \\div 4=6$.', '6'];
  if (/data|graph|statistic/.test(value)) return ['A bar graph shows 4, 7, 5, and 8 books read. How many altogether?', '$4+7+5+8=24$.', '24 books'];
  if (/factor|multiple|prime|composite/.test(value)) return ['List all factors of 24.', 'Test factor pairs: $1\\times24$, $2\\times12$, $3\\times8$, $4\\times6$.', '1, 2, 3, 4, 6, 8, 12, 24'];
  if (/angle/.test(value)) return ['Classify an angle measuring $60^\\circ$.', 'It is greater than $0^\\circ$ and less than $90^\\circ$, so it is acute.', 'Acute angle'];
  if (/pattern|sequence/.test(value)) return ['Continue 5, 9, 13, 17, ...', 'Each term increases by 4, so the next two terms are 21 and 25.', '21, 25'];
  if (/place value|number system|large number/.test(value)) return ['What is the value of 7 in 47,326?', 'The 7 is in the thousands place, so its value is $7,000$.', '7,000'];
  return ['A number is 18 more than 47. Find it.', '$47+18=65$. Check: $65-18=47$.', '65'];
};

const lessonContent = (grade, course, chapter) => {
  const title = chapter.name;
  const combined = `${course.title} ${title} ${chapter.topics.join(' ')}`;
  const diagram = diagramFor(combined, grade);
  const [question, solution, answer] = exampleFor(combined);
  const topics = chapter.topics.map(topic => `- **${topic}:** ${guidanceFor(topic)}`).join('\n');
  const objectives = chapter.learningObjectives.map(item => `- ${item}`).join('\n');
  const topicChecks = chapter.topics.slice(0, 5).map((topic, index) => `- **Q${index + 1}.** Explain ${cleanTopic(topic).toLowerCase()} with a labelled example of your own.`).join('\n');
  const topicAnswers = chapter.topics.slice(0, 5).map((topic, index) => `- **Q${index + 1}.** A correct response should define ${cleanTopic(topic).toLowerCase()}, show the relevant steps or model, and check the result.`).join('\n');
  return `# ${title}

This Grade ${grade} lesson develops the ideas in **${course.title.replace(`Grade ${grade} Mathematics - `, '')}** through explanations, visual reasoning, worked examples, practice, and reflection.

## Learning Goals

${objectives}

## Key Vocabulary

${chapter.topics.slice(0, 6).map(cleanTopic).join(' · ')}

## Concept Guide

${topics}

### A reliable problem-solving routine

1. Read the question twice and underline the quantities and units.
2. Represent the information with a model, table, number sentence, or labelled sketch.
3. Choose a rule or operation and explain why it fits.
4. Work in clear steps and keep place values or units aligned.
5. Check with estimation, an inverse operation, or a second representation.

## Visual Learning

\`\`\`math-diagram
${JSON.stringify(diagram, null, 2)}
\`\`\`

Ask yourself: What do the labels mean? Which parts are equal? What changes when a value changes? How does the picture support the calculation?

## Worked Examples

### Example 1 — Model and calculate

**Question:** ${question}

**Solution:** ${solution}

**Answer:** ${answer}

### Example 2 — Explain the reasoning

Use one topic from this chapter in a daily-life situation. Draw or describe a model, write the mathematical statement, solve it, and check whether the answer is reasonable. A complete solution must include the correct unit or label.

### Common Mistakes

- Using a rule without checking what the question asks.
- Mixing place values, units, or unequal parts.
- Leaving a diagram unlabelled.
- Writing only an answer without showing the reasoning.
- Forgetting to check whether the result is sensible.

## Guided Practice

${topicChecks}

## Independent Practice

### Easy

1. Define two important words from this chapter.
2. Draw a simple model that represents one chapter idea.
3. State the rule or method you would use for the worked example.
4. Estimate whether the worked-example answer should be small or large.
5. Write one real-life situation where this mathematics is useful.

### Medium

1. Change one value in the worked example and solve the new problem.
2. Solve the worked example by a second method or representation.
3. Write a one-step word problem using a topic from the chapter, then solve it.
4. Compare two examples and explain what stays the same.
5. Find and correct this claim: “A numerical answer never needs a unit or label.”

### Challenge

1. Create a two-step problem combining this chapter with an earlier Grade ${grade} topic.
2. Give an example and a non-example of one key concept and explain the difference.
3. Make a visual puzzle whose solution uses ${cleanTopic(chapter.topics[0]).toLowerCase()}.
4. Describe how estimation or inverse operations can verify a solution.
5. Teach the hardest chapter idea in four clear sentences.

## Quick Quiz

1. **Multiple choice:** What should you do first? A) Guess B) Identify the information and goal C) Ignore units D) Copy a rule
2. **True or false:** A labelled visual can help explain mathematical reasoning.
3. **Fill in the blank:** A final measurement answer needs a number and a ______.
4. **Short answer:** Why is checking useful?
5. **Application:** Solve: ${question}

## Answer Key

### Guided Practice

${topicAnswers}

### Independent Practice

Responses are open-ended. Check that each answer is mathematically correct, shows a suitable model or steps, uses accurate vocabulary, and includes units where needed. For Medium 5, the claim is false because units and labels give a number its context.

### Quick Quiz

1. **B** — identify the given information and the goal.
2. **True.**
3. **unit** (or an appropriate label).
4. Checking catches calculation, unit, and interpretation errors and shows whether an answer is reasonable.
5. ${answer} — ${solution}

## Mastery Checklist

- [ ] I can explain the important vocabulary.
- [ ] I can represent an idea visually.
- [ ] I can choose and apply a suitable method.
- [ ] I can solve a word problem and label the answer.
- [ ] I can check and explain my reasoning.
`;
};

const normalizeCourse = (course, grade, index) => ({
  _id: oid(courseId(grade, index)),
  title: course.title,
  description: course.description,
  createdBy: ADMIN_ID,
  grade,
  subject: 'Mathematics',
  board: [...new Set(['CBSE', 'ICSE', ...(course.board || [])])].filter(board => ['CBSE', 'ICSE', 'State Board', 'Other'].includes(board)),
  thumbnail: course.thumbnail || '',
  syllabus: course.syllabus,
  chapters: course.chapters,
  topics: course.topics,
  duration: course.duration,
  estimatedHours: course.estimatedHours,
  level: course.level,
  difficulty: course.difficulty,
  language: course.language || 'English',
  prerequisites: course.prerequisites,
  learningOutcomes: course.learningOutcomes,
  certificate: course.certificate !== false,
  status: 'published',
  enrollmentCount: 0,
  averageRating: 0,
  totalRatings: 0,
  reviewCount: 0,
  maxStudents: course.maxStudents || 50,
  tags: [...new Set([`Grade ${grade}`, 'Mathematics', ...course.tags.filter(tag => !/^Grade \d$/.test(tag)), 'CISCE', 'Primary Mathematics'])],
  isActive: true,
  createdAt: date(DATE),
  updatedAt: date(DATE),
  __v: 0
});

for (const grade of [4, 5]) {
  const directory = path.join(ROOT, `Data/Grade${grade}`);
  const coursePath = path.join(directory, `grade${grade}_math_courses.json`);
  const original = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
  const courses = original.map((course, index) => normalizeCourse(course, grade, index));
  const materials = [];
  let materialIndex = 0;

  courses.forEach((course, courseIndex) => {
    course.chapters.forEach((chapter, chapterIndex) => {
      materials.push({
        _id: oid(materialId(grade, materialIndex)),
        course: oid(courseId(grade, courseIndex)),
        tutor: oid(TUTOR_ID),
        title: `${chapter.name} - Complete Study Material`,
        description: `Grade ${grade} comprehensive lesson for ${chapter.name}, including concept explanations, visual learning, worked examples, differentiated practice, a quiz, and complete guidance.`,
        type: 'article',
        content: lessonContent(grade, course, chapter),
        previewContent: `Learn ${chapter.name} through clear explanations, a visual model, worked examples, three levels of practice, a quiz, and answer guidance.`,
        contentFormat: 'markdown',
        difficulty: course.difficulty >= 3 || chapterIndex > 0 ? 'intermediate' : 'basic',
        category: 'lesson',
        isFree: chapterIndex === 0,
        downloadCount: 0,
        viewCount: 0,
        order: chapterIndex + 1,
        tags: [...new Set([`Grade ${grade}`, 'Mathematics', chapter.name, ...chapter.topics.slice(0, 6), ...course.board, 'CISCE', 'Primary Mathematics'])],
        isActive: true,
        createdAt: date(DATE),
        updatedAt: date(DATE),
        __v: 0
      });
      materialIndex += 1;
    });
  });

  fs.writeFileSync(coursePath, `${JSON.stringify(courses, null, 2)}\n`);
  fs.writeFileSync(path.join(directory, `grade${grade}_math_materials.json`), `${JSON.stringify(materials, null, 2)}\n`);
}

console.log('Generated normalized Grade 4 and Grade 5 mathematics courses and materials.');
