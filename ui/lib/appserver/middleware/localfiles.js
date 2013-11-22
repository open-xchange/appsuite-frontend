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
