import { Tabs } from '@mantine/core'

import classes from './Main.module.css'
import BenchChart, { type Benchmark } from './BenchChart'
import describe from './describe'
import chartData from '../data/file.json'

type Group = { name: string, benchmarks: Benchmark[] }

// "Arithmetic - Performance vs Power (multithreaded)": test "Arithmetic", view "Performance vs Power"
const testName = (name: string) => name.split(' - ')[0]
const viewName = (name: string) => name.split(' - ')[1].replace(' (multithreaded)', '')

// one top-level tab per Sandra test, holding one tab per view of it, in file order
const tests = new Map<string, Group[]>()
for (const g of chartData as Group[]) tests.set(testName(g.name), [...(tests.get(testName(g.name)) ?? []), g])

const tabClasses = { list: classes.tabs, tab: classes.tab }

export default function Main() {
  const first = [...tests.keys()][0]
  return (
    <div className={classes.container}>
      {/* keepMounted={false}: a chart drawn in a hidden tab would be zero size, so each tab draws when opened */}
      <Tabs defaultValue={first} keepMounted={false} classNames={tabClasses}>
        <Tabs.List>
          {[...tests.keys()].map(t => <Tabs.Tab key={t} value={t}>{t}</Tabs.Tab>)}
        </Tabs.List>
        {[...tests.entries()].map(([t, groups]) => (
          <Tabs.Panel key={t} value={t}>
            <Tabs defaultValue={groups[0].name} keepMounted={false} classNames={{ list: classes.subTabs, tab: classes.tab }}>
              <Tabs.List grow>
                {groups.map(g => <Tabs.Tab key={g.name} value={g.name}>{viewName(g.name)}</Tabs.Tab>)}
              </Tabs.List>
              {groups.map(g => (
                <Tabs.Panel key={g.name} value={g.name}>
                  <div className={classes.header}>{g.name}</div>
                  {g.benchmarks.map(b => <BenchChart key={b.name} benchmark={b} description={describe(g.name, b.name)} />)}
                </Tabs.Panel>
              ))}
            </Tabs>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  )
}
