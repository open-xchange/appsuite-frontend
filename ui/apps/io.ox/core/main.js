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

define("io.ox/core/main", ["io.ox/core/desktop", "io.ox/core/session", "io.ox/core/http", "io.ox/core/extensions", "io.ox/core/gettext"], function (desktop, session, http, extensions, gt) {

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
    
    function initRefreshAnimation () {
        
        var count = 0, timer = null;
        
        function off () {
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
    
    function launch () {
        
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
        
        // TODO: hide this 'feature' more cleverly
        if (_.url.hash("roadkill")) {
            $("#io-ox-core").css("background", "url(apps/themes/default/roadkill.jpg) no-repeat");
            $("#io-ox-core").css("background-size", "cover");
        }
        
        
        // load core extensions
        extensions.load()
            .done(function () {
                $("#background_loader").removeClass("busy").fadeOut(DURATION, function () {
                    // auto launch apps?
                    if (_.url.hash("launch")) {
                        require(_.url.hash("launch").split(/,/), function () {
                            $.each(arguments, function (i, m) {
                                m.getApp().launch();
                            });
                        });
                    }
                });
            });
    }
    
    return {
        launch: launch
    };
});
