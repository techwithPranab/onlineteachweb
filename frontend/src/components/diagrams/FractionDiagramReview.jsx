import MathDiagram from './MathDiagram'
import { fractionDiagramIssues, diagramFromDescription } from '../../utils/fractionDiagramConsistency.mjs'

export default function FractionDiagramReview({ question, onChange }) {
  const issues = fractionDiagramIssues(question)
  if (!issues.length) return null
  const replacement = diagramFromDescription(question)
  return <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
    <p className="font-semibold">Figure does not match the question</p>
    <ul className="list-disc pl-5 my-2">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>
    {onChange && replacement ? <>
      <p className="my-2">Figure described in the question:</p>
      <MathDiagram diagram={replacement} size={200} />
      <button type="button" className="mt-3 rounded bg-amber-800 px-3 py-2 text-white" onClick={() => onChange({ ...question, diagram: replacement })}>Use this figure</button>
    </> : <p>Open Edit &amp; Approve to correct the figure or question text.</p>}
  </div>
}
