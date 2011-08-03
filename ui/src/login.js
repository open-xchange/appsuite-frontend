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

$(document).ready(function () {

    // server config
    var serverConfig = {};

    // continuation
    var cont = function () {
        $("#io-ox-login-username").focus();
    };
    
    var cleanUp = function () {
        // remove dom nodes
        $("#io-ox-login-header, #io-ox-login-feedback, #io-ox-login-footer").remove();
        // clear form
        $("#io-ox-login-username").val("");
        $("#io-ox-login-password").val("");
        // free closures
        cleanUp = fnSubmit = fnChangeLanguage =  initialize = serverConfig = null;
    };
    
    /**
     * Load core
     */
    var loadCore = function () {
        // remove unnecessary stuff
        cleanUp();
        // show loader
        $("#background_loader").fadeIn(500, function () {
            // hide login dialog
            $("#io-ox-login-screen").hide();
            $(this).addClass("busy");
            // load core
            require(["core"]);
        });
    };

    /**
     * Handler for form submit
     */
    var fnSubmit = function (e) {
        // stop
        e.preventDefault();
        // be busy
        $("#io-ox-login-feedback").addClass("busy");
        $("#io-ox-login-blocker").show();
        $("#io-ox-login-feedback").empty();
        // login
        ox.api.session.login(
            $("#io-ox-login-username").val(),
            $("#io-ox-login-password").val(),
            $("#io-ox-login-store-box").prop("checked")
        )
        .always(function () {
            // stop being busy
            $("#io-ox-login-blocker").hide();
            $("#io-ox-login-feedback").removeClass("busy");
        })
        .done(function () {
            // success: load core
            loadCore();
        })
        .fail(function (error) {
            // fail
            $("#io-ox-login-feedback").removeClass("busy");
            // shake it!
            $("#login-box-content").effect("shake", {
                direction: "left",
                times: 4,
                distance: 10
            }, 50, function () {
                // show error
                $("#io-ox-login-feedback").text(
                    ox.util.formatError(error, "%1$s")
                );
                // reset focus
                $("#io-ox-login-username").focus();
            });
        });
    };
    
    var changeLanguage = function (id) {
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
    
    var fnChangeLanguage = function (e) {
        // stop event
        e.preventDefault();
        // change language
        changeLanguage(e.data);
    };
    
    /**
     * Set default language
     */
    var setDefaultLanguage = function () {
        // look at navigator.language with en_US as fallback
        var navLang = navigator.language.substr(0, 2), lang = "en_US";
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
     * Try auto login
     */
    var autoLogin = function () {
        ox.api.session.autoLogin()
        .done(loadCore)
        .fail(initialize);
    };
    
    /**
     * Initialize login screen
     */
    var initialize = function () {
        // shortcut
        var sc = serverConfig;
        // show languages
        if (sc.languages !== false) {
            var lang = sc.languages, node = $("#io-ox-language-list"), id = "";
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
        var header = sc.pageHeader || "open xchange server 7";
        $("#io-ox-login-header").html(header);
        // update footer
        var footer = sc.copyright ? sc.copyright + " " : "";
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
            $("#io-ox-login-username").focus();
            $("#background_loader").fadeOut(500, cont);
        });
    };

    // init require.js
    require({
        baseUrl: "src"
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
        $("title").text(serverConfig.pageTitle || "ox7");
        // auto login?
        var cont = function () {
            if (serverConfig.autoLogin === true) {
                autoLogin();
            } else {
                initialize();
            }
        }
        // get basic modules
        require(["api/base", "api/http"], cont);
    });

}());
