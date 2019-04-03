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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views',
    'io.ox/core/settings/util',
    'io.ox/core/api/apps',
    'io.ox/core/capabilities',
    'io.ox/core/notifications',
    'io.ox/core/desktopNotifications',
    'plugins/portal/userSettings/register',
    'settings!io.ox/core',
    'settings!io.ox/core/settingOptions',
    'gettext!io.ox/core',
    'io.ox/backbone/mini-views/timezonepicker'
], function (ext, views, util, appAPI, capabilities, notifications, desktopNotifications, userSettings, settings, settingOptions, gt, TimezonePicker) {

    'use strict';

    var point = views.point('io.ox/core/settings/entry'),
        SettingView = point.createView({ tagName: 'form', className: 'form-horizontal' }),
        AUTOLOGIN = capabilities.has('autologin') && ox.secretCookie === true,
        MINUTES = 60000;

    function checkbox() {
        return $('<div class="col-sm-offset-4 col-sm-8">').append(util.checkbox.apply(null, arguments));
    }

    function reload(e) {
        e.preventDefault();
        location.reload();
    }

    function openUserSettings() {
        require(['io.ox/core/settings/user'], function (settingsUser) {
            settingsUser.openModalDialog();
        });
    }

    ext.point('io.ox/core/settings/detail').extend({
        index: 50,
        id: 'extensions',
        draw: function () {
            settings.on('change:highcontrast', function (value) {
                $('html').toggleClass('high-contrast', value);
            });
            settings.on('change', function (setting) {

                var showNotice = _(['language', 'timezone', 'theme']).some(function (attr) {
                    return setting === attr;
                });

                var message = AUTOLOGIN ?
                    gt('The setting requires a reload or relogin to take effect.') :
                    gt('The setting requires a relogin to take effect.');
                settings.saveAndYell(undefined, showNotice ? { force: true } : {}).then(
                    function success() {

                        if (showNotice) {
                            notifications.yell(
                                'success',
                                message
                            );
                        }
                    }
                );
            });

            var reloadHint = AUTOLOGIN ?
                gt('Some settings (language, timezone, theme) require a page reload or relogin to take effect.') :
                gt('Some settings (language, timezone, theme) require a relogin to take effect.');

            this.addClass('settings-container').append(
                // headline
                util.header(gt('Basic settings')),
                // help text
                $('<div class="help-block">')
                .text(reloadHint + ' ')
                .css('margin-bottom', '24px')
                .append(
                    $('<a href="#" role="button" data-action="reload">').text(
                        AUTOLOGIN ?
                            gt('Reload page') :
                            gt('Relogin')
                    ).on('click', reload)
                )
            );

            new SettingView({ model: settings }).render().$el.appendTo(this);
        }
    });

    // My contact data
    point.basicExtend({
        id: 'my-contact-data',
        index: '10000',
        draw: function () {

            // check if users can edit their own data (see bug 34617)
            if (settings.get('user/internalUserEdit', true) === false) return;

            this.append(
                $('<div data-extension-id="my-contact-data">').append(
                    $('<div class="form-group">').append(
                        $('<label class="control-label col-sm-4">'),
                        $('<div class="col-sm-6">').append(
                            $('<button type="button" class="btn btn-default">')
                                .text(gt('My contact data') + ' ...')
                                .on('click', openUserSettings)
                        )
                    )
                )
            );
        }
    });

    // Change password
    if (capabilities.has('edit_password')) {
        point.basicExtend({
            id: 'change-password',
            index: '11000',
            draw: function () {
                this.append(
                    $('<div data-extension-id="change-password">').append(
                        $('<div class="form-group">').append(
                            $('<label class="control-label col-sm-4">'),
                            $('<div class="col-sm-6">').append(
                                $('<button type="button" class="btn btn-default">')
                                .text(gt('Change password') + ' ...')
                                .on('click', userSettings.changePassword)
                            )
                        )
                    )
                );
            }
        });
    }

    point.extend({
        id: 'language',
        index: 100,
        className: 'form-group',
        render: function () {
            if (!settings.isConfigurable('language')) return;
            var options = _.map(ox.serverConfig.languages, function (key, val) { return { label: key, value: val }; });
            this.listenTo(this.baton.model, 'change:language', function (language) {
                _.setCookie('language', language);
            });
            this.$el.append(util.select('language', gt('Language'), this.baton.model, options));
        }
    });

    // Timezones
    (function () {
        point.extend({
            id: 'timezones',
            index: 200,
            className: 'form-group',
            render: function () {
                var guid = _.uniqueId('form-control-label-');
                this.$el.append(
                    $('<label class="control-label col-sm-4">').attr('for', guid).text(gt('Time zone')),
                    $('<div class="col-sm-6">').append(
                        new TimezonePicker({
                            name: 'timezone',
                            model: this.baton.model,
                            id: guid,
                            className: 'form-control',
                            showFavorites: true
                        }).render().$el
                    )
                );
            }
        });
    }());

    // Themes
    (function () {

        var availableThemes = settingOptions.get('themes') || {};

        //  until we get translated themes from backend
        if (availableThemes['default']) availableThemes['default'] = gt('Default Theme');

        if (!_(availableThemes).isEmpty() && settings.isConfigurable('theme')) {
            point.extend({
                id: 'theme',
                index: 400,
                className: 'form-group',
                render: function () {
                    var options = _(availableThemes).chain().map(function (key, val) {
                        return { label: key, value: val };
                    }).sortBy(function (obj) {
                        return obj.label.toLowerCase();
                    }).value();

                    this.$el.append(util.select('theme', gt('Theme'), this.baton.model, options));
                }
            });
        }

        point.extend({
            id: 'highcontrast',
            index: 401,
            className: 'form-group',
            render: function () {
                this.$el.append(checkbox('highcontrast', gt('High contrast theme'), this.baton.model));
            }
        });

    }());

    // Refresh interval
    (function () {
        if (!settings.isConfigurable('refreshInterval')) return;

        point.extend({
            id: 'refreshInterval',
            index: 300,
            className: 'form-group',
            render: function () {
                this.$el.append(
                    util.select('refreshInterval', gt('Refresh interval'), this.baton.model, [
                        { label: gt('5 minutes'), value: 5 * MINUTES },
                        { label: gt('10 minutes'), value: 10 * MINUTES },
                        { label: gt('15 minutes'), value: 15 * MINUTES },
                        { label: gt('30 minutes'), value: 30 * MINUTES }
                    ])
                );
            }
        });
    }());

    // Auto Start App
    (function () {
        if (!settings.isConfigurable('autoStart')) return;

        var options =  _(appAPI.getFavorites()).map(function (app) {
            return { label: /*#, dynamic*/gt.pgettext('app', app.title), value: app.path };
        });
        if (options.length <= 1) return;
        options.push({ label: gt('None'), value: 'none' });

        point.extend({
            id: 'autoStart',
            index: 500,
            className: 'form-group',
            render: function () {
                this.$el.append(util.select('autoStart', gt('Default app after sign in'), this.baton.model, options));
            }
        });
    }());

    // Auto Logout
    (function () {
        if (!settings.isConfigurable('autoLogout')) return;

        point.extend({
            id: 'autoLogout',
            index: 600,
            className: 'form-group',
            render: function () {
                this.$el.append(
                    util.select('autoLogout', gt('Automatic sign out'), this.baton.model, [
                        { label: gt('disable'), value: 0 },
                        { label: gt('5 minutes'), value: 5 * MINUTES },
                        { label: gt('10 minutes'), value: 10 * MINUTES },
                        { label: gt('15 minutes'), value: 15 * MINUTES },
                        { label: gt('30 minutes'), value: 30 * MINUTES }
                    ])
                );
            }
        });
    }());

    // Auto open notification area
    (function () {
        if (settings.isConfigurable('autoOpenNotificationarea')) {
            point.extend({
                id: 'autoOpenNotification',
                index: 700,
                className: 'form-group',
                render: function () {

                    //change old settings values to new ones
                    var value = this.baton.model.get('autoOpenNotification');
                    if (value === 'always' || value === 'noEmail') {
                        this.baton.model.set('autoOpenNotification', true);
                    } else if (value === 'Never') {
                        this.baton.model.set('autoOpenNotification', false);
                    }
                    this.$el.append(checkbox('autoOpenNotification', gt('Automatic opening of notification area'), this.baton.model));
                }
            });
        }
    }());

    // Show desktop notifications
    (function () {
        point.extend({
            id: 'showDesktopNotifications',
            index: 800,
            className: 'form-group',
            render: function () {
                // don't show setting if not supported, to not confuse users
                var self = this,
                    // add ask now link (by design browsers only allow asking if there was no decision yet)
                    //#. Opens popup to decide if desktop notifications should be shown
                    requestLink = desktopNotifications.getPermissionStatus() === 'default' ? $('<a href="#" role="button">').text(gt('Manage permission now')).css('margin-left', '8px').on('click', function (e) {
                        e.preventDefault();
                        desktopNotifications.requestPermission(function (result) {
                            if (result === 'granted') {
                                settings.set('showDesktopNotifications', true).save();
                            } else if (result === 'denied') {
                                settings.set('showDesktopNotifications', false).save();
                            }
                        });
                    }) : false;

                if (desktopNotifications.isSupported()) {
                    this.baton.model.on('change:showDesktopNotifications', function (value) {
                        if (value === true) {
                            desktopNotifications.requestPermission(function (result) {
                                if (result !== 'denied') return;
                                // revert if user denied the permission
                                // also yell message, because if a user pressed deny in the request permission dialog there is no way we can ask again.
                                // The user has to do this in the browser settings, because the api blocks any further request permission dialogs.
                                notifications.yell('info', gt('Please check your browser settings and enable desktop notifications for this domain'));
                                self.baton.model.set('showDesktopNotifications', false);
                                if (requestLink) {
                                    // remove request link because it is useless. We cannot trigger requestPermission if the user denied. It has to be enabled via the browser settings.
                                    requestLink.remove();
                                    requestLink = null;
                                }
                            });
                        }
                    });
                    this.$el.append(checkbox('showDesktopNotifications', gt('Show desktop notifications'), this.baton.model, requestLink));
                }
            }
        });
    }());

    // Accessibility feature toggle
    (function () {
        point.extend({
            id: 'accessibilityFeatures',
            index: 900,
            className: 'form-group',
            render: function () {
                var value = this.baton.model.get('features/accessibility');
                if (value === '' || value === undefined) {
                    this.baton.model.set('features/accessibility', true);
                }
                this.$el.append(checkbox('features/accessibility', gt('Use accessibility improvements'), this.baton.model));
            }
        });
    }());
});
