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
var palette = new Rickshaw.Color.Palette({scheme: "classic9"});
var sensorTypes = ["batteryinfo","memoryinfo","networkinfo"];
var graphs=[];
var graphConfigs=[];
for (var i=0;i<sensorTypes.length;i++) {
    graphs[i] = {graph:{}};
    graphConfigs[i] = {graphConfig:{}};
}


function drawGraph_linuxdevice(from, to)
{

    var devices = $("#devicetype-details").data("devices");
    var tzOffset = new Date().getTimezoneOffset() * 60;
    var chartWrapperElmId = "#chartDivSensorType1";
    var graphWidth = $(chartWrapperElmId).width() - 50;
    for(var i=0;i<sensorTypes.length;i++) {
        graphConfigs[i].graphConfig = getGraphConfig("chartSensorType"+(i+1).toString());
    }

    function getGraphConfig(placeHolder) {
        return {
            element: document.getElementById(placeHolder),
            width: graphWidth,
            height: 400,
            strokeWidth: 2,
            renderer: 'area',
            interpolation: "linear",
            unstack: true,
            stack: false,
            xScale: d3.time.scale(),
            padding: {top: 0.2, left: 0.02, right: 0.02, bottom: 0.2},
            series: []
        }
    };

    for(var i=0;i<sensorTypes.length;i++) {
        graphConfigs[i].graphConfig['series'].push ({
            'color': palette.color(),
            'data': [{
                x: parseInt(new Date().getTime() / 1000),
                y: 0
            }],
            'name': sensorTypes[i]
        });
    }

    for(var i=0;i<sensorTypes.length;i++) {
        graphs[i].graph = new Rickshaw.Graph(graphConfigs[i].graphConfig);
    }

    for(var i=0;i<sensorTypes.length;i++) {
        drawGraph(graphs[i], "sensorType"+(i+1).toString()+"yAxis", "sensorType"+(i+1).toString()+"Slider", "sensorType"+(i+1).toString()+"Legend", sensorTypes[i]
            , graphConfigs[i], "chartSensorType"+(i+1).toString());
    }


    function drawGraph(graph, yAxis, slider, legend, sensorType, graphConfig, chart) {
        console.log(yAxis);
        console.log(slider);
        console.log(legend);
        console.log(chart);
        graph.graph.render();
        var xAxis = new Rickshaw.Graph.Axis.Time({
            graph: graph.graph
        });
        xAxis.render();
        var yAxis = new Rickshaw.Graph.Axis.Y({
            graph: graph.graph,
            orientation: 'left',
            element: document.getElementById(yAxis),
            width: 40,
            height: 410
        });
        yAxis.render();
        var slider = new Rickshaw.Graph.RangeSlider.Preview({
            graph: graph.graph,
            element: document.getElementById(slider)
        });
        var legend = new Rickshaw.Graph.Legend({
            graph: graph.graph,
            element: document.getElementById(legend)
        });
        var hoverDetail = new Rickshaw.Graph.HoverDetail({
            graph: graph.graph,
            formatter: function (series, x, y) {
                var date = '<span class="date">' +
                    moment.unix(x + tzOffset).format('Do MMM YYYY h:mm:ss a') + '</span>';
                var swatch = '<span class="detail_swatch" style="background-color: ' +
                    series.color + '"></span>';
                return swatch + series.name + ": " + parseInt(y) + '<br>' + date;
            }
        });
        var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
            graph: graph.graph,
            legend: legend
        });
        var order = new Rickshaw.Graph.Behavior.Series.Order({
            graph: graph.graph,
            legend: legend
        });
        var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
            graph: graph.graph,
            legend: legend
        });
        var deviceIndex = 0;
        if (devices) {
            getData(chat, deviceIndex, sensorType);
        } else {
            var backendApiUrl = $("#devicetype-details").data("backend-api-url") + "?from=" + from + "&to=" + to
                + "&sensorType=" + sensorType;
            var successCallback = function (data) {
                if (data) {
                    drawLineGraph(JSON.parse(data), sensorType, deviceIndex, graphConfig.graphConfig, graph.graph);
                }
            };
            invokerUtil.get(backendApiUrl, successCallback, function (message) {
                console.log(message);
            });
        }
    }

    function getData(placeHolder, deviceIndex, sensorType, graphConfig, graph) {
        if (deviceIndex >= devices.length) {
            return;
        }
        var backendApiUrl = $("#" + placeHolder + "").data("backend-api-url") + devices[deviceIndex].deviceIdentifier
            + "?from=" + from + "&to=" + to + "&sensorType=" + sensorType;
        console.log(backendApiUrl);
        var successCallback = function (data) {
            if (data) {
                drawLineGraph(JSON.parse(data), sensorType, deviceIndex, graphConfig, graph);
            }
            deviceIndex++;
            getData(placeHolder, deviceIndex, sensorType);
        };
        invokerUtil.get(backendApiUrl, successCallback, function (message) {
            console.log(message);
            deviceIndex++;
            getData(placeHolder, deviceIndex, sensorType);
        });
    }

    function drawLineGraph(data, sensorType, deviceIndex, graphConfig, graph) {
        if (data.length === 0 || data.length === undefined) {
            return;
        }
        var chartData = [];
        var chartData2=[];

        if(sensorType=="batteryinfo"){
            for (var i = 0; i < data.length; i++) {
                var temp = JSON.parse(data[i].values.batteryinfo);
                chartData.push(
                    {
                        x: parseInt(data[i].values.meta_time/1000) - tzOffset,
                        y: parseInt(temp.percentage)
                    }
                );
            }
            graphConfig.series[deviceIndex].data = chartData;
            graph.update();
        }

        else if(sensorType=="memoryinfo") {
            for (var i = 0; i < data.length; i++) {
                var temp = JSON.parse(data[i].values.memoryinfo);
                chartData.push(
                    {
                        x: parseInt(data[i].values.meta_time/1000) - tzOffset,
                        y: parseInt(temp.percentage)
                    }
                );
            }
            graphConfig.series[deviceIndex].data = chartData;
            graph.update();
        }

        else if(sensorType=="networkinfo") {
            var tempp = JSON.parse(data[0].values.networkinfo);
            var initialvalue = tempp.bytesRecv;
            for (var i = 0; i < data.length; i++) {
                var temp = JSON.parse(data[i].values.networkinfo);
                chartData.push(
                    {
                        x: parseInt(data[i].values.meta_time/1000) - tzOffset,
                        y: parseInt(temp.bytesRecv)-initialvalue
                    }
                );
                initialvalue = temp.bytesRecv;
            }
            graphConfig.series[deviceIndex].data = chartData;
            graph.update();
        }


    }
}
