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

// add fake console (esp. for IE)
if (typeof window.console === 'undefined') {
    window.console = { log: $.noop, debug: $.noop, error: $.noop, warn: $.noop, info: $.noop };
}

// not document.ready casue we wait for CSS to be loaded
$(window).load(function () {

    'use strict';

    if (_.url.hash("cacheBusting")) {
        ox.base = ox.base + _.now();
    }

    // enable special logging to investigate why boot fails
    var debug = _.url.hash('debug') === 'boot' ? function () { console.log.apply(console, arguments); } : $.noop;

    debug('boot.js: Go!');

    // animations
    var DURATION = 250,
        // functions
        boot,
        appCache = $.Deferred(),
        cont,
        cleanUp,
        gotoCore,
        loadCore,
        loginSuccess,
        fnSubmit,
        fnChangeLanguage,
        changeLanguage,
        forcedLanguage,
        setDefaultLanguage,
        autoLogin,
        initialize,
        contextmenu_blacklist,
        // shortcut
        enc = encodeURIComponent;

    // suppress context menu
    contextmenu_blacklist = [
        '#io-ox-topbar',
        '.vgrid',
        '.foldertree-sidepanel',
        '.window-toolbar',
        '.io-ox-notifications',
        '.io-ox-inline-links',
        '.io-ox-action-link',
        '.widgets',
        'select',
        'button',
        'input[type=radio]',
        'input[type=checkbox]',
        '.btn',
        '.dropdown',
        '.icon-search',
        '.contact-grid-index',
        '.file-icon .wrap',
        '.carousel',
        '.mediaplayer'
    ];

    if (!ox.debug) {
        $(document).on('contextmenu', contextmenu_blacklist.join(', '), function (e) {
            e.preventDefault();
        });
    }

    //ugly device hack
    //if device small wait 10ms check again
    //maybe the check was made too early could be wrong
    //desktop was recognized as mobile in some cases because of this
    if(_.device('small')) {
        setTimeout(function () {
            _.recheckDevice();
        }, 10);

    }

    // check for supported browser
    function isBrowserSupported() {
        var supp = false;
        _.each(_.browserSupport, function(value, key) {
            if (_.browser[key] >= value) {
                supp =  true;
            }
        });
        return supp;
    }
    window.isBrowserSupported = isBrowserSupported;

    // continuation
    cont = function () {
        $('#io-ox-login-username').focus().select();
    };

    cleanUp = function () {
        // remove dom nodes
        $('#io-ox-login-footer').remove();
        // update form
        $('#io-ox-login-username').prop('disabled', true);
        $('#io-ox-login-password').val('');
        // unbind
        $('#io-ox-login-form').off('submit');
        // free closures
        cleanUp = fnChangeLanguage = initialize = $.noop;
    };

    // do we have a mouse?
    if (!Modernizr.touch) {
        $('html').addClass('mouse');
    }

    // no ellipsis? (firefox)
    // TODO: fix this; v11 support text-overflow
    if (_.browser.Firefox) {
        $('html').addClass('no-ellipsis');
    }

    if (_.device('iOS')) {
        $('html').addClass('ios');
    }

    if (_.device('Android')) {
        if (_.browser.chrome === 18 || !_.browser.chrome) {
             $('html').addClass('legacy-chrome');
        }
        // disable context menu on chrome for android
        document.oncontextmenu = function (e) {
            e.preventDefault();
            return false;
        };
    }

    // be busy
    $('#background-loader').busy();

    $(window).on('online offline', function (e) {
        ox.trigger('connection:' + e.type);
    });

    // handle document visiblity
    $(window).on('blur focus', function (e) {
        ox.windowState = e.type === 'blur' ? 'background' : 'foreground';
    });

    // detect if backend is down
    var serverTimeout = setTimeout(serverDown, 30000); // long timeout for slow connections & IE

    function serverUp() {
        $('body').removeClass('down'); // to be safe
        serverDown = $.noop;
        clearTimeout(serverTimeout);
    }

    function serverDown() {
        $('body').addClass('down');
        $('#io-ox-login-container').empty().append(
            $('<div class="alert alert-info">').append(
                $('<div><b>Connection error</b></div> The service is not available right now. <a href="#">Retry</a>')
            )
            .on('click', function (e) { e.preventDefault(); location.reload(); })
        );
        $('#background-loader').idle().fadeOut(DURATION);
        console.warn('Server is down.');
        serverDown = $.noop;
    }

    // teach require.js to use deferred objects
    var req = window.req = require;
    require = function (deps, success, fail) {
        if (_.isArray(deps)) {
            // use deferred object
            _(deps).each(function (m) {
                $(window).trigger("require:require", m);
            })
            var def = $.Deferred().done(success).fail(fail);
            req(deps, def.resolve, def.reject);
            return def.promise();
        } else {
            // bypass
            return req.apply(this, arguments);
        }
    };
    _.extend(require, req);

    function loadSuccess(http, session, cache, extensions, gettext, manifests, capabilities, themes) {

        var gt; // set by initialize()

        debug('boot.js: require > loadSuccess');

        // feedback
        var feedbackType = null, feedbackNode = null;
        ox.on('language', displayFeedback);

        function displayFeedback() {

            var node = feedbackNode;

            if (!node) return;
            if (typeof node === 'function') node = node();
            if (typeof node === 'string') node = $.txt(gt(node));

            $('#io-ox-login-feedback').empty().append(
                $('<div role="alert" class="selectable-text alert alert-block alert-info">').append(
                    node
                )
            );
        }

        function feedback(type, node) {
            feedbackType = type;
            feedbackNode = node;
            displayFeedback();
        }

        gotoCore = function (viaAutoLogin) {
            if (ox.signin === true) {
                // show loader
                $('#background-loader').fadeIn(DURATION, function () {
                    var ref = _.url.hash('ref'),
                        location = '#?' + enc(_.rot(
                            'session=' + ox.session +
                            '&user=' + ox.user +
                            '&user_id=' + ox.user_id +
                            '&context_id=' + ox.context_id +
                            '&secretCookie=' + $('#io-ox-login-store-box').prop('checked') +
                            '&language=' + ox.language + (ref ? '&ref=' + enc(ref) : ''), 1)
                        );
                    // use redirect servlet for real login request
                    // this even makes chrome and safari asking for storing credentials
                    // skip this for auto-login or during offline mode
                    if (viaAutoLogin || !ox.online) {
                        _.url.redirect(location);
                    } else {
                        // use redirect servlet
                        $('#io-ox-login-form')
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
            $('#io-ox-login-screen').hide();
            $(this).busy();
            debug('boot.js: loadCore > load settings ...');
            // get configuration & core
            require(['settings!io.ox/core'], function (settings) {
                var theme = _.url.hash('theme') || settings.get('theme') || 'default';
                debug('boot.js: loadCore > load config ...');

                debug('boot.js: loadCore > require "main" & set theme', theme);

                var def1 = require(['io.ox/core/main']),
                    def2 = themes.set(theme);

                function cont() {
                    def1.then(
                        function success(core) {
                            // go!
                            debug('boot.js: core.launch()');
                            core.launch();
                        },
                        function fail(e) {
                            console.error('Cannot launch core!', e);
                        }
                    );
                }

                function fail() {
                    console.error('Could not load theme: ' + theme);
                    gotoSignin('autologin=false');
                }

                $.when(def1, def2).always(function () {
                    // failed to load theme?
                    if (def2.state() === 'rejected') {
                        // give up if it was the default theme
                        if (theme === 'default') return fail();
                        // otherwise try to load default theme now
                        console.error('Could not load custom theme: ' + theme);
                        themes.set('default').then(cont, fail);
                    } else {
                        cont();
                    }
                });
            }, function () {
                debug('boot.js: loadCore > load config failed, using default ...');
                var def1 = require(['io.ox/core/main']),
                    def2 = themes.set('default');

                function cont() {
                    debug('boot.js: loadCore def1 and def2 resolved');
                    def1.then(
                        function success(core) {
                            // go!
                            debug('boot.js: core.launch()');
                            core.launch();
                        },
                        function fail(e) {
                            console.error('Cannot launch core!', e);
                        }
                    );
                }

                function fail() {
                    console.error('Could not load theme: ' + theme);
                    gotoSignin('autologin=false');
                }

                $.when(def2, def1).then(cont, fail);
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
            // restore form
            var restore = function () {
                    // stop being busy
                    $('#io-ox-login-form').css('opacity', '');
                    $('#io-ox-login-blocker').hide();
                    $('#io-ox-login-feedback').idle();
                },
                // fail handler
                fail = function (error, focus) {
                    // fail
                    $('#io-ox-login-feedback').idle();
                    // visual response (shake sucks on touch devices)
                    $('#io-ox-login-form').css('opacity', '');
                    // show error
                    if (error && error.error === '0 general') {
                        feedback('error', 'No connection to server. Please ' +
                                 'check your internet connection and retry.');
                    } else {
                        feedback('error', $.txt(_.formatError(error, '%1$s (%2$s)')));
                    }
                    // restore form
                    restore();
                    // reset focus
                    $('#io-ox-login-' + (_.isString(focus) ? focus : 'username')).focus().select();
                },
                // get user name / password
                username = $('#io-ox-login-username').val(),
                password = $('#io-ox-login-password').val();
            // be busy
            $('#io-ox-login-form').css('opacity', 0.5);
            $('#io-ox-login-blocker').show();
            $('#io-ox-login-feedback').busy().empty();
            // user name and password shouldn't be empty
            if ($.trim(username).length === 0) {
                return fail({ error: gt('Please enter your credentials.'), code: 'UI-0001' }, 'username');
            }
            if ($.trim(password).length === 0 && ox.online) {
                return fail({ error: gt('Please enter your password.'), code: 'UI-0002' }, 'password');
            }
            // login
            session.login(
                username,
                password,
                $('#io-ox-login-store-box').prop('checked'),
                // temporary language for error messages
                forcedLanguage || ox.language || 'en_US',
                // permanent language change!?
                forcedLanguage
            )
            .done(function () {
                // success
                restore();
                loginSuccess();
            })
            .fail(fail);
        };

        changeLanguage = function (id) {
            // if the user sets a language on the login page, it will be used for the rest of the session, too
            gettext.setLanguage(id).done(function () {
                gettext.enable();
                // get all nodes
                $('[data-i18n]').each(function () {
                    var node = $(this),
                        val = gt(node.attr('data-i18n')),
                        target = (node.attr('data-i18n-attr') || 'text').split(',');
                    _.each(target, function (el) {
                        switch (el) {
                        case 'value': node.val(val); break;
                        case 'text': node.text(val); break;
                        case 'label': node.contents().get(-1).nodeValue = val; break;
                        default: node.attr(el, val); break;
                        }
                    });
                });
                // Set Cookie
                _.setCookie('language', (ox.language = id));
                // update placeholder (IE9 fix)
                if (_.browser.IE) {
                    $('input[type=text], input[type=password]').val('').placeholder();
                }
                ox.trigger('language');
            });
        };

        fnChangeLanguage = function (e) {
            // stop event
            e.preventDefault();
            // change language
            changeLanguage(e.data.id);
            // the user forced a language
            forcedLanguage = e.data.id;
        };

        var getBrowserLanguage = function () {
            var language = (navigator.language || navigator.userLanguage).substr(0, 2),
                languages = ox.serverConfig.languages || {};
            return _.chain(languages).keys().find(function (id) {
                    return id.substr(0, 2) === language;
                }).value();
        };

        /**
         * Set default language
         */
        setDefaultLanguage = function () {
            // look at navigator.language with en_US as fallback
            var navLang = (navigator.language || navigator.userLanguage).substr(0, 2),
                languages = ox.serverConfig.languages || {},
                lang = 'en_US', id = '', found = false, langCookie = _.getCookie('language');
            if (langCookie) {
                return changeLanguage(langCookie);
            }
            for (id in languages) {
                // match?
                if (id.substr(0, 2) === navLang) {
                    lang = id;
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (!_.isEmpty(languages)) {
                    lang = _(languages).keys()[0];
                }
            }
            return changeLanguage(lang);
        };

        function updateServerConfig(data) {
            ox.serverConfig = data || {};
            require('io.ox/core/capabilities').reset();
            require('io.ox/core/manifests').reset();
            capabilities.reset();
            manifests.reset();
        }

        function setFallbackConfig() {
            var webmail = {  path: 'io.ox/mail/main', requires: 'webmail', title: 'Mail' };
            updateServerConfig({
                buildDate: '',
                contact: '',
                copyright: '',
                capabilities: [{ attributes: {}, backendSupport: false, id: 'webmail' }],
                forgotPassword: false,
                languages: {},
                manifests: [webmail],
                pageHeader: '',
                pageHeaderPrefix: '',
                pageTitle: '',
                productName: '',
                productNameMail: '',
                serverVersion: '',
                version: ''
            });
        }

        function getCachedServerConfig(configCache, cacheKey, useFallback, def) {
            if (!configCache || !cacheKey) {
                setFallbackConfig();
                def.resolve();
                return;
            }
            configCache.get(cacheKey).done(function (co) {
                if (co !== null) {
                    updateServerConfig(co.data);
                    def.resolve();
                } else if (useFallback) {
                    setFallbackConfig();
                    def.resolve();
                } else {
                    def.reject();
                }
            });
        }

        var configCache,
            HOUR = 60000 * 60,
            DAY = HOUR * 24;

        function fetchServerConfig(cacheKey) {
            var def = $.Deferred();
            if (ox.online) {
                // check cache
                configCache.get(cacheKey).done(function (co) {
                    if (co !== null && co.timestamp > (_.now() - HOUR * 12)) {
                        updateServerConfig(co.data);
                        def.resolve();
                    }
                    // fetch fresh manifests
                    http.GET({
                        module: 'apps/manifests',
                        params: { action: 'config' },
                        appendSession: (cacheKey === 'userconfig')
                    })
                    .done(function (data) {
                        configCache.add(cacheKey, { data: data, timestamp: _.now() });
                        updateServerConfig(data);
                        def.resolve();
                    })
                    .fail(function () {
                        getCachedServerConfig(configCache, cacheKey, false, def);
                    });
                });
            } else {
                getCachedServerConfig(configCache, cacheKey, true, def);
            }
            return def;
        }

        function fetchUserSpecificServerConfig() {
            return fetchServerConfig('userconfig');
        }

        function fetchGeneralServerConfig() {
            return fetchServerConfig('generalconfig');
        }

        function gotoSignin(hash) {
            var ref = (location.hash || '').replace(/^#/, ''),
                path = String(ox.serverConfig.logoutLocation || ox.logoutLocation),
                glue = path.indexOf('#') > -1 ? '&' : '#';
            path = path.replace("[hostname]", window.location.hostname);
            hash = (hash || '') + (ref ? '&ref=' + enc(ref) : '');
            _.url.redirect((hash ? path + glue + hash : path));
        }

        /**
         * Auto login
         */
        autoLogin = function () {

            debug('boot.js: autoLogin ...');

            function loadCoreFiles() {
                // Set user's language (as opposed to the browser's language)
                // Load core plugins
                gettext.setLanguage(ox.language);
                if (!ox.online) {
                    gettext.enable();
                    return $.when();
                }

                debug('boot.js: loadCoreFiles > loadPluginsFor(core) ...');
                return manifests.manager.loadPluginsFor('core').always(gettext.enable);
            }

            function continueWithoutAutoLogin() {
                if (ox.signin) {
                    debug('boot.js: fetchGeneralServerConfig ...');
                    fetchGeneralServerConfig().then(
                        function success() {
                            // now we're sure the server is up
                            serverUp();
                            debug('boot.js: fetchGeneralServerConfig > success');
                            // set page title now
                            if (_.device('!small')) {
                                document.title = _.noI18n(ox.serverConfig.pageTitle || '') + ' ' + 'Login';
                            } else {
                                document.title = _.noI18n(ox.serverConfig.pageTitle || '');
                            }

                            themes.set(ox.serverConfig.signinTheme || 'login');
                            // continue
                            gettext.setLanguage('en_US');
                            require(['io.ox/core/login-i18n']).done(initialize);
                        },
                        function fail() {
                            // nope, had some stuff in the caches but server is down
                            serverDown();
                            debug('boot.js: fetchGeneralServerConfig > fail');
                        }
                    );
                } else {
                    // we need to fetch the server config to get custom logout locations
                    fetchGeneralServerConfig().always(gotoSignin);
                }
            }

            // take care of invalid sessions
            ox.relogin = function () {
                if (!ox.signin) gotoSignin('autologin=false');
            };
            ox.on('relogin:required', ox.relogin);

            // got session via hash?
            var hash = _.url.hash();
            if (hash.session) {

                debug('boot.js: autoLogin > hash.session', hash.session);

                // set session; session.store() might need it now (formlogin)
                ox.session = hash.session;

                // set store cookie?
                (hash.store === 'true' ? session.store() : $.when()).always(function () {

                    var ref = hash.ref;
                    ref = ref ? ('#' + decodeURIComponent(ref)) : location.hash;
                    _.url.redirect(ref ? ref : '#');

                    configCache = new cache.SimpleCache('manifests', true);

                    // fetch user config
                    ox.secretCookie = hash.secretCookie === 'true';
                    fetchUserSpecificServerConfig().done(function () {
                        var whoami = $.Deferred();
                        if (hash.user && hash.language && hash.user_id) {
                            whoami.resolve(hash);
                        } else {
                            require(["io.ox/core/http"], function (http) {
                                http.GET({
                                    module: 'system',
                                    params: {
                                        action: 'whoami'
                                    }
                                }).done(function (resp) {
                                    resp.language = resp.locale;
                                    whoami.resolve(resp);
                                }).fail(whoami.reject);
                            });
                        }

                        whoami.done(function (resp) {
                            serverUp();
                            // store login data (cause we have all valid languages now)
                            session.set({
                                locale: resp.language,
                                session: resp.session,
                                user: resp.user,
                                user_id: parseInt(resp.user_id || '0', 10),
                                context_id: resp.context_id
                            });
                            // cleanup url
                            _.url.hash({
                                language: null,
                                session: null,
                                user: null,
                                user_id: null,
                                context_id: null,
                                secretCookie: null,
                                store: null
                            });
                            // go ...
                            loadCoreFiles().done(function () {
                                loadCore();
                            });

                        });
                    });
                });

            } else if (hash.autologin === 'false') {

                // needed for show-stopping errors like broken settings
                configCache = new cache.SimpleCache('manifests', true);
                continueWithoutAutoLogin();

            } else if (!ox.online) {

                // not online - no auto-login possible
                debug('boot.js: autoLogin > Offline');
                gotoSignin();

            } else {

                debug('boot.js: autoLogin > session.autoLogin()');

                // try auto login!?
                session.autoLogin()
                .always(function () {
                    // init manifest cache now (have ox.user now)
                    configCache = new cache.SimpleCache('manifests', true);
                })
                .then(
                    function loginSuccess(data) {
                        // now we're sure the server is up
                        serverUp();
                        debug('boot.js: autoLogin > loginSuccess');
                        // are we on login page?
                        if (ox.signin) {
                            gotoCore(true);
                        } else {
                            debug('boot.js: autoLogin > loginSuccess > fetch user config ...');
                            fetchUserSpecificServerConfig().then(function () {
                                // apply session data (again) & page title
                                session.set(data);
                                document.title = _.noI18n(ox.serverConfig.pageTitle || '');
                                debug('boot.js: autoLogin > loginSuccess > loadCoreFiles ...');
                                return loadCoreFiles();
                            })
                            .always(function () {
                                loadCore();
                            });
                        }
                    },
                    function loginFailed(data) {
                        debug('boot.js: autoLogin > loginFailed', data);
                        // special autologin error handling. redirect user to an
                        // external page defined in the error params
                        if (data && data.code === 'LGI-0016' && (data.error_params || []).length === 1) {
                            window.location.href = data.error_params[0];
                        } else {
                            continueWithoutAutoLogin();
                        }
                    }
                );
            }
        };

        /**
         * Initialize login screen
         */
        initialize = function (gtModule) {
            gt = gtModule;

            // shortcut
            var sc = ox.serverConfig,
                lang = sc.languages,
                node,
                id = '',
                footer = '',
                i = 0,
                cl = $('#io-ox-current-language').parent(),
                maxLang = 30;

            debug('boot.js: initialize ...');

            // show languages
            if (!_.isEmpty(lang)) {

                debug('boot.js: List languages', lang);

                node = $('#io-ox-language-list');

                var langCount = _.size(lang),
                    defaultLanguage = _.getCookie('language') || getBrowserLanguage(),
                    // Display native select box for languages if there are up to "maxLang" languages
                    langSorted = _.toArray(_.invert(lang)).sort(function (a, b) {
                        return lang[a] <= lang[b] ? -1 : +1;
                    });

                if (langCount < maxLang && !_.url.hash('language-select')) {
                    for (id in langSorted) {
                        var link;
                        i++;
                        node.append(
                            $('<a href="#" aria-label="' + lang[langSorted[id]] + '">')
                                .on('click', { id: langSorted[id] }, fnChangeLanguage)
                                .text(lang[langSorted[id]])
                        );
                        if (i < langCount && langCount < maxLang) {
                            node.append($('<span class="language-delimiter">').text('\u00A0\u00A0\u2022\u00A0 '));
                        }
                    }
                } else {
                    $('#io-ox-language-list').append(
                        $('<select>').change(function(e) {
                            var id = $(this).val();
                            if (id !== '') {
                                e.data = { id: id };
                                fnChangeLanguage(e);
                            }
                        })
                        .append(
                            _(langSorted).map(function (value, id) {
                                var option = $('<option>')
                                    .attr({
                                        'aria-label': lang[langSorted[id]],
                                        'value': langSorted[id]
                                    })
                                    .text(lang[langSorted[id]]);
                                return option;
                            })
                        )
                        .val(defaultLanguage)
                    );
                }
            } else {
                $("#io-ox-languages").remove();
            }

            // update header
            $('#io-ox-login-header-prefix').text((sc.pageHeaderPrefix || '\u00A0') + ' ');
            $('#io-ox-login-header-label').text(sc.pageHeader || '\u00A0');

            // update footer
            footer = sc.copyright ? sc.copyright + ' ' : '';
            footer += sc.version ? 'Version: ' + sc.version + ' ' : '';
            var revision = 'revision' in sc ? sc.revision : ('Rev' + ox.revision);
            footer += revision !== '' ? revision + ' ' : '';
            footer += sc.buildDate ? '(' + sc.buildDate + ')' : '';
            $('#io-ox-copyright').text(footer);

            // hide checkbox?
            if (!capabilities.has("autologin")) {
                $('#io-ox-login-store').remove();
            }

            // hide forgot password?
            if (sc.forgotPassword === false) {
                $('#io-ox-forgot-password').remove();
            } else {
                $('#io-ox-forgot-password').find('a').attr('href', sc.forgotPassword);
            }

            // disable password?
            if (!ox.online) {
                $('#io-ox-login-password').prop('disabled', true);
                feedback('info', 'Offline mode');
            } else {
                $('#io-ox-login-password').prop('disabled', false);
            }

            // set username input type to text in IE
            if (_.device('IE > 9')) {
                // cannot change type with jQuery's attr()
                $('#io-ox-login-username')[0].type = 'text';
            }

            debug('boot.js: Load "signin" plugins & set default language');

            // make sure we get 'signin' plugins
            manifests.reset();

            return $.when(
                // load extensions
                manifests.manager.loadPluginsFor(ox.signin ? 'signin' : 'core'),
                // use browser language
                setDefaultLanguage()
            )
            .always(function () {

                // autologout message
                if (_.url.hash("autologout")) {
                    feedback('info', $.txt(gt('autologout')));
                }

                debug('boot.js: Check browser support');

                // supported browser?
                if (!isBrowserSupported()) {

                    if (_.device('android')) {
                        // special info for not supported android
                        feedback('info', function () {
                            return $.txt(
                                //#. %n in the lowest version of Android
                                gt('You need to use Android %n or higher.',
                                    _.browserSupport.Android));
                        });

                    } else if (_.device('ios')) {
                        // special info for not supported iOS
                        feedback('info', function () {
                            return $.txt(
                                //#. %n is the lowest version of iOS
                                gt('You need to use iOS %n or higher.',
                                    _.browserSupport.iOS));
                        });
                    } else if (_.browser.Chrome) {
                        // warning about Chrome version
                        feedback('info', function () {
                            return $('<b>').text(gt('Your browser version is not supported!'))
                                .add($.txt(_.noI18n('\xa0')))
                                .add($('<div>').text(gt('Please update your browser.')));
                        });

                    } else {
                        // general warning about browser
                        feedback('info', function () {
                            return $('<b>').text(gt('Your browser is not supported!'))
                                .add($.txt(_.noI18n('\xa0')))
                                .add($.txt(gt('For best results, please use ')))
                                .add($('<br><a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>.'));
                        });
                    }

                } else if (_.device('android') && !_.browser.chrome) {
                    // Offer Chrome to all non-chrome users on android
                    feedback('info', function () {
                        return $('<b>').text(
                            //#. "Google Chrome" is a brand and should not be translated
                            gt('For best results we recommend using Google Chrome for Android.'))
                            .add($.txt(_.noI18n('\xa0')))
                            //.# The missing word at the end of the sentence ("Play Store") will be injected later by script
                            .add($.txt(gt('Get the latest version from the ')))
                            .add($('<a href="http://play.google.com/store/apps/details?id=com.android.chrome">Play Store</>'));
                    });
                } else {
                    // cookie check (else clause because we don't want to show multiple warnings; plus this is an edge case)
                    _.setCookie('test', 'cookie');
                    if (_.getCookie('test') !== 'cookie') {
                        feedback('info', gt('Your browser\'s cookie functionality is disabled. Please turn it on.'));
                    }
                    _.setCookie('test', null, -1);
                }

                // show login dialog
                $('#io-ox-login-blocker').on('mousedown', false);
                $('#io-ox-login-form').on('submit', fnSubmit);
                $('#io-ox-login-username').prop('disabled', false).focus().select();

                debug('boot.js: Fade in ...');
                $('#background-loader').idle().fadeOut(DURATION, cont);
            });
        };

        appCache.done(function () {
            // try auto login first
            autoLogin();
        });
    }

    function loadFail(e) {
        debug('boot.js: require > loadFail');
        console.error('Server down', e.message, e);
        serverDown();
    }

    debug('boot.js: require([...], loadSuccess, loadFail);');

    require([
        'io.ox/core/http', 'io.ox/core/session', 'io.ox/core/cache', 'io.ox/core/extensions',
        'gettext', 'io.ox/core/manifests', 'io.ox/core/capabilities',
        'themes', 'io.ox/core/settings'],
        loadSuccess, loadFail
    );

    // reload if files have change; need this during development
    if (Modernizr.applicationcache && _.browser.chrome && ox.debug && $('html').attr('manifest')) {

        (function () {

            var ac = window.applicationCache, clear, updateReady, cont;

            clear = function () {
                ac.removeEventListener('cached', cont, false);
                ac.removeEventListener('noupdate', cont, false);
                ac.removeEventListener('error', cont, false);
                ac.removeEventListener('updateready', updateReady, false);
            };

            updateReady = function () {
                // if manifest has changed, we have to swap caches and reload
                if (ac.status === ac.UPDATEREADY) {
                    clear();
                    serverUp(); // avoid error
                    location.reload();
                }
            };

            cont = function (e) {
                clear();
                debug('boot.js: applicationcache > resolve');
                appCache.resolve();
            };

            ac.addEventListener('cached', cont, false);
            ac.addEventListener('noupdate', cont, false);
            ac.addEventListener('error', cont, false);
            ac.addEventListener('updateready', updateReady, false);

        }());
    } else {
        appCache.resolve();
    }
});
