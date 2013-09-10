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
    var url = require('url');

    var urlPath = options.urlPath;
    var verbose = options.verbose;

    var server;
    var protocol;

    if (options.server) {
        server = url.parse(options.server);
        if (server.protocol !== 'http:' && server.protocol !== 'https:') {
            console.error('Server must be an HTTP(S) URL');
            usage(1);
        }
        protocol = server.protocol === 'https:' ? require('https') : require('http');
    }

    return function proxy(request, response, next) {
        var URL = request.url;
        if (!options.server) {
            console.log('No --server specified to forward', URL);
            response.writeHead(501, 'No --server specified',
                { 'Content-Type': 'text/plain' });
            response.end('No --server specified');
            return next();
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
}
