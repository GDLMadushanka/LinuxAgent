/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

var deviceProfiles;

function createDeviceProfile() {
    var profilename = document.getElementById("profilename").value;
    var formData = $("#createProfileForm").serialize();
    var requestURL = "/linuxdevice/1.0.0/device/addprofile";
    var contentType = "application/x-www-form-urlencoded";

    invokerUtil.get("/linuxdevice/1.0.0/device/profiles", function (message) {
        deviceProfiles = JSON.parse(message);
        var result = $.grep(deviceProfiles, function(e){ return (e.profileName==profilename) ; });
        if(result.length>0) {
            document.getElementById("warningMessage").style.display = "inline";
        } else {
            document.getElementById("warningMessage").style.display = "none";
            invokerUtil.post(requestURL, formData, function (data) {
                console.log(data);
            }, function (jqXHR) {
                console.log(jqXHR);
            }, contentType);
            window.location.reload();
        }
    });
}
