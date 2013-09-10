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
    var url = require('url');
    var path = require('path');

    var verbose = options.verbose;
    var prefixes = options.prefixes;

    return function (request, response, next) {
        if (request.url.slice(-3) !== '.js') {
            return next();
        }
        var pathname = url.parse(request.url).pathname,
            filename;
        pathname = pathname.slice(pathname.indexOf('/apps/') + 6);
        filename = prefixes.map(function (p) {
            return p + pathname;
        })
        .filter(function (filename) {
            return (path.existsSync(filename) && fs.statSync(filename).isFile());
        })[0];
        if (!filename) return next();

        // set headers
        if (verbose.local) console.log(filename);
        response.setHeader('Content-Type', 'text/javascript;charset=UTF-8');
        response.setHeader('Expires', '0');
        response.write(fs.readFileSync(filename) + "\n/*:oxsep:*/\n");
        response.end();
        return true;
    }
}

module.exports = {
    create: create
}
