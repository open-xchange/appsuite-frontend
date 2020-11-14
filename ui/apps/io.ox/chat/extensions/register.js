/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/extensions/register', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/capabilities',
    'io.ox/chat/data',
    'io.ox/core/api/account',
    'gettext!io.ox/chat'
], function (ext, actionsUtil, capabilities, data, account, gt) {

    'use strict';

    var Action = actionsUtil.Action;

    //
    // Topbar
    //

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'chat',
        index: 125,
        draw: function () {
            if (!capabilities.has('chat') || _.device('smartphone')) return;

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
                        require(['io.ox/chat/events'], function (events) {
                            events.trigger('cmd', { cmd: 'show-chat', id: room.get('roomId') });
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
            var users = baton.data.filter(function (user) {
                return user.internal_userid !== ox.user_id;
            });
            if (users.length === 1) {
                var user = _(users).first();
                startPrivateChat(user.email1 || user.email2 || user.email3);
                return;
            }
            startGroupChat({
                members: users.map(function (user) {
                    return user.email1 || user.email2 || user.email3;
                })
            });
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
                        require(['io.ox/chat/events'], function (events) {
                            events.trigger('cmd', { cmd: 'show-chat', id: room.get('roomId') });
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
            startGroupChat({
                title: baton.model.get('summary'),
                description: baton.model.get('description'),
                members: _(baton.model.get('attendees')).pluck('email'),
                reference: { type: 'appointment', id: baton.model.get('id') }
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
            var field = account.is('sent|drafts', baton.data.folder_id) ? baton.data.to : baton.data.from;
            startPrivateChat(field[0][1]);
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
                addresses = _(addresses).chain().map(function (address) {
                    return address[1];
                }).compact().unique().without(data.user.email).value();
                startGroupChat({
                    title: mail.subject,
                    members: addresses
                });
            });
        }
    });

    function startPrivateChat(email) {
        require(['io.ox/chat/events'], function (events) {
            events.trigger('cmd', { cmd: 'open-private-chat', email: email });
        });
    }

    function startGroupChat(opt) {
        var def = opt.reference && data.chats.findByReference(opt.reference.type, opt.reference.id) || $.Deferred().reject();
        def.then(function (room) {
            return require(['io.ox/chat/events']).then(function (events) {
                events.trigger('cmd', { cmd: 'show-chat', id: room.get('roomId') });
            });
        }).catch(function () {
            return require(['io.ox/chat/actions/openGroupDialog', 'io.ox/chat/events']).then(function (openGroupDialog, events) {
                openGroupDialog(opt).then(function (id) {
                    events.trigger('cmd', { cmd: 'show-chat', id: id });
                });
            });
        });
    }

    // Settings
    ext.point('io.ox/settings/pane/main').extend({
        id: 'chat',
        title: gt('Chat'),
        ref: 'io.ox/chat',
        index: 120
    });

});
