const machines = [
  `AMD Ryzen 3950x`,
  `AMD Ryzen 3800x`,
  `Intel i7-8086k`,
  `Intel i7-5820k`,
  `Intel Pentium G4430`
]
const bbb = [
  {
    'name': 'CPU thread count',
    'datasets': [
      {
        'label': 'Thread count',
        'data': [ 32, 16, 12, 12, 2]
      }
    ]
  },
  {
    'name': 'Aggregate Native Performance',
    'datasets': [
      {
        'label': 'GOPS',
        'data': [ 580.86, 292.39, 211.61, 189.56, 41.31 ]
      }
    ]
  },
  {
    'name': 'Dhrystone Integer Native AVX2',
    'datasets': [
      {
        'label': 'GIPS',
        'data': [ 775, 391.14, 284.11 ]
      }
    ]
  },
  {
    'name': 'Dhrystone Long Native AVX2',
    'datasets': [
      {
        'label': 'GIPS',
        'data': [ 773.18, 389.19, 290.08 ]
      }
    ]
  },
  {
    'name': 'Aggregate Native Performance per thread',
    'datasets': [
      {
        'label': 'GIPS',
        'data': [ 18.15, 18.27, 17.63 ]
      }
    ]
  },
  {
    'name': 'Aggregate Native Performance per MHz',
    'datasets': [
      {
        'label': 'MOPS/MHz',
        'data': [ 127.21, 66.20, 42.24 ]
      }
    ]
  },
  {
    'name': 'Aggregate Native Performance per Watt',
    'datasets': [
      {
        'label': 'MOPS/W',
        'data': [ 4228.72, 2275.38, 1488.24 ]
      }
    ]
  }
]

function fillBackgroundColor(len) {
  // same order as the machines and the legend in index.html: AMD in reds, Intel in blues
  const bgColor = [
    '#B71C1C',
    '#EF5350',
    '#1565C0',
    '#42A5F5',
    '#90CAF9',
    '#166a8f',
    '#00a950',
    '#58595b',
    '#8549ba'
  ]
  const barColors = []
  const colorLen = bgColor.length
  for (let i = 0; i < len; ++i) {
    barColors.push(bgColor[((i + 0) % colorLen)])
  }
  return barColors
}


function createHorizontalBarChartData(bData) {
  return {
    'labels': machines,
    'datasets': bData.datasets.map((dataSet, i) => {
      return {
        ...dataSet,
        backgroundColor: fillBackgroundColor(dataSet.data.length)
      }
    })
  }
}

// writes each bar's value just past its end
const valueLabels = {
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx
    ctx.save()
    ctx.font = '12px sans-serif'
    ctx.textBaseline = 'middle'
    chart.data.datasets.forEach((dataSet, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, j) => {
        const text = String(dataSet.data[j])
        const x = bar._model.x + 6
        const y = bar._model.y
        // page background behind the text, so grid lines don't run through it
        ctx.fillStyle = '#37474F'
        ctx.fillRect(x - 2, y - 8, ctx.measureText(text).width + 4, 16)
        ctx.fillStyle = '#DDD'
        ctx.fillText(text, x, y)
      })
    })
    ctx.restore()
  }
}

function renderCharts(chartData) {
  const container = document.getElementById('container')
  // one tab per group; charts in a hidden tab render at zero size, so they are resized when shown
  const tabBar = document.createElement('div')
  tabBar.classList.add('tabs')
  container.appendChild(tabBar)
  const tabs = []
  const show = (k) => tabs.forEach((t, j) => {
    t.button.classList.toggle('active', j === k)
    t.panel.hidden = j !== k
    if (j === k) t.charts.forEach((chart) => chart.resize())
  })
  chartData.forEach((c, k) => {
    const button = document.createElement('button')
    button.innerText = c.name.replace('Arithmetic - ', '').replace(' (multithreaded)', '')
    button.onclick = () => show(k)
    tabBar.appendChild(button)
    const panel = document.createElement('div')
    container.appendChild(panel)
    const tab = { button, panel, charts: [] }
    tabs.push(tab)

    const headerDiv = document.createElement('div')
    headerDiv.classList.add(`header-div`)
    headerDiv.innerText = c.name
    panel.appendChild(headerDiv)

    const benchMarks = c.benchmarks
    
    for (let i = 0; i < benchMarks.length; ++i) {
      var canvas = document.createElement('canvas')
      canvas.id = `canvas-${i.toString().padStart(3, `0`)}`
      canvas.height = 100
      var ctx = canvas.getContext('2d');
      panel.appendChild(canvas)
      window.myHorizontalBar = new Chart(ctx, {
        type: 'horizontalBar',
        data: createHorizontalBarChartData(benchMarks[i]),
        plugins: [valueLabels],
        options: {
          // room on the right for the value written past the longest bar
          layout: { padding: { right: 60 } },
          // Elements options apply to all of the options unless overridden in a dataset
          // In this case, we are setting the border of each horizontal bar to be 2px wide
          elements: { rectangle: { borderWidth: 2, } },
          responsive: true,
          legend: { display: false},
          title: {
            display: true,
            fontColor: '#DDD',
            text: benchMarks[i].name
          },
          scales: {
            xAxes: [
              {
                gridLines: { color: 'rgba(144, 164, 174, 0.35)' },
                ticks: { 
                  fontColor: "#DDD",
                  min: 0 
                } 
              }
            ],
            yAxes: [{
              display: false
            }]
          }
        }
      });
      tab.charts.push(window.myHorizontalBar)
    }
  })
  show(0)
}

window.onload = function() {
  fetch('data/file.json')
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    renderCharts(data)
  });
};