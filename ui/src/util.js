/**
 * 
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
 * 
 */

(function () {
    
    // browser detection
    // adopted from prototype.js
    var ua = navigator.userAgent,
        isOpera = Object.prototype.toString.call(window.opera) === "[object Opera]",
        webkit = ua.indexOf('AppleWebKit/') > -1,
        chrome = ua.indexOf('Chrome/') > -1;
        
    // deserialize
    var deserialize = function (str, delimiter) {
        var pairs = (str || "").split(delimiter === undefined ? "&" : delimiter);
        var i = 0, $l = pairs.length, pair, obj = {}, d = decodeURIComponent;
        for (; i < $l; i++) {
            pair = pairs[i];
            var keyValue = pair.split(/\=/), key = keyValue[0], value = keyValue[1];
            if (key !== "" || value !== undefined) {
                obj[d(key)] = d(value);
            }
        }
        return obj;
    };
    
    // stupid string rotator
    var rot = function (str, shift) {
        return _(String(str).split("")).map(function (i) { return String.fromCharCode(i.charCodeAt(0) + shift); }).join("");
    };
    
    // get hash & query
    var queryData = deserialize(document.location.search.substr(1), /&/),
        hashData = document.location.hash.substr(1);
    
    // decode
    hashData = deserialize(hashData.substr(0, 1) === "?" ? rot(decodeURIComponent(hashData.substr(1)), -1) : hashData);
    
    // extend underscore utilities
    _.extend(_, {
        
        browser: {
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
        },
        
        /**
         * Serialize object (key/value pairs) to fit into URLs (e.g. a=1&b=2&c=HelloWorld)
         * @param {Object} obj Object to serialize
         * @param {string} [delimiter] Delimiter
         * @returns {string} Serialized object
         * @example
         * _.serialize({ a: 1, b: 2, c: "text" });
         */
        serialize: function (obj, delimiter) {
            var tmp = [], e = encodeURIComponent, id;
            if (typeof obj === "object") {
                for (id in (obj || {})) {
                    if (obj[id] !== undefined) {
                        tmp.push(e(id) + "=" + e(obj[id]));
                    }
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
        
        url: {
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
            hash: function (name) {
                return name === undefined ? hashData : hashData[name];
            },
            
            /**
             * Redirect
             */
            redirect: function (path) {
                var l = location, href = l.protocol + "//" + l.host + l.pathname.replace(/\/[^\/]*$/, "/" + path);
                location.href = href;
            }
        },
        
        /**
         * This function simply writes its parameters to console.
         * Useful to debug callbacks, e.g. event handlers.
         * @returns {Object} First parameter to support inline inspecting
         * @example
         * http.GET({ module: "calendar", params: { id: 158302 }, success: _.inspect });
         */
        inspect: function (first) {
            var args = $.makeArray(arguments);
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
         * Return current time as timestamp
         * @returns {long} Timestamp
         */
        now: function () {
            return (new Date()).getTime();
        },
        
        /**
         * Return the first parameter that is not undefined
         */
        firstOf: function () {
            var args = $.makeArray(arguments), i = 0, $l = args.length;
            for (; i < $l; i++) {
                if (args[i] !== undefined) {
                    return args[i];
                }
            }
            return undefined;
        },
        
        /**
         * Clone object
         * @param {Object} elem Object to clone
         * @returns {Object} Its clone
         */
        deepClone: function (elem) {
            if (typeof elem !== "object") {
                return elem;
            } else {
                var subclone = function (elem) {
                    if (!elem) {
                        return null;
                    } else {
                        var tmp = _.isArray(elem) ? [] : {}, prop, i;
                        for (i in elem) {
                            prop = elem[i];
                            tmp[i] = typeof prop === "object" && !_.isElement(prop) ? subclone(prop) : prop;
                        }
                        return tmp;
                    }
                };
                return subclone(elem);
            }
        },
        
        /**
         * "Lastest function only
         * Works with non-anonymous functions only
         */
        lfo: function () {
            // call counter
            var curry = $.makeArray(arguments),
                fn = curry.shift(),
                count = (fn.count = (fn.count || 0) + 1);
            // wrap
            return function () {
                var args = arguments;
                setTimeout(function () {
                    if (count === fn.count) {
                        fn.apply(fn, $.merge(curry, args));
                    }
                }, 0);
            };
        },
        
        /**
         * Format
         */
        printf: function (str, params) {
            // is array?
            if (!_.isArray(params)) {
                params = $.makeArray(arguments).slice(1);
            }
            var index = 0;
            return String(str)
                .replace(
                    /%(([0-9]+)\$)?[A-Za-z]/g,
                    function (match, pos, n) {
                        if (pos) { index = n - 1; }
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
        }
    });
    
}());