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
var memoryGraph={graph:{}};
var networkGraph={graph:{}};
var cpuGraph={graph:{}};
var diskGraph={graph:{}};
var diskIOGraph={graph:{}};
var battryGraph={graph:{}};


var memoryChartData = [];
memoryChartData[0] = [];
var networkChartData = [];
networkChartData[0] = []; // upload data
networkChartData[1] = []; // download data
var diskIOChartData=[];
diskIOChartData[0] = []; // write bytes
diskIOChartData[1] = []; // read bytes
var cpuChartData = [];
cpuChartData[0] = [];
var diskChartData = [];
diskChartData[0]=[];
var batteryChartData=[];
batteryChartData[0]=[]  // battery level
batteryChartData[1]=[]  // plugged in or not

var palette = new Rickshaw.Color.Palette({scheme: "classic9"});
var initialContextLoaded = false;
var numOfCpu =0;
var numOfDisks = 0;
var bytesSend = 0;
var bytesRecv = 0;
var writeBytes = 0;
var readBytes = 0;

$(window).load(function () {
    var websocketUrl = $("#laptop-details").data("websocketurl");
    connect(websocketUrl);
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
            var dataPoint = JSON.parse(str);
            var payloadData = dataPoint.event.payloadData;
            var metaData = dataPoint.event.metaData;

            if(!initialContextLoaded) {
                bytesRecv = payloadData.bytesrecv;
                bytesSend = payloadData.bytessent;
                writeBytes = payloadData.diskwrites;
                readBytes = payloadData.diskreads;
                processChartContext();
                initialContextLoaded = true;
            } else {
                //momory
                memoryChartData[0].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(payloadData.memoryusage)
                });
                memoryChartData[0].shift();
                memoryGraph.graph.update();

                //network
                var currentBytesRecv = parseFloat(payloadData.bytesrecv);
                var currentBytesSent = parseFloat(payloadData.bytessent);
                networkChartData[0].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(currentBytesRecv-bytesRecv)/8
                });
                networkChartData[1].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(currentBytesSent-bytesSend)/8
                });
                bytesRecv = currentBytesRecv;
                bytesSend = currentBytesSent;
                networkChartData[0].shift();
                networkChartData[1].shift();
                networkGraph.graph.update();

                //Disk IO
                var currentWriteBytes = parseFloat(payloadData.diskwrites);
                var currentReadBytes = parseFloat(payloadData.diskreads);
                diskIOChartData[0].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(currentWriteBytes-writeBytes)/8
                });
                diskIOChartData[1].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(currentReadBytes-readBytes)/8
                });
                readBytes = currentReadBytes;
                writeBytes = currentWriteBytes;
                diskIOChartData[0].shift();
                diskIOChartData[1].shift();
                diskIOGraph.graph.update();

                //battery
                var plugged=0;
                if(payloadData.batterypluggedin) {
                    plugged = 100;
                }
                batteryChartData[0].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(payloadData.batterypercentage)
                });
                batteryChartData[1].push({
                    x: parseInt(metaData.time),
                    y: parseInt(plugged)
                });
                batteryChartData[0].shift();
                batteryChartData[1].shift();
                battryGraph.graph.update();

                //CPU

                cpuChartData[0].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(payloadData.cpuusage)
                });
                cpuChartData[0].shift();
                cpuGraph.graph.update();

                //disks

                diskChartData[0].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(payloadData.diskusage)
                })
                diskChartData[0].shift();
                diskGraph.graph.update();
            }
        };
    }
}

function processChartContext(){
    var memChartName=["Memory Usage (%)"];
    processMultiChart("#div-chart-memory","chart_memory",memoryChartData,memChartName,memoryGraph,"y_axis_memory","legend_memory");
    var networkGraphNames=["Upload (B)","Download (B)"];
    processMultiChart("#div-chart-network","chart_network",networkChartData,networkGraphNames,networkGraph,"y_axis_network","legend_network");
    var diskioGraphNames=["Write (B)","Read (B)"];
    processMultiChart("#div-chart-diskio","chart_diskio",diskIOChartData,diskioGraphNames,diskIOGraph,"y_axis_diskio","legend_diskio");
    var batteryGraphNames=["Percentage","Plugged status"];
    processMultiChart("#div-chart-battery","chart_battery",batteryChartData,batteryGraphNames,battryGraph,"y_axis_battery","legend_battery");
    var cpuGraphName =["CPU Usage (%)"];
    processMultiChart("#div-chart-cpu","chart_cpu",cpuChartData,cpuGraphName,cpuGraph,"y_axis_cpu","legend_cpu");
    var diskGraphName = ["Disk usage (%)"];
    processMultiChart("#div-chart-disk","chart_disk",diskChartData,diskGraphName,diskGraph,"y_axis_disk","legend_disk");
}

