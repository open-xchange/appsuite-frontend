/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define.async('io.ox/core/boot/main', [

    'themes',
    'gettext',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/stage',
    'io.ox/core/boot/util',
    'io.ox/core/boot/form',
    'io.ox/core/boot/config'

], function (themes, gettext, ext, Stage, util, form, config) {

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

        useLocalStorage: function () {
            require('io.ox/core/boot/login/localStorage')();
        },

        useCookie: function () {
            return require('io.ox/core/boot/login/auto')();
        },

        propagateSession: function () {
            if (window.parent) window.parent.postMessage(_.url.hash('session'), window.location.origin);
            if (window.opener) window.opener.postMessage(_.url.hash('session'), window.location.origin);
            util.debug('Propagated session', _.url.hash('session'));
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
            util.debugSession('login process successful');

            $('#background-loader').fadeIn(util.DURATION, function () {
                $('#io-ox-login-screen').hide().empty();
            });

            var baton;

            require(['io.ox/core/boot/rampup']).then(function () {
                baton = ext.Baton({ sessionData: data });
                util.debug('loaded rampup namespace > running rampup phase');
                return Stage.run('io.ox/core/boot/rampup', baton, { methodName: 'fetch' });
            }).then(function () {
                ox.rampup = _.clone(baton.data);
                util.debug('finished rampup phase > getting boot/load namespace', ox.rampup);
                return require(['io.ox/core/boot/load']);
            }).then(function () {
                // create new baton, but share collected data
                baton = ext.Baton(_.extend({}, baton, ox.rampup));
                util.debug('running boot/load phase');
                return Stage.run('io.ox/core/boot/load', baton);
            }).then(function () {
                if (!util.checkTabHandlingSupport()) return;
                // do not propagate the received login that all tabs received too to all the tabs again
                if (data && data.tabSessionLogin) return;
                require(['io.ox/core/api/tab'], function (tabAPI) {
                    util.debugSession('propagateLogin', ox.session);
                    tabAPI.propagate('propagateLogin', {
                        session: ox.session,
                        language: ox.language,
                        theme: ox.theme,
                        user: ox.user,
                        user_id: ox.user_id,
                        context_id: ox.context_id,
                        exceptWindow: tabAPI.getWindowName(),
                        storageKey: tabAPI.DEFAULT_STORAGE_KEYS.SESSION
                    });
                });
            });
        },

        'login:fail': function () {
            if (!Stage.isRunning('io.ox/core/boot/login')) {
                exports.start({ after: 'autologin' });
            } // Otherwise continue thru the other login stages
        },

        'login:fail:session-based': function (baton) {
            baton.stopPropagation();
            if ($('#showstopper').is(':visible')) return;
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
