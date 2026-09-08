export function parseDiagramJson(value) {
  if (!value.trim()) return { diagram: null, error: '' }
  try {
    const diagram = JSON.parse(value)
    if (!diagram || typeof diagram !== 'object' || Array.isArray(diagram)) throw new Error('Use a diagram object with type and params.')
    if (typeof diagram.type !== 'string' || !diagram.type.trim()) throw new Error('Diagram type must be a non-empty string.')
    if (diagram.params !== undefined && (!diagram.params || typeof diagram.params !== 'object' || Array.isArray(diagram.params))) throw new Error('Diagram params must be an object.')
    if (diagram.caption !== undefined && typeof diagram.caption !== 'string') throw new Error('Diagram caption must be text.')
    return { diagram, error: '' }
  } catch (error) {
    return { diagram: null, error: error.message }
  }
}
