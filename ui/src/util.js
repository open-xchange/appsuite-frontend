/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

(function () {

    "use strict";

    // shortcut
    var slice = Array.prototype.slice,
        // deserialize
        deserialize = function (str, delimiter) {
            var pairs = (str || "").split(delimiter === undefined ? "&" : delimiter);
            var i = 0, $l = pairs.length, pair, obj = {}, d = decodeURIComponent;
            for (; i < $l; i++) {
                pair = pairs[i];
                var keyValue = pair.split(/\=/), key = keyValue[0], value = keyValue[1];
                if (key !== "" || value !== undefined) {
                    obj[d(key)] = value !== undefined ? d(value) : undefined;
                }
            }
            return obj;
        },
        // stupid string rotator
        rot = function (str, shift) {
            return _(String(str).split("")).map(function (i) {
                return String.fromCharCode(i.charCodeAt(0) + shift);
            }).join("");
        },
        // get query
        queryData = deserialize(document.location.search.substr(1), /&/),
        // local timezone offset
        timezoneOffset = (new Date()).getTimezoneOffset() * 60 * 1000,

        // taken from backbone
        Class = function () {},
        inherits = function (parent, protoProps, staticProps) {

            var ExtendableClass;

            // The constructor function for the new subclass is either defined by you
            // (the "constructor" property in your `extend` definition), or defaulted
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

     // supported browsers
    _.browserSupport = {
        'Chrome': '20',
        'Safari': '5',
        'Firefox': '10',
        'IE': '9'
    };

    // browser detection - adopted from prototype.js
    var ua = navigator.userAgent,
        isOpera = Object.prototype.toString.call(window.opera) === "[object Opera]",
        webkit = ua.indexOf('AppleWebKit/') > -1,
        chrome = ua.indexOf('Chrome/') > -1;

    // add namespaces
    _.browser = {
        /** is IE? */
        IE: navigator.appName !== "Microsoft Internet Explorer" ? undefined
            : Number(navigator.appVersion.match(/MSIE (\d+\.\d+)/)[1]),
        /** is Opera? */
        Opera: isOpera ? ua.split('Opera/')[1].split(' ')[0].split('.')[0]: undefined,
        /** is WebKit? */
        WebKit: webkit,
        /** Safari */
        Safari: webkit && !chrome ? ua.split('AppleWebKit/')[1].split(' ')[0].split('.')[0]: undefined,
        /** Chrome */
        Chrome: webkit && chrome ? ua.split('Chrome/')[1].split(' ')[0].split('.')[0] : undefined,
        /** is Firefox? */
        Firefox:  (ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1) ? ua.split('Firefox/')[1].split('.')[0] : undefined,
        /** MacOS **/
        MacOS: ua.indexOf('Macintosh') > -1,
        /** iOS **/
        iOS: !!navigator.userAgent.match(/(iPad|iPhone|iPod)/i)
    };

    // extend underscore utilities
    _.mixin({

        /**
         * Serialize object (key/value pairs) to fit into URLs (e.g. a=1&b=2&c=HelloWorld)
         * @param {Object} obj Object to serialize
         * @param {string} [delimiter] Delimiter
         * @returns {string} Serialized object
         * @example
         * _.serialize({ a: 1, b: 2, c: "text" });
         */
        serialize: function (obj, delimiter, replacer) {
            var tmp = [], e = replacer || encodeURIComponent, id;
            if (typeof obj === "object") {
                for (id in (obj || {})) {
                    tmp.push(e(id) + (obj[id] !== undefined ? "=" + e(obj[id]) : ""));
                }
            }
            return tmp.join(delimiter === undefined ? "&" : delimiter);
        },

        /**
         * Deserialize object (key/value pairs)
         * @param {string} str String to deserialize
         * @param {string} [delimiter] Delimiter
         * @returns {Object} Deserialized object
         * @function
         * @name _.deserialize
         * @example
         * _.deserialize("a=1&b=2&c=text");
         */
        deserialize: deserialize
    });

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
                     hashData.substr(0, 1) === "?" ? rot(decodeURIComponent(hashData.substr(1)), -1) : hashData
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
                    return v.replace(/\=/g, '%3D').replace(/\&/g, '%26');
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
            location.href = _.url.get(path);
        },

        get: function (path) {
            var l = location;
            return l.protocol + "//" + l.host + l.pathname.replace(/\/[^\/]*$/, "/" + path);
        }
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

        setCookie: function (key, value) {
            // yep, works this way:
            document.cookie = key + "=" + encodeURIComponent(value);
        },

        /**
         * This function simply writes its parameters to console.
         * Useful to debug callbacks, e.g. event handlers.
         * @returns {Object} First parameter to support inline inspecting
         * @example
         * http.GET({ module: "calendar", params: { id: 158302 }, success: _.inspect });
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
         * Returns current time as UTC timestamp
         * @returns {long} Timestamp
         */
        utc: function () {
            return (new Date()).getTime() - timezoneOffset;
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
         * "Lastest function only
         * Works with non-anonymous functions only
         */
        lfo: function () {
            // call counter
            var curry = slice.call(arguments),
                fn = curry.shift(),
                count = (fn.count = (fn.count || 0) + 1);
            // wrap
            return function () {
                var args = slice.call(arguments);
                setTimeout(function () {
                    if (count === fn.count) {
                        fn.apply(fn, curry.concat(args));
                    }
                }, 0);
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
                    args = $.makeArray(arguments);

                queue.push(def);

                last.done(function () {
                    fn.apply(null, args).done(function () {
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
            // is array?
            if (!_.isArray(params)) {
                params = slice.call(arguments, 1);
            }
            var index = 0;
            return String(str)
                .replace(
                    /%(([0-9]+)\$)?[A-Za-z]/g,
                    function (match, pos, n) {
                        if (pos) {
                            index = n - 1;
                        }
                        return params[index++];
                    }
                )
                .replace(/%%/, "%");
        },

        /**
         * Format error
         */
        formatError: function (e, formatString) {
            return _.printf(
                formatString || "Error: %1$s (%2$s, %3$s)",
                _.printf(e.error, e.error_params),
                e.code,
                e.error_id
            );
        },

        // good for leading-zeros for example
        pad: function (val, length, fill) {
            var str = String(val), n = length || 1, diff = n - str.length;
            return (diff > 0 ? new Array(diff + 1).join(fill || "0") : "") + str;
        },

        ellipsis: function (str, length) {
            str = String(str || '');
            return str.length > length ? str.substr(0, length - 4) + ' ...' : str;
        },

        // makes sure you have an array
        getArray: function (o) {
            return _.isArray(o) ? o : [o];
        },

        // call function 'every' 1 hour or 5 seconds
        tick: function (num, type, fn) {
            var interval = 1000;
            if (type === "hour") {
                interval *= 3600;
            } else if (type === "minute") {
                interval *= 60;
            }
            // wait until proper clock tick
            setTimeout(function () {
                fn();
                setInterval(fn, interval * (num || 1));
            }, interval - (_.utc() % interval) + 1);
        },

        wait: function (t) {
            var def = $.Deferred();
            setTimeout(function () {
                def.resolve();
                def = null;
            }, t || 0);
            return def;
        },

        makeExtendable: (function () {
            return function (parent) {
                parent.extend = function (protoProps, classProps) {
                    var child = inherits(this, protoProps, classProps);
                    child.extend = this.extend;
                    return child;
                };
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
                var tmp, r = 'recurrence_position', split, m, f;
                if (typeof o === 'string') {
                    // integer based ids?
                    if ((m = o.match(/^(\d*?)\.(\d+)(\.(\d+))?$/)) && m.length) {
                        tmp = { folder_id: String(m[1]), id: m[2] + '' };
                        if (m[4] !== undefined) { tmp[r] = m[4] + ''; }
                        return tmp;
                    }
                    // character based? (double tuple)
                    return decode(o);
                } else if (typeof o === 'object' && o !== null) {
                    // join
                    tmp = encode(o.id);
                    f = o.folder_id !== undefined ? o.folder_id : o.folder;
                    if (f !== undefined) { tmp = encode(f) + '.' + tmp; }
                    if (o[r] !== undefined && o[r] !== null) { tmp += '.' + encode(o[r]); }
                    return tmp;
                }
            };
        }()),

        // if someone has a better name ...
        isSet: function (o) {
            return o !== null && o !== undefined && o !== '';
        },

        fallback: function (o, defaultValue) {
            return _.isSet(o) ? o : defaultValue;
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



    window.assert = function (value, message) {
        if (value) return;
        console.error(message || 'Assertion failed!');
        if (console.trace) console.trace();
    };
    try {
        if (assert(true) === 0) delete window.assert; // Available only in debug builds
    } catch (e) {
        // do nothing if delete fails (this happens on IE8 -_-)
    }

}());
