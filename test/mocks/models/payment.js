'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var collections = require('../util/collections');

function proxyModel() {
    return proxyquire('../../../cartridges/int_custompayment_sfra/cartridge/models/payment', {
        '*/cartridge/scripts/util/collections': collections,
        'dw/order/PaymentMgr': {
            getApplicablePaymentMethods: function () {
                return [
                    {
                        ID: 'GIFT_CERTIFICATE',
                        name: 'Gift Certificate',
                        description: 'description for Gift Certificate',
                        custom: {
                            longDescription: 'long description for Gift Certificate'
                        }
                    },
                    {
                        ID: 'CREDIT_CARD',
                        name: 'Credit Card',
                        description: 'description for Credit Card',
                        custom: {
                            longDescription: 'long description for Credit Card'
                        }
                    },
                    {
                        ID: 'CRED_PAYMENT',
                        name: 'CRED Payment',
                        description: 'description for Cred payment',
                        custom: {
                            longDescription: 'long description for CRED Payment'
                        }
                    }
                ];
            },
            getPaymentMethod: function () {
                return {
                    getApplicablePaymentCards: function () {
                        return [
                            {
                                cardType: 'Visa',
                                name: 'Visa',
                                UUID: 'some UUID'
                            },
                            {
                                cardType: 'Amex',
                                name: 'American Express',
                                UUID: 'some UUID'
                            },
                            {
                                cardType: 'Discover',
                                name: 'Discover'
                            }
                        ];
                    }
                };
            },
            getApplicablePaymentCards: function () {
                return ['applicable payment cards'];
            }
        },
        'dw/order/PaymentInstrument': {}
    });
}

module.exports = proxyModel();
