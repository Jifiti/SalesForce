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

function cancelOrder(orderId) {
    var credCancelService = require('*/cartridge/scripts/checkout/svc/orderApi');
    var svc = credCancelService.sendOrderRequest();
    var url = Site.current.getCustomPreferenceValue('jifitiCancelApi');
    var order = OrderMgr.getOrder(orderId);
    var paymentInstruments = order.paymentInstruments;
    var authId;
    var isPartialCommited = false;
    for (var i = 0; i < paymentInstruments.length; i++) {
        if (paymentInstruments[i].paymentMethod === 'CRED_PAYMENT') {
            authId = order.custom.RemainderAuthId ? order.custom.RemainderAuthId : paymentInstruments[i].paymentTransaction.getTransactionID();
            isPartialCommited = !empty(order.custom.RemainderAuthId);
        }
    }
    url = url.replace('AuthId',authId);
    var body = {};
    body.OrderId = orderId;
    var params = {};
    params.body = body;
    params.URL = url;
    var result = svc.call(params);
    if (result.ok) {
        var response = JSON.parse(result.object.text);
        response.isPartialCommited = isPartialCommited;
        return response;
    } else {
        return result.errorMessage;
    }
}

function callRefund(authId, orderId, requestedAmount, currency) {
    var credRefundService = require('*/cartridge/scripts/checkout/svc/orderApi');
    var svc = credRefundService.sendOrderRequest();
    var url = Site.current.getCustomPreferenceValue('jifitiRefundApi');
    url = url.replace('AuthId', authId);
    var body = {};
    body.OrderId = orderId;
    body.RequestedAmount = requestedAmount;
    body.Currency = currency;
    body.MerchantId = Site.current.getCustomPreferenceValue('jifitimerchantId');
    var params = {};
    params.body = body;
    params.URL = url;
    var result = svc.call(params);
    return result;
}

function refundOrder(orderId, requestedAmount, currency) {
    var Transaction = require('dw/system/Transaction');
    var order = OrderMgr.getOrder(orderId);
    var paymentInstruments = order.paymentInstruments;
    var authId, commitedArr, commitedStr, totalCommited = 0, result, refundedAmount, commitedJSON, updateCommitedStr = '';
    for (var i = 0; i < paymentInstruments.length; i++) {
        if (paymentInstruments[i].paymentMethod === 'CRED_PAYMENT') {
            if (order.custom.CommitedAuthId) {
                commitedStr = order.custom.CommitedAuthId;
                commitedArr = commitedStr.split('||');
                for (var j = 0; j < commitedArr.length; j++) {
                    totalCommited += JSON.parse(commitedArr[j]).CommitedAmount;
                }
                if (totalCommited >= requestedAmount) {
                    for (var j = 0; j < commitedArr.length && requestedAmount > 0 ; j++) {
                        commitedJSON = JSON.parse(commitedArr[j]);
                        refundedAmount = requestedAmount >= commitedJSON.CommitedAmount ? commitedJSON.CommitedAmount : requestedAmount;
                        if (refundedAmount > 0 && commitedJSON.CommitedAmount > 0) {
                            result = callRefund(commitedJSON.CommitedAuthId, orderId, refundedAmount, currency);
                            if (result.ok) {
                                    requestedAmount -= refundedAmount;
                                    commitedJSON.CommitedAmount = commitedJSON.CommitedAmount - refundedAmount;
                                    commitedJSON = JSON.stringify(commitedJSON);
                                    commitedArr[j] = commitedJSON;
                            } else {
                                return result.errorMessage;
                            }
                        }
                    }
                    for (var j = 0; j < commitedArr.length; j++) {
                        updateCommitedStr += commitedArr[j] + '||';
                    }
                    updateCommitedStr = updateCommitedStr.substring(0, updateCommitedStr.lastIndexOf('||'));
                    Transaction.wrap(function () {
                        order.custom.CommitedAuthId = updateCommitedStr;
                        updateCommitedStr = '';
                    });
                    return result;
                } else {
                    var response = {};
                    response.errorMessage = 'Requested amount is bigger than commited amount';
                    response.requestedAmount = requestedAmount;
                    response.CommitedAmount = totalCommited;
                    return response;
                }
            } else {
                authId = paymentInstruments[i].paymentTransaction.getTransactionID();
                result = callRefund(authId, orderId, requestedAmount, currency);
                if (result.ok) {
                    return result;
                } else {
                    return result.errorMessage;
                }
            }
        }
    }
}

function captureOrder(orderId, commitAmount){
    var Transaction = require('dw/system/Transaction');
    var Order = require('dw/order/Order');
    var credCaptureService = require('*/cartridge/scripts/checkout/svc/orderApi');
    var svc = credCaptureService.sendOrderRequest();
    var url = Site.current.getCustomPreferenceValue('jifitiCaptureApi');
    var order = OrderMgr.getOrder(orderId);
    var paymentInstruments = order.paymentInstruments;
    var authId;
    for (var i = 0; i < paymentInstruments.length; i++) {
        if (paymentInstruments[i].paymentMethod === 'CRED_PAYMENT') {
            authId = order.custom.RemainderAuthId ? order.custom.RemainderAuthId : paymentInstruments[i].paymentTransaction.getTransactionID();
        }
    }
    url = url.replace('AuthId',authId);
    var body = {};
    body.OrderId = orderId;
    body.CommitAmount = commitAmount;
    var params = {};
    params.body = body;
    params.URL = url;
    var result = svc.call(params);
    if (result.ok) {
        var response = JSON.parse(result.object.text);
        Transaction.wrap(function () {
            order.custom.CommitedAuthId = order.custom.CommitedAuthId ? order.custom.CommitedAuthId + '||' + '{"CommitedAuthId":"'+ response.CommitedAuthId + '", "CommitedAmount":' + commitAmount + '}' : '{"CommitedAuthId":"'+ response.CommitedAuthId + '", "CommitedAmount":' + commitAmount + '}';
            order.custom.RemainderAuthId = response.RemainderAuthId;
            if(response.RemainderAmount > 0) {
                order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
            } else {
                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            }
        });
        return response;
    } else {
        return result.errorMessage;
    }
}

module.exports = exports = {
    handlePayments: handlePayments,
    cancelOrder: cancelOrder,
    refundOrder: refundOrder,
    captureOrder: captureOrder
};
