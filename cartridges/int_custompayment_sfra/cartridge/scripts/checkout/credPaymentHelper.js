'use strict';

var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var HookMgr = require('dw/system/HookMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 *  @param {string} orderToken - The order token for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber, orderToken) {
    var result = {};

    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            result.error = true;
        }

        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                var authorizationResult;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    if (HookMgr.hasHook('app.payment.processor.' +
                            paymentProcessor.ID.toLowerCase())) {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                            'Authorize',
                            orderNumber,
                            paymentInstrument,
                            paymentProcessor,
                            orderToken
                        );
                    } else {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.default',
                            'Authorize'
                        );
                    }

                    if (authorizationResult.error) {
                        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                        result.error = true;
                        if (authorizationResult.errorMessages) {
                            result.errorMessage = authorizationResult.errorMessages;
                        }
                        break;
                    } else if (authorizationResult.credPaymentRedirectUrl) {
                        result.credPaymentRedirectUrl = authorizationResult.credPaymentRedirectUrl;
                        result.callBackURL = authorizationResult.callBackURL;
                        result.orderNo = authorizationResult.orderNo;
                    }
                }
            }
        }
    }

    return result;
}

function getCorrectURL(url, orderId) {
    var order = OrderMgr.getOrder(orderId);
    var paymentInstruments = order.paymentInstruments;
    var authId;
    for (var i = 0; i < paymentInstruments.length; i++) {
        if (paymentInstruments[i].paymentMethod === 'CRED_PAYMENT') {
            authId = paymentInstruments[i].paymentTransaction.getTransactionID();
        }
    }
    url = url.replace('AuthId',authId);
    return url;
}

function cancelOrder(orderId) {
    var credCancelService = require('*/cartridge/scripts/checkout/svc/cancelOrRefundOrderApi');
    var svc = credCancelService.sendCancelOrRefundRequest();
    var url = Site.current.getCustomPreferenceValue('jifitiCancelApi');
    url = getCorrectURL(url, orderId);
    var body = {};
    body.OrderId = orderId;
    var params = {};
    params.body = body;
    params.URL = url;
    var result = svc.call(params);
    if (result.ok) {
        return JSON.parse(result.object.text);
    } else {
        return result.errorMessage;
    }
}

function refundOrder(orderId, requestedAmount, currency) {
    var credRefundService = require('*/cartridge/scripts/checkout/svc/cancelOrRefundOrderApi');
    var svc = credRefundService.sendCancelOrRefundRequest();
    var url = Site.current.getCustomPreferenceValue('jifitiRefundApi');
    url = getCorrectURL(url, orderId);
    var body = {};
    body.OrderId = orderId;
    body.RequestedAmount = requestedAmount;
    body.Currency = currency;
    body.MerchantId = Site.current.getCustomPreferenceValue('jifitimerchantId');
    var params = {};
    params.body = body;
    params.URL = url;
    var result = svc.call(params);
    if (result.ok) {
        return JSON.parse(result.object.text);
    } else {
        return result.errorMessage;
    }
}

module.exports = exports = {
    handlePayments: handlePayments,
    cancelOrder: cancelOrder,
    refundOrder: refundOrder
};
