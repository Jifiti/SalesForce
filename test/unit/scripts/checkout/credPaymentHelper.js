'use strict';

/* eslint-disable */

const assert = require('chai').assert;
var Order = require('../../../mocks/dw/dw_order_Order');
var Money = require('../../../mocks/dw/dw_value_Money');

global.empty = (data) => {
    return !data;
};

describe('cutomPayment/int_custom_payment/cartridge/scripts/checkout/credPaymentHelpers test', () => {
    let checkoutHelpers = require('../../../mocks/scripts/checkout/credPaymentHelpers');

    it('Testing method: handlePayments', () => {
    	var order = new Order();
    	order.createProductLineItem({
            custom: {
                sku: '1330767-408-8'
            },
            ID: '883814258849',
            name: 'test',
            optionModel: {
                options: []
            }
        }, order.getDefaultShipment());
    	order.createPaymentInstrument('CreditPayment', new Money(10));
        let result = checkoutHelpers.handlePayments(order, '1234567890');
        assert.equal(result.error !== true , true);
    });
});
