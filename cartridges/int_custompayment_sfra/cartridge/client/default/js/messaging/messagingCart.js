'use strict';

var initCertMessage = require('./certUtils').initCertMessage;

module.exports = {
    init: function () {
        if (!window.OfferByPrice) {
            return;
        }

        window.OfferByPrice.initKey($('#jifitiMerchantId').attr('value'));

        $('.mount-jifiti-here').each(function () {
            var price = $(this).data('totalprice');

            initCertMessage($(this).attr('id'), price, 'checkout');
        });
    },
    updateCartTotals: function () {
        $('body').on('cart:update cart:shippingMethodSelected promotion:success promotion:error', function (e, data) {
            var cart = data ? data.cartModel || data.basket || data : null;
            if (cart && cart.totals && 'grandTotalValue' in cart.totals) {
                $('.totals .mount-jifiti-here').data('totalprice', cart.totals.grandTotalValue);
                module.exports.init();
            }
        });
    }
};
