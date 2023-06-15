/* eslint-disable  no-loop-func */
/* eslint-disable  no-undef */

'use strict';

var server = require('server');
// CredPaymentController-CallBack endpoint called from the third party system (payment provider). Once the process finished
// on their side will give back the control to SFCC using this get point
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
    var Order = require('dw/order/Order');
    var paymentTransaction = require('dw/order/PaymentTransaction');
    var paymentError = true;
    var purchaseApiResult;
    var order = OrderMgr.getOrder(req.querystring.orderID, req.querystring.orderToken);
    var token = req.querystring.token;
    var windowBehavior = Site.current.getCustomPreferenceValue('jifitiwindowBehavior').value;
    if (order && order.custom.orderToken === token) {
        var svc = checkStatusService.sendCheckStatusRequest();
        var refID = order.custom.jifitiReferenceId;
        var params = {};
        var parameters = {};
        parameters.ReferenceId = refID;
        params.URL = urlHelper.appendQueryParams(Site.current.getCustomPreferenceValue('jifiticheckAccountStatusApi'), parameters);
        var result = svc.call(params);
        if (result.ok) {
            var resultObj = JSON.parse(result.object.text);
            var status = resultObj.Status;
            Logger.getLogger('credPaymentController', 'credPaymentController').info('checkAccountStatusAPi response' + result.object.text);
            if (status === 'AccountCreated' && resultObj.OpenToBuy >= order.getTotalGrossPrice().value && resultObj.IssuedCards.length !== 0) {
                var authRequest = {};
                var PIS = order.paymentInstruments;
                for (var p = 0; p < PIS.length; p++) {
                    if (PIS[p].paymentMethod === 'CRED_PAYMENT') {
                        authRequest.RequestedAmount = PIS[p].paymentTransaction.amount.value;
                    }
                }
                authRequest.Currency = order.getCurrencyCode();
                var issueCards = resultObj.IssuedCards;
                authRequest.CardId = issueCards[0].Card.CardId;
                authRequest.MerchantId = Site.current.getCustomPreferenceValue('jifitimerchantId');
                svc = credPaymentService.credPaymentSendPaymentRequest();
                params = {};
                params.URL = Site.current.getCustomPreferenceValue('jifitiPurchaseApi');
                if (Site.current.getCustomPreferenceValue('jifitipaymentTransactionType').value === 'Capture') {
                    authRequest.InstantCommit = true;
                } else {
                    authRequest.InstantCommit = false;
                }
                params.paymentRequest = authRequest;
                purchaseApiResult = svc.call(params);
                var purchaseApiRes = purchaseApiResult.object ? JSON.parse(purchaseApiResult.object.text) : null;
                if (purchaseApiRes && purchaseApiRes.Status === 'Approved') {
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
                                    if (Site.current.getCustomPreferenceValue('jifitipaymentTransactionType').value === 'Capture') {
                                        paymentInstruments[i].paymentTransaction.setType(paymentTransaction.TYPE_CAPTURE);
                                        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                                    } else {
                                        paymentInstruments[i].paymentTransaction.setType(paymentTransaction.TYPE_AUTH);
                                    }
                                    paymentInstruments[i].custom.credPaymentResponse = purchaseApiResult.object.text;
                                }
                            }
                        });
                        paymentError = false;
                        if (order.getCustomerEmail()) {
                            COHelpers.sendConfirmationEmail(order, req.locale.id);
                        }
                        res.redirect(URLUtils.url('CredPaymentOrder-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
                        return next();
                    }
                    paymentError = true;
                }
            }  else if (status === 'ApplicationPending') {
                res.redirect(URLUtils.url('CredPaymentOrder-Confirm', 'ID', order.orderNo, 'token', order.orderToken, 'isPending', true).toString());
                return next();
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
 // Handle closeIframe to return the basket back to the customer and rediecrt the customer to payment page.
server.post('HandleCloseIframe', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var redirectUrl;
    var order = OrderMgr.getOrder(req.form.orderNo, req.form.ordertoken);
    if (order) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
    }
    redirectUrl = URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', 'error', 'closeIframe', 'closeIframe').toString();
    res.json({
        url: redirectUrl
    });
    next();
});

