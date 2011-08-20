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
    
    base.addLauncher("Sign out", PATH + "/images/logout.png", function (e) {
        logout();
    });
    
    base.addWindow("E-Mail", PATH + "/images/logout.png", function (e) {
        require(["io.ox/mail/main"], function (m) {
            m.app.launch();
        });
    });
    
    base.addWindow("Address Book", PATH + "/images/logout.png", function (e) {
        require(["io.ox/contacts/main"], function (m) {
            m.app.launch();
        });
    });
    
    base.addWindow("Calendar", PATH + "/images/logout.png", function (e) {
        require(["io.ox/calendar/main"], function (m) {
            m.app.launch();
        });
    });
    
    base.addWindow("Files", PATH + "/images/logout.png", function (e) {
        require(["io.ox/files/main"], function (m) {
            m.app.launch();
        });
    });

    $("#background_loader").removeClass("busy").fadeOut(500);
    
    return {};
});