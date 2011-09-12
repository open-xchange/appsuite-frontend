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

define("io.ox/core/desktop", ["io.ox/core/event"], function (event) {
    
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
        // top bar
        topBar = $("#io-ox-topbar"),
        // add launcher
        addLauncher = function (side, label, fn) {
            // construct
            var node = $("<div/>").addClass("launcher")
                .text(label)
                .bind("click", function () {
                    var self = $(this);
                    if (!_.isFunction(fn)) {
                        // for development only - should never happen
                        self.css("backgroundColor", "#800000");
                        setTimeout(function () { self.css("backgroundColor", ""); }, 500);
                    } else {
                        // set fixed width, hide label, be busy
                        self.css("width", self.width() + "px").text("\u00a0").busy();
                        // call launcher
                        fn.call(this).done(function () {
                            // revert visual changes
                            self.idle().text(label).css("height", "");
                        });
                    }
                });
            // add
            var c = currentWindow, target;
            if (side === "left" && c && c.app && (target = c.app.getLaunchBarIcon())) {
                // animate space
                node.hide().insertAfter(target).fadeIn(1000);
            } else {
                // just add
                if (side === "left") {
                    node.appendTo(topBar);
                } else {
                    node.addClass("right").appendTo(topBar);
                }
            }
            return node;
        };
        
    // add bar and show
    core.append(topBar).show();
    
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
                launchbarIcon = $(node);
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
                            "left", opt.title, self.launch
                        );
                    }
                    // go!
                    return (launchFn() || $.Deferred().resolve());
                    
                } else if (win) {
                    // toggle app window
                    win.show();
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
            
            previousWindow = null,
            
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
            
            pane = $("#io-ox-windowmanager-pane"),
            
            scrollTo = function (node, cont) {
                var children = pane.find(".window-container-center"),
                    center = node.find(".window-container-center").show(),
                    index = node.data("index") || 0,
                    left = (-index * 100) + "%",
                    done = function () {
                        children.not(center).hide();
                        center.addClass("shadow");
                        _.call(cont);
                    };
                // change? (firefox converts 0% to 0px so we have to convert to integer)
                if (parseInt(left, 10) !== parseInt(pane.css("left"), 10)) {
                    // hide shadows to speed things up!
                    children.removeClass("shadow");
                    // use CSS transitions?
                    if (Modernizr.csstransitions) {
                        node.show();
                        pane.one(_.browser.WebKit ? "webkitTransitionEnd" : "transitionend", done);
                        pane.css("left", left);
                    } else {
                        node.show();
                        pane.stop().animate({ left: left }, 400, done);
                    }
                } else {
                    _.call(cont);
                }
            },
            
            // window class
            Window = function (id) {
                
                this.id = id;
                this.nodes = {};
                this.search = { query: "" };
                this.app = null;
                
                var quitOnClose = false,
                    // views
                    views = { main: true },
                    currentView = "main";
                
                this.show = function (cont) {
                    if (currentWindow !== this) {
                        // show
                        if (currentWindow) {
                            previousWindow = currentWindow;
                            currentWindow.blur();
                        }
                        // auto fullscreen?
                        if (autoFullscreen) {
                            toggleFullscreen();
                            autoFullscreen = false;
                        }
                        var node = this.nodes.outer;
                        if (node.parent().length === 0) {
                            node.css("left", ((guid - 1) * 100) + "%")
                                .data("index", guid - 1)
                                .appendTo(pane);
                        }
                        currentWindow = this;
                        if (this.app !== null) {
                            this.app.getLaunchBarIcon().addClass("active");
                        }
                        scrollTo(node, cont);
                        this.trigger("show");
                    } else {
                        _.call(cont);
                    }
                };
                
                this.blur = function () {
                    if (this.app !== null) {
                        this.app.getLaunchBarIcon().removeClass("active");
                    }
                    if (currentWindow === this) {
                        currentWindow = null;
                    }
                };
                
                this.hide = function () {
                    this.blur();
                    this.nodes.outer.hide();
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
                        if (previousWindow === this) {
                            previousWindow = null;
                        } else if (previousWindow !== null) {
                            previousWindow.show();
                        }
                    }
                };
                
                this.destroy = function () {
                    if (currentWindow === this) { currentWindow = null; }
                    if (previousWindow === this) { previousWindow = null; }
                    if (this.app !== null) {
                        this.app.getLaunchBarIcon().removeClass("active");
                        this.app.win = null;
                        this.app = null;
                    }
                    this.nodes.outer.remove();
                    this.nodes = null;
                    this.show = $.noop;
                    if (previousWindow) {
                        previousWindow.show();
                    }
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
                
                this.addView = function (id) {
                    if (this.nodes[id] === undefined) {
                        var node = $("<div/>")
                            .addClass("window-content").hide()
                            .appendTo(this.nodes.body);
                        return (this.nodes[id] = views[id] = node);
                    }
                };
                
                this.setView = function (id) {
                    if (id !== currentView) {
                        if (views[id] !== undefined) {
                            this.nodes[currentView].hide();
                            this.nodes[currentView = id].show();
                        }
                    }
                };
            };
           
        // init visual exit
        var exitTimer = null;
        $("#exit-fullscreen")
            .bind("mouseover", function () {
                exitTimer = setTimeout(interruptFullscreen, 250);
            })
            .bind("mouseout", function () {
                clearTimeout(exitTimer);
            });
        
        // window factory
        return function (options) {
            
            var opt = $.extend({
                id: "window-" + guid,
                width: 0,
                title: "Window #" + guid,
                subtitle: "",
                search: false,
                toolbar: false,
                settings: false,
                chromesless: false
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
                        .addClass("window-container-center shadow")
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
                                    win.nodes.main = $("<div/>")
                                        .addClass("window-content")
                                )
                        )
                );
            
            // add dispatcher
            event.Dispatcher.extend(win);
            
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
                            );
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
            
            // fix height/position/appearance
            if (opt.chromeless) {
                
                win.nodes.head.remove();
                win.nodes.toolbar.remove();
                win.nodes.body.css("top", "0px");
                
            } else {
                
                // add fullscreen handler
                win.nodes.title.bind("dblclick", toggleFullscreen);
                
                // add close handler
                win.nodes.closeButton.bind("click", close);
                
                // set subtitle & title
                win.setSubTitle(opt.subtitle);
                win.setTitle(opt.title);
                
                if (opt.toolbar || opt.search) {
                    var th = 28;
                    win.nodes.head.css("height", th + 30 + "px");
                    win.nodes.toolbar.css("height", th + 10 + "px");
                    win.nodes.body.css("top", th + 32 + "px");
                }
                
                // quick settings?
                if (opt.settings) {
                    $.quickSettings(win.nodes.main, win.nodes.settings, win.nodes.settingsButton);
                } else {
                    win.nodes.settingsButton.hide();
                }
            }
            
            // inc
            guid++;
            
            // return window object
            return win;
        };
        
    }());
    
    return {
        addLauncher: addLauncher
    };
    
});
