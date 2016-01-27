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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
                var keyValue = pair.split(/\=/), key = keyValue[0], value = keyValue[1];
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
            if (protoProps && protoProps.hasOwnProperty('constructor')) {
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

        mapObject: function(obj, iteratee, context) {
            var optimizeCb = function(func, context, argCount) {
                if (context === void 0) return func;
                switch (argCount === null ? 3 : argCount) {
                    case 1: return function(value) { return func.call(context, value); };
                    case 2: return function(value, other) { return func.call(context, value, other); };
                    case 3: return function(value, index, collection) { return func.call(context, value, index, collection); };
                    case 4: return function(accumulator, value, index, collection) { return func.call(context, accumulator, value, index, collection); };
                }
                return function() {
                    return func.apply(context, arguments);
                };
            };
            var cb = function(value, context, argCount) {
                if (value === null) return _.identity;
                if (_.isFunction(value)) return optimizeCb(value, context, argCount);
                if (_.isObject(value)) return _.matcher(value);
                return _.property(value);
            };
            iteratee = cb(iteratee, context);
            var keys =  _.keys(obj),
                length = keys.length,
                results = {},
                currentKey;
            for (var index = 0; index < length; index++) {
                currentKey = keys[index];
                results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
            }
            return results;
        },

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
        }
    });

    $(window).resize(_.recheckDevice);

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

            var hashData = {};

            function decode() {
                // since the hash might change we decode it for every request
                // firefox has a bug and already decodes the hash string, so we use href
                hashData = location.href.split(/#/)[1] || '';
                hashData = deserialize(
                     hashData.substr(0, 1) === '?' ? rot(decodeURIComponent(hashData.substr(1)), -1) : hashData
                );
            }

            function set(name, value) {
                if (value === null) {
                    delete hashData[name];
                } else {
                    hashData[name] = value;
                }
            }

            function update() {
                // update hash
                var hashStr = _.serialize(hashData, '&', function (v) {
                    // need strict encoding for Japanese characters, for example
                    // safari throws URIError otherwise (Bug 26411)
                    // keep slashes and colons for readability
                    return encodeURIComponent(v)
                        .replace(/%2F/g, '/')
                        .replace(/%3A/g, ':');
                    //return v.replace(/\=/g, '%3D').replace(/\&/g, '%26');
                });
                // be persistent
                document.location.hash = hashStr;
            }

            decode();
            $(window).on('hashchange', decode);

            return function (name, value) {
                if (arguments.length === 0) {
                    return hashData;
                } else if (arguments.length === 1) {
                    if (_.isString(name)) {
                        return hashData[name];
                    } else {
                        _(name).each(function (value, name) {
                            set(name, value);
                        });
                        update();
                    }
                } else if (arguments.length === 2) {
                    set(name, value);
                    update();
                }
            };
        }()),

        /**
         * Redirect
         */
        redirect: function (path) {
            location.href = (/^http/i).test(path) ? path : _.url.get(path);
        },

        get: function (path) {
            var l = location;
            return l.protocol + '//' + l.host + l.pathname.replace(/\/[^\/]*$/, '/' + path);
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
         * Get cookie value
         */
        getCookie: function (key) {
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
        },

        setCookie: function (key, value, lifetime) {
            // yep, works this way:
            var c = key + '=' + encodeURIComponent(value) +
                (lifetime ? '; expires=' + new Date(new Date().getTime() + lifetime).toGMTString() : '') + '; path=/';
            document.cookie = c;
        },

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
            return (new Date()).getTime();
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

        /**
         * Lastest function only
         * Works with non-anonymous functions only
         */
        lfo: function () {
            // call counter
            var curry = slice.call(arguments), sync = false, fn, count;
            // sync or async (default)
            if (curry[0] === true) { curry.shift(); sync = true; }
            // get function and count
            fn = curry.shift() || $.noop;
            count = (fn.count = (fn.count || 0) + 1);
            // wrap
            return function () {
                var args = slice.call(arguments);
                function cont() {
                    if (count === fn.count) {
                        fn.apply(fn, curry.concat(args));
                    }
                }
                if (sync) cont(); else setTimeout(cont, 0);
            };
        },

        /**
         * Queued (for functions that return deferred objects and must be blocked during operation)
         */
        queued: function (fn, timeout) {

            var hash = {};

            return function () {

                var def = $.Deferred(),
                    queue = hash[fn] || (hash[fn] = [$.when()]),
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
            if (typeof opt.zerochar !== 'undefined' && val === 0)
                return opt.zerochar;
            return (opt.force ? val : val.toFixed(opt.digits)) + '\xA0' + sizes[i];
        },

        /**
         * shortens a string
         * @param  {string} str
         * @param  {object} options
         * @param  {number} options.max: max length
         * @param  {string} options.char: ellipsis char
         * @param  {string} options.charpos: 'middle' or 'end'
         * @param  {number} options.length: if charpos 'middle' value defines length of head and tail part
         * @return {string}
         */
        ellipsis: function (str, options) {
            //be robust
            str = String(str || '').trim();
            var opt = _.extend({
                    max: 70,
                    char: '\u2026',
                    charpos: 'end',
                    length: undefined
                }, options || {}),
                space = opt.max - opt.char.length;
            if (str.length <= opt.max) {
                return str;
            } else if (opt.charpos === 'end') {
                return str.substr(0, opt.max - opt.char.length) + opt.char;
            } else {
                //fix invalid length
                if (!opt.length || opt.length * 2 > space) {
                    //save space for ellipse char
                    opt.length = (space % 2 === 0 ? space  / 2 : (opt.max / 2) - 1) || 1;
                }
                return str.substr(0, opt.length).trim() + opt.char + str.substr(str.length - opt.length).trim();
            }
        },

        /**
         * Normalizes newlines in given string and replaces newlines with <br>
         * This can be safely used without risking CSS.
         * @param {string} text
         * @param {object} jQuery node
         * @return {object} jQuery node
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
         * @return {function} debonced version of func
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
                } else {
                    timeout = setTimeout(later, remaining);
                }
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
                return String(s).replace(/\./g, '\\.');
            }

            function decode(s) {
                // find first unescaped dot
                s = String(s);
                var pos = s.search(/([^\\])\./);
                if (pos === -1) {
                    return { id: s };
                } else {
                    return {
                        folder_id: s.substr(0, pos + 1).replace(/\\(\\?)/g, '$1'),
                        id: s.substr(pos + 2).replace(/\\(\\?)/g, '$1')
                    };
                }
            }

            return function (o) {
                var tmp, r = 'recurrence_position', m, f;
                if (typeof o === 'string') {
                    // integer based ids?
                    if ((m = o.match(/^(\d*?)\.(\d+)(\.(\d+))?$/)) && m.length) {
                        tmp = { folder_id: String(m[1]), id: String(m[2])};
                        if (m[4] !== undefined) { tmp[r] = parseInt(m[4], 10); }
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
                    } else {
                        if (f !== undefined) { tmp = encode(f) + '.' + tmp; }
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
                if (obj && prop && _.isString(prop))
                    tmp[obj[prop]] = obj;
            });
            return tmp;
        },

        noI18n: !_.url.hash('debug-i18n') ? _.identity : function (text) {
            return '\u200b' + String(text).replace(/[\u200b\u200c]/g, '') + '\u200c';
        }
    });

    _.noI18n.fix = !_.url.hash('debug-i18n') ? _.identity : function (text) {
        return text.replace(/^\u200b|\u200c$/g, '');
    };

    _.noI18n.text = function () {
        return _(arguments).reduce(function (memo, str) {
            return memo.add($.txt(_.noI18n(str)));
        }, $());
    };

    _.escapeRegExp = function (s) {
        return (s || '').replace(/([|^$\\.*+?()[\]{}])/g, '\\$1');
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
        return (html || '').replace(/&(?:(\w+)|#x([0-9A-Fa-f]+)|#(\d+));/g,
                            function (original, entity, hex, dec) {
                                return entity ? _.unescapeHTML.entities[entity] || original :
                                       hex    ? String.fromCharCode(parseInt(hex, 16)) :
                                                String.fromCharCode(parseInt(dec, 10));
                            });
    };

    /* jshint -W015 */
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
    /* jshint +W015 */

}());
