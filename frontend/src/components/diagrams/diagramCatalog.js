/**
 * Diagram catalog – metadata for all supported SVG diagram types.
 * 20 diagrams covering Classes 1–10 Mathematics curriculum.
 */

export const DIAGRAM_CATALOG = [
  // ── Original 10 ───────────────────────────────────────────────────────────
  {
    type: 'clock',
    label: 'Analog Clock',
    emoji: '🕐',
    description: 'Show a clock face at a specific time',
    grades: [1, 2, 3, 4, 5],
    subjects: ['Mathematics'],
    topics: ['Time', 'Clocks', 'Hours and Minutes', 'Reading time on analog and digital clocks', 'Duration and elapsed time'],
    exampleParams: { hours: 3, minutes: 30 },
    aiInstruction: '{ "type": "clock", "params": { "hours": <0-12>, "minutes": <0-59>, "showLabels": true }, "caption": "<describe the time shown>" }'
  },
  {
    type: 'fraction',
    label: 'Fraction (Pie/Bar/Set)',
    emoji: '🥧',
    description: 'Visualise fractions as pie, bar or dot sets',
    grades: [2, 3, 4, 5],
    subjects: ['Mathematics'],
    topics: ['Fractions', 'Parts of a Whole', 'Equivalent Fractions', 'Unit fractions', 'Fractions on number line', 'Addition of like fractions'],
    exampleParams: { numerator: 3, denominator: 4, style: 'pie' },
    aiInstruction: '{ "type": "fraction", "params": { "numerator": <n>, "denominator": <d>, "style": "pie"|"bar"|"set", "showLabel": true }, "caption": "<fraction description>" }'
  },
  {
    type: 'rightTriangle',
    label: 'Right Triangle / Trig',
    emoji: '📐',
    description: 'Right triangle with labelled sides and angles',
    grades: [4, 5, 6, 7, 8, 9, 10],
    subjects: ['Mathematics'],
    topics: ['Geometry', 'Triangles', 'Trigonometry', 'Pythagoras', 'Properties of triangles'],
    exampleParams: { base: 3, height: 4, showLabels: true, angleLabel: 'θ' },
    aiInstruction: '{ "type": "rightTriangle", "params": { "base": <n>, "height": <n>, "hypotenuse": <n|null>, "labelBase": "<label>", "labelHeight": "<label>", "labelHyp": "<label>", "angleLabel": "θ", "showLabels": true }, "caption": "..." }'
  },
  {
    type: 'angle',
    label: 'Angle',
    emoji: '∠',
    description: 'Draw an angle in degrees, optionally with protractor',
    grades: [4, 5, 6, 7],
    subjects: ['Mathematics'],
    topics: ['Angles', 'Geometry', 'Measurement', 'Introduction to angles', 'Right angles', 'Acute and obtuse angles', 'Complementary and supplementary angles'],
    exampleParams: { degrees: 60, style: 'simple', showLabel: true },
    aiInstruction: '{ "type": "angle", "params": { "degrees": <1-359>, "style": "simple"|"protractor", "label": "<optional>", "showLabel": true }, "caption": "..." }'
  },
  {
    type: 'numberLine',
    label: 'Number Line',
    emoji: '📏',
    description: 'Number line with highlighted or marked positions',
    grades: [1, 2, 3, 4, 5],
    subjects: ['Mathematics'],
    topics: ['Numbers', 'Counting', 'Fractions on Number Line', 'Integers', 'Number line representation', 'Rounding off numbers'],
    exampleParams: { start: 0, end: 10, marked: [7], step: 1 },
    aiInstruction: '{ "type": "numberLine", "params": { "start": <n>, "end": <n>, "step": <n>, "marked": [<number>], "highlighted": [<number>], "label": "<optional>" }, "caption": "..." }'
  },
  {
    type: 'shapes',
    label: '2D Shapes',
    emoji: '🔷',
    description: 'Circle, rectangle, square, triangle, polygon',
    grades: [1, 2, 3, 4, 5, 6],
    subjects: ['Mathematics'],
    topics: ['Shapes', 'Geometry', 'Area', 'Perimeter', 'Properties of triangles and quadrilaterals', 'Area of rectangles', 'Perimeter of rectangles and squares'],
    exampleParams: { shape: 'rectangle', dimensions: { width: 8, height: 5 }, showLabels: true },
    aiInstruction: '{ "type": "shapes", "params": { "shape": "circle"|"rectangle"|"square"|"triangle"|"pentagon"|"hexagon"|"parallelogram", "dimensions": { "width": <n>, "height": <n>, "radius": <n>, "side": <n> }, "showLabels": true }, "caption": "..." }'
  },
  {
    type: 'barGraph',
    label: 'Bar Graph',
    emoji: '📊',
    description: 'Bar chart for data interpretation',
    grades: [3, 4, 5, 6],
    subjects: ['Mathematics'],
    topics: ['Data Handling', 'Statistics', 'Bar Graphs', 'Reading bar graphs', 'Drawing bar graphs (single and double)'],
    exampleParams: { data: [{ label: 'Mon', value: 5 }, { label: 'Tue', value: 8 }], title: 'Students present', xLabel: 'Day', yLabel: 'Count' },
    aiInstruction: '{ "type": "barGraph", "params": { "data": [{"label": "<string>", "value": <number>}, ...], "title": "<string>", "xLabel": "<string>", "yLabel": "<string>" }, "caption": "..." }'
  },
  {
    type: 'placeValue',
    label: 'Place Value Chart',
    emoji: '🔢',
    description: 'Hundreds, tens, ones blocks',
    grades: [1, 2, 3, 4, 5],
    subjects: ['Mathematics'],
    topics: ['Place Value', 'Numbers', 'Expanded Form', 'Place value and face value', '4-Digit Numbers'],
    exampleParams: { thousands: 0, hundreds: 2, tens: 3, ones: 5 },
    aiInstruction: '{ "type": "placeValue", "params": { "thousands": <n>, "hundreds": <n>, "tens": <n>, "ones": <n>, "showLabel": true }, "caption": "<describe the number>" }'
  },
  {
    type: 'pattern',
    label: 'Shape Pattern',
    emoji: '🔁',
    description: 'Repeating or growing patterns of shapes',
    grades: [1, 2, 3, 4, 5],
    subjects: ['Mathematics'],
    topics: ['Patterns', 'Sequences', 'Number Patterns', 'Tessellations and tiling patterns', 'Geometric patterns in art'],
    exampleParams: { sequence: ['circle', 'square', 'triangle', 'circle', 'square', 'triangle'], missingIndex: 5 },
    aiInstruction: '{ "type": "pattern", "params": { "sequence": ["circle"|"square"|"triangle"|"star"|"diamond"|"pentagon", ...], "missingIndex": <index or null>, "colors": ["<hex>", ...], "showIndex": false }, "caption": "What comes next?" }'
  },
  {
    type: 'coordGrid',
    label: 'Coordinate Grid',
    emoji: '🗺️',
    description: 'Cartesian coordinate grid with points and lines',
    grades: [4, 5, 6, 7, 8],
    subjects: ['Mathematics'],
    topics: ['Coordinates', 'Geometry', 'Graphing', 'Linear Equations'],
    exampleParams: { xRange: [0, 6], yRange: [0, 6], points: [{ x: 2, y: 3, label: 'A' }, { x: 5, y: 4, label: 'B' }] },
    aiInstruction: '{ "type": "coordGrid", "params": { "xRange": [<min>, <max>], "yRange": [<min>, <max>], "gridStep": 1, "points": [{"x": <n>, "y": <n>, "label": "<string>"}], "segments": [{"from": [x1,y1], "to": [x2,y2]}] }, "caption": "..." }'
  },

  // ── Class 4 & 5 additions ────────────────────────────────────────────────
  {
    type: 'decimalGrid',
    label: 'Decimal Grid (Tenths/Hundredths)',
    emoji: '🔲',
    description: 'Coloured 10-col or 10×10 grid to represent decimal values',
    grades: [4, 5],
    subjects: ['Mathematics'],
    topics: ['Decimals', 'Tenths place', 'Hundredths place', 'Decimal and fraction relationship', 'Converting fractions to decimals', 'Place value in decimals'],
    exampleParams: { value: 0.35, style: 'hundredths' },
    aiInstruction: '{ "type": "decimalGrid", "params": { "value": <0 to 1, e.g. 0.35>, "style": "tenths"|"hundredths", "showLabel": true }, "caption": "..." }'
  },
  {
    type: 'pieChart',
    label: 'Pie Chart (Multi-segment)',
    emoji: '🍕',
    description: 'Multi-segment pie chart for data handling and percentages',
    grades: [4, 5],
    subjects: ['Mathematics'],
    topics: ['Data Handling', 'Pie Charts', 'Percentage', 'Reading and interpreting pie charts', 'Finding percentage of a quantity'],
    exampleParams: { data: [{ label: 'Maths', value: 35 }, { label: 'Science', value: 25 }, { label: 'English', value: 20 }, { label: 'Other', value: 20 }], title: 'Favourite Subjects' },
    aiInstruction: '{ "type": "pieChart", "params": { "data": [{"label": "<string>", "value": <number>}], "title": "<optional>", "showLegend": true, "showPercent": true }, "caption": "..." }'
  },
  {
    type: 'lineGraph',
    label: 'Line Graph',
    emoji: '📈',
    description: 'Line graph for data trends and speed-distance-time',
    grades: [4, 5],
    subjects: ['Mathematics'],
    topics: ['Data Handling', 'Line Graphs', 'Reading and interpreting line graphs', 'Drawing line graphs', 'Speed and Distance', 'Relationship between speed, distance, and time'],
    exampleParams: { data: [{ x: 1, y: 10 }, { x: 2, y: 25 }, { x: 3, y: 18 }, { x: 4, y: 35 }, { x: 5, y: 28 }], xLabel: 'Hour', yLabel: 'Distance (km)', title: 'Distance over Time' },
    aiInstruction: '{ "type": "lineGraph", "params": { "data": [{"x": <number or string>, "y": <number>}, ...], "xLabel": "<string>", "yLabel": "<string>", "title": "<string>", "showPoints": true, "showArea": true }, "caption": "..." }'
  },
  {
    type: 'circleLabeled',
    label: 'Labeled Circle (Parts)',
    emoji: '⭕',
    description: 'Circle with radius, diameter, chord, arc, sector labelled',
    grades: [4, 5, 6],
    subjects: ['Mathematics'],
    topics: ['Geometry', 'Circles', 'Radius', 'Diameter', 'Chord', 'Arc', 'Sector', 'Circumference and Area of circles', 'Circles - radius, diameter, chord, arc, sector, segment'],
    exampleParams: { showRadius: true, showDiameter: true, showChord: true, showArc: true, showSector: true, angleForSector: 90 },
    aiInstruction: '{ "type": "circleLabeled", "params": { "showRadius": true, "showDiameter": true, "showChord": true, "showArc": true, "showSector": true, "radiusLabel": "<e.g. 7 cm>", "diameterLabel": "<e.g. 14 cm>", "angleForSector": <degrees> }, "caption": "..." }'
  },
  {
    type: 'factorTree',
    label: 'Factor Tree',
    emoji: '🌳',
    description: 'Visual factor tree showing prime factorization',
    grades: [4, 5],
    subjects: ['Mathematics'],
    topics: ['Factors and Multiples', 'Prime factorization', 'Factor tree method', 'HCF and LCM', 'Finding HCF by prime factorization', 'Finding LCM by prime factorization'],
    exampleParams: { number: 36 },
    aiInstruction: '{ "type": "factorTree", "params": { "number": <composite integer e.g. 36> }, "caption": "Factor tree of <number>" }'
  },
  {
    type: 'shape3d',
    label: '3D Shapes',
    emoji: '🧊',
    description: 'Isometric 3D shapes: cube, cuboid, sphere, cylinder, cone',
    grades: [4, 5, 6],
    subjects: ['Mathematics'],
    topics: ['Geometry', '3D shapes', 'Cube', 'Cuboid', 'Sphere', 'Cylinder', 'Cone', 'Faces edges and vertices', 'Nets of 3D shapes', 'Volume of cubes', 'Volume of cuboids'],
    exampleParams: { shape: 'cuboid', dimensions: { length: 5, width: 3, height: 4 }, showLabels: true },
    aiInstruction: '{ "type": "shape3d", "params": { "shape": "cube"|"cuboid"|"sphere"|"cylinder"|"cone", "dimensions": { "length": <n>, "width": <n>, "height": <n>, "radius": <n>, "side": <n> }, "showLabels": true }, "caption": "..." }'
  },
  {
    type: 'symmetry',
    label: 'Symmetry Diagram',
    emoji: '🪞',
    description: 'Shape with line(s) of symmetry drawn',
    grades: [4, 5, 6],
    subjects: ['Mathematics'],
    topics: ['Geometry', 'Line symmetry', 'Symmetrical shapes', 'Creating symmetrical patterns', 'Symmetry in shapes', 'Tessellations'],
    exampleParams: { shape: 'butterfly', symmetryAxis: 'vertical', showAxis: true },
    aiInstruction: '{ "type": "symmetry", "params": { "shape": "square"|"rectangle"|"triangle"|"circle"|"hexagon"|"butterfly"|"leaf", "symmetryAxis": "vertical"|"horizontal"|"both"|"all", "showAxis": true, "showLabel": true }, "caption": "..." }'
  },
  {
    type: 'vennDiagram',
    label: 'Venn Diagram',
    emoji: '🔵',
    description: 'Two-set Venn diagram for factors, multiples, HCF and LCM',
    grades: [4, 5],
    subjects: ['Mathematics'],
    topics: ['Factors and Multiples', 'HCF and LCM', 'Common factors and common multiples', 'Highest Common Factor', 'Lowest Common Multiple'],
    exampleParams: { setA: { label: 'Factors of 12', items: ['1', '2', '3', '4', '6', '12'] }, setB: { label: 'Factors of 18', items: ['1', '2', '3', '6', '9', '18'] }, intersection: ['1', '2', '3', '6'] },
    aiInstruction: '{ "type": "vennDiagram", "params": { "setA": { "label": "<e.g. Factors of 12>", "items": ["1","2","3","4","6","12"] }, "setB": { "label": "<e.g. Factors of 18>", "items": ["1","2","3","6","9","18"] }, "intersection": ["1","2","3","6"], "title": "<optional>" }, "caption": "..." }'
  },
  {
    type: 'moneyIndia',
    label: 'Indian Money (₹)',
    emoji: '💰',
    description: 'Indian currency notes and coins (rupees and paisa)',
    grades: [2, 3, 4, 5],
    subjects: ['Mathematics'],
    topics: ['Money', 'Indian currency', 'Rupees and paisa', 'Addition of money', 'Making change', 'Bill preparation', 'Shopping and billing'],
    exampleParams: { amounts: [{ denomination: 100, count: 1 }, { denomination: 50, count: 1 }, { denomination: 10, count: 2 }, { denomination: 5, count: 3 }], totalLabel: true },
    aiInstruction: '{ "type": "moneyIndia", "params": { "amounts": [{"denomination": <2000|500|200|100|50|20|10|5|2|1>, "count": <n>}, ...], "totalLabel": true }, "caption": "<describe the money shown>" }'
  },
  {
    type: 'ratioBar',
    label: 'Ratio Bar (Strip Diagram)',
    emoji: '📊',
    description: 'Strip/tape diagram for ratio and proportion problems',
    grades: [4, 5, 6],
    subjects: ['Mathematics'],
    topics: ['Ratio and Proportion', 'Concept of ratio', 'Dividing quantities in given ratios', 'Equivalent ratios', 'Unitary method', 'Direct proportion', 'Percentage'],
    exampleParams: { ratio: [2, 3], labels: ['Boys', 'Girls'], total: 40, showRatio: true, showValues: true },
    aiInstruction: '{ "type": "ratioBar", "params": { "ratio": [<n>, <n>, ...], "labels": ["<label1>", "<label2>", ...], "total": <number or null>, "showRatio": true, "showValues": true, "title": "<optional>" }, "caption": "..." }'
  }
]

