// Builds data/sandra.json from the SiSoftware Sandra results in 2020-02/.
// Run: npm run extract
// One group per Sandra test and view (all threads, single thread, per thread, vs. speed), in the shape
// the viewer already uses for data/file.json. Values are converted to one unit per chart.
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '2020-02')
// same order as src/machines.ts; frontier is the i7-14700K (2026 runs)
const MACHINES = ['summit', 'tars', 'frontier', 'yellowstone', 'roadrunner', 'bluegene', 'cray']

// Sandra saves its text reports as UTF-8 (2020) or as UTF-16 with a byte-order mark (2026)
function readText(file) {
  const buf = fs.readFileSync(file)
  if (buf[0] === 0xFF && buf[1] === 0xFE) return buf.toString('utf16le').slice(1)
  return buf.toString('utf8').replace(/^\uFEFF/, '')
}

const TESTS = [
  ['crypto_high', 'Crypto'],
  ['finance_high', 'Finance (high precision)'],
  ['finance_normal', 'Finance (normal precision)'],
  ['image', 'Image'],
  ['multimedia', 'Multimedia'],
  ['neural_high', 'Neural network'],
  ['scientific_high', 'Scientific'],
  ['power_int', 'Integer efficiency'],
  ['power_float', 'Float efficiency'],
]
// [file suffix, Sandra section, view name]
const VIEWS = [
  ['mt', 'Benchmark Results', 'All threads'],
  ['1t', 'Benchmark Results', 'Single thread'],
  ['mc', 'Benchmark Results', 'All cores'],
  ['mt', 'Performance per Thread', 'Per thread'],
  ['mt', 'Performance vs. Speed', 'Per MHz'],
]
// CPUs without hyper-threading: one thread per core is all their threads, so the all-threads run
// is also the all-cores run (the G3440 is 2 cores, 2 threads and has no _mc files)
const NO_SMT = ['cray']
const LATENCY = [['best_latency', 'Closest cores'], ['worst_latency', 'Farthest cores']]

// "Blur: Convolution (3x3) Filter x8 AVX2/FMA" -> "Blur: Convolution (3x3) Filter"; the suffix names the CPU's
// instruction set, which differs between machines running the same test
const ISA = /^(x\d+|AVX\S*|SSE\S*|FMA\S*|ALU|HWA|MMX\S*|\S+\/HWA)$/
function testName(name) {
  const words = name.trim().split(/\s+/)
  while (words.length > 1 && ISA.test(words[words.length - 1])) words.pop()
  return words.join(' ')
}

// "17.87GB/s" -> { value: 17.87, prefix: 'G', base: 'B/s' }
const PREFIX = { '': 1, k: 1e3, M: 1e6, G: 1e9, T: 1e12 }
function parseValue(text) {
  const m = text.match(/^([0-9.]+)\s*([kMGT]?)(.*)$/)
  if (!m) return null
  let [, value, prefix, base] = m
  // units that start with one of the prefix letters but are not prefixed
  if (prefix && !/^(B|OPT|Pix|FLOPS|IPS|OPS|samples)/.test(base)) { base = prefix + base; prefix = '' }
  return { value: Number(value), prefix, base }
}

// file -> [{ section, metrics: Map(name -> parsed value), lowerIsBetter }]
function readSections(file) {
  const lines = readText(file).replace(/\r/g, '').split('\n')
  const sections = []
  let current = null
  for (const line of lines) {
    if (!line.trim()) continue
    const i = line.indexOf(' : ')
    if (i < 0) { current = { section: line.trim(), metrics: new Map(), lowerIsBetter: false }; sections.push(current); continue }
    if (!current) continue
    const name = line.slice(0, i)
    const text = line.slice(i + 3).trim()
    if (name === 'Results Interpretation') { current.lowerIsBetter = /Lower/.test(text); continue }
    if (/Numeral System|No\. Threads|Processor\(s\) Power|^Type$/.test(name)) continue
    const v = parseValue(text)
    // a bare number ("Power Efficiency : 1.40") has no unit to say what it measures
    if (v && v.base && !current.metrics.has(testName(name))) current.metrics.set(testName(name), v)
  }
  return sections
}

// bytes use binary prefixes (Sandra: 1GB = 1024MB), everything else decimal
const toBase = (v) => v.value * (v.base.startsWith('B') ? Math.pow(1024, Object.keys(PREFIX).indexOf(v.prefix)) : PREFIX[v.prefix])

