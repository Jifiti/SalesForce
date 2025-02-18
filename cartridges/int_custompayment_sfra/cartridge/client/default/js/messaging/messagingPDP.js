'use strict';

var certUtils = require('./certUtils');

module.exports = {
    init: function () {
        window.OfferByPrice.initKey($('#bnplAuthToken').attr('value'));

        $('.product-set-detail .product-detail.set-item, .product-bundle-detail, .product-detail.product-wrapper').each(function () {
            var price = parseFloat($(this).find('.sales .value').attr('content'));
            var elem = $(this).find('.mount-jifiti-here');

            certUtils.initCertMessage(elem.attr('id'), price, 'PIP');
        });
    },
    refreshCertMessage: certUtils.refreshCertMessage
};
