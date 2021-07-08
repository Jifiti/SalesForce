/* eslint-disable  no-loop-func */
/* eslint-disable  no-undef */

'use strict';

var server = require('server');
// eslint-disable-next-line consistent-return
server.get('CallBack', function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var collections = require('*/cartridge/scripts/util/collections');
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    // var Resource = require('dw/web/Resource');
    // var Logger = require('dw/system/Logger');
    var checkStatusService = require('*/cartridge/scripts/checkout/svc/checkStatusApi');
    var success = false;
    var result1;
    var order = OrderMgr.getOrder(request.httpParameterMap.orderID);
    var token = request.httpParameterMap.token.stringValue;
    var windowBehavior = Site.current.getCustomPreferenceValue('windowBehavior').value;
    if (order && order.custom.token === token) {
        var svc = checkStatusService.sendCheckStatusRequest();
        var refID = order.custom.referenceId;
        var params = {};
        params.URL = 'applications/v2/CheckAccountStatus?ReferenceId=' + refID;
        var result = svc.call(params);
        if (result.ok) {
            var resultObj = JSON.parse(result.object.text);
            var status = resultObj.Status;
            if (status === 'AccountCreated' && resultObj.OpenToBuy >= order.getTotalGrossPrice().value) {
                var authRequest = {};
                authRequest.RequestedAmount = order.getTotalGrossPrice().value;
                authRequest.Currency = order.getCurrencyCode();
                var issueCards = resultObj.IssuedCards;
                if (issueCards.length !== 0) {
                    success = true;
                    authRequest.CardId = issueCards[0].Card.CardId;
                }
                authRequest.MerchantId = Site.current.getCustomPreferenceValue('merchantId');
                var credPaymentService = require('*/cartridge/scripts/checkout/svc/credPaymentApi');
                svc = credPaymentService.credPaymentSendPaymentRequest();
                params = {};
                params.paymentRequest = authRequest;
                params.URL = 'purchases/v2/Authorize?InstantCommit=true';
                result1 = svc.call(params);
            } else {
                success = false;
            }
        }
    }
    if (!success) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
            var currentBasket = BasketMgr.getCurrentBasket();
            var allPaymentInstruments = currentBasket.getPaymentInstruments();
            collections.forEach(allPaymentInstruments, function (item) {
                if (item.paymentMethod === 'CRED_PAYMENT') {
                    currentBasket.removePaymentInstrument(item);
                }
            });
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'windowBehavior', windowBehavior, 'payemntError', 'error'));
    } else {
        var res1 = JSON.parse(result1.object.text);
        if (res1.Status === 'Approved') {
            var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
            var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
            // Reset usingMultiShip after successful Order placement
            req.session.privacyCache.set('usingMultiShipping', false);
            if (!placeOrderResult.error) {
                Transaction.wrap(function () {
                    order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
                    var paymentInstruments = order.paymentInstruments;
                    for (var i = 0; i < paymentInstruments.length; i++) {
                        if (paymentInstruments[i].paymentMethod === 'CRED_PAYMENT') {
                            paymentInstruments[i].paymentTransaction.setTransactionID(res1.AuthId);
                            paymentInstruments[i].paymentTransaction.setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
                            paymentInstruments[i].custom.credPaymentResponse = result1.object.text;
                        }
                    }
                });
            }
            res.redirect(URLUtils.url('credPaymentOrder-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
            return next();
        } else {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
                order.custom.token = '';
                order.custom.referenceId = '';
            });
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'payemntError', 'error', 'windowBehavior', windowBehavior)); // paymentError
        }
    }
    next();
});
server.post('HandleClose', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(req.form.orderNo);
    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
    });
    var redirectUrl = URLUtils.https('Checkout-Begin', 'stage', 'payment', 'payemntError', 'error', 'closeIframe', 'closeIframe').toString();
    res.json({
        url: redirectUrl
    });
    next();
    // res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'payemntError', 'error')); // paymentError
    // next();
});


module.exports = server.exports();
