/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/basicModel',
    'io.ox/backbone/views',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/api/apps',
    'io.ox/core/capabilities',
    'io.ox/core/notifications',
    'io.ox/core/desktopNotifications',
    'plugins/portal/userSettings/register',
    'settings!io.ox/core',
    'settings!io.ox/core/settingOptions',
    'gettext!io.ox/core',
    'io.ox/backbone/mini-views/timezonepicker'
], function (ext, BasicModel, views, miniViews, appAPI, capabilities, notifications, desktopNotifications, userSettings, settings, settingOptions, gt, TimezonePicker) {

    'use strict';

    var point = views.point('io.ox/core/settings/entry'),
        SettingView = point.createView({ tagName: 'form', className: 'form-horizontal' }),
        reloadMe = ['language', 'timezone', 'theme'];

    ext.point('io.ox/core/settings/detail').extend({
        index: 50,
        id: 'extensions',
        draw: function () {
            var model = settings.createModel(BasicModel);
            model.on('change:highcontrast', function (m, value) {
                $('html').toggleClass('high-contrast', value);
            });
            model.on('change', function (model) {

                var showNotice = _(reloadMe).any(function (attr) {
                    return model.changed[attr];
                });

                settings.saveAndYell(undefined, showNotice ? { force: true } : {}).then(
                    function success() {

                        if (showNotice) {
                            notifications.yell(
                                'success',
                                gt('The setting requires a reload or relogin to take effect.')
                            );
                        }
                    }
                );
            });
            this.addClass('settings-container').append(
                $('<h1>').text(gt('Basic settings'))
            );
            new SettingView({ model: model }).render().$el.attr('role', 'form').appendTo(this);
        }
    });

    //
    // My contact data
    //

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
                            $('<button type="button" class="btn btn-default" tabindex="1">')
                            .text(gt('My contact data') + ' ...')
                            .on('click', function () {
                                require(['io.ox/core/settings/user'], function (userSettings) {
                                    userSettings.openModalDialog();
                                });
                            })
                        )
                    )
                )
            );
        }
    });

    //
    // Change password
    //

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
                                $('<button type="button" class="btn btn-default" tabindex="1">')
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
            var guid = _.uniqueId('form-control-label-');
            this.listenTo(this.baton.model, 'change:language', function (model, language) {
                _.setCookie('language', language);
            });
            this.$el.append(
                $('<label>').attr({
                    class: 'control-label col-sm-4',
                    for: guid
                }).text(gt('Language')),
                $('<div>').addClass('col-sm-6').append(
                    new miniViews.SelectView({
                        list: _.map(ox.serverConfig.languages, function (key, val) { return { label: key, value: val }; }),
                        name: 'language',
                        model: this.baton.model,
                        id: guid,
                        className: 'form-control'
                    }).render().$el
                )
            );
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
                    $('<label>').attr({
                        class: 'control-label col-sm-4',
                        for: guid
                    }).text(gt('Time zone')),
                    $('<div>').addClass('col-sm-6').append(
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
        if (availableThemes['default']) {
            availableThemes['default'] = gt('Default Theme');
        }

        if (!_(availableThemes).isEmpty() && settings.isConfigurable('theme')) {
            point.extend({
                id: 'theme',
                index: 400,
                className: 'form-group',
                render: function () {
                    var guid = _.uniqueId('form-control-label-');
                    this.$el.append(
                        $('<label>').attr({
                            class: 'control-label col-sm-4',
                            for: guid
                        }).text(gt('Theme')),
                        $('<div>').addClass('col-sm-6').append(
                            new miniViews.SelectView({
                                list: _.map(availableThemes, function (key, val) { return { label: key, value: val }; }),
                                name: 'theme',
                                model: this.baton.model,
                                id: guid,
                                className: 'form-control'
                            }).render().$el
                        )
                    );
                }
            });
        }

        point.extend({
            id: 'highcontrast',
            index: 401,
            className: 'form-group',
            render: function () {
                this.$el.append(
                    $('<div class="col-sm-offset-4 col-sm-8">').append(
                        $('<div class="checkbox">').addClass('').append(
                            $('<label class="control-label">').text(gt('High contrast theme')).prepend(
                                new miniViews.CheckboxView({ name: 'highcontrast', model: this.baton.model }).render().$el
                            )
                        )
                    )
                );
            }
        });

    }());

    (function () {
        if (settings.isConfigurable('refreshInterval')) {
            var MINUTES = 60000,
                options = [
                    { label: gt('5 minutes'), value: 5 * MINUTES },
                    { label: gt('10 minutes'), value: 10 * MINUTES },
                    { label: gt('15 minutes'), value: 15 * MINUTES },
                    { label: gt('30 minutes'), value: 30 * MINUTES }
                ];

            point.extend({
                id: 'refreshInterval',
                index: 300,
                className: 'form-group',
                render: function () {
                    var guid = _.uniqueId('form-control-label-');
                    this.$el.append(
                        $('<label>').attr({
                            class: 'control-label col-sm-4',
                            for: guid
                        }).text(gt('Refresh interval')),
                        $('<div>').addClass('col-sm-6').append(
                            new miniViews.SelectView({
                                list: options,
                                name: 'refreshInterval',
                                model: this.baton.model,
                                id: guid,
                                className: 'form-control'
                            }).render().$el
                        )
                    );
                }
            });
        }
    }());

    // Auto Start App
    (function () {
        if (settings.isConfigurable('autoStart')) {
            var options =  _(appAPI.getFavorites()).map(function (app) {
                return { label: /*#, dynamic*/gt.pgettext('app', app.title), value: app.path };
            });
            options.push({ label: gt('None'), value: 'none' });

            if (options.length <= 2) return;

            point.extend({
                id: 'autoStart',
                index: 500,
                className: 'form-group',
                render: function () {
                    var guid = _.uniqueId('form-control-label-');
                    this.$el.append(
                        $('<label>').attr({
                            class: 'control-label col-sm-4',
                            for: guid
                        }).text(gt('Default app after sign in')),
                        $('<div>').addClass('col-sm-6').append(
                            new miniViews.SelectView({
                                list: options,
                                name: 'autoStart',
                                model: this.baton.model,
                                id: guid,
                                className: 'form-control'
                            }).render().$el
                        )
                    );
                }
            });
        }
    }());

    // Auto Logout
    (function () {
        var MINUTES = 60000,
            options = [
                { label: gt('disable'), value: 0 },
                { label: gt('5 minutes'), value: 5 * MINUTES },
                { label: gt('10 minutes'), value: 10 * MINUTES },
                { label: gt('15 minutes'), value: 15 * MINUTES },
                { label: gt('30 minutes'), value: 30 * MINUTES }
            ];

        point.extend({
            id: 'autoLogout',
            index: 600,
            className: 'form-group',
            render: function () {
                var guid = _.uniqueId('form-control-label-');
                this.$el.append(
                    $('<label>').attr({
                        class: 'control-label col-sm-4',
                        for: guid
                    }).text(gt('Automatic sign out')),
                    $('<div>').addClass('col-sm-6').append(
                        new miniViews.SelectView({
                            list: options,
                            name: 'autoLogout',
                            model: this.baton.model,
                            id: guid,
                            className: 'form-control'
                        }).render().$el
                    )
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

                    this.$el.append(
                        $('<div class="col-sm-offset-4 col-sm-8">').append(
                            $('<div>').addClass('checkbox').append(
                                $('<label class="control-label">').text(gt('Automatic opening of notification area')).prepend(
                                    new miniViews.CheckboxView({ name: 'autoOpenNotification', model: this.baton.model }).render().$el
                                )
                            )
                        )
                    );
                }
            });
        }
    }());
    (function () {
        point.extend({
            id: 'showDesktopNotifications',
            index: 800,
            className: 'form-group',
            render: function () {
                this.baton.model.on('change:showDesktopNotifications', function (e, value) {
                    if (value === true) {
                        desktopNotifications.requestPermission(function (result) {
                            // revert if user denied the permission
                            if (result === 'denied') {
                                this.baton.model.set('showDesktopNotifications', false);
                            }
                        });
                    }
                });
                this.$el.append(
                    $('<div class="col-sm-offset-4 col-sm-8">').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label class="control-label">').text(gt('Show desktop notifications')).prepend(
                                new miniViews.CheckboxView({ name: 'showDesktopNotifications', model: this.baton.model }).render().$el
                            ),
                            // add ask now link (by design browsers only allow asking if there was no decision yet)
                                                                                                               //#. Opens popup to decide if desktop notifications should be shown
                            desktopNotifications.getPermissionStatus() === 'default' ? $('<a href="#" >').text(gt('Manage permission now')).css('margin-left', '8px').on('click', function (e) {
                                e.preventDefault();
                                desktopNotifications.requestPermission(function (result) {
                                    if (result === 'granted') {
                                        settings.set('showDesktopNotifications', true).save();
                                    } else if (result === 'denied') {
                                        settings.set('showDesktopNotifications', false).save();
                                    }
                                });
                            }) : []
                        )
                    )
                );
            }
        });
    }());
});
