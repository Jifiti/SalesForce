'use strict';

var server = require('server');
server.extend(module.superModule);

var preferences = require('*/cartridge/config/preferences');

server.append('Show', server.middleware.https, function (req, res, next) {
    res.setViewData({
        bnplWidgetLibraryURL: preferences.bnplWidgetLibraryURL,
        bnplIsEnabled: preferences.bnplIsEnabled,
        bnplAuthToken: preferences.bnplAuthToken,
        bnplEnableInPDP: preferences.bnplEnableInPDP
    });

    next();
});

server.append('ShowQuickView', function (req, res, next) {
    res.setViewData({
        bnplIsEnabled: preferences.bnplIsEnabled,
        bnplEnableInPDP: preferences.bnplEnableInPDP
    });

    next();
});
module.exports = server.exports();