/** Return diagrams suitable for a given grade */
export function getDiagramsForGrade(grade) {
  const g = parseInt(grade)
  return DIAGRAM_CATALOG.filter(d => d.grades.includes(g))
}

/**
 * Given a list of topic names (from the course curriculum) and an optional grade,
 * return the diagram types that are relevant — matching by topic keyword.
 * Falls back to all grade-appropriate diagrams if no topic matches are found.
 *
 * @param {string[]} topics   – topic names from the selected chapter/course
 * @param {number|string} grade  – e.g. 4 or "5"
 * @returns {string[]}  – array of diagram type strings e.g. ['clock', 'fraction']
 */
export function getRelevantDiagramTypes(topics = [], grade = null) {
  if (!topics || topics.length === 0) {
    return grade ? getDiagramsForGrade(grade).map(d => d.type) : []
  }

  // Normalise topic strings for fuzzy matching
  const normTopics = topics.map(t => t.toLowerCase())

  const matched = DIAGRAM_CATALOG.filter(diagram => {
    // Grade filter first (if grade is known)
    if (grade && !diagram.grades.includes(parseInt(grade))) return false

    // Check if any of the diagram's tagged topics overlap with the selected topics
    return diagram.topics.some(diagTopic =>
      normTopics.some(t =>
        t.includes(diagTopic.toLowerCase()) || diagTopic.toLowerCase().includes(t)
      )
    )
  })

  // If no topic matches, fall back to all grade-appropriate diagrams
  if (matched.length === 0 && grade) {
    return getDiagramsForGrade(grade).map(d => d.type)
  }

  return matched.map(d => d.type)
}

