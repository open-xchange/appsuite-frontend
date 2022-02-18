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

define('io.ox/core/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/settings/util',
    'io.ox/core/api/apps',
    'io.ox/core/upsell',
    'io.ox/core/capabilities',
    'io.ox/core/notifications',
    'io.ox/core/locale',
    'io.ox/core/deputy/dialog',
    'io.ox/core/desktopNotifications',
    'plugins/portal/userSettings/register',
    'settings!io.ox/core',
    'settings!io.ox/core/settingOptions',
    'gettext!io.ox/core',
    'io.ox/backbone/mini-views/timezonepicker',
    'io.ox/core/main/appcontrol',
    'io.ox/core/settings/dialogs/quickLauncherDialog'
], function (ext, ExtensibleView, DisposableView, mini, util, apps, upsell, capabilities, notifications, locale, deputyDialog, desktopNotifications, userSettings, settings, settingOptions, gt, TimezonePicker, appcontrol, quickLauncherDialog) {

    'use strict';

    var INDEX = 0,
        MINUTES = 60000,
        // blacklist for apps that should not appear in the default app dropdown
        blackList = ['io.ox/chat'],
        availableApps = apps.forLauncher().filter(function (model) {
            var requires = model.get('requires');
            return upsell.has(requires) && !_(blackList).contains(model.get('id'));
        }).map(function (o) {
            return {
                label: o.getTitle(),
                value: o.get('path')
            };
        }).concat([{ label: gt('None'), value: 'none' }]);

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

                    reloadHint: gt('Some settings (e.g. language and timezone) require a page reload or relogin to take effect.'),

                    getLanguageOptions: function () {
                        var isCustomized = !_.isEmpty(settings.get('localeData')),
                            current = locale.current();
                        return _(locale.getSupportedLocales())
                            .map(function (locale) {
                                locale.name = isCustomized && locale.id === current ? locale.name + ' / ' + gt('Customized') : locale.name;
                                return { label: locale.name, value: locale.id };
                            });
                    },

                    getThemeOptions: function () {

                        var availableThemes = settingOptions.get('themes') || {};
                        // until we get translated themes from backend
                        if (availableThemes.default) availableThemes.default = gt('Default Theme');
                        // sort
                        return _(availableThemes)
                            .chain()
                            .map(function (key, val) { return { label: key, value: val }; })
                            .sortBy(function (obj) { return obj.label.toLowerCase(); })
                            .value();
                    },

                    getDesigns: function () {
                        return [
                            {
                                label: gt('Unicolor'),
                                options: [
                                    { label: gt('Default'), value: 'primary' }
                                ]
                            },
                            {
                                label: gt('Multicolor'),
                                options: [
                                    { label: gt('Indigo'), value: 'night' },
                                    { label: gt('Green'), value: 'twilight' },
                                    { label: gt('Turquoise'), value: 'dawn' },
                                    { label: gt('Blue'), value: 'day' },
                                    { label: gt('Purple/Magenta'), value: 'dusk' }
                                ]
                            },
                            {
                                //#. Option label for the automatic theme changer (changes theme depending on time)
                                label: gt('Automatic'),
                                options: [
                                    { label: gt('Time-dependent'), value: 'time' }
                                ]
                            }
                        ];
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

                    openUserSettings: function () {
                        require(['io.ox/core/settings/user'], function (settingsUser) {
                            settingsUser.openModalDialog();
                        });
                    },

                    propagateSettingsLanguage: function (val) {
                        require(['io.ox/core/api/tab'], function (tabApi) {
                            var newSettings = {
                                language: locale.deriveSupportedLanguageFromLocale(val),
                                locale: val
                            };
                            tabApi.propagate('update-ox-object', _.extend(newSettings, { exceptWindow: tabApi.getWindowName() }));
                            tabApi.updateOxObject(newSettings);
                        });
                    },

                    propagateSettingsTheme: function (val) {
                        require(['io.ox/core/api/tab'], function (tabApi) {
                            tabApi.propagate('update-ox-object', { theme: val, exceptWindow: tabApi.getWindowName() });
                            tabApi.updateOxObject({ theme: val });
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
                this.listenTo(settings, 'change', function (attr, value) {
                    if (ox.tabHandlingEnabled && attr === 'theme') this.propagateSettingsTheme(value);
                    if (ox.tabHandlingEnabled && attr === 'language') this.propagateSettingsLanguage(value);
                    var showNotice = this.showNotice(attr);
                    settings.saveAndYell(undefined, { force: !!showNotice }).then(
                        function success() {
                            if (!showNotice) return;
                            var message = gt('The setting requires a reload or relogin to take effect.');
                            notifications.yell('success', message);
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
                        $('<a href="#" role="button" data-action="reload">')
                            .text(gt('Reload page'))
                            .on('click', reload)
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
                // Quicklaunch apps
                if (settings.isConfigurable('apps/quickLaunch') && appcontrol.getQuickLauncherCount() !== 0 && !_.device('smartphone')) {
                    $group.append(
                        $('<button type="button" class="btn btn-default">')
                            .text(gt('Configure quick launchers') + ' ...')
                            .on('click', quickLauncherDialog.openDialog)
                    );
                }

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

                if (capabilities.has('deputy')) {
                    $group.append(
                        $('<button type="button" class="btn btn-default">')
                        .text(gt('Manage deputies'))
                        .on('click', deputyDialog.open)
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

                var getOptions = this.getLanguageOptions.bind(this),
                    select = util.compactSelect('language', gt('Language'), this.model, getOptions()),
                    view = select.find('select').data('view');

                select.find('.col-md-6').append(
                    $('<div class="help-block locale-example" style="white-space: pre">').text(getExample()),
                    $('<div class="help-block">').append(
                        $('<button role="button" class="btn btn-default" data-action="reload">')
                        .text(gt('More regional settings') + ' ...').on('click', editLocale)
                    )
                );

                view.listenTo(this.model, 'change:language', function (language) {
                    _.setCookie('locale', language);
                });

                view.listenTo(ox, 'change:locale:data', function () {
                    this.$el.siblings('.locale-example').text(getExample());
                    this.setOptions(getOptions());
                });

                baton.$el.append(select);

                function getExample() {
                    return moment().format('dddd, L LT') + '   ' +
                        locale.getDefaultNumberFormat() + '\n' +
                        gt('First day of the week: %1$s', locale.getFirstDayOfWeek());
                }

                function editLocale(e) {
                    e.preventDefault();
                    require(['io.ox/core/settings/editLocale'], function (dialog) {
                        dialog.open();
                    });
                }
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
        },
        //
        // Design
        //
        {
            id: 'design',
            index: INDEX += 100,
            render: function (baton) {

                // don't offer for IE11 as some design don't work technically
                if (_.device('ie <= 11')) return;
                if (!settings.get('features/userDesigns', true)) return;
                // works only for default theme
                if (this.hasMoreThanOneTheme()) return;

                baton.$el.append(
                    util.compactSelect('design', gt('Design'), this.model, this.getDesigns(), { groups: true })
                );
            }
        },
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
        }
    );

    INDEX = 0;

    ext.point('io.ox/core/settings/detail/view/fieldset/second').extend(

        //
        // Auto start
        //
        {
            id: 'autoStart',
            index: INDEX += 100,
            render: function (baton) {

                if (!settings.isConfigurable('autoStart') || capabilities.has('guest')) return;
                if (availableApps.length <= 2) return;

                baton.$el.append(
                    util.compactSelect('autoStart', gt('Default app after sign in'), this.model, availableApps)
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

                // mobile browsers generally don't support push notifications
                // and by design browsers only allow asking if there was no decision yet
                if (!desktopNotifications.isSupported() || desktopNotifications.getPermissionStatus().match(/granted|denied/)) {
                    this.$requestLink = '';
                    return;
                }

                // add ask now link
                // Opens a native browser popup to decide if this applications/website is allowed to show notifications
                this.$requestLink = $('<br>').add(
                    $('<a href="#" role="button" class="request-desktop-notifications">')
                        .text(gt('Manage browser permissions now'))
                        .on('click', onClick)
                );

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
                    util.checkbox('showDesktopNotifications', gt('Show desktop notifications'), this.model).append(this.$requestLink)
                ];

                //if (ox.debug) options.push(util.checkbox('coloredIcons', 'Debug: Colored icons in application launcher', this.model));

                baton.$el.append($('<div class="form-group">').append(options));
            }
        }
    );
});
