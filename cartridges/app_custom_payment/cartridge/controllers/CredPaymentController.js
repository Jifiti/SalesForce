/* eslint-disable  no-loop-func */
'use strict';

var server = require('server');

server.get('CallBack', function (req, res, next) {
    var collections = require('*/cartridge/scripts/util/collections');
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var Logger = require('dw/system/Logger');
    var checkStatusService = require('*/cartridge/scripts/checkout/svc/checkStatusApi');
    var success = false;
    var order = OrderMgr.getOrder(request.httpParameterMap.orderID);
    var token = request.httpParameterMap.token.stringValue;
    if (order && order.custom.token === token) {
        var svc = checkStatusService.sendCheckStatusRequest();
        var refID = order.custom.referenceId;
        var params = {};
        params.URL = 'applications/v2/CheckAccountStatus?ReferenceId=' + refID;
        var result = svc.call(params);
        if (result.ok) {
            var resultObj = JSON.parse(result.object.text);
            var status = resultObj.Status;
            if (status === 'AccountCreated') {
                var authRequest = {};
                authRequest.RequestedAmount = order.getTotalGrossPrice().value;
                authRequest.Currency = order.getCurrencyCode();
                var issueCards = resultObj.IssuedCards;
                if (issueCards.length !== 0) {
                    success = true;
                }
                // authRequest.CardId = 
                authRequest.MerchantId = Site.current.getCustomPreferenceValue('merchantId');
                var credPaymentService = require('*/cartridge/scripts/checkout/svc/credPaymentApi');
                svc = credPaymentService.credPaymentSendPaymentRequest();
                params = {};
                params.paymentRequest = authRequest;
                params.URL = 'purchases/v2/Authorize?InstantCommit=true';
                // result = svc.call(params);
            } else {
                var a = 1;
            }
        }
    }
    if (!success) {
        Transaction.wrap(function () {
            var allPaymentInstruments = order.getPaymentInstruments('CRED_PAYMENT');
            OrderMgr.failOrder(order, true);
            collections.forEach(allPaymentInstruments, function (item) {
                order.removePaymentInstrument(item);
            });
            order.custom.token = '';
            order.custom.referenceId = '';
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'fromCredPaymentController', true));
    }
    next();
});

module.exports = server.exports();
