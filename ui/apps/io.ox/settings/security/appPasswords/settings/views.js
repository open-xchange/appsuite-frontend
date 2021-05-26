/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/settings/security/appPasswords/settings/views', [
    'io.ox/core/extensions',
    'io.ox/settings/util',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/backbone/views/disposable',
    'io.ox/core/notifications',
    'gettext!io.ox/settings',
    'static/3rd.party/purify.min.js'
], function (ext, settingsUtil, listUtils, DisposableView, notifications, gt, DOMPurify) {
    'use strict';


    var PasswordListItemView = DisposableView.extend({

        tagName: 'li',

        className: 'settings-list-item',

        events: {
            'click [data-action="delete"]': 'onDelete'
        },

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

        getTitle: function () {
            return this.model.get('UUID');
        },
        makeTitle: function (label) {
            return $('<div class="list-item-title">').append(
                label ? $('<label>').text(label).attr('title', label) : $()
            );
        },
        renderTitle: function (app) {
            var appTitle = DOMPurify.sanitize(app);
            return this.makeTitle(appTitle)
                .addClass('appPermDiv');
        },
        getLastLogin: function () {
            return this.model.get('LastLogin') ?
                new Date(this.model.get('LastLogin')).toLocaleString() :
                gt('Never used');
        },
        renderLastLogin: function () {
            var date = this.getLastLogin();
            var lastDevice;
            if (this.model.get('LastDevice')) {
                switch (this.model.get('LastDevice')) {
                    case 'USM-EAS':
                        lastDevice = gt('Exchange Active Sync (EAS)');
                        break;
                    case 'DRIVE_UPDATER':
                        lastDevice = gt('Drive Client');
                        break;
                    case 'OX_DRIVE':
                        lastDevice = gt('Drive Client');
                        break;
                    case 'open-xchange-mobile-api-facade':
                        lastDevice = gt('Mobile Mail');
                        break;
                    default:
                        lastDevice = this.model.get('LastDevice');
                }
            }
            var div = $('<div class = "appLoginDiv">')
                .append($('<span class="appLoginData">').append(
                    _.device('small') ? date : gt('Last Login: %s', date)))
                .append(lastDevice ? $('<span class="appLoginData">').append($('<br>'),
                    _.device('small') ? lastDevice : gt('Device: %s', lastDevice)) : '')
                .append(this.model.get('IP') ? $('<span class="appLoginData">').append($('<br>'),
                    gt('IP: %s', this.model.get('IP'))) : '')
                .append(this.model.get('GeoData') ? $('<span class="appLoginData">').append($('<br>'),
                    gt('Location: %s', this.model.get('GeoData'))) : '')
                //#. 1st %s = name of last device that was used to log in (e.g. 'Drive Client') | 2nd %s = date of the login
                .attr('title', gt('%s logged in on %s', lastDevice, date));
            return div;
        },
        render: function () {
            var self = this,
                title = self.getTitle();
            self.$el.attr({
                'data-id': self.model.get('UUID')
            });

            self.$el.empty().append(
                this.renderTitle(self.model.get('Name')),
                this.renderLastLogin(self.model.get('last')),
                listUtils.makeControls().append(
                    listUtils.controlsDelete({ title: gt('Delete %1$s', title) }).addClass('appDelete')
                ).addClass('appListControls')
            );

            return self;
        },

        onDelete: function (e) {
            e.preventDefault();
            var self = this;
            require(['io.ox/backbone/views/modal', 'io.ox/core/api/appPasswordApi'], function (ModalDialog, api) {
                new ModalDialog({
                    async: true,
                    title: gt('Delete password')
                })
                .build(function () {
                    this.$body.append(gt('Do you really want to delete this password?'));
                })
                .addCancelButton()
                .addButton({ action: 'delete', label: gt('Delete') })
                .on('delete', function () {
                    var popup = this;
                    api.remove(self.model.get('UUID'))
                    .then(function () {
                        self.model.collection.remove(self.model);
                        popup.close();
                    }, function (error) {
                        require(['io.ox/core/notifications'], function (notifications) {
                            notifications.yell('error', gt('There was a problem removing the password.'));
                            console.error(error);
                        });
                        popup.close();
                    });
                })
                .open();
            });

        }
    });

    return {
        ListItem: PasswordListItemView
    };

});
