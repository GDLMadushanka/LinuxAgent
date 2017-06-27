/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var ws;
var memoryGraph;
var memoryChartData = [];
var palette = new Rickshaw.Color.Palette({scheme: "classic9"});
var initialContextLoaded = false;
var numOfCpu =0
var numOfDisks = 0

$(window).load(function () {
    var tNow = new Date().getTime() / 1000;
    for (var i = 0; i < 30; i++) {
        memoryChartData.push({
                           x: tNow - (30 - i) * 15,
                           y: parseFloat(0)
                       });
    }

    var websocketUrl = $("#laptop-details").data("websocketurl");
    connect(websocketUrl)
});

// close websocket when page is about to be unloaded
// fixes broken pipe issue
window.onbeforeunload = function() {
    disconnect();
};

//websocket connection
function connect(target) {
    if ('WebSocket' in window) {
        ws = new WebSocket(target);
    } else if ('MozWebSocket' in window) {
        ws = new MozWebSocket(target);
    } else {
        console.log('WebSocket is not supported by this browser.');
    }
    if (ws) {
        ws.onmessage = function (event) {
            var str = event.data;
            var indices = [];
            var indices2 = [];
            for(var i=0; i<str.length;i++) {
                if (str[i] === "{") indices.push(i);
                if (str[i] === "}") indices2.push(i);
            }

            for (var i=0;i<indices.length;i++)
            {
                var k = indices[i];
                if(k>1 && str.charAt(k-1)=='"')
                {
                    str = str.substr(0, k-1) +" "+ str.substr(k);
                }
            }

            for (var i=0;i<indices2.length;i++)
            {
                var k = indices2[i];

                if(k>1 && str.charAt(k+1)=='"')
                {
                    str = str.substr(0, k+1) +" "+ str.substr(k+2);
                }
            }

            var dataPoint = JSON.parse(str);
            var payloadData = dataPoint.event.payloadData;
            var metaData = dataPoint.event.metaData;

            if(!initialContextLoaded) {
                numOfCpu = payloadData.cpuinfo.numOfCpu;
                numOfDisks = payloadData.diskinfo.numOfDisks;
                initialContextLoaded = true;
                processChartContext();
            } else {
                memoryChartData.push({
                    x: parseInt(metaData.time),
                    y: parseFloat(payloadData.memoryinfo.percentage)
                });
                memoryChartData.shift();
                memoryGraph.update();
            }
        };
    }
}

function processChartContext(){
    processMemeoryChart();
}

function processMemeoryChart() {

    memoryGraph = new Rickshaw.Graph({
        element: document.getElementById("chart_memory"),
        width: $("#div-chart-memory").width() - 50,
        height: 300,
        renderer: "line",
        interpolation: "linear",
        padding: {top: 0.2, left: 0.0, right: 0.0, bottom: 0.2},
        xScale: d3.time.scale(),
        series: [{
            'color': palette.color(),
            'data': memoryChartData,
            'name': "Memory Usage"
        }]
    });

    memoryGraph.render();

    var xAxis = new Rickshaw.Graph.Axis.Time({
        graph: memoryGraph
    });

    xAxis.render();

    new Rickshaw.Graph.Axis.Y({
        graph: memoryGraph,
        orientation: 'left',
        height: 300,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        element: document.getElementById('y_axis_memory')
    });

    new Rickshaw.Graph.HoverDetail({
        graph: memoryGraph,
        formatter: function (series, x, y) {
            var date = '<span class="date">' + moment(x * 1000).format('Do MMM YYYY h:mm:ss a') + '</span>';
            var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
            return swatch + series.name + ": " + parseInt(y) + '<br>' + date;
        }
    });
}

function disconnect() {
    if (ws != null) {
        ws.close();
        ws = null;
    }
}

