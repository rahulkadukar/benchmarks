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
  const bgColor = [
    '#D50000',
    '#29B6F6',
    '#F9A825',
    '#537bc4',
    '#acc236',
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

function renderCharts(chartData) {
  const container = document.getElementById('container')
  chartData.forEach((c) => {
    const headerDiv = document.createElement('div')
    headerDiv.classList.add(`header-div`)
    headerDiv.innerText = c.name
    container.appendChild(headerDiv)

    const benchMarks = c.benchmarks
    
    for (let i = 0; i < benchMarks.length; ++i) {
      var canvas = document.createElement('canvas')
      canvas.id = `canvas-${i.toString().padStart(3, `0`)}`
      canvas.height = 100
      var ctx = canvas.getContext('2d');
      window.myHorizontalBar = new Chart(ctx, {
        type: 'horizontalBar',
        data: createHorizontalBarChartData(benchMarks[i]),
        options: {
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
                gridLines: { color: '#90A4AE' },
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
      container.appendChild(canvas)
    }
  })
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