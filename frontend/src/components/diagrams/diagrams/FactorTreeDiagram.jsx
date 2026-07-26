/**
 * FactorTreeDiagram – visual factor tree for prime factorization.
 * params: {
 *   number: the number to factorise (e.g. 36),
 *   tree: optional pre-built tree structure (auto-built if omitted)
 *     { value, left?, right? }
 * }
 */

// ── Auto-build factor tree ────────────────────────────────────────────────────
function buildTree(n) {
  if (n <= 1 || isPrime(n)) return { value: n, prime: n > 1 }
  const factor = smallestFactor(n)
  return {
    value: n,
    prime: false,
    left: buildTree(factor),
    right: buildTree(n / factor)
  }
}

function isPrime(n) {
  if (n < 2) return false
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false
  }
  return true
}

function smallestFactor(n) {
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return i
  }
  return n
}

// ── Layout: assign x/y to each node ──────────────────────────────────────────
function layoutTree(node, depth = 0, offset = { value: 0 }) {
  if (!node) return null
  const laid = { ...node, depth }
  if (!node.left && !node.right) {
    laid.x = offset.value++
    return laid
  }
  if (node.left) laid.left = layoutTree(node.left, depth + 1, offset)
  if (node.right) laid.right = layoutTree(node.right, depth + 1, offset)
  const leftX = laid.left?.x ?? 0
  const rightX = laid.right?.x ?? leftX
  laid.x = (leftX + rightX) / 2
  return laid
}

function collectNodes(node, nodes = [], edges = []) {
  if (!node) return
  nodes.push(node)
  if (node.left) {
    edges.push({ from: node, to: node.left })
    collectNodes(node.left, nodes, edges)
  }
  if (node.right) {
    edges.push({ from: node, to: node.right })
    collectNodes(node.right, nodes, edges)
  }
}

export default function FactorTreeDiagram({ params = {}, size = 260 }) {
  const { number = 36, tree: customTree } = params

  const n = Math.min(Math.max(parseInt(number) || 36, 2), 500)
  const rawTree = customTree || buildTree(n)
  const laid = layoutTree(rawTree)

  const nodes = [], edges = []
  collectNodes(laid, nodes, edges)

  // Compute bounding box
  const maxDepth = Math.max(...nodes.map(nd => nd.depth))
  const maxX = Math.max(...nodes.map(nd => nd.x))
  const levelH = size / (maxDepth + 2)
  const colW = maxX > 0 ? (size - 40) / maxX : size - 40

  const toSx = (x) => 20 + x * colW
  const toSy = (d) => 28 + d * levelH

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Edges */}
      {edges.map((e, i) => (
        <line key={i}
          x1={toSx(e.from.x)} y1={toSy(e.from.depth)}
          x2={toSx(e.to.x)} y2={toSy(e.to.depth)}
          stroke="#94a3b8" strokeWidth="1.8"
        />
      ))}

      {/* Nodes */}
      {nodes.map((nd, i) => {
        const sx = toSx(nd.x), sy = toSy(nd.depth)
        const isLeaf = !nd.left && !nd.right
        const isPrimeNode = nd.prime
        return (
          <g key={i}>
            <circle
              cx={sx} cy={sy} r={18}
              fill={isPrimeNode ? '#dbeafe' : isLeaf ? '#fef9c3' : 'white'}
              stroke={isPrimeNode ? '#2563eb' : '#64748b'}
              strokeWidth={isPrimeNode ? 2.5 : 1.5}
            />
            <text
              x={sx} y={sy + 5}
              textAnchor="middle" fontSize={isPrimeNode ? 13 : 12}
              fontWeight={isPrimeNode ? '700' : '500'}
              fill={isPrimeNode ? '#1d4ed8' : '#334155'}
            >
              {nd.value}
            </text>
            {/* Prime label */}
            {isPrimeNode && (
              <text x={sx + 20} y={sy - 10} fontSize={8} fill="#2563eb" fontWeight="600">prime</text>
            )}
          </g>
        )
      })}

      {/* Prime factorization result at bottom */}
      <text x={size / 2} y={size - 6} textAnchor="middle" fontSize={11} fill="#334155">
        {n} = {nodes.filter(nd => nd.prime).map(nd => nd.value).sort((a, b) => a - b).join(' × ')}
      </text>
    </svg>
  )
}
