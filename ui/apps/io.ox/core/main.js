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

define("io.ox/core/main", function () {

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
    
    var core = $("#io-ox-core"),
        launchBar;
    
    var addLauncher = function (label, icon, fn) {
        
        launchBar.append(
            $("<div/>").css({
                textAlign: "center",
                margin: "0 0 1em 0",
                cursor: "pointer"
            })
            .append(
                $("<img/>", { src: icon })
                .css({
                    marginBottom: "0.25em",
                    width: "64px",
                    height: "64px"
                })
            )
            .append(
                $("<div/>")
                .css({
                    color: "white",
                    fontWeight: "bold",
                    textShadow: "white 0px 3px 8px white"
                })
                .text(label)
            )
            .bind("click", fn)
        );
    };
    
    // add launch bar
    launchBar = $("<div/>")
        .css({
            position: "absolute",
            top: "10px",
            width: "120px",
            left: "10px",
            bottom: "10px",
            overflow: "hidden"
        })
        .appendTo(core);
 
    addLauncher("Sign out", PATH + "/images/logout.png", function (e) {
        logout();
    });
    
    core.show();

    require(["io.ox/contacts/main"]);

    $("#background_loader").removeClass("busy").fadeOut(500);
});