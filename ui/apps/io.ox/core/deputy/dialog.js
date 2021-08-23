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
    'io.ox/participants/add',
    'io.ox/contacts/util',
    'gettext!io.ox/core',
    'less!io.ox/core/deputy/style'
], function (ModalDialog, DisposableView, AddParticipantView, util, gt) {

    'use strict';

    var deputyListView = DisposableView.extend({

        events: {
            'click .remove': 'removeDeputy'
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
            var contact = deputy,
                name = util.getFullName(contact.attributes, false),
                initials = util.getInitials(contact.attributes),
                initialsColor = util.getInitialsColor(initials),
                contactPicture = contact.get('image1_url') ? $('<i class="contact-picture" aria-hidden="true">').css('background-image', 'url(' + util.getImage(contact.attributes) + ')')
                    : $('<div class="contact-picture initials" aria-hidden="true">').text(initials).addClass(initialsColor);


            this.$el.append(
                $('<li>').attr('data-id', contact.get('id')).append(
                    $('<div class="flex-item">').append(
                        contactPicture,
                        $('<div class="data-container">').append(
                            $('<div class="name">').text(name),
                            $('<div class="permissions">').text('darf alles')
                        )
                    ),
                    $('<div class="flex-item">').append(
                        $('<button class="btn btn-link edit">').text(gt('Edit')),
                        $('<button class="btn btn-link remove">').attr('data-id', deputy.get('id')).append($.icon('fa-times', gt('Remove')))
                    )
                )
            );
        },
        removeDeputy: function (e) {
            e.stopPropagation();
            this.collection.remove(e.currentTarget.getAttribute('data-id'));
        }
    });

    function openDialog() {
        new ModalDialog({
            point: 'io.ox/core/deputy/dialog',
            title: gt('Manage deputies')
        })
        .build(function () {
            this.deputyListView = new deputyListView();
            this.$body.append(new AddParticipantView({
                apiOptions: {
                    users: true
                },
                placeholder: gt('Add people'),
                collection: this.deputyListView.collection,
                scrollIntoView: true
            }).render().$el,
            this.deputyListView.render().$el);
        })
        .addButton({ className: 'btn-primary', label: gt('close'), action: 'cancel' })
        .open();
    }

    return {
        open: openDialog
    };
});
