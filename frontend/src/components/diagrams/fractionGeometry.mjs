// All area figures use the same 100 × 100 coordinate system.
export function polygonArea(points) {
  return Math.abs(points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length]
    return sum + p[0] * q[1] - q[0] * p[1]
  }, 0)) / 2
}

export function fractionRegions(params) {
  const { style = 'pie', denominator = 4 } = params
  if (style === 'regions') return params.regions.map(r => ({ ...r, area: polygonArea(r.points) }))
  if (style === 'grid' || style === 'bar') {
    const rows = style === 'bar' ? 1 : params.rows
    const cols = style === 'bar' ? denominator : params.cols
    const cells = params.cells || Array.from({ length: rows * cols }, (_, i) => isShaded(params, i) ? 'full' : 'empty')
    return cells.flatMap((cell, i) => {
      const x = i % cols * 100 / cols, y = Math.floor(i / cols) * 100 / rows
      const w = 100 / cols, h = 100 / rows
      const tl = [x, y], tr = [x + w, y], br = [x + w, y + h], bl = [x, y + h]
      if (cell === 'full' || cell === 'empty') return [{ points: [tl, tr, br, bl], shaded: cell === 'full', area: w * h }]
      const triangles = {
        'top-left': [[tl, tr, bl], [tr, br, bl]],
        'bottom-right': [[tr, br, bl], [tl, tr, bl]],
        'top-right': [[tl, tr, br], [tl, br, bl]],
        'bottom-left': [[tl, br, bl], [tl, tr, br]],
      }
      return triangles[cell].map((points, j) => ({ points, shaded: j === 0, area: w * h / 2 }))
    })
  }
  if (style === 'triangle') {
    // Fan from the centroid to the three sides: exactly three equal areas.
    const corners = [[50, 3], [97, 94], [3, 94]], center = [50, (3 + 94 + 94) / 3]
    return corners.map((p, i) => ({ points: [center, p, corners[(i + 1) % 3]], area: 1, shaded: isShaded(params, i) }))
  }
  return []
}

export function isShaded(params, index) {
  return Array.isArray(params.shadedIndices) ? params.shadedIndices.includes(index) : index < (params.numerator ?? 1)
}

export function fractionValue(params) {
  if (['pie', 'bar', 'triangle'].includes(params.style || 'pie') && !params.sectorWeights && !params.shadedIndices && params.numerator > (params.denominator ?? 4)) return params.numerator / (params.denominator ?? 4)
  if (params.style === 'set') {
    const items = params.items || Array.from({ length: params.denominator ?? 4 }, (_, i) => ({ shaded: isShaded(params, i) }))
    return items.filter(item => item.shaded).length / items.length
  }
  const regions = fractionRegions(params)
  if (regions.length) return regions.reduce((sum, r) => sum + (r.shaded ? r.area : 0), 0) / regions.reduce((sum, r) => sum + r.area, 0)
  if (params.sectorWeights) {
    const rings = params.rings || [{ innerRadius: 0, outerRadius: 1, shadedIndices: params.sectorWeights.map((_, i) => i).filter(i => isShaded(params, i)) }]
    const weight = params.sectorWeights.reduce((a, b) => a + b, 0)
    return rings.reduce((sum, ring) => sum + (ring.outerRadius ** 2 - ring.innerRadius ** 2) * ring.shadedIndices.reduce((a, i) => a + params.sectorWeights[i] / weight, 0), 0)
  }
  return params.shadedIndices ? params.shadedIndices.length / (params.denominator ?? 4) : (params.numerator ?? 1) / (params.denominator ?? 4)
}
