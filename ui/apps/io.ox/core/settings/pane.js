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
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/mini-views/common',
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
], function (ext, ExtensibleView, mini, util, appAPI, capabilities, notifications, desktopNotifications, userSettings, settings, settingOptions, gt, TimezonePicker) {

    'use strict';

    // this is the offical point for settings
    ext.point('io.ox/core/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            console.log('hier?');
            this.append(
                new ExtensibleView({ point: 'io.ox/core/settings/detail/view', model: settings }).render().$el
            );
        }
    });

    var INDEX = 0, MINUTES = 60000;

    ext.point('io.ox/core/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('settings-container').append(
                    util.header(gt('Basic settings'))
                );
            }
        },
        //
        // Events handlers
        //
        {
            id: 'onchange',
            index: INDEX += 100,
            render: function () {

                this.listenTo(settings, 'change', function (setting) {

                    console.log('change', setting);

                    var showNotice = _(['language', 'timezone', 'theme']).some(function (attr) {
                        return setting === attr;
                    });

                    settings.saveAndYell(undefined, { force: !!showNotice }).then(
                        function success() {
                            if (!showNotice) return;
                            notifications.yell('success', gt('The setting requires a reload or relogin to take effect.'));
                        }
                    );
                });
            }
        },
        //
        // Hint on reload
        //
        {
            id: 'hint',
            index: INDEX += 100,
            render: function () {

                this.$el.append(
                    $('<div class="help-block">')
                    .text(gt('Some settings (language, timezone, theme) require a page reload or relogin to take effect.') + ' ')
                    .css('margin-bottom', '24px')
                    .append(
                        $('<a href="#" role="button" data-action="reload">').text(gt('Reload page')).on('click', reload)
                    )
                );

                function reload(e) {
                    e.preventDefault();
                    location.reload();
                }
            }
        },
        //
        // Language
        //
        {
            id: 'language',
            index: INDEX += 100,
            render: function () {

                if (!settings.isConfigurable('language')) return;

                var options = _(ox.serverConfig.languages).map(function (key, val) { return { label: key, value: val }; });

                this.$el.append(
                    select('language', gt('Language'), this.model, options)
                );

                this.listenTo(this.model, 'change:language', function (language) {
                    _.setCookie('language', language);
                });
            }
        },
        //
        // Timezone
        //
        {
            id: 'timezone',
            index: INDEX += 100,
            render: function () {

                if (!settings.isConfigurable('timezone')) return;

                this.$el.append(
                    $('<div class="form-group row">').append(
                        $('<div class="col-md-6">').append(
                            $('<label for="settings-timezone">').text(gt('Time zone')),
                            new TimezonePicker({
                                name: 'timezone',
                                model: this.model,
                                id: 'settings-timezone',
                                showFavorites: true
                            }).render().$el
                        )
                    )
                );
            }
        },
        //
        // Theme
        //
        {
            id: 'theme',
            index: INDEX += 100,
            render: function () {

                var availableThemes = settingOptions.get('themes') || {};

                if (_(availableThemes).size() <= 1) return;
                if (!settings.isConfigurable('theme')) return;

                // until we get translated themes from backend
                if (availableThemes['default']) availableThemes['default'] = gt('Default Theme');

                // sort
                var options = _(availableThemes)
                    .chain()
                    .map(function (key, val) { return { label: key, value: val }; })
                    .sortBy(function (obj) { return obj.label.toLowerCase(); })
                    .value();

                this.$el.append(
                    select('theme', gt('Theme'), this.model, options)
                );
            }
        },
        //
        // Refresh Interval
        //
        {
            id: 'refreshInterval',
            index: INDEX += 100,
            render: function () {

                if (!settings.isConfigurable('refreshInterval')) return;

                var options = [
                    { label: gt('5 minutes'), value: 5 * MINUTES },
                    { label: gt('10 minutes'), value: 10 * MINUTES },
                    { label: gt('15 minutes'), value: 15 * MINUTES },
                    { label: gt('30 minutes'), value: 30 * MINUTES }
                ];

                this.$el.append(
                    select('refreshInterval', gt('Refresh interval'), this.model, options)
                );
            }
        },
        //
        // Auto start
        //
        {
            id: 'autoStart',
            index: INDEX += 100,
            render: function () {

                if (!settings.isConfigurable('autoStart')) return;

                var options =  _(appAPI.getFavorites()).map(function (app) {
                    return { label: /*#, dynamic*/gt.pgettext('app', app.title), value: app.path };
                });

                if (options.length <= 1) return;
                options.push({ label: gt('None'), value: 'none' });

                this.$el.append(
                    select('autoStart', gt('Default app after sign in'), this.model, options)
                );
            }
        },
        //
        // Auto Logout
        //
        {
            id: 'autoLogout',
            index: INDEX += 100,
            render: function () {

                if (!settings.isConfigurable('autoLogout')) return;

                this.$el.append(
                    select('autoLogout', gt('Automatic sign out'), this.model, [
                        { label: gt('Never'), value: 0 },
                        { label: gt('5 minutes'), value: 5 * MINUTES },
                        { label: gt('10 minutes'), value: 10 * MINUTES },
                        { label: gt('15 minutes'), value: 15 * MINUTES },
                        { label: gt('30 minutes'), value: 30 * MINUTES }
                    ])
                );
            }
        },
        //
        // Data fixes
        //
        {
            id: 'data-fixes',
            index: INDEX += 100,
            render: function () {

                // change old settings values to new ones
                switch (this.model.get('autoOpenNotification')) {
                    case 'always': // falls through
                    case 'noEmail': this.model.set('autoOpenNotification', true); break;
                    case 'Never': this.model.set('autoOpenNotification', false); break;
                    // no default
                }

                var value = this.model.get('features/accessibility');
                if (value === '' || value === undefined) {
                    this.model.set('features/accessibility', true);
                }
            }
        },
        //
        // Request Link for desktop notifications
        //
        {
            id: 'request-notifications',
            index: INDEX += 100,
            render: function () {

                this.$requestLink = desktopNotifications.getPermissionStatus() === 'default' ?
                    // add ask now link (by design browsers only allow asking if there was no decision yet)
                    //#. Opens popup to decide if desktop notifications should be shown
                    $('<a href="#" role="button" class="request-desktop-notifications">').text(gt('Manage permission now')).on('click', onClick) :
                    $();

                function onClick(e) {
                    e.preventDefault();
                    desktopNotifications.requestPermission(function (result) {
                        switch (result) {
                            case 'granted': settings.set('showDesktopNotifications', true).save(); break;
                            case 'denied': settings.set('showDesktopNotifications', false).save(); break;
                            // no default
                        }
                    });
                }

                if (desktopNotifications.isSupported()) {
                    this.listenTo(this.model, 'change:showDesktopNotifications', function (model, value) {
                        if (value !== true) return;
                        var view = this;
                        desktopNotifications.requestPermission(function (result) {
                            if (result !== 'denied' || view.disposed) return;
                            // revert if user denied the permission
                            // also yell message, because if a user pressed deny in the request permission dialog there is no way we can ask again.
                            // The user has to do this in the browser settings, because the api blocks any further request permission dialogs.
                            notifications.yell('info', gt('Please check your browser settings and enable desktop notifications for this domain'));
                            view.model.set('showDesktopNotifications', false);
                            // remove request link because it is useless. We cannot trigger requestPermission if the user denied. It has to be enabled via the browser settings.
                            view.$('.request-desktop-notifications').remove();
                        });
                    });

                    if (this.$requestLink.length) this.$requestLink = $('<br>').add(this.$requestLink);
                }
            }
        },
        //
        // Options
        //
        {
            id: 'options',
            render: function () {

                this.$el.append(
                    $('<div class="form-group" style="margin: 32px 0">').append(
                        util.checkbox('autoOpenNotification', gt('Automatic opening of notification area'), this.model),
                        util.checkbox('showDesktopNotifications', gt('Show desktop notifications'), this.model).append(this.$requestLink),
                        util.checkbox('features/accessibility', gt('Use accessibility improvements'), this.model),
                        util.checkbox('highcontrast', gt('High contrast theme'), this.model)
                    )
                );
            }
        },
        //
        // Buttons
        //
        {
            id: 'buttons',
            render: function () {

                var $group = $('<div class="form-group">');

                // check if users can edit their own data (see bug 34617)
                if (settings.get('user/internalUserEdit', true)) {
                    $group.append(
                        $('<button type="button" class="btn btn-default">')
                            .text(gt('My contact data') + ' ...')
                            .on('click', openUserSettings)
                    );
                }

                if (capabilities.has('edit_password')) {
                    $group.append(
                        $('<button type="button" class="btn btn-default">')
                            .text(gt('Change password') + ' ...')
                            .on('click', userSettings.changePassword)
                    );
                }

                if ($group.children().length) this.$el.append($group);
            }
        }
    );

    function select(name, label, model, options) {
        return $('<div class="form-group row">').append(
            $('<div class="col-md-6">').append(
                $('<label for="settings-' + name + '">').text(label),
                new mini.SelectView({ name: name, model: model, list: options }).render().$el
            )
        );
    }

    // register once
    settings.on('change:highcontrast', function (value) {
        $('html').toggleClass('high-contrast', value);
    });

    function openUserSettings() {
        require(['io.ox/core/settings/user'], function (settingsUser) {
            settingsUser.openModalDialog();
        });
    }

});
