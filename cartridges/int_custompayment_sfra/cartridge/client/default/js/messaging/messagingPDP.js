'use strict';

/**
 * attaches jifit to the id passed
 * @param {string} id the id to attach jifiti on
 * @param {number} price price
 */
function mountJifiti(id, price) {
    if (!id || !price) {
        return;
    }

    window.OfferByPrice.init(id, {
        price: price,
        templateName: 'minFinancing',
        flow: 'initiateFlow',
        sourcepage: 'product'
    });
}

module.exports.init = function () {
    try {
        window.OfferByPrice.initKey($('#jifitiMerchantId').attr('value'));

        $('.product-set-detail .product-detail.set-item, .product-bundle-detail, .product-detail.product-wrapper').each(function () {
            var price = parseFloat($(this).find('.sales .value').attr('content'));
            var elem = $(this).find('.mount-jifiti-here');

            mountJifiti(elem.attr('id'), price);
        });
    } catch (e) {
        // console.log("error", e)
    }
};
