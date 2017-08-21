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

function onRequest(context){
    var log = new Log("stats.js");
    var viewModel = {};
    var devicemgtProps = require("/app/modules/conf-reader/main.js")["conf"];

    var user = userModule.getCarbonUser();
    var tenantId = user.tenantId;
    var defaultProfileNotExists = true;
    var defaultGroupNotExists = true;
    var serviceInvokers = require("/app/modules/oauth/token-protected-service-invokers.js")["invokers"];
    var url = devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/device/profiles";
    var url2 = devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/groups/getAllGroups";

    viewModel["deviceGroups"] = [];
    viewModel["profileTypes"] = [];
    serviceInvokers.XMLHttp.get(
        url, function (responsePayload) {
            var profileTypes = JSON.parse(responsePayload.responseText);
            var tenantProfiles = profileTypes.filter( function(item){return (item.tenantId==tenantId);});
            var defaultProfile = tenantProfiles.filter( function(item){return (item.profileName=="DefaultProfile");});
            if(defaultProfile.length>0) { defaultProfileNotExists=false;}
            viewModel["defaultProfileNotExists"] = defaultProfileNotExists;
            viewModel["profileTypes"] = tenantProfiles;
            viewModel["profileCount"] = tenantProfiles.length;
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );
    serviceInvokers.XMLHttp.get(
        url2, function (responsePayload) {
            var groups=JSON.parse(responsePayload.responseText);
            log.info(groups);
            var defaultGroup = groups.filter( function(item){return (item.name=="DefaultGroup");});
            if(defaultGroup.length>0) { defaultGroupNotExists=false;}
            viewModel["defaultGroupNotExists"] = defaultGroupNotExists;
            viewModel["deviceGroups"] = groups;
            viewModel["groupCount"] = groups.length;
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );
    return viewModel;
}
