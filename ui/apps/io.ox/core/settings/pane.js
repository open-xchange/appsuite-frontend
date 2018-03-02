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

    // Check that the app exists in available applications
    function getAvailablePath(app) {
        return _(availableApps).findWhere({ 'value': app }) ? app : '';
    }

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

                    getDesigns: function () {
                        return [
                            {
                                label: gt('Unicolor'),
                                options: [
                                    { label: gt('Blue'), value: 'blue' }
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
                                //.# Option label for the automatic theme changer (changes theme depending on time)
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
                if (!settings.get('features/designs', true)) return;

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

                if (!settings.isConfigurable('autoStart')) return;
                if (availableApps <= 2) return;

                baton.$el.append(
                    util.compactSelect('autoStart', gt('Default app after sign in'), this.model, availableApps)
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
                // FIXME: wow, this is complicated. We need a separate model, because the setting is actually supposed to be
                // _one_ string instead of just fields in an object. Since settings are no real models, we can not sync
                // silently between the states.
                var quickLaunchModel = new Backbone.Model(),
                    settings = this.model,
                    settingsStr = settings.get('quicklaunch'),
                    // first view does all the event handling, cleans up listeners on dispose
                    firstView = null;
                if (settingsStr) {
                    var a = settingsStr.split(',');
                    for (var pos = 0; pos <= a.length; pos++) {
                        quickLaunchModel.set('apps/quicklaunch' + pos, getAvailablePath(a[pos]));
                    }
                }
                function appsForPos(pos) {
                    return [0, 1, 2]
                        .filter(function (i) { return i !== pos; })
                        .map(function (i) { return quickLaunchModel.get('apps/quicklaunch' + i); })
                        .reduce(function (acc, app) {
                            return acc.filter(function (a) { return a.value !== app || app === ''; });
                        }, availableApps);
                }
                var multiSelect = function (name, label, options) {
                    options = options || {};
                    var id = 'settings-' + name,
                        view = new mini.SelectView({ id: id, name: name, model: quickLaunchModel, list: appsForPos(options.pos), pos: options.pos });

                    if (!firstView) firstView = view;
                    view.listenTo(quickLaunchModel, 'change', function () {
                        this.options.list = appsForPos(this.options.pos);
                        this.$el.empty();
                        this.render();
                    });
                    return $('<div class="col-md-6">').append(

                        $('<label>').attr('for', id).text(label),
                        view.render().$el
                    );
                };
                baton.$el.append(
                    $('<div class="form-group row">').append(multiSelect('apps/quicklaunch0', gt('Quick launch 1'), { pos: 0 })),
                    $('<div class="form-group row">').append(multiSelect('apps/quicklaunch1', gt('Quick launch 2'), { pos: 1 })),
                    $('<div class="form-group row">').append(multiSelect('apps/quicklaunch2', gt('Quick launch 3'), { pos: 2 }))
                );

                firstView.listenTo(quickLaunchModel, 'change', function () {
                    settings.set('quicklaunch', [
                        quickLaunchModel.get('apps/quicklaunch0'),
                        quickLaunchModel.get('apps/quicklaunch1'),
                        quickLaunchModel.get('apps/quicklaunch2')
                    ].join(','));
                });
                firstView.listenTo(settings, 'change:quicklaunch', function (settingsStr) {
                    var a = settingsStr.split(',');
                    for (var pos = 0; pos <= a.length; pos++) {
                        quickLaunchModel.set('apps/quicklaunch' + pos, getAvailablePath(a[pos]));
                    }
                });
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
                if (desktopNotifications.getPermissionStatus().match(/granted|denied/)) this.$requestLink.hide();
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

                if (ox.debug) options.push(util.checkbox('coloredIcons', 'Debug: Colored icons in application launcher', this.model));

                baton.$el.append($('<div class="form-group">').append(options));
            }
        }
    );
});
