'use strict';

function execute() {
    var Site = require('dw/system/Site');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var checkStatusService = require('*/cartridge/scripts/checkout/svc/checkStatusApi');
    var svc = checkStatusService.sendCheckStatusRequest();
    var params = {};
    params.URL = Site.current.getCustomPreferenceValue('jifitigetLenderDetailsApi');
    var result = svc.call(params);
    if (result.ok) {
        var resultObj = JSON.parse(result.object.text);
        var title = resultObj.Title;
        var logo = resultObj.Logo;
        var description = resultObj.Description;
        var jsWidgetURL = resultObj.JSWidgetUrl;
        var lenderDetails = CustomObjectMgr.getCustomObject('lenderDetails', 'lenderDetails');
        Transaction.wrap(function () {
            if (!lenderDetails) {
                lenderDetails = CustomObjectMgr.createCustomObject('lenderDetails', 'lenderDetails');
            }
            lenderDetails.custom.title = title;
            lenderDetails.custom.logo = logo;
            lenderDetails.custom.description = description;
            lenderDetails.custom.JSWidgetUrl = jsWidgetURL;
        });
    }
}

module.exports = {
    execute: execute
};