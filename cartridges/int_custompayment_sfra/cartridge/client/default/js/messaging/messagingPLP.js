'use strict';

/**
 * Where jifiti is enabled and if it also enabled in PLP
 * @returns {boolean} is jifiti enabled
 */
function _isJifitiEnabledForPLP() {
    return (
        $('input#isJifitiEnabled').val() === 'true' &&
        $('input#enableCertInPLP').val() === 'true'
    );
}

/**
 *
 * @param {HTMLElement} elem is the element to attach a jifiti component to
 */
function _mountJifiti(elem) {
    try {
        var price = parseFloat($(elem).find('.sales .value').attr('content'));

        if (price) {
            var id = $(elem).find('.mount-jifiti-here').attr('id');

            window.OfferByPrice.init(id, {
                price: price,
                templateName: 'minFinancing',
                flow: 'initiateFlow',
                sourcepage: 'product',
            });
        }
    } catch (e) {
        console.log('mm', e);
    }
}

/**
 *
 * @param {HTMLElement} elem is the element to unattach the jifiti component from
 */
function _unmountJifiti(elem) {
    var id = $(elem).find('.mount-jifiti-here').attr('id');
    if (id) {
        window.OfferByPrice.destroy(id);
    }
}

module.exports.init = function () {
    if (!_isJifitiEnabledForPLP()) {
        return;
    }

    if (!window.OfferByPrice) {
        return;
    }

    window.OfferByPrice.initKey($('#jifitiMerchantId').attr('value'));

    $('.product-grid')
        .find('.product-tile')
        .each(function () {
            _mountJifiti(this);
        });
};

module.exports.mountJifiti = function () {
    if (!_isJifitiEnabledForPLP()) {
        return;
    }

    $('.product-grid')
        .find('.product-tile')
        .each(function () {
            _mountJifiti(this);
        });
};

module.exports.unmountJifiti = function () {
    if (!_isJifitiEnabledForPLP()) {
        return;
    }

    $('.product-grid')
        .find('.product-tile')
        .each(function () {
            _unmountJifiti(this);
        });
};
