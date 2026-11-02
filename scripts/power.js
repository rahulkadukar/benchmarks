// Builds data/power.json: wall power during benchmark runs, from the Kasa plug log that
// ui-watch-mode records (one row per second before 2026-11-02 13:28, one per 10 s after).
// Run: npm run power
// data/power-runs.json says which time windows belong to which view and machine; Sandra's
// reports carry no timestamps, so the windows come from the load periods in the plug log.
const fs = require('fs')
const path = require('path')

const PLUG_LOG = path.join(process.env.HOME, 'temp', 'one-off', 'ui-watch-mode', 'kasa-data')
// idle = the quiet floor (10th percentile) of up to 3 minutes of readings before each run, looking back as
// far as 10 minutes and skipping every listed run, so back-to-back runs don't count each other as idle
const IDLE_MS = 3 * 60 * 1000
const LOOKBACK_MS = 10 * 60 * 1000
const MARGIN_MS = 10 * 1000

function rows(plug, from, to) {
  const out = []
  for (let day = new Date(from - 86400000); day <= new Date(to + 86400000); day = new Date(day.getTime() + 86400000)) {
    const name = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}.jsonl`
    const file = path.join(PLUG_LOG, plug, name)
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line) continue
      const r = JSON.parse(line)
      if (r.t >= from && r.t <= to) out.push(r)
    }
  }
  return out.sort((a, b) => a.t - b.t)
}

const floor = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.1)]

const ENTRIES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'power-runs.json'), 'utf8'))
const WINDOWS = ENTRIES.flatMap(e => e.runs.map(([s, t]) => [Date.parse(s) - MARGIN_MS, Date.parse(t) + MARGIN_MS]))
const inAnyRun = (t) => WINDOWS.some(([a, b]) => t >= a && t <= b)

function measure(plug, start, end) {
  const from = Date.parse(start)
  const to = Date.parse(end)
  const run = rows(plug, from, to)
  if (run.length < 2) throw new Error(`${plug} ${start}: no plug readings in this window`)
  // each row's power covers the time since the previous row (10 s rows are interval averages)
  let wattSeconds = 0
  for (let i = 1; i < run.length; i++) wattSeconds += run[i].power * (run[i].t - run[i - 1].t) / 1000
  const seconds = (run[run.length - 1].t - run[0].t) / 1000
  const quiet = rows(plug, from - LOOKBACK_MS, from - MARGIN_MS).filter(r => !inAnyRun(r.t))
  const before = quiet.filter(r => r.t >= (quiet.length ? quiet[quiet.length - 1].t : 0) - IDLE_MS).map(r => r.power)
  return {
    seconds,
    avg: wattSeconds / seconds,
    peak: Math.max(...run.map(r => r.powerMax ?? r.power)),
    idle: before.length ? floor(before) : null,
    wh: wattSeconds / 3600,
  }
}

const round = (x) => (x === null ? null : Math.round(x * 10) / 10)
const out = {}
for (const entry of ENTRIES) {
  const m = entry.runs.map(([s, e]) => measure(entry.plug, s, e))
  const mean = (k) => m.reduce((a, r) => a + r[k], 0) / m.length
  const idles = m.map(r => r.idle).filter(x => x !== null)
  const result = {
    avgW: round(mean('avg')),
    peakW: round(Math.max(...m.map(r => r.peak))),
    idleW: round(idles.length ? idles.reduce((a, x) => a + x, 0) / idles.length : null),
    whPerRun: round(mean('wh')),
    seconds: Math.round(mean('seconds')),
    runs: m.length,
    rangeW: m.length > 1 ? [round(Math.min(...m.map(r => r.avg))), round(Math.max(...m.map(r => r.avg)))] : null,
    note: entry.note,
  }
  ;(out[entry.view] ??= {})[entry.machine] = result
  console.log(`${entry.view} / ${entry.machine}: ${result.avgW} W avg (${result.runs} run${result.runs > 1 ? 's' : ''}${result.rangeW ? `, ${result.rangeW.join('-')} W` : ''}), peak ${result.peakW} W, idle ${result.idleW} W, ${result.whPerRun} Wh per run, ${result.seconds} s`)
}
fs.writeFileSync(path.join(__dirname, '..', 'data', 'power.json'), JSON.stringify(out, null, 1) + '\n')
