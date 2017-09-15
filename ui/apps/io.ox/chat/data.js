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

define('io.ox/chat/data', [], function () {

    'use strict';

    // Static data

    var data = {

        // USERS

        users: {
            1: { id: 1, name: 'Mattes', state: 'online' },
            2: { id: 2, name: 'Alex', state: 'online' },
            3: { id: 3, name: 'David', state: 'absent' },
            4: { id: 4, name: 'Julian', state: 'busy' },
            5: { id: 5, name: 'Someone with a really long name', state: 'online' }
        },

        // CHATS

        chats: {
            1: {
                id: 1,
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
                id: 2,
                type: 'private',
                title: 'Alex',
                members: [{ type: 'user', id: 1 }, { type: 'user', id: 2 }],
                messages: [
                    { body: 'Can we handle images?', sender: 1, time: '14:33' },
                    { body: 'Yep ...', sender: 2, time: '14:34' },
                    { body: 'https://c2.staticflickr.com/6/5826/23795571972_60c5321fbe.jpg', type: 'image', sender: 2, time: '14:35' },
                    { body: '👍', sender: 1, time: '14:36' }
                ]
            },
            3: {
                id: 3,
                type: 'group',
                title: 'Lorem ipsum',
                members: [{ type: 'user', id: 1 }, { type: 'user', id: 2 }, { type: 'user', id: 3 }, { type: 'user', id: 4 }],
                messages: [
                    { body: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.', sender: 1, time: '11:01' },
                    { body: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.', sender: 2, time: '11:11' },
                    { body: 'And a link http://www.open-xchange.com 👍', sender: 2, time: '11:12' }
                ]
            },
            4: {
                id: 4,
                type: 'channel',
                title: 'Another chat with a really long name so that it needs to be cut',
                members: [{ type: 'user', id: 1 }, { type: 'user', id: 2 }, { type: 'user', id: 3 }, { type: 'user', id: 4 }, { type: 'user', id: 5 }],
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

    // Backbone

    var MessageModel = Backbone.Model.extend({

        getBody: function () {
            if (this.get('type') === 'image') {
                return '<img src="' + this.get('body') + '" alt="">';
            }
            return _.escape(this.get('body')).replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
        },

        isMyself: function () {
            return this.get('sender') === 1;
        }
    });

    var MessageCollection = Backbone.Collection.extend({ model: MessageModel });

    var ChatModel = Backbone.Model.extend({

        defaults: { type: 'group', title: 'New conversation' },

        initialize: function (attr) {
            this.unset('members', { silent: true });
            this.unset('messages', { silent: true });
            this.members = new Backbone.Collection(attr.members);
            this.messages = new MessageCollection(attr.messages);
            // forward specific events
            this.listenTo(this.members, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('member:' + name);
            });
            this.listenTo(this.messages, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('message:' + name);
            });
        }
    });

    var ChatCollection = Backbone.Collection.extend({ model: ChatModel });

    data.backbone = {
        chats: new ChatCollection()
    };

    _(data.chats).each(function (chat) {
        data.backbone.chats.add(chat);
    });

    return data;
});
