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

define("core", function () {

    var logout = function () {
        
        ox.api.session.logout()
        .done(function () {
            $("#background_loader").fadeIn(500, function () {
                $("#io-ox-core").hide();
                window.location.href = "index.html";
            });
        });
    };
    
    $("#io-ox-core")
    .append(
        $("<div/>", { id: "desktop" })
        .css({
            position: "absolute",
            top: "50px",
            width: "500px",
            left: "50%",
            marginLeft: "-250px",
            border: "5px solid #ccc",
            backgroundColor: "white",
            padding: "2em",
            textAlign: "center"
        })
        .append(
            $("<div/>")
            .css({
                fontSize: "24pt"
            })
            .text("You just signed in! But here's nothing to see!")
        )
        .append(
            $.button({
                title: "Sign out",
                click: logout
            })
        )
    )
    .show();
    
    $("#background_loader").removeClass("busy").fadeOut(500, function () {
        // foo
    });

});