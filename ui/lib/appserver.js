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
var https = require('https');
var path = require('path');
var url = require('url');

var nopt = require('nopt');

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

var verbose = (options.verbose || []).reduce(function (opt, val) {
    if (val === 'all') {
        opt.local = opt.remote = opt.proxy = true;
    } else {
        opt[val] = true;
    }
    return opt;
}, {});

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

var tzModule = 'io.ox/core/date/tz/zoneinfo/';
var tzPath = options.zoneinfo || '/usr/share/zoneinfo/';
if (tzPath.slice(-1) !== '/') tzPath += '/';
tzPath = [tzPath];

var appsLoadPath = '/api/apps/load/';
var manifestsPath = '/api/apps/manifests';
var urlPath = options.path || '/appsuite';
if (urlPath.slice(-1) !== '/') urlPath += '/';

if (options.server) {
    if (options.server.slice(-1) != '/') options.server += '/';
    var server = url.parse(options.server);
    if (server.protocol !== 'http:' && server.protocol !== 'https:') {
        console.error('Server must be an HTTP(S) URL');
        usage(1);
    }
    var protocol = server.protocol === 'https:' ? https : http;
    appsLoadPath = urlPath + appsLoadPath.slice(1);
    manifestsPath = urlPath + manifestsPath.slice(1);
}

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
    var URL = url.parse(request.url, true);
    if (request.method === 'GET') {
        if (URL.pathname.slice(0, appsLoadPath.length) === appsLoadPath) {
            return load(request, response);
        } else if (URL.pathname === manifestsPath &&
                   URL.query.action === 'config')
        {
            return injectManifests(request, response);
        }
    }
    return loadLocal(request, response) || proxy(request, response);
}).listen(options.port || 8337);

function load(request, response) {
    
    // parse request URL
    var list = url.parse(request.url).pathname.split(',');
    var version = list.shift();
    version = version.slice(version.lastIndexOf('v='));
    
    // find local files, request unknown files from server
    var files = [], remoteCounter = 0;
    for (var i in list) {
        var m = /^(?:\/(text|raw);)?([\w\/+-]+(?:\.[\w\/+-]+)*)$/.exec(list[i]);
        if (!m) {
            files.push(invalid(list[i]));
            continue;
        }
        if (m[2].slice(0, tzModule.length) === tzModule) {
            var paths = tzPath;
            var name = m[2].slice(tzModule.length);
        } else {
            var paths = prefixes;
            var name = m[2];
        }
        for (var j = 0; j < paths.length; j++) {
            var filename = path.join(paths[j], name);
            if (path.existsSync(filename) && fs.statSync(filename).isFile()) {
                break;
            }
        }
        files.push(j >= paths.length ? remote(filename, list[i], m[2]) :
                   !m[1]             ? module(filename, list[i]) :
                   m[1] === 'raw'    ? raw(filename, list[i]) :
                                       text(filename, list[i]));
    }
    if (!remoteCounter) complete();
    
    // invalid module name
    function invalid(fullName) {
        return function () {
            console.log('Invalid module name: ' + fullName);
            response.write("console.log('Invalid module name: \"" +
                           escape(fullName) + "\"');\n");
        };
    }
    
    // remote file
    function remote(filename, fullName, name) {
        if (!options.server) {
            return function() {
                console.log('Could not read', filename);
                response.write(
                    "define('" + escape(fullName) + "', function () {\n" +
                    "  if (ox.debug) console.log(\"Could not read '" +
                        escape(name) + "'\");\n" +
                    "  throw new Error(\"Could not read '" +
                        escape(name) + "'\");\n" +
                    "});\n");
            };
        }
        remoteCounter++;
        var chunks = [];
        var URL = url.resolve(options.server,
                              'api/apps/load/' + version + ',' + fullName);
        protocol.get(url.parse(URL), ok).on('error', error);
        return function () {
            if (verbose.remote) console.log(URL);
            for (var i = 0; i < chunks.length; i++) response.write(chunks[i]);
        };
        function ok(res) {
            if (res.statusCode === 200) {
                res.on('data', chunk).on('end', end);
            } else {
                res.resume();
                console.log('HTTP error ' + res.statusCode + ' for ' + URL);
                chunk("console.log('HTTP error " + res.statusCode + "');\n");
                end();
            }
        }
        function error(e) {
            console.log('Server error for ' + URL + ' : ' + e.message);
            chunk("console.log('Server error: " + e.message + "');\n");
            end();
        }
        function chunk(data) { chunks.push(data); }
        function end() { if (!--remoteCounter) complete(); }
    }
    
    // normal RequireJS module
    function module(filename, fullName) {
        return function () {
            if (verbose.local) console.log(filename);
            response.write(fs.readFileSync(filename) + "\n/*:oxsep:*/\n");
        };
    }
    
    // raw data as string (e.g. timezones)
    function raw(filename, fullName) {
        return function () {
            if (verbose.local) console.log(filename);
            var data = fs.readFileSync(filename), s = [];
            for (var j = 0; j < data.length; j++) s.push(data[j]);
            s = String.fromCharCode.apply(String, s);
            response.write("define('" + escape(fullName) + "','" + escape(s) +
                "');\n/*:oxsep:*/\n");
        };
    }
    
    // text file as a string (e.g. CSS)
    function text(filename, fullName) {
        return function () {
            if (verbose.local) console.log(filename);
            var s = fs.readFileSync(filename, 'utf8');
            response.write("define('" + escape(fullName) + "','" + escape(s) +
                "');\n/*:oxsep:*/\n");
        };
    }
    
    // send reply
    function complete() {
        
        // set headers
        response.setHeader('Content-Type', 'text/javascript;charset=UTF-8');
        response.setHeader('Expires', '0');
        
        // send data
        for (var i = 0; i < files.length; i++) files[i]();
        
        // all done
        response.end();
        if (verbose.local || verbose.remote) console.log();
    }
}

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
