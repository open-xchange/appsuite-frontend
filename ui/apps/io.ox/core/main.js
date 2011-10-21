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

define("io.ox/core/main",
    ["io.ox/core/desktop", "io.ox/core/session", "io.ox/core/http",
    "io.ox/core/extensions", "io.ox/core/gettext"],
    function (desktop, session, http, extensions, gt) {

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
        
        desktop.addLauncher("right", gt("Applications"));
        
        desktop.addLauncher("left", gt("Portal"), function () {
                var node = this;
                return require(["io.ox/portal/main"], function (m) {
                    m.getApp().setLaunchBarIcon(node).launch();
                });
            });
            
        desktop.addLauncher("left", gt("E-Mail"), function () {
                var node = this;
                return require(["io.ox/mail/main"], function (m) {
                    m.getApp().setLaunchBarIcon(node).launch();
                });
            });
        
        desktop.addLauncher("left", gt("Address Book"), function () {
                var node = this;
                return require(["io.ox/contacts/main"], function (m) {
                    m.getApp().setLaunchBarIcon(node).launch();
                });
            });
        
        desktop.addLauncher("left", gt("Tasks"), function () {
            var node = this;
            return require(["io.ox/tasks/main"], function (m) {
                m.getApp().setLaunchBarIcon(node).launch();
            });
        });
        
        desktop.addLauncher("left", gt("Calendar"), function () {
                var node = this;
                return require(["io.ox/calendar/main"], function (m) {
                    m.getApp().setLaunchBarIcon(node).launch();
                });
            });
        
        desktop.addLauncher("left", gt("Files"), function () {
                var node = this;
                return require(["io.ox/files/main"], function (m) {
                    m.getApp().setLaunchBarIcon(node).launch();
                });
            });
        // TODO: Move this, once the application launcher is ready.
        desktop.addLauncher("left", gt("AJAX Requests"), function () {
                var node = this;
                return require(["io.ox/internal/ajaxDebug/main"], function (m) {
                    m.getApp().setLaunchBarIcon(node).launch();
                });
            });
        // TODO: Move this, once the application launcher is ready.
        desktop.addLauncher("left", gt("Tests"), function () {
                var node = this;
                return require(["io.ox/internal/testing/main"], function (m) {
                    m.getApp().setLaunchBarIcon(node).launch();
                });
            });
        
        var def = $.Deferred(),
            autoLaunch = _.url.hash("launch") ? _.url.hash("launch").split(/,/) : [];
        
        $.when(
                extensions.load(),
                require(autoLaunch),
                def
            )
            .done(function () {
                _(autoLaunch).each(function (id) {
                    require(id).getApp().launch();
                });
            });
        
        if (autoLaunch.length) {
            $("#background_loader").removeClass("busy").hide();
            def.resolve();
        } else {
            $("#background_loader").removeClass("busy").fadeOut(DURATION, def.resolve);
        }
    }
    
    return {
        launch: launch
    };
});
