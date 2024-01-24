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

define('plugins/administration/resources/settings/edit', [
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/views/modal',
    'io.ox/core/api/resource',
    'io.ox/core/notifications',
    'io.ox/contacts/util',
    'gettext!io.ox/core'
], function (DisposableView, common, ModalDialog, resourceAPI, notifications, util, gt) {

    'use strict';

    //
    // Edit/create view
    //

    var View = DisposableView.extend({

        className: 'administration-resource-editor',

        initialize: function () {
            this.original = this.model.toJSON();
        },

        render: function () {

            var guid;

            this.$el.append(
                // display name
                $('<div class="form-group">').append(
                    $('<label>', { 'for': guid = _.uniqueId('input') }).text(gt('Resource name (mandatory)')),
                    new common.InputView({ name: 'display_name', id: guid, model: this.model }).render().$el
                ),
                // description
                $('<div class="form-group">').append(
                    $('<label>', { 'for': guid = _.uniqueId('input') }).text(gt('Description')),
                    new common.TextView({ name: 'description', id: guid, model: this.model, rows: 8 }).render().$el
                ),
                // mail address
                $('<div class="form-group">').append(
                    $('<label>', { 'for': guid = _.uniqueId('input') }).text(gt('Mail address (mandatory)')),
                    new common.InputView({ name: 'mailaddress', id: guid, model: this.model }).render().$el
                )
            );

            return this;
        },

        toJSON: function () {
            return this.model.toJSON();
        }
    });

    return {

        //
        // Open modal dialog
        //
        open: function (options) {

            options = options || {};

            var model = resourceAPI.getModel(options.id).clone(),
                edit = model.has('id');

            new ModalDialog({ title: edit ? gt('Edit resource') : gt('Create new resource'), async: true })
                .build(function () {
                    this.$body.append(
                        (this.view = new View({ model: model })).render().$el
                    );
                })
                .addCancelButton()
                .addButton({ label: edit ? gt('Save') : gt('Create'), action: 'save' })
                .on('save', function () {
                    var self = this;
                    resourceAPI[edit ? 'update' : 'create'](this.view.toJSON()).then(
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
