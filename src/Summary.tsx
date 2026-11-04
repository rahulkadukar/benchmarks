import classes from './Main.module.css'
import type { Benchmark, Power } from './BenchChart'
import powerData from '../data/power.json'
import chartData from '../data/file.json'
import sandraData from '../data/sandra.json'
import { machines } from './machines'

type Group = { name: string, benchmarks: Benchmark[] }

// the i7-14700K at stock and at each PL1 = PL2 cap, all read from the same data as the charts
const CAPS = [['frontier', 'Stock (253 W)'], ['frontier125', '125 W'], ['frontier65', '65 W'], ['frontier35', '35 W']]
const groups = [...chartData, ...sandraData] as Group[]
const power = powerData as Record<string, Record<string, Power>>

function value(group: string, chart: string, id: string) {
  const b = groups.find(g => g.name === group)?.benchmarks.find(x => x.name === chart)
  return b?.datasets[0].data[machines.findIndex(m => m.id === id)] ?? null
}

const rows = CAPS.map(([id, name]) => ({
  id,
  name,
  arith1t: value('Arithmetic - Single thread', 'Aggregate Native performance', id),
  arithMt: value('Arithmetic - All threads', 'Aggregate Native performance', id),
  arithW: power['Arithmetic - All threads']?.[id]?.avgW ?? null,
  // sandra.json holds Crypto in MB/s (1 GB = 1024 MB)
  cryptoMt: (v => (v === null ? null : v / 1024))(value('Crypto - All threads', 'Cryptographic Bandwidth', id)),
  cryptoW: power['Crypto - All threads']?.[id]?.avgW ?? null,
}))
const stock = rows[0]

const pct = (v: number | null, base: number | null) => (v === null || !base ? '' : ` (${Math.round(v / base * 100)}%)`)
const num = (v: number | null, digits = 1) => (v === null ? '–' : v.toFixed(digits))
// Crypto MB/s per wall watt, counting 1 GB as 1000 MB, like the pensieve post
const cryptoPerW = (r: (typeof rows)[number]) => (r.cryptoMt !== null && r.cryptoW ? (r.cryptoMt * 1000) / r.cryptoW : null)
// + gain over stock, blank for stock itself
const gain = (v: number | null, base: number | null) => (v === null || !base || v === base ? '' : ` (+${Math.round((v / base - 1) * 100)}%)`)

export default function Summary() {
  return (
    <div className={classes.summary}>
      <div className={classes.header}>i7-14700K power limits: summary</div>
      <table className={classes.summaryTable}>
        <thead>
          <tr>
            <th>Limit (PL1 = PL2)</th>
            <th>Arithmetic, 1 thread (GOPS)</th>
            <th>Arithmetic, all threads (GOPS)</th>
            <th>Wall power (W)</th>
            <th>GOPS per wall watt</th>
            <th>Crypto, all threads (GB/s)</th>
            <th>Wall power (W)</th>
            <th>Crypto MB/s per wall watt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{num(r.arith1t, 2)}</td>
              <td>{num(r.arithMt)}{pct(r.arithMt, stock.arithMt)}</td>
              <td>{num(r.arithW)}{pct(r.arithW, stock.arithW)}</td>
              <td>{r.arithMt !== null && r.arithW ? (r.arithMt / r.arithW).toFixed(2) : '–'}</td>
              <td>{num(r.cryptoMt, 2)}{pct(r.cryptoMt, stock.cryptoMt)}</td>
              <td>{num(r.cryptoW)}{pct(r.cryptoW, stock.cryptoW)}</td>
              <td>{num(cryptoPerW(r))}{gain(cryptoPerW(r), cryptoPerW(stock))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className={classes.summaryList}>
        <li>Single-thread results are the same at every limit: one thread never draws enough to reach even 35 W.</li>
        <li>125 W gives up a few percent of all-threads performance for about 40% less wall power under full load.</li>
        <li>65 W loses more on all-threads Arithmetic than on Crypto, which is partly limited by memory.</li>
        <li>35 W is barely more efficient per watt than 65 W; on Crypto, all threads scores below all cores.</li>
        <li>Idle is about 34 W at the wall at every limit. Wall power is the whole PC, measured by a Kasa plug.</li>
      </ul>
    </div>
  )
}
