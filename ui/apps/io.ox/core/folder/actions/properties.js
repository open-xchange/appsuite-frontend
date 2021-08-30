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

define('io.ox/core/folder/actions/properties', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/modal',
    'settings!io.ox/contacts',
    'settings!io.ox/caldav',
    'gettext!io.ox/core',
    'io.ox/oauth/keychain',
    'io.ox/backbone/mini-views/copy-to-clipboard'
], function (ext, api, capabilities, ModalDialog, contactsSettings, caldavConfig, gt, oauthAPI, CopyToClipboard) {

    'use strict';

    function group(label, value) {
        var guid = _.uniqueId('form-control-label-');
        return $('<div class="form-group">').append(
            // label
            $('<label class="control-label">').attr('for', guid).text(label),
            // value
            $('<div class="input-group link-group">').append(
                $('<input type="text" class="form-control">')
                    .attr('id', guid)
                    .prop('readonly', true)
                    .val(value),
                $('<span class="input-group-btn">').append(
                    new CopyToClipboard({ targetId: '#' + guid }).render().$el
                )
            )
        );
    }

    // ext.point('io.ox/core/folder/actions/properties').extend({
    //     id: 'type',
    //     index: 100,
    //     render: (function () {
    //         function ucfirst(str) {
    //             return str.charAt(0).toUpperCase() + str.slice(1);
    //         }
    //         return function () {
    //             var module = this.model.get('module');
    //             this.$body.append(
    //                 group(
    //                     gt('Folder type'), ucfirst(module)
    //                 )
    //             );
    //         };
    //     }())
    // });

    // ext.point('io.ox/core/folder/actions/properties').extend({
    //     id: 'count',
    //     index: 200,
    //     render: function () {
    //         if (!this.model.supports('count_total')) return;

    //         var total = this.model.get('total'),
    //             module = this.model.get('module');
    //         // fix count in global address book if the admin is hidden
    //         if (String(this.model.get('id')) === '6' && !contactsSettings.get('showAdmin', false)) total--;
    //         this.$body.append(
    //             group(
    //                 module === 'mail' ?
    //                     //#. number of messages in a folder (mail only)
    //                     gt('Number of messages') :
    //                     //#. number of items in a folder
    //                     gt('Number of items'),
    //                 total
    //             )
    //         );
    //     }
    // });

    // ext.point('io.ox/core/folder/actions/properties').extend({
    //     id: 'caldav-url',
    //     index: 300,
    //     render: function () {
    //         if (!capabilities.has('caldav')) return;
    //         var module = this.model.get('module');
    //         // show CalDAV URL for calendar and task folders (tasks only supports private folders)
    //         // users requires "caldav" capability
    //         if (module !== 'calendar' && (module !== 'tasks' || this.model.is('private'))) return;
    //         this.$body.append(
    //             group(gt('CalDAV URL'),
    //                 caldavConfig.get('url')
    //                     .replace('[hostname]', location.host)
    //                     .replace('[folderId]', this.model.get('id'))
    //             )
    //         );
    //     }
    // });

    ext.point('io.ox/core/folder/actions/properties').extend({
        id: 'caldav-url',
        index: 300,
        render: function () {
            // make sure this works for tasks and calendar
            if (this.model.get('module') === 'calendar') {
                var usedForSync = this.model.get('used_for_sync') || {};
                if (!usedForSync || usedForSync.value !== 'true') return;
                // for tasks also check if the capability is enabled and the folder is private
            } else if (!(this.model.get('module') === 'tasks' && capabilities.has('caldav') && this.model.is('private'))) return;

            var url = this.model.get('com.openexchange.caldav.url');
            if (!url) return;
            this.$body.append(group(gt('CalDAV URL'), url));
        }
    });

    ext.point('io.ox/core/folder/actions/properties').extend({
        id: 'ical-url',
        index: 400,
        render: function () {
            var provider = this.model.get('com.openexchange.calendar.provider');
            if (provider !== 'ical') return;
            var config = this.model.get('com.openexchange.calendar.config');
            if (!config || !config.uri) return;
            this.$body.append(group(gt('iCal URL'), config.uri));
        }
    });

    ext.point('io.ox/core/folder/actions/properties').extend({
        id: 'description',
        index: 500,
        render: function () {
            var extendedProperties = this.model.get('com.openexchange.calendar.extendedProperties');
            if (!extendedProperties || !extendedProperties.description || !extendedProperties.description.value) return;
            this.$body.append(
                $('<div class="form-group">').append(
                    $('<label>').text(gt('Description')),
                    $('<div class="help-block">').text(extendedProperties.description.value)
                )
            );
        }
    });

    ext.point('io.ox/core/folder/actions/properties').extend({
        id: 'last-updated',
        index: 600,
        render: function () {
            var extendedProperties = this.model.get('com.openexchange.calendar.extendedProperties');
            if (!extendedProperties || !extendedProperties.lastUpdate) return;
            this.$body.append(
                $('<div class="form-group">').append(
                    $('<label>').text(gt('Last updated')),
                    $('<div class="help-block">').text(moment(extendedProperties.lastUpdate.value).fromNow())
                )
            );
        }
    });

    ext.point('io.ox/core/folder/actions/properties').extend({
        id: 'account',
        index: 700,
        render: function () {
            var self = this,
                provider = this.model.get('com.openexchange.calendar.provider');
            if (provider !== 'google') return;
            var config = this.model.get('com.openexchange.calendar.config');
            if (!config || !config.oauthId) return;
            var account = oauthAPI.accounts.get(config.oauthId);
            if (!account) return;
            var displayName = account.get('displayName');
            if (!displayName) return;
            this.$body.append(
                $('<div class="form-group">').append(
                    $('<label>').text(gt('Account')),
                    $('<div>').append(
                        $('<a href="#" role="button">').text(displayName).on('click', function (e) {
                            var options = { id: 'io.ox/settings/accounts' };
                            ox.launch('io.ox/settings/main', options).done(function () {
                                this.setSettingsPane(options);
                            });
                            e.preventDefault();
                            self.close();
                        })
                    )
                )
            );
        }
    });

    ext.point('io.ox/core/folder/actions/properties').extend({
        id: 'provider',
        index: 800,
        render: (function () {
            var providerMapping = {
                'ical': gt('iCal feed'),
                'google': gt('Google subscription'),
                'schedjoules': gt('Calendars of interest')
            };
            return function () {
                var provider = this.model.get('com.openexchange.calendar.provider');
                if (!provider) return;
                if (!providerMapping[provider]) return;
                this.$body.append(
                    $('<div class="form-group">').append(
                        $('<label>').text(gt('Type')),
                        $('<div class="help-block">').text(providerMapping[provider])
                    )
                );
            };
        }())
    });

    return function folderProperties(id) {

        var model = api.pool.getModel(id);

        new ModalDialog({
            title: gt('Properties') + ': ' + model.get('title'),
            point: 'io.ox/core/folder/actions/properties',
            model: model,
            width: 500
        })
        .addButton({ label: gt('Close'), action: 'close' })
        .open();
    };
});
