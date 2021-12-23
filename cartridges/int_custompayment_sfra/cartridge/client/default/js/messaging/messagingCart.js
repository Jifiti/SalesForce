'use strict';

/**
 *
 * @param {string} id the id of the element to which attach jifiti
 * @param {number} price the price to pass to jifiti
 */
function mountJifiti(id, price) {
    if (!id || !price) {
        return;
    }

    window.OfferByPrice.init(id, {
        price: price,
        templateName: 'minFinancing',
        flow: 'initiateFlow',
        sourcepage: 'checkout'
    });
}

module.exports.init = function () {
    if (!window.OfferByPrice) {
        return;
    }

    window.OfferByPrice.initKey($('#jifitiMerchantId').attr('value'));

    $('.product-info .product-card-footer').each(function () {
        var price = parseFloat($(this).find('.sales .value').attr('content'));
        var elem = $(this).find('.mount-jifiti-here');

        mountJifiti(elem.attr('id'), price);
    });
};
