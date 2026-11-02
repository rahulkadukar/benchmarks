import { Tabs } from '@mantine/core'

import classes from './Main.module.css'
import BenchChart, { type Benchmark } from './BenchChart'
import describe from './describe'
import chartData from '../data/file.json'

const groups = chartData as { name: string, benchmarks: Benchmark[] }[]

// "Arithmetic - Performance vs Power (multithreaded)" -> "Performance vs Power"
const tabName = (name: string) => name.replace('Arithmetic - ', '').replace(' (multithreaded)', '')

export default function Main() {
  return (
    <div className={classes.container}>
      {/* keepMounted={false}: a chart drawn in a hidden tab would be zero size, so each tab draws when opened */}
      <Tabs defaultValue={groups[0].name} keepMounted={false} classNames={{ list: classes.tabs, tab: classes.tab }}>
        <Tabs.List grow>
          {groups.map(g => <Tabs.Tab key={g.name} value={g.name}>{tabName(g.name)}</Tabs.Tab>)}
        </Tabs.List>
        {groups.map(g => (
          <Tabs.Panel key={g.name} value={g.name}>
            <div className={classes.header}>{g.name}</div>
            {g.benchmarks.map(b => <BenchChart key={b.name} benchmark={b} description={describe(g.name, b.name)} />)}
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  )
}