function processChart(outerDiv,chartDiv,chartData,name,graph,yAxis,legend) {

    var tNow = new Date().getTime() / 1000;
    for (var i = 0; i < 30; i++) {
        chartData.push({
            x: tNow - (30 - i) * 15,
            y: parseFloat(0)
        });
    }

    graph.graph = new Rickshaw.Graph({
        element: document.getElementById(chartDiv),
        width: $(outerDiv).width() - 50,
        height: 300,
        renderer: "area",
        interpolation: "linear",
        padding: {top: 0.2, left: 0.0, right: 0.0, bottom: 0.2},
        xScale: d3.time.scale(),
        series: [{
            'color': palette.color(),
            'data': chartData,
            'name': name
        }]
    });

    graph.graph.render();

    var xAxis = new Rickshaw.Graph.Axis.Time({
        graph: graph.graph
    });

    xAxis.render();

    new Rickshaw.Graph.Axis.Y({
        graph: graph.graph,
        orientation: 'left',
        height: 300,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        element: document.getElementById(yAxis)
    });

    new Rickshaw.Graph.HoverDetail({
        graph: graph.graph,
        formatter: function (series, x, y) {
            var date = '<span class="date">' + moment(x * 1000).format('Do MMM YYYY h:mm:ss a') + '</span>';
            var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
            return swatch + series.name + ": " + parseInt(y) + '<br>' + date;
        }
    });

    new Rickshaw.Graph.Legend( {
        graph: graph.graph,
        element: document.getElementById(legend)

    } );
}

function processMultiChart(outerDiv,chartDiv,chartData,name,graph,yAxis,legend) {

    var tNow = new Date().getTime() / 1000;
    var numOfGraphs = chartData.length;

    for (var j = 0; j < numOfGraphs; j++) {
        for (var i = 0; i < 30; i++) {
            chartData[j].push({
                x: tNow - (30 - i) * 15,
                y: parseFloat(0)
            });
        }
    }

    series=[];
    for(var i=0;i<numOfGraphs;i++) {
        obj = {
            'color':palette.color(),
            'data':chartData[i],
            'name': name[i]
        }
        series.push(obj);
    }

    graph.graph = new Rickshaw.Graph({
        element: document.getElementById(chartDiv),
        width: $(outerDiv).width() - 50,
        height: 300,
        stack: false,
        padding: {top: 0.2, left: 0.0, right: 0.0, bottom: 0.2},
        renderer: "area",
        interpolation: "linear",
        padding: {top: 0.2, left: 0.0, right: 0.0, bottom: 0.2},
        xScale: d3.time.scale(),
        series: series
    });

    graph.graph.render();

    var xAxis = new Rickshaw.Graph.Axis.Time({
        graph: graph.graph
    });

    xAxis.render();

    new Rickshaw.Graph.Axis.Y({
        graph: graph.graph,
        orientation: 'left',
        height: 300,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        element: document.getElementById(yAxis)
    });

    new Rickshaw.Graph.HoverDetail({
        graph: graph.graph,
        formatter: function (series, x, y) {
            var date = '<span class="date">' + moment(x * 1000).format('Do MMM YYYY h:mm:ss a') + '</span>';
            var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
            return swatch + series.name + ": " + parseInt(y) + '<br>' + date;
        }
    });

    var legendObj = new Rickshaw.Graph.Legend( {
        graph: graph.graph,
        element: document.getElementById(legend)
    } );

    var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
        graph: graph.graph,
        legend: legendObj
    });
}



function disconnect() {
    if (ws != null) {
        ws.close();
        ws = null;
    }
}