server.post('AccountStatusNotification', function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var collections = require('*/cartridge/scripts/util/collections');
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var Logger = require('dw/system/Logger');
    var checkStatusService = require('*/cartridge/scripts/checkout/svc/checkStatusApi');
    var credPaymentService = require('*/cartridge/scripts/checkout/svc/credPaymentApi');
    var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
    var Order = require('dw/order/Order');
    var paymentTransaction = require('dw/order/PaymentTransaction');
    var paymentError = true;
    var purchaseApiResult;
    var order = OrderMgr.getOrder(req.querystring.orderID, req.querystring.orderToken);
    var token = req.querystring.token;
    var windowBehavior = Site.current.getCustomPreferenceValue('jifitiwindowBehavior').value;
    if (order && order.custom.orderToken === token) {
        var svc = checkStatusService.sendCheckStatusRequest();
        var refID = order.custom.jifitiReferenceId;
        var params = {};
        var parameters = {};
        parameters.ReferenceId = refID;
        params.URL = urlHelper.appendQueryParams(Site.current.getCustomPreferenceValue('jifiticheckAccountStatusApi'), parameters);
        var result = svc.call(params);
        if (result.ok) {
            var resultObj = JSON.parse(result.object.text);
            var status = resultObj.Status;
            Logger.getLogger('credPaymentController', 'credPaymentController').info('checkAccountStatusAPi response' + result.object.text);
            if (status === 'AccountCreated' && resultObj.OpenToBuy >= order.getTotalGrossPrice().value && resultObj.IssuedCards.length !== 0) {
                var authRequest = {};
                var PIS = order.paymentInstruments;
                for (var p = 0; p < PIS.length; p++) {
                    if (PIS[p].paymentMethod === 'CRED_PAYMENT') {
                        authRequest.RequestedAmount = PIS[p].paymentTransaction.amount.value;
                    }
                }
                authRequest.Currency = order.getCurrencyCode();
                var issueCards = resultObj.IssuedCards;
                authRequest.CardId = issueCards[0].Card.CardId;
                authRequest.MerchantId = Site.current.getCustomPreferenceValue('jifitimerchantId');
                svc = credPaymentService.credPaymentSendPaymentRequest();
                params = {};
                params.URL = Site.current.getCustomPreferenceValue('jifitiPurchaseApi');
                if (Site.current.getCustomPreferenceValue('jifitipaymentTransactionType').value === 'Capture') {
                    authRequest.InstantCommit = true;
                } else {
                    authRequest.InstantCommit = false;
                }
                params.paymentRequest = authRequest;
                purchaseApiResult = svc.call(params);
                var purchaseApiRes = purchaseApiResult.object ? JSON.parse(purchaseApiResult.object.text) : null;
                if (purchaseApiRes && purchaseApiRes.Status === 'Approved') {
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
                                    if (Site.current.getCustomPreferenceValue('jifitipaymentTransactionType').value === 'Capture') {
                                        paymentInstruments[i].paymentTransaction.setType(paymentTransaction.TYPE_CAPTURE);
                                        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                                    } else {
                                        paymentInstruments[i].paymentTransaction.setType(paymentTransaction.TYPE_AUTH);
                                    }
                                    paymentInstruments[i].custom.credPaymentResponse = purchaseApiResult.object.text;
                                }
                            }
                        });
                        paymentError = false;
                        if (order.getCustomerEmail()) {
                            COHelpers.sendConfirmationEmail(order, req.locale.id);
                        }
                        res.json({
                            status: "success",
                            orderID: order.orderNo,
                            token: order.orderToken
                        });
                        return next();
                    }
                    paymentError = true;
                }
            } else if (status === 'ApplicationPending') {
                res.json({
                    status: "Pending",
                    orderID: order.orderNo,
                    token: order.orderToken
                });
                return next();
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
        res.json({
            status: "failed",
            orderID: order.orderNo,
            token: order.orderToken
        });
    }
    return next();
});

module.exports = server.exports();
