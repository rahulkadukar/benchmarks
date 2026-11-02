// One line under each chart title: what the test measures, then what the group divides it by.
// The divisors were worked back from data/file.json against the raw Sandra results in 2020-02/.

function measures(chart: string): { what: string, unit: string } {
  if (chart.startsWith('Processor Power Draw')) return { what: 'rated power (TDP)', unit: 'watts' }
  if (chart.startsWith('Dhrystone Aggregated')) return { what: 'combined integer score', unit: 'GOPS' }
  if (chart.startsWith('Whetstone Aggregated')) return { what: 'combined floating-point score', unit: 'GOPS' }
  if (chart.startsWith('Dhrystone Integer')) return { what: '32-bit integer instructions', unit: 'GIPS' }
  if (chart.startsWith('Dhrystone Long')) return { what: '64-bit integer instructions', unit: 'GIPS' }
  if (chart.startsWith('Whetstone Single')) return { what: 'single-precision floating-point operations', unit: 'GFLOPS' }
  if (chart.startsWith('Whetstone Double')) return { what: 'double-precision floating-point operations', unit: 'GFLOPS' }
  return { what: 'combined integer and floating-point score', unit: 'GOPS' }
}

export default function describe(group: string, chart: string) {
  const { what, unit } = measures(chart)
  if (unit === 'watts') return `${what}, in ${unit}`
  if (group.includes('per thread')) return `${what}, ${unit} ÷ thread count (32, 16, 12, 12, 2)`
  if (group.includes('vs Power')) return `${what}, ${unit} ÷ rated watts × 1000 (millions per watt)`
  if (group.includes('vs Speed')) return `${what}, ${unit} ÷ clock speed in GHz`
  return `${what}, all threads, ${unit} (billions per second)`
}
