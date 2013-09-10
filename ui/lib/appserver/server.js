/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

function create(options) {
    var fs = require('fs');
    var http = require('http');
    var https = require('https');
    var url = require('url');
    var path = require('path');
    var escape = require('./common').escape;
    var normalizePath = require('./common').normalizePath;
    var connect = require('connect');
    var appsLoadMiddleware = require('./middleware/appsload');
    var manifestsMiddleware = require('./middleware/manifests');
    var localFilesMiddleware = require('./middleware/localfiles');
    var proxyMiddleware = require('./middleware/proxy');

    var verbose = options.verbose = (options.verbose || []).reduce(function (opt, val) {
        if (val === 'all') {
            opt.local = opt.remote = opt.proxy = true;
        } else {
            opt[val] = true;
        }
            return opt;
    }, {});
    options.prefixes = options.prefixes || [];
    options.urlPath = normalizePath(options.path || '/appsuite');

    if (options.server) {
        options.server = normalizePath(options.server);
    }

    var handler = connect()
        .use(appsLoadMiddleware.create(options))
        .use(manifestsMiddleware.create(options))
        .use(localFilesMiddleware.create(options))
        .use(proxyMiddleware.create(options));

    http.createServer(handler)
        .listen(options.port || 8337);
}

module.exports = {
    create: create
};