/** Build the AI prompt section for image-based question generation */
export function buildDiagramPromptSection(selectedDiagramTypes, grade) {
  const relevant = selectedDiagramTypes.length > 0
    ? DIAGRAM_CATALOG.filter(d => selectedDiagramTypes.includes(d.type))
    : getDiagramsForGrade(grade)

  const instructions = relevant.map(d => `  • ${d.label}:\n    ${d.aiInstruction}`).join('\n\n')

  return `
IMAGE-BASED QUESTION REQUIREMENTS:
Each question MUST include a "diagram" field with SVG-renderable data.
Choose the most appropriate diagram type from the list below.

Supported diagram types and their required format:
${instructions}

DIAGRAM FIELD FORMAT (add to each question object):
"diagram": {
  "type": "<type from above>",
  "params": { /* type-specific parameters as documented */ },
  "caption": "<short description of what the diagram shows>"
}

RULES:
- The question TEXT must reference the diagram (e.g. "Look at the clock above...", "In the figure shown...")
- Diagram params must be mathematically valid and consistent with the question
- For clock: hours/minutes must match the question's time reference
- For fraction: numerator/denominator must match the fraction in the question
- For shapes: dimensions must equal values used in calculations
- For decimal: value must be between 0 and 1 (e.g. 0.35 for thirty-five hundredths)
- For factorTree: use a composite number only (not prime)
- For vennDiagram: items must be actual factors/multiples of the given numbers
- For moneyIndia: denomination must be one of 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1
- For ratioBar: ratio values must add up correctly with the stated total
`
}
