/**
 * MathDiagram – central dispatcher for all SVG-based math diagrams.
 *
 * Usage:
 *   <MathDiagram diagram={{ type: "clock", params: { hours: 3, minutes: 30 } }} />
 *
 * Supported types (20 total):
 *   clock        | fraction     | rightTriangle | angle
 *   numberLine   | shapes       | barGraph      | placeValue
 *   pattern      | coordGrid
 *   -- Class 4 & 5 additions --
 *   decimalGrid  | pieChart     | lineGraph     | circleLabeled
 *   factorTree   | shape3d      | symmetry      | vennDiagram
 *   moneyIndia   | ratioBar
 */
import ClockDiagram from './diagrams/ClockDiagram'
import FractionDiagram from './diagrams/FractionDiagram'
import TrigDiagram from './diagrams/TrigDiagram'
import AngleDiagram from './diagrams/AngleDiagram'
import NumberLineDiagram from './diagrams/NumberLineDiagram'
import ShapesDiagram from './diagrams/ShapesDiagram'
import BarGraphDiagram from './diagrams/BarGraphDiagram'
import PlaceValueDiagram from './diagrams/PlaceValueDiagram'
import PatternDiagram from './diagrams/PatternDiagram'
import CoordGridDiagram from './diagrams/CoordGridDiagram'
// Class 4 & 5 diagrams
import DecimalGridDiagram from './diagrams/DecimalGridDiagram'
import PieChartDiagram from './diagrams/PieChartDiagram'
import LineGraphDiagram from './diagrams/LineGraphDiagram'
import CircleLabeledDiagram from './diagrams/CircleLabeledDiagram'
import FactorTreeDiagram from './diagrams/FactorTreeDiagram'
import Shape3DDiagram from './diagrams/Shape3DDiagram'
import SymmetryDiagram from './diagrams/SymmetryDiagram'
import VennDiagramDiagram from './diagrams/VennDiagramDiagram'
import MoneyIndiaDiagram from './diagrams/MoneyIndiaDiagram'
import RatioBarDiagram from './diagrams/RatioBarDiagram'

/** Registry: maps diagram type → component */
const DIAGRAM_REGISTRY = {
  // Original 10
  clock:           ClockDiagram,
  fraction:        FractionDiagram,
  rightTriangle:   TrigDiagram,
  trig:            TrigDiagram,
  angle:           AngleDiagram,
  numberLine:      NumberLineDiagram,
  numberline:      NumberLineDiagram,
  shapes:          ShapesDiagram,
  shape:           ShapesDiagram,
  barGraph:        BarGraphDiagram,
  bargraph:        BarGraphDiagram,
  placeValue:      PlaceValueDiagram,
  placevalue:      PlaceValueDiagram,
  pattern:         PatternDiagram,
  coordGrid:       CoordGridDiagram,
  coordinateGrid:  CoordGridDiagram,
  // Class 4 & 5 additions
  decimalGrid:     DecimalGridDiagram,
  decimalgrid:     DecimalGridDiagram,
  decimal:         DecimalGridDiagram,
  pieChart:        PieChartDiagram,
  piechart:        PieChartDiagram,
  lineGraph:       LineGraphDiagram,
  linegraph:       LineGraphDiagram,
  circleLabeled:   CircleLabeledDiagram,
  circlelabeled:   CircleLabeledDiagram,
  circle:          CircleLabeledDiagram,
  factorTree:      FactorTreeDiagram,
  factortree:      FactorTreeDiagram,
  shape3d:         Shape3DDiagram,
  shape3D:         Shape3DDiagram,
  '3d':            Shape3DDiagram,
  symmetry:        SymmetryDiagram,
  vennDiagram:     VennDiagramDiagram,
  venndiagram:     VennDiagramDiagram,
  venn:            VennDiagramDiagram,
  moneyIndia:      MoneyIndiaDiagram,
  moneyindia:      MoneyIndiaDiagram,
  money:           MoneyIndiaDiagram,
  ratioBar:        RatioBarDiagram,
  ratiobar:        RatioBarDiagram,
  ratio:           RatioBarDiagram,
}

/**
 * MathDiagram
 * @param {Object}  diagram  – { type: string, params: object, caption: string }
 * @param {number}  size     – desired pixel size (width & height for square diagrams)
 * @param {string}  className – extra tailwind classes on the wrapper
 */
export default function MathDiagram({ diagram, size = 220, className = '' }) {
  if (!diagram || !diagram.type) return null

  const Component = DIAGRAM_REGISTRY[diagram.type.toLowerCase()] ||
                    DIAGRAM_REGISTRY[diagram.type]

  if (!Component) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-amber-300 rounded-lg p-4 bg-amber-50 text-amber-700 text-sm ${className}`}>
        <span>⚠️ Unknown diagram type: <code>{diagram.type}</code></span>
      </div>
    )
  }

  return (
    <figure className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="rounded-xl border border-gray-100 shadow-sm bg-white p-3 overflow-hidden">
        <Component params={diagram.params || {}} size={size} />
      </div>
      {diagram.caption && (
        <figcaption className="text-xs text-gray-500 text-center italic max-w-xs">
          {diagram.caption}
        </figcaption>
      )}
    </figure>
  )
}

export {
  DIAGRAM_REGISTRY,
  ClockDiagram,
  FractionDiagram,
  TrigDiagram,
  AngleDiagram,
  NumberLineDiagram,
  ShapesDiagram,
  BarGraphDiagram,
  PlaceValueDiagram,
  PatternDiagram,
  CoordGridDiagram,
  // Class 4 & 5
  DecimalGridDiagram,
  PieChartDiagram,
  LineGraphDiagram,
  CircleLabeledDiagram,
  FactorTreeDiagram,
  Shape3DDiagram,
  SymmetryDiagram,
  VennDiagramDiagram,
  MoneyIndiaDiagram,
  RatioBarDiagram
}
