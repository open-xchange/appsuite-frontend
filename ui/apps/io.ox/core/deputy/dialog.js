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

define('io.ox/core/deputy/dialog', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/mini-views',
    'io.ox/participants/add',
    'io.ox/contacts/util',
    'io.ox/core/api/user',
    'gettext!io.ox/core',
    'less!io.ox/core/deputy/style'
], function (ModalDialog, DisposableView, mini, AddParticipantView, util, userApi, gt) {

    'use strict';

    // permissions given to newly added deputies
    var defaultPermissions = {
            'sendOnBehalf': true,
            'modulePermissions': {
                'mail': {
                    'permission': 7564567657,
                    'folderIds': [
                        'default0/INBOX'
                    ]
                },
                'calendar': {
                    'permission': 3452345345,
                    'folderIds': [
                        '32'
                    ]
                }
            }
        },
        mockdata =  [{
            'deputyId': 'dc5b3fbbee434035a94a7c949721cb77',
            'user': 395,
            'sendOnBehalf': true,
            'modulePermissions': {
                'mail': {
                    'permission': 7564567657,
                    'folderIds': [
                        'default0/INBOX'
                    ]
                },
                'calendar': {
                    'permission': 3452345345,
                    'folderIds': [
                        '32'
                    ]
                }
            }
        }];

    function openEditDialog(model) {
        var prevValues = {
            sendOnBehalf: model.get('sendOnBehalf'),
            modulePermissions: model.get('modulePermissions')
        };

        new ModalDialog({
            //#. %1$s name of the deputy
            title: gt('Deputy: %1$s', util.getFullName(model.get('userData').attributes, false))
        })
        .build(function () {
            this.$body.append(
                $('<div>').text(gt('The deputy has the following permissions')),
                $('<div class="select-container">').append(
                    $('<label for="inbox-deputy-selector">').text(gt('Inbox')),
                    new mini.SelectView({ id: 'inbox-deputy-selector', name: 'inbox-role', model: model, list: [] }).render().$el
                ),
                new mini.CustomCheckboxView({ id: 'send-on-behalf-checkbox', name: 'sendOnBehalf', label: gt('Deputy can send Emails on your behalf'), model: model }).render().$el,
                $('<div class="select-container">').append(
                    $('<label for="inbox-deputy-selector">').text(gt('Calendar')),
                    new mini.SelectView({ id: 'calendar-deputy-selector', name: 'calendar-role', model: model, list: [] }).render().$el
                )
            ).addClass('deputy-permissions-dialog');
        })
        .addCancelButton()
        .addButton({ className: 'btn-primary', label: gt('save'), action: 'save' })
        .on('cancel', function () {
            // cancel on a model that was not saved means we should remove it from the list
            if (model.get('deputyId') === undefined) {
                model.collection.remove(model);
                return;
            }
            model.set(prevValues);
        })
        .on('save', function () {
            console.log('do totaly funky api stuff');
        })
        .open();
    }

    var deputyListView = DisposableView.extend({

        events: {
            'click .remove': 'removeDeputy',
            'click .edit': 'showPermissions'
        },

        tagName: 'ul',
        className: 'deputy-list-view list-unstyled',

        initialize: function (options) {
            options = options || {};
            this.collection = new Backbone.Collection(options.deputies);
            this.collection.on('add reset remove', this.render.bind(this));
        },
        render: function () {
            console.log('render', this);
            this.$el.empty();

            if (this.collection.length === 0) this.$el.append($('<div class="empty-message">').append(gt('You have currently no deputies assigned.') + '<br/>' + gt('Deputies can get acces to your Inbox and Calendar.')));

            this.collection.each(this.renderDeputy.bind(this));
            return this;
        },
        renderDeputy: function (deputy) {
            var user = deputy.get('userData'),
                name = util.getFullName(user.attributes, false),
                initials = util.getInitials(user.attributes),
                initialsColor = util.getInitialsColor(initials),
                userPicture = user.get('image1_url') ? $('<i class="user-picture" aria-hidden="true">').css('background-image', 'url(' + util.getImage(user.attributes) + ')')
                    : $('<div class="user-picture initials" aria-hidden="true">').text(initials).addClass(initialsColor);


            this.$el.append(
                $('<li>').attr('data-id', user.get('id')).append(
                    $('<div class="flex-item">').append(
                        userPicture,
                        $('<div class="data-container">').append(
                            $('<div class="name">').text(name),
                            $('<div class="permissions">').text('darf alles')
                        )
                    ),
                    $('<div class="flex-item">').append(
                        $('<button class="btn btn-link edit">').attr('data-cid', deputy.cid).text(gt('Edit')),
                        $('<button class="btn btn-link remove">').attr('data-cid', deputy.cid).append($.icon('fa-times', gt('Remove')))
                    )
                )
            );
        },
        removeDeputy: function (e) {
            e.stopPropagation();
            this.collection.remove(e.currentTarget.getAttribute('data-cid'));
        },
        showPermissions: function (e) {
            var model = this.collection.get(e.currentTarget.getAttribute('data-cid'));
            if (!model) return;

            openEditDialog(model);
        }
    });

    function openDialog() {
        new ModalDialog({
            point: 'io.ox/core/deputy/dialog',
            title: gt('Manage deputies')
        })
        .build(function () {
            var self = this,
                // collection to store userdata
                userCollection = new Backbone.Collection();

            this.$body.busy();
            $.when(mockdata).then(function (deputies) {
                var defs = _(deputies).map(function (deputy) {
                    return userApi.get({ id: deputy.user }).then(function (data) {
                        userCollection.add(data);
                        deputy.userData = userCollection.get(data);
                        console.log('userdata added');
                    });
                });

                $.when.apply($, defs).then(function () {
                    console.log('draw');
                    self.$body.idle();
                    // since this is async modal dialog may think the body is empty and adds this class
                    self.$el.removeClass('compact');
                    self.deputyListView = new deputyListView({ deputies: deputies });
                    self.$body.append(
                        new AddParticipantView({
                            apiOptions: {
                                users: true
                            },
                            placeholder: gt('Add people'),
                            collection: userCollection,
                            scrollIntoView: true
                        }).render().$el,
                        self.deputyListView.render().$el
                    );

                    userCollection.on('add', function (user) {
                        var deputy = _.extend({}, defaultPermissions, { user: user.get('id'), userData: user }),
                            model = self.deputyListView.collection.add(deputy);

                        openEditDialog(model);
                    });

                    // deputy removed? remove from user collection as well
                    self.deputyListView.collection.on('remove', function (deputy) {
                        userCollection.remove(deputy.get('user'));
                    });
                });
            });
        })
        .addButton({ className: 'btn-primary', label: gt('close'), action: 'cancel' })
        .open();
    }

    return {
        open: openDialog
    };
});
