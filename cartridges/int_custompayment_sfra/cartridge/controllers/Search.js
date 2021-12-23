'use strict';

var server = require('server');
server.extend(module.superModule);

var preferences = require('*/cartridge/config/preferences');

server.append('Show', server.middleware.https, function (req, res, next) {
    res.setViewData({
        jifitiWidgetLibraryURL: preferences.jifitiWidgetLibraryURL,
        isJifitiEnabled: preferences.isJifitiEnabled,
        jifitiMerchantId: preferences.jifitiMerchantId,
        enableCertInPLP: preferences.enableCertInPLP
    });

    next();
});

module.exports = server.exports();
