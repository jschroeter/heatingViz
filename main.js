async function getData (sheetName) {
  let data = [];
  await fetch("https://opensheet.elk.sh/18jTY-XRlSNsuitDiuXnzA-ldyG8hjSkQP6Ud6vt0_ko/" + sheetName).then((res) => res.json())
    .then((rawData) => {
      rawData.forEach(row => {
        let [date, time] = row.Zeit.split(' ');
        let [day, month, year] = date.split('.');
        let [hour, minute, second] = time.split(':');
        let dateObject = new Date(year, month - 1, day, hour, minute, second);
        data.push([dateObject, parseFloat(row.Watt)]);
      });
  });
  return data;
};

async function init () {
  function buildSeries(name, color, data) {
    return {
      name,
      type: 'line',
      symbol: 'none',
      sampling: 'lttb',
      connectNulls: true,
      itemStyle: {
        color
      },
      areaStyle: {},
      data
    };
  }
  let [warmwasser, heizung, solar] = await Promise.all([getData('Warmwasser'), getData('Heizung'), getData('Solar')]);
  let series = [
    buildSeries('Warmwasser', 'blue', warmwasser),
    buildSeries('Heizung', 'red', heizung),
    buildSeries('Solar', 'orange', solar),
  ];
  
  let option = {
    tooltip: {
      trigger: 'axis',
      position: function (pt) {
        return [pt[0], '10%'];
      }
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        restore: {}
      }
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      boundaryGap: false
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 10
      },
      {
        start: 0,
        end: 10
      }
    ],
    series
  };

  var myChart = echarts.init(document.getElementById('chart-container'));
  myChart.setOption(option);
  window.addEventListener('resize', myChart.resize);
};
init();
