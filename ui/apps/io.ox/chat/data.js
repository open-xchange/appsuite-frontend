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

define('io.ox/chat/data', [
    'io.ox/core/extensions',
    'io.ox/chat/api',
    'io.ox/chat/events',
    'io.ox/chat/system-message',
    'io.ox/chat/util/average-color',
    'io.ox/contacts/api',
    'io.ox/switchboard/api',
    'io.ox/switchboard/presence',
    'io.ox/chat/util',
    'io.ox/core/http',
    'io.ox/core/notifications',
    'settings!io.ox/chat',
    'gettext!io.ox/chat'
], function (ext, api, events, systemMessage, averageColor, contactsApi, switchboardApi, presence, util, http, notifications, settings, gt) {

    'use strict';

    var DEFAULT_LIMIT = 40;

    var data = { };

    //
    // User
    //

    var BaseModel = Backbone.Model.extend({
        sync: function (method, model, options) {
            return api.getJwtFromSwitchboard().then(function (jwt) {
                options.headers = _.extend({ 'Authorization': 'Bearer ' + jwt }, options.headers);
                // inject xhr with upload handler
                var xhr = $.ajaxSettings.xhr();
                options.xhr = _.constant(xhr);
                if (xhr.upload && method === 'create') {
                    xhr.upload.addEventListener('progress', function (e) {
                        model.trigger('progress', (e.loaded / e.total * 100) >> 0);
                    }, false);
                    xhr.upload.addEventListener('error', function () {
                        model.trigger('progress', 0);
                    }, false);
                }
                var jqXHR = Backbone.Collection.prototype.sync.call(this, method, model, options);
                model.abort = function () {
                    jqXHR.abort();
                };
                return jqXHR.done(function done() {
                    model.abort = $.noop;
                });
            });
        }
    });

    var BaseCollection = Backbone.Collection.extend({
        sync: function () {
            return BaseModel.prototype.sync.apply(this, arguments);
        }
    });

    var UserSettings = BaseModel.extend({
        initialize: function () {
            this.initialized = new $.Deferred();
            this.on('change', this.onChange);
            this.listenTo(settings, 'change', function () {
                this.set(JSON.parse(settings.stringify()));
            }.bind(this));

            // collect some additional infos
            var userModel = data.users.getByMail(api.userId);
            this.set(_.extend({
                displayName: userModel.getName(),
                preferredLocale: ox.locale
            }, JSON.parse(settings.stringify())), { silent: true }).save(false);
        },

        url: api.url + '/user/settings',

        // trick Backbone to use a patch instead of post
        isNew: function () {
            return false;
        },

        onChange: _.throttle(function () {
            this.save();
        }, 5000),

        save: function (yell) {
            var changed = this.changedAttributes();
            if (Object.keys(changed).length === 0) return $.when();
            return BaseModel.prototype.save.call(this, changed, { patch: true }).catch(function (err) {
                if (yell === false) throw err;
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', gt('Could not save settings'));
                });
            });
        }
    });

    var UserModel = Backbone.Model.extend({

        idAttribute: 'email',

        isMyself: function () {
            return api.isMyself(this.id);
        },

        getShortName: function () {
            return this.get('first_name') || this.getName();
        },

        getName: function () {
            var first = this.get('first_name'), last = this.get('last_name');
            if (first && last) return first + ' ' + last;
            return first || last || this.getEmail() || '\u00a0';
        },

        getEmail: function () {
            return this.id;
        },

        isExternal: function () {
            return !this.get('internal');
        }
    });

    var UserCollection = Backbone.Collection.extend({

        model: UserModel,

        initialize: function () {
            this.initialized = new $.Deferred();
            this.once('reset', this.initialized.resolve);
        },

        // no memoize here to prevent pointing always to undefined
        getByMail: (function () {
            var cache = [];
            return function (email) {
                if (!cache[email]) cache[email] = this.get(email);
                if (!cache[email]) cache[email] = new UserModel({ email: email });
                return cache[email];
            };
        }()),

        getMyself: function () {
            return this.getByMail(api.userId);
        },

        getName: function (email) {
            return this.getByMail(email).getName();
        },

        getShortName: function (email) {
            return this.getByMail(email).getShortName();
        }
    });

    data.users = new UserCollection([]);

    data.users.addFromAddressbook = function (email, item, internal) {
        email = String(email || '').trim().toLowerCase();
        return new UserModel({
            email: email,
            first_name: String(item.first_name || '').trim(),
            last_name: String(item.last_name || '').trim(),
            nickname: String(item.nickname || '').trim(),
            image: !!item.image1_url,
            internal: !!internal
        });
    };

    data.fetchUsers = function () {
        return contactsApi.getAll({ folder: 6, columns: '1,20,501,502,515,524,555,556,557,606,607' }, false)
            .then(function (result) {
                return data.users.reset(
                    _(result)
                    .chain()
                    .map(function (item) {
                        return ['email1', 'email2', 'email3'].map(function (field) {
                            return item[field] && data.users.addFromAddressbook(item[field], item, field === 'email1');
                        });
                    })
                    .flatten()
                    .compact()
                    .value()
                );
            })
            .fail(function (err) {
                if (ox.debug) console.error(err);
            });
    };

    var MemberCollection = BaseCollection.extend({

        model: UserModel,

        initialize: function (models, options) {
            this.roomId = options.roomId;
        },

        url: function () {
            return api.url + '/rooms/' + this.roomId + '/members';
        },

        parse: function (array) {
            return _(array).map(function (item) {
                var user = data.users.getByMail(item.email);
                if (user) user = user.toJSON();
                return _.extend({ email: item.email }, item, user);
            });
        },

        toArray: function () {
            return this.pluck('id').sort();
        }

    });

    //
    // Message
    //

    var MessageModel = BaseModel.extend({

        idAttribute: 'messageId',

        urlRoot: function () {
            return api.url + '/rooms/' + this.get('roomId') + '/messages';
        },

        defaults: function () {
            return { content: '', sender: api.userId, date: +moment(), type: 'text' };
        },

        initialize: function () {
            var type = this.get('type');
            // using constants for immutable attributes
            this.isText = _.constant(type === 'text');
            this.isSystem = _.constant(type === 'system');
            this.isCommand = _.constant(type === 'command');
            this.isUser = _.constant(type === 'text' || type === 'file' || type === 'command');
            this.isMyself = _.constant(type !== 'system' && this.get('sender') === api.userId);
        },

        isDeleted: function () {
            return !!this.get('deleted');
        },

        isEdited: function () {
            return !!this.get('edited');
        },

        isEditable: function () {
            // currently, just "text", i.e. not system, not commands
            return this.isText() && !this.isDeleted() && !this.isUploading();
        },

        isUploading: function () {
            return !!this.get('uploading');
        },

        isFailed: function () {
            return this.get('deliveryState') === 'failed';
        },

        getContent: function () {
            return String(this.get('content') || '');
        },

        getFileUrl: function (file) {
            var room = data.chats.get(this.get('roomId')) || data.channels.get(this.get('roomId'));
            if (room && room.isChannel()) return api.url + '/rooms/channels/' + this.get('roomId') + '/files/' + file.fileId;
            return api.url + '/files/' + file.fileId;
        },

        getTime: function () {
            // use time when this message was last changed or when it was created
            return moment(this.get('edited') || this.get('date')).format('LT');
        },

        // returns either an uploaded file or a blob object that is currently uploaded
        // returns undefined if no file is available
        getFile: function () {

            var blob;
            if (this.get('uploading') && (blob = this.get('blob'))) {
                return {
                    blob: blob,
                    isBlob: true,
                    isImage: /^image\//.test(blob.type),
                    name: blob.name,
                    size: blob.size,
                    type: blob.type,
                    isAnimated: this.isAnimated()
                };
            }

            var file, url;
            if (this.get('file') && (file = this.get('file'))) {
                var room = data.chats.get(this.get('roomId')) || data.channels.get(this.get('roomId'));
                if (room && room.isChannel()) {
                    url = api.url + '/rooms/channels/' + this.get('roomId') + '/files/' + file.fileId;
                } else {
                    url = api.url + '/files/' + file.fileId;
                }

                return {
                    id: file.fileId,
                    isBlob: false,
                    isImage: !!file.preview,
                    preview: file.preview,
                    name: file.name,
                    size: file.size || 0,
                    thumbnail: url + '/thumbnail',
                    type: file.mimetype,
                    url: url,
                    isAnimated: this.isAnimated()
                };
            }
        },

        // only for gifs now, maybe expanded later idk
        isAnimated: function () {
            var file = this.get('uploading') ? this.get('blob') : this.get('file');
            if (!file) return false;
            return file.mimetype === 'image/gif' || file.type === 'image/gif';
        },

        isFile: function () {
            return !!this.get('file');
        },

        // checks if previous message is from a) same sender b) same date
        hasSameSender: function (limit) {
            limit = limit ? this.collection.length - limit : 0;
            var index = this.collection.indexOf(this);
            if (index <= limit) return false;
            var prev = this.collection.at(index - 1);
            if (prev.isSystem()) return false;
            // a) same sender?
            if (prev.get('sender') !== this.get('sender')) return false;
            // b) same date?
            return moment(this.get('date')).startOf('hour').isSame(moment(prev.get('date')).startOf('hour'));
        },

        getDeliveryState: function () {
            var state = this.get('deliveryState') || '';
            if (state === 'failed') return 'failed';
            return this.isMyself() ? util.getDeliveryStateClass(state) : state;
        },

        updateDelivery: function (state) {
            var room = data.chats.get(this.get('roomId'));
            if (room && room.isChannel() && !room.isMember()) return;
            var invisible = presence.getMyAvailability() === 'invisible';
            this.set('deliveryState', state);
            if (invisible) return;
            api.updateDelivery(this.get('roomId'), this.get('messageId'), state).catch(function () {
                this.set('deliveryState', this.previous('deliveryState'));
            }.bind(this));
        },

        setInitialDeliveryState: function () {
            var room = data.chats.get(this.get('roomId'));
            if (!room) return;
            if (this.get('sender') !== api.userId) return;

            if (room.get('type') === 'private') {
                if (this.get('deliveryState')) return;
                this.set('deliveryState', { state: 'server', modified: +moment() });
            } else if (room.get('type') === 'group') {
                var deliveryState = _.clone(this.get('deliveryState')) || {};
                room.members.forEach(function (member) {
                    if (member.get('email') === api.userId) return;
                    deliveryState[member.get('email')] = deliveryState[member.get('email')] || {
                        state: 'server',
                        modified: +moment()
                    };
                });
                this.set('deliveryState', deliveryState);
            }
        }
    });

    data.MessageModel = MessageModel;

    var MessageCollection = Backbone.Collection.extend({
        model: MessageModel,
        comparator: function (a, b) {
            if (!a.get('messageId')) return 0;
            if (!b.get('messageId')) return 0;
            return util.strings.compare(a.get('messageId'), b.get('messageId'));
        },
        initialize: function (models, options) {
            this.roomId = options.roomId;
            this.on('change:messageId', this.onChangeMessageId);
        },
        paginate: function (readDirection) {
            var id;
            if (readDirection === 'older') id = this.first().get('messageId');
            else if (readDirection === 'newer') id = this.last().get('messageId');

            return this.load({ messageId: id, readDirection: readDirection, limit: DEFAULT_LIMIT }, 'paginate');
        },
        load: function (params, type, cache) {
            if (!this.roomId) return;

            type = type || 'load';

            if (cache !== false && type === 'load' && this.length > 0) {
                if (params.readDirection === 'newer' && this.nextComplete) return $.when();
                if (!params.readDirection || params.readDirection === 'older' && this.prevComplete) return $.when();
            }

            this.trigger('before:' + type);

            // special handling for search
            if (type === 'load' && this.messageId) {
                params = { readDirection: 'both', messageId: this.messageId, limit: DEFAULT_LIMIT };
                delete this.messageId;
            }

            if (!params.messageId) {
                if (!this.nextComplete) params.limit = DEFAULT_LIMIT;
                this.nextComplete = true;
                this.trigger('complete:next');
            }

            // unjoined channels are not yet in the chats collection but we still allow previews, so check the channels collection too
            var endpoint = (data.chats.get(this.roomId) || data.channels.get(this.roomId)).isChannel() ? '/rooms/channels/' : '/rooms/';
            return api.request({
                url: api.url + endpoint + this.roomId + '/messages?' + $.param(params)
            })
            .then(function (list) {
                this.trigger(type);
                this.add(list, { parse: true });
                params.readDirection = params.readDirection || 'older';
                if (params.readDirection === 'both') {
                    var index = _(list).findIndex({ id: params.messageId });
                    if (index < params.limit / 2 - 1) {
                        this.prevComplete = true;
                        this.trigger('complete:prev');
                    }
                    if (index < list.length - params.limit / 2 - 1) {
                        this.nextComplete = true;
                        this.trigger('complete:next');
                    }
                } else {
                    var dir = params.readDirection === 'older' ? 'prev' : 'next';
                    this[dir + 'Complete'] = list.length < params.limit;
                    if (this[dir + 'Complete']) this.trigger('complete:' + dir);
                }
                this.trigger('after:all after:' + type);
            }.bind(this))
            .fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', gt('The messages could not be loaded.'));
                });
            });
        },
        getLast: function () {
            return this.models[this.models.length - 1];
        },
        onChangeMessageId: function (model) {
            var index = this.indexOf(model),
                next = this.at(index + 1);

            if (next && next.get('messageId') && util.strings.greaterThan(model.get('messageId'), next.get('messageId'))) {
                this.remove(model);
                this.add(model);
            }
        },
        findSimilar: function (obj) {
            // try to find via id
            var model = this.get(obj.messageId);
            if (model) return model;
            // try to find via clientSideMessageId
            if (api.isMyself(obj.sender) && obj.clientSideMessageId) {
                model = this.findWhere({ clientSideMessageId: obj.clientSideMessageId });
                if (model) return model;
            }
            // try to find a new one, with similar attributes
            return this.find(function (model) {
                if (!model.isNew()) return false;
                if (model.get('sender') !== obj.sender) return false;
                if (model.get('content') !== obj.content) return false;
                return true;
            });
        },
        sync: function (method, collection, options) {
            if (method === 'read') {
                var limit = Math.max(collection.length, DEFAULT_LIMIT);
                return this.load({ limit: limit }, 'load', options && options.cache);
            }
            return BaseCollection.prototype.sync.call(this, method, collection, options);
        },
        url: function () {
            return api.url + '/rooms/' + this.roomId + '/messages';
        },
        parse: function (array) {
            [].concat(array).forEach(function (item) {
                item.roomId = this.roomId;
            }.bind(this));
            return array;
        }
    });

    //
    // Chat
    //

    var ChatModel = Backbone.Model.extend({

        defaults: {
            active: false,
            favorite: false,
            type: 'group',
            unreadCount: 0
        },

        idAttribute: 'roomId',

        urlRoot: function () {
            return api.url + '/' + api.roomToEndpointMapping[this.get('type')];
        },

        initialize: function (attr) {

            attr = attr || {};

            // changes are done on model attribute "members"
            // those changes will be propagated to the collection
            // (in near future): it might be easier to just use one source of information
            this.members = new MemberCollection(this.mapMembers(attr.members), { parse: true, roomId: attr.roomId });
            this.messages = new MessageCollection([], { roomId: attr.roomId });

            // forward specific events
            this.listenTo(this.members, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('member:' + name);
            });
            this.listenTo(this.messages, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('message:' + name);
            });

            this.on('change:members', function () {
                this.members.set(this.mapMembers(this.get('members')), { parse: true, merge: true });
            });

            this.listenTo(this.messages, 'add', _.debounce(this.onMessageAdd, 10));
            this.listenTo(this.messages, 'change:content change:files', this.onMessageChange);
            this.listenTo(this.messages, 'change:deliveryState', _.debounce(this.onChangeDelivery, 0));

            this.sortName = this.getTitle().toLowerCase();
            this.on('change:members change:title', function () {
                this.sortName = this.getTitle().toLowerCase();
            });
        },

        onMessageAdd: function () {
            if (!this.messages.nextComplete) return;
            var lastMessage = this.messages.last();
            this.set('lastMessage', lastMessage.toJSON());
        },

        onMessageChange: function (message) {
            if (!this.get('lastMessage')) return;
            if (message.get('messageId') !== this.get('lastMessage').messageId) return;
            this.set('lastMessage', message.toJSON());
        },

        onChangeDelivery: function () {
            var message = this.messages.last();
            if (!message) return;
            if (message.getDeliveryState() === 'seen') this.set('unreadCount', 0);
        },

        mapMembers: function (members) {
            return _(members).map(function (role, member) {
                return { role: role, email: member };
            });
        },

        getTitle: function () {
            var members = _(this.members.reject(function (m) { return api.isMyself(m.get('email')); }));
            return this.get('title') || members.invoke('getName').sort().join('; ');
        },

        // returns unescaped text -- do NOT use with append() or html()
        getLastMessageText: function () {
            var last = this.get('lastMessage');
            if (!last) return '\u00a0';
            var message = new MessageModel(_.extend({ roomId: this.get('roomId') }, last));
            if (message.isSystem()) return _.stripTags(systemMessage.render(message));
            var file = message.getFile();
            if (file) return (file.isImage ? '📷' : '📄') + ' ' + file.name;
            var showSender = !message.isMyself() && !this.isPrivate() && !message.isSystem();
            var sender = showSender && data.users.getByMail(message.get('sender'));
            return (sender ? sender.getName() + ': ' : '') + message.get('content');
        },

        getLastMessageDate: function () {
            var last = this.get('lastMessage');
            if (!last || !last.date) return '\u00a0';
            var date = moment(last.date);
            return date.calendar(null, {
                sameDay: 'LT',
                lastDay: '[' + gt('Yesterday') + ']',
                lastWeek: 'L',
                sameElse: 'L'
            });
        },

        getLastMessageForUser: function (id) {
            // look for the last own, undeleted message
            var index = this.messages.findLastIndex(function (message) {
                return message.get('sender') === id && message.get('deleted') !== true;
            });
            if (!index) return;
            return this.messages.models[index];
        },

        getFirstMember: function () {
            // return first member that is not current user
            return this.members.find(function (member) {
                return !api.isMyself(member.get('email'));
            });
        },

        isMember: function (email) {
            email = email || api.userId;
            var members = this.get('members');
            return !!members && !!members[email];
        },

        isAdmin: function (email) {
            email = email || api.userId;
            var members = this.get('members');
            return members && members[email] === 'admin';
        },

        isCreator: function (email) {
            email = email || api.userId;
            return this.get('creator') === email;
        },

        // members is array of email addresses
        removeMembers: function (members) {
            var change = _.extend({}, this.get('members'));
            [].concat(members).forEach(function (email) {
                delete change[email];
            });
            this.set('members', change);
        },

        // members is key/value
        addMembers: function (members) {
            var change = _.extend({}, this.get('members'), members);
            // edge case, when current user has been readded to the group
            if (members[api.userId]) {
                this.fetch();
                this.trigger('change:iconId', { silent: true });
            }
            this.set('members', change);
        },

        getUnreadCount: function () {
            var count = this.get('unreadCount'),
                max = data.serverConfig.maxUnreadCount;
            if (count >= max) return (max - 1) + '+';
            return count;
        },

        parseSystemMessage: function (message) {
            var update = JSON.parse(message.data);
            switch (update.type) {
                case 'members:removed':
                    this.removeMembers(update.members);
                    break;
                case 'members:added':
                    this.addMembers(update.members);
                    break;
                case 'title:changed':
                    this.set('title', update.title);
                    break;
                case 'image:changed':
                    this.set({ iconId: update.iconId });
                    break;
                case 'chat:deleted':
                    this.set('members', {});
                    break;
                // no default
            }
        },

        getLastSenderName: function () {
            var lastMessage = this.get('lastMessage');
            if (!lastMessage) return '';
            var sender = lastMessage.sender || lastMessage.get('sender'),
                member = data.users.getByMail(sender);
            if (!member) return;
            return member.getName();
        },

        getIconUrl: function () {
            if (!this.get('iconId')) return;
            var endpoint = this.get('type') !== 'channel' ? '/rooms/groups/' : '/rooms/channels/';
            return api.url + endpoint + this.get('roomId') + '/icon/' + this.get('iconId');
        },

        isActive: function () { return !!this.get('active'); },
        isFavorite: function () { return !!this.get('favorite'); },
        isPrivate: function () { return this.get('type') === 'private'; },
        isGroup: function () { return this.get('type') === 'group'; },
        isChannel: function () { return this.get('type') === 'channel'; },

        handleError: function (response) {
            var errorCode = response.responseJSON ? response.responseJSON.errorCode : response.responseText;
            switch (errorCode) {
                case 'filesize:exceeded':
                    notifications.yell('error', gt('The uploaded file exceeds the size limit'));
                    break;
                case 'messagelength:exceeded':
                    notifications.yell('error', gt('The message length exceeds the limit and could not be delivered'));
                    break;
                case 'grouplength:exceeded':
                    notifications.yell('error', gt('The group could not be saved since the name exceeds the length limit'));
                    break;
                case 'title:duplicate':
                    notifications.yell('error', gt('A channel with the same name already exists'));
                    break;
                case 'groupname:empty':
                    notifications.yell('error', gt('The group could not be saved since the name can not be empty'));
                    break;
                default:
                    notifications.yell('error', gt('Something went wrong. Please try again.'));
                    break;
            }
        },

        // just locally; not posting the message
        addLocalMessage: function (type, content, data) {
            data = _.isString(data) ? data : JSON.stringify(data || {});
            this.messages.add({ type: type || 'system', content: content || '', data: data }, { merge: true, parse: true });
        },

        postMessage: (function () {

            var lastDeferred = $.when();
            var meIfYouCan = _.constant($.when());

            return function postMessage(attr, file) {

                var consumed = false, consume = function () { consumed = true; };
                // set this here such that message previews can identify the sender, but this will be ignored by the server
                attr.sender = api.userId;
                events.trigger('message:post', { attr: attr, room: this, consume: consume });
                if (consumed) return lastDeferred;

                // this identifier is not stored on the server but part of the response and part of websocket push events to uniquely identify the send message
                attr.clientSideMessageId = Math.random().toString(16).slice(2);

                // add message now (so that we have an instant feedback even if a previous upload is still in progress)
                var modelData = file ? _.extend({ uploading: true, blob: file, type: 'file' }, attr) : attr;
                var model = this.messages.add(modelData, { merge: true, parse: true });

                lastDeferred = lastDeferred.then(function () {
                    return storeMessage.call(this, attr, file, model).catch(meIfYouCan);
                }.bind(this));

                return lastDeferred;
            };

            function storeMessage(attr, file, model) {

                attr.roomId = this.get('roomId');

                // get average color for images client-side
                return file && /^image\//.test(file.type) ? averageColor.fromBlob(file).then(save.bind(this)) : save.call(this);

                function save(color) {

                    // for debugging; you need this very often when working on pre-post message appearance
                    if (ox.debug) {
                        if (window.upload === false) return $.when().then(_.wait(5000));
                        if (window.fail) {
                            model.set('deliveryState', 'failed').trigger('progress', 0);
                            return $.Deferred().reject();
                        }
                    }

                    if (color) attr.averageColor = color;
                    var formData = new FormData();
                    formData.append('json', JSON.stringify(attr));
                    if (file) formData.append('file', file);

                    // model for files will be added to cache and this.messages via sockets message:new event. So no need to do it in the callback here. Temporary model is fine;
                    return model.save(attr, {
                        data: formData,
                        processData: false,
                        contentType: false
                    })
                    .then(
                        function success() {
                            model.setInitialDeliveryState();
                            model.set('uploading', false);
                            this.set('active', true);
                        }.bind(this),
                        function fail(response) {
                            // ignore "abort" by the user
                            if (response.statusText === 'abort') return;
                            this.handleError(response);
                            model.set('deliveryState', 'failed').trigger('progress', 0);
                        }.bind(this)
                    );
                }
            }

        }()),

        toggleRecent: function () {
            var self = this;
            return api.setRoomState(this.get('roomId'), !self.get('active')).then(function () {
                self.set('active', !self.get('active'));
            }).fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    if (self.get('active')) yell('error', gt('The chat could not be hidden. Please try again.'));
                    else yell('error', gt('The chat could not be reactivated. Please try again.'));
                });
            });
        },

        toggleFavorite: function () {
            return api.setFavorite(this.get('roomId'), !this.isFavorite()).then(function () {
                this.set('favorite', !this.isFavorite());
            }.bind(this));
        },

        sync: function (method, model, options) {
            if (method === 'create' || method === 'update') {
                var data = _(method === 'create' ? model.attributes : model.changed).pick('title', 'type', 'members', 'description', 'pimReference'),
                    hiddenAttr = options.hiddenAttr;

                options.data = JSON.stringify(_.extend(data, hiddenAttr));
                options.processData = false;
                options.contentType = 'application/json';
                options.method = method === 'create' ? 'POST' : 'PATCH';
            }

            return BaseModel.prototype.sync.call(this, method, model, options).then(function (data) {
                if (method === 'create') this.messages.roomId = this.get('roomId');
                return data;
            }.bind(this));
        }
    });

    data.ChatModel = ChatModel;

    var ChatCollection = BaseCollection.extend({

        model: ChatModel,

        url: function () {
            return api.url + '/rooms';
        },

        initialize: function () {
            this.on('change:unreadCount', this.onChangeUnreadCount);
            this.initialized = new $.Deferred();
            this.once('sync', this.initialized.resolve);
            this.setComparator(settings.get('sortBy', 'activity'));
            this.listenTo(settings, 'change:sortBy', function (value) {
                this.setComparator(value);
            });
        },

        setComparator: function (sortBy) {
            this.comparator = sortBy === 'alphabetical' ? this.sortByTitle : this.sortByLastMessage;
            this.sort();
        },

        sortByTitle: function (a, b) {
            return a.sortName > b.sortName ? +1 : -1;
        },

        sortByLastMessage: function (a, b) {
            if (!a || !b) return 0;
            a = a.get('lastMessage');
            b = b.get('lastMessage');
            return -util.strings.compare(a.date, b.date);
        },

        onChangeUnreadCount: function () {
            this.trigger('unseen', this.reduce(function (sum, model) {
                if (!model.isActive()) return sum;
                return sum + model.get('unreadCount');
            }, 0));
        },

        getActive: function () {
            return this.filter({ active: true });
        },

        fetchUnlessExists: function (roomId) {
            var model = this.get(roomId);
            if (model) return $.when(model);
            return api.getChannelByType('all', roomId)
                .then(function (data) { return this.add(data); }.bind(this))
                .fail(function () {
                    require(['io.ox/core/yell'], function (yell) {
                        yell('error', gt('The chat could not be loaded.'));
                    });
                });
        },

        joinChannel: function (roomId) {
            var model = this.get(roomId);
            if (!model || !model.isChannel()) return;

            var members = _.clone(model.get('members')) || {};
            members[api.userId] = 'member';
            model.set({ active: true, members: members });
            data.chats.add(model);

            return api.joinChannel(roomId);
        },

        leaveChannel: function (roomId) {
            var room = this.get(roomId);
            return api.leaveRoom(room)
                .then(function () {
                    room.set('active', false);
                    room.removeMembers(api.userId);
                    room.messages.reset();
                })
                .fail(function () {
                    require(['io.ox/core/yell'], function (yell) {
                        yell('error', gt('The channel could not be left.'));
                    });
                });
        },

        leaveGroup: function (roomId) {
            var room = this.get(roomId);
            return api.leaveRoom(room)
                .fail(function () {
                    require(['io.ox/core/yell'], function (yell) {
                        yell('error', gt('The group could not be left.'));
                    });
                });
        },

        findPrivateRoom: function (email) {
            return this.find(function (room) {
                if (!room.isPrivate()) return false;
                if (!room.get('members')[email]) return;
                return true;
            });
        },

        findByReference: function (type, id) {
            return this.find(function (room) {
                var reference = room.get('pimReference');
                if (!reference) return;
                if (reference.type !== type) return;
                if (reference.id !== id) return;
                return true;
            });
        }
    });

    var ChannelCollection = ChatCollection.extend({
        url: function () {
            return api.url + '/rooms/channels';
        },
        setComparator: function () {
            this.comparator = this.sortByTitle;
            this.sort();
        }
    });

    data.chats = new ChatCollection();
    data.channels = new ChannelCollection();

    //
    // Files
    //

    var FileModel = Backbone.Model.extend({

        idAttribute: 'fileId',

        getThumbnailUrl: function () {
            return api.url + '/files/' + this.get('fileId') + '/thumbnail';
        },

        getFileUrl: function () {
            return api.url + '/files/' + this.get('fileId');
        },

        isImage: function () {
            return this.get('file') ? /(jpg|jpeg|gif|bmp|png)/i.test(this.get('file').mimetype) : /(jpg|jpeg|gif|bmp|png)/i.test(this.get('mimetype'));
        }
    });


    var FilesCollection = BaseCollection.extend({
        model: FileModel,
        url: function () { return api.url + '/files'; }
    });

    data.files = new FilesCollection();

    var RoomFile = FileModel.extend({
        getThumbnailUrl: function () {
            var roomId = this.collection.roomId,
                room = data.chats.get(roomId) || data.channels.get(roomId),
                isChannel = room && room.isChannel();
            if (isChannel) return api.url + '/rooms/channels/' + roomId + '/files/' + this.get('fileId') + 'thumbnail';
            return api.url + '/files/' + this.get('fileId') + '/thumbnail';
        },

        getFileUrl: function () {
            var roomId = this.collection.roomId,
                room = data.chats.get(roomId) || data.channels.get(roomId),
                isChannel = room && room.isChannel();
            if (isChannel) return api.url + '/rooms/channels/' + roomId + '/files/' + this.get('fileId');
            return api.url + '/files/' + this.get('fileId');
        }
    });

    var RoomFilesCollection = FilesCollection.extend({

        model: RoomFile,

        initialize: function (models, opt) {
            this.roomId = opt.roomId;
            this.initialized = new $.Deferred();
            this.once('sync', this.initialized.resolve);
        },

        url: function () {
            var room = data.chats.get(this.roomId) || data.channels.get(this.roomId),
                isChannel = room && room.isChannel();
            if (isChannel) return api.url + '/rooms/channels/' + this.roomId + '/files';
            return api.url + '/rooms/' + this.roomId + '/files';
        }

    });

    data.RoomFilesCollection = RoomFilesCollection;

    //
    // Session Model
    //

    var SessionModel = Backbone.Model.extend({

        initialize: function () {
            this.initialized = new $.Deferred();

            // wait until initialized. listeners need data.user to be filled
            var self = this;
            this.initialized.done(function () {
                self.connectSocket(switchboardApi.socket);
            });
        },

        refresh: function () {
            $.when.apply($,
                _([data.channels])
                    .map(function (collection) {
                        collection.expired = true;
                        collection.trigger('expire');
                        if (collection.expired) return collection.reset();
                        return collection.fetch();
                    })
            ).then(function () {
                var chats = data.chats.chain().union(data.channels).unique().value();
                chats.forEach(function (model) {
                    if (model.messages.length === 0) return;
                    var prevLast = model.previous('lastMessage') || {},
                        last = model.get('lastMessage') || {};
                    if (prevLast.messageId === last.messageId) return;

                    model.messages.expired = true;
                    // views which use the messages-collection can prevent the expiry by listening to the expire event
                    model.messages.trigger('expire');
                    if (model.messages.expired) model.messages.reset();
                    else model.messages.fetch({ cache: false });
                });
            });
        },

        connectSocket: function (socket) {
            if (this.socket) this.refresh();
            this.socket = socket;

            socket.on('reconnect', this.refresh);

            socket.on('chat:delivery:update', function (obj) {
                var roomId = obj.roomId,
                    messageId = obj.messageId,
                    userId = obj.userId,
                    modified = obj.modified,
                    state = obj.state,
                    room = data.chats.get(roomId);

                function process(message) {

                    if (util.strings.greaterThan(message.get('messageId'), messageId)) return;
                    if (message.isMyself() !== (userId !== api.userId)) return;

                    var deliveryState = message.get('deliveryState') || {},
                        prevState = (deliveryState[userId] || {}).state || deliveryState.state || message.get('deliveryState');

                    if (prevState === 'seen') return;
                    if (prevState === 'received' && state === 'server') return;
                    if (prevState === state) return;

                    var changes;
                    if (!message.isMyself()) changes = state;
                    else if (room.get('type') === 'private') changes = { state: state, modified: modified };
                    else {
                        changes = _.clone(deliveryState);
                        changes[userId] = { state: state, modified: modified };
                    }
                    message.set('deliveryState', changes);
                }

                if (room) room.messages.forEach(process);
            });

            socket.on('chat:message:new', function (attr) {
                var roomId = attr.roomId,
                    message = attr.message,
                    mySelf = api.isMyself(message.sender);

                // stop typing
                events.trigger('typing:' + roomId, message.sender, false);
                // fetch room unless it's already known
                data.chats.fetchUnlessExists(roomId).done(function (model) {
                    // add new message to room
                    message.roomId = roomId;
                    var newMessage = model.messages.findSimilar(message) || new MessageModel(message);

                    if (model.messages.nextComplete) {
                        model.messages.add(newMessage);
                    } else model.set('lastMessage', _.extend({}, model.get('lastMessage'), newMessage.toJSON()));

                    if (!mySelf) {
                        model.set({ unreadCount: model.get('unreadCount') + 1 });
                    }

                    if (model.get('type') !== 'channel' && !mySelf) {
                        newMessage.updateDelivery('received');
                    }

                    if (newMessage.get('type') === 'system') model.parseSystemMessage(message, roomId);

                    events.trigger('message:new', { message: newMessage, room: model });
                });
            });

            socket.on('chat:typing', function (event) {
                if (!event.roomId) return;
                event.state = event.state === true || event.state === 'true';
                events.trigger('typing', event);
                events.trigger('typing:' + event.roomId, event.email, event.state);
            });

            socket.on('chat:message:changed', function (obj) {
                var message = obj.message,
                    roomId = obj.roomId;
                data.chats.fetchUnlessExists(roomId).done(function (room) {
                    var messageModel = room.messages.get(message.messageId);
                    if (messageModel) {
                        messageModel.set(message);
                    } else if (room.get('lastMessage').messageId === message.messageId) {
                        room.set('lastMessage', _.extend({}, room.get('lastMessage'), message));
                    }
                });
            });

            socket.on('chat:chat:deleted', function (message) {
                var roomId = message.roomId;
                data.chats.remove(roomId);
                data.channels.remove(roomId);
            });

            socket.on('disconnect', function () {
                events.trigger('socket:disconnected');
            });
            socket.on('error', function () {
                if (socket.connected) return;
                events.trigger('socket:disconnected');
            });
            socket.on('connect', function () {
                events.trigger('socket:connected');
            });
            socket.on('reconnect', function () {
                events.trigger('socket:connected');
            });
        },

        waitForMessage: function () {
            var def = new $.Deferred();
            function listener(event) {
                if (event.origin !== api.origin) return;
                def.resolve(event.data);
                window.removeEventListener('message', listener);
            }
            window.addEventListener('message', listener, false);
            return def;
        },

        getUserId: function () {
            return api.getUserId().then(function (user) {
                data.user = user;
                data.userSettings = new UserSettings(user.settings);
                data.serverConfig = user.config || {};
                this.set('userId', api.userId);
                this.initialized.resolve();
            }.bind(this))
            .fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', gt('An error occurred. Please try again.'));
                });
            });
        }
    });

    data.session = new SessionModel();

    // temp. hack to pass "data" to system-message (this whole structure needs a clean up)
    systemMessage.pass(data);

    ox.on('refresh^', function () {
        data.session.refresh();
    });

    return data;
});
