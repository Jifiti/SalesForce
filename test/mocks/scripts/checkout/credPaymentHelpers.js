'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Spy = require('../../../helpers/unit/Spy');
let spy = new Spy();

function proxyModel() {
    var checkoutHelpers = proxyquire('../../../../cartridges/customPayment/int_custom_payment/cartridge/scripts/checkout/credPaymentHelper', {
        'dw/util/ArrayList': require('../../dw/dw_util_ArrayList'),
        'dw/value/Money': require('../../dw/dw_value_Money'),
        'dw/order/OrderMgr': require('../../dw/dw_order_OrderMgr'),
        'dw/order/Order': require('../../dw/dw_order_Order'),
        'dw/system/Status': require('../../dw/dw_system_Status'),
        'dw/system/Transaction': require('../../dw/dw_system_Transaction'),
        'dw/system/Logger': require('../../dw/dw_system_Logger'),
        'dw/web/Resource': require('../../dw/dw_web_Resource'),
        'dw/system/Site': require('../../dw/dw_system_Site'),
        'dw/order/BasketMgr': require('../../dw/dw_order_BasketMgr'),
        'dw/order/PaymentMgr': require('../../dw/dw_order_PaymentMgr'),
        'dw/system/HookMgr': require('../../dw/dw_system_HookMgr'),
        'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
        '*/cartridge/scripts/checkout/shippingHelpers': {
            selectShippingMethod: function () {}
        },
        'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
        'dw/catalog/ProductMgr': require('../../dw/dw_catalog_ProductMgr'),
        'dw/order/PaymentInstrument': require('../../dw/dw_order_PaymentInstrument')
    });
    checkoutHelpers.getSpy = function () {
        return spy;
    };

    return checkoutHelpers;
}

module.exports = proxyModel();
