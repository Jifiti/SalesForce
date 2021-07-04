/* eslint-disable no-param-reassign */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');

/**
* cred payment Send Payment Request
* @returns {dw.svc.Service} - cred payment Service
* */
function credPaymentSendPaymentRequest() {
    var token = Site.current.getCustomPreferenceValue('credPaymentToken');
    var service = LocalServiceRegistry.createService('credPayment.rest', {
        createRequest: function (svc, params) {
            svc = svc.setRequestMethod('POST');
            svc.setURL(StringUtils.format('{0}/{1}', svc.URL, params.URL));
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Accept-Language', 'en-US');
            svc.addHeader('Token', token);
            Logger.getLogger('credPayment', 'credPayment').info('credPayment request: ' + JSON.stringify(params));
            return JSON.stringify(params.paymentRequest);
        },
        parseResponse: function (svc, response) {
            return response;
        }
    });

    return service;
}

module.exports = {
    credPaymentSendPaymentRequest: credPaymentSendPaymentRequest
};
