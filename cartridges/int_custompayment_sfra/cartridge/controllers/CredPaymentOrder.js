/* eslint-disable  no-loop-func */
/* eslint-disable  no-undef */

'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
/**
 * CredPaymentOrder-Confirm : This endpoint is invoked when the shopper's Order is Placed and Confirmed
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - ID - Order ID
 * @param {querystringparameter} - token - token associated with the order
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.get(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');

        var order;
        if (!req.querystring.ID || !req.querystring.token) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        var orderNo = req.form.orderID ? req.form.orderID : req.querystring.ID;
        var token = req.form.orderToken ? req.form.orderToken : req.querystring.token;
        order = OrderMgr.getOrder(orderNo, token);

        if (!order || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (lastOrderID === req.querystring.ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };

        var currentLocale = Locale.getLocale(req.locale.id);

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID(),
                isPending: req.querystring.isPending
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID(),
                isPending: req.querystring.isPending
            });
        }
        req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
        return next();
    }
);
module.exports = server.exports();
