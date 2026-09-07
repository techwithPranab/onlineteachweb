const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const styles = ['pie', 'bar', 'set', 'triangle', 'grid', 'regions'];
const cells = ['full', 'empty', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
const area = points => Math.abs(points.reduce((s, p, i) => { const q = points[(i + 1) % points.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
function convex(points) {
  const turns = points.map((a, i) => {
    const b = points[(i + 1) % points.length], c = points[(i + 2) % points.length];
    return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
  });
  // Reject collinear corners and repeated/self-crossing vertices as well.
  if (!(turns.every(t => t > 0) || turns.every(t => t < 0))) return false;
  const sign = Math.sign(turns[0]);
  return points.every((a, i) => { const b = points[(i + 1) % points.length]; return points.every(p => sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= -1e-8); });
}
function overlap(a, b) {
  for (const polygon of [a, b]) for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length], axis = [p[1] - q[1], q[0] - p[0]];
    const project = shape => shape.map(v => v[0] * axis[0] + v[1] * axis[1]);
    const ap = project(a), bp = project(b);
    if (Math.max(...ap) <= Math.min(...bp) + 1e-8 || Math.max(...bp) <= Math.min(...ap) + 1e-8) return false;
  }
  return true;
}
function validateFractionParams(params, panel = false) {
  const errors = [];
  const fail = message => errors.push(`Fraction diagram: ${message}`);
  if (!params || typeof params !== 'object' || Array.isArray(params)) return ['Fraction diagram: params must be an object'];
  if (params.panels !== undefined) {
    if (panel || !Array.isArray(params.panels) || !integer(params.panels.length, 1, 12)) return ['Fraction diagram: use 1–12 flat panels'];
    const labels = params.panels.map(p => p?.label);
    if (labels.some(l => typeof l !== 'string' || !l.trim()) || new Set(labels).size !== labels.length) fail('panels need unique non-empty labels');
    params.panels.forEach(p => {
      if (p?.text !== undefined) {
        if (typeof p.text !== 'string' || !p.text.trim() || p.panels) fail('text panels need non-empty text and cannot nest panels');
      } else errors.push(...validateFractionParams(p, true));
    });
    return errors;
  }
  const style = params.style ?? 'pie';
  if (!styles.includes(style)) fail('unsupported style');
  if (params.showLabel !== undefined && typeof params.showLabel !== 'boolean') fail('showLabel must be boolean');
  const d = params.denominator ?? (style === 'triangle' ? 3 : 4), n = params.numerator ?? 1;
  if (!integer(d, 1, 100) || !integer(n, 0, 1200)) fail('numerator and denominator must be bounded whole numbers');
  if (['pie', 'bar', 'triangle'].includes(style) && n > d * 12) fail('at most 12 wholes are supported');
  if (style === 'triangle' && d !== 3) fail('triangle fan has denominator 3; use regions for other triangle partitions');
  if (style === 'set' && !params.items && n > d) fail('set numerator cannot exceed its object count');
  const indices = (list, count) => Array.isArray(list) && new Set(list).size === list.length && list.every(i => integer(i, 0, count - 1));
  if (params.shadedIndices !== undefined && (!indices(params.shadedIndices, d) || (params.numerator !== undefined && n !== params.shadedIndices.length))) fail('shadedIndices must be unique valid indices consistent with numerator');
  if (style === 'grid') {
    if (!integer(params.rows, 1, 100) || !integer(params.cols, 1, 100) || params.rows * params.cols > 100) fail('grid dimensions must contain 1–100 cells');
    if (!Array.isArray(params.cells) || params.cells.length !== params.rows * params.cols || params.cells.some(c => !cells.includes(c))) fail('grid needs one valid shading value per cell');
  }
  if (style === 'regions') {
    if (!Array.isArray(params.regions) || !integer(params.regions.length, 1, 100)) fail('provide 1–100 polygon regions');
    else {
      const valid = params.regions.every(r => r && typeof r.shaded === 'boolean' && Array.isArray(r.points) && integer(r.points.length, 3, 12) && r.points.every(p => Array.isArray(p) && p.length === 2 && p.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100)) && area(r.points) > 1e-8 && convex(r.points));
      if (!valid) fail('regions must be convex non-zero-area polygons within 0..100, with boolean shading');
      else if (params.regions.some((r, i) => params.regions.slice(i + 1).some(s => overlap(r.points, s.points)))) fail('polygon regions must not overlap');
    }
  }
  if (style === 'set' && params.items !== undefined) {
    if (!Array.isArray(params.items) || !integer(params.items.length, 1, 100) || params.items.some(i => !i || !['circle', 'square', 'triangle', 'star'].includes(i.shape) || typeof i.shaded !== 'boolean')) fail('items need supported shapes and boolean shading');
  }
  if (params.sectorWeights !== undefined) {
    if (style !== 'pie' || !Array.isArray(params.sectorWeights) || params.sectorWeights.length !== d || params.sectorWeights.some(w => typeof w !== 'number' || !Number.isFinite(w) || w <= 0 || w > 1000)) fail('sectorWeights must match denominator and contain positive finite weights');
    if (n > d) fail('weighted sectors represent one whole');
  }
  if (params.rings !== undefined) {
    if (!params.sectorWeights || !Array.isArray(params.rings) || !integer(params.rings.length, 1, 10)) fail('rings need sectorWeights and 1–10 rings');
    else {
      let previous = 0;
      for (const ring of params.rings) {
        if (!ring || !Number.isFinite(ring.innerRadius) || typeof ring.outerRadius !== 'number' || !Number.isFinite(ring.outerRadius) || Math.abs(ring.innerRadius - previous) > 1e-8 || ring.outerRadius <= ring.innerRadius || ring.outerRadius > 1 || !indices(ring.shadedIndices, d)) { fail('rings must tile radius 0..1 in order with valid shading indices'); break; }
        previous = ring.outerRadius;
      }
      if (Math.abs(previous - 1) > 1e-8) fail('rings must cover the whole disk');
    }
  }
  return errors;
}
module.exports = { validateFractionParams };
