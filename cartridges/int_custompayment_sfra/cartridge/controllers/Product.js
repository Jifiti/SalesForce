'use strict';

var server = require('server');
server.extend(module.superModule);

var preferences = require('*/cartridge/config/preferences');

server.append('Show', server.middleware.https, function (req, res, next) {
    res.setViewData({
        jifitiWidgetLibraryURL: preferences.jifitiWidgetLibraryURL,
        isJifitiEnabled: preferences.isJifitiEnabled,
        jifitiMerchantId: preferences.jifitiMerchantId,
        enableCertInPDP: preferences.enableCertInPDP
    });

    next();
});

server.append('ShowQuickView', function (req, res, next) {
    res.setViewData({
        isJifitiEnabled: preferences.isJifitiEnabled,
        enableCertInPDP: preferences.enableCertInPDP
    });

    next();
});
module.exports = server.exports();
