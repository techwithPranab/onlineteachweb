/**
 * DiagramGallery – A gallery page showcasing all available SVG math diagrams.
 * Accessible at /tutor/diagrams or /admin/diagrams.
 */
import { useState } from 'react'
import MathDiagram from '../../components/diagrams/MathDiagram'
import { DIAGRAM_CATALOG } from '../../components/diagrams/diagramCatalog'
import SEOHead from '../../components/SEO/SEOHead'

const DEMO_DIAGRAMS = [
  // Clocks
  { type: 'clock', params: { hours: 3, minutes: 30 }, caption: '3:30 – What time does this clock show?' },
  { type: 'clock', params: { hours: 7, minutes: 15 }, caption: '7:15 – Quarter past seven' },

  // Fractions
  { type: 'fraction', params: { numerator: 3, denominator: 4, style: 'pie' }, caption: '3/4 – Pie chart' },
  { type: 'fraction', params: { numerator: 2, denominator: 5, style: 'bar' }, caption: '2/5 – Bar model' },
  { type: 'fraction', params: { numerator: 3, denominator: 8, style: 'set' }, caption: '3/8 – Set model' },

  // Right Triangle
  { type: 'rightTriangle', params: { base: 3, height: 4, hypotenuse: 5, labelBase: '3 cm', labelHeight: '4 cm', labelHyp: '5 cm' }, caption: '3-4-5 Right Triangle (Pythagorean triple)' },

  // Trig – Unit Circle
  { type: 'trig', params: { style: 'unitCircle', angle: 60, showCoords: true }, caption: 'Unit Circle at 60°' },

  // Angle
  { type: 'angle', params: { degrees: 45, style: 'simple' }, caption: '45° Acute Angle' },
  { type: 'angle', params: { degrees: 120, style: 'protractor' }, caption: '120° Obtuse Angle (with protractor)' },

  // Number Line
  { type: 'numberLine', params: { start: 0, end: 10, marked: [7], highlighted: [5], step: 1 }, caption: 'Number line 0–10, marked at 7' },
  { type: 'numberLine', params: { start: -5, end: 5, step: 1, marked: [-3, 2] }, caption: 'Integer number line' },

  // Shapes
  { type: 'shapes', params: { shape: 'rectangle', dimensions: { width: 8, height: 5 }, showLabels: true }, caption: 'Rectangle (8 × 5)' },
  { type: 'shapes', params: { shape: 'circle', dimensions: { radius: 7 }, showLabels: true }, caption: 'Circle (r = 7)' },
  { type: 'shapes', params: { shape: 'triangle', dimensions: { base: 6, height: 4 }, showLabels: true }, caption: 'Triangle (base 6, height 4)' },
  { type: 'shapes', params: { shape: 'hexagon' }, caption: 'Regular Hexagon' },

  // Bar Graph
  {
    type: 'barGraph',
    params: {
      data: [
        { label: 'Mon', value: 10 },
        { label: 'Tue', value: 14 },
        { label: 'Wed', value: 8 },
        { label: 'Thu', value: 16 },
        { label: 'Fri', value: 12 }
      ],
      title: 'Students Present',
      xLabel: 'Day', yLabel: 'Count'
    },
    caption: 'Attendance bar graph'
  },

  // Place Value
  { type: 'placeValue', params: { thousands: 1, hundreds: 2, tens: 3, ones: 4 }, caption: 'Place value: 1,234' },
  { type: 'placeValue', params: { hundreds: 3, tens: 0, ones: 7 }, caption: 'Place value: 307' },

  // Pattern
  {
    type: 'pattern',
    params: {
      sequence: ['circle', 'square', 'triangle', 'circle', 'square', 'triangle'],
      showIndex: true
    },
    caption: 'Repeating pattern: circle → square → triangle'
  },
  {
    type: 'pattern',
    params: {
      sequence: ['circle', 'square', 'triangle', 'circle', 'square', 'triangle', 'circle'],
      missingIndex: 6,
      showIndex: true
    },
    caption: 'Fill-in-the-blank pattern question'
  },

  // Coordinate Grid
  {
    type: 'coordGrid',
    params: {
      xRange: [0, 8], yRange: [0, 8],
      points: [
        { x: 2, y: 3, label: 'A' },
        { x: 6, y: 5, label: 'B' },
        { x: 4, y: 1, label: 'C' }
      ],
      segments: [{ from: [2, 3], to: [6, 5], color: '#3b82f6' }]
    },
    caption: 'Coordinate grid with points A, B, C'
  },

  // ── Class 4 & 5 New Diagrams ─────────────────────────────────────────────

  // Decimal Grid
  { type: 'decimalGrid', params: { value: 0.3, style: 'tenths', showLabel: true }, caption: '0.3 – Three tenths' },
  { type: 'decimalGrid', params: { value: 0.65, style: 'hundredths', showLabel: true }, caption: '0.65 – Sixty-five hundredths' },

  // Pie Chart
  {
    type: 'pieChart',
    params: {
      data: [
        { label: 'Maths', value: 35 },
        { label: 'Science', value: 25 },
        { label: 'English', value: 20 },
        { label: 'Hindi', value: 12 },
        { label: 'EVS', value: 8 }
      ],
      title: 'Favourite Subjects',
      showLegend: true,
      showPercent: true
    },
    caption: 'Pie chart – favourite subjects survey'
  },

  // Line Graph
  {
    type: 'lineGraph',
    params: {
      data: [{ x: 'Jan', y: 8 }, { x: 'Feb', y: 12 }, { x: 'Mar', y: 10 }, { x: 'Apr', y: 18 }, { x: 'May', y: 15 }],
      xLabel: 'Month',
      yLabel: 'Temperature (°C)',
      title: 'Monthly Temperature',
      showPoints: true,
      showArea: true
    },
    caption: 'Line graph – temperature over months'
  },

  // Circle Parts
  { type: 'circleLabeled', params: { showRadius: true, showDiameter: true, showChord: true, showArc: true, showSector: true, radiusLabel: '7 cm', diameterLabel: '14 cm', angleForSector: 90 }, caption: 'Parts of a circle – radius, diameter, chord, arc, sector' },

  // Factor Tree
  { type: 'factorTree', params: { number: 36 }, caption: 'Factor tree of 36' },
  { type: 'factorTree', params: { number: 60 }, caption: 'Factor tree of 60' },

  // 3D Shapes
  { type: 'shape3d', params: { shape: 'cube', dimensions: { side: 5 }, showLabels: true }, caption: 'Cube (side = 5 cm)' },
  { type: 'shape3d', params: { shape: 'cuboid', dimensions: { length: 6, width: 4, height: 3 }, showLabels: true }, caption: 'Cuboid (6 × 4 × 3 cm)' },
  { type: 'shape3d', params: { shape: 'cylinder', dimensions: { radius: 4, height: 6 }, showLabels: true }, caption: 'Cylinder (r = 4, h = 6)' },
  { type: 'shape3d', params: { shape: 'cone', dimensions: { radius: 3, height: 5 }, showLabels: true }, caption: 'Cone (r = 3, h = 5)' },

  // Symmetry
  { type: 'symmetry', params: { shape: 'butterfly', symmetryAxis: 'vertical', showAxis: true, showLabel: true }, caption: 'Butterfly – vertical line of symmetry' },
  { type: 'symmetry', params: { shape: 'rectangle', symmetryAxis: 'both', showAxis: true, showLabel: true }, caption: 'Rectangle – two lines of symmetry' },
  { type: 'symmetry', params: { shape: 'hexagon', symmetryAxis: 'all', showAxis: true, showLabel: true }, caption: 'Hexagon – multiple lines of symmetry' },

  // Venn Diagram
  {
    type: 'vennDiagram',
    params: {
      setA: { label: 'Factors of 12', items: ['1', '2', '3', '4', '6', '12'] },
      setB: { label: 'Factors of 18', items: ['1', '2', '3', '6', '9', '18'] },
      intersection: ['1', '2', '3', '6'],
      title: 'HCF of 12 and 18'
    },
    caption: 'Venn diagram – HCF of 12 and 18 is 6'
  },

  // Indian Money
  {
    type: 'moneyIndia',
    params: {
      amounts: [
        { denomination: 100, count: 2 },
        { denomination: 50, count: 1 },
        { denomination: 10, count: 3 },
        { denomination: 5, count: 2 }
      ],
      totalLabel: true
    },
    caption: 'Indian money – ₹280'
  },

  // Ratio Bar
  { type: 'ratioBar', params: { ratio: [2, 3], labels: ['Boys', 'Girls'], total: 50, showRatio: true, showValues: true, title: 'Ratio of Boys to Girls' }, caption: 'Ratio 2:3 – strip diagram' },
  { type: 'ratioBar', params: { ratio: [1, 2, 3], labels: ['Red', 'Blue', 'Green'], total: 60, showRatio: true, showValues: true }, caption: 'Ratio 1:2:3 – three parts' }
]

