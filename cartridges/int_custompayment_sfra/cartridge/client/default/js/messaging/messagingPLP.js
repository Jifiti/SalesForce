'use strict';

/**
 * Where jifiti is enabled and if it also enabled in PLP
 * @returns {boolean} is jifiti enabled
 */
function isJifitiEnabledForPLP() {
    return (
        $('input#isJifitiEnabled').val() === 'true' &&
        $('input#enableCertInPLP').val() === 'true'
    );
}

/**
 *
 * @param {HTMLElement} elem is the element to attach a jifiti component to
 */
function mountJifiti(elem) {
    try {
        var price = parseFloat($(elem).find('.sales .value').attr('content'));

        if (price) {
            var id = $(elem).find('.mount-jifiti-here').attr('id');

            window.OfferByPrice.init(id, {
                price: price,
                templateName: 'minFinancing',
                flow: 'initiateFlow',
                sourcepage: 'product'
            });
        }
    } catch (e) {
        console.log('mm', e); // eslint-disable-line no-console
    }
}

/**
 *
 * @param {HTMLElement} elem is the element to unattach the jifiti component from
 */
function unmountJifiti(elem) {
    var id = $(elem).find('.mount-jifiti-here').attr('id');
    if (id) {
        window.OfferByPrice.destroy(id);
    }
}

module.exports.init = function () {
    if (!isJifitiEnabledForPLP()) {
        return;
    }

    if (!window.OfferByPrice) {
        return;
    }

    window.OfferByPrice.initKey($('#jifitiMerchantId').attr('value'));

    $('.product-grid')
        .find('.product-tile')
        .each(function () {
            mountJifiti(this);
        });
};

module.exports.mountJifiti = function () {
    if (!isJifitiEnabledForPLP()) {
        return;
    }

    $('.product-grid')
        .find('.product-tile')
        .each(function () {
            mountJifiti(this);
        });
};

module.exports.unmountJifiti = function () {
    if (!isJifitiEnabledForPLP()) {
        return;
    }

    $('.product-grid')
        .find('.product-tile')
        .each(function () {
            unmountJifiti(this);
        });
};
