/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define.async('io.ox/core/boot/main', [

    'themes',
    'gettext',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/stage',
    'io.ox/core/manifests',
    'io.ox/core/session',
    'io.ox/core/boot/util',
    'io.ox/core/boot/form',
    'io.ox/core/boot/config'

], function (themes, gettext, ext, Stage, manifests, session, util, form, config) {

    'use strict';
    var synonyms = {
        guest: 'useForm',
        guest_password: 'useForm',
        anonymous_password: 'useForm',
        reset_password: 'useForm',
        message: 'useForm',
        message_continue: 'useForm'
    };

    var exports = {

        start: function (options) {
            options = options || {};
            // use extensions to determine proper login method
            var baton = ext.Baton({ hash: _.url.hash(), logins: this });
            return Stage.run('io.ox/core/boot/login', baton, { methodName: 'login', beginAfter: options.after, softFail: true }).then(function () {
                // a11y: remove meta viewport for desktop
                if (_.device('desktop')) $('meta[name="viewport"]').remove();
            });
        },

        invoke: function (loginType) {
            // invoke login method
            var type = synonyms[loginType] || loginType;
            if (_.isFunction(this[type])) {
                util.debug('Using login type', type);
                return this[type]();
            }
            $('#io-ox-login-container').empty().append(
                $('<div class="alert alert-info">').text('Unknown login type.')
            );
            $('#background-loader').fadeOut(250);
        },
        defaultLogin: function () {
            if (!Stage.isRunning('io.ox/core/boot/login')) {
                this.start({ after: 'autologin' });
            }
        },
        useForm: function () {

            // avoid multiple calls
            this.useForm = $.noop;

            // forceHTTPS
            if (ox.serverConfig.forceHTTPS && location.protocol !== 'https:' && !ox.debug) {
                location.href = 'https:' + location.href.substring(location.protocol.length);
                return;
            }

            // set page title now
            ox.on('language', function (lang, gt) {
                ox.trigger('change:document:title', gt.pgettext('word', 'Sign in'));
            });

            gettext.setLanguage('en_US');
            var theme = _.sanitize.option(_.url.hash('theme')) || ox.serverConfig.signinTheme || 'login';
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
        },

        useToken: function () {
            require('io.ox/core/boot/login/token')();
        },

        useCookie: function () {
            return require('io.ox/core/boot/login/auto')();
        },

        loadUI: function () {

            util.debug('Load UI ... load core plugins and current language', ox.language);

            // signin phase is over (important for gettext)
            ox.signin = false;

            // we have to clear the device function cache or there might be invalid return values, like for example wrong language data.(see Bug 51405)
            _.device.cache = {};
            // make sure we have loaded precore.js now
            $.when(
                require(['io.ox/core/boot/load', ox.base + '/precore.js']),
                gettext.setLanguage(ox.language),
                manifests.manager.loadPluginsFor('i18n')
            )
            .then(function (response) {
                util.debug('Load UI > current language and core plugins DONE.');
                gettext.enable();
                return response[0];
            })
            .then(function (response) {
                require(['io.ox/core/boot/warning'], function () {
                    ext.point('io.ox/core/boot/warning').invoke('draw');
                });
                return response;
            })
            .done(function (load) {
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
                    baton.logins.invoke(baton.hash.login_type);
                }
            }
        },
        {
            id: 'no-autologin',
            index: 300,
            login: function (baton) {
                if (baton.hash.autologin === 'false') {
                    baton.disable('io.ox/core/boot/login', 'autologin'); // Skip autologin
                }
            }
        },
        {
            id: 'default',
            index: 1000000000000,
            login: function (baton) {
                baton.logins.useForm();
            },
            relogin: function () {
                util.gotoSignin('login_type=useForm');
            }
        }
    );

    //
    // Respond to login events
    //

    ox.once({

        'login:success': function (data) {
            Stage.abortAll('io.ox/core/boot/login');

            $('#background-loader').fadeIn(util.DURATION, function () {
                $('#io-ox-login-screen').hide().empty();
            });

            // load user config
            config.user().done(function () {
                // apply session data (again) & page title
                if (data) session.set(data);
                ox.trigger('change:document:title');
                // load UI
                exports.loadUI();
            });
        },

        'login:fail': function () {
            if (!Stage.isRunning('io.ox/core/boot/login')) {
                exports.start({ after: 'autologin' });
            } // Otherwise continue thru the other login stages
        },

        'login:fail:session-based': function (baton) {
            baton.stopPropagation();
            $('.throbber').hide();
            $('#showstopper, #showstopper .session').show();
        }
    });

    return config.server().then(function () {
        return ox.manifests.loadPluginsFor('login');
    }, function serverConfigFail(error) {
        util.debug('Error while loading config from server', error);
        ox.trigger('server:down', error);
        // module should be defined despite from server being "down"
        return $.Deferred().resolve();
    }).then(function () {
        return exports;
    });
});
