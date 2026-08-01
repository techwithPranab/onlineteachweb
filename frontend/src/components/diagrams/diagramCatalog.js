/**
 * Diagram catalog – metadata for all supported SVG diagram types.
 * Diagrams cover Classes 1–12 Mathematics curriculum.
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
  },

  // ── Class 6 to 12 additions ─────────────────────────────────────────────
  {
    type: 'functionGraph',
    label: 'Function Graph',
    emoji: '📈',
    description: 'Graph linear, quadratic, cubic, sine and absolute value functions',
    grades: [8, 9, 10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Functions', 'Relations and Functions', 'Linear Equations', 'Quadratic Equations', 'Polynomials', 'Graphs', 'Inverse Trigonometric Functions', 'Domain and range'],
    exampleParams: { kind: 'quadratic', xRange: [-5, 5], yRange: [-3, 8], a: 1, b: 0, c: -4, title: 'y = x² - 4' },
    aiInstruction: '{ "type": "functionGraph", "params": { "kind": "linear"|"quadratic"|"cubic"|"sine"|"absolute", "xRange": [<min>, <max>], "yRange": [<min>, <max>], "a": <number>, "b": <number>, "c": <number>, "title": "<label>", "points": [{"x": <n>, "y": <n>, "label": "<optional>"}] }, "caption": "..." }'
  },
  {
    type: 'conicSections',
    label: 'Conic Sections',
    emoji: '🟦',
    description: 'Show a circle, parabola, ellipse or hyperbola with key features',
    grades: [10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Conic Sections', 'Circle equation', 'Parabola', 'Ellipse', 'Hyperbola', 'Coordinate Geometry'],
    exampleParams: { conic: 'parabola', title: 'Parabola with focus and directrix', showFocus: true, showDirectrix: true },
    aiInstruction: '{ "type": "conicSections", "params": { "conic": "circle"|"parabola"|"ellipse"|"hyperbola", "title": "<label>", "showFocus": true, "showDirectrix": true }, "caption": "..." }'
  },
  {
    type: 'calculus',
    label: 'Calculus Curve',
    emoji: '∫',
    description: 'Show derivative as tangent or integral as shaded area',
    grades: [11, 12],
    subjects: ['Mathematics'],
    topics: ['Limits and Derivatives', 'Continuity and Differentiability', 'Applications of Derivatives', 'Integrals', 'Definite integrals', 'Area under curves'],
    exampleParams: { mode: 'derivative', pointX: 1, title: 'Derivative as instant rate' },
    aiInstruction: '{ "type": "calculus", "params": { "mode": "derivative"|"integral", "pointX": <number>, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'matrix',
    label: 'Matrix / Determinant',
    emoji: '▦',
    description: 'Display matrices, highlighted entries and determinant notes',
    grades: [10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Matrices', 'Determinants', 'Matrix operations', 'Transpose', 'Inverse method', 'Linear Systems'],
    exampleParams: { matrix: [[1, 2], [3, 4]], determinant: -2, title: '2 by 2 determinant' },
    aiInstruction: '{ "type": "matrix", "params": { "matrix": [[<n>, <n>], [<n>, <n>]], "highlight": [<rowIndex>, <colIndex>], "determinant": <number|null>, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'vector3d',
    label: '3D Vector',
    emoji: '↗',
    description: 'Show vectors in a simple three-dimensional coordinate frame',
    grades: [11, 12],
    subjects: ['Mathematics'],
    topics: ['Vectors', 'Three Dimensional Geometry', 'Vector algebra', 'Scalar product', 'Vector product', 'Equation of line', 'Equation of plane'],
    exampleParams: { vectors: [{ x: 3, y: 2, z: 2, label: 'a' }], title: 'Vector in 3D' },
    aiInstruction: '{ "type": "vector3d", "params": { "vectors": [{"x": <n>, "y": <n>, "z": <n>, "label": "<label>", "color": "<hex optional>"}], "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'probabilityTree',
    label: 'Probability Tree',
    emoji: '🌿',
    description: 'Branching tree for conditional probability and compound events',
    grades: [8, 9, 10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Probability', 'Conditional probability', 'Bayes theorem', 'Random experiments', 'Events', 'Sample space', 'Compound events'],
    exampleParams: { root: 'Start', branches: [{ label: 'A', probability: '1/2', children: [{ label: 'C', probability: '1/3' }, { label: 'D', probability: '2/3' }] }, { label: 'B', probability: '1/2', children: [{ label: 'C', probability: '1/4' }, { label: 'D', probability: '3/4' }] }], title: 'Two-stage probability' },
    aiInstruction: '{ "type": "probabilityTree", "params": { "root": "<label>", "branches": [{"label": "<event>", "probability": "<p>", "children": [{"label": "<event>", "probability": "<p>"}]}], "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'integerChips',
    label: 'Integer Chips',
    emoji: '+/-',
    description: 'Positive and negative chips with zero-pair cancellation',
    grades: [6, 7, 8],
    subjects: ['Mathematics'],
    topics: ['Integers', 'Positive and negative numbers', 'Integer addition', 'Integer subtraction', 'Comparing integers', 'Rational Numbers'],
    exampleParams: { positives: 5, negatives: 3, showZeroPairs: true, title: '5 positives and 3 negatives' },
    aiInstruction: '{ "type": "integerChips", "params": { "positives": <n>, "negatives": <n>, "showZeroPairs": true, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'algebraTiles',
    label: 'Algebra Tiles',
    emoji: 'x2',
    description: 'Area tiles for expressions, identities and factorisation',
    grades: [6, 7, 8, 9, 10],
    subjects: ['Mathematics'],
    topics: ['Algebraic Expressions', 'Expressions and Identities', 'Factorisation', 'Polynomials', 'Quadratic Equations', 'Standard identities', 'Terms and coefficients'],
    exampleParams: { x2: 1, x: 3, ones: 2, title: 'x squared plus 3x plus 2' },
    aiInstruction: '{ "type": "algebraTiles", "params": { "x2": <n>, "x": <n>, "ones": <n>, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'equationBalance',
    label: 'Equation Balance',
    emoji: '=',
    description: 'Balance scale for linear equations and equality',
    grades: [6, 7, 8, 9, 10],
    subjects: ['Mathematics'],
    topics: ['Simple Equations', 'Linear Equations', 'Equation as balance', 'Solving equations', 'Checking solutions', 'Pair of Linear Equations'],
    exampleParams: { left: ['x', '3'], right: ['7'], title: 'x + 3 = 7' },
    aiInstruction: '{ "type": "equationBalance", "params": { "left": ["x", "3"], "right": ["7"], "title": "<equation>" }, "caption": "..." }'
  },
  {
    type: 'parallelLines',
    label: 'Parallel Lines',
    emoji: '||',
    description: 'Parallel lines cut by a transversal with equal angle pairs',
    grades: [6, 7, 8, 9, 10],
    subjects: ['Mathematics'],
    topics: ['Parallel and perpendicular lines', 'Pairs of angles', 'Parallel lines with transversal', 'Angle axioms', 'Proofs with angles', 'Lines and Angles'],
    exampleParams: { angle: 60, showLabels: true, title: 'Corresponding angles' },
    aiInstruction: '{ "type": "parallelLines", "params": { "angle": <degrees>, "showLabels": true, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'circleTheorem',
    label: 'Circle Theorem',
    emoji: 'O',
    description: 'Circle theorem visuals such as tangent-radius and angle in a segment',
    grades: [9, 10, 11],
    subjects: ['Mathematics'],
    topics: ['Circle theorems', 'Tangents', 'Secant ideas', 'Cyclic quadrilateral', 'Circle basics', 'Circle equation'],
    exampleParams: { theorem: 'tangentRadius', title: 'Radius is perpendicular to tangent' },
    aiInstruction: '{ "type": "circleTheorem", "params": { "theorem": "tangentRadius"|"angleInSegment", "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'solidNet',
    label: 'Solid Net',
    emoji: 'net',
    description: 'Flat net of cube or cuboid for surface area and 3D visualization',
    grades: [6, 7, 8, 9, 10],
    subjects: ['Mathematics'],
    topics: ['Nets of solids', 'Surface Areas and Volumes', 'Cube cuboid cylinder', 'Cuboid and cube', 'Volume of cubes and cuboids', 'Combination of solids'],
    exampleParams: { solid: 'cube', labels: true, title: 'Net of a cube' },
    aiInstruction: '{ "type": "solidNet", "params": { "solid": "cube"|"cuboid", "labels": true, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'histogram',
    label: 'Histogram',
    emoji: 'hist',
    description: 'Continuous frequency bars for grouped data',
    grades: [8, 9, 10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Grouped data introduction', 'Frequency distribution', 'Statistics', 'Grouped mean', 'Median and mode', 'Measures of dispersion'],
    exampleParams: { bins: [{ range: '0-10', frequency: 4 }, { range: '10-20', frequency: 9 }, { range: '20-30', frequency: 6 }], title: 'Grouped data' },
    aiInstruction: '{ "type": "histogram", "params": { "bins": [{"range": "<a-b>", "frequency": <n>}], "title": "<label>", "xLabel": "<label>", "yLabel": "<label>" }, "caption": "..." }'
  },
  {
    type: 'boxPlot',
    label: 'Box Plot',
    emoji: 'box',
    description: 'Five-number summary for spread and median',
    grades: [9, 10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Statistics', 'Median', 'Measures of dispersion', 'Variance', 'Standard deviation', 'Data Handling'],
    exampleParams: { min: 2, q1: 5, median: 8, q3: 12, max: 16, title: 'Five-number summary' },
    aiInstruction: '{ "type": "boxPlot", "params": { "min": <n>, "q1": <n>, "median": <n>, "q3": <n>, "max": <n>, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'complexPlane',
    label: 'Complex Plane',
    emoji: 'Re/Im',
    description: 'Argand plane for complex numbers and roots',
    grades: [11, 12],
    subjects: ['Mathematics'],
    topics: ['Complex Numbers', 'Imaginary unit', 'Argand plane', 'Quadratic roots'],
    exampleParams: { points: [{ real: 3, imaginary: 2, label: 'z' }], range: 5, title: 'z = 3 + 2i' },
    aiInstruction: '{ "type": "complexPlane", "params": { "points": [{"real": <n>, "imaginary": <n>, "label": "<label>"}], "range": <n>, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'linearProgramming',
    label: 'Linear Programming',
    emoji: 'LPP',
    description: 'Feasible region and objective line for optimization',
    grades: [12],
    subjects: ['Mathematics'],
    topics: ['Linear Programming', 'Feasible region', 'Objective function', 'Optimization', 'Applied decision problems'],
    exampleParams: { vertices: [{ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 3, y: 3 }, { x: 5, y: 0 }], objectiveLine: [{ x: 1, y: 5 }, { x: 5, y: 1 }], title: 'Feasible region' },
    aiInstruction: '{ "type": "linearProgramming", "params": { "vertices": [{"x": <n>, "y": <n>}], "objectiveLine": [{"x": <n>, "y": <n>}, {"x": <n>, "y": <n>}], "xRange": [<min>, <max>], "yRange": [<min>, <max>], "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'slopeField',
    label: 'Slope Field',
    emoji: 'dy/dx',
    description: 'Direction field for differential equations',
    grades: [12],
    subjects: ['Mathematics'],
    topics: ['Differential equations', 'Derivative rules', 'Applied modelling', 'Rates in science'],
    exampleParams: { xRange: [-3, 3], yRange: [-3, 3], density: 7, title: 'Direction field' },
    aiInstruction: '{ "type": "slopeField", "params": { "xRange": [<min>, <max>], "yRange": [<min>, <max>], "density": <n>, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'sequence',
    label: 'Sequence Diagram',
    emoji: 'seq',
    description: 'Term-by-term visual for AP, GP and recursive patterns',
    grades: [6, 7, 8, 9, 10, 11],
    subjects: ['Mathematics'],
    topics: ['Number patterns', 'Sequences', 'Arithmetic Progressions', 'Arithmetic progression', 'Geometric progression', 'Series', 'nth term', 'Sum of AP'],
    exampleParams: { terms: [2, 5, 8, 11, 14], kind: 'AP', title: 'Arithmetic progression' },
    aiInstruction: '{ "type": "sequence", "params": { "terms": [<n>, <n>, ...], "kind": "AP"|"GP"|"recursive", "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'transformationGrid',
    label: 'Transformation Grid',
    emoji: 'grid',
    description: 'Original and image shapes on a coordinate grid for reflection/translation',
    grades: [7, 8, 9, 10],
    subjects: ['Mathematics'],
    topics: ['Rotational symmetry', 'Symmetry', 'Coordinates', 'Graphing', 'Geometric patterns', 'Transformations'],
    exampleParams: { original: [[1, 1], [3, 1], [2, 3]], image: [[-1, 1], [-3, 1], [-2, 3]], title: 'Reflection in y-axis' },
    aiInstruction: '{ "type": "transformationGrid", "params": { "original": [[x,y], [x,y], [x,y]], "image": [[x,y], [x,y], [x,y]], "xRange": [<min>, <max>], "yRange": [<min>, <max>], "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'mapping',
    label: 'Mapping Diagram',
    emoji: 'map',
    description: 'Arrow mapping from domain to codomain for relations and functions',
    grades: [8, 9, 10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Relations and Functions', 'Relations', 'Functions', 'Domain and range', 'Types of functions', 'One-one and onto functions', 'Composition of functions', 'Invertible functions'],
    exampleParams: { domain: ['1', '2', '3'], codomain: ['2', '4', '6', '8'], arrows: [{ from: '1', to: '2' }, { from: '2', to: '4' }, { from: '3', to: '6' }], title: 'Function from A to B' },
    aiInstruction: '{ "type": "mapping", "params": { "domain": ["<item>", ...], "codomain": ["<item>", ...], "arrows": [{"from": "<domainItem>", "to": "<codomainItem>"}], "title": "<label>", "leftLabel": "Domain", "rightLabel": "Codomain" }, "caption": "..." }'
  },
  {
    type: 'unitCircle',
    label: 'Unit Circle',
    emoji: 'trig',
    description: 'Unit circle visual for trigonometric ratios, radians and coordinates',
    grades: [10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Trigonometric Functions', 'Angles and radians', 'Graphs of trigonometric functions', 'Trigonometric signs', 'Standard angles', 'Inverse Trigonometric Functions', 'Principal values'],
    exampleParams: { angle: 45, showCoordinates: true, title: '45 degree angle on unit circle' },
    aiInstruction: '{ "type": "unitCircle", "params": { "angle": <degrees>, "showCoordinates": true, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'inequalityNumberLine',
    label: 'Inequality Number Line',
    emoji: 'ineq',
    description: 'Number line with open/closed boundary and shaded inequality interval',
    grades: [7, 8, 9, 10, 11],
    subjects: ['Mathematics'],
    topics: ['Linear inequations', 'Inequalities', 'Comparing integers', 'Rational numbers on number line', 'Representation on number line', 'Domain restrictions'],
    exampleParams: { min: -5, max: 5, boundary: 2, direction: 'right', inclusive: true, label: 'x >= 2' },
    aiInstruction: '{ "type": "inequalityNumberLine", "params": { "min": <n>, "max": <n>, "boundary": <n>, "direction": "left"|"right", "inclusive": true|false, "label": "<inequality>" }, "caption": "..." }'
  },
  {
    type: 'ogive',
    label: 'Ogive',
    emoji: 'ogive',
    description: 'Cumulative frequency curve for median and grouped statistics',
    grades: [9, 10, 11, 12],
    subjects: ['Mathematics'],
    topics: ['Cumulative frequency', 'Ogive and histogram', 'Median and mode', 'Statistics', 'Grouped data introduction', 'Analysis of frequency distributions'],
    exampleParams: { points: [{ x: 10, y: 4 }, { x: 20, y: 13 }, { x: 30, y: 22 }, { x: 40, y: 30 }], title: 'Less-than ogive' },
    aiInstruction: '{ "type": "ogive", "params": { "points": [{"x": <upperBoundary>, "y": <cumulativeFrequency>}], "title": "<label>", "xLabel": "<label>", "yLabel": "<label>" }, "caption": "..." }'
  },
  {
    type: 'locus',
    label: 'Locus Diagram',
    emoji: 'locus',
    description: 'Locus construction such as perpendicular bisector or fixed-distance circle',
    grades: [8, 9, 10],
    subjects: ['Mathematics'],
    topics: ['Loci and construction', 'Loci', 'Construction checks', 'Ruler and compass constructions', 'Playing with constructions', 'Perpendicular bisectors', 'Circle construction'],
    exampleParams: { kind: 'perpendicularBisector', title: 'Locus of points equidistant from A and B' },
    aiInstruction: '{ "type": "locus", "params": { "kind": "perpendicularBisector"|"circle", "pointA": {"x": <n>, "y": <n>, "label": "A"}, "pointB": {"x": <n>, "y": <n>, "label": "B"}, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'rotationalSymmetry',
    label: 'Rotational Symmetry',
    emoji: '⟳',
    description: 'Show a shape after repeated turns around a centre',
    grades: [7, 8, 9],
    subjects: ['Mathematics'],
    topics: ['Rotational symmetry', 'Order of rotational symmetry', 'Angle of rotation', 'Symmetry', '2-D objects'],
    exampleParams: { shape: 'triangle', angle: 120, order: 3, title: 'Order 3 rotational symmetry', showCopies: true },
    aiInstruction: '{ "type": "rotationalSymmetry", "params": { "shape": "triangle"|"square"|"rectangle"|"pinwheel", "angle": <degrees>, "order": <n>, "showCopies": true, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'congruence',
    label: 'Congruence Criteria',
    emoji: '≅',
    description: 'Compare two triangles with matching side and angle marks',
    grades: [7, 8, 9],
    subjects: ['Mathematics'],
    topics: ['Congruence', 'Congruence of triangles', 'SSS', 'SAS', 'ASA', 'RHS', 'Superimposition', 'Criteria of congruence'],
    exampleParams: { criterion: 'SSS', title: 'Congruent triangles by SSS', showLabels: true },
    aiInstruction: '{ "type": "congruence", "params": { "criterion": "SSS"|"SAS"|"ASA"|"RHS", "title": "<label>", "showLabels": true }, "caption": "..." }'
  },
  {
    type: 'quadrilateralProperties',
    label: 'Quadrilateral Properties',
    emoji: '▱',
    description: 'Show quadrilateral angle sum, diagonals and parallelogram-family properties',
    grades: [8, 9],
    subjects: ['Mathematics'],
    topics: ['Quadrilaterals', 'Properties of quadrilaterals', 'Parallelogram properties', 'Diagonals of rectangle', 'Diagonals of rhombus', 'Diagonals of square', 'Angle Sum property'],
    exampleParams: { kind: 'parallelogram', property: 'diagonalsBisect', title: 'Diagonals bisect each other', showLabels: true },
    aiInstruction: '{ "type": "quadrilateralProperties", "params": { "kind": "parallelogram"|"rectangle"|"rhombus"|"square"|"trapezium", "property": "angleSum"|"oppositeSidesEqual"|"oppositeAnglesEqual"|"diagonalsBisect"|"rectangleDiagonals"|"rhombusDiagonals"|"squareDiagonals", "title": "<label>", "showLabels": true }, "caption": "..." }'
  },
  {
    type: 'surfaceVolume',
    label: 'Surface Area and Volume',
    emoji: '▣',
    description: 'Model cube, cuboid, cylinder, cone and sphere dimensions for TSA, CSA and volume',
    grades: [8, 9, 10],
    subjects: ['Mathematics'],
    topics: ['Surface area', 'Total surface area', 'Curved surface area', 'Volume', 'Volume of cube', 'Volume of cuboid', 'Volume of cylinder', 'Volume of cone', 'Volume of sphere', 'Cylinder cone and sphere', 'Capacity', 'Mensuration'],
    exampleParams: { solid: 'cone', mode: 'volume', dimensions: { radius: 3, height: 7 }, title: 'Volume of cone' },
    aiInstruction: '{ "type": "surfaceVolume", "params": { "solid": "cube"|"cuboid"|"cylinder"|"cone"|"sphere", "mode": "volume"|"totalSurface"|"curvedSurface", "dimensions": {"length": <n>, "width": <n>, "height": <n>, "radius": <n>, "side": <n>}, "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'logarithmScale',
    label: 'Logarithm Scale',
    emoji: 'log',
    description: 'Connect powers, indices and logarithms on a scale',
    grades: [9, 10],
    subjects: ['Mathematics'],
    topics: ['Logarithms', 'Indices', 'Exponents', 'Laws of logarithms', 'Logarithm as inverse of exponent'],
    exampleParams: { base: 10, powers: [-2, -1, 0, 1, 2, 3], title: 'Powers and logarithms' },
    aiInstruction: '{ "type": "logarithmScale", "params": { "base": <number>, "powers": [<integers>], "title": "<label>" }, "caption": "..." }'
  },
  {
    type: 'similarTriangles',
    label: 'Similar Triangles',
    emoji: '△∼△',
    description: 'Compare two similar triangles with matching angles and proportional sides',
    grades: [9, 10],
    subjects: ['Mathematics'],
    topics: ['Similarity', 'Similar triangles', 'Conditions of similar triangles', 'AAA similarity', 'SSS similarity', 'SAS similarity', 'Scale factor', 'Corresponding sides'],
    exampleParams: { criterion: 'AAA', scaleFactor: 1.5, title: 'Similar triangles' },
    aiInstruction: '{ "type": "similarTriangles", "params": { "criterion": "AAA"|"SSS"|"SAS", "scaleFactor": <number>, "title": "<label>", "showLabels": true }, "caption": "..." }'
  },
  {
    type: 'commercialMath',
    label: 'Commercial Mathematics',
    emoji: '₹%',
    description: 'Flow cards for GST invoices, banking interest, shares and dividends',
    grades: [10],
    subjects: ['Mathematics'],
    topics: ['Commercial Mathematics', 'GST', 'Banking', 'Shares and Dividends', 'Tax invoices', 'Dividend', 'Interest'],
    exampleParams: { mode: 'gst', base: 1000, rate: 9, extraRate: 9, title: 'GST bill' },
    aiInstruction: '{ "type": "commercialMath", "params": { "mode": "gst"|"banking"|"shares", "base": <number>, "rate": <number>, "extraRate": <number>, "faceValue": <number>, "shares": <number>, "title": "<label>" }, "caption": "..." }'
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
