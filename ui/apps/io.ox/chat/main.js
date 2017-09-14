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
            'click [data-cmd]': 'onCommand',
            'keydown textarea': 'onEditorKeydown'
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
            window.$rightside.empty().append(renderChat(id));
        },

        showRecentConversations: function () {
            window.$rightside.empty().append(renderRecentConversations());
        },

        showChannels: function () {
            window.$rightside.empty().append(renderChannels());
        },

        showAllFiles: function () {
            window.$rightside.empty().append(renderFiles());
        },

        onEditorKeydown: function (e) {
            if (e.which !== 13) return;
            e.preventDefault();
            var editor = $(e.currentTarget);
            this.$('.conversation').append(
                renderMessage({ sender: 1, body: editor.val(), time: moment().format('LT') })
            );
            editor.val('').focus();
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
        },

        // Channels

        channels: [
            { id: 1, title: 'Office Olpe', description: 'Everything related to the office in Olpe', members: 52 },
            { id: 2, title: 'Office Cologne', description: 'Everything related to the office in Cologne', members: 11 },
            { id: 3, title: 'Engineering', description: 'App Suite Core Engineering', members: 71 }
        ],

        // Files

        files: [
            // need better more colorful images
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Amanhecer_no_Hercules_--.jpg/640px-Amanhecer_no_Hercules_--.jpg' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Anfiteatro%2C_Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-01%2C_DD_165.JPG/640px-Anfiteatro%2C_Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-01%2C_DD_165.JPG' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Benkoka_Sabah_Jetty-at-Dataran-Benkoka-Pitas-01.jpg/640px-Benkoka_Sabah_Jetty-at-Dataran-Benkoka-Pitas-01.jpg' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/D%C3%BClmen%2C_Wildpark_--_2014_--_3830.jpg/640px-D%C3%BClmen%2C_Wildpark_--_2014_--_3830.jpg' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/M%C3%BCnster%2C_Park_Sentmaring_--_2015_--_9925.jpg/600px-M%C3%BCnster%2C_Park_Sentmaring_--_2015_--_9925.jpg' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/D%C3%BClmen%2C_Naturschutzgebiet_-Am_Enteborn-_--_2014_--_0202.jpg/640px-D%C3%BClmen%2C_Naturschutzgebiet_-Am_Enteborn-_--_2014_--_0202.jpg' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Wuppertal_Nordpark_0004.jpg/640px-Wuppertal_Nordpark_0004.jpg' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Haltern_am_See%2C_Sythen%2C_WASAG_--_2015_--_8424.jpg/640px-Haltern_am_See%2C_Sythen%2C_WASAG_--_2015_--_8424.jpg' },
            // beach
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Mare_in_Marina_di_Pisa.jpg/640px-Mare_in_Marina_di_Pisa.jpg' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Naked_Island.jpg/640px-Naked_Island.jpg' },
            { name: 'foo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Oahu_0076.jpg/640px-Oahu_0076.jpg' }
        ]
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
            $('<div class="scrollpane abs">').append(
                $('<div class="conversation ">').append(
                    _(chat.messages).map(renderMessage)
                )
            ),
            $('<div class="controls abs">').append(
                $('<textarea class="form-control" placeholder="Enter message here">')
            )
        );
    }

    function renderMessage(message) {
        return $('<div class="message">')
            .toggleClass('myself', isMyself(message.sender))
            .append(
                $('<div class="sender">').text(getUserName(message.sender)),
                $('<div class="body">').text(message.body),
                $('<div class="time">').text(message.time),
                $('<div class="fa state seen">')
            );
    }

    function renderRecentConversations() {
        return $('<div class="history abs">').append(
            $('<div class="header abs">').append(
                $('<h2>').append('Recent conversations')
            ),
            $('<div class="scrollpane abs">').append(
                $('<ul>').append(
                    _(data.history).map(function (chat) {
                        return $('<li>').text(chat.title);
                    })
                )
            )
        );
    }

    function renderChannels() {
        return $('<div class="channels abs">').append(
            $('<div class="header abs">').append(
                $('<h2>').append('All channels')
            ),
            $('<div class="scrollpane abs">').append(
                $('<ul>').append(
                    _(data.channels).map(function (channel) {
                        return $('<li class="channel">').append(
                            $('<div>').append(
                                $('<span class="title">').text(channel.title),
                                $('<span class="members">').text(channel.members + ' member(s)')
                            ),
                            $('<div class="description">').text(channel.description),
                            $('<button type="button" class="btn btn-default join">').text('Join')
                        );
                    })
                )
            )
        );
    }

    function renderFiles() {
        return $('<div class="files abs">').append(
            $('<div class="header abs">').append(
                $('<h2>').append('All files')
            ),
            $('<div class="scrollpane abs">').append(
                $('<ul>').append(
                    _(data.files).map(function (file) {
                        return $('<li>').css('backgroundImage', 'url(' + file.url + ')');
                    })
                )
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
