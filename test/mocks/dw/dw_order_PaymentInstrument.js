'use strict';

var Money = require('./dw_value_Money');

class PaymentInstrument {
    constructor(paymentMethodId = 'test', amount = new Money(0)) {
        this.paymentTransaction = {
            amount: amount,
            transactionID: '7777007069967974'
        };
        this.custom = {
            gcNumber: '7777007069967974',
            gcPin: '91260152'
        };
        this.paymentMethod = paymentMethodId;
        this.paymentProcessor = paymentMethodId;
        this.UUID = '1234567890';
        this.ID = paymentMethodId;
    }

    static setClassConstants() {
        this.METHOD_BANK_TRANSFER = 'BANK_TRANSFER';
        this.METHOD_BML = 'BML';
        this.METHOD_CREDIT_CARD = 'CREDIT_CARD';
        this.METHOD_DW_ANDROID_PAY = 'DW_ANDROID_PAY';
        this.METHOD_DW_APPLE_PAY = 'DW_APPLE_PAY';
        this.METHOD_GIFT_CERTIFICATE = 'GIFT_CERTIFICATE';
    }

    getPaymentProcessor() {
        return this.paymentProcessor;
    }

    getPaymentMethod() {
        return {
            equalsIgnoreCase: (input) => {
                return (input.toLowerCase() === this.paymentMethod.toLowerCase());
            }
        };
    }

    getCustom() {
        return this.custom;
    }

    getPaymentTransaction() {
        return new Money(10);
    }

    setUUID(uuid) {
        this.UUID = uuid;
    }
}

PaymentInstrument.setClassConstants();

module.exports = PaymentInstrument;
