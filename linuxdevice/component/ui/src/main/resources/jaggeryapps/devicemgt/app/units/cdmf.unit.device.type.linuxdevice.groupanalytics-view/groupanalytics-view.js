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

function onRequest(context) {
    var viewModel = {};
	var devicemgtProps = require("/app/modules/conf-reader/main.js")["conf"];
    var profilesUrl = devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/device/profiles";
    var groupsUrl =devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/groups/getAllGroups";
    var serviceInvokers = require("/app/modules/oauth/token-protected-service-invokers.js")["invokers"];
    var log = new Log("stats.js");

	var deviceType = context.uriParams.deviceType;
	var deviceId = request.getParameter("deviceId");
	var groupId = request.getParameter("groupId");
    var deviceName = request.getParameter("deviceName");

    var user = userModule.getCarbonUser();
    var tenantId = user.tenantId;

    viewModel["profileTypes"] = [];
    viewModel["groupNames"]=[]
    serviceInvokers.XMLHttp.get(
        profilesUrl, function (responsePayload) {
            //new Log().info(responsePayload.responseText);
            var profileTypes = JSON.parse(responsePayload.responseText);
            var tenantProfiles = profileTypes.filter( function(item){return (item.tenantId==tenantId);} );
            viewModel["profileTypes"] = tenantProfiles;
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );
    serviceInvokers.XMLHttp.get(
        groupsUrl, function (responsePayload) {
            //new Log().info(responsePayload.responseText);
            viewModel["groupNames"] = JSON.parse(responsePayload.responseText);
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );

    var carbonServer = require("carbon").server;
    var devicemgtProps = require("/app/modules/conf-reader/main.js")["conf"];
    var constants = require("/app/modules/constants.js");
    var websocketEndpoint = devicemgtProps["wssURL"].replace("https", "wss");
    // This need to be changed properly (with authentication)
    if(user.domain=="carbon.super") {
        viewModel["socketEndpoint"]= websocketEndpoint+"/outputwebsocket/laptop1hrsummary_publisher";
    } else {
        viewModel["socketEndpoint"]= websocketEndpoint+"/outputwebsocket/"+"t/"+user.domain+"/laptop1hrsummary_publisher";
    }

    log.info(viewModel);
    return viewModel;


}
