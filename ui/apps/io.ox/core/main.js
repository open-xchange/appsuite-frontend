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

define("io.ox/core/main", ["io.ox/core/base"], function (base) {

    var PATH = "apps/io.ox/core";
    
    var logout = function () {
        ox.api.session.logout()
        .done(function () {
            $("#background_loader").fadeIn(500, function () {
                $("#io-ox-core").hide();
                window.location.href = "index.html";
            });
        });
    };
    
    function launch () {
        
        base.addLauncher("right", "Applications");
        base.addLauncher("right", "Refresh");
        base.addLauncher("right", "Help").find(".icon").css("backgroundColor", "#8CAD36");
        base.addLauncher("right", "Sign out", PATH + "/images/logout.png", function (e) {
            logout();
        });
        
        base.addLauncher("left", "E-Mail", null, function (e) {
            var node = this;
            require(["io.ox/mail/main"], function (m) {
                m.getApp().setLaunchBarIcon(node).launch();
            });
        }).find(".icon").css("backgroundColor", "#4085B3");
        
        base.addLauncher("left", "Address Book", null, function (e) {
            var node = this;
            require(["io.ox/contacts/main"], function (m) {
                m.getApp().setLaunchBarIcon(node).launch();
            });
        }).find(".icon").css("backgroundColor", "#000");
        
        base.addLauncher("left", "Calendar", null, function (e) {
            var node = this;
            require(["io.ox/calendar/main"], function (m) {
                m.getApp().setLaunchBarIcon(node).launch();
            });
        });
        
        base.addLauncher("left", "Files", null, function (e) {
            var node = this;
            require(["io.ox/files/main"], function (m) {
                m.getApp().setLaunchBarIcon(node).launch();
            });
        });
        
        $("#background_loader").removeClass("busy").fadeOut(500);
    }
    
    return {
        launch: launch
    };
});