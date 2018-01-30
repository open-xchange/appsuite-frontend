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

    var INDEX = 0,
        MINUTES = 60000,
        availableApps = appAPI.getApps().map(function (o) {
            return {
                label: /*#, dynamic*/gt.pgettext('app', o.title),
                value: o.path
            };
        }).concat([{ label: gt('None'), value: '' }]);

    // this is the offical point for settings
    ext.point('io.ox/core/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/core/settings/detail/view', model: settings })
                .inject({

                    showNoticeFields: ['language', 'timezone', 'theme'],

                    showNotice: function (attr) {
                        return _(this.showNoticeFields).some(function (id) {
                            return id === attr;
                        });
                    },

                    reloadHint: gt('Some settings (language, timezone, theme) require a page reload or relogin to take effect.'),

                    getLanguageOptions: function () {
                        return _(ox.serverConfig.languages).map(function (key, val) {
                            return { label: key, value: val };
                        });
                    },

                    getThemeOptions: function () {

                        var availableThemes = settingOptions.get('themes') || {};
                        // until we get translated themes from backend
                        if (availableThemes['default']) availableThemes['default'] = gt('Default Theme');
                        // sort
                        return _(availableThemes)
                            .chain()
                            .map(function (key, val) { return { label: key, value: val }; })
                            .sortBy(function (obj) { return obj.label.toLowerCase(); })
                            .value();
                    },

                    hasMoreThanOneTheme: function () {
                        return _(settingOptions.get('themes')).size() > 1;
                    },

                    getRefreshOptions: function () {
                        return [
                            { label: gt('5 minutes'), value: 5 * MINUTES },
                            { label: gt('10 minutes'), value: 10 * MINUTES },
                            { label: gt('15 minutes'), value: 15 * MINUTES },
                            { label: gt('30 minutes'), value: 30 * MINUTES }
                        ];
                    },

                    getAutoLogoutOptions: function () {
                        return [
                            { label: gt('Never'), value: 0 },
                            { label: gt('5 minutes'), value: 5 * MINUTES },
                            { label: gt('10 minutes'), value: 10 * MINUTES },
                            { label: gt('15 minutes'), value: 15 * MINUTES },
                            { label: gt('30 minutes'), value: 30 * MINUTES }
                        ];
                    },

                    openUserSettings: function () {
                        require(['io.ox/core/settings/user'], function (settingsUser) {
                            settingsUser.openModalDialog();
                        });
                    }
                })
                .render().$el
            );
        }
    });

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
                this.listenTo(settings, 'change', function (attr) {
                    var showNotice = this.showNotice(attr);
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
                    $('<div class="help-block">').text(this.reloadHint + ' ').css('margin-bottom', '24px')
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
        // Fieldset/first
        //
        {
            index: INDEX += 100,
            id: 'fieldset/first',
            render: function (baton) {
                this.$el.append(
                    baton.branch('fieldset/first', this, $('<fieldset role="presentation">'))
                );
            }
        },
        //
        // Fieldset/second
        //
        {
            index: INDEX += 100,
            id: 'fieldset/second',
            render: function (baton) {
                this.$el.append(
                    baton.branch('fieldset/second', this, $('<fieldset role="presentation">'))
                );
            }
        },
        //
        // Fieldset/second
        //
        {
            index: INDEX += 100,
            id: 'fieldset/third',
            render: function (baton) {
                this.$el.append(
                    baton.branch('fieldset/third', this, $('<fieldset role="presentation">'))
                );
            }
        },
        //
        // Buttons
        //
        {
            id: 'buttons',
            render: function () {

                var $group = $('<div class="form-group buttons">');

                // check if users can edit their own data (see bug 34617)
                if (settings.get('user/internalUserEdit', true)) {
                    $group.append(
                        $('<button type="button" class="btn btn-default">')
                            .text(gt('My contact data') + ' ...')
                            .on('click', this.openUserSettings)
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

    INDEX = 0;

    ext.point('io.ox/core/settings/detail/view/fieldset/first').extend(
        //
        // Language
        //
        {
            id: 'language',
            index: INDEX += 100,
            render: function (baton) {

                if (!settings.isConfigurable('language')) return;

                baton.$el.append(
                    util.compactSelect('language', gt('Language'), this.model, this.getLanguageOptions())
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
            render: function (baton) {

                if (!settings.isConfigurable('timezone')) return;

                baton.$el.append(
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
            render: function (baton) {

                if (!settings.isConfigurable('theme')) return;
                if (!this.hasMoreThanOneTheme()) return;

                baton.$el.append(
                    util.compactSelect('theme', gt('Theme'), this.model, this.getThemeOptions())
                );
            }
        }
    );

    INDEX = 0;

    ext.point('io.ox/core/settings/detail/view/fieldset/second').extend(
        //
        // Refresh Interval
        //
        {
            id: 'refreshInterval',
            index: INDEX += 100,
            render: function (baton) {

                if (!settings.isConfigurable('refreshInterval')) return;

                baton.$el.append(
                    util.compactSelect('refreshInterval', gt('Refresh interval'), this.model, this.getRefreshOptions())
                );
            }
        },
        //
        // Auto start
        //
        {
            id: 'autoStart',
            index: INDEX += 100,
            render: function (baton) {

                if (!settings.isConfigurable('autoStart')) return;
                if (availableApps <= 2) return;

                baton.$el.append(
                    util.compactSelect('autoStart', gt('Default app after sign in'), this.model, availableApps)
                );
            }
        },
        //
        // Auto Logout
        //
        {
            id: 'autoLogout',
            index: INDEX += 100,
            render: function (baton) {

                if (!settings.isConfigurable('autoLogout')) return;

                baton.$el.append(
                    util.compactSelect('autoLogout', gt('Automatic sign out'), this.model, this.getAutoLogoutOptions())
                );
            }
        },
        //
        // Quicklaunch apps
        //
        {
            id: 'quickLaunch',
            index: INDEX += 100,
            render: function (baton) {

                var SelectView = mini.SelectView.extend({
                    onChange: function () {
                        var val = this.$el.val();
                        this.model.set(this.name, this.options.integer ? parseInt(val, 10) : val);
                        this.model.set('quicklaunch', _.uniq(_.compact([
                            this.model.get('apps/quicklaunch0'),
                            this.model.get('apps/quicklaunch1'),
                            this.model.get('apps/quicklaunch2')
                        ])).join(','));
                    },
                    setup: function () {
                        var settingsStr = this.model.get('quicklaunch');
                        if (settingsStr) {
                            var a = settingsStr.split(',');
                            if (this.options.pos <= a.length) {
                                this.model.set('apps/quicklaunch' + this.options.pos, a[this.options.pos], { silent: true });
                            }
                        }
                        this.listenTo(this.model, 'change:' + this.name, this.update);
                    }
                });

                var multiSelect = function (name, label, model, list, options) {
                    options = options || {};
                    var id = 'settings-' + name;
                    return $('<div class="col-md-2">').append(
                        $('<label>').attr('for', id).text(label),
                        new SelectView({ id: id, name: name, model: model, list: list, pos: options.pos }).render().$el
                    );
                };
                baton.$el.append(
                    $('<div class="form-group row">').append(
                        multiSelect('apps/quicklaunch0', gt('Quick launch 1'), this.model, availableApps, { pos: 0 }),
                        multiSelect('apps/quicklaunch1', gt('Quick launch 2'), this.model, availableApps, { pos: 1 }),
                        multiSelect('apps/quicklaunch2', gt('Quick launch 3'), this.model, availableApps, { pos: 2 })
                    )
                );
            }
        }
    );

    INDEX = 0;

    ext.point('io.ox/core/settings/detail/view/fieldset/third').extend(
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
                var self = this;
                // add ask now link (by design browsers only allow asking if there was no decision yet)
                this.$requestLink =
                    //#. Opens a native browser popup to decide if this applications/website is allowed to show notifications
                    $('<a href="#" role="button" class="request-desktop-notifications">').text(gt('Manage browser permissions now')).on('click', onClick);

                function onClick(e) {
                    e.preventDefault();
                    desktopNotifications.requestPermission(function (result) {
                        if (result !== 'default') self.$requestLink.hide();
                        switch (result) {
                            case 'granted': settings.set('showDesktopNotifications', true).save(); break;
                            case 'denied': settings.set('showDesktopNotifications', false).save(); break;
                            // no default
                        }
                    });
                }

                if (desktopNotifications.isSupported()) {
                    this.listenTo(this.model, 'change:showDesktopNotifications', function (value) {
                        if (value !== true) return;
                        var view = this;
                        desktopNotifications.requestPermission(function (result) {
                            if (result !== 'default') self.$requestLink.hide();
                            if (result !== 'denied' || view.disposed) return;
                            // revert if user denied the permission
                            // also yell message, because if a user pressed deny in the request permission dialog there is no way we can ask again.
                            // The user has to do this in the browser settings, because the api blocks any further request permission dialogs.
                            notifications.yell('info', gt('Please check your browser settings and enable desktop notifications for this domain'));
                            view.model.set('showDesktopNotifications', false, { silent: true });
                        });
                    });

                    this.$requestLink = $('<br>').add(this.$requestLink);
                }
            }
        },
        //
        // Options
        //
        {
            id: 'options',
            render: function (baton) {
                var options = [
                    util.checkbox('autoOpenNotification', gt('Automatic opening of notification area'), this.model),
                    util.checkbox('showDesktopNotifications', gt('Show desktop notifications'), this.model).append(this.$requestLink),
                    util.checkbox('features/accessibility', gt('Use accessibility improvements'), this.model)
                ];

                if (ox.debug) options.push(util.checkbox('coloredIcons', 'Debug: Colored icons in application launcher', this.model));

                baton.$el.append($('<div class="form-group">').append(options));
            }
        }
    );
});
