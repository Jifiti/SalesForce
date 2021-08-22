'use strict';

function getPaymentProcessor() {
    return {
        ID: {
            toLowerCase: function () {
                return 'processor';
            }
        }
    };
}

function getPaymentMethod() {
    return {
        getPaymentProcessor: getPaymentProcessor,
        paymentProcessor: {
            ID: {
                toLowerCase: function () {
                    return 'processor';
                }
            }
        },
        getApplicablePaymentCards: function () {
            return [];
        }
    };
}

function getApplicablePaymentMethods() {
    return {
        contains: function () {
            return true;
        }
    };
}

module.exports = {
    getPaymentMethod: getPaymentMethod,
    getApplicablePaymentMethods: getApplicablePaymentMethods
};
