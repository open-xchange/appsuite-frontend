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

define('io.ox/chat/extensions/register', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/capabilities',
    'io.ox/chat/data',
    'io.ox/chat/api',
    'io.ox/chat/client',
    'io.ox/core/api/account',
    'gettext!io.ox/chat'
], function (ext, actionsUtil, capabilities, data, api, client, account, gt) {

    'use strict';

    if (_.device('smartphone || !maintab')) return;

    var Action = actionsUtil.Action;

    //
    // Topbar
    //

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'chat',
        index: 125,
        draw: function () {

            var node = $('<li role="presentation" class="launcher">').hide();
            this.append(node);

            require(['io.ox/chat/views/launcher'], function (ChatIcon) {
                node.show().append(new ChatIcon().render().$el);
            });
        }
    });

    ext.point('io.ox/core/appcontrol/right/dropdown').extend({
        id: 'chat/controller',
        index: 10,
        extend: function () {
            var set = this.$ul.find('[data-controller="chat"]').hide();
            data.session.initialized.then(function () {
                set.show();
            });
        }
    });

    //
    // Contacts
    //

    ext.point('io.ox/contacts/links/inline').extend({
        id: 'start-chat',
        index: 450,
        prio: 'hi',
        mobile: 'hi',
        title: gt('Start chat'),
        ref: 'io.ox/chat/actions/start-chat-from-contacts'
    });

    ext.point('io.ox/contacts/detail/content').extend({
        id: 'chat',
        index: 500,
        draw: function (baton) {
            if (baton.data.created_by === ox.user_id) return;
            var isHalo = !baton.app || baton.app.id !== 'io.ox/contacts', node;
            this.append(
                node = $('<section class="block" data-block="chat">').append(
                    $('<h4>').text(gt('Recent chat messages')).addClass(isHalo ? 'widget-title clear-title' : ''),
                    $('<div class="ox-chat embedded">'),
                    $('<button class="btn btn-default open-chat">').text(gt('Open chat'))
                ).hide()
            );

            data.chats.initialized.then(function success() {
                var room = data.chats.findPrivateRoom(baton.data.email1);
                if (!room) throw new Error();

                room.messages.fetch();
                return require(['io.ox/chat/views/messages']).then(function (MessagesView) {
                    node.find('button').on('click', function () {
                        require(['io.ox/chat/client'], function (client) {
                            client.openChatById(room.get('roomId'));
                        });
                    });
                    node.show().find('.ox-chat').append(
                        new MessagesView({
                            room: room,
                            collection: room.messages,
                            limit: 10,
                            markAsRead: false,
                            hideActions: true,
                            filter: function (model) {
                                return !model.isSystem();
                            }
                        }).render().$el
                    );
                });
            }).catch(function fail() {
                node.remove();
            });
        }
    });

    //
    // Halo
    //

    ext.point('io.ox/contacts/toolbar/links').extend({
        id: 'start-chat',
        index: 350,
        prio: 'hi',
        mobile: 'hi',
        title: gt('Start chat'),
        ref: 'io.ox/chat/actions/start-chat-from-contacts'
    });

    new Action('io.ox/chat/actions/start-chat-from-contacts', {
        capabilities: 'chat',
        collection: 'some',
        every: 'email1 || email2 || email3',
        matches: function (baton) {
            return baton.data.length > 1 || baton.data[0].internal_userid !== ox.user_id;
        },
        action: function (baton) {
            var members = baton.data
                .filter(function (contact) {
                    return contact.internal_userid !== ox.user_id;
                })
                .map(function (contact) {
                    return contact.email || contact.email1 || contact.email2 || contact.email3;
                });
            client.openChat({ members: members });
        }
    });

    //
    // Calendar
    //

    ext.point('io.ox/calendar/links/inline').extend({
        index: 650,
        prio: 'lo',
        mobile: 'lo',
        id: 'start-chat',
        section: 'participants',
        sectionTitle: gt('Participant related actions'),
        title: gt('Start chat with participants'),
        ref: 'io.ox/chat/actions/start-chat-from-appointment'
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 750,
        id: 'chat',
        draw: function (baton) {
            var $fieldset = $('<fieldset class="details">').hide().append(
                $('<legend class="io-ox-label">').append(
                    $('<h2>').text(gt('Recent chat messages'))
                ),
                $('<div class="ox-chat embedded">'),
                $('<button class="btn btn-default open-chat">').text(gt('Open chat'))
            );
            this.append($fieldset);

            data.chats.initialized.then(function success() {
                var room = data.chats.findByReference('appointment', baton.model.get('id'));
                if (!room) throw new Error();
                room.messages.fetch();
                return require(['io.ox/chat/views/messages']).then(function (MessagesView) {
                    $fieldset.find('button').on('click', function () {
                        require(['io.ox/chat/client'], function (client) {
                            client.openChatById(room.get('roomId'));
                        });
                    });
                    $fieldset.show().find('.ox-chat').append(
                        new MessagesView({
                            room: room,
                            collection: room.messages,
                            limit: 10,
                            markAsRead: false,
                            hideActions: true,
                            filter: function (model) {
                                return !model.isSystem();
                            }
                        }).render().$el
                    );
                });
            }, function fail() {
                $fieldset.remove();
            });
        }
    });

    new Action('io.ox/chat/actions/start-chat-from-appointment', {
        capabilities: 'chat',
        collection: 'some',
        requires: function () {
            return !!data.user;
        },
        action: function (baton) {
            var model = baton.model;
            client.openChat({
                title: model.get('summary'),
                description: model.get('description'),
                members: _(model.get('attendees')).pluck('email'),
                pimReference: { type: 'appointment', id: model.get('id') }
            });
        }
    });

    //
    // Mail
    //

    ext.point('io.ox/mail/links/inline').extend({
        id: 'start-chat',
        index: 450,
        prio: 'hi',
        mobile: 'lo',
        title: gt('Reply via chat'),
        ref: 'io.ox/chat/actions/start-chat-from-mail',
        section: 'standard'
    });

    ext.point('io.ox/mail/links/inline').extend({
        id: 'start-group-chat',
        index: 450,
        prio: 'hi',
        mobile: 'lo',
        title: gt('Reply all via chat'),
        ref: 'io.ox/chat/actions/start-group-chat-from-mail',
        section: 'standard'
    });

    new Action('io.ox/chat/actions/start-chat-from-mail', {
        capabilities: 'chat',
        collection: 'some',
        requires: function () {
            return !!data.user;
        },
        action: function (baton) {
            var addresses = account.is('sent|drafts', baton.data.folder_id) ? baton.data.to : baton.data.from;
            if (!addresses.length) return;
            client.openChat({ members: _(addresses).pluck('1') });
        }
    });

    new Action('io.ox/chat/actions/start-group-chat-from-mail', {
        capabilities: 'chat',
        collection: 'some',
        requires: function () {
            return !!data.user;
        },
        action: function (baton) {
            require(['io.ox/mail/api']).then(function (api) {
                return api.get(_.cid(baton.data));
            }).then(function (mail) {
                var addresses = [].concat(mail.from, mail.to, mail.cc, mail.bcc);
                var members = _(addresses)
                    .chain()
                    .pluck('1')
                    .compact()
                    .unique()
                    .without(api.userId)
                    .value();
                client.openChat({ members: members, title: mail.subject });
            });
        }
    });

    // Settings
    ext.point('io.ox/settings/pane/main').extend({
        id: 'io.ox/chat',
        title: gt('Chat'),
        ref: 'io.ox/chat',
        index: 120
    });

});