// one chart: the same metric from every machine, in the unit of the smallest value, so none drops below 1
function chart(name, values, lowerIsBetter) {
  const present = values.filter(Boolean)
  const smallest = present.reduce((a, b) => (toBase(b) < toBase(a) ? b : a))
  const scale = toBase({ value: 1, prefix: smallest.prefix, base: smallest.base })
  const unit = smallest.prefix + smallest.base
  return {
    name,
    unit,
    lowerIsBetter,
    datasets: [{ label: unit, data: values.map(v => (v ? Math.round(toBase(v) / scale * 100) / 100 : null)) }],
  }
}

// every machine's section `section` of `file`, merged into charts in the first machine's metric order
function group(name, suffix, section, nth = 0) {
  const per = MACHINES.map(m => {
    let file = path.join(ROOT, m, `${m}_cpu_${suffix}.txt`)
    if (suffix.endsWith('_mc') && !fs.existsSync(file) && NO_SMT.includes(m)) file = file.replace(/_mc\.txt$/, '_mt.txt')
    if (!fs.existsSync(file)) return null
    // a single-thread file that is a byte-for-byte copy of the all-threads file holds no single-thread result
    const mt = file.replace(/_1t\.txt$/, '_mt.txt')
    if (mt !== file && fs.existsSync(mt) && fs.readFileSync(mt).equals(fs.readFileSync(file))) return null
    return readSections(file).filter(s => s.section === section)[nth] ?? null
  })
  const first = per.find(Boolean)
  if (!first || first.metrics.size === 0) return null
  const benchmarks = [...first.metrics.keys()]
    .map(metric => chart(metric, per.map(p => p?.metrics.get(metric) ?? null), first.lowerIsBetter))
    .filter(c => c.datasets[0].data.filter(v => v !== null).length >= 2)
  return benchmarks.length ? { name, benchmarks } : null
}

const groups = []
for (const [id, title] of TESTS) {
  for (const [suffix, section, view] of VIEWS) {
    const g = group(`${title} - ${view}`, `${id}_${suffix}`, section)
    if (g) groups.push(g)
  }
}
// Arithmetic's other views are hand-built in data/file.json; its all-cores view comes from here
const arithmeticCores = group('Arithmetic - All cores', 'arithmetic_mc', 'Benchmark Results')
if (arithmeticCores) groups.push(arithmeticCores)
// the latency files hold two "Benchmark Results" sections: bandwidth, then latency
for (const [id, view] of LATENCY) {
  const bandwidth = group(`Inter-core - ${view}`, `${id}_mt`, 'Benchmark Results', 0)
  const latency = group(`Inter-core - ${view}`, `${id}_mt`, 'Benchmark Results', 1)
  if (bandwidth || latency) groups.push({ name: `Inter-core - ${view}`, benchmarks: [...(bandwidth?.benchmarks ?? []), ...(latency?.benchmarks ?? [])] })
}

fs.writeFileSync(path.join(__dirname, '..', 'data', 'sandra.json'), JSON.stringify(groups) + '\n')

// data/heatmaps.json: each machine's latency between every pair of threads ("U0-U2 Data Latency : 26.6ns"),
// from the closest-cores run, in machine order
// null for a machine without a latency run
const heatmaps = MACHINES.map(m => {
  const file = path.join(ROOT, m, `${m}_cpu_best_latency_mt.txt`)
  if (!fs.existsSync(file)) return null
  const text = readText(file)
  const pairs = [...text.matchAll(/^U(\d+)-U(\d+) Data Latency : ([0-9.]+)ns\s*$/gm)].map(r => [Number(r[1]), Number(r[2]), Number(r[3])])
  const units = [...new Set(pairs.flatMap(([a, b]) => [a, b]))].sort((a, b) => a - b)
  if (pairs.length !== units.length * (units.length - 1) / 2) throw new Error(`${m}: ${pairs.length} pairs for ${units.length} threads`)
  return { units, pairs }
})
fs.writeFileSync(path.join(__dirname, '..', 'data', 'heatmaps.json'), JSON.stringify(heatmaps) + '\n')
console.log(`heatmaps: ${heatmaps.map((h, i) => `${MACHINES[i]} ${h ? `${h.units.length}x${h.units.length}` : 'none'}`).join(', ')}`)
for (const g of groups) {
  console.log(`${g.name}: ${g.benchmarks.length} charts`)
  for (const b of g.benchmarks) console.log(`  ${b.name} [${b.unit}${b.lowerIsBetter ? ', lower is better' : ''}] ${b.datasets[0].data.join(', ')}`)
}
