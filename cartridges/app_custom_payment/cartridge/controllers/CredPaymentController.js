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
    var Logger = require('dw/system/Logger');
    var checkStatusService = require('*/cartridge/scripts/checkout/svc/checkStatusApi');
    var credPaymentService = require('*/cartridge/scripts/checkout/svc/credPaymentApi');
    var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');

    var paymentError = true;
    var purchaseApiResult;
    var order = OrderMgr.getOrder(req.querystring.orderID);
    var token = req.querystring.token;
    var windowBehavior = Site.current.getCustomPreferenceValue('windowBehavior').value;
    if (order && order.custom.orderToken === token) {
        var svc = checkStatusService.sendCheckStatusRequest();
        var refID = order.custom.referenceId;
        var params = {};
        var parameters = {};
        parameters.ReferenceId = refID;
        params.URL = urlHelper.appendQueryParams(Site.current.getCustomPreferenceValue('checkAccountStatusApi'), parameters);
        var result = svc.call(params);
        if (result.ok) {
            var resultObj = JSON.parse(result.object.text);
            var status = resultObj.Status;
            Logger.getLogger('credPaymentController', 'credPaymentController').info('checkAccountStatusAPi response' + result.object.text);
            if (status === 'AccountCreated' && resultObj.OpenToBuy >= order.getTotalGrossPrice().value &&  resultObj.IssuedCards.length !== 0) {
                var authRequest = {};
                authRequest.RequestedAmount = order.getTotalGrossPrice().value;
                authRequest.Currency = order.getCurrencyCode();
                var issueCards = resultObj.IssuedCards;
                authRequest.CardId = issueCards[0].Card.CardId;
                authRequest.MerchantId = Site.current.getCustomPreferenceValue('merchantId');
                svc = credPaymentService.credPaymentSendPaymentRequest();
                params = {};
                params.URL = Site.current.getCustomPreferenceValue('PurchaseApi');
                if (Site.current.getCustomPreferenceValue('paymentTransactionType').value === 'Capture') {
                    authRequest.InstantCommit = true;
                } else {
                    authRequest.InstantCommit = false;
                }
                params.paymentRequest = authRequest;
                purchaseApiResult = svc.call(params);
                var purchaseApiRes = JSON.parse(purchaseApiResult.object.text);
                Logger.getLogger('credPaymentController', 'credPaymentController').info('Authorize ApI response' + result.object.text);
                if (purchaseApiRes.Status === 'Approved') {
                    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
                    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
                    // Reset usingMultiShip after successful Order placement
                    req.session.privacyCache.set('usingMultiShipping', false);
                    if (!placeOrderResult.error) {
                        Transaction.wrap(function () {
                            var paymentInstruments = order.paymentInstruments;
                            for (var i = 0; i < paymentInstruments.length; i++) {
                                if (paymentInstruments[i].paymentMethod === 'CRED_PAYMENT') {
                                    paymentInstruments[i].paymentTransaction.setTransactionID(purchaseApiRes.AuthId);
                                    if (Site.current.getCustomPreferenceValue('paymentTransactionType').value === 'Capture') {
                                        paymentInstruments[i].paymentTransaction.setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
                                        order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
                                    } else {
                                        paymentInstruments[i].paymentTransaction.setType(dw.order.PaymentTransaction.TYPE_AUTH);
                                    }
                                    paymentInstruments[i].custom.credPaymentResponse = purchaseApiResult.object.text;
                                }
                            }
                        });
                    }
                    res.redirect(URLUtils.url('credPaymentOrder-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
                    return next();
                }
            } else {
                paymentError = true;
            }
        }
    }
    if (paymentError) {
        Logger.getLogger('credPaymentController', 'credPaymentController').info('error occured during call Authorize Api');
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
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'windowBehavior', windowBehavior, 'paymentError', 'error'));
    }
    next();
});

server.post('HandleCloseIframe', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(req.form.orderNo);
    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
    });
    var redirectUrl = URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', 'error', 'closeIframe', 'closeIframe').toString();
    res.json({
        url: redirectUrl
    });
    next();
});


module.exports = server.exports();
