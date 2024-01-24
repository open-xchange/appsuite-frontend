/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/settings/security/appPasswords/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/settings/util',
    'io.ox/core/api/appPasswordApi',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/settings/security/appPasswords/settings/views',
    'gettext!io.ox/core/boot',
    'less!io.ox/settings/security/appPasswords/settings/style',
    'io.ox/settings/security/appPasswords/settings/addPassword'
], function (ext, ExtensibleView, util, api, ListView, PasswordView, gt) {
    'use strict';

    var PasswordModel = Backbone.Model.extend({
        idAttribute: 'UUID'
    });

    var PasswordCollection = Backbone.Collection.extend({
        model: PasswordModel
    });


    ext.point('io.ox/settings/security/appPasswords/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/settings/security/appPasswords/settings/detail/view' })
                .render().$el
            );
            ox.on('refresh^', function () {
                if ($('.appPasswords').is(':visible')) {  // Refresh password list if visible
                    refreshList();
                }
            });
        }
    });

    var INDEX = 0;

    ext.point('io.ox/settings/security/appPasswords/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.header(gt.pgettext('app', 'Application Passwords'))
                );
            }
        },
        {
            id: 'intro',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    $('<div class="help-block appHelpBlock">')
                    .text(gt('Manage additional passwords for use with other devices.')));
            }
        },
        {
            id: 'list',
            index: INDEX += 100,
            render: function () {
                var placeholder = $('<div id="passwordList" class="appPasswords">');
                this.$el.append(
                    $('<div class="appPasswords">').append(util.fieldset(gt('Existing passwords'),
                        placeholder)));
                refreshList();
            }
        },
        {
            id: 'add',
            index: INDEX += 100,
            render: function (baton) {
                var placeholder = $('<div>');
                this.$el.append(
                    $('<div>').append(util.fieldset(gt('Add passwords'),
                        placeholder)));
                ext.point('io.ox/settings/security/appPasswords/addDevice/').invoke('render', placeholder, baton);
            }
        }
    );

    function refreshList() {
        api.getPasswords().then(function (data) {
            if (_.isArray(data) && data.length > 0) {
                var collection = new PasswordCollection();
                data.forEach(function (pw) {
                    collection.add(new PasswordModel(pw));
                });
                var view = new ListView({
                    tagName: 'ul',
                    collection: collection,
                    childView: PasswordView.ListItem
                });
                view.on('remove', function () {
                    if (this.collection.length === 0) {
                        $('.appPasswords').hide();
                    }
                });
                $('#passwordList').empty().append(
                    view.render().$el
                );
                $('.appPasswords').show();
            } else {
                $('.appPasswords').hide();  // Empty.  Don't show labels, etc
            }

        }, function (error) {
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell('error', gt('There was a problem getting the list of passwords from the server.'));
                console.error(error);
            });
        });
    }

    return {
        refresh: refreshList
    };

});

