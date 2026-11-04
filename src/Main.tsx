import { Tabs } from '@mantine/core'

import classes from './Main.module.css'
import BenchChart, { type Benchmark, type Power } from './BenchChart'
import powerData from '../data/power.json'
import describe from './describe'
import chartData from '../data/file.json'
import sandraData from '../data/sandra.json'
import heatmapData from '../data/heatmaps.json'
import LatencyHeatmap, { type Heatmap } from './LatencyHeatmap'
import { machines } from './machines'
import Summary from './Summary'

type Group = { name: string, benchmarks: Benchmark[] }

// "Arithmetic - Performance vs Power (multithreaded)": test "Arithmetic", view "Performance vs Power"
const testName = (name: string) => name.split(' - ')[0]
const viewName = (name: string) => name.split(' - ')[1].replace(' (multithreaded)', '')

// one top-level tab per Sandra test, holding one tab per view of it, in file order
const tests = new Map<string, Group[]>()
for (const g of [...chartData, ...sandraData] as Group[]) tests.set(testName(g.name), [...(tests.get(testName(g.name)) ?? []), g])
// each test opens on its single-thread view, then all cores, then all threads
const FIRST = ['Single thread', 'All cores', 'All threads']
const rank = (g: Group) => (FIRST.includes(viewName(g.name)) ? FIRST.indexOf(viewName(g.name)) : FIRST.length)
for (const groups of tests.values()) groups.sort((a, b) => rank(a) - rank(b))

const tabClasses = { list: classes.tabs, tab: classes.tab }

// wall power of the whole PC during this view's run, measured by the Kasa plug
function PowerNote({ power }: { readonly power?: Record<string, Power> }) {
  if (!power) return null
  return (
    <div className={classes.note}>
      {Object.entries(power).map(([id, p]) => {
        const name = machines.find(m => m.id === id)?.name ?? id
        const runs = p.runs > 1 ? `, average of ${p.runs} runs (${p.rangeW?.join('–')} W)` : ''
        return (
          <div key={id}>
            {name}: {p.avgW} W average at the wall, {p.peakW} W peak, {p.idleW} W idle, {p.whPerRun} Wh per {Math.round(p.seconds / 60 * 10) / 10}-minute run{runs}
          </div>
        )
      })}
    </div>
  )
}

export default function Main() {
  const first = [...tests.keys()][0]
  return (
    <div className={classes.container}>
      <Summary />
      {/* keepMounted={false}: a chart drawn in a hidden tab would be zero size, so each tab draws when opened */}
      <Tabs defaultValue={first} keepMounted={false} classNames={tabClasses}>
        {/* the tests' tabs wrap onto a second row; each test's views stay on one */}
        <Tabs.List>
          {[...tests.keys()].map(t => <Tabs.Tab key={t} value={t}>{t}</Tabs.Tab>)}
        </Tabs.List>
        {[...tests.entries()].map(([t, groups]) => (
          <Tabs.Panel key={t} value={t}>
            <Tabs defaultValue={groups[0].name} keepMounted={false} classNames={{ list: classes.subTabs, tab: classes.tab }}>
              <Tabs.List grow>
                {groups.map(g => <Tabs.Tab key={g.name} value={g.name}>{viewName(g.name)}</Tabs.Tab>)}
                {t === 'Inter-core' && <Tabs.Tab value="heatmap">Heatmap</Tabs.Tab>}
              </Tabs.List>
              {t === 'Inter-core' && (
                <Tabs.Panel value="heatmap">
                  <div className={classes.header}>Inter-core - Heatmap</div>
                  <div className={classes.note}>
                    latency between every pair of threads (U0, U1, …), closest-cores run; each CPU on its own scale, hover a cell for its value
                  </div>
                  <div className={classes.heatmaps}>
                    {(heatmapData as (Heatmap | null)[]).map((h, i) => h && <LatencyHeatmap key={machines[i].name} name={machines[i].name} heatmap={h} />)}
                  </div>
                </Tabs.Panel>
              )}
              {groups.map(g => (
                <Tabs.Panel key={g.name} value={g.name}>
                  <div className={classes.header}>{g.name}</div>
                  <PowerNote power={(powerData as Record<string, Record<string, Power>>)[g.name]} />
                  {g.benchmarks.map(b => <BenchChart key={b.name} benchmark={b} description={describe(g.name, b)} power={(powerData as Record<string, Record<string, Power>>)[g.name]} />)}
                </Tabs.Panel>
              ))}
            </Tabs>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  )
}
