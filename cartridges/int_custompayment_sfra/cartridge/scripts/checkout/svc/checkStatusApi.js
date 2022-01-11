/* eslint-disable  no-param-reassign */

'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');

/**
* cred payment check status Request
* @returns {dw.svc.Service} - cred payment Service
* */
function sendCheckStatusRequest() {
    var Location = Site.current.getCustomPreferenceValue('JifitiServiceLocation').value;
    var serviceName = 'credPayment.rest';
    if (!empty(Location)) {
        serviceName = Location;
    }
    var token = Site.current.getCustomPreferenceValue('credPaymentToken');
    var service = LocalServiceRegistry.createService(serviceName, {
        createRequest: function (svc, params) {
            svc = svc.setRequestMethod('Get');
            svc.setURL(StringUtils.format('{0}/{1}', svc.URL, params.URL));
            svc.addHeader('Token', token);
            Logger.getLogger('credPayment', 'credPayment').info('credPayment request: ' + JSON.stringify(params));
        },
        parseResponse: function (svc, response) {
            return response;
        },
        /**
         * Description : Method to get Request log messages
         * @param {Object} request The request Object
         * @returns {Object} The request logs
         */
        getRequestLogMessage: function (request) {
            return request;
        },
        /**
         * Description : Method to show Response log messages
         * @param {Object} response The request Object
         * @returns {Object} The response logs
         */
        getResponseLogMessage: function (response) {
            return response.text;
        }
    });

    return service;
}
module.exports = {
    sendCheckStatusRequest: sendCheckStatusRequest
};
