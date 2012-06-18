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

// init require.js
require({
    // inject version
    baseUrl: ox.base + "/apps",
    waitSeconds: 60 //_.browser.IE ? 20 : 10
});

// add fake console (esp. for IE)
if (typeof window.console === 'undefined') {
    window.console = { log: $.noop, debug: $.noop, error: $.noop };
}

$(document).ready(function () {
    "use strict";

    if (1 > 2) {
        $('#io-ox-login-header').text('Yalla ' + _.now());
        $('#background_loader').hide();
        $('#io-ox-login-screen').show();

        return;
    }

    // animations
    var DURATION = 250,
        // flags
        relogin = false,
        // functions
        cont,
        cleanUp,
        gotoCore,
        loadCore,
        loginSuccess,
        fnSubmit,
        fnChangeLanguage,
        changeLanguage,
        setDefaultLanguage,
        autoLogin,
        initialize,
        // shortcut
        enc = encodeURIComponent;

    // continuation
    cont = function () {
        $("#io-ox-login-username").focus().select();
    };

    cleanUp = function () {
        // remove dom nodes
        $("#io-ox-login-footer").remove();
        // update form
        $("#io-ox-login-username").attr("disabled", "disabled");
        $("#io-ox-login-password").val("");
        // unbind
        $("#io-ox-login-form").off("submit");
        // free closures
        cleanUp = fnChangeLanguage =
            changeLanguage = initialize = null;
    };

    gotoCore = function (viaAutoLogin) {
        if (ox.signin === true) {
            // show loader
            $("#background_loader").fadeIn(DURATION, function () {
                var ref = _.url.hash('ref'),
                    location = "#?" + enc(
                            _.rot("session=" + ox.session + "&user=" + ox.user + (ref ? "&ref=" + enc(ref) : ''), 1)
                    );
                // use redirect servlet for real login request
                // this even makes chrome and safari asking for storing credentials
                // skip this for auto-login or during offline mode
                if (viaAutoLogin || !ox.online) {
                    _.url.redirect(location);
                } else {
                    // use redirect servlet
                    $("#io-ox-login-form")
                        .off('submit')
                        .attr('action', ox.apiRoot + '/redirect')
                        .removeAttr('target')
                        .find('input[type=hidden][name=location]').val(ox.root + '/' + location).end()
                        .submit();
                }
            });
        } else {
            loadCore();
        }
    };

    /**
     * Load core
     */
    loadCore = function () {
        // remove unnecessary stuff
        cleanUp();
        // hide login dialog
        $("#io-ox-login-screen").hide();
        $(this).busy();
        // get configuration & core
        require("io.ox/core/config").load()
        .done(function () {
            // Set user's language (as opposed to the browser's language)
            var lang = require("io.ox/core/config").get("language");
            require("io.ox/core/gettext").setLanguage(lang);
            $.when(
                require(["io.ox/core/main"]),
                require("themes").set("default")
            ).done(function (core) {
                // go!
                core.launch();
            });
        });
    };

    // default success handler
    loginSuccess = gotoCore;

    /**
     * Handler for form submit
     */
    fnSubmit = function (e) {
        // stop unless iOS
        e.preventDefault();
        //if (!_.browser.iOS) {  }
        // restore form
        var restore = function () {
                // stop being busy
                $("#io-ox-login-blocker").hide();
                $("#io-ox-login-feedback").idle();
            },
            // fail handler
            fail = function (error) {
                // fail
                $("#io-ox-login-feedback").idle();
                // shake it!
                $("#login-box-content").stop().shake()
                .done(function () {
                    // show error
                    $("#io-ox-login-feedback").text(
                        _.formatError(error, "%1$s")
                    );
                    // restore form
                    restore();
                    // reset focus
                    $("#io-ox-login-" + (relogin ? "password" : "username")).focus().select();
                });
            },
            // get user name / password
            username = $("#io-ox-login-username").val(),
            password = $("#io-ox-login-password").val();
        // be busy
        $("#io-ox-login-blocker").show();
        $("#io-ox-login-feedback").busy().empty();
        // user name and password shouldn't be empty
        if ($.trim(username).length === 0 || ($.trim(password).length === 0 && ox.online)) {
            fail({
                error: "Please enter your credentials.",
                code: "UI-0001"
            });
            return;
        }
        // login
        require("io.ox/core/session")
            .login(
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
        return require(["io.ox/core/login." + id]).done(function (gt) {
            // get all nodes
            $("[data-i18n]").each(function () {
                var node = $(this),
                    val = gt(node.attr("data-i18n"));
                if (this.tagName === "INPUT") {
                    node.val(val);
                } else {
                    node.text(val);
                }
            });
        });
    };

    fnChangeLanguage = function (e) {
        // stop event
        e.preventDefault();
        // change language
        changeLanguage(e.data.id);
    };

    /**
     * Set default language
     */
    setDefaultLanguage = function () {
        // look at navigator.language with en_US as fallback
        var navLang = (navigator.language || navigator.userLanguage).substr(0, 2),
            lang = "en_US", id = "";
        for (id in ox.serverConfig.languages) {
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
    (function () {

        var queue = [];

        ox.relogin = function (request, deferred) {
            if (!ox.online) {
                return;
            }
            if (!relogin) {
                // enqueue last request
                queue = [{ request: request, deferred: deferred }];
                // set flag
                relogin = true;
                // set header
                $("#io-ox-login-header").html(
                    "Your session is expired." + "<br/>" +
                    "<small>Please sign in again to continue.</small>"
                );
                // bind
                $("#io-ox-login-form").on("submit", fnSubmit);
                $("#io-ox-login-username").val(ox.user || "");
                $("#io-ox-login-password").val("");
                // set success handler
                loginSuccess = function () {
                    $("#io-ox-login-screen").fadeOut(DURATION, function () {
                        $("#io-ox-login-screen-decorator").hide();
                        // process queue
                        var i = 0, item, http = require("io.ox/core/http");
                        for (; (item = queue[i]); i++) {
                            http.retry(item.request)
                                .done(item.deferred.resolve)
                                .fail(item.deferred.fail);
                        }
                        // set flag
                        relogin = false;
                    });
                };
                // show login dialog
                $("#io-ox-login-screen-decorator").show();
                $("#io-ox-login-screen").addClass("relogin").fadeIn(DURATION, function () {
                    $("#io-ox-login-password").focus().select();
                });
            } else {
                // enqueue last request
                queue.push({ request: request, deferred: deferred });
            }
        };
    }());

    /**
     * Auto login
     */
    autoLogin = function () {

        var ref;

        function fail() {
            if (ox.signin) {
                initialize();
            } else {
                ref = (location.hash || '').replace(/^#/, '');
                _.url.redirect('signin' + (ref ? '#ref=' + enc(ref) : ''));
            }
        }

        // got session via hash?
        if (_.url.hash("session")) {
            ox.session = _.url.hash("session");
            ox.user = _.url.hash("user");
            ref = _.url.hash("ref");
            _.url.redirect('#' + (ref ? decodeURIComponent(ref) : ''));
            loadCore();
        } else if (ox.serverConfig.autoLogin === true && ox.online) {
            // try auto login
            require("io.ox/core/session").autoLogin()
                .done(function () {
                    gotoCore(true);
                })
                .fail(fail);
        } else {
            fail();
        }
    };

    /**
     * Initialize login screen
     */
    initialize = function () {
        // shortcut
        var sc = ox.serverConfig, lang = sc.languages, node, id = "",
            header = "", footer = "";
        // show languages
        if (lang !== false) {
            node = $("#io-ox-language-list");
            for (id in lang) {
                node.append(
                    $("<a/>", { href: "#" })
                    .on("click", { id: id }, fnChangeLanguage)
                    .text(lang[id])
                );
                node.append(document.createTextNode("\u00A0 "));
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
        // disable password?
        if (!ox.online) {
            $("#io-ox-login-password").attr("disabled", "disabled");
            $("#io-ox-login-feedback").html("Offline mode");
        } else {
            $("#io-ox-login-password").removeAttr("disabled");
        }
        // recommend chrome frame?
        if (_.browser.IE <= 8) {
            var link = "http://www.google.com/chromeframe/?user=true";
            $("#io-ox-login-feedback").html(
                '<div>Your browser is slow and outdated!</div>' +
                '<div style="font-size: 0.8em">Try <a href="' + link + '" target="_blank">Google Chrome Frame</a> ' +
                'for much better performance. It&rsquo;s awesome! ' +
                'Administrator rights are not required. Just restart IE after installation.</div>'
            );
        }

        return $.when(
                // load extensions
                require(["io.ox/core/extensions"]).pipe(function (ext) { return ext.loadPlugins(); }),
                // use browser language
                setDefaultLanguage()
            )
            .done(function () {
                // show login dialog
                $("#io-ox-login-blocker").on("mousedown", false);
                $("#io-ox-login-form").on("submit", fnSubmit);
                $("#io-ox-login-username").removeAttr("disabled").focus().select();
                $("#background_loader").idle().fadeOut(DURATION, cont);
            });
    };

    // teach require.js to use deferred objects
    var req = window.req = require;
    require = function (deps, callback) {
        if (_.isArray(deps)) {
            // use deferred object
            var def = $.Deferred().done(callback || $.noop);
            req(deps, def.resolve);
            return def;
        } else {
            // bypass
            return req.apply(this, arguments);
        }
    };

    /**
     * Asynchronous define (has same signature than define)
     * Callback must return deferred object.
     */
    define.async = (function () {

        var getLoader = function (name, deps, callback) {
                return function (n, req, onLoad, config) {
                    // resolve module dependencies
                    req(deps, function () {
                        // get module (must return deferred object)
                        var def = callback.apply(null, arguments);
                        if (def && def.done) {
                            def.done(onLoad);
                        } else {
                            console.error('Module "' + name + '" does not return a deferred object!');
                        }
                        name = deps = callback = null;
                    });
                };
            };

        return function (name, deps, callback) {
            // use loader plugin to defer module definition
            define(name + ':init', { load: getLoader(name, deps, callback) });
            // define real module - will wait for promise
            define(name, [name + ':init!'], _.identity);
        };
    }());

    // searchfield fix
    if (!_.browser.Chrome) {
        $("html").addClass("no-searchfield");
    }

    // do we have a mouse?
    if (!Modernizr.touch) {
        $("html").addClass("mouse");
    }

    // no ellipsis? (firefox)
    // TODO: fix this; v11 support text-overflow
    if (_.browser.Firefox) {
        $("html").addClass("no-ellipsis");
    }

    // be busy
    $("#background_loader").busy();

    var boot = function () {
        // get pre core & server config
        require([ox.base + "/src/serverconfig.js", ox.base + "/pre-core.js"])
            .done(function (data) {
                // store server config
                ox.serverConfig = data;
                // set page title now
                document.title = ox.serverConfig.pageTitle || '';
                // continue
                autoLogin();
            });
    };

    // handle online/offline mode
    if (!ox.signin) {
        $(window).on("online offline", function (e) {
            if (e.type === "offline") {
                $("#io-ox-offline").text("Offline").fadeIn(DURATION);
                ox.online = false;
            } else {
                $("#io-ox-offline").text("Online").fadeOut(DURATION);
                ox.online = true;
            }
        });
        if (!ox.online) {
            $(window).trigger("offline");
        }
    }

    // handle document visiblity
    $(window).on("blur focus", function (e) {
            ox.windowState = e.type === "blur" ? "background" : "foreground";
        });

    // support for application cache?
    if (Modernizr.applicationcache) {

        (function () {

            var ac = window.applicationCache,
                clear, isOn, updateReady, cont, timer;

            clear = function () {
                ac.removeEventListener("checking", isOn, false);
                ac.removeEventListener("cached", cont, false);
                ac.removeEventListener("noupdate", cont, false);
                ac.removeEventListener("error", cont, false);
                ac.removeEventListener("updateready", updateReady, false);
            };

            updateReady = function () {
                // if manifest has changed, we have to swap caches and reload
                if (ac.status === ac.UPDATEREADY) {
                    clear();
                    ac.swapCache();
                    location.reload();
                }
            };

            cont = function (e) {
                clear();
                boot();
                cont = $.noop;
            };

            // fallback for denied caching
            timer = setTimeout(cont, 500);

            isOn = function (e) {
                clearTimeout(timer);
            };

            ac.addEventListener("checking", isOn, false);
            ac.addEventListener("cached", cont, false);
            ac.addEventListener("noupdate", cont, false);
            ac.addEventListener("error", cont, false);
            ac.addEventListener("updateready", updateReady, false);

        }());
    } else {
        boot();
    }
});
