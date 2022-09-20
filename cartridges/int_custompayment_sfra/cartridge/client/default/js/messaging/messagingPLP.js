'use strict';

var certUtils = require('./certUtils');

/**
 * Where jifiti is enabled and if it also enabled in PLP
 * @returns {boolean} is jifiti enabled
 */
function isEnabledForPLP() {
    return (
        $('input#bnplIsEnabled').val() === 'true' &&
        $('input#bnplEnableInPLP').val() === 'true'
    );
}

/**
 *
 * @param {HTMLElement} elem is the element to attach a jifiti component to
 */
function mountJifiti(elem) {
    var price = certUtils.getPrice($(elem).find('.tile-body').data('price'));

    if (price) {
        var id = $(elem).find('.mount-jifiti-here').attr('id');
        certUtils.initCertMessage(id, price, 'PIP');
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
 * Mount Cert messages once quick view modal is ready
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

            certUtils.initCertMessage(elem.attr('id'), price, 'PIP');
        });
    });
}

module.exports.init = function () {
    if (!window.OfferByPrice) {
        var intervalId = setInterval(function () {
            if (!isEnabledForPLP()) {
                clearInterval(intervalId);
                return;
            }
            if (!window.OfferByPrice) {
                return;
            }
            clearInterval(intervalId);

            window.OfferByPrice.initKey($('#bnplAuthToken').attr('value'));
            $('.product-grid')
                .find('.product-tile')
                .each(function () {
                    mountJifiti(this);
                });
        }, 500);
    } else {
        if (!isEnabledForPLP()) {
            return;
        }

        window.OfferByPrice.initKey($('#bnplAuthToken').attr('value'));

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
    if (!isEnabledForPLP()) {
        return;
    }

    $('.product-grid')
        .find('.product-tile')
        .each(function () {
            mountJifiti(this);
        });
};

module.exports.unmountJifiti = function () {
    if (!isEnabledForPLP()) {
        return;
    }

    $('.product-grid')
        .find('.product-tile')
        .each(function () {
            unmountJifiti(this);
        });
};
