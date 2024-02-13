/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

(function () {

    'use strict';

    // shortcut
    var slice = Array.prototype.slice,
        // deserialize
        deserialize = function (str, delimiter) {
            var pairs = (str || '').split(delimiter === undefined ? '&' : delimiter);
            var i = 0, $l = pairs.length, pair, obj = {}, d = decodeURIComponent;
            for (; i < $l; i++) {
                pair = pairs[i];
                var keyValue = pair.split('='), key = keyValue[0], value = keyValue[1];
                if (key !== '' || value !== undefined) {
                    obj[d(key)] = value !== undefined ? d(value) : undefined;
                }
            }
            return obj;
        },
        // stupid string rotator
        rot = function (str, shift) {
            return _(String(str).split('')).map(function (i) {
                return String.fromCharCode(i.charCodeAt(0) + shift);
            }).join('');
        },
        // get query
        queryData = deserialize(document.location.search.substr(1), /&/),

        //units
        sizes = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],

        // taken from backbone
        Class = function () {},
        inherits = function (parent, protoProps, staticProps) {

            var ExtendableClass;

            // The constructor function for the new subclass is either defined by you
            // (the 'constructor' property in your `extend` definition), or defaulted
            // by us to simply call the parent's constructor.
            if (protoProps && Object.prototype.hasOwnProperty.call(protoProps, 'constructor')) {
                ExtendableClass = protoProps.constructor;
            } else {
                ExtendableClass = function () {
                    parent.apply(this, arguments);
                };
            }

            // Inherit class (static) properties from parent.
            _.extend(ExtendableClass, parent);

            // Set the prototype chain to inherit from `parent`, without calling
            // `parent`'s constructor function.
            Class.prototype = parent.prototype;
            ExtendableClass.prototype = new Class();

            // Add prototype properties (instance properties) to the subclass,
            // if supplied.
            if (protoProps) {
                _.extend(ExtendableClass.prototype, protoProps);
            }

            // Add static properties to the constructor function, if supplied.
            if (staticProps) {
                _.extend(ExtendableClass, staticProps);
            }

            // Correctly set child's `prototype.constructor`.
            ExtendableClass.prototype.constructor = ExtendableClass;

            // Set a convenience property in case the parent's prototype is needed later.
            ExtendableClass.__super__ = parent.prototype;

            return ExtendableClass;
        };

    // extend underscore utilities
    _.mixin({

        /**
         * Serialize object (key/value pairs) to fit into URLs (e.g. a=1&b=2&c=HelloWorld)
         * @param {Object} obj Object to serialize
         * @param {string} [delimiter] Delimiter
         * @returns {string} Serialized object
         * @example
         * _.serialize({ a: 1, b: 2, c: 'text' });
         */
        serialize: function (obj, delimiter, replacer) {
            var tmp = [], e = replacer || encodeURIComponent, id;
            if (typeof obj === 'object') {
                for (id in (obj || {})) {
                    tmp.push(e(id) + (obj[id] !== undefined ? '=' + e(obj[id]) : ''));
                }
            }
            return tmp.sort().join(delimiter === undefined ? '&' : delimiter);
        },

        /**
         * Deserialize object (key/value pairs)
         * @param {string} str String to deserialize
         * @param {string} [delimiter] Delimiter
         * @returns {Object} Deserialized object
         * @function
         * @name _.deserialize
         * @example
         * _.deserialize('a=1&b=2&c=text');
         */
        deserialize: deserialize,

        /**
         * Convenience function; similar to jQuery's $.param but sorted;
         * different delimiter; not escaped; useful for composite keys
         */
        param: function (obj) {
            return this.serialize(obj, ' / ', _.identity);
        },

        // quite like param but also drop undefined values
        cacheKey: function (obj) {
            return this.param($.extend({}, obj));
        }
    });

    $(window).resize(_.recheckDevice);

    $(document).on('shown.bs.popover hide.bs.popover', function (e) {
        $(e.target).toggleClass('popover-open', e.type === 'shown');
    });

    //
    // Cookie handling
    //

    _.getCookie = function (key) {
        key = String(key || '\u0000');
        return _.chain(document.cookie.split(/; ?/))
            .filter(function (pair) {
                return pair.substr(0, key.length) === key;
            })
            .map(function (pair) {
                return decodeURIComponent(pair.substr(key.length + 1));
            })
            .first()
            .value();
    };

    _.setCookie = function (key, value, lifetime) {
        // yep, works this way:
        var c = key + '=' + encodeURIComponent(value) +
            (lifetime ? '; expires=' + new Date(new Date().getTime() + lifetime).toGMTString() : '') + '; path=/';
        document.cookie = c;
    };

    //
    // URL handling
    //

    _.url = {
        /**
         * @param name {string} [Name] of the query parameter
         * @returns {Object} Value or all values
         */
        param: function (name) {
            return name === undefined ? queryData : queryData[name];
        },
        /**
         * @param {string} [name] Name of the hash parameter
         * @returns {Object} Value or all values
         */
        hash: (function () {

            var key, invalidKey = false;

            // this is not cryptography!
            // it just makes certain parameters like "folder" unreadable
            // for the rare case that it contains PII

            function random() {
                return Math.random().toString().substr(2);
            }

            function getKey() {
                return new Array(5).join(random());
            }

            function encrypt(str) {
                var result = '';
                for (var i = 0, k = key.length, l = str.length; i < l; i++) {
                    result += String.fromCharCode(str.charCodeAt(i) + key[i % k]);
                }
                return result;
            }

            function decrypt(str) {
                var result = '';
                for (var i = 0, k = key.length, l = str.length; i < l; i++) {
                    result += String.fromCharCode(str.charCodeAt(i) - key[i % k]);
                }
                return result;
            }

            key = _.getCookie('url.key');
            // replace by new key if invalid (expires never; let's say in 10 years)
            if (!/^\d+$/.test(key)) {
                invalidKey = true;
                _.setCookie('url.key', key = getKey(), 1000 * 3600 * 24 * 365 * 10);
            }
            // transform to integers
            key = key.split('').map(function (i) { return parseInt(i, 10); });

            //
            // main function
            //

            function url(name, value) {
                if (arguments.length === 0) {
                    return url.data;
                } else if (arguments.length === 1) {
                    if (_.isString(name)) return url.data[name];
                    _(name).each(function (value, name) {
                        url.set(name, value);
                    });
                    url.update();
                } else if (arguments.length === 2) {
                    url.set(name, value);
                    url.update();
                }
            }

            url.data = {};

            url.set = function (name, value) {
                if (value === null) {
                    delete url.data[name];
                } else {
                    url.data[name] = value;
                }
            };

            url.encrypt = function (data) {
                var obj = _.extend({}, data);
                // do not change 99% case
                if (/^default\d+\/inbox$/i.test(data.folder)) return obj;
                // encrypt all other mail folders
                if (/^default\d+\//.test(data.folder)) {
                    var index = data.folder.indexOf('/') + 1;
                    obj.folder = data.folder.substr(0, index) + '/' + encrypt('path/' + data.folder.substr(index));
                }
                return obj;
            };

            url.decrypt = function (data) {
                var obj = _.extend({}, data);
                if (/^default\d+\/\//.test(data.folder)) {
                    var index = obj.folder.indexOf('/') + 1,
                        prefix = obj.folder.substr(0, index),
                        check = decrypt(obj.folder.substr(index + 1)),
                        suffix = check.substr(5);
                    if (/^path\//.test(check) && suffix.length) {
                        obj.folder = prefix + suffix;
                    } else {
                        delete obj.folder;
                    }
                }
                return obj;
            };

            url.update = function () {
                // update hash
                var hashStr = _.serialize(url.encrypt(url.data), '&', function (v) {
                    // need strict encoding for Japanese characters, for example
                    // safari throws URIError otherwise (Bug 26411)
                    // keep slashes and colons for readability
                    return encodeURIComponent(v)
                        .replace(/%2F/g, '/')
                        .replace(/%3A/g, ':');
                    //return v.replace(/\=/g, '%3D').replace(/\&/g, '%26');
                });
                // be persistent
                if (document && document.location) {
                    document.location.hash = hashStr;
                }
            };

            function decode() {
                // since the hash might change we decode it for every request
                // firefox has a bug and already decodes the hash string, so we use href
                var hash = location.href.split(/#/)[1] || '';
                url.data = url.decrypt(deserialize(
                    hash.substr(0, 1) === '?' ? rot(decodeURIComponent(hash.substr(1)), -1) : hash
                ));
            }

            decode();
            $(window).on('hashchange', decode);

            // remove invalid folder
            if (invalidKey && /^default\d+\//.test(url.data.folder)) url.set('folder', null);

            return url;

        }()),

        /**
         * Redirect
         */
        redirect: function (path) {
            // absolute or relative url
            if (!(/^#/).test(path)) {
                location.href = path;
                return;
            }
            // simple hash change
            location.replace(_.url.get(path));
            // enforce page reload
            _.defer(location.reload.bind(location, true));
        },

        get: function (path) {
            var l = location;
            return l.protocol + '//' + l.host + l.pathname.replace(/\/[^/]*$/, '/' + path);
        },

        // replace [variables] in a string; usually an URL. Values get escaped.
        vars: (function () {

            function getVariables(customVariables) {
                return _.extend(
                    _(location).pick('hash', 'host', 'hostname', 'pathname', 'port', 'protocol', 'search'),
                    _(_.url.hash()).pick('app', 'folder', 'id'),
                    _(ox).pick('context_id', 'language', 'session', 'user', 'user_id'),
                    customVariables
                );
            }

            return function parse(url, customVariables) {
                var hash = getVariables(customVariables);
                // replace pattern "$word"
                return String(url).replace(/\[(\w+)\]/g, function (all, key) {
                    key = String(key).toLowerCase();
                    return key in hash ? encodeURIComponent(hash[key]) : all;
                });
            };
        }())
    };

    // extend underscore utilities
    _.mixin({

        rot: rot,

        /**
         * This function simply writes its parameters to console.
         * Useful to debug callbacks, e.g. event handlers.
         * @returns {Object} First parameter to support inline inspecting
         * @example
         * http.GET({ module: 'calendar', params: { id: 158302 }, success: _.inspect });
         */
        inspect: function (first) {
            var args = slice.call(arguments);
            args.unshift('Inspect');
            console.debug.apply(console, args);
            return first;
        },

        /**
         * Call function if first parameter is a function (simplifies callbacks)
         * @param {function ()} fn Callback
         */
        call: function (fn) {
            if (_.isFunction(fn)) {
                var i = 1, $l = arguments.length, args = [];
                for (; i < $l; i++) {
                    args.push(arguments[i]);
                }
                return fn.apply(fn, args);
            }
        },

        /**
         * Returns local current time as timestamp
         * @returns {long} Timestamp
         */
        now: function () {
            return new Date().getTime();
        },

        /**
         *  Returns local current time as timestamp in UTC!
         * @returns {long} Timestamp
         */
        utc: function () {
            var t = new Date();
            return t.getTime() - t.getTimezoneOffset() * 60000;
        },

        // return timestamp far away in the future
        then: function () {
            return 2116800000000;
        },

        /**
         * Return the first parameter that is not undefined
         */
        firstOf: function () {
            var args = slice.call(arguments), i = 0, $l = args.length;
            for (; i < $l; i++) {
                if (args[i] !== undefined) {
                    return args[i];
                }
            }
            return undefined;
        },

        /**
         * Copy object
         * @param {Object} elem Object to copy
         * @param {Boolean} deep Deep vs. Shallow copy
         * @returns {Object} Its clone
         */
        copy: (function () {

            var isArray = _.isArray,
                copy = function (elem, deep) {
                    var tmp = isArray(elem) ? new Array(elem.length) : {}, prop, i;
                    for (i in elem) {
                        prop = elem[i];
                        tmp[i] = deep && typeof prop === 'object' && prop !== null ? copy(prop, deep) : prop;
                    }
                    return tmp;
                };

            return function (elem, deep) {
                return typeof elem !== 'object' || elem === null ? elem : copy(elem, !!deep);
            };
        }()),

        // legacy
        deepClone: function (elem) {
            return _.copy(elem, true);
        },

        // until es6 default parameters
        defaultValue: function (value, defaultvalue) {
            return _.isUndefined(value) ? defaultvalue : value;
        },

        /**
         * Lastest function only
         * Works with non-anonymous functions only
         */
        lfo: function () {
            // call counter
            var curry = slice.call(arguments), sync = false, context, fn, count;
            // sync or async (default)
            if (curry[0] === true) { curry.shift(); sync = true; }
            // context?
            if (!_.isFunction(curry[0])) context = curry.shift();
            // get function and count
            fn = curry.shift() || $.noop;
            count = (fn.count = (fn.count || 0) + 1);
            // wrap
            return function () {
                var args = slice.call(arguments);
                function cont() {
                    if (count === fn.count) {
                        fn.apply(context || fn, curry.concat(args));
                    }
                }
                if (sync) cont(); else setTimeout(cont, 0);
            };
        },

        /**
         * Queued (for functions that return deferred objects and must be blocked during operation)
         */
        queued: function (fn, timeout) {

            var hash = {}, guid = 0;

            return function () {

                // add guid
                fn.queue_guid = fn.queue_guid || guid++;

                var def = $.Deferred(),
                    queue = hash[fn.queue_guid] || (hash[fn.queue_guid] = [$.when()]),
                    last = _(queue).last(),
                    self = this,
                    args = $.makeArray(arguments);

                queue.push(def);

                last.done(function () {
                    fn.apply(self, args).done(function () {
                        setTimeout(function () {
                            queue = _(queue).without(def);
                            def.resolve();
                        }, timeout || 250);
                    });
                });

                return def;
            };
        },

        /**
         * format/printf
         */
        printf: function (str, params) {
            str = _.isString(str) ? str : '';
            // is array?
            if (!_.isArray(params)) {
                params = slice.call(arguments, 1);
            }
            var index = 0;
            return str
                .replace(
                    /%(([0-9]+)\$)?[A-Za-z]/g,
                    function (match, pos, n) {
                        if (pos) {
                            index = n - 1;
                        }
                        //return params[index++];
                        var val = params[index++];
                        return val !== undefined ? val : 'unknown';
                    }
                )
                .replace(/%%/g, '%');
        },

        /**
         * Array-based printf uses a callback function to collect parts of the
         * format string in an array. Useful to construct DOM nodes based on
         * translated text.
         * @param {String} str the format string using printf syntax.
         * @param {Function(index)} formatCb A callback function which converts
         * a format specifier to an array element. Its parameter is a 0-based
         * index of the format specifier.
         * @param {Function(text)} textCb An optional callback function which
         * converts text between format specifiers to an array element. Its
         * parameter is the text to convert. If not specified, formatCb is
         * called for both, format specifiers and the text between them.
         */
        aprintf: function (str, formatCb, textCb) {
            var result = [], index = 0;
            if (!textCb) textCb = formatCb || $.noop;
            String(str).replace(
                /%(([0-9]+)\$)?[A-Za-z]|((?:%%|[^%])+)/g,
                function (match, pos, n, text) {
                    if (text) {
                        result.push(textCb(text.replace(/%%/g, '%')));
                    } else {
                        if (pos) index = n - 1;
                        result.push(formatCb(index++));
                    }
                    return '';
                });
            return result;
        },

        /**
         * Format error
         */
        formatError: function (e, formatString) {
            e = e || {};
            return _.printf(
                formatString || 'Error: %1$s (%2$s, %3$s)',
                _.printf(e.error, e.error_params),
                e.code,
                e.error_id
            );
        },

        // good for leading-zeros for example
        pad: function (val, length, fill) {
            var str = String(val), n = length || 1, diff = n - str.length;
            return (diff > 0 ? new Array(diff + 1).join(fill || '0') : '') + str;
        },

        /**
         * return human readable filesize
         * @param  {numeric} size    in bytes
         * @param  {object} options
         * @param  {numeric} options.digits    (number of digits) appear after the decimal point
         * @param  {boolean} options.force     using fixed-point notation
         * @param  {string} options.zerochar  replace value of 0 with this char
         * @return {string}
         */
        //TODO: gt for sizes
        filesize: function (size, options) {

            var opt = _.extend({
                digits: 0,
                force: true,
                zerochar: undefined
            }, options || {});

            //for security so math.pow doesn't get really high values
            if (opt.digits > 10) {
                opt.digits = 10;
            }
            var i = 0, dp = Math.pow(10, opt.digits || 0), val;
            while (size > 1024 && i < sizes.length) {
                size = size / 1024;
                i++;
            }
            val = (Math.round(size * dp, 1) / dp);
            //replacement to 0
            if (typeof opt.zerochar !== 'undefined' && val === 0) return opt.zerochar;

            return (opt.force ? val : val.toFixed(opt.digits)) + '\xA0' + sizes[i];
        },

        /**
         * shortens a string
         * @param  {string}   str
         * @param  {object}   options
         * @param  {number}   options.max: max length
         * @param  {string}   options.char: ellipsis char
         * @param  {string}   options.charpos: 'middle' or 'end'
         * @param  {number}   options.length: if charpos 'middle' value defines length of head and tail part
         * @param  {boolean}  options.suppressExtension: do not display the file extension in case this flag does exist and also equals the true value.
         * @param  {boolean}  options.optimizeWordbreak: manipulate <str> in a way that text will flow and break with an optimum of used render space in case this flag does exist and also equals the true value.
         * @return {string}
         */
        ellipsis: function (str, options) {
            /* eslint dot-notation: [2, {"allowKeywords": true}] */
            var
                space,
                undefinedValue;

            //be robust
            str = String(str || '').trim();

            options = _.extend({

                max: 70,
                char: '\u2026',
                charpos: 'end',
                length: undefinedValue

            }, (options || {}));

            // do not display a file's extension
            if (options.suppressExtension === true) {

                str = (str.split(/.[^.]*$/)[0]).trim() || str;
            }

            // compute ellipsis
            if (str.length > options.max) {

                space = options.max - options.char.length;

                if (options.charpos === 'end') {

                    str = str.substr(0, (options.max - options.char.length)) + options.char;

                } else {
                    // fix invalid length
                    if (!options.length || ((options.length * 2) > space)) {
                        //save space for ellipse char
                        options.length = (((space % 2) === 0) ? (space / 2) : ((options.max / 2) - 1)) || 1;
                    }
                    str = str.substr(0, options.length).trim() + options.char + str.substr(str.length - options.length).trim();
                }
            }
            if (options.optimizeWordbreak === true) {

                str = _.breakWord(str);
            }
            return str; // exactly one exit point.
        },
        breakWord: function (str) {
            var
                // https://www.cs.tut.fi/~jkorpela/dashes.html
                regXSearchHyphensGlobally = (/[\u002D\u1806\u2010\u2012\u2013\u2014\u2015\u207B\u208B\u2212]+/g),

                // http://es5.github.com/#WhiteSpace
                // https://www.cs.tut.fi/~jkorpela/chars/spaces.html
                regXSearchWhitespaceGlobally = (/[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029]+/g),
                regXSearchZeroWhitespaceGlobally = (/[\u200B\uFEFF]+/g),

                //softHyphenChar = '\u00AD',
                nonBreakingHyphenChar = '\u2011',
                nonBreakingWhitespaceChar = '\u00A0',
                breakingZeroWhitespaceChar = '\u200B';

            return (str

                .replace(regXSearchZeroWhitespaceGlobally, '')
                .replace(regXSearchWhitespaceGlobally, nonBreakingWhitespaceChar)
                .replace(regXSearchHyphensGlobally, nonBreakingHyphenChar)
                .split('')
                .join(breakingZeroWhitespaceChar)
            );
        },

        /**
         * Normalizes newlines in given string and replaces newlines with <br>
         * This can be safely used without risking CSS.
         * @param {string} text
         * @param {object} jQuery node
         * @return { object} jQuery node
         */
        nltobr: function (text, node) {
            var normalizedText = text.replace('\r\n', '\n'),
                textFragment = normalizedText.split('\n');
            for (var i = 0; i < textFragment.length; i++) {
                node.append($.txt(textFragment[i]));
                if (i < textFragment.length - 1) {
                    node.append($('<br>'));
                }
            }
            return node;
        },

        // deferred helpers

        allResolved: function () {
            return _.whenSome.apply(undefined, arguments).then(function (data) { return data.resolved; });
        },

        allRejected: function () {
            return _.whenSome.apply(undefined, arguments).then(function (data) { return data.rejected; });
        },

        // $.when-like api that always resolved with { resolved: [], rejected: [] }
        whenSome: function () {
            var def = $.Deferred(),
                args = Array.prototype.slice.call(arguments),
                resp = { resolved: [], rejected: [] },
                remaining = args.length;

            _.each(args, function (item, index) {
                // wrap to support non-deferred objects
                $.when(item).always(_.partial(process, _, item, index));
            });

            function process(data, item, index) {
                var state = item && _.isFunction(item.state) ? item.state() : 'resolved';
                // keep order and remove invalid afterwards
                resp[state][index] = data;
                if (--remaining) return;
                def.resolve({
                    resolved: _.compact(resp.resolved),
                    rejected: _.compact(resp.rejected)
                });
            }
            return def.promise();
        },

        // makes sure you have an array
        getArray: function (o) {
            return _.isArray(o) ? o : [o];
        },

        // call function 'every' 1 hour or 5 seconds
        tick: function (num, type, fn) {
            fn = fn || $.noop;
            var interval = 1000;
            if (type === 'hour') {
                interval *= 3600;
            } else if (type === 'minute') {
                interval *= 60;
            }
            // wait until proper clock tick
            setTimeout(function () {
                fn();
                setInterval(fn, interval * (num || 1));
            }, interval - (_.now() % interval) + 1);
        },

        wait: function (t) {
            var def = $.Deferred();
            setTimeout(function () {
                def.resolve();
                def = null;
            }, t || 0);
            return def;
        },

        /*
         * first and last call within wait will call original function
         * hint: throttle of lo-dash can be used alternatively
         * @param  {function} func
         * @param  {nunber} wait
         * @return { function} debonced version of func
         */
        mythrottle: function (func, wait) {
            var context, args, result,
                timeout = null,
                previous = 0,
                later = function () {
                    previous = new Date();
                    timeout = null;
                    result = func.apply(context, args);
                };

            return function () {
                var now = new Date(),
                    remaining;
                //set closures
                context = this;
                args = arguments;
                //clear old ones
                clearTimeout(timeout);
                timeout = null;
                //immediate vs delayed
                remaining = wait - (now - previous);
                if (remaining <= 0) {
                    previous = now;
                    result = func.apply(context, args);
                }
                timeout = setTimeout(later, remaining);
                return result;
            };
        },

        makeExtendable: (function () {
            return function (parent) {
                if (_.isObject(parent)) {
                    parent.extend = function (protoProps, classProps) {
                        var child = inherits(this, protoProps, classProps);
                        child.extend = this.extend;
                        return child;
                    };
                }
                return parent;
            };
        }()),

        // helper for benchmarking
        clock: (function () {
            var last = null, i = 1;
            return function (label) {
                var t = _.now();
                console.debug('clock.t' + (i++), t - (last || ox.t0), label || '');
                last = t;
            };
        }()),

        // simple composite-key constructor/parser
        cid: (function () {

            function encode(s) {
                // escape dots and backslashes
                return String(s).replace(/([.\\])/g, '\\$1');
            }

            function decode(s) {
                var regex = /(\\\\|\\\.|\.)/g, match, parts = ['', ''], index = 0, p = 0;
                // ensure we have a string
                s = String(s);
                // process string step by step in a loop
                while ((match = regex.exec(s)) !== null) {
                    // append substring before the match (use substring; not substr!)
                    parts[p] += s.substring(index, match.index);
                    // now handle match
                    switch (match[0]) {
                        // escaped backslash
                        case '\\\\': parts[p] += '\\'; break;
                        // escaped dot
                        case '\\.': parts[p] += '.'; break;
                        // dot
                        case '.': p = 1; break;
                        // no default
                    }
                    index = match.index + match[0].length;
                }
                // add tail (with just 1 parameter substring and substr are identical)
                parts[p] += s.substring(index);
                // some apis use folder (chronos) and some use folder_id
                // TODO look if this creates problems
                return p === 0 ? { id: parts[0] } : { folder_id: parts[0], folder: parts[0], id: parts[1] };
            }

            return function (o) {
                var tmp, r = 'recurrenceId', m, f;
                if (typeof o === 'string') {
                    // Triples? (incl. new CalDAV ids)
                    // recurrenceId has a lot of varieties: timestamp, zulu with and without Z at the end, timezone:Zulu
                    //                 |folder               |.|id   |.|recurrenceId
                    if ((m = o.match(/^(cal:\/\/\d+\/\d+|\d+)\.(\d+)(\.((\w+\/\w+:)?[\dTZ]+))?$/)) && m.length) {
                        tmp = { folder_id: String(m[1]), folder: String(m[1]), id: String(m[2]) };
                        if (m[4] !== undefined) tmp[r] = String(m[4]);
                        return tmp;
                    }
                    // character based? (double tuple)
                    return decode(o);
                } else if (typeof o === 'object' && o !== null) {
                    // join
                    tmp = encode(o.id);
                    f = o.folder_id !== undefined ? o.folder_id : o.folder;
                    if (o[r] !== undefined && o[r] !== null) {
                        // if we have a recurrence position we need a folder
                        tmp = encode(f || 0) + '.' + tmp + '.' + encode(o[r]);
                    } else if (f !== undefined) {
                        tmp = encode(f) + '.' + tmp;
                    }
                    return tmp;
                }
            };
        }()),

        // escape cid - usefull for event handlers
        ecid: function (o) {
            var cid = typeof o === 'string' ? o : _.cid(o);
            return encodeURIComponent(cid).replace(/\./g, ':');
        },

        // if someone has a better name ...
        isSet: function (o) {
            return o !== null && o !== undefined && o !== '';
        },

        fallback: function (o, defaultValue) {
            return _.isSet(o) ? o : defaultValue;
        },

        toHash: function (array, prop) {
            var tmp = {};
            _(array).each(function (obj) {
                if (obj && prop && _.isString(prop)) tmp[obj[prop]] = obj;
            });
            return tmp;
        },

        updateFavicons: function (path) {
            path = path || ox.base + '/apps/themes/' + ox.theme + '/';
            var icons = {
                icon57: 'icon57.png',
                icon72: 'icon72.png',
                icon76: 'icon76.png',
                icon114: 'icon114.png',
                icon120: 'icon120.png',
                icon144: 'icon144.png',
                icon152: 'icon152.png',
                icon167: 'icon167.png',
                icon180: 'icon180.png',
                icon192: 'icon192.png',
                win8Icon: 'icon144_win.png',
                // update favicon last; latest chrome (~64) runs into issues (see bug 57324)
                favicon: 'favicon.ico'
            };
            _(icons).each(function (file, id) {
                // firefox needs detach/append (see bug 25287);
                $('head #' + id).attr({ href: path + file }).detach().appendTo('head');
            });
        }
    });

    // debug I18N functionality
    _.DEBUG_I18N = !!_.url.hash('debug-i18n');

    _.mixin({
        noI18n: _.DEBUG_I18N ? function (text) {
            return '\u200b' + (_.isString(text) ? text.replace(/[\u200b\u200c]/g, '') : text) + '\u200c';
        } : function (text) { return text; } // do not pollute `_.identity` with new properties (see below)
    });

    /**
     * In "debug-i18n" mode, strips the translation markers from the passed
     * string. Useful if a translated string needs to be used for any data
     * processing instead of being displayed in the GUI (e.g. the translated
     * default name "Unnamed" for a new file to be created via a server call).
     *
     * @param {string} text
     *  The text to be stripped (e.g.: "\u200bUnnamed\u200c").
     *
     * @returns {string}
     *  The stripped text (e.g.: "Unnamed").
     */
    _.noI18n.fix = _.DEBUG_I18N ? function (text) {
        return text.replace(/^\u200b|\u200c$/g, '');
    } : _.identity;

    /**
     * Similar to `_.printf`: Takes a format string and arguments to be filled
     * for the placeholders. Note that this method does not do any translation
     * by itself.
     *
     * @param {string} pattern
     *  The format string to be processed, usually the result of one of the
     *  gettext functions, or some other language-independent pattern.
     *
     * @param {unknwon[]} args
     *  The arguments to be inserted for the placeholders in the format string.
     *  In "debug-i18n" mode, the translation markers will be removed from all
     *  arguments.
     *
     * @returns {string}
     *  The processed string (enclosed in translation markers in "debug-i18n"
     *  mode).
     */
    _.noI18n.format = _.DEBUG_I18N ? function (/* pattern, ...args */) {
        return _.noI18n(_.printf.apply(_, arguments));
    } : _.printf;

    /**
     * Similar to `_.aprintf`: Takes a format string, and returns an array with
     * the results of one or two callback functions processing the plain text
     * and placeholders. Useful e.g. to replace the placeholders in the format
     * string with DOM nodes or HTML mark-up that can be passed to `$.append`
     * and similar functions.
     *
     * @param {string} pattern
     *  The format string to be processed, usually the result of one of the
     *  gettext functions.
     *
     * @param {(index: number) => T1} argFn
     *  The callback function used to process the placeholders in the pattern
     *  string. Receives the zero-based (!) index of the placeholder (also for
     *  indexed placeholders, e.g. the index 2 for "%3$s").
     *
     * @param {(text: string) => T2} [textFn=_.noI18n]
     *  The callback function used to process the text portions between the
     *  placeholders. If omitted, uses the `_.noI18n` function that returns the
     *  passed text portion (enclosed in translation markers in "debug-i18n"
     *  mode).
     *
     * @returns {Array<T1|T2>}
     *  The results of the callback functions, in order of the text portions in
     *  the passed format string.
     */
    _.noI18n.assemble = function (pattern, argFn, textFn) {
        return _.aprintf(_.noI18n.fix(pattern), argFn, textFn ? _.compose(textFn, _.noI18n) : _.noI18n);
    };

    _.noI18n.text = function () {
        return _(arguments).reduce(function (memo, str) {
            return memo.add($.txt(_.noI18n(str)));
        }, $());
    };

    _.escapeRegExp = function (s) {
        return (s || '').replace(/([$^*+?!:=.|(){}[\]\\])/g, function () { return ('\\' + arguments[1]); });
    };

    _.stripTags = function (str) {
        if (!str) return '';
        return String(str).replace(/<(\/(div|p)|br|img)>/gi, ' ').replace(/<.+?>/g, '');
    };

    _.sanitize = {
        option: function (value) {
            return (value || '').replace(/[^a-z0-9:._-]/ig, '').trim();
        }
    };

    window.assert = function (value, message) {
        if (!ox.debug || value) return;
        console.error(message || 'Assertion failed!');
    };

    /**
     * Converts HTML entities to Unicode characters.
     * @param {String} html The HTML to unescape.
     * @type String
     * @return The unescaped string with resolved entities.
     */
    _.unescapeHTML = function (html) {
        /*eslint no-nested-ternary: 0*/
        return (html || '').replace(/&(?:(\w+)|#x([0-9A-Fa-f]+)|#(\d+));/g,
            function (original, entity, hex, dec) {
                return entity ? _.unescapeHTML.entities[entity] || original :
                    hex ? String.fromCharCode(parseInt(hex, 16)) : String.fromCharCode(parseInt(dec, 10));
            });
    };

    _.unescapeHTML.entities = (function (es) {
        for (var i in es) {
            es[i] = String.fromCharCode(es[i]);
        }
        return es;
    }({
        nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165,
        brvbar: 166, sect: 167, uml: 168, copy: 169, ordf: 170, laquo: 171,
        not: 172, shy: 173, reg: 174, macr: 175, deg: 176, plusmn: 177, sup2: 178,
        sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184,
        sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190,
        iquest: 191, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196,
        Aring: 197, AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202,
        Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208,
        Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214,
        times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220,
        Yacute: 221, THORN: 222, szlig: 223, agrave: 224, aacute: 225, acirc: 226,
        atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232,
        eacute: 233, ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238,
        iuml: 239, eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244,
        otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250,
        ucirc: 251, uuml: 252, yacute: 253, thorn: 254, yuml: 255, fnof: 402,
        Alpha: 913, Beta: 914, Gamma: 915, Delta: 916, Epsilon: 917, Zeta: 918,
        Eta: 919, Theta: 920, Iota: 921, Kappa: 922, Lambda: 923, Mu: 924, Nu: 925,
        Xi: 926, Omicron: 927, Pi: 928, Rho: 929, Sigma: 931, Tau: 932,
        Upsilon: 933, Phi: 934, Chi: 935, Psi: 936, Omega: 937, alpha: 945,
        beta: 946, gamma: 947, delta: 948, epsilon: 949, zeta: 950, eta: 951,
        theta: 952, iota: 953, kappa: 954, lambda: 955, mu: 956, nu: 957, xi: 958,
        omicron: 959, pi: 960, rho: 961, sigmaf: 962, sigma: 963, tau: 964,
        upsilon: 965, phi: 966, chi: 967, psi: 968, omega: 969, thetasym: 977,
        upsih: 978, piv: 982, bull: 8226, hellip: 8230, prime: 8242, Prime: 8243,
        oline: 8254, frasl: 8260, weierp: 8472, image: 8465, real: 8476,
        trade: 8482, alefsym: 8501, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595,
        harr: 8596, crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659,
        hArr: 8660, forall: 8704, part: 8706, exist: 8707, empty: 8709, nabla: 8711,
        isin: 8712, notin: 8713, ni: 8715, prod: 8719, sum: 8721, minus: 8722,
        lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736, and: 8743,
        or: 8744, cap: 8745, cup: 8746, 'int': 8747, there4: 8756, sim: 8764,
        cong: 8773, asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805,
        sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839, oplus: 8853,
        otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969,
        lfloor: 8970, rfloor: 8971, lang: 9001, rang: 9002, loz: 9674, spades: 9824,
        clubs: 9827, hearts: 9829, diams: 9830, quot: 34, amp: 38, lt: 60, gt: 62,
        OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, circ: 710,
        tilde: 732, ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205,
        lrm: 8206, rlm: 8207, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217,
        sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224,
        Dagger: 8225, permil: 8240, lsaquo: 8249, rsaquo: 8250, euro: 8364
    }));

}());
