'use strict';

var server = require('server');
server.extend(module.superModule);

var preferences = require('*/cartridge/config/preferences');

server.append('Show', server.middleware.https, function (req, res, next) {
    res.setViewData({
        bnplWidgetLibraryURL: preferences.bnplWidgetLibraryURL,
        bnplIsEnabled: preferences.bnplIsEnabled,
        bnplAuthToken: preferences.bnplAuthToken,
        bnplEnableInCart: preferences.bnplEnableInCart
    });

    next();
});
module.exports = server.exports();
