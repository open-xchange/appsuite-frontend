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
    'io.ox/backbone/disposable',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/tk/dialogs',
    'io.ox/calendar/edit/view-addparticipants',
    'plugins/administration/groups/settings/members',
    'io.ox/core/api/group',
    'io.ox/core/notifications',
    'io.ox/contacts/util',
    'gettext!io.ox/core'
], function (DisposableView, common, dialogs, AddParticipantsView, members, groupAPI, notifications, util, gt) {

    'use strict';

    //
    // Edit/create view
    //

    var View = DisposableView.extend({

        className: 'administration-group-editor',

        initialize: function () {
            this.membersView = new members.View({ model: this.model, editable: true });
            this.original = this.model.toJSON();
        },

        renderAutoComplete: function () {

            var guid = _.uniqueId('input'),
                node = $('<div class="form-group has-feedback">').append(
                    $('<label>', { 'for': guid }).text(gt('Add member')),
                    $('<input type="text" class="form-control add-participant" tabindex="1">')
                        .attr('placeholder', gt('User name')),
                    // trick: use form-control-feedback to place icon within input field
                    $('<i class="fa fa-search form-control-feedback" style="color: #777">')
                ),
                autocomplete = new AddParticipantsView({ el: node });

            autocomplete.render({
                minLength: 1,
                autoselect: true,
                parentSelector: '.form-group',
                placement: 'bottom',
                top: 0,
                left: 0,
                contacts: false,
                distributionlists: false,
                groups: false,
                resources: false,
                users: true,
                split: false,
                stringify: function (obj) {
                    return util.getFullName(obj);
                },
                draw: function (obj) {
                    if (!_.isObject(obj)) return;
                    this.append(
                        $('<div>').html(util.getFullName(obj, true))
                    );
                }
            });

            autocomplete.on('select', this.onAddUser.bind(this));

            return node;
        },

        onAddUser: function (data) {
            if (!data.internal_userid) return;
            this.membersView.collection.add(data, { parse: true });
        },

        render: function () {

            var guid = _.uniqueId('input');

            this.$el.append(
                // name
                $('<div class="form-group">').append(
                    $('<label>', { 'for': guid }).text(gt('Group name')),
                    new common.InputView({ name: 'display_name', id: guid, model: this.model }).render().$el
                ),
                // auto-complete
                this.renderAutoComplete(),
                // members view
                $('<div class="form-group">').append(
                    $('<label>').text(gt('Members')),
                    this.membersView.render().$el
                )
            );

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
                        $('<h4>').text(edit ? gt('Edit group') : gt('Create group'))
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
