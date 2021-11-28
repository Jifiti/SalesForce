/* eslint-disable  consistent-return */
'use strict';

var server = require('server');
server.extend(module.superModule);
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
// The CheckoutServices-SubmitPayment endpoint will submit the payment information and render the checkout place order page allowing the shopper to confirm and place the order
// in the prepend we do a check to remove credpayment payment method to avoid some failed scenarios
server.prepend('SubmitPayment', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('isJifitiEnabled')) {
        var paymentForm = server.forms.getForm('billing');
        var paymentMethodIdValue = paymentForm.paymentMethod.value;
        if (paymentMethodIdValue !== 'CRED_PAYMENT') {
            var currentBasket = BasketMgr.getCurrentBasket();
            Transaction.wrap(function () {
                var allPaymentInstruments = currentBasket.getPaymentInstruments();
                collections.forEach(allPaymentInstruments, function (item) {
                    if (item.paymentMethod === 'CRED_PAYMENT') {
                        currentBasket.removePaymentInstrument(item);
                    }
                });
            });
        }
    }
    return next();
});
// CheckoutServices-PlaceOrder : The CheckoutServices-PlaceOrder endpoint places the order
server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var credPaymentHelper = require('*/cartridge/scripts/checkout/credPaymentHelper');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var Site = require('dw/system/Site');
    var isCredPayment = false;

    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    collections.forEach(currentBasket.getPaymentInstruments(), function (paymentInstrument) {
        if (paymentInstrument.paymentMethod === 'CRED_PAYMENT') {
            isCredPayment = true;
        }
    });

    if (!isCredPayment) {
        return next();
    }

    var viewData = res.getViewData();
    if (viewData && viewData.csrfError) {
        res.json();
        this.emit('route:Complete', req, res);
        return;
    }
    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        this.emit('route:Complete', req, res);
        return;
    }
    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Handles payment authorization
    var handlePaymentResult = credPaymentHelper.handlePayments(order, order.orderNo, order.getOrderToken());
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('isJifitiEnabled') && order.getPaymentInstruments('CRED_PAYMENT').length > 0 && handlePaymentResult.credPaymentRedirectUrl) {
        var windowBehavior = Site.current.getCustomPreferenceValue('jifitiwindowBehavior').value;

        res.json({
            error: false,
            credPaymentUrl: handlePaymentResult.credPaymentRedirectUrl,
            windowBehavior: windowBehavior,
            callBackUrl: handlePaymentResult.callBackURL,
            orderNo: handlePaymentResult.orderNo,
            orderToken: order.getOrderToken()
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }
    if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    this.emit('route:Complete', req, res);
});
module.exports = server.exports();
