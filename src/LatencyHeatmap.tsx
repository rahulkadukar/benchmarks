import classes from './Main.module.css'

// one machine's latency between every pair of threads, from data/heatmaps.json
export interface Heatmap {
  units: number[]
  pairs: [number, number, number][]
}

const SIZE = 440 // grid width in px, at most
const MAX_CELL = 37 // so a 2- or 4-thread CPU doesn't get giant cells
const LOW = [255, 241, 118] // fastest pair: light yellow
const HIGH = [183, 28, 28] // slowest pair: dark red

// colour on this CPU's own scale, fastest to slowest
function shade(t: number) {
  const c = LOW.map((l, i) => Math.round(l + (HIGH[i] - l) * t))
  return `rgb(${c.join(',')})`
}

export default function LatencyHeatmap({ name, heatmap }: { readonly name: string, readonly heatmap: Heatmap }) {
  const { units, pairs } = heatmap
  const n = units.length
  const cell = Math.min(MAX_CELL, SIZE / n)
  const size = cell * n
  const label = 28 // room for the U# labels
  const ns = new Map<string, number>()
  for (const [a, b, v] of pairs) {
    ns.set(`${a}-${b}`, v)
    ns.set(`${b}-${a}`, v)
  }
  const values = pairs.map(p => p[2])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const t = (v: number) => (max === min ? 0 : (v - min) / (max - min))
  // label every thread unless the grid is too dense to read
  const every = n > 16 ? 2 : 1

  return (
    <div className={classes.heatmap}>
      <div className={classes.heatmapTitle}>{name}, {n} threads</div>
      <svg width={size + label} height={size + label} role="img" aria-label={`${name} thread-to-thread latency`}>
        {units.map((u, i) => i % every === 0 && (
          <g key={u} fontSize={9} fill="#DDD">
            <text x={label - 4} y={label + (i + 0.5) * cell} textAnchor="end" dominantBaseline="middle">U{u}</text>
            <text x={label + (i + 0.5) * cell} y={label - 6} textAnchor="middle">U{u}</text>
          </g>
        ))}
        {units.map((a, i) => units.map((b, j) => {
          const v = ns.get(`${a}-${b}`)
          const x = label + j * cell
          const y = label + i * cell
          if (v === undefined) return <rect key={`${a}-${b}`} x={x} y={y} width={cell} height={cell} fill="#455A64" />
          return (
            <g key={`${a}-${b}`}>
              <rect x={x} y={y} width={cell} height={cell} fill={shade(t(v))} stroke="#37474F" strokeWidth={0.5}>
                <title>U{a} to U{b}: {v} ns</title>
              </rect>
              {cell >= 26 && (
                <text x={x + cell / 2} y={y + cell / 2} fontSize={9} textAnchor="middle" dominantBaseline="middle"
                  fill={t(v) > 0.55 ? '#FFF' : '#000'} pointerEvents="none">{v}</text>
              )}
            </g>
          )
        }))}
      </svg>
      <div className={classes.heatmapScale}>
        <span>{min} ns</span>
        <span className={classes.heatmapGradient} style={{ background: `linear-gradient(to right, ${shade(0)}, ${shade(1)})` }} />
        <span>{max} ns</span>
      </div>
    </div>
  )
}
