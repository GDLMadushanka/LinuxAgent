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
var diskChartData = [];
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
                bytesRecv = payloadData.networkinfo.bytesRecv;
                bytesSend = payloadData.networkinfo.bytesSent;
                writeBytes = payloadData.diskioinfo.writeBytes;
                readBytes = payloadData.diskioinfo.readBytes;

                //creating array for each core
                for(var i=0;i<numOfCpu;i++) {
                    cpuChartData[i] = [];
                }
                //creating array for each disk
                for(var i=0;i<numOfDisks;i++) {
                    diskChartData[i] = [];
                }
                processChartContext();
                initialContextLoaded = true;

            } else {
                //momory
                memoryChartData[0].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(payloadData.memoryinfo.percentage)
                });
                memoryChartData[0].shift();
                memoryGraph.graph.update();

                //network
                var currentBytesRecv = parseFloat(payloadData.networkinfo.bytesRecv);
                var currentBytesSent = parseFloat(payloadData.networkinfo.bytesSent);
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
                var currentWriteBytes = parseFloat(payloadData.diskioinfo.writeBytes);
                var currentReadBytes = parseFloat(payloadData.diskioinfo.readBytes);
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
                if(payloadData.batteryinfo.isPlugged) {
                    plugged = 100;
                }
                batteryChartData[0].push({
                    x: parseInt(metaData.time),
                    y: parseFloat(payloadData.batteryinfo.percentage)
                });
                batteryChartData[1].push({
                    x: parseInt(metaData.time),
                    y: parseInt(plugged)
                });
                batteryChartData[0].shift();
                batteryChartData[1].shift();
                battryGraph.graph.update();

                //CPU
                for(var i=0;i<numOfCpu;i++) {
                    cpuChartData[i].push({
                        x: parseInt(metaData.time),
                        y: parseFloat(payloadData.cpuinfo.cpuPercentages[i])
                    });
                    cpuChartData[i].shift();
                }
                cpuGraph.graph.update();

                //disks
                for(var i=0;i<numOfDisks;i++) {
                    diskChartData[i].push({
                        x: parseInt(metaData.time),
                        y: parseFloat(payloadData.diskinfo.details[i].percentage)
                    });
                    diskChartData[i].shift();
                }
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
    var cpuGraphNames=[];
    for(var i=0;i<numOfCpu;i++) {
        cpuGraphNames[i] = "Core "+i.toString();
    }
    processMultiChart("#div-chart-cpu","chart_cpu",cpuChartData,cpuGraphNames,cpuGraph,"y_axis_cpu","legend_cpu");
    var diskGraphNames=[];
    for(var i=0;i<numOfDisks;i++) {
        diskGraphNames[i] = "Disk "+i.toString() +" usage (%)";
    }
    processMultiChart("#div-chart-disk","chart_disk",diskChartData,diskGraphNames,diskGraph,"y_axis_disk","legend_disk");
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

