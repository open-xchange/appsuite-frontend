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
            webkit = ua.indexOf('AppleWebKit/') > -1,
            chrome = ua.indexOf('Chrome/') > -1;
        return {
            /** @lends ox.browser */
            /** is IE? */
            IE: navigator.appName !== "Microsoft Internet Explorer" ? undefined
                : Number(navigator.appVersion.match(/MSIE (\d+\.\d+)/)[1]),
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
             * "Lastest function only
             * Works with non-anonymous functions only
             */
            lfo: function () {
                // call counter
                var args = $.makeArray(arguments),
                    fn = args.shift(),
                    count = (fn.count = (fn.count || 0) + 1);
                // wrap
                return function () {
                    if (count === fn.count) {
                        fn.apply(fn, $.merge(args, arguments));
                    }
                };
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
                    ox.user = "matthias.biggeleben"; // YEAH!
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
                    ox.user = username;
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
    
    // current window
    var currentWindow = null;
    
    // ref to core screen
    var core = $("#io-ox-core"),
        // left bar
        leftBar = $("<div/>", { id: "io-ox-leftbar" }).addClass("io-ox-launchbar"),
        // right bar
        rightBar = $("<div/>", { id: "io-ox-rightbar" }).addClass("io-ox-launchbar"),
        // add launcher
        addLauncher = function (side, label, icon, fn) {
            // construct
            var node = $("<div/>").addClass("launcher")
                .append(
                    $("<div/>")
                        .addClass("label")
                        .text(label)
                )
                .bind("click", fn || function () {
                    // just for develepment purposes
                    $(this).stop(true, true).effect("shake", { direction: "left", times: 4, distance: 10 }, 50);
                });
            // has icon?
            if (icon) {
                // add icon
                node.prepend(
                    $("<img/>", { src: icon }).addClass("icon")
                );
            } else {
                // add placeholder
                node.prepend(
                    $("<div/>").addClass("icon")
                );
            }
            // add
            var c = currentWindow, target;
            if (side === "left" && c && c.app && (target = c.app.getLaunchBarIcon())) {
                // animate space
                node.hide().insertAfter(target).fadeIn(1000);
            } else {
                // just add
                (side === "left" ? leftBar : rightBar).append(node);
            }
            return node;
        };
        
    // add bars and show
    core.append(leftBar).append(rightBar).show();
    
    /**
     * Create app
     */
    ox.ui.createApp = (function () {
        
        function App(options) {
            
            var opt = $.extend({
                title: "",
                icon: null
            }, options || {});
            
            // dummy function
            var dummyFn = function () {
                    return $.Deferred().resolve();
                },
                // launcher function
                launchFn = dummyFn,
                // launchbar icon
                launchbarIcon = null,
                // quit function
                quitFn = dummyFn,
                // app main window
                win = null,
                // running
                running = false,
                // self
                self = this;
            
            this.getInstance = function () {
                return self; // not this!
            };
            
            this.setLaunchBarIcon = function (node) {
                launchbarIcon = node;
                return this;
            };
            
            this.getLaunchBarIcon = function () {
                return launchbarIcon;
            };
            
            this.setLauncher = function (fn) {
                launchFn = fn;
                return this;
            };
            
            this.setQuit = function (fn) {
                quitFn = fn;
                return this;
            };
            
            this.setWindow = function (w) {
                win = w;
                win.app = this;
                return this;
            };
            
            this.launch = function () {
                if (!running) {
                    // mark as running
                    running = true;
                    // needs launch bar icon?
                    if (!launchbarIcon) {
                        launchbarIcon = addLauncher(
                            "left", opt.title, opt.icon, self.launch
                        );
                    }
                    // go!
                    return (launchFn() || $.Deferred().resolve());
                    
                } else if (win) {
                    // toggle app window
                    win.toggle();
                    return $.Deferred().resolve();
                }
            };
            
            this.quit = function () {
                // call quit function
                var def = quitFn() || $.Deferred().resolve();
                return def.done(function () {
                    // mark as not running
                    running = false;
                    // destroy launchbar icon
                    if (launchbarIcon) {
                        launchbarIcon.fadeOut(500, function () {
                            launchbarIcon.remove();
                            launchbarIcon = null;
                        });
                    }
                    // destroy window
                    if (win) {
                        win.destroy();
                    }
                    // don't leak
                    self = win = launchFn = quitFn = null;
                });
            };
        }
        
        return function (options) {
            return new App(options);
        };
        
    }());
    
    /**
     * Create window
     */
    ox.ui.createWindow = (function () {

        // window guid
        var guid = 0,
        
            // fullscreen mode
            autoFullscreen = false,
            fullscreen = false,
            
            // toggle fullscreen mode
            toggleFullscreen = function () {
                if (!fullscreen) {
                    // grow
                    $("#io-ox-leftbar, #io-ox-rightbar").hide();
                    $("#io-ox-windowmanager").addClass("fullscreen");
                } else {
                    // shrink
                    $("#io-ox-windowmanager").removeClass("fullscreen");
                    $("#io-ox-leftbar, #io-ox-rightbar").show();
                }
                fullscreen = !fullscreen;
            },
            
            interruptFullscreen = function () {
                if (fullscreen) {
                    toggleFullscreen();
                    autoFullscreen = true;
                }
            },
            
            // window class
            Window = function (id) {
                
                this.id = id;
                this.nodes = {};
                this.search = { query: "" };
                this.app = null;
                
                var quitOnClose = false;
                
                this.show = function () {
                    if (currentWindow !== this) {
                        // show
                        if (currentWindow) {
                            currentWindow.hide();
                        }
                        // auto fullscreen?
                        if (autoFullscreen) {
                            toggleFullscreen();
                            autoFullscreen = false;
                        }
                        this.nodes.outer.appendTo("#io-ox-windowmanager");
                        currentWindow = this;
                        this.trigger("show");
                    }
                };
                
                this.hide = function () {
                    this.nodes.outer.detach();
                    currentWindow = null;
                    this.trigger("hide");
                    interruptFullscreen();
                };
                
                this.toggle = function () {
                    if (currentWindow === this) {
                        this.hide();
                    } else {
                        this.show();
                    }
                };
                
                this.close = function () {
                    if (quitOnClose && this.app !== null) {
                        this.app.quit()
                            .done(function () {
                                interruptFullscreen();
                            });
                    } else {
                        this.hide();
                    }
                };
                
                this.destroy = function () {
                    if (currentWindow === this) {
                        currentWindow = null;
                    }
                    this.nodes.outer.remove();
                    this.app.win = null;
                    this.app = null;
                    this.nodes = null;
                };
                
                this.setQuitOnClose = function (flag) {
                    quitOnClose = !!flag;
                };
                
                var self = this, title = "", subtitle = "";
                
                function applyTitle () {
                    var spans = self.nodes.title.find("span");
                    spans.eq(0).text(
                        title + (subtitle === "" ? "" : " - ")
                    );
                    spans.eq(1).text(subtitle);
                }
                
                this.setTitle = function (str) {
                    title = String(str);
                    applyTitle();
                };
                
                this.setSubTitle = function (str) {
                    subtitle = String(str);
                    applyTitle();
                };
                
                this.addButton = function (options) {
                    
                    var opt = $.extend({
                        label: "Action",
                        action: $.noop
                    }, options || {});
                    
                    return $.button({
                        label: opt.label,
                        click: opt.action
                    })
                    .appendTo(this.nodes.toolbar);
                };
            };
        
        return function (options) {
            
            var opt = $.extend({
                id: "window-" + guid,
                width: 0,
                title: "Window #" + guid,
                subtitle: "",
                search: false,
                toolbar: false,
                settings: false
            }, options);

            // get width
            var meta = (String(opt.width).match(/^(\d+)(px|%)$/) || ["", "100", "%"]).splice(1),
                width = meta[0],
                unit = meta[1],
                // create new window instance
                win = new Window(opt.id),
                // close window
                close = function () {
                    win.close();
                };

            // window container
            win.nodes.outer = $("<div/>")
                .attr({
                    id: opt.id,
                    "data-window-nr": guid
                })
                .addClass("window-container")
                .append(
                    $("<div/>")
                        .addClass("window-container-center")
                        .data({
                            width: width + unit
                        })
                        .css({
                            width: width + unit
                        })
                        .append(
                            // window HEAD
                            win.nodes.head = $("<div/>")
                                .addClass("window-head")
                                .append(
                                    // title
                                    win.nodes.title = $("<div/>")
                                        .addClass("window-title")
                                        .append($("<span/>"))
                                        .append($("<span/>").addClass("subtitle"))
                                )
                                .append(
                                    // toolbar
                                    win.nodes.toolbar = $("<div/>")
                                        .addClass("window-toolbar")
                                )
                                .append(
                                    // controls
                                    $("<div/>")
                                        .addClass("window-controls")
                                        .append(
                                            // settings
                                            win.nodes.settingsButton = $("<div/>")
                                                .addClass("window-control")
                                                .text("\u270E")
                                        )
                                        .append(
                                            // close
                                            win.nodes.closeButton = $("<div/>")
                                                .addClass("window-control")
                                                .text("\u2715")
                                        )
                                )
                        )
                        .append(
                            // window BODY
                            win.nodes.body = $("<div/>")
                                .addClass("window-body")
                                .append(
                                    // quick settings
                                    win.nodes.settings = $("<div/>")
                                        .hide()
                                        .addClass("window-settings")
                                        .html("<h2>Each window can have a quick settings area</h2>")
                                )
                                .append(
                                    // content
                                    win.nodes.content = $("<div/>")
                                        .addClass("window-content")
                                )
                        )
                );
            
            // add dispatcher
            ox.api.event.Dispatcher.extend(win);
            
            // search?
            if (opt.search) {
                // search
                var lastQuery = "",
                    triggerSearch = function (query) {
                        win.trigger("search", query);
                        // yeah, waiting for the one who reports this :)
                        if (/^porn$/i.test(query)) {
                            $("body").append(
                                $("<div/>").addClass("abs").css({
                                    backgroundColor: "black", zIndex: 65000
                                })
                                .append(
                                    $("<div/>").addClass("abs").css({
                                        top: "25%", textAlign: "center", color: "#aaa", fontWeight: "bold", fontSize: "50px", fontFamily: "'Comic Sans MS', Arial"
                                    }).
                                    html('<span style="color: rgb(230,110,110)">YOU</span> SEARCHED FOR WHAT?')
                                )
                                .append(
                                    $("<div/>").addClass("abs").css({
                                        top: "50%", width: "670px", textAlign: "center", margin: "0 auto 0 auto", color: "#666"
                                    })
                                    .html(
                                        '<div style="font-size: 26px">WARNING: This website contains explicit adult material.</div>' +
                                        '<div style="font-size: 18px">You may only enter this Website if you are at least 18 years of age, or at least the age of majority in the jurisdiction where you reside or from which you access this Website. If you do not meet these requirements, then you do not have permission to use the Website.</div>'
                                    )
                                )
                                .click(function () { $(this).remove(); })
                            )
                        }
                    };
                $("<input/>", { type: "search", placeholder: "Search...", size: "40" })
                    .css({ "float": "right", marginTop: "9px" })
                    .bind("keypress", function (e) {
                        e.stopPropagation();
                    })
                    .bind("search", function (e) {
                        e.stopPropagation();
                        if ($(this).val() === "") {
                            $(this).blur();
                        }
                    })
                    .bind("change", function (e) {
                        e.stopPropagation();
                        win.search.query = $(this).val();
                        // trigger search?
                        if (win.search.query !== "") {
                            if (win.search.query !== lastQuery) {
                                triggerSearch(lastQuery = win.search.query);
                            }
                        } else if (lastQuery !== "") {
                            win.trigger("cancel-search", lastQuery = "");
                        }
                    })
                    .prependTo(win.nodes.toolbar);
            }
            
            // fix height/position
            if (opt.toolbar || opt.search) {
                var th = 28;
                win.nodes.head.css("height", th + 30 + "px");
                win.nodes.toolbar.css("height", th + 10 + "px");
                win.nodes.body.css("top", th + 32 + "px");
            }
            
            // add fullscreen handler
            win.nodes.title.bind("dblclick", toggleFullscreen);
            
            // add close handler
            win.nodes.closeButton.bind("click", close);
            
            // set subtitle & title
            win.setSubTitle(opt.subtitle);
            win.setTitle(opt.title);
            
            // inc
            guid++;
            
            // quick settings?
            if (opt.settings) {
                $.quickSettings(win.nodes.content, win.nodes.settings, win.nodes.settingsButton);
            } else {
                win.nodes.settingsButton.hide();
            }
            
            // return window object
            return win;
        };
        
    }());
    
    return {
        addLauncher: addLauncher
    };
    
});
