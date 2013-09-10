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

    var verbose = options.verbose = (options.verbose || []).reduce(function (opt, val) {
        if (val === 'all') {
            opt.local = opt.remote = opt.proxy = true;
        } else {
            opt[val] = true;
        }
            return opt;
    }, {});
    var prefixes;
    var urlPath;

    prefixes = options.prefixes = options.prefixes || [];
    urlPath = options.urlPath = normalizePath(options.path || '/appsuite');

    if (options.server) {
        options.server = normalizePath(options.server);
        var server = url.parse(options.server);
        var protocol = server.protocol === 'https:' ? https : http;
    }

    var handler = connect()
        .use(appsLoadMiddleware.create(options))
        .use(manifestsMiddleware.create(options))
        .use(localFilesMiddleware.create(options))
        .use(proxy);

    http.createServer(handler)
        .listen(options.port || 8337);

    function proxy(request, response) {
        var URL = request.url;
        if (!options.server) {
            console.log('No --server specified to forward', URL);
            response.writeHead(501, 'No --server specified',
                { 'Content-Type': 'text/plain' });
            response.end('No --server specified');
            return;
        }
        if (URL.slice(0, urlPath.length) === urlPath) {
            URL = URL.slice(urlPath.length);
        }
        URL = url.resolve(options.server, URL);
        if (verbose.proxy) {
            console.log(URL);
            console.log();
        }
        var opt = url.parse(URL);
        opt.method = request.method;
        opt.headers = request.headers;
        opt.headers.host = opt.host;
        request.pipe(protocol.request(opt, function (res) {
            var cookies = res.headers['set-cookie'];
            if (cookies) {
                if (typeof cookies === 'string') cookies = [cookies];
                res.headers['set-cookie'] = cookies.map(function (s) {
                    return s.replace(/;\s*secure/i, '');
                });
            }
            response.writeHead(res.statusCode, res.headers);
            res.pipe(response);
        }));
    }
}

module.exports = {
    create: create
};
