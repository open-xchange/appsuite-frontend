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
 */

var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');

var prefix = process.argv[2] || '/var/www/appsuite/';
if (prefix.slice(-1) !== '/') prefix += '/';

var tzModule = 'io.ox/core/date/tz/zoneinfo/';
var tzPath = process.argv[3] || '/usr/share/zoneinfo/';
if (tzPath.slice(-1) !== '/') tzPath += '/';

var escapes = {
    '\x00': '\\x00', '\x01': '\\x01', '\x02': '\\x02', '\x03': '\\x03',
    '\x04': '\\x04', '\x05': '\\x05', '\x06': '\\x06', '\x07': '\\x07',
    '\b': '\\b', '\t': '\\t', '\n': '\\n', '\v': '\\v', '\f': '\\f',
    '\r': '\\r', '\x0e': '\\x0e', '\x0f': '\\x0f', '\x10': '\\x10',
    '\x11': '\\x11', '\x12': '\\x12', '\x13': '\\x13', '\x14': '\\x14',
    '\x15': '\\x15', '\x16': '\\x16', '\x17': '\\x17', '\x18': '\\x18',
    '\x19': '\\x19', '\x1a': '\\x1a', '\x1b': '\\x1b', '\x1c': '\\x1c',
    '\x1d': '\\x1d', '\x1e': '\\x1e', '\x1f': '\\x1f', "'": "\\'",
    '\\': '\\\\', '\u2028': '\\u2028', '\u2029': '\\u2029'
};

function escape(s) {
    return s.replace(/[\x00-\x1f'\\\u2028\u2029]/g, function(c) {
        return escapes[c];
    });
}

function httpDate(d) {
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return [
        ['Sun,', 'Mon,', 'Tue,', 'Wed,', 'Thu,', 'Fri,', 'Sat,'][d.getUTCDay()],
        pad(d.getUTCDate()),
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()],
        d.getUTCFullYear(),
        [pad(d.getUTCHours()),
         pad(d.getUTCMinutes()),
         pad(d.getUTCSeconds())].join(':'),
        'GMT'
    ].join(' ');
}

http.createServer(function (request, response) {
    response.setHeader('Content-Type', 'text/javascript;charset=UTF-8');
    var d = new Date(new Date().getTime() + 3e10);
    response.setHeader('Expires', httpDate(d));
    var list = url.parse(request.url).pathname.split(',');
    list.shift();
    for (var i in list) {
        var m = /^(?:\/(text|raw);)?([\w\/-]+(?:\.[\w\/-]+)*)$/.exec(list[i]);
        if (!m) {
            console.log('Invalid module name: ' + list[i]);
            response.write("console.log('Invalid module name: \"" +
                           escape(list[i]) + "\"');\n");
            continue;
        }
        if (m[2].slice(0, tzModule.length) == tzModule) {
            var filename = path.join(tzPath, m[2].slice(tzModule.length));
        } else {
            var filename = path.join(prefix, 'apps', m[2]);
        }
        var valid = fs.existsSync(filename);
        console.log(filename);
        if (!valid) {
            console.log('Could not read', filename);
            response.write("define('" + escape(list[i]) +
                "', function () { throw new Error(\"Could not read '" +
                escape(m[2]) + "'\"); });\n");
            continue;
        }
        if (m[1]) {
            if (m[1] === 'raw') {
                var data = fs.readFileSync(filename), s = [];
                for (var j = 0; j < data.length; j++) s.push(data[j]);
                s = String.fromCharCode.apply(String, s);
            } else {
                var s = fs.readFileSync(filename, 'utf8');
            }
            response.write("define('" + escape(list[i]) + "','" + escape(s) +
                           "');\n");
        } else {
            response.write(fs.readFileSync(filename));
        }
    }
    response.end();
    console.log();
}).listen(8337);
