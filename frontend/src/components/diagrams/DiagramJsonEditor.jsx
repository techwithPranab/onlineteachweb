import { Component } from 'react'
import MathDiagram from './MathDiagram'
import { parseDiagramJson } from '../../utils/diagramJson.mjs'

class PreviewBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <p role="alert" className="text-red-700">These parameters could not be rendered. Check the diagram JSON.</p>
      : this.props.children
  }
}

export default function DiagramJsonEditor({ value, onChange }) {
  const { diagram, error } = parseDiagramJson(value)
  return <div className="space-y-2">
    <label htmlFor="question-diagram-json" className="block font-medium text-gray-700">Diagram JSON</label>
    <p id="question-diagram-help" className="text-sm text-gray-500">Edit the type, params and optional caption. Leave empty to remove the diagram.</p>
    <textarea id="question-diagram-json" aria-describedby="question-diagram-help question-diagram-error" aria-invalid={Boolean(error)} value={value} onChange={e => onChange(e.target.value)} rows={12} spellCheck={false} className="w-full rounded-lg border p-3 font-mono text-sm" placeholder={'{\n  "type": "fraction",\n  "params": { "style": "triangle", "numerator": 1, "denominator": 3 }\n}'} />
    <p id="question-diagram-error" role={error ? 'alert' : undefined} className="text-sm text-red-700">{error}</p>
    {diagram && <PreviewBoundary key={value}><MathDiagram diagram={diagram} size={240} /></PreviewBoundary>}
  </div>
}
