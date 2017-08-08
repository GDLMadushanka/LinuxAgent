
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
var groupId =1;
var profileId ="profileid1";
var currentSummaryTime = "1HR";
var currentSensorName ="memoryusage";
var timeFormat = 'hh:mm';
var persist_cpuusage = []
var persist_diskusage = []
 var persist_memoryusage = []
 var persist_batterypercentage = []
 var persist_batterypluggedin=[]
 var persist_bytessent = 0
 var persist_bytesrecv = 0
 var persist_time = [];
 var ws;
 var avgRamUsage = 0;
 var avgBatteryLevel=0;
 var avgDiskUsage=0;
 var avgCpuUsage=0;

 $(document).ready(function () {
     var websocketUrl = $("#laptop-details").data("websocketurl");
     console.log(websocketUrl);
     connect(websocketUrl);
     reloadData();
 });


 $("#groupName").change(function() {
     groupId =$(this).val();
     console.log("groupId changed "+groupId);
     reloadData();
 });

    $("#profileName").change(function() {
        profileId=$(this).val();
        console.log("profile id changed "+profileId);
        reloadData();
    });

    function reloadData() {
        var multiplier  = 1;
        switch(currentSummaryTime) {
            case "1HR" : { multiplier=1;break;}
            case "2HR" : { multiplier=2;break;}
            case "4HR" : { multiplier=4;break;}
        }
        console.log('sadf');
        var d = new Date();
        var from = d.getTime()/1000;
        var to = from - multiplier*60*60;
        from = Math.floor(from);
        to = Math.floor(to);

        invokerUtil.get("/linuxdevice/1.0.0/device/groupStats?profileId="+profileId+"&groupId="+groupId+"&summaryType="+currentSummaryTime+"&from="+to+"&to="+from, function (message) {
            var temp = JSON.parse(message);
            extractData(temp);
            updateCharts();
        });
    }

    function extractData(jsonpayload) {
        var numOfValues = jsonpayload.length;
        console.log(numOfValues);
        clearExistingData();
        var summaryfactor =1;
        if(numOfValues>60) {summaryfactor=2;}
        for(var i=0;i<numOfValues;i+=summaryfactor) {
            if(jsonpayload[i] != null && (i+summaryfactor-1)<numOfValues) {
                persist_cpuusage.push(((jsonpayload[i].values.cpuusage+jsonpayload[i+summaryfactor-1].values.cpuusage)/2).toFixed(2));
                persist_diskusage.push(((jsonpayload[i].values.diskusage+jsonpayload[i+summaryfactor-1].values.diskusage)/2).toFixed(2));
                persist_memoryusage.push(((jsonpayload[i].values.memoryusage+jsonpayload[i+summaryfactor-1].values.memoryusage)/2).toFixed(2));
                persist_batterypercentage.push(((jsonpayload[i].values.batterypercentage+jsonpayload[i+summaryfactor-1].values.batterypercentage)/2).toFixed(2));
                var tempBatValue=0,tempBatvalue2=0;
                if(jsonpayload[i].values.batterypluggedin==1){tempBatValue=100;}
                if(jsonpayload[i+summaryfactor-1].values.batterypluggedin==1){tempBatvalue2=100;}
                persist_batterypluggedin.push(((tempBatValue+tempBatvalue2)/2).toFixed(2));
                var tempDate = ((jsonpayload[i].values.meta_time +jsonpayload[i+summaryfactor-1].values.meta_time)/2).toFixed(0);
                var date = new Date(parseInt(tempDate));
                persist_time.push(date.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'}));
            }
        }
        for(var i=0;i<numOfValues;i++) {
            if(jsonpayload[i] != null) {
                persist_bytessent += jsonpayload[i].values.bytessent;
                persist_bytesrecv += jsonpayload[i].values.bytesrecv;
                updateUploadDownload();
            }
        }

    }

    function  clearExistingData() {
        persist_cpuusage = []
        persist_diskusage = [];
        persist_memoryusage = []
        persist_batterypercentage = []
        persist_batterypluggedin=[]
        persist_bytessent = 0
        persist_bytesrecv = 0
        persist_time = []

    }

    function updateUploadDownload() {

        if(persist_bytessent>1000) {
            var kblvl = persist_bytessent/1024;
            if(kblvl>1000){
                var mblvl = kblvl/1024;
                if(mblvl>1000) {
                    var gblvl = mblvl/1024;
                    document.getElementById("uploads").innerHTML = gblvl.toFixed(2) +" GB";
                }
                else {document.getElementById("uploads").innerHTML = mblvl.toFixed(2) +" MB";}
            }
            else {document.getElementById("uploads").innerHTML = kblvl.toFixed(2)+" KB";}
        }
        else {document.getElementById("uploads").innerHTML = persist_bytessent.toFixed(2) +" B";}

        if(persist_bytesrecv>1000) {
            var kblvl2 = persist_bytesrecv/1024;
            if(kblvl2>1000){
                var mblvl2 = kblvl2/1024;
                if(mblvl2>1000) {
                    var gblvl2 = mblvl2/1024;
                    document.getElementById("downloads").innerHTML = gblvl2.toFixed(2) +" GB";
                }
                else {document.getElementById("downloads").innerHTML = mblvl2.toFixed(2) +" MB";}
            }
            else {document.getElementById("downloads").innerHTML = kblvl2.toFixed(2) +" KB";}
        }
        else {document.getElementById("downloads").innerHTML = persist_bytesrecv.toFixed(2) +" B";}
    }

    function updateCharts() {

        var data = [];
        var datasetlabel;

        switch(currentSensorName) {
            case "memoryusage": data = persist_memoryusage; datasetlabel ="Memory Usage" ;break;
            case "cpuusage": data = persist_cpuusage; datasetlabel ="CPU Usage" ;break;
            case "diskusage": data = persist_diskusage; datasetlabel ="Disk Usage" ;break;
            case "batterypercentage": data = persist_batterypercentage; datasetlabel ="Battery percentage" ;break;
            case "batterypluggedin": data = persist_batterypluggedin; datasetlabel ="Battery plugged" ;break;
        }

        var lineChartData = {
            labels : persist_time,
            datasets : [
                {
                    label: datasetlabel,
                    fillColor : "rgba(50,50,200,0.5)",
                    strokeColor : "rgba(220,220,220,1)",
                    pointColor : "rgba(220,220,220,1)",
                    pointStrokeColor : "#fff",
                    pointHighlightFill : "#fff",
                    pointHighlightStroke : "rgba(220,220,220,1)",
                    data : data
                }
            ]
        }

        if(window.myLine!=null) {
            window.myLine.destroy();
        }

        mainChart = document.getElementById("line-chart").getContext("2d");
        window.myLine = new Chart(mainChart).Line(lineChartData, {
            responsive: true,
            scaleOverride : true,
            scaleSteps : 10,
            scaleStepWidth : 10,
            scaleStartValue : 0,
            options: {
                scales: {
                    xAxes: [{
                        type: "time",
                        time: {
                            format: timeFormat
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Date'
                        }
                    } ],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'value'
                        }
                    }]
                },
                tooltips: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            }
        });

    }

    function setCurrentSensor(sensor) {
        console.log(sensor);
        currentSensorName = sensor;
        updateCharts();
    }

     function setCurrentTimeSlot(time) {
         console.log("time changed to "+time);
         currentSummaryTime = time;
         reloadData();
     }


 function connect(target) {
     console.log("Here i am");
     if ('WebSocket' in window) {
         ws = new WebSocket(target);
     } else if ('MozWebSocket' in window) {
         ws = new MozWebSocket(target);
     } else {
         console.log('WebSocket is not supported by this browser.');
     }
     if (ws) {
         console.log("socket open");
         ws.onmessage = function (event) {
             var str = event.data;
             var dataPoint = JSON.parse(str);

             if(dataPoint.event.metaData.groupId==groupId && dataPoint.event.metaData.profileId==profileId) {
                 avgBatteryLevel = dataPoint.event.payloadData.batterypercentage;
                 avgCpuUsage = dataPoint.event.payloadData.cpuusage;
                 avgDiskUsage = dataPoint.event.payloadData.diskusage;
                 avgRamUsage =  dataPoint.event.payloadData.memoryusage;

                 updateCircleCharts();
             }
         }
     }
 }

 window.onbeforeunload = function() {
     disconnect();
 };

 function disconnect() {
     if (ws != null) {
         ws.close();
         ws = null;
     }
 }

 function updateCircleCharts() {
     $('#easypiechart-red').data('easyPieChart').update(avgCpuUsage);
     $('span', $('#easypiechart-red')).text(avgCpuUsage.toFixed(0)+"%");
     $('#easypiechart-blue').data('easyPieChart').update(avgRamUsage);
     $('span', $('#easypiechart-blue')).text(avgRamUsage.toFixed(0)+"%");
     $('#easypiechart-orange').data('easyPieChart').update(avgBatteryLevel);
     $('span', $('#easypiechart-orange')).text(avgBatteryLevel.toFixed(0)+"%");
     $('#easypiechart-teal').data('easyPieChart').update(avgDiskUsage);
     $('span', $('#easypiechart-teal')).text(avgDiskUsage.toFixed(0)+"%");

 }

 /*
 var ws = new WebSocket("wss://localhost:9445/outputwebsocket/websocketlocaltest");
 ws.onopen = function() {
     console.log("opened");
 };
 ws.onmessage = function (evt) {
     alert("Message: " + evt.data);
 };
 ws.onclose = function() {
     console.log("closed!");
 };
 ws.onerror = function(err) {
     console.log("Error: " + err);
 };*/