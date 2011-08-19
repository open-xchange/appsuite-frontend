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

define("io.ox/core/base", function () {
    
    /**
     * @name ox.browser
     * @namespace
     */
    ox.browser = (function () {
        // adopted from prototype.js
        var ua = navigator.userAgent,
            isOpera = Object.prototype.toString.call(window.opera) === "[object Opera]",
            isIE = !!window.attachEvent && !isOpera,
            webkit = ua.indexOf('AppleWebKit/') > -1,
            chrome = ua.indexOf('Chrome/') > -1;
        return {
            /** @lends ox.browser */
            /** is IE? */
            IE: !!window.attachEvent && !isOpera,
            /** is IE9? */
            IE9:    isIE && /MSIE 9/.test(ua),
            /** is Opera? */
            Opera: isOpera,
            /** is WebKit? */
            WebKit: webkit,
            /** Safari */
            Safari: webkit && !chrome,
            /** Safari */
            Chrome: webkit && chrome,
            /** is Gecko/Firefox? */
            Gecko:  ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
            /** MacOS **/
            MacOS: ua.indexOf('Macintosh') > -1
        };
    }());
    
    /**
     * @name ox.util
     * @namespace
     */
    ox.util = (function () {
        
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
        
        // get hash & query
        var queryData = deserialize(document.location.search.substr(1), /&/);
        var hashData = deserialize(document.location.hash.substr(1), /&/);
        
        return {
            
            /**
             * @param {string} [name] Name of the hash parameter
             * @returns {Object} Value or all values
             */
            getHash: function (name) {
                return name === undefined ? hashData : hashData[name];
            },
        
            /**
             * @param name {string} [Name] of the query parameter
             * @returns {Object} Value or all values
             */
            getParam: function (name) {
                return name === undefined ? queryData : queryData[name];
            },
            
            /**
              * Get a new empty array (constructed by current window; useful in IE for cross-window issues)
              * @returns {Array} New empty array
              * @example
              * var tmp = ox.util.getArray(); // simply returns []
              */
            getArray: function () {
                return [];
            },
            
            /**
             * Serialize object (key/value pairs) to fit into URLs (e.g. a=1&b=2&c=HelloWorld)
             * @param {Object} obj Object to serialize
             * @param {string} [delimiter] Delimiter
             * @returns {string} Serialized object
             * @example
             * ox.util.serialize({ a: 1, b: 2, c: "text" });
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
             * @name ox.util.deserialize
             * @example
             * ox.util.deserialize("a=1&b=2&c=text");
             */
            deserialize: deserialize,
            
            /**
             * This function simply writes its parameters to console.
             * Useful to debug callbacks, e.g. event handlers.
             * @example
             * ox.api.calendar.httpGet({ params: { id: 158302 }, success: ox.util.inspect });
             */
            inspect: function () {
                var args = jQuery.makeArray(arguments); // $ is not jQuery here
                args.unshift("Inspect");
                console.debug.apply(console, args);
            },
            
            /**
             * Create absolute URL
             * @param {string} url (relative/absolute) URL
             * @returns {string} Absolute URL
             * @example
             * ox.util.getAbsoluteURL("index.html"); // returns protocol://host/path/index.html
             * ox.util.getAbsoluteURL("/index.html"); // returns protocol://host/index.html
             * ox.util.getAbsoluteURL("http://localhost/foo/index.html"); // returns http://localhost/foo/index.html
             */
            getAbsoluteURL: function (url) {
                // change?
                if (url.search(/^http/) !== -1) {
                    return url;
                } else {
                    var l = window.location;
                    if (url.substr(0, 1) === "/") {
                        // add protocol & host
                        return l.protocol + "//" + l.host + url;
                    } else {
                        // strip file & inject version
                        return l.href.replace(/\/[^\/]+$/, "/") + ox.api.window.core.oxProductInfo.build + "/" + url;
                    }
                }
            },
            
            /**
             * Check whether an object is an array
             * @param {Object} obj The object to test
             * @returns {boolean} True/False
             */
            isArray: function (obj) {
                // we cannot use 'elem.constructor === array' under SELENIUM (permission denied error).
                // so, we simply rely on the existence of length, splice, and push.
                // We even cannot test if they are functions (does not work in IE).
                // For the same reason, Object.prototype.toString.call(elem) == "[Object Array]" does not 
                // work across windows. However, a browser thinks that an object is an array if it 
                // has "length" and "splice". So we just look for those properties.
                return obj && obj.length !== undefined && obj.splice !== undefined && obj.push !== undefined;
            },
            
            /**
             * Check whether an object is an array
             * @param {Object} obj The object to test
             * @returns {boolean} True/False
             */
            isFunction: (function () {
                return function (obj) {
                    // fix checks across window boundaries
                    return obj && obj.apply !== undefined && obj.call !== undefined;
                };
            }()),
            
            /**
             * Simple test to check whether an object is an instance of Window or a DOM node
             * @param {Object} obj The object to test
             * @returns {boolean} True/False
             */
            isDOMObject: function (obj) {
                // not null, not undefined, but DOM node or window 
                return obj && (obj.nodeType || obj.setInterval);
            },
            
            /**
             * Simple test to check whether an object is a plain object
             * @param {Object} obj The object to test
             * @returns {Boolean} True/False
             */
            isPlainObject: function (obj) {
                // jQuery provides a more precise method but this one works across windows
                var toString = Object.prototype.toString;
                return obj && toString.call(obj) === "[object Object]" && !obj.nodeType && !obj.setInterval;
            },
            
            /**
             * Call function if first parameter is a function (simplifies callbacks)
             * @param {function ()} fn Callback
             */
            call: function (fn) {
                if (typeof fn === "function" || (ox.browser.IE === true && ox.util.isFunction(fn))) {
                    var i = 1, $l = arguments.length, args = [];
                    for (; i < $l; i++) {
                        args.push(arguments[i]);
                    }
                    return fn.apply(fn, args);
                }
            },
            
            /**
             * Call "new" in other windows
             */
            create: function () {
                // create new helper class
                var Fn = function () {};
                // get arguments
                var args = jQuery.makeArray(arguments);
                // get class
                var Class = args.shift();
                // inherit
                Fn.prototype = Class.prototype;
                // create object
                var obj = new Fn();
                // apply
                Class.apply(obj, args);
                // return new instance
                return obj;
            },
            
            /**
             * Return the first parameter that is not undefined
             */
            firstOf: function () {
                var args = jQuery.makeArray(arguments), i = 0, $l = args.length;
                for (; i < $l; i++) {
                    if (args[i] !== undefined) {
                        return args[i];
                    }
                }
                return undefined;
            },
            
            /**
             * Return current time as timestamp
             * @returns {long} Timestamp
             */
            now: function () {
                return new Date().getTime();
            },
            
            /**
             * Get flat list of all keys (deep)
             */
            keys: function (obj, list) {
                // loop
                var tmp = list || [], deep = list !== false, id, o;
                if (obj) {
                    for (id in obj) {
                        // add
                        tmp.push(id);
                        // recursion
                        if (deep) {
                            o = obj[id];
                            if (typeof o === "object" && o !== null) {
                                ox.util.keys(o, tmp);
                            }
                        }
                    }
                }
                return tmp;
            },
        
            /**
             * Get flat list of all values
             */
            values: function (obj) {
                // loop
                var tmp = [], id;
                if (obj) {
                    for (id in obj) {
                        // add
                        tmp.push(obj[id]);
                    }
                }
                return tmp;
            },
        
            /**
             * Clone object
             * @param {Object} elem Object to clone
             * @returns {Object} Its clone
             */
            clone: function clone(elem) {
                if (typeof elem !== "object") {
                    return elem;
                } else {
                    var isArray = ox.util.isArray;
                    var isDOMObject = ox.util.isDOMObject;
                    var subclone = function (elem) {
                        if (!elem) {
                            return null;
                        } else {
                            var tmp = isArray(elem) ? [] : {}, prop, i;
                            for (i in elem) {
                                prop = elem[i];
                                tmp[i] = typeof prop === "object" && !isDOMObject(prop) ? subclone(prop) : prop;
                            }
                            return tmp;
                        }
                    };
                    return subclone(elem);
                }
            },
            
            /**
             * Identity function. Returns the object as is.
             */
            identity: function (o) {
                return o;
            },
            
            /**
             * CSSStyleDeclaration selector. Returns the class object.
             * @param className the ClassName you will select
             * @return {Object} CSSStyleDeclaration
             */
            modifyCSSClass: function(className) {
                var stylesheet = document.styleSheets[0];
                for (var i = 0; i < document.styleSheets.length; i++) {
                    var stylesheet = document.styleSheets[i];
                    var rules = stylesheet.cssRules || stylesheet.rules;
                    for (var ia = 0; ia < rules.length; ia++) {
                        var cssClass = rules[ia];
                        if ((cssClass.selectorText || "").match(className)) {
                            return cssClass;
                        }
                    };
                };
                return {};
            },
            
            /**
             * Format
             */
            printf: function (str, params) {
                // is array?
                if (!ox.util.isArray(params)) {
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
                return ox.util.printf(
                    formatString || "Error: %1$s (%2$s, %3$s)",
                    ox.util.printf(e.error, e.error_params),
                    e.code,
                    e.error_id
                );
            }
        };
        
    }());
    
    /**
     * API: session
     */
    ox.api.session = (function () {
        
        return {
            
            autoLogin: function () {
                // GET request
                return ox.api.http.GET({
                    module: "login",
                    appendColumns: false,
                    appendSession: false,
                    processData: false,
                    timeout: 3000, // just try that for 3 secs
                    params: {
                        action: "autologin",
                        client: "com.openexchange.ox.gui.dhtml"
                    }
                })
                .done(function (data) {
                    // store session
                    ox.session = data.session;
                });
            },
            
            login: function (username, password, store) {
                // POST request
                return ox.api.http.POST({
                    module: "login",
                    appendColumns: false,
                    appendSession: false,
                    processData: false,
                    params: {
                        action: "login",
                        name: username,
                        password: password
                    }
                })
                .done(function (data) {
                    // store session
                    ox.session = data.session;
                    // set permanent cookie
                    if (store) {
                        ox.api.session.store();
                    }
                });
            },
            
            store: function () {
                // GET request
                return ox.api.http.GET({
                    module: "login",
                    appendColumns: false,
                    processData: false,
                    params: {
                        action: "store"
                    }
                });
            },
            
            logout: function () {
                // POST request
                return ox.api.http.POST({
                    module: "login",
                    appendColumns: false,
                    processData: false,
                    params: {
                        action: "logout"
                    }
                });
            }
        };
        
    }());
    
    /**
     * Quick settings for application windows
     */
    $.quickSettings = (function () {
        
        return function (containerSelector, configSelector, link) {
            
            var container = $(containerSelector);
            var config = $(configSelector);
            
            link = $(link);
            
            if (!config.hasClass("quick-settings")) {
                // adjust container
                container.css({
                    position: "absolute",
                    zIndex: 2
                });
                // remember top position
                container.data("top", parseInt(container.css("top") || 0, 10));
                // adjust settings area
                config.addClass("quick-settings").css({
                    position: "absolute",
                    zIndex: 1,
                    top: (config.css("top") || 0) + "px",
                    right: "0px",
                    height: "auto",
                    left: "0px",
                    minHeight: "100px"
                });
            }
            
            // rebind events
            link.unbind("click")
                .bind("dblclick", false)
                .bind("click", function (e) {
                    window.container = container;
                    window.config = config;
                    // open
                    var top = container.data("top");
                    if (link.data("open") !== true) {
                        link.data("open", true);
                        config.show();
                        var h = Math.max(config.outerHeight(), 25);
                        container.stop().animate({ top: (top + h) + "px" }, 250);
                    } else {
                        link.data("open", false);
                        container.stop().animate({ top: top + "px" }, 250, function () {
                            config.hide();
                        });
                    }
                    return false;
                });
        };
    }());
    
    /**
     * Core UI
     */
    ox.ui.getWindow = (function () {

        var guid = 0;

        return function (options) {
            
            var opt = $.extend({
                id: "window-" + guid,
                width: 0,
                title: "Window #" + guid
            }, options);

            // get width
            var meta = (String(opt.width).match(/^(\d+)(px|%)$/) || ["", "100", "%"]).splice(1),
                width = meta[0],
                unit = meta[1],
                win, head, toolbar, body, settingsControl, settings, content;

            // window container
            win = $("<div/>")
                .attr({
                    id: opt.id,
                    "data-window-nr": guid
                })
                .addClass("window-container")
                .append(
                    $("<div/>")
                        //.hide()
                        .addClass("window-container-center")
                        .data({
                            width: width + unit
                        })
                        .css({
                            width: width + unit
                        })
                        .append(
                            // window HEAD
                            head = $("<div/>")
                                .addClass("window-head")
                                .append(
                                    // title
                                    $("<div/>")
                                        .addClass("window-title")
                                        .text(opt.title)
                                )
                                .append(
                                    // toolbar
                                    toolbar = $("<div/>").addClass("window-toolbar")
                                )
                                .append(
                                    // controls
                                    $("<div/>")
                                        .addClass("window-controls")
                                        .append(
                                            // settings
                                            settingsControl = $("<div/>")
                                                .addClass("window-control")
                                                .text("\u270E")
                                        )
                                        .append(
                                            // close
                                            $("<div/>")
                                                .addClass("window-control")
                                                .text("\u2715")
                                        )
                                )
                        )
                        .append(
                            // window BODY
                            body = $("<div/>")
                                .addClass("window-body")
                                .append(
                                    // quick settings
                                    settings = $("<div/>")
                                        .hide()
                                        .addClass("window-settings")
                                        .html("<h2>Each window can have a quick settings area</h2>")
                                )
                                .append(
                                    // content
                                    content = $("<div/>").addClass("window-content")
                                )
                        )
                );
            
            // inc
            guid++;
            
            // quick settings
            $.quickSettings(content, settings, settingsControl);
            
            // add to DOM
            win.appendTo("#io-ox-windowmanager").show();
            
            // return window object
            return content;
        };
        
    }());
    
    return {};
    
});
