async function getData(sheetName) {
  let toDate = (dateString) => {
    let [date, time] = dateString.split(' ');
    let [day, month, year] = date.split('.');
    let [hour, minute, second] = time.split(':');
    return new Date(year, month - 1, day, hour, minute, second);
  };

  let data = [];
  await fetch(
    'https://opensheet.elk.sh/18jTY-XRlSNsuitDiuXnzA-ldyG8hjSkQP6Ud6vt0_ko/' +
      sheetName
  )
    .then((res) => res.json())
    .then((rawData) => {
      rawData.forEach((row) => {
        let value = parseFloat(row.Value.replace(',', '.'));
        if (isNaN(value)) {
          value = row.Value;
        }
        if (row.TimeEnd) {
          data.push([toDate(row.Time), toDate(row.TimeEnd), value]);
        } else {
          data.push([toDate(row.Time), value]);
        }
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
      // sampling: 'lttb',
      step: 'end',
      itemStyle: {
        color
      },
      lineStyle: {
        width: 0
      },
      areaStyle: {},
      data
    };
  }
  function linearizeStandby(entry) {
    let power = entry[1];
    if (power <= 10) {
      power = 0;
    }
    return [entry[0], power];
  }
  let [warmwasser, heizung, solar, temperatur, marker] = await Promise.all([
    getData('Warmwasser'),
    getData('Heizung'),
    getData('Solar'),
    getData('Temperatur'),
    getData('Marker')
  ]);

  let markerLines = [];
  let markerAreas = [];
  marker.forEach(item => {
    if (item.length === 3) {
      markerAreas.push([{
        xAxis: item[0],
        name: item[2]
      }, {
        xAxis: item[1]
      }]);
    } else {
      markerLines.push({
        xAxis: item[0],
        name: item[1]
      });
    }
  });
 

  let warmwasserSeries = buildSeries('Warmwasser', 'blue', warmwasser.map(linearizeStandby));
  warmwasserSeries.markLine = {
      lineStyle: {
        color: 'black',
        width: 7
      },
      label: {
        formatter: '{b}' // bug in echarts?
      },
      data: markerLines
  };

  warmwasserSeries.markArea = {
    itemStyle: {
      color: 'rgba(255, 0, 0, 0.1)'
    },
    data: markerAreas
  };

  let temperaturSeries = {
    ...buildSeries('Außentemperatur', 'pink', temperatur),
    areaStyle: null,
    lineStyle: {
      width: 1.2
    },
    step: null
  };

  let series = [
    buildSeries('Solar', 'orange', solar.map(linearizeStandby)),
    warmwasserSeries,
    buildSeries('Gas', 'black', heizung.map(linearizeStandby)),
    temperaturSeries
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
      data: series.map(item => item.name),
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      boundaryGap: false
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
