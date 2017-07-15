/**
 * Created by lahiru on 7/6/17.
 */
function onRequest(context){
    var log = new Log("stats.js");
    var viewModel = {};
    var devicemgtProps = require("/app/modules/conf-reader/main.js")["conf"];

    var serviceInvokers = require("/app/modules/oauth/token-protected-service-invokers.js")["invokers"];
    var url = devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/device/profiles";
    var url2 = devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/groups/getAllGroups";

    viewModel["deviceGroups"] = [];
    viewModel["profileTypes"] = [];
    serviceInvokers.XMLHttp.get(
        url, function (responsePayload) {
            //new Log().info(responsePayload.responseText);
            viewModel["profileTypes"] = JSON.parse(responsePayload.responseText);
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );
    serviceInvokers.XMLHttp.get(
        url2, function (responsePayload) {
            //new Log().info(responsePayload.responseText);
            viewModel["deviceGroups"] = JSON.parse(responsePayload.responseText);
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );
    return viewModel;
}