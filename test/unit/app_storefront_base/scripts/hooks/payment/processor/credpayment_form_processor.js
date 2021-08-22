'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var requestLoggedInMock = {
    form: {
        securityCode: 'securityCode',
        storedPaymentUUID: 'storedPaymentUUID'
    }
};

var paymentFormMock = {
    paymentMethod: {
        value: 'some value'
    }
};

describe('basic credit form processor', function () {
    var creditFormProcessor = proxyquire('../../../../../../../cartridges/customPayment/int_custom_payment/cartridge/scripts/hooks/payment/processor/credpayment_form_processor', {
    });
    describe('processForm', function () {
        it('Should process the Cred Payment form for a logged in user', function () {
            var result = creditFormProcessor.processForm(requestLoggedInMock, paymentFormMock, {});
            assert.isFalse(result.error);
        });

        it('Should process the Cred card form for a logged in user', function () {
            var result = creditFormProcessor.processForm(requestLoggedInMock, paymentFormMock, {});
            assert.isFalse(result.error);
        });
    });
});
