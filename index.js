const machines = [
  `AMD Ryzen 3950x`,
  `AMD Ryzen 3800x`,
  `Intel i7-8086k`
]
const benchMarks = [
  {
    'name': 'CPU core count',
    'datasets': [
      {
        'label': 'Core count',
        'data': [ 16, 8, 6 ]
      }
    ]
  },
  {
    'name': 'CPU thread count',
    'datasets': [
      {
        'label': 'Thread count',
        'data': [ 32, 16, 12 ]
      }
    ]
  },
  {
    'name': 'Aggregate Native Performance',
    'datasets': [
      {
        'label': 'GOPS',
        'data': [ 580.86, 292.39, 211.61 ]
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
  }
]

function fillBackgroundColor(len) {
  const bgColor = [
    '#D50000',
    '#F9A825',
    '#29B6F6',
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
    barColors.push(bgColor[(i % colorLen)])
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

window.onload = function() {
  var container = document.getElementById('container')
  for (let i = 0; i < benchMarks.length; ++i) {
    var canvas = document.createElement('canvas')
    canvas.id = `canvas-${i.toString().padStart(3, `0`)}`
    canvas.height = 60
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
};