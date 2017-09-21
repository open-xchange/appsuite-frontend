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

        users: [
            { id: 1, name: 'Mattes', state: 'online' },
            { id: 2, name: 'Alex', state: 'online' },
            { id: 3, name: 'David', state: 'absent' },
            { id: 4, name: 'Julian', state: 'busy' },
            { id: 5, name: 'Someone with a really long name', state: 'offline' }
        ],

        // CHATS

        chats: [
            {
                id: 1,
                type: 'group',
                title: 'Appointment: Status Meeting on Friday',
                members: [1, 2, 3, 4],
                messages: [
                    { id: 1, body: 'Julian has joined', type: 'system', sender: 0, time: '12:00' },
                    { id: 2, body: 'Hi Jessica, just want to know if you will attend the meeting?', sender: 1, time: '12:05', delivery: 'seen' },
                    { id: 3, body: 'Hi John, yes I will! I hope I can join on time.', sender: 2, time: '12:08' },
                    { id: 4, body: 'I will be 5 minutes late due to travelling 🚗🚗🚗', sender: 3, time: '12:09' },
                    { id: 5, body: 'Ok fine 👍', unseen: true, sender: 1, time: '12:10', delivery: 'seen' }
                ],
                unseen: 1
            },
            {
                id: 2,
                type: 'private',
                title: 'Alex',
                members: [2, 1],
                messages: [
                    { id: 1, body: 'Can we handle images?', sender: 1, time: '14:33', delivery: 'seen' },
                    { id: 2, body: 'Yep ...', sender: 2, time: '14:34' },
                    { id: 3, body: 'https://c2.staticflickr.com/6/5826/23795571972_60c5321fbe.jpg', type: 'image', sender: 2, time: '14:35' },
                    { id: 4, body: '👍', sender: 1, time: '14:36', delivery: 'seen' }
                ],
                unseen: 0
            },
            {
                id: 3,
                type: 'group',
                title: 'Lorem ipsum',
                members: [1, 2, 3, 4],
                messages: [
                    { id: 1, body: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.', sender: 1, time: '11:01', delivery: 'seen' },
                    { id: 2, body: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.', sender: 2, time: '11:11' },
                    { id: 3, body: 'And a link http://www.open-xchange.com 👍', sender: 2, time: '11:12' }
                ],
                unseen: 0
            },
            {
                id: 4,
                type: 'channel',
                title: 'Another chat with a really long name so that it needs to be cut',
                members: [1, 2, 3, 4, 5],
                messages: [
                    { id: 1, body: 'Hello World', sender: 2, time: '13:37' }
                ],
                unseen: 0
            }
        ],

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

    data.backbone = {};

    // User

    var UserModel = Backbone.Model.extend({});
    var UserCollection = Backbone.Collection.extend({ model: UserModel });
    data.backbone.users = new UserCollection(data.users);

    // Message

    var MessageModel = Backbone.Model.extend({

        defaults: function () {
            return { body: '', sender: 0, time: moment().format('LT') };
        },

        getBody: function () {
            if (this.get('type') === 'image') {
                return '<img src="' + this.get('body') + '" alt="">';
            }
            return _.escape(this.get('body')).replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
        },

        isMyself: function () {
            return this.get('sender') === 1;
        },

        hasSameSender: function () {
            var index = this.collection.indexOf(this);
            if (index <= 0) return false;
            return this.collection.at(index - 1).get('sender') === this.get('sender');
        }
    });

    var MessageCollection = Backbone.Collection.extend({ model: MessageModel });

    // Chat

    var ChatModel = Backbone.Model.extend({

        defaults: { type: 'group', title: 'New conversation', unseen: 0 },

        initialize: function (attr) {
            this.set('modified', +moment());
            this.unset('members', { silent: true });
            this.unset('messages', { silent: true });
            var members = _(attr.members).map(function (arg) {
                return arg instanceof UserModel ? arg : data.backbone.users.get(arg);
            });
            this.members = new Backbone.Collection(members);
            this.messages = new MessageCollection(attr.messages);
            // forward specific events
            this.listenTo(this.members, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('member:' + name);
            });
            this.listenTo(this.messages, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('message:' + name);
                if (name === 'add') this.onMessageAdd();
            });
        },

        onMessageAdd: function () {
            this.set('modified', +moment());
        }
    });

    var ChatCollection = Backbone.Collection.extend({

        model: ChatModel,
        comparator: 'modified',

        initialize: function () {
            this.on('change:unseen', this.onChangeUnseen);
        },

        onChangeUnseen: function () {
            this.trigger('unseen', this.reduce(function (sum, model) {
                return sum + (model.get('unseen') > 0 ? 1 : 0);
            }, 0));
        }
    });

    data.backbone.chats = new ChatCollection(data.chats);

    return data;
});
