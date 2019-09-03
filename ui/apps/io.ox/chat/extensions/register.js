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
    'io.ox/chat/data'
], function (ext, actionsUtil, data) {

    'use strict';

    var Action = actionsUtil.Action;

    //
    // Contacts / Halo
    //

    ext.point('io.ox/contacts/links/inline').extend({
        id: 'start-chat',
        index: 450,
        prio: 'hi',
        mobile: 'hi',
        title: 'Start chat',
        ref: 'io.ox/chat/actions/start-chat-from-contacts'
    });

    ext.point('io.ox/contacts/toolbar/links').extend({
        id: 'start-chat',
        index: 350,
        prio: 'hi',
        mobile: 'hi',
        title: 'Start chat',
        ref: 'io.ox/chat/actions/start-chat-from-contacts'
    });

    new Action('io.ox/chat/actions/start-chat-from-contacts', {
        capabilities: 'chat',
        collection: 'some',
        matches: function (baton) {
            return baton.data.length !== 1 || baton.data[0].internal_userid !== ox.user_id;
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
        sectionTitle: 'Participant related actions',
        title: 'Start chat with participants',
        ref: 'io.ox/chat/actions/start-chat-from-appointment'
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 900,
        id: 'chat',
        draw: function (baton) {
            var $fieldset = $('<fieldset class="details ox-chat">').hide().append(
                $('<legend class="io-ox-label">').append(
                    $('<h2>').text('Recent chat messages')
                )
            );
            this.append($fieldset);
            data.chats.initialized.then(function () {
                var reference = 'calendar//' + baton.model.get('id'),
                    room = data.chats.findWhere({ reference: reference });
                if (!room) return $fieldset.remove();
                room.messages.fetch();
                return require(['io.ox/chat/views/messages']).then(function (MessagesView) {
                    $fieldset.append(
                        new MessagesView({ collection: room.messages, limit: 5 }).render().$el
                    ).show();
                });
            });
        }
    });

    new Action('io.ox/chat/actions/start-chat-from-appointment', {
        capabilities: 'chat',
        collection: 'some',
        action: function (baton) {
            startGroupChat({
                title: baton.model.get('summary'),
                description: baton.model.get('description'),
                members: _(baton.model.get('attendees')).pluck('email'),
                reference: 'calendar//' + baton.model.get('id')
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
        title: 'Reply via chat',
        ref: 'io.ox/chat/actions/start-chat-from-mail',
        section: 'standard'
    });

    ext.point('io.ox/mail/links/inline').extend({
        id: 'start-group-chat',
        index: 450,
        prio: 'hi',
        mobile: 'lo',
        title: 'Reply all via chat',
        ref: 'io.ox/chat/actions/start-group-chat-from-mail',
        section: 'standard'
    });

    ext.point('io.ox/mail/detail').extend({
        id: 'reference-to-group-chat',
        index: 450,
        draw: (function () {
            function cont($section, baton) {
                if (baton.data.headers) return draw($section, baton.model);
                baton.view.listenToOnce(baton.model, 'change:headers', draw.bind(null, $section, baton.model));
            }

            function draw($section, model) {
                var reference = (model.get('headers') || {})['Message-ID'] || model.cid,
                    room = data.chats.findWhere({ reference: 'mail//' + reference });
                if (!room) return;

                $section.empty().show().css('background-color', '#FFF176').append(
                    $('<div class="alert alert-error warnings">').append(
                        'There is already a chat associated with this email',
                        $('<button class="btn btn-link" data-cmd="show-chat">').attr('data-id', room.get('id')).append(
                            $('<i class="fa fa-external-link">')
                        ).click(function () {
                            require(['io.ox/chat/events'], function (events) {
                                events.trigger('cmd', { cmd: 'show-chat', id: room.get('id') });
                            });
                        })
                    )
                );
            }

            return function (baton) {
                var $section = $('<section>');
                this.append($section.hide());

                data.chats.initialized.then(cont.bind(null, $section, baton));
                baton.view.listenTo(data.chats, 'add', draw.bind(null, $section, baton.model));
            };
        }())
    });

    new Action('io.ox/chat/actions/start-chat-from-mail', {
        capabilities: 'chat',
        collection: 'some',
        action: function (baton) {
            var from = baton.data.from[0][1];
            startPrivateChat(from);
        }
    });

    new Action('io.ox/chat/actions/start-group-chat-from-mail', {
        capabilities: 'chat',
        collection: 'some',
        action: function (baton) {
            if (!data.user) return console.log('Please authenticate in chat first');

            require(['io.ox/mail/api']).then(function (api) {
                return api.get(_.cid(baton.data));
            }).then(function (mail) {
                var reference = mail.headers['Message-ID'] || mail.cid,
                    addresses = [].concat(mail.from, mail.to, mail.cc, mail.bcc);

                addresses = _(addresses).chain().map(function (address) {
                    return address[1];
                }).compact().unique().without(data.user.email).value();

                startGroupChat({
                    title: mail.subject,
                    members: addresses,
                    reference: 'mail//' + reference
                });
            });
        }
    });

    function startPrivateChat(user, reference) {
        var room = data.chats.find(function (model) {
            if (model.get('type') !== 'private') return false;
            return !!_(model.get('members')).findWhere({ email: user });
        });
        $.when(room || data.chats.addAsync({ type: 'private', members: [user] })).then(function (chat) {
            require(['io.ox/chat/events'], function (events) {
                events.trigger('cmd', { cmd: 'show-chat', id: chat.get('id'), reference: reference });
            });
        });
    }

    function startGroupChat(data) {
        require(['io.ox/chat/actions/openGroupDialog', 'io.ox/chat/events'], function (openGroupDialog, events) {
            openGroupDialog(data).then(function (id) {
                events.trigger('cmd', { cmd: 'show-chat', id: id });
            });
        });
    }

});
