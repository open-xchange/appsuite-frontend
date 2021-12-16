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

define('io.ox/settings/security/sessions/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'gettext!io.ox/core',
    'io.ox/core/http',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/mini-views/listutils',
    'settings!io.ox/core',
    'less!io.ox/settings/security/sessions/settings/style'
], function (ext, ExtensibleView, gt, http, SettingsListView, DisposableView, listUtils, settings) {

    'use strict';

    var SessionModel = Backbone.Model.extend({

        idAttribute: 'sessionId',

        initialize: function () {
            ext.point('io.ox/settings/sessions/deviceType').invoke('customize', this);
            ext.point('io.ox/settings/sessions/operatingSystem').invoke('customize', this);
            ext.point('io.ox/settings/sessions/application').invoke('customize', this);
        },

        getDeviceInfo: function (name) {
            var device = this.get('device') || {};
            return device[name] || {};
        }

    });

    ext.point('io.ox/settings/sessions/deviceType').extend({
        id: 'desktop-mobile',
        index: 100,
        customize: function () {
            var os = this.getDeviceInfo('os').name || '';
            if (os === 'ios' || os === 'android') this.set('deviceType', 'phone');
            else this.set('deviceType', 'desktop');
        }
    });

    ext.point('io.ox/settings/sessions/operatingSystem').extend({
        id: 'os',
        index: 100,
        customize: (function () {
            var mapping = {
                //#. Context: Session Management. Active session on platform/os.
                windows: gt('Windows'),
                //#. Context: Session Management. Active session on platform/os.
                linux: gt('Linux'),
                //#. Context: Session Management. Active session on platform/os.
                macos: gt('Mac'),
                //#. Context: Session Management. Active session on platform/os.
                ios: gt('iOS'),
                //#. Context: Session Management. Active session on platform/os.
                android: gt('Android')
            };

            return function () {
                var os = this.getDeviceInfo('os').name || '';
                this.set('operatingSystem', mapping[os]);
            };
        }())
    });

    ext.point('io.ox/settings/sessions/application').extend({
        id: 'browsers',
        index: 100,
        customize: (function () {
            var mapping = {
                chrome: gt('Chrome'),
                safari: gt('Safari'),
                'mobile safari': gt('Safari'),
                firefox: gt('Firefox'),
                edge: gt('Edge'),
                msie: gt('Internet Explorer'),
                opera: gt('Opera'),
                chromium: gt('Chromium')
            };
            return function () {
                var deviceInfo = this.getDeviceInfo('client');
                if (deviceInfo.type !== 'browser') return;
                var family = deviceInfo.family || '',
                    name = deviceInfo.name || '';
                this.set('application', mapping[family] || mapping[name]);
            };
        }())
    });

    ext.point('io.ox/settings/sessions/application').extend({
        id: 'oxapp',
        index: 200,
        customize: (function () {
            var mapping = {
                oxdriveapp: settings.get('productname/oxdrive') || 'OXDrive',
                oxmailapp: settings.get('productname/mailapp') || 'OX Mail',
                oxsyncapp: settings.get('productname/oxsync') || 'OX Sync'
            };
            return function () {
                var deviceInfo = this.getDeviceInfo('client');
                if (deviceInfo.type !== 'oxapp') return;
                var family = deviceInfo.family || deviceInfo.name || '',
                    name = deviceInfo.name || '';
                this.set('application', mapping[family] || mapping[name]);
            };
        }())
    });

    ext.point('io.ox/settings/sessions/application').extend({
        id: 'dav',
        index: 300,
        customize: (function () {
            var mapping = {
                //#. Context: Session Management. Refers to the macos calendar
                macos_calendar: gt('Calendar'),
                //#. Context: Session Management. Refers to the macos addressbook
                macos_addressbook: gt('Addressbook'),
                //#. Context: Session Management. Refers to ios calendar and/or addressbook
                'ios_calendar/addressbook': gt('Calendar/Addressbook'),
                thunderbird_lightning: gt('Thunderbird Lightning'),
                emclient: gt('eM Client'),
                emclient_appsuite: gt('Appsuite eM Client'),
                caldav_sync: gt('CalDav'),
                carddav_sync: gt('CardDav'),
                davdroid: gt('DAVdroid'),
                windows_phone: gt('CalDav/CardDav'),
                windows: gt('CalDav/CardDav'),
                generic_caldav: gt('CalDav'),
                generic_carddav: gt('CardDav'),
                webdav: gt('WebDAV')
            };
            return function () {
                var deviceInfo = this.getDeviceInfo('client');
                if (deviceInfo.type !== 'dav') return;
                var family = deviceInfo.family || deviceInfo.name || '',
                    name = deviceInfo.name || '';
                this.set('application', mapping[family] || mapping[name] || gt('CalDav/CardDav'));
            };
        }())
    });

    ext.point('io.ox/settings/sessions/application').extend({
        id: 'eas',
        index: 400,
        customize: (function () {
            var mapping = {
                usmeasclient: gt('Exchange Active Sync')
            };
            return function () {
                var deviceInfo = this.getDeviceInfo('client');
                if (deviceInfo.type !== 'eas') return;
                var family = deviceInfo.family || '',
                    name = deviceInfo.name || '';
                this.set('application', mapping[family] || mapping[name] || gt('Exchange Active Sync'));
            };
        }())
    });

    var SessionCollection = Backbone.Collection.extend({

        model: SessionModel,

        comparator: function (model) {
            // sort ascending
            // current session should always be topmost
            if (model.get('sessionId') === ox.session) return -Number.MAX_VALUE;
            // sessions without lastActive timestamp should be last
            return model.has('lastActive') ? -model.get('lastActive') : Number.MAX_VALUE;
        },

        initialize: function () {
            this.initial = this.fetch();
        },

        fetch: function () {
            var self = this;
            return http.GET({
                url: ox.apiRoot + '/sessionmanagement',
                params: { action: 'all' }
            }).then(function success(data) {
                self.set(data);
            });
        }
    });

    var SessionItemView = DisposableView.extend({

        tagName: 'li',

        className: 'settings-list-item',

        events: {
            'click a[data-action="delete"]': 'onDelete'
        },

        render: function () {
            var isCurrent = this.model.get('sessionId') === ox.session,
                lastActive = this.model.has('lastActive') ? moment(this.model.get('lastActive')).fromNow() : '';
            this.$el.empty().append(
                $('<div class="list-item-content">').append(
                    $('<div class="fa-stack client-icon">').addClass(this.model.get('deviceType')).addClass(this.model.get('os')).append(
                        $('<i class="fa fa-stack-1x device" aria-hidden="true">'),
                        $('<i class="fa fa-stack-1x os" aria-hidden="true">')
                    ),
                    $('<div class="primary">').append(
                        $('<span>').text(this.model.get('application') || gt('Unknown application')),
                        $('<span>').text('(' + (this.model.get('operatingSystem') || gt('Unknown device')) + ')')
                    ),
                    $('<div class="secondary">').append(
                        $('<span>').text(this.model.get('location')),
                        //#. text in the settings pane to indicate session that is currently active
                        isCurrent ? $('<span class="label label-success">').text(gt('Now active')) : $('<span>').text(lastActive)
                    )
                ),
                $('<div class="list-item-controls">').append(
                    !isCurrent ? $('<a href="#" class="action" data-action="delete">').text(gt('Sign out')) : ''
                )
            );
            return this;
        },
        onDelete: function (e) {
            var self = this;
            e.preventDefault();

            var baton = ext.Baton({
                data: { sessionId: self.model.get('sessionId') },
                model: self.model,
                // assign collection here since the view might be removed later
                collection: this.collection
            });

            ext.point('io.ox/settings/sessions/signout').invoke('render', this, baton, {
                text: gt('Do you really want to sign out from that device?'),
                confirmText: gt('Sign out'),
                action: 'delete'
            });
        }

    });

    var SessionView = Backbone.View.extend({

        className: 'session-list-container',

        initialize: function () {
            this.$el.data('view', this);
            this.collection.on('update', _.bind(this.render, this));
        },

        render: function () {
            var self = this;
            this.$el.empty().append(
                self.listView = new SettingsListView({
                    collection: self.collection,
                    childView: SessionItemView,
                    childOptions: { collection: self.collection }
                }).render().$el
            );

            return this;
        }

    });

    ext.point('io.ox/settings/security/sessions/settings/detail').extend({
        id: 'view',
        index: 100,
        draw: function () {
            var collection = new SessionCollection();
            this.append(
                new ExtensibleView({
                    point: 'io.ox/settings/sessions/settings/detail/view',
                    collection: collection
                })
                .render().$el
            );

            ox.on('refresh^', function () {
                collection.fetch();
            });
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'title',
        index: 100,
        render: function () {
            this.$el
                .addClass('io-ox-session-settings')
                .append(
                    $('<h1>').text(gt('You are currently signed in with the following devices'))
                );
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'spinner',
        index: 200,
        render: function (baton) {
            var spinner;
            this.$el.append(spinner = $('<div>').busy());
            baton.view.collection.initial.always(function () {
                spinner.remove();
            });
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'list',
        index: 300,
        render: function (baton) {
            this.$el.append(
                new SessionView({
                    collection: baton.view.collection
                }).render().$el
            );
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'remove-all',
        index: 1000,
        render: function (baton) {
            var link;

            this.$el.append(
                link = $('<button data-action="remove-all" class="btn btn-primary hidden">').text(gt('Sign out from all clients'))
                    .on('click', function (e) {
                        e.preventDefault();
                        ext.point('io.ox/settings/sessions/signout').invoke('render', this, baton, {
                            text: gt('Do you really want to sign out from all clients except the current one?'),
                            confirmText: gt('Sign out'),
                            action: 'clear'
                        });
                    })
            );
            baton.view.collection.initial.done(function () {
                if (baton.view.collection.length === 0) return;
                link.removeClass('hidden');
            });
        }
    });

    ext.point('io.ox/settings/sessions/signout').extend({
        id: 'default',
        index: 100,
        render: function (baton, options) {
            require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                //#. 'Sign out from device' as header of a modal dialog to sign out of a session.
                new ModalDialog({
                    title: gt('Sign out from device'),
                    description: options.text,
                    async: true,
                    point: 'io.ox/settings/sessions/signout/dialog'
                })
                .addCancelButton()
                .addButton({ label: options.confirmText, action: 'ok' })
                .on('ok', function () {
                    ext.point('io.ox/settings/sessions/signout/dialog/' + options.action).invoke('action', this, baton);
                })
                .open();
            });
        }
    });

    ext.point('io.ox/settings/sessions/signout/dialog/clear').extend({
        id: 'default',
        index: 100,
        action: function (baton) {
            var dialog = this;
            this.busy();
            http.GET({
                url: ox.apiRoot + '/sessionmanagement',
                params: { action: 'clear' }
            }).fail(function (error) {
                require(['io.ox/core/yell'], function (yell) {
                    yell(error);
                });
            }).always(function () {
                baton.view.collection.fetch().always(dialog.close);
            });
        }
    });

    ext.point('io.ox/settings/sessions/signout/dialog/delete').extend({
        id: 'default',
        index: 100,
        action: function (baton) {
            var dialog = this;
            http.PUT({
                url: ox.apiRoot + '/sessionmanagement',
                params: { action: 'delete' },
                data: [baton.data.sessionId]
            }).fail(function (error) {
                require(['io.ox/core/yell'], function (yell) {
                    yell(error);
                });
                baton.collection.fetch();
            }).always(function () {
                dialog.close();
            });

            // trigger destroy will remove the model from all collections
            // do not use destroy(), because that will use the backbone sync mechanism
            baton.model.trigger('destroy', baton.model);
        }
    });

    return {
        Model: SessionModel,
        Collection: SessionCollection,
        View: SessionView
    };

});
