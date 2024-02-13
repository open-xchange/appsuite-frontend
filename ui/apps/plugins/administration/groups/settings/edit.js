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

define('plugins/administration/groups/settings/edit', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/typeahead',
    'plugins/administration/groups/settings/members',
    'io.ox/core/api/group',
    'io.ox/core/notifications',
    'gettext!io.ox/core'
], function (ext, DisposableView, common, ModalDialog, Typeahead, members, groupAPI, notifications, gt) {

    'use strict';

    //
    // Edit/create view
    //

    var View = DisposableView.extend({

        className: 'administration-group-editor',

        initialize: function () {
            this.membersView = new members.View({ model: this.model, editable: true });
            this.original = this.model.toJSON();

            /*
             * extension point for autocomplete item
             */
            ext.point('plugins/administration/groups/settings/edit/autoCompleteItem').extend({
                id: 'view',
                index: 100,
                draw: function (member) {
                    this.append($('<div>').html(member.getFullNameHTML()));
                }
            });
        },

        render: function () {

            var guid,
                self = this,
                view = new Typeahead({
                    apiOptions: {
                        users: true,
                        split: false
                    },
                    placeholder: gt('User name'),
                    harmonize: function (data) {
                        data = _(data).map(function (m) {
                            m.internal_userid = m.id;
                            return new members.Member(m);
                        });
                        // remove duplicate entries from typeahead dropdown
                        var col = self.membersView.collection;
                        return _(data).filter(function (model) {
                            return !col.get(model.id);
                        });
                    },
                    click: function (e, member) {
                        self.membersView.collection.add(member, { parse: true });
                    },
                    extPoint: 'plugins/administration/groups/settings/edit'
                });

            this.$el.append(
                // name
                $('<div class="form-group">').append(
                    $('<label>', { 'for': guid = _.uniqueId('input') }).text(gt('Group name')),
                    new common.InputView({ name: 'display_name', id: guid, model: this.model }).render().$el
                ),
                // auto-complete
                $('<div class="form-group">').append(
                    $('<label class="sr-only">', { 'for': guid = _.uniqueId('input') }).text(gt('Start typing to search for user names')),
                    view.$el.attr({ id: guid })
                ),
                // members view
                $('<div class="form-group">').append(
                    $('<label>', { 'for': guid = _.uniqueId('list') }).text(gt('Members')),
                    this.membersView.render().$el.attr('id', guid)
                )
            );

            view.render();
            return this;
        },

        toJSON: function () {
            return {
                id: this.model.get('id'),
                name: this.model.get('name'),
                display_name: this.model.get('display_name'),
                members: this.membersView.toJSON()
            };
        }
    });

    return {

        //
        // Open modal dialog
        //
        open: function (options) {

            options = options || {};

            var model = groupAPI.getModel(options.id).clone(),
                edit = model.has('id');

            new ModalDialog({ title: edit ? gt('Edit group') : gt('Create new group'), async: true })
                .build(function () {
                    this.$body.append(
                        (this.view = new View({ model: model })).render().$el
                    );
                })
                .addCancelButton()
                .addButton({ label: edit ? gt('Save') : gt('Create'), action: 'save' })
                .on('save', function () {
                    var self = this;
                    groupAPI[edit ? 'update' : 'create'](this.view.toJSON()).then(
                        function success() {
                            self.close();
                        },
                        function fail(error) {
                            notifications.yell(error);
                            self.idle();
                        }
                    );
                })
                .on('close', function () {
                    this.view = null;
                })
                .open();

            model = null;
        }
    };
});
