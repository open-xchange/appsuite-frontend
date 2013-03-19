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
    window.console = { log: $.noop, debug: $.noop, error: $.noop, warn: $.noop };
}

// not document.ready casue we wait for CSS to be loaded
$(window).load(function () {

    'use strict';

    if (_.url.hash("cacheBusting")) {
        ox.base = ox.base + _.now();
    }

    if (!ox.signin) {
        require(['less!io.ox/core/bootstrap/css/bootstrap.less']);
    }

    // animations
    var DURATION = 250,
        // flags
        relogin = false,
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

    // Disable attachments and uploads for specific clients
    if (!_.browser.iOS) {
        ox.uploadsEnabled = true;
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

    // feedback
    function feedback(type, node) {
        $('#io-ox-login-feedback').empty().append(
            $('<div class="alert alert-block alert-' + type + ' selectable-text">').append(node)
        );
    }

    // gettext for stupids
    function gt(id) {
        return $('#io-ox-login-feedback-strings').find('[data-i18n-id="' + id + '"]').text();
    }

    // continuation
    cont = function () {
        $('#io-ox-login-username').focus().select();
    };

    cleanUp = function () {
        // remove dom nodes
        $('#io-ox-login-footer').remove();
        // update form
        $('#io-ox-login-username').attr('disabled', 'disabled');
        $('#io-ox-login-password').val('');
        // unbind
        $('#io-ox-login-form').off('submit');
        // free closures
        cleanUp = fnChangeLanguage = changeLanguage = initialize = $.noop;
    };

    // searchfield fix
    if (!_.browser.Chrome) {
        $('html').addClass('no-searchfield');
    }

    // do we have a mouse?
    if (!Modernizr.touch) {
        $('html').addClass('mouse');
    }

    // no ellipsis? (firefox)
    // TODO: fix this; v11 support text-overflow
    if (_.browser.Firefox) {
        $('html').addClass('no-ellipsis');
    }

    // be busy
    $('#background_loader').busy();

    // handle online/offline mode
    if (!ox.signin) {
        $(window).on('online offline', function (e) {
            if (e.type === 'offline') {
                $('#io-ox-offline').text('Offline').fadeIn(DURATION);
                ox.online = false;
            } else {
                $('#io-ox-offline').text('Online').fadeOut(DURATION);
                ox.online = true;
            }
        });
        if (!ox.online) {
            $(window).trigger('offline');
        }
    }

    // handle document visiblity
    $(window).on('blur focus', function (e) {
        ox.windowState = e.type === 'blur' ? 'background' : 'foreground';
    });

    // clear persistent caches due to update?
    // TODO: add indexedDB once it's getting used
    if (Modernizr.localstorage) {
        var ui = JSON.parse(localStorage.getItem('appsuite-ui') || '{}');
        if (ui.version !== ox.version) {
            if (ox.debug === true) {
                console.warn('clearing localStorage due to UI update');
            }
            localStorage.clear();
            localStorage.setItem('appsuite-ui', JSON.stringify({ version: ox.version }));
        }
    }

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
        $('#background_loader').idle().fadeOut(DURATION);
        console.warn('Server is down.');
        serverDown = $.noop;
    }

    // teach require.js to use deferred objects
    var req = window.req = require;
    require = function (deps, success, fail) {
        if (_.isArray(deps)) {
            // use deferred object
            var def = $.Deferred().done(success).fail(fail);
            req(deps, def.resolve, def.reject);
            return def.promise();
        } else {
            // bypass
            return req.apply(this, arguments);
        }
    };
    _.extend(require, req);

    function loadSuccess(http, session, cache, extensions, gettext, manifests, capabilities, config, themes) {

        serverUp();

        gotoCore = function (viaAutoLogin) {
            if (ox.signin === true) {
                // show loader
                $('#background_loader').fadeIn(DURATION, function () {
                    var ref = _.url.hash('ref'),
                        location = '#?' + enc(_.rot('session=' + ox.session + '&user=' + ox.user +
                            '&user_id=' + ox.user_id + '&language=' + ox.language + (ref ? '&ref=' + enc(ref) : ''), 1)
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
                            .find('input[type=hidden][name=location]').val(ox.root + '/' + location /* _.url.get(location) */).end()
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
            // get configuration & core
            require(['settings!io.ox/core'], function (settings) {
                var theme = settings.get('theme') || 'default';
                config.load().done(function () {
                    $.when(
                        require(['io.ox/core/main']),
                        themes.set(theme)
                    ).done(function (core) {
                        // go!
                        core.launch();
                    })
                    .fail(function (e) {
                        console.error('Cannot launch core!', e);
                    });
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
                        error = { error: gt('no-connection') };
                    }
                    feedback('info', $.txt(_.formatError(error, '%1$s')));
                    // restore form
                    restore();
                    // reset focus
                    $('#io-ox-login-' + (_.isString(focus) ? focus : (relogin ? 'password' : 'username'))).focus().select();
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
                return fail({ error: gt('enter-credentials'), code: 'UI-0001' }, 'username');
            }
            if ($.trim(password).length === 0 && ox.online) {
                return fail({ error: gt('enter-password'), code: 'UI-0002' }, 'password');
            }
            // login
            session.login(
                username,
                password,
                $('#io-ox-login-store-box').prop('checked'),
                forcedLanguage || ox.language || 'en_US'
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
            return require(['io.ox/core/login.' + id]).done(function (gt) {
                // 404 are a success for IE
                // "except for some of the error ones on IE (since it triggers success callbacks on scripts that load 404s)
                // (see https://github.com/jrburke/requirejs/wiki/Requirejs-2.0-draft)
                if (gt !== undefined) {
                    // get all nodes
                    $('[data-i18n]').each(function () {
                        var node = $(this),
                            val = gt(node.attr('data-i18n')),
                            target = node.attr('data-i18n-attr') || 'text';
                        switch (target) {
                        case 'value': node.val(val); break;
                        case 'text': node.text(val); break;
                        case 'label': node.contents().get(-1).nodeValue = val; break;
                        default: node.attr(target, val); break;
                        }
                    });
                    // Set Cookie
                    _.setCookie('language', (ox.language = id));
                    // update placeholder (IE9 fix)
                    if (_.browser.IE) {
                        $('input[type=text], input[type=password]').val('').placeholder();
                    }
                }
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
                    // set header (if we come around here, we have extensions)
                    extensions.point('io.ox/core/relogin').invoke('draw', $('#io-ox-login-header').find('h1').empty());
                    // bind
                    $('#io-ox-login-form').on('submit', fnSubmit);
                    $('#io-ox-login-username').val(ox.user || '');
                    $('#io-ox-login-password').val('');
                    // hide forgot password?
                    if (ox.serverConfig.forgotPassword === false) {
                        $("#io-ox-forgot-password").remove();
                    } else {
                        $("#io-ox-forgot-password").find("a").attr("href", ox.serverConfig.forgotPassword);
                    }

                    // set success handler
                    loginSuccess = function () {
                        $('#io-ox-login-screen').fadeOut(DURATION, function () {
                            $('#io-ox-login-screen-decorator').hide();
                            // process queue
                            var i = 0, item, http = require('io.ox/core/http');
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
                    $('#io-ox-login-screen-decorator').show();
                    $('#io-ox-login-screen').addClass('relogin').fadeIn(DURATION, function () {
                        $('#io-ox-login-password').focus().select();
                    });

                } else {
                    // enqueue last request
                    queue.push({ request: request, deferred: deferred });
                }
            };
        }());

        function updateServerConfig(data) {
            ox.serverConfig = data;
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

        function getCachedServerConfig(configCache, cacheKey, def) {
            if (!configCache || !cacheKey) {
                setFallbackConfig();
                def.resolve();
                return;
            }
            configCache.get(cacheKey).done(function (data) {
                if (data !== null) {
                    updateServerConfig(data);
                } else {
                    setFallbackConfig();
                }
                def.resolve();
            });
        }

        function fetchServerConfig(cacheKey) {
            var def = $.Deferred();
            var configCache = new cache.SimpleCache(cacheKey, true);
            if (ox.online) {
                http.GET({
                    module: 'apps/manifests',
                    params: { action: 'config' },
                    appendSession: (cacheKey === 'userconfig')
                })
                .done(function (data) {
                    configCache.add(cacheKey, data);
                    updateServerConfig(data);
                    def.resolve();
                })
                .fail(function () {
                    getCachedServerConfig(configCache, cacheKey, def);
                });
            } else {
                getCachedServerConfig(configCache, cacheKey, def);
            }
            return def;
        }

        function fetchUserSpecificServerConfig() {
            return fetchServerConfig('userconfig');
        }

        function fetchGeneralServerConfig() {
            return fetchServerConfig('generalconfig');
        }

        /**
         * Auto login
         */
        autoLogin = function () {

            function loadCoreFiles() {
                // Set user's language (as opposed to the browser's language)
                // Load core plugins
                gettext.setLanguage(ox.language);
                if (!ox.online) return $.when();
                return manifests.manager.loadPluginsFor('core');
            }

            var useAutoLogin = capabilities.has('autologin') && ox.online, initialized;

            function continueWithoutAutoLogin() {
                if (ox.signin) {
                    initialize();
                } else {
                    var ref = (location.hash || '').replace(/^#/, '');
                    _.url.redirect('signin' + (ref ? '#ref=' + enc(ref) : ''));
                }
            }
            // got session via hash?
            if (_.url.hash('session')) {

                ox.session = _.url.hash('session');
                ox.user = _.url.hash('user');
                ox.user_id = parseInt(_.url.hash('user_id') || '0', 10);
                ox.language = _.url.hash('language');

                if (_.url.hash('store') === 'true') {
                    session.store();
                }

                // cleanup login params
                _.url.hash({'session': null, 'user': null, 'user_id': null, 'language': null, 'store': null});

                var ref = _.url.hash('ref');
                ref = ref ? ('#' + decodeURIComponent(ref)) : location.hash;
                _.url.redirect(ref ? ref : '#');

                fetchUserSpecificServerConfig().done(function () {
                    loadCoreFiles().done(function () {
                        loadCore();
                    });
                });

            } else {
                // try auto login!?
                (useAutoLogin ? session.autoLogin() : $.when())
                .done(function () {
                    if (useAutoLogin) {
                        fetchUserSpecificServerConfig().done(function () {
                            loadCoreFiles().done(function () { gotoCore(true); });
                        });
                    } else {
                        continueWithoutAutoLogin();
                    }
                })
                .fail(function () {
                    continueWithoutAutoLogin();
                });
            }
        };

        /**
         * Initialize login screen
         */
        initialize = function () {
            // shortcut
            var sc = ox.serverConfig,
                lang = sc.languages,
                capabilities = require("io.ox/core/capabilities"),
                node,
                id = '',
                footer = '',
                i = 0,
                cl = $('#io-ox-current-language').parent(),
                maxLang = 20;
            // show languages
            if (!_.isEmpty(lang)) {
                var langCount = _.size(lang);
                node = $('#io-ox-language-list');
                // Display native select box for languages if there are up to "maxLang" languages
                var langSorted = _.toArray(_.invert(lang)).sort(function (a, b) {
                    return lang[a] <= lang[b] ? -1 : +1;
                });
                if (langCount < maxLang) {
                    for (id in langSorted) {
                        var link;
                        i++;
                        node.append(
                            $('<a href="#">')
                                .on('click', { id: langSorted[id] }, fnChangeLanguage)
                                .text(lang[langSorted[id]])
                        );
                        if (i < langCount && langCount < maxLang) {
                            node.append($('<span class="language-delimiter">').text('\u00A0\u00A0\u2022\u00A0 '));
                        }
                    }
                } else {
                    var sel = $('<select>').change(function() {
                        changeLanguage($(this).val());
                        forcedLanguage = $(this).val();
                    });
                    for (id in lang) {
                        sel.append(
                            $('<option>').attr('value', id)
                                .text(lang[langSorted[id]])
                        );
                    }
                    $('#io-ox-language-list').append(sel);
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
                $('#io-ox-login-password').attr('disabled', 'disabled');
                feedback('info', $.txt('Offline mode'));
            } else {
                $('#io-ox-login-password').removeAttr('disabled');
            }

            return $.when(
                    // load extensions
                    manifests.manager.loadPluginsFor(ox.signin ? 'signin' : 'core'),
                    // use browser language
                    setDefaultLanguage()
                )
                .always(function () {

                    // autologout message
                    if (_.url.hash("autologout")) {
                        feedback('info', gt('autologout'));
                    }

                    // supported browser?
                    if (!isBrowserSupported()) {

                        if (_.device('android')) {
                            // special info for not supported android
                            feedback('info', _.printf(gt('os-android'), _.browserSupport.Android));
                        } else if (_.device('ios')) {
                            // special info for not supported iOS
                            feedback('info', _.printf(gt('os-ios'), _.browserSupport.iOS));
                        } else {
                            // general warning about browser
                            feedback('info', $(
                                _.browser.Chrome ?
                                '<b>' + gt('browser-version') + '</b> <div>' + gt('please-update') + '</div>' :
                                '<b>' + gt('browser') + '</b>&nbsp;' + gt('please-use') + '<div><a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>.</div>'
                            ));
                        }

                    } else if (_.browser.IE <= 8) {
                        // recommend chrome frame?
                        var link = 'http://www.google.com/chromeframe/?user=true';
                        feedback('info', $(
                            '<b>' + gt('slow') + '</b> <div><a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>.</div>'
                        ));
                    } else if (_.device('android || ios')) {
                        // TODO remove after 7.4
                        // inform about preview mode for 7.2
                        feedback('info', gt('mobile-preview'));
                    }
                    // show login dialog
                    $('#io-ox-login-blocker').on('mousedown', false);
                    $('#io-ox-login-form').on('submit', fnSubmit);
                    $('#io-ox-login-username').removeAttr('disabled').focus().select();
                    $('#background_loader').idle().fadeOut(DURATION, cont);
                });
        };

        appCache.done(function () {
            fetchGeneralServerConfig().done(function () {
                // set page title now
                document.title = _.noI18n(ox.serverConfig.pageTitle || '');
                if (ox.signin) {
                    themes.set(ox.serverConfig.signinTheme || 'login');
                }
                // continue
                autoLogin();
            });
        });
    }

    function loadFail() {
        console.error('Server down', this, arguments);
        serverDown();
    }

    require([
        'io.ox/core/http', 'io.ox/core/session', 'io.ox/core/cache', 'io.ox/core/extensions',
        'io.ox/core/gettext', 'io.ox/core/manifests', 'io.ox/core/capabilities', 'io.ox/core/config',
        'themes', 'io.ox/core/settings'],
        loadSuccess, loadFail
    );

    // reload if files have change; need this during development
    if (false && Modernizr.applicationcache && _.browser.webkit && ox.debug) {

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
