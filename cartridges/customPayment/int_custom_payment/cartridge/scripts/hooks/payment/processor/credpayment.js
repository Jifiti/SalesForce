/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');


/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethodID
 * @param {Object} req the request object
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation, paymentMethodID, req) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var paymentProcessor;
    var credPayment = PaymentMgr.getPaymentMethod('CRED_PAYMENT');
    if (credPayment) {
        paymentProcessor = credPayment.paymentProcessor;
    }
    Transaction.wrap(function () {
        var allPaymentInstruments = currentBasket.getPaymentInstruments();
        collections.forEach(allPaymentInstruments, function (item) {
            if (item.paymentMethod !== 'GIFT_CERTIFICATE') {
                currentBasket.removePaymentInstrument(item);
            }
        });
    });

    Transaction.wrap(function () {
        var paymentInstrument = currentBasket.createPaymentInstrument(
            paymentMethodID, currentBasket.totalGrossPrice
        );
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    return {
        fieldErrors: cardErrors,
        serverErrors: serverErrors,
        error: false
    };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {string} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var OrderMgr = require('dw/order/OrderMgr');
    var credPaymentCheckout = require('*/cartridge/scripts/credPaymentCheckout.js');
    var credPaymentService = require('*/cartridge/scripts/checkout/svc/credPaymentApi');

    var order = OrderMgr.getOrder(orderNumber);
    var error = false;
    var paymentRequest = credPaymentCheckout.getPaymentRequest(order, paymentInstrument);
    var svc = credPaymentService.credPaymentSendPaymentRequest();
    var params = {};
    params.paymentRequest = paymentRequest;
    params.URL = Site.current.getCustomPreferenceValue('initiateFlowApi');
    var result = svc.call(params);
    var errorMessages = [];
    var credPaymentRedirectUrl;
    if (result.ok) {
        var resultObj = JSON.parse(result.object.text);
        Logger.getLogger('credPayment', 'credPayment').info('cred Payment success response, orderID {0}, response {1}', orderNumber, result.object.text);
        if (resultObj.RedirectURL) {
            credPaymentRedirectUrl = resultObj.RedirectURL;
            Transaction.wrap(function () {
                order.custom.referenceId = resultObj.ReferenceId;
            });
        } else {
            error = false;
        }
    } else {
        Logger.getLogger('credPayment', 'credPayment').error('Cred Payment error response, orderID {0}, error message {1}', orderNumber, result.errorMessage);
        error = true;
        if (result.status === 'ERROR') {
            errorMessages.push(result.errorMessage);
        } else {
            errorMessages.push(Resource.msg('error.payment.invalid', 'checkout', null));
        }
    }

    return {
        errorMessages: errorMessages,
        error: error,
        credPaymentRedirectUrl: credPaymentRedirectUrl,
        callBackURL: paymentRequest.CallbackURL,
        orderNo: paymentRequest.OrderId
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
