'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', server.middleware.https, function (req, res, next) {
    res.setViewData({
        jifitiId: req.querystring.jifitiId
    });

    next();
});

module.exports = server.exports();
