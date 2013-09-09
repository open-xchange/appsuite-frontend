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

var url = require('url');
var path = require('path');

var nopt = require('nopt');
var server = require('./appserver/server');

nopt.invalidHandler = function (key, val) {
    var messages = {
        port: 'Invalid port number: ',
        server: 'Invalid server URL: ',
        zoneinfo: 'Invalid tzdata path: '
    };
    console.error((messages[key] || 'Invalid option: ' + key + '=') + val);
    usage(1);
};

var options = nopt({
    help: Boolean,
    manifests: [path, Array],
    path: String,
    port: Number,
    server: url,
    verbose: ['local', 'remote', 'proxy', 'all', Array],
    zoneinfo: path
}, {
    h: '--help',
    m: '--manifests',
    p: '--port',
    s: '--server',
    v: '--verbose',
    z: '--zoneinfo'
}, process.argv, 2);

if (options.help) usage(0);

function usage(exitCode) {
    (exitCode ? console.error : console.log)(
        'Usage: appserver [OPTION]... [PATH]...\n\n' +
        '  -h,      --help           print this help message and exit\n' +
        '  -m PATH, --manifests=PATH add manifests from the specified path (default:\n' +
        '                            the "manifests" subdirectory of every file path)\n' +
        '           --path=PATH      absolute path of the UI (default: /appsuite)\n' +
        '  -p PORT, --port=PORT      listen on PORT (default: 8337)\n' +
        '  -s URL,  --server=URL     use an existing server as fallback\n' +
        '  -v TYPE, --verbose=TYPE   print more information depending on TYPE:\n' +
        '                            local: local files, remote: remote files,\n' +
        '                            proxy: forwarded URLs, all: shortcut for all three\n' +
        '  -z PATH, --zoneinfo=PATH  use timezone data from the specified path\n' +
        '                            (default: /usr/share/zoneinfo/)\n\n' +
        'Files are searched in each PATH in order and requested from the server if not\n' +
        'found. If no paths are specified, the default is /var/www/appsuite/.');
    process.exit(exitCode);
}

var prefixes = options.argv.remain.map(function (s) {
    return path.resolve(s);
});
if (!prefixes.length) prefixes =  ['/var/www/appsuite/'];
var manifests = options.manifests || append(prefixes, 'manifests/');
manifests.reverse();
prefixes = append(prefixes, 'apps/');

function append(array, suffix) {
    return array.map(function(prefix) {
        return path.join(prefix, suffix);
    });
}
options.prefixes = prefixes;
options.manifests = manifests;

if (options.server) {
    var serverUrl = url.parse(options.server);
    if (serverUrl.protocol !== 'http:' && serverUrl.protocol !== 'https:') {
        console.error('Server must be an HTTP(S) URL');
        usage(1);
    }
}

server.create(options);
