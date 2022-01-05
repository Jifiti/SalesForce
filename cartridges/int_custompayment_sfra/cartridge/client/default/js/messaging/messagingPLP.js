'use strict';

var certUtils = require('./certUtils');

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
            certUtils.initCertMessage(id, price);
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
        $("<div class='mount-jifiti-here'></div>").insertAfter($(elem).find('.mount-jifiti-here'));
        window.OfferByPrice.destroy(id);
        $(elem).find('.mount-jifiti-here').attr('id', id);
    }
}


/**
 * Mount Cert messages onece quick view modal is ready
 */
function mountCertInQuickView() {
    $('body').on('quickview:ready', function () {
        $('#quickViewModal').find('.product-detail').each(function () {
            var priceElem = $(this);
            if (!$(this).hasClass('set-item')) {
                priceElem = $(this).closest('.quick-view-dialog').find('.modal-footer');
            }
            var price = parseFloat(priceElem.find('.sales .value').attr('content'));
            var elem = $(this).find('.mount-jifiti-here');

            certUtils.initCertMessage(elem.attr('id'), price);
        });
    });
}

module.exports.init = function () {
    if (!window.OfferByPrice) {
        var intervalId = setInterval(function () {
            if (!window.OfferByPrice) {
                return;
            }
            clearInterval(intervalId);

            if (!isJifitiEnabledForPLP()) {
                return;
            }
            window.OfferByPrice.initKey($('#jifitiMerchantId').attr('value'));
            $('.product-grid')
                .find('.product-tile')
                .each(function () {
                    mountJifiti(this);
                });
        }, 500);
    } else {
        if (!isJifitiEnabledForPLP()) {
            return;
        }

        window.OfferByPrice.initKey($('#jifitiMerchantId').attr('value'));

        $('.product-grid')
            .find('.product-tile')
            .each(function () {
                mountJifiti(this);
            });
    }
    mountCertInQuickView();
    certUtils.refreshCertMessage();
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
