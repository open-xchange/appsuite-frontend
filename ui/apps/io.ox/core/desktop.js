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

define("io.ox/core/desktop",
    ["io.ox/core/event", "io.ox/core/extensions", "io.ox/core/cache"], function (event, ext, cache) {

    "use strict";

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
            link.off("click")
                .on("dblclick", false)
                .on("click", function (e) {
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
            var node = $("<div>")
            .addClass("launcher")
            .text(label)
            .hover(
                function () {
                    $(this).addClass("hover");
                },
                function () {
                    $(this).removeClass("hover");
                }
            )
            .on("click", function () {
                var self = $(this);
                if (!_.isFunction(fn)) {
                    // for development only - should never happen
                    self.css("backgroundColor", "#800000");
                    setTimeout(function () {
                        self.css("backgroundColor", "");
                    }, 500);
                } else {
                    // set fixed width, hide label, be busy
                    self.css("width", self.width() + "px").text("\u00A0").busy();
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

    // show
    core.show();

    /**
     * Create app
     */
    ox.ui.createApp = (function () {

        var appCache = new cache.SimpleCache('app-cache', true);

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
                // save/restore
                savePointUniqueID = _.now(),
                savePoint = '',
                saveRestorePointTimer = null,
                // self
                self = this;

            function saveRestorePoint() {
                if (self.failSave) {
                    var list = appCache.get('savepoints') || [],
                        data = self.failSave(),
                        ids = _(list).pluck('id'),
                        pos = _(ids).indexOf(savePointUniqueID);
                    // add unique id
                    data.id = savePointUniqueID;
                    if (pos > -1) {
                        // replace
                        list.splice(pos, 1, data);
                    } else {
                        // add
                        list.push(data);
                    }
                    appCache.add('savepoints', list);
                }
            }

            function removeRestorePoint() {
                var list = appCache.get('savepoints') || [],
                    ids = _(list).pluck('id'),
                    pos = _(ids).indexOf(savePointUniqueID);
                if (pos > -1) {
                    list.splice(pos, 1);
                }
                appCache.add('savepoints', list);
            }

            $(window).on('unload', saveRestorePoint);
            saveRestorePointTimer = setInterval(saveRestorePoint, 10000);

            // add dispatcher
            event.Dispatcher.extend(this);

            // add folder management
            this.folder = (function () {

                var folder = null, that, win = null, grid = null, type;

                that = {

                    unset: function () {
                        // unset
                        folder = null;
                        // update window title?
                        if (win) {
                            win.setTitle('');
                        }
                        // update grid?
                        if (grid) {
                            grid.clear();
                        }
                    },

                    set: function (id) {
                        var def = new $.Deferred();
                        if (id !== undefined && id !== null) {
                            require(['io.ox/core/api/folder'], function (api) {
                                api.get({ folder: id })
                                .done(function (data) {
                                    // remember
                                    folder = String(id);
                                    // update window title?
                                    if (win) {
                                        win.setTitle(data.title);
                                    }
                                    // update grid?
                                    if (grid) {
                                        grid.clear();
                                        grid.prop('folder', folder);
                                        grid.refresh();
                                    }
                                    def.resolve(data);
                                })
                                .fail(def.reject);
                            });
                        } else {
                            def.reject();
                        }
                        return def;
                    },

                    setType: function (t) {
                        type = t;
                        return this;
                    },

                    setDefault: function () {
                        var def = new $.Deferred();
                        require(['io.ox/core/config'], function (config) {
                            var defaultFolder = type === 'mail' ?
                                    config.get('mail.folder.inbox') :
                                    config.get('folder.' + type);
                            if (defaultFolder) {
                                that.set(defaultFolder)
                                    .done(def.resolve)
                                    .fail(def.reject);
                            } else {
                                def.reject();
                            }
                        });
                        return def;
                    },

                    get: function () {
                        return folder;
                    },

                    updateTitle: function (w) {
                        win = w;
                        return this;
                    },

                    updateGrid: function (g) {
                        grid = g;
                        return this;
                    },

                    destroy: function () {
                        that = win = grid = null;
                    }
                };

                return that;
            }());

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

            this.getWindow = function () {
                return win;
            };

            this.launch = function () {

                var deferred;

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
                    deferred = launchFn() || $.when();

                } else if (win) {
                    // toggle app window
                    win.show();
                    deferred = $.when();
                }

                return deferred.pipe(function () {
                    return $.Deferred().resolveWith(self, arguments);
                });
            };

            this.quit = function () {
                // call quit function
                var def = quitFn() || $.Deferred().resolve();
                return def.done(function () {
                    // mark as not running
                    running = false;
                    // don't save
                    clearInterval(saveRestorePointTimer);
                    removeRestorePoint();
                    $(window).off('unload', saveRestorePoint);
                    // destroy launchbar icon
                    if (launchbarIcon) {
                        launchbarIcon.fadeOut(500, function () {
                            launchbarIcon.remove();
                            launchbarIcon = null;
                        });
                    }
                    // destroy stuff
                    self.dispatcher.destroy();
                    self.folder.destroy();
                    if (win) {
                        ox.ui.windowManager.trigger("window.quit", win);
                        win.destroy();
                    }
                    // remove app's properties
                    for (var id in self) {
                        delete self[id];
                    }
                    // don't leak
                    self = win = launchFn = quitFn = null;
                });
            };
        }

        ox.ui.App = App;

        App.canRestore = function () {
            return (appCache.get('savepoints') || []).length > 0;
        };

        App.restore = function () {
            _(appCache.get('savepoints') || []).each(function (obj) {
                require([obj.module], function (m) {
                    m.getApp().launch().done(function () {
                        if (this.failRestore) {
                            this.failRestore(obj.point);
                        }
                    });
                });
            });
            appCache.remove('savepoints');
        };

        return function (options) {
            return new App(options);
        };

    }());

    ox.ui.windowManager = (function () {

        var that = event.Dispatcher.extend({}),
            // list of windows
            windows = [],
            // get number of open windows
            numOpen = function () {
                return _(windows).inject(function (count, obj) {
                    return count + (obj.state.open ? 1 : 0);
                }, 0);
            };

        that.bind("window.open", function (win) {
            if (_(windows).indexOf(win) === -1) {
                windows.push(win);
            }
        });

        that.bind("window.beforeshow", function (win) {
            that.trigger("empty", false);
        });

        that.bind("window.close window.quit", function (win, type) {

            var pos = _(windows).indexOf(win), i, $i, found = false;

            if (pos !== -1) {
                // remove?
                if (type === "window.quit") {
                    windows.splice(pos, 1);
                }
                // look right
                for (i = pos, $i = windows.length; i < $i && !found; i++) {
                    if (windows[i].state.open) {
                        windows[i].show();
                        found = true;
                    }
                }
                // look left
                for (i = pos - 1; i >= 0 && !found; i--) {
                    if (windows[i].state.open) {
                        windows[i].show();
                    }
                }
            }

            that.trigger("empty", numOpen() === 0);
        });

        return that;

    }());

    /**
     * Create window
     */
    ox.ui.createWindow = (function () {

        // window guid
        var guid = 0,

            pane = $("#io-ox-windowmanager-pane"),

            getX = function (node) {
                return node.data("x") || 0;
            },

            scrollTo = function (node, cont) {

                var children = pane.find(".window-container-center"),
                    center = node.find(".window-container-center").show(),
                    index = node.data("index") || 0,
                    left = (-index * 101),
                    done = function () {
                        // use timeout for smoother animations
                        setTimeout(function () {
                            _.call(cont);
                        }, 10);
                    };
                // change?
                if (left !== getX(pane)) {
                    // remember position
                    pane.data("x", left);
                    // do motion TODO: clean up here!
                    if (true) {
                        pane.animate({ left: left + "%" }, 0, done);
                    }
                    // touch device?
                    else if (Modernizr.touch) {
                        pane.css("left", left + "%");
                        done();
                    }
                    // use CSS transitions?
                    else if (Modernizr.csstransforms3d) {
                        pane.one(_.browser.WebKit ? "webkitTransitionEnd" : "transitionend", done);
                        pane.css("left", left + "%");
                    } else {
                        pane.stop().animate({ left: left + "%" }, 250, done);
                    }
                } else {
                    done();
                }
            },

            // window class
            Window = function (id, name) {

                this.id = id;
                this.name = name;
                this.nodes = {};
                this.search = { query: "" };
                this.state = { visible: false, running: false, open: false };
                this.app = null;

                var quitOnClose = false,
                    // views
                    views = { main: true },
                    currentView = "main",
                    self = this,
                    firstShow = true;

                this.show = function (cont) {
                    // get node and its parent node
                    var node = this.nodes.outer, parent = node.parent();
                    // if not current window or if detached (via funny race conditions)
                    if (currentWindow !== this || parent.length === 0) {
                        // show
                        if (firstShow) {
                            node.data("index", guid - 1).css("left", ((guid - 1) * 101) + "%");
                        }
                        if (node.parent().length === 0) {
                            node.appendTo(pane);
                        }
                        if (currentWindow && currentWindow.app !== null) {
                            currentWindow.app.getLaunchBarIcon().removeClass("active");
                        }
                        if (this.app !== null) {
                            this.app.getLaunchBarIcon().addClass("active");
                        }
                        // update toolbar
                        ext.point(this.name + "/toolbar")
                            .invoke('draw', this.nodes.toolbar.empty(), this.app || this);

                        ox.ui.windowManager.trigger("window.beforeshow", self);
                        node.show();
                        scrollTo(node, function () {
                            if (currentWindow && currentWindow !== self) {
                                currentWindow.hide();
                            }
                            currentWindow = self;
                            _.call(cont);
                            self.state.visible = true;
                            self.state.open = true;
                            self.trigger("show");
                            if (firstShow) {
                                self.trigger("open");
                                self.state.running = true;
                                ox.ui.windowManager.trigger("window.open", self);
                                firstShow = false;
                            }
                            ox.ui.windowManager.trigger("window.show", self);
                        });
                    } else {
                        _.call(cont);
                    }
                    return this;
                };

                this.hide = function () {
                    if (this.app !== null) {
                        this.app.getLaunchBarIcon().removeClass("active");
                    }
                    // detach if there are no iframes
                    if (this.nodes.outer.find("iframe").length === 0) {
                        this.nodes.outer.detach();
                    } else {
                        this.nodes.outer.hide();
                    }
                    this.state.visible = false;
                    this.trigger("hide");
                    ox.ui.windowManager.trigger("window.hide", this);
                    if (currentWindow === this) {
                        currentWindow = null;
                    }
                    return this;
                };

                this.toggle = function () {
                    if (currentWindow === this) {
                        this.hide();
                    } else {
                        this.show();
                    }
                    return this;
                };

                this.close = function () {
                    if (quitOnClose && this.app !== null) {
                        this.app.quit()
                            .done(function () {
                                self.trigger("quit");
                                self.state.open = false;
                                self.state.running = false;
                                // event is triggered by app
                            });
                    } else {
                        this.hide();
                        this.state.open = false;
                        this.trigger("close");
                        ox.ui.windowManager.trigger("window.close", this);
                    }
                    return this;
                };

                this.destroy = function () {
                    // hide window
                    this.hide();
                    // trigger event
                    this.trigger("destroy");
                    // disconnect from app
                    if (this.app !== null) {
                        this.app.getLaunchBarIcon().removeClass("active");
                        this.app.win = null;
                        this.app = null;
                    }
                    // destroy everything
                    this.dispatcher.destroy();
                    this.nodes.outer.remove();
                    this.nodes = null;
                    this.show = $.noop;
                    return this;
                };

                this.setQuitOnClose = function (flag) {
                    quitOnClose = !!flag;
                };

                var title = "";

                function applyTitle() {
                    var spans = self.nodes.title.find("span");
                    spans.eq(0).empty().append(
                        typeof title === "string" ?
                            document.createTextNode(title) :
                            title
                    );
                }

                this.setTitle = function (t) {
                    title = t;
                    applyTitle();
                    return this;
                };

                this.addClass = function () {
                    var o = this.nodes.outer;
                    return o.addClass.apply(o, arguments);
                };

                this.addButton = function (options) {

                    var o = $.extend({
                        label: "Action",
                        action: $.noop
                    }, options || {});

                    return $("<div>")
                        .addClass("io-ox-toolbar-link")
                        .text(String(o.label))
                        .on("click", o.action)
                        .appendTo(this.nodes.toolbar);
                };

                this.addView = function (id) {
                    if (this.nodes[id] === undefined) {
                        var node = $("<div>")
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
                    return this;
                };
            };

        // window factory
        return function (options) {

            var opt = $.extend({
                id: "window-" + guid,
                name: "",
                width: 0,
                title: "",
                titleWidth: '300px',
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
                win = new Window(opt.id, opt.name),
                // close window
                close = function () {
                    win.close();
                };

            // window container
            win.nodes.outer = $("<div>")
            .attr({
                id: opt.id,
                "data-window-nr": guid
            })
            .addClass("window-container")
            .append(
                $("<div>")
                .addClass("window-container-center")
                .data({
                    width: width + unit
                }).css({
                    width: width + unit
                })
                .append(
                // window HEAD
                win.nodes.head = $("<div>")
                    .addClass("window-head")
                    .append(
                        // title
                        win.nodes.title = $("<h1>")
                        .css("width", opt.titleWidth)
                        .addClass("window-title")
                        .append($("<span>"))
                    )
                    .append(
                        // toolbar
                        win.nodes.toolbar = $("<div>")
                        .css("left", opt.titleWidth)
                        .addClass("window-toolbar")
                    )
                    .append(
                        // controls
                        win.nodes.controls = $("<div>")
                        .addClass("window-controls")
                        .append(
                            // settings
                            win.nodes.settingsButton = $("<div>").hide()
                            .addClass("window-control")
                            .text("\u270E")
                        )
                        .append(
                            // close
                            win.nodes.closeButton = $("<div>").hide()
                            .addClass("window-control")
                            .text("\u2715")
                        )
                    )
                )
                .append(
                    // window BODY
                    win.nodes.body = $("<div>")
                    .addClass("window-body")
                    .append(
                        // quick settings
                        win.nodes.settings = $("<div>")
                        .hide()
                        .addClass("window-settings")
                        .html("<h2>Each window can have a quick settings area</h2>")
                    )
                    .append(
                        // content
                        win.nodes.main = $("<div>")
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
                        // yeah, waiting for the one who reports this :)
                        if (/^porn$/i.test(query)) {
                            $("body").append(
                                $("<div>")
                                .addClass("abs")
                                .css({
                                    backgroundColor: "black",
                                    zIndex: 65000
                                })
                                .append(
                                    $("<div>")
                                    .addClass("abs").css({
                                        top: "25%",
                                        textAlign: "center",
                                        color: "#aaa",
                                        fontWeight: "bold",
                                        fontSize: "50px",
                                        fontFamily: "'Comic Sans MS', Arial"
                                    })
                                    .html('<span style="color: rgb(230,110,110)">YOU</span> SEARCHED FOR WHAT?')
                                )
                                .append(
                                    $("<div>")
                                    .addClass("abs")
                                    .css({
                                        top: "50%",
                                        width: "670px",
                                        textAlign: "center",
                                        margin: "0 auto 0 auto",
                                        color: "#666"
                                    })
                                    .html(
                                        '<div style="font-size: 26px">WARNING: This website contains explicit adult material.</div>' +
                                        '<div style="font-size: 18px">You may only enter this Website if you are at least 18 years of age, or at least the age of majority in the jurisdiction where you reside or from which you access this Website. If you do not meet these requirements, then you do not have permission to use the Website.</div>'
                                    )
                                )
                                .click(function () {
                                        $(this).remove();
                                    })
                            );
                        } else if (/^use the force$/i.test(query) && currentWindow) {
                            // star wars!
                            currentWindow.nodes.outer.css({
                                webkitTransitionDuration: "2s",
                                webkitTransform: "perspective(500px) rotate3d(1, 0, 0, 45deg)",
                                top: "-150px"
                            });
                            // no search here
                            return;
                        } else if (/^no star wars$/i.test(query) && currentWindow) {
                            // star wars!
                            currentWindow.nodes.outer.css({
                                webkitTransitionDuration: "1s",
                                webkitTransform: "perspective(0px) rotate3d(1, 0, 0, 0deg)",
                                top: ""
                            });
                            // no search here
                            return;
                        }
                        win.trigger("search", query);
                    };

                var searchId = 'search_' + _.now(); // acccessibility

                $("<label>", { 'for': searchId })
                .addClass("searchfield-wrapper")
                .css({ "float": "right" })
                .append(
                    $("<input>", {
                        type: "search",
                        placeholder: "Search...",
                        size: "40",
                        id: searchId
                    })
                    .on({
                        keypress: function (e) {
                            e.stopPropagation();
                        },
                        search: function (e) {
                            e.stopPropagation();
                            if ($(this).val() === "") {
                                $(this).blur();
                            }
                        },
                        change: function (e) {
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
                        }
                    })
                )
                .prependTo(win.nodes.controls);
            }

            // toolbar extension point
            if (opt.toolbar === true && opt.name) {
                // add "create" link
                ext.point(opt.name + '/toolbar').extend(new ext.ToolbarLinks({
                    id: 'links',
                    ref: opt.name + '/links/toolbar'
                }));
            }

            // fix height/position/appearance
            if (opt.chromeless) {

                win.nodes.head.remove();
                win.nodes.toolbar.remove();
                win.nodes.body.css("top", "0px");

            } else {

                // add close handler
                if (opt.close === true) {
                    win.nodes.closeButton.show().on("click", close);
                    win.setQuitOnClose(true);
                }

                // set title
                win.setTitle(opt.title);

//                if (opt.toolbar || opt.search) {
//                    win.nodes.head.addClass("larger");
//                    win.nodes.body.addClass("movedown");
//                } else {
//                    win.nodes.toolbar.hide();
//                }

                // quick settings?
                if (opt.settings) {
                    $.quickSettings(win.nodes.main, win.nodes.settings, win.nodes.settingsButton);
                    win.nodes.settingsButton.show();
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
