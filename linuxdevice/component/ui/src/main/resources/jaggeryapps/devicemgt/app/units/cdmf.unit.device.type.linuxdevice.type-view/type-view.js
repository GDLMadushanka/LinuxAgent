/**
 * Created by lahiru on 7/6/17.
 */
function onRequest(context){
    var viewModel = {};
    var devicemgtProps = require("/app/modules/conf-reader/main.js")["conf"];
    var serviceInvokers = require("/app/modules/oauth/token-protected-service-invokers.js")["invokers"];
    var url = devicemgtProps["httpsURL"] + "/linuxdevice/1.0.0/device/profiles";
    serviceInvokers.XMLHttp.get(
        url, function (responsePayload) {
            new Log().info(responsePayload);
        },
        function (responsePayload) {
            new Log().error(responsePayload);
        }
    );
    return viewModel;
}