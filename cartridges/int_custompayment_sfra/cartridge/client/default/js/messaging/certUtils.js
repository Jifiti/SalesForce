'use strict';

module.exports = {
    initCertMessage: function (id, price, sourcepage) {
        if (!id || !price) {
            return;
        }

        var config = {
            price: price,
            sourcepage: sourcepage || 'PIP'
        };

        if (sourcepage) {
            config.sourcepage = sourcepage;
        }

        if ($('#bnplLinkHref').attr('value')) {
            config.link_href = $('#bnplLinkHref').attr('value');
        }

        if ($('#bnplCurrencySymbol').attr('value')) {
            config.currency = $('#bnplCurrencySymbol').attr('value');
        }

        if ($('#bnplLogoURL').attr('value')) {
            config.logo = $('#bnplLogoURL').attr('value');
        }

        if ($('#bnplLinkBehaviour').attr('value')) {
            config.link_behavior = Number($('#bnplLinkBehaviour').attr('value'));
        }

        if ($('#bnplContainerStyle').attr('value') !== '{}') {
            config.container_style = JSON.parse($('#bnplContainerStyle').attr('value'));
        }

        if ($('#bnplFlow').attr('value')) {
            config.flow = $('#bnplFlow').attr('value');
        }

        if ($('#bnplTemplateName').attr('value') === 'standard') {
            config.text = $('#bnplText').attr('value');

            if ($('#bnplTextStyle').attr('value') !== '{}') {
                config.text_style = JSON.parse($('#bnplTextStyle').attr('value'));
            }

            if ($('#bnplLinkText').attr('value')) {
                config.link_text = $('#bnplLinkText').attr('value');
            }

            if ($('#bnplLinkStyle').attr('value') !== '{}') {
                config.link_style = JSON.parse($('#bnplLinkStyle').attr('value'));
            }
        } else {
            config.templateName = $('#bnplTemplateName').attr('value');
        }

        window.config = config;

        if ($('#bnplOfferCategory').attr('value')) {
            window.OfferByPrice.init(id, config, $('#bnplOfferCategory').attr('value'));
        } else {
            window.OfferByPrice.init(id, config);
        }
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
