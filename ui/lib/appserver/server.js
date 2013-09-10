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

    var verbose = options.verbose = (options.verbose || []).reduce(function (opt, val) {
        if (val === 'all') {
            opt.local = opt.remote = opt.proxy = true;
        } else {
            opt[val] = true;
        }
            return opt;
    }, {});
    var prefixes;
    var manifests;
    var urlPath;

    prefixes = options.prefixes = options.prefixes || [];
    manifests = options.manifests = options.manifests || [];

    urlPath = options.urlPath = normalizePath(options.path || '/appsuite');
    var manifestsPath = '/api/apps/manifests';

    if (options.server) {
        options.server = normalizePath(options.server);
        var server = url.parse(options.server);
        var protocol = server.protocol === 'https:' ? https : http;
        manifestsPath = urlPath + manifestsPath.slice(1);
    }

    var handler = connect()
        .use(appsLoadMiddleware.create(options))
        .use(function (request, response, next) {
            var URL = url.parse(request.url, true);
            if ((request.method === 'GET') &&
                (URL.pathname === manifestsPath) &&
                (URL.query.action === 'config')) {

                return injectManifests(request, response);
            }
            return next();
        })
        .use(function (request, response, next) {
            if ((request.url.slice(-3) === '.js') && loadLocal(request, response)) {
                return true;
            }
            return next();
        })
        .use(proxy);

    http.createServer(handler)
        .listen(options.port || 8337);

    function lock() {
        var counter = 1, cb;
        var L = function (f) {
            counter++;
            return function () {
                var retval = f.apply(this, arguments);
                if (!--counter) cb();
                return retval;
            };
        };
        L.done = function (callback) {
            cb = callback;
            if (!--counter) cb();
        };
        return L;
    };

    function injectManifests(request, response) {
        if (!options.server) {
            console.error('Manifests require --server');
            response.writeHead(501, 'Manifests require --server',
                { 'Content-Type': 'text/plain' });
            response.end('Manifests require --server');
            return;
        }
        var URL = url.resolve(options.server, request.url.slice(urlPath.length));
        var opt = url.parse(URL, true);
        opt.headers = request.headers;
        opt.headers.host = opt.host;
        delete opt.headers['accept-encoding'];
        protocol.request(opt, function (res) {
            if (res.statusCode !== 200) {
                response.writeHead(res.statusCode, res.headers);
                res.pipe(response);
                return;
            }
            var reply = [], map = {}, L = lock();
            res.on('data', data).on('end', end);
            function data(chunk) { reply.push(chunk); }
            function end() {
                reply = JSON.parse(reply.join(''));
                if (reply.error) {
                    response.end(JSON.stringify(reply, null, 4));
                    return;
                }
                var list = reply.data.manifests;
                for (var i in list) map[list[i].path] = list[i];
                manifests.forEach(readDir);
                L.done(sendReply);
            }
            function readDir(dir) {
                fs.readdir(dir, L(function (err, files) {
                    if (err) return console.error(err.message);
                    files.forEach(function (file) {
                        file = path.join(dir, file);
                        if (verbose.local) console.log(file);
                        fs.readFile(file, 'utf8', L(addManifest));
                    });
                }));
            }
            function addManifest(err, manifest) {
                if (err) return console.error(err.message);
                manifest = Function('return (' + manifest + ')')();
                if (!(manifest instanceof Array)) manifest = [manifest];
                for (var i in manifest) map[manifest[i].path] = manifest[i];
            }
            function sendReply() {
                var list = reply.data.manifests = [];
                for (var i in map) {
                    if (opt.query.session || /signin/.test(map[i].namespace)) {
                        list.push(map[i]);
                    }
                }
                response.end(JSON.stringify(reply, null, 4));
                if (verbose.local) console.log();
            }
        }).end();
    }

    function loadLocal(request, response) {
        var pathname = url.parse(request.url).pathname,
            filename;
        pathname = pathname.slice(pathname.indexOf('/apps/') + 6);
        filename = prefixes.map(function (p) {
            return p + pathname;
        })
        .filter(function (filename) {
            return (path.existsSync(filename) && fs.statSync(filename).isFile());
        })[0];
        if (!filename) return false;

        // set headers
        if (verbose.local) console.log(filename);
        response.setHeader('Content-Type', 'text/javascript;charset=UTF-8');
        response.setHeader('Expires', '0');
        response.write(fs.readFileSync(filename) + "\n/*:oxsep:*/\n");
        response.end();
        return true;
    }

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
