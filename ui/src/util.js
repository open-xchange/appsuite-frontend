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

    // browser detection
    // adopted from prototype.js
    var ua = navigator.userAgent,
        isOpera = Object.prototype.toString.call(window.opera) === "[object Opera]",
        webkit = ua.indexOf('AppleWebKit/') > -1,
        chrome = ua.indexOf('Chrome/') > -1,
        // shortcut
        slice = Array.prototype.slice,
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

    // add namespaces
    _.browser = {
        /** is IE? */
        IE: navigator.appName !== "Microsoft Internet Explorer" ? undefined
            : Number(navigator.appVersion.match(/MSIE (\d+\.\d+)/)[1]),
        /** is Opera? */
        Opera: isOpera,
        /** is WebKit? */
        WebKit: webkit,
        /** Safari */
        Safari: webkit && !chrome,
        /** Chrome */
        Chrome: webkit && chrome,
        /** is Firefox? */
        Firefox:  ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
        /** MacOS **/
        MacOS: ua.indexOf('Macintosh') > -1
    };

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
        hash: function (name, value) {
            // since the hash might change we decode it for every request
            var hashData = document.location.hash.substr(1);
            hashData = deserialize(
                 hashData.substr(0, 1) === "?" ? rot(decodeURIComponent(hashData.substr(1)), -1) : hashData
            );
            if (value !== undefined) {
                if (value === null) {
                    delete hashData[name];
                } else {
                    hashData[name] = value;
                }
                // update hash
                var hashStr = _.serialize(hashData, '&', function (v) {
                    return v.replace(/\=/g, '%3D').replace(/\&/g, '%26');
                });
                // be persistent
                document.location.hash = hashStr;
                _.setCookie('hash', hashStr);
            } else {
                return name === undefined ? hashData : hashData[name];
            }
        },
        /**
         * Redirect
         */
        redirect: function (path) {
            var l = location, href = l.protocol + "//" + l.host + l.pathname.replace(/\/[^\/]*$/, "/" + path);
            location.href = href;
        }
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
        deserialize: deserialize,

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
                    return pair.substr(key.length + 1);
                })
                .first()
                .value();
        },

        setCookie: function (key, value) {
            // yep, works this way:
            document.cookie = key + "=" + value;
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
            args.unshift("Inspect");
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
                            tmp[i] = deep && typeof prop === 'object' ? copy(prop, deep) : prop;
                        }
                        return tmp;
                    };

            return function (elem, deep) {
                return typeof elem !== 'object' ? elem : copy(elem, !!deep);
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

        prewrap: function (text) {
            return String(text).replace(/([\/\.\,\-]+)/g, "$1\u200B");
        },

        // good for leading-zeros for example
        pad: function (val, length, fill) {
            var str = String(val), n = length || 1, diff = n - str.length;
            return (diff > 0 ? new Array(diff + 1).join(fill || "0") : "") + str;
        },

        // call function 'every' 1 hour or 5 seconds
        every: function (num, type, fn) {
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
        }())
    });

}());
