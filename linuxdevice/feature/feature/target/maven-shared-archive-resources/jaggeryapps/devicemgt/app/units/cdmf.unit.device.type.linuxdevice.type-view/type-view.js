/**
 * Created by lahiru on 7/6/17.
 */
function onRequest(context){
    var log = new Log("stats.js");
    var viewModel = {};
    var devicemgtProps = require("/app/modules/conf-reader/main.js")["conf"];

    var user = userModule.getCarbonUser();
    var tenantId = user.tenantId;

    var serviceInvokers = require("/app/modules/oauth/token-protected-service-invokers.js")["invokers"];
    var url = devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/device/profiles";
    var url2 = devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/groups/getAllGroups";

    viewModel["deviceGroups"] = [];
    viewModel["profileTypes"] = [];
    serviceInvokers.XMLHttp.get(
        url, function (responsePayload) {
            var profileTypes = JSON.parse(responsePayload.responseText);
            var tenantProfiles = profileTypes.filter( function(item){return (item.tenantId==tenantId);} );
            viewModel["profileTypes"] = tenantProfiles;
            //log.info(tenantProfiles);
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );
    serviceInvokers.XMLHttp.get(
        url2, function (responsePayload) {
            //new Log().info(responsePayload.responseText);
            viewModel["deviceGroups"] = JSON.parse(responsePayload.responseText);
            //log.info(viewModel["deviceGroups"]);
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );
    return viewModel;
}