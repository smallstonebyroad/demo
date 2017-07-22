var Charts = (function () {

    function renderChart(pressureData, speedData) {
        Highcharts.setOptions({
            global: {useUTC: false}
        });
        var Typhoncharts = new Highcharts.Chart({

            chart: {
                renderTo: 'highcharts',
                plotBackgroundColor: '#ffffff'
            },
            title: {
                text: ''
            },
            xAxis: [{
                type: 'datetime',
                tickInterval: 6 * 24 * 3600 * 1000,
                dateTimeLabelFormats: {
                    day: '%m/%d',
                    week: '%m-%d',
                    month: '%m月'
                },
                offset: 0,
                tickmarkPlacement: 'on'
            }],
            yAxis: [{ // Primary yAxis
                title:'',
                color:'#333333'
            }, { // Secondary yAxis
                title:'',
                color:'#333333',
                opposite: true//混合图Y轴位置

            }],
            tooltip: {
                shared: true,
                useHtml:true,
                dateTimeLabelFormats:{
                    hour:"%m-%e %H:%M",
                    day:"%m-%e",
                    month:"%Y-%m"
                },
                formatter:function () {
                        var index = this.points[0].point.index;
                        return "<span>"+ new Date(this.x).format('mm月dd日HH时') +"</span><br>"
                                +"<span>风力:"+ speedData[index][1]+ "m/s</span><br>"
                                +"<span>气压:"+ pressureData[index][1]+ "hPa</span><br>"
                }
            },
            series: [{
                type: 'spline',
                yAxis: 1,
                data: pressureData,
                color:'#333333'

            }, {
                yAxis: 0,
                type: 'spline',
                data: speedData,
                color:'#0066cc'

            }],
            legend: {//图例
                enabled: false
            },
            credits: { //highcharts 水印
                enabled: false
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    marker: {
                        enabled: false
                    }
                }
            }
        });

    }

    function TyphoonSeriesData(data) {
        var pressureData = [];
        var speedData = [];
        for (var i = 0; i < data.length; i++) {
            pressureData.push([DateFromString(data[i].time,'yyyy-mm-dd HH:MM:SS').getTime(),parseFloat(data[i].pressure)]);
            speedData.push([DateFromString(data[i].time,'yyyy-mm-dd HH:MM:SS').getTime(),parseFloat(data[i].speed)]);
        }
        renderChart(pressureData, speedData);
    }

    return {
        Init: function () {
        },

        SeriesData: function (data) {
            return TyphoonSeriesData(data);
        }
    }
})();
Charts.Init();


