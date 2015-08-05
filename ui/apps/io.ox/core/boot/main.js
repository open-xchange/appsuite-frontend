/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/main', [

    'themes',
    'gettext',
    'io.ox/core/extensions',
    'io.ox/core/manifests',
    'io.ox/core/session',
    'io.ox/core/boot/util',
    'io.ox/core/boot/form',
    'io.ox/core/boot/config',
    'io.ox/core/boot/login/auto',
    'io.ox/core/boot/login/token'

], function (themes, gettext, ext, manifests, session, util, form, config, autologin, tokenlogin) {

    'use strict';

    var exports = {

        start: function () {
            // use extensions to determine proper login method
            var baton = ext.Baton({ hash: _.url.hash() });
            ext.point('io.ox/core/boot/login').invoke('login', this, baton);
        },

        invoke: function (loginType) {
            // invoke login method
            if (_.isFunction(this[loginType])) {
                util.debug('Using login type', loginType);
                this[loginType]();
            } else {
                console.error('Unkown login type', loginType);
            }
        },

        useForm: function () {

            // avoid multiple calls
            this.useForm = $.noop;

            config.server().done(function serverConfigLoaded() {

                // forceHTTPS
                if (ox.serverConfig.forceHTTPS && location.protocol !== 'https:' && !ox.debug) {
                    location.href = 'https:' + location.href.substring(location.protocol.length);
                    return;
                }

                // set page title now
                util.setPageTitle(
                    ox.serverConfig.pageTitle + (_.device('smartphone') ? ' Login' : '')
                );

                gettext.setLanguage('en_US');

                var theme = _.url.hash('theme') || ox.serverConfig.signinTheme || 'login';
                util.debug('Load default language and theme ...', theme);

                // theme
                $.when(
                    themes.set(theme),
                    require(['io.ox/core/boot/i18n'])
                )
                .done(function () {
                    // log
                    util.debug('Load default language and theme DONE.');
                    form();
                });
            })
            .fail(function (error) {
                util.debug('Error while loading config from server', error);
                ox.trigger('server:down', error);
            });
        },

        guest: function () {
            this.useForm();
        },

        anonymous: function () {
            this.useForm();
        },

        useToken: function () {
            tokenlogin();
        },

        useCookie: function () {
            autologin();
        },

        loadUI: function () {

            util.debug('Load UI ... load core plugins and current language', ox.language);

            // signin phase is over (important for gettext)
            ox.signin = false;

            // make sure we have loaded precore.js now
            $.when(
                require(['io.ox/core/boot/load', ox.base + '/precore.js']),
                gettext.setLanguage(ox.language),
                manifests.manager.loadPluginsFor('core')
            )
            .then(function (response) {
                return response[0];
            })
            .done(function (load) {
                util.debug('Load UI > current language and core plugins DONE.');
                gettext.enable();
                util.restore();
                load();
            });
        }
    };

    //
    // Different login types are implemented as extensions
    //

    ext.point('io.ox/core/boot/login').extend(
        {
            id: 'explicit',
            index: 100,
            login: function (baton) {
                if (baton.hash.login_type !== undefined) {
                    baton.stopPropagation();
                    this.invoke(baton.hash.login_type);
                }
            }
        },
        {
            id: 'token',
            index: 200,
            login: function (baton) {
                if (baton.hash.tokenSession || baton.hash.session) {
                    baton.stopPropagation();
                    this.invoke('useToken');
                }
            }
        },
        {
            id: 'no-autologin',
            index: 300,
            login: function (baton) {
                if (baton.hash.autologin === 'false') {
                    baton.stopPropagation();
                    this.invoke('useForm');
                }
            }
        },
        {
            id: 'default',
            index: 1000000000000,
            login: function () {
                this.invoke('useCookie');
            }
        }
    );

    //
    // Respond to login events
    //

    ox.once({

        'login:success': function (data) {

            $('#background-loader').fadeIn(util.DURATION, function () {
                $('#io-ox-login-screen').hide().empty();
            });

            // load user config
            config.user().done(function () {
                // apply session data (again) & page title
                if (data) session.set(data);
                util.setPageTitle(ox.serverConfig.pageTitle);
                // load UI
                exports.loadUI();
            });
        },

        'login:fail': function () {
            exports.useForm();
        }
    });

    return exports;

});