export default function DiagramGallery() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const uniqueTypes = ['all', ...new Set(DEMO_DIAGRAMS.map(d => d.type))]

  const filtered = DEMO_DIAGRAMS.filter(d => {
    const matchType = filter === 'all' || d.type === filter
    const matchSearch = !search || d.caption.toLowerCase().includes(search.toLowerCase()) || d.type.includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <>
      <SEOHead title="Math Diagram Gallery" noIndex={true} noFollow={true} />
      <div className="p-6 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">📐</span>
            Math Diagram Gallery
          </h1>
          <p className="mt-2 text-gray-600">
            SVG-based mathematical diagrams for Classes 1–10. These are used in image-based AI question generation.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search diagrams..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-56"
          />
          <div className="flex flex-wrap gap-2">
            {uniqueTypes.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                  filter === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {t === 'all' ? '🗂 All' : (DIAGRAM_CATALOG.find(c => c.type === t)?.emoji || '📊') + ' ' + t}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h2 className="font-semibold text-blue-900 mb-2">Available Diagram Types ({DIAGRAM_CATALOG.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {DIAGRAM_CATALOG.map(diag => (
              <div key={diag.type} className="bg-white border border-blue-100 rounded-lg px-3 py-2 text-xs">
                <div className="font-medium text-gray-800">{diag.emoji} {diag.label}</div>
                <div className="text-gray-500 mt-0.5">Grades: {diag.grades.join(', ')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((diag, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center p-4 bg-gray-50 min-h-[220px]">
                <MathDiagram
                  diagram={{ type: diag.type, params: diag.params, caption: diag.caption }}
                  size={200}
                />
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                    {diag.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{diag.caption}</p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No diagrams match your search.
          </div>
        )}
      </div>
    </>
  )
}
