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

define("io.ox/core/main", ["io.ox/core/desktop", "io.ox/core/session"], function (desktop, session) {

    var PATH = ox.base + "/apps/io.ox/core";
    
    var logout = function () {
        return session.logout()
        .done(function () {
            $("#background_loader").fadeIn(500, function () {
                $("#io-ox-core").hide();
                var l = location;
                location.href = l.protocol + "//" + l.host + l.pathname.replace(/[^\/]+$/, "");
            });
        });
    };
    
    function launch () {
        
        desktop.addLauncher("right", "Applications", PATH + "/images/applications.png");
        
        desktop.addLauncher("right", "Refresh", PATH + "/images/refresh.png", function () {
            // trigger global event
            ox.trigger("refresh");
            return $.Deferred().resolve();
        });
        
        desktop.addLauncher("right", "Help", PATH + "/images/help.png");
        
        desktop.addLauncher("right", "Sign out", PATH + "/images/logout.png", function (e) {
            return logout();
        });
        
        desktop.addLauncher("left", "E-Mail", PATH + "/images/mail.png", function () {
            var node = this;
            return require(["io.ox/mail/main"], function (m) {
                m.getApp().setLaunchBarIcon(node).launch();
            });
        });
        
        desktop.addLauncher("left", "Address Book", PATH + "/images/addressbook.png", function () {
            var node = this;
            return require(["io.ox/contacts/main"], function (m) {
                m.getApp().setLaunchBarIcon(node).launch();
            });
        });
        
        desktop.addLauncher("left", "Calendar", PATH + "/images/calendar.png", function () {
            var node = this;
            return require(["io.ox/calendar/main"], function (m) {
                m.getApp().setLaunchBarIcon(node).launch();
            });
        });
        
        desktop.addLauncher("left", "Files", PATH + "/images/files.png", function () {
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
        
        $("#background_loader").removeClass("busy").fadeOut(500, function () {
            // auto launch apps?
            if (_.url.hash("launch")) {
                require(_.url.hash("launch").split(/,/), function () {
                    $.each(arguments, function (i, m) { 
                        m.getApp().launch();
                    });
                });
            }
        });
    }
    
    return {
        launch: launch
    };
});