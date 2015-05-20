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

define('plugins/administration/groups/settings/edit', [
    'io.ox/core/extensions',
    'io.ox/backbone/disposable',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/tk/dialogs',
    'io.ox/core/tk/typeahead',
    'plugins/administration/groups/settings/members',
    'io.ox/core/api/group',
    'io.ox/core/notifications',
    'gettext!io.ox/core'
], function (ext, DisposableView, common, dialogs, Typeahead, members, groupAPI, notifications, gt) {

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
                    this.append($('<div>').html(member.getFullName()));
                }
            });
        },

        render: function () {

            var guid, self = this, view = new Typeahead({
                apiOptions: {
                    users: true,
                    split: false
                },
                placeholder: gt('User name'),
                harmonize: function (data) {
                    data = _(data).map(function (m) {
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

            var model = groupAPI.getModel(options.id),
                edit = model.has('id');

            new dialogs.ModalDialog({ async: true })
                .build(function () {
                    this.header(
                        $('<h4>').text(edit ? gt('Edit group') : gt('Create new group'))
                    );
                    this.getContentNode().append(
                        (this.view = new View({ model: model })).render().$el
                    );
                })
                .addPrimaryButton('save', edit ? gt('Save') : gt('Create'), 'save', { tabindex: 1 })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabindex: 1 })
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
                .show(function () {
                    this.find('input:first').focus();
                });

            model = null;
        }
    };
});
