'use strict';

module.exports = {
    initCertMessage: function (id, price, sourcepage) {
        if (!id || !price) {
            return;
        }

        var config = {
            price: price,
            link_href: 'https://bjs.citizensone.com/?continueShopping=true',
            sourcepage: sourcepage || 'product'
        };

        if ($('#certMessagingText').attr('value')) {
            config.text = $('#certMessagingText').attr('value');
        } else if ($('#certMessagingLogoURL').attr('value')) {
            config.templateName = 'minFinancingWithLogo';
            config.logo = $('#certMessagingLogoURL').attr('value');
        } else {
            config.templateName = 'minFinancing';
        }

        window.OfferByPrice.init(id, config);

        if ($('#certMessagingTextStyle').attr('value') !== '{}') {
            window.OfferByPrice.setTextStyle(id, JSON.parse($('#certMessagingTextStyle').attr('value')));
        }

        if ($('#certMessagingLinkStyle').attr('value') !== '{}') {
            window.OfferByPrice.setLinkStyle(id, JSON.parse($('#certMessagingLinkStyle').attr('value')));
        }

        if ($('#certMessagingLinkText').attr('value')) {
            window.OfferByPrice.setLinkText(id, $('#certMessagingLinkText').attr('value'));
        }

        if ($('#certMessagingLinkBehaviour').attr('value')) {
            window.OfferByPrice.setLinkBehavior(id, Number($('#certMessagingLinkBehaviour').attr('value')));
        }

        $('#' + id + ' .offer-text p').css('color', '');
    },
    refreshCertMessage: function () {
        $('body').on('product:afterAttributeSelect', function (e, data) {
            if (data && data.container && data.data && data.data.product) {
                var product = data.data.product;
                var $productContainer = data.container;

                var price = product.selectedQuantity * module.exports.getPrice(product.price);
                var elem = $productContainer.find('.mount-jifiti-here');

                module.exports.initCertMessage(elem.attr('id'), price, 'product');
            }
        });
    },
    getPrice: function (priceObj) {
        var result = priceObj;
        if (result.min) {
            result = result.min;
        }
        return result.sales.value;
    }
};
