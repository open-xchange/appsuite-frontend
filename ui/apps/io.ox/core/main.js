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
    ["io.ox/core/desktop", "io.ox/core/session", "io.ox/core/http",
     "io.ox/core/api/apps", "io.ox/core/extensions", "io.ox/core/i18n",
    "gettext!io.ox/core/main"], function (desktop, session, http, appAPI, ext, i18n, gt) {

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
                $("#io-ox-refresh-icon").removeClass("progress");
            }
        }

        http.bind("start", function () {
            if (count === 0) {
                if (timer === null) {
                    $("#io-ox-refresh-icon").addClass("progress");
                }
                clearTimeout(timer);
                timer = setTimeout(function () {
                    timer = null;
                    off();
                }, 1500);
            }
            count++;
        });

        http.bind("stop", function () {
            count = Math.max(0, count - 1);
            off();
        });
    }

    function launch() {

        // add small logo to top bar
        $("#io-ox-topbar").append(
            $('<div>', { id: 'io-ox-top-logo-small' })
        );

        desktop.addLauncher("right", gt("Sign out"), function (e) {
            return logout();
        });

        desktop.addLauncher("right", gt("Help"));

        desktop.addLauncher("right", gt("Refresh"), function () {
                // trigger global event
                if (ox.online) {
                    ox.trigger("refresh");
                }
                return $.Deferred().resolve();
            })
            .attr("id", "io-ox-refresh-icon");

        // refresh animation
        initRefreshAnimation();

//        desktop.addLauncher("right", gt("Applications"), function () {
//            var node = this;
//            return require(["io.ox/applications/main"], function (m) {
//                m.getApp().setLaunchBarIcon(node).launch();
//            });
//        });

        desktop.addLauncher("left", gt("Apps"), function () {
            var node = this;
            return require(["io.ox/launchpad/main"], function (m) {
                m.show();
            });
        });

        var addLauncher = function (app) {
            desktop.addLauncher("left", app.title, function () {
                var node = this;
                return require([app.id + '/main'], function (m) {
                    m.getApp().setLaunchBarIcon(node).launch();
                });
            });
        };

        _(appAPI.getFavorites()).each(addLauncher);

        // initialize empty desktop

        /**
         * Exemplary upsell widget
         */
        ext.point("io.ox/core/desktop").extend({
            id: "upsell",
            draw: function () {
                // run away
                function run() {
                    var self = $(this).off('mouseover mousemove', run);
                    self.stop(false, true)
                        .animate({
                            right: ((self.parent().width() - 240) * Math.random() >> 0) + "px",
                            bottom: ((self.parent().height() - 140) * Math.random() >> 0) + "px"
                        }, 100)
                        .on('mouseover mousemove', run);
                }
                // does nothing - just to demo an exemplary upsell path
                this
                .append(
                    $('<div>')
                    .on('mouseover mousemove', run)
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

        ox.ui.windowManager.bind("empty", function (isEmpty) {
            if (isEmpty) {
                drawDesktop();
            }
            if (isEmpty) {
                ox.ui.screens.show('desktop');
            } else {
                ox.ui.screens.show('windowmanager');
            }
        });

        var def = $.Deferred().done(function () {
                // add some senseless characters to avoid unwanted scrolling
                if (location.hash === '') {
                    location.hash = '#!';
                }
            }),
            autoLaunch = _.url.hash("launch") ? _.url.hash("launch").split(/,/) : [],
            autoLaunchModules = _(autoLaunch)
                .map(function (m) {
                    return m.split(/:/)[0];
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
                        launch = require(pair[0]).getApp().launch(),
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

        if (autoLaunch.length === 0 && !ox.ui.App.canRestore()) {
            drawDesktop();
        }

        if (autoLaunch.length || ox.ui.App.canRestore() || location.hash === '#!') {
            // instant fade out
            $("#background_loader").idle().hide();
            def.resolve();
        } else {
            // fade out animation
            $("#background_loader").idle().fadeOut(DURATION, def.resolve);
        }
    }

    return {
        launch: launch
    };
});
