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

define("io.ox/core/main",
    ["io.ox/core/desktop",
     "io.ox/core/session",
     "io.ox/core/http",
     "io.ox/core/api/apps",
     "io.ox/core/extensions",
     "io.ox/core/i18n",
     "gettext!io.ox/core/main",
     "io.ox/core/bootstrap/basics"], function (desktop, session, http, appAPI, ext, i18n, gt) {

    "use strict";

    var PATH = ox.base + "/apps/io.ox/core",
        DURATION = 250;

    var logout = function () {
        return session.logout()
            .always(function () {
                $("#background_loader").fadeIn(DURATION, function () {
                    $("#io-ox-core").hide();
                    _.url.redirect("signin");
                });
            });
    };

    function initRefreshAnimation() {

        var count = 0, timer = null;

        function off() {
            if (count === 0 && timer === null) {
                $("#io-ox-refresh-icon").removeClass("io-ox-progress");
            }
        }

        http.on("start", function () {
            if (count === 0) {
                if (timer === null) {
                    $("#io-ox-refresh-icon").addClass("io-ox-progress");
                }
                clearTimeout(timer);
                timer = setTimeout(function () {
                    timer = null;
                    off();
                }, 1500);
            }
            count++;
        });

        http.on("stop", function () {
            count = Math.max(0, count - 1);
            off();
        });
    }

    function globalRefresh() {
        // trigger global event
        if (ox.online) {
            console.debug('triggering automatic refresh ...');
            ox.trigger("refresh^");
        }
    }

    setInterval(globalRefresh, 60000 * 2); // 2 minute refresh interval!

    function launch() {

        // add small logo to top bar
        $("#io-ox-topbar").append(
            $('<div>', { id: 'io-ox-top-logo-small' })
        );

        ox.on('application:launch application:resume', function (e, app) {
            var name = app.getName(),
                id = app.getId(),
                topbar = $("#io-ox-topbar"),
                launcher = $();
            // remove active class
            topbar.find('.launcher').removeClass('active');
            // has named launcher?
            launcher = topbar.find('.launcher[data-app-name=' + $.escape(name) + ']');
            // has no launcher?
            if (!launcher.length && !(launcher = topbar.find('.launcher[data-app-id=' + $.escape(id) + ']')).length) {
                launcher = desktop.addLauncher('left', app.getTitle(), app.launch).attr('data-app-id', id);
            }
            // mark as active
            launcher.addClass('active');
        });

        ox.on('application:quit', function (e, app) {
            var id = app.getId();
            $("#io-ox-topbar").find('.launcher[data-app-id=' + $.escape(id) + ']').remove();
        });

        ox.on('application:change:title', function (e, app) {
            var id = app.getId(), title = app.getTitle();
            $("#io-ox-topbar").find('.launcher[data-app-id=' + $.escape(id) + ']').text(title);
        });

        desktop.addLauncher("right", gt("Sign out"), function (e) {
            return logout();
        });

        desktop.addLauncher("right", gt("Help"));

        desktop.addLauncher("right", gt("Refresh"), function () {
                globalRefresh();
                return $.Deferred().resolve();
            })
            .attr("id", "io-ox-refresh-icon");

        // refresh animation
        initRefreshAnimation();

        var addLauncher = function (app) {
            var launcher = desktop.addLauncher(app.side || 'left', app.title, function () {
                return require([app.id + '/main'], function (m) {
                    var app = m.getApp();
                    launcher.attr('data-app-id', app.getId());
                    app.launch();
                });
            })
            .attr('data-app-name', app.id);
        };

        addLauncher({ id: 'io.ox/settings', title: gt('Settings'), side: 'right' });

        desktop.addLauncher("left", gt("Apps"), function () {
            return require(["io.ox/launchpad/main"], function (m) {
                m.show();
            });
        });

        _(appAPI.getFavorites()).each(addLauncher);

        // initialize empty desktop

        /**
         * Exemplary upsell widget
         */
        ext.point("io.ox/core/desktop").extend({
            id: "upsell",
            draw: function () {
                // does nothing - just to demo an exemplary upsell path
                this
                .append(
                    $('<div>')
                    .css({
                        position: "absolute",
                        width: "270px",
                        height: "140px",
                        right: "70px",
                        bottom: "150px"
                    })
                    .append(
                        $("<div>", { id: "io-ox-welcome-upsell" })
                        .addClass('abs')
                        .css({
                            padding: "40px",
                            zIndex: 1
                        })
                        .text("Click me for a 90-day free trial!")
                    )
                );
            }
        });

        ext.point("io.ox/core/desktop").extend({
            id: "welcome",
            draw: function () {

                var date, update;

                this.append(
                    $("<div>", { id: "io-ox-welcome" })
                    .addClass("abs")
                    .append(
                        $("<div>").addClass("clear-title")
                        .append(
                            // split user into three parts, have to use inject here to get proper node set
                            _(String(ox.user).split(/(\@)/)).inject(function (tmp, s, i) {
                                    return tmp.add($("<span>").text(String(s)).addClass(i === 1 ? "accent": ""));
                                }, $())
                        )
                    )
                    .append(
                        date = $("<div>").addClass("clock clear-title").text("")
                    )
                );

                update = function () {
                    date.text(i18n.date("EEE dd. MMM YYYY HH:mm:ss"));
                };

                update();
                _.every(1, "minute", update);
            }
        });

        var drawDesktop = function () {
            ext.point("io.ox/core/desktop").invoke("draw", $("#io-ox-desktop"), {});
            drawDesktop = $.noop;
        };

        ox.ui.windowManager.on("empty", function (e, isEmpty) {
            if (isEmpty) {
                drawDesktop();
            }
            if (isEmpty) {
                ox.ui.screens.show('desktop');
            } else {
                ox.ui.screens.show('windowmanager');
            }
        });

        // add some senseless characters to avoid unwanted scrolling
        if (location.hash === '') {
            location.hash = '#' + (_.getCookie('hash') || '!');
        }

        var def = $.Deferred(),
            autoLaunch = _.url.hash("app") ? _.url.hash("app").split(/,/) : [],
            autoLaunchModules = _(autoLaunch)
                .map(function (m) {
                    return m.split(/:/)[0] + '/main';
                });

        $.when(
                ext.loadPlugins(),
                require(autoLaunchModules),
                def
            )
            .done(function () {
                // auto launch
                _(autoLaunch).each(function (id) {
                    // split app/call
                    var pair = id.split(/:/),
                        launch = require(pair[0] + '/main').getApp().launch(),
                        call = pair[1];
                    // explicit call?
                    if (call) {
                        launch.done(function () {
                            if (this[call]) {
                                this[call]();
                            }
                        });
                    }
                });
                // restore apps
                ox.ui.App.restore();
            });

        var restoreLauncher = function (canRestore) {
            if (autoLaunch.length === 0 && !canRestore) {
                drawDesktop();
            }
            if (autoLaunch.length || canRestore || location.hash === '#!') {
                // instant fade out
                $("#background_loader").idle().hide();
                def.resolve();
            } else {
                // fade out animation
                $("#background_loader").idle().fadeOut(DURATION, def.resolve);
            }
        };

        ox.ui.App.canRestore()
            .done(function (canRestore) {
                if (canRestore) {
                    // clear auto start stuff (just conflicts)
                    autoLaunch = [];
                    autoLaunchModules = [];
                }
                restoreLauncher(canRestore);
            });
    }

    return {
        launch: launch
    };
});
