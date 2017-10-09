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

define('io.ox/chat/data', ['io.ox/contacts/api', 'static/3rd.party/socket.io.slim.js'], function (api, io) {

    'use strict';

    var data = {
        user_id: parseInt(_.url.hash('user_id'), 10) || ox.user_id
    };

    //
    // User
    //

    var UserModel = Backbone.Model.extend({

        isSystem: function () {
            return this.get('id') === 0;
        },

        isMyself: function () {
            return this.get('id') === data.user_id;
        },

        getName: function () {
            var first = $.trim(this.get('first_name')), last = $.trim(this.get('last_name'));
            if (first && last) return last + ', ' + first;
            return first || last || '\u00a0';
        }
    });

    var UserCollection = Backbone.Collection.extend({ model: UserModel });
    data.users = new UserCollection([]);

    data.fetchUsers = function () {
        return api.getAll({ folder: 6, columns: '501,502,524,570' }, false).then(function (result) {
            result = _(result).map(function (item) {
                return {
                    id: item.internal_userid,
                    first_name: item.first_name,
                    last_name: item.last_name,
                    image: !!item['570'],
                    state: 'online'
                };
            });
            return data.users.reset(result);
        });
    };

    //
    // Message
    //

    var MessageModel = Backbone.Model.extend({

        defaults: function () {
            return { body: '', senderId: data.user_id, sent: +moment(), type: 'text' };
        },

        getBody: function () {
            if (this.get('type') === 'image') {
                return '<img src="' + this.get('body') + '" alt="">';
            }
            return _.escape(this.get('body')).replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
        },

        getTime: function () {
            return moment(this.get('sent')).format('LT');
        },

        getTextBody: function () {
            return _.escape(this.get('body'));
        },

        isSystem: function () {
            return this.get('senderId') === 0;
        },

        isMyself: function () {
            return this.get('senderId') === data.user_id;
        },

        hasSameSender: function () {
            var index = this.collection.indexOf(this);
            if (index <= 0) return false;
            return this.collection.at(index - 1).get('senderId') === this.get('senderId');
        }
    });

    var MessageCollection = Backbone.Collection.extend({
        model: MessageModel,
        initialize: function (models, options) {
            this.roomId = options.roomId;
        },
        url: function () {
            return 'http://localhost:2337/api/' + data.user_id + '/rooms/' + this.roomId + '/messages';
        }
    });

    //
    // Chat
    //

    var ChatModel = Backbone.Model.extend({

        defaults: { active: true, type: 'group', unseen: 0 },

        initialize: function (attr) {
            this.set('modified', +moment());
            this.unset('members', { silent: true });
            this.unset('messages', { silent: true });
            var members = _(attr.members).map(function (arg) {
                return arg instanceof UserModel ? arg : data.users.get(arg);
            });
            this.members = new UserCollection(members);
            this.messages = new MessageCollection([], { roomId: attr.id });
            // forward specific events
            this.listenTo(this.members, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('member:' + name);
            });
            this.listenTo(this.messages, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('message:' + name);
            });
        },

        getTitle: function () {
            return this.get('title') || _(this.members.reject({ id: data.user_id })).invoke('getName').sort().join('; ');
        },

        getLastMessage: function () {
            var last = this.get('lastMessage');
            return last ? new MessageModel(last).getTextBody() : '\u00a0';
        },

        getLastMessageDate: function () {
            var last = this.get('lastMessage');
            return last ? moment(new MessageModel(last).get('sent')).format('LT') : '\u00a0';
        },

        isActive: function () {
            return this.get('active');
        },

        postMessage: function (attr) {
            this.messages.add(attr).save();
            this.set('modified', +moment());
        }
    });

    var ChatCollection = Backbone.Collection.extend({

        model: ChatModel,
        comparator: 'modified',

        url: function () {
            return 'http://localhost:2337/api/' + data.user_id + '/rooms';
        },

        initialize: function () {
            this.on('change:unseen', this.onChangeUnseen);
        },

        create: function (attr) {
            var collection = this,
                data = { active: true, members: attr.members, title: '', type: attr.type || 'group' };
            return $.post(this.url(), data).done(function (data) {
                collection.add(data);
            });
        },

        onChangeUnseen: function () {
            this.trigger('unseen', this.reduce(function (sum, model) {
                return sum + (model.get('unseen') > 0 ? 1 : 0);
            }, 0));
        },

        getActive: function () {
            return this.filter({ active: true });
        },

        getHistory: function () {
            return this.filter({ active: false, joined: true }).slice(0, 100);
        },

        getChannels: function () {
            return this.filter({ type: 'channel' });
        },

        getChannelsUnjoined: function () {
            return this.filter({ type: 'channel', joined: false });
        }
    });

    data.chats = new ChatCollection();

    //
    // Files
    //

    var FileModel = Backbone.Model.extend({

        getThumbnailUrl: function () {
            return 'http://localhost:2337/api/' + data.user_id + '/files/' + this.get('id') + '/thumbnail';
        },

        getPreviewUrl: function () {
            return 'http://localhost:2337/api/' + data.user_id + '/files/' + this.get('id') + '/thumbnail';
        }
    });


    var FilesCollection = Backbone.Collection.extend({

        model: FileModel,

        url: function () {
            return 'http://localhost:2337/api/' + data.user_id + '/files';
        }
    });

    data.files = new FilesCollection();

    //
    // Socket support
    //

    var socket = data.socket = io.connect('//localhost:2337', { query: 'userId=' + data.user_id });

    socket.on('alive', function () {
        console.log('Connected socket to server');
    });

    socket.on('message:change', function (roomId, id, changes) {
        var collection = data.chats.get(roomId);
        if (!collection) return;
        var message = collection.messages.get(id);
        if (message) message.set(changes);
    });

    socket.on('message:new', function (roomId, message) {
        var model = data.chats.get(roomId);
        if (!model) return;
        model.messages.add(message);
        model.set({ modified: +moment(), unseen: model.get('unseen') + 1 });
    });

    return data;
});
