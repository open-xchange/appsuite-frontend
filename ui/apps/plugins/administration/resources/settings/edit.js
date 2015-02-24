/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/administration/resources/settings/edit', [
    'io.ox/backbone/disposable',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/tk/dialogs',
    'io.ox/core/api/resource',
    'io.ox/core/notifications',
    'io.ox/contacts/util',
    'gettext!io.ox/core'
], function (DisposableView, common, dialogs, resourceAPI, notifications, util, gt) {

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
                    $('<label>', { 'for': guid = _.uniqueId('input') }).text(gt('Resource name')),
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

            var model = resourceAPI.getModel(options.id),
                edit = model.has('id');

            new dialogs.ModalDialog({ async: true })
                .build(function () {
                    this.header(
                        $('<h4>').text(edit ? gt('Edit resource') : gt('Create new resource'))
                    );
                    this.getContentNode().append(
                        (this.view = new View({ model: model })).render().$el
                    );
                })
                .addPrimaryButton('save', edit ? gt('Save') : gt('Create'), 'save', { tabindex: 1 })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabindex: 1 })
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
                .show(function () {
                    this.find('input:first').focus();
                });

            model = null;
        }
    };
});
