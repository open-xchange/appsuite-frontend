/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

'use strict';

(function (module) {
    var fs = require('fs');
    var url = require('url');
    var path = require('path');
    var mime = require('connect').static.mime;

    function charset(type) {
        var t = mime.charsets.lookup(type);
        return t ? ';charset=' + t : '';
    }

    function create(options) {
        var verbose = options.verbose;
        var prefixes = options.prefixes;

        return function (request, response, next) {
            if ('GET' != request.method && 'HEAD' != request.method) {
                return next();
            }
            var pathname = url.parse(request.url).pathname,
                filename,
                type;

            if (/\/appsuite\/api\//.test(pathname)) {
                return next();
            }
            pathname = pathname.slice(pathname.indexOf('/appsuite/') + 10);
            pathname = pathname.replace(/^v=[^\/]+\//, '');
            pathname = pathname.replace(/^$/, 'core');
            filename = prefixes.map(function (p) {
                return path.join(p, pathname);
            })
            .filter(function (filename) {
                return (path.existsSync(filename) && fs.statSync(filename).isFile());
            })[0];
            if (!filename) return next();

            if (pathname === 'core' || pathname === 'signin') {
                type = 'text/html';
            } else {
                type = mime.lookup(filename);
            }
            // set headers
            if (verbose.local) console.log(filename);
            response.setHeader('Content-Type', type + charset(type));
            response.setHeader('Expires', '0');
            response.write(fs.readFileSync(filename));
            response.end();
            return true;
        };
    }

    module.exports = {
        create: create
    };
}(module));
