
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

 $(document).ready(function () {
     console.log("dedede");
 });



    $("#profileName").change(function() {
        //alert($(this).val());
        var profileId =$(this).val();
        var deviceIdArray=[];

        invokerUtil.get("/api/device-mgt/v1.0/groups/id/2/devices", function (message) {
            var temp = JSON.parse(message);

            for(var i=0;i<temp.devices.length;i++) {
                deviceIdArray.push(temp.devices[i].deviceIdentifier);

            }
            console.log(deviceIdArray);
        });

        invokerUtil.get("/linuxdevice/1.0.0/device/profiles", function (message) {
            var temp = JSON.parse(message);
            console.log(message);
        });

        var tempString= prepareString(deviceIdArray);

        invokerUtil.get("/linuxdevice/1.0.0/device/match-profile?deviceIds="+tempString+"&profileId="+profileId, function (message) {
            var temp = JSON.parse(message);
            console.log(message);
        });



    });

    function prepareString(array) {
        var result=array[0];
        for(var i=1;i<array.length;i++) {
            result= result +","+array[i];
        }
        return result;
    }
