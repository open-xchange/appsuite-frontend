/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/main', [
    'io.ox/backbone/views/window',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'less!io.ox/chat/style'
], function (WindowView, contactsAPI, contactsUtil) {

    'use strict';

    var Window = WindowView.extend({

        events: {
            'click [data-cmd]': 'onCommand'
        },

        onCommand: function (e) {
            e.preventDefault();
            var node = $(e.currentTarget), cmd = node.attr('data-cmd');
            switch (cmd) {
                case 'start-chat': this.startChat(); break;
                case 'show-chat': this.showChat(node.attr('data-chat-id')); break;
                case 'show-recent-conversations': this.showRecentConversations(); break;
                case 'show-channels': this.showChannels(); break;
                case 'show-all-files': this.showAllFiles(); break;
                default: console.log('Unknown command', cmd); break;
            }
        },

        startChat: function () {
            console.log('Start chat');
        },

        showChat: function (id) {
            console.log('show chat', id);
            window.$rightside.empty().append(renderChat(id));
        },

        showRecentConversations: function () {
            console.log('Show recent conversiontions');
            window.$rightside.empty();
        },

        showChannels: function () {
            console.log('Show channels');
            window.$rightside.empty();
        },

        showAllFiles: function () {
            console.log('Show all files');
            window.$rightside.empty();
        }
    });

    var window = new Window({ title: 'OX Chat' }).open(),
        user = ox.rampup.user;

    //
    // Static data
    //

    var data = {

        // USERS

        users: {
            1: { id: 1, name: 'Mattes', state: 'online' },
            2: { id: 2, name: 'Alex', state: 'online' },
            3: { id: 3, name: 'David', state: 'absent' },
            4: { id: 4, name: 'Julian', state: 'busy' }
        },

        // CHATS

        chats: {
            1: {
                type: 'group',
                title: 'Appointment: Status Meeting on Friday',
                members: [{ type: 'user', id: 1 }, { type: 'user', id: 2 }, { type: 'user', id: 3 }, { type: 'user', id: 4 }],
                messages: [
                    { body: 'Hi Jessica, just want to know if you will attend the meeting?', sender: 1, time: '12:05' },
                    { body: 'Hi John, yes I will! I hope I can join on time.', sender: 2, time: '12:08' },
                    { body: 'I will be 5 minutes late due to travelling 🚗🚗🚗', sender: 3, time: '12:09' },
                    { body: 'Ok fine 👍', unseen: true, sender: 1, time: '12:10' }
                ],
                unseen: 1
            },
            2: {
                type: 'chat',
                title: 'Another chat with a really long name so that it needs to be cut',
                members: [{ type: 'user', id: 1 }, { type: 'user', id: 2 }],
                messages: []
            },
            3: {
                type: 'group',
                title: 'Maybe a group chat',
                members: [{ type: 'user', id: 1 }, { type: 'user', id: 2 }, { type: 'user', id: 3 }, { type: 'user', id: 4 }],
                messages: [
                    { body: 'Hello World', sender: 1, time: '11:01' }
                ]
            },
            4: {
                type: 'channel',
                title: 'This could be a channel',
                members: [{ type: 'user', id: 1 }, { type: 'user', id: 2 }, { type: 'user', id: 3 }, { type: 'user', id: 4 }],
                messages: [
                    { body: 'Hello World', sender: 2, time: '13:37' }
                ]
            }
        }
    };

    // start with BAD style and hard-code stuff

    window.$body.addClass('ox-chat').append(
        $('<div class="leftside abs">').append(
            $('<div class="header">').append(
                contactsAPI.pictureHalo(
                    $('<div class="picture" aria-hidden="true">'), user, { width: 40, height: 40 }
                ),
                $('<i class="fa state online fa-check-circle">'),
                $('<div class="name">').text(contactsUtil.getFullName(user))
            ),
            $('<div class="search">').append(
                $('<input type="text" spellcheck="false" autocomplete="false" placeholder="Search chat or contact">')
            ),
            $('<div class="left-navigation abs">').append(
                $('<div class="chats">').append(
                    _(data.chats).map(function (chat, id) {
                        return $('<button type="button" class="btn-nav" data-cmd="show-chat">')
                        .attr('data-chat-id', id)
                        .append(
                            $('<i class="fa fa-comment-o">'),
                            $('<span class="label label-default">').text(chat.unseen),
                            $('<div class="title">').toggleClass('unseen', chat.unseen > 0).text(chat.title)
                        );
                    })
                ),
                $('<div class="navigation">').append(
                    $('<button type="button" class="btn-nav" data-cmd="show-recent-conversations">').append(
                        $('<i class="fa fa-clock-o">'),
                        $.txt('Recent conversations')
                    ),
                    $('<button type="button" class="btn-nav" data-cmd="show-channels">').append(
                        $('<i class="fa fa-hashtag">'),
                        $.txt('All channels')
                    ),
                    $('<button type="button" class="btn-nav" data-cmd="show-all-files">').append(
                        $('<i class="fa fa-paperclip">'),
                        $.txt('All files')
                    )
                )
            )
        ),
        window.$rightside = $('<div class="rightside abs">').append(
            $('<div class="start-chat abs">').append(
                $('<button type="button" class="btn btn-default" data-cmd="start-chat">').append(
                    $('<i class="fa fa-plus">'),
                    $('<br>'),
                    $.txt('Start new chat')
                )
            )
        )
    );

    function renderChat(id) {
        var chat = data.chats[id];
        return !chat ? $() : $('<div class="chat">').append(
            $('<div class="header abs">').append(
                $('<h2>').append(chat.title),
                $('<ul class="members">').append(
                    _(chat.members).map(function (member) {
                        return $('<li class="member">').append(
                            renderMemberState(member),
                            $.txt(getUserName(member.id))
                        );
                    })
                )
            ),
            $('<div class="conversation abs">').append(
                _(chat.messages).map(function (message) {
                    return $('<div class="message">')
                        .toggleClass('myself', isMyself(message.sender))
                        .append(
                            $('<div class="sender">').text(getUserName(message.sender)),
                            $('<div class="body">').text(message.body),
                            $('<div class="time">').text(message.time)
                        );
                })
            ),
            $('<div class="controls abs">').append(
                $('<textarea class="form-control" placeholder="Enter message here">')
            )
        );
    }

    function getUserName(id) {
        return data.users[id].name;
    }

    function isMyself(id) {
        return id === 1;
    }

    function renderMemberState(member) {
        var state = data.users[member.id].state;
        return renderState(state);
    }

    function renderState(state) {
        return $('<span class="fa state">').addClass(state);
    }

});
