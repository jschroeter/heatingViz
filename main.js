async function getData(sheetName) {
  let data = [];
  await fetch(
    'https://opensheet.elk.sh/18jTY-XRlSNsuitDiuXnzA-ldyG8hjSkQP6Ud6vt0_ko/' +
      sheetName
  )
    .then((res) => res.json())
    .then((rawData) => {
      rawData.forEach((row) => {
        let [date, time] = row.Zeit.split(' ');
        let [day, month, year] = date.split('.');
        let [hour, minute, second] = time.split(':');
        let dateObject = new Date(year, month - 1, day, hour, minute, second);
        let power = parseFloat(row.Watt);
        if (power <= 10) {
          power = 0; // linearize little standby consumption
        }
        data.push([dateObject, power]);
      });
    });
  return data;
}

async function init() {
  function buildSeries(name, color, data) {
    return {
      name,
      type: 'line',
      symbol: 'none',
      sampling: 'lttb',
      step: 'end',
      itemStyle: {
        color,
      },
      lineStyle: {
        width: 0,
      },
      areaStyle: {},
      data,
    };
  }
  let [warmwasser, heizung, solar] = await Promise.all([
    getData('Warmwasser'),
    getData('Heizung'),
    getData('Solar'),
  ]);
  let warmwasserSeries = buildSeries('Warmwasser', 'blue', warmwasser);
  warmwasserSeries.markLine = {
      lineStyle: {
        color: 'black',
        width: 7
      },
      label: {
        formatter: '{b}' // bug in echarts?
      },
      data: [
        {
          name: 'Zirkulation: Eco-Mode an',
          xAxis: '2022-04-24 18:00:00'
        },
        {
          name: 'Solarthermie kaputt',
          xAxis: '2022-04-30 09:52:00'
        },
        {
          name: 'Zirkulation: Eco-Mode aus; Zeiten angepasst',
          xAxis: '2022-05-04 22:00:00'
        }
      ]
  };

  warmwasserSeries.markArea = {
    itemStyle: {
      color: 'rgba(255, 0, 0, 0.1)'
    },
    data: [
      [
        {
          name: 'Unnötige Speicherladung',
          xAxis: '2022-04-20 22:44:00'
        },
        {
          xAxis: '2022-04-20 23:25:00'
        }
      ],
      [
        {
          name: 'Unnötige Speicherladung',
          xAxis: '2022-04-21 23:04:00'
        },
        {
          xAxis: '2022-04-21 23:34:00'
        }
      ],
      [
        {
          name: 'Unnötige Speicherladung',
          xAxis: '2022-04-22 21:52:00'
        },
        {
          xAxis: '2022-04-22 22:32:00'
        }
      ],
      [
        {
          name: 'Unnötige Speicherladung',
          xAxis: '2022-04-27 11:25:00'
        },
        {
          xAxis: '2022-04-27 11:34:00'
        }
      ],
      [
        {
          name: 'Unnötige Speicherladung',
          xAxis: '2022-04-29 08:53:00'
        },
        {
          xAxis: '2022-04-29 09:30:00'
        }
      ]
    ]
    
  };

  let series = [
    warmwasserSeries,
    buildSeries('Solar', 'orange', solar),
    buildSeries('Gas', 'grey', heizung),
  ];



  let zoomDateEnd = new Date();
  let zoomDateStart = new Date(zoomDateEnd);
  zoomDateStart.setDate(zoomDateEnd.getDate() - 3);

  let option = {
    tooltip: {
      trigger: 'axis',
      position: function (pt) {
        return [pt[0], '10%'];
      },
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
        },
        restore: {},
      },
    },
    legend: {
      data: ['Warmwasser', 'Solar', 'Gas'],
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      boundaryGap: false,
      axisLabel: {
        formatter: '{value} W',
      },
    },
    dataZoom: [
      {
        type: 'inside',
        startValue: zoomDateStart,
        endValue: zoomDateEnd,
        filterMode: 'none' // see https://github.com/apache/echarts/issues/3637
      },
      {
        startValue: zoomDateStart,
        endValue: zoomDateEnd
      },
    ],
    series,
  };

  var myChart = echarts.init(document.getElementById('chart-container'));
  myChart.setOption(option);
  window.addEventListener('resize', myChart.resize);
}
init();
