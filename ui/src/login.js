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


/*jslint bitwise: false, nomen: false, onevar: false, plusplus: false, regexp: false, white: true, browser: true, devel: true, evil: true, forin: true, undef: true, eqeqeq: true, immed: true */

/*global $, ox, require */

$(document).ready(function () {

    "use strict";
    
    // server config
    var serverConfig = {},
        // animations
        DURATION = 250,
        // flags
        relogin = false,
        // functions
        cont,
        cleanUp,
        loadCore,
        loginSuccess,
        fnSubmit,
        fnChangeLanguage,
        changeLanguage,
        setDefaultLanguage,
        autoLogin,
        initialize;

    // continuation
    cont = function () {
        $("#io-ox-login-username").focus();
    };
    
    cleanUp = function () {
        // remove dom nodes
        $("#io-ox-login-footer").remove();
        // update form
        $("#io-ox-login-username").attr("disabled", "disabled");
        $("#io-ox-login-password").val("");
        // unbind
        $("#io-ox-login-form").unbind("submit");
        // free closures
        cleanUp = fnChangeLanguage = 
            changeLanguage = initialize = serverConfig = null;
    };
    
    /**
     * Load core
     */
    loadCore = function () {
        // remove unnecessary stuff
        cleanUp();
        // load core
        require(["io.ox/core/main"]);
        // show loader
        $("#background_loader").fadeIn(DURATION, function () {
            // hide login dialog
            $("#io-ox-login-screen").hide();
            $(this).addClass("busy");
        });
    };
    
    // default success handler
    loginSuccess = loadCore;

    /**
     * Handler for form submit
     */
    fnSubmit = function (e) {
        // stop
        e.preventDefault();
        // restore form
        var restore = function () {
            // stop being busy
            $("#io-ox-login-blocker").hide();
            $("#io-ox-login-feedback").removeClass("busy");
        };
        // fail handler
        var fail = function (error) {
            // fail
            $("#io-ox-login-feedback").removeClass("busy");
            // shake it!
            $("#login-box-content").stop().effect("shake", {
                direction: "left",
                times: 4,
                distance: 10
            }, 50, function () {
                // show error
                $("#io-ox-login-feedback").text(
                    ox.util.formatError(error, "%1$s")
                );
                // restore form
                restore();
                // reset focus
                $("#io-ox-login-" + (relogin ? "password" : "username")).focus();
            });
        };
        // be busy
        $("#io-ox-login-feedback").addClass("busy");
        $("#io-ox-login-blocker").show();
        $("#io-ox-login-feedback").empty();
        // get username / password
        var username = $("#io-ox-login-username").val(),
            password = $("#io-ox-login-password").val();
        // username and password shouldn't be empty
        if ($.trim(username).length === 0 || $.trim(password).length === 0) {
            return (fail({ error: "Please enter your credentials.", code: "UI-0001" }));
        }
        // login
        ox.api.session.login(
            username,
            password,
            $("#io-ox-login-store-box").prop("checked")
        )
        .done(function () {
            // success
            restore();
            loginSuccess();
        })
        .fail(fail);
    };
    
    changeLanguage = function (id) {
        // change language
        var cont = function (data) {
            // clear feedback area
            $("#io-ox-login-feedback").empty();
            // get all nodes
            $("[data-i18n]").each(function () {
                var node = $(this),
                    val = (id === "en_US") ? node.attr("data-i18n") : data[node.attr("data-i18n")];
                switch (this.tagName) {
                    case "INPUT":
                        node.val(val);
                        break;
                    default:
                        node.text(val);
                        break;
                }
            });
        };
        // get language pack
        if (id !== "en_US") {
            return $.when(
                $.ajax({
                    url: "src/i18n/" + id + ".js",
                    dataType: "json"
                })
                .done(cont)
            );
        } else {
            cont({});
            return $.Deferred().resolve();
        }
    };
    
    fnChangeLanguage = function (e) {
        // stop event
        e.preventDefault();
        // change language
        changeLanguage(e.data);
    };
    
    /**
     * Set default language
     */
    setDefaultLanguage = function () {
        // look at navigator.language with en_US as fallback
        var navLang = (navigator.language || navigator.userLanguage).substr(0, 2),
            lang = "en_US", id = "";
        for (id in serverConfig.languages) {
            // match?
            if (id.substr(0, 2) === navLang) {
                lang = id;
                break;
            }
        }
        return changeLanguage(lang);
    };
    
    /**
     * Relogin
     */
    ox.ui.session.relogin = function () {
        // set header
        $("#io-ox-login-header").html(
            "Your session is expired." + "<br/>" + 
            "<small>Please sign in again to continue.</small>"
        );
        // bind
        $("#io-ox-login-form").bind("submit", fnSubmit);
        $("#io-ox-login-password").val("");
        // set success handler
        loginSuccess = function () {
            $("#io-ox-login-screen").fadeOut(DURATION, function () {
                $("#io-ox-login-screen-decorator").hide();
            });
        };
        // set flag
        relogin = true;
        // show login dialog
        $("#io-ox-login-screen-decorator").show();
        $("#io-ox-login-screen").addClass("relogin").fadeIn(DURATION, function () {
            $("#io-ox-login-password").focus();
        });
    };
    
    /**
     * Try auto login
     */
    autoLogin = function () {
        ox.api.session.autoLogin()
        .done(loadCore)
        .fail(initialize);
    };
    
    /**
     * Initialize login screen
     */
    initialize = function () {
        // shortcut
        var sc = serverConfig, lang = sc.languages, node, id = "",
            header = "", footer = "";
        // show languages
        if (lang !== false) {
            node = $("#io-ox-language-list");
            for (id in lang) {
                node.append(
                    $("<a/>", { href: "#" })
                    .bind("click", id, fnChangeLanguage)
                    .text(lang[id])
                );
                node.append(document.createTextNode("\u00a0 "));
            }
        } else {
            $("#io-ox-languages").remove();
        }
        // update header
        header = sc.pageHeader || "open xchange 7";
        $("#io-ox-login-header").html(header);
        // update footer
        footer = sc.copyright ? sc.copyright + " " : "";
        footer += sc.version ? "Version: " + sc.version + " " : "";
        footer += sc.buildDate ? "(" + sc.buildDate + ")" : "";
        $("#io-ox-copyright").html(footer);
        // hide checkbox?
        if (sc.autoLogin === false) {
            $("#io-ox-login-store").remove();
        }
        // hide forgot password?
        if (sc.forgotPassword === false) {
            $("#io-ox-forgot-password").remove();
        } else {
            $("#io-ox-forgot-password").find("a").attr("href", sc.forgotPassword);
        }
        // use browser language
        setDefaultLanguage().done(function () {
            // show login dialog
            $("#io-ox-login-blocker").bind("mousedown", false);
            $("#io-ox-login-form").bind("submit", fnSubmit);
            $("#io-ox-login-screen").show();
            $("#io-ox-login-username").removeAttr("disabled").focus();
            $("#background_loader").removeClass("busy").fadeOut(DURATION, cont);
        });
    };

    // init require.js
    require({
        baseUrl: "apps"
    });

    // get server config
    $.ajax({
        url: "src/serverconfig.js",
        dataType: "json"
    })
    .done(function (data) {
        // store server config
        serverConfig = data;
        // set page title now
        document.title = serverConfig.pageTitle || "ox7";
        // auto login?
        var cont = function () {
            if (serverConfig.autoLogin === true) {
                autoLogin();
            } else {
                initialize();
            }
        };
        // get basic modules
        require(
            ["io.ox/core/base", "io.ox/core/http", "io.ox/core/event"],
            function () {
                require(["io.ox/core/cache"], cont);
            }
        );
    });

    // prevent text selection
//    if (ox.browser.IE) {
//        $(document).bind("selectstart", function (e) {
//            if (!(this.tagName === "input" || this.tagName === "TEXTAREA")) {
//                return false;
//            }
//        });
//    }
});
