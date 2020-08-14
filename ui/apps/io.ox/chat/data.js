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

define('io.ox/chat/data', [
    'io.ox/chat/events',
    'io.ox/contacts/api',
    'static/3rd.party/socket.io.slim.js',
    'io.ox/mail/sanitizer',
    'io.ox/chat/util',
    'io.ox/core/http'
], function (events, api, io, sanitizer, util, http) {

    'use strict';

    var chatHost =  _.url.hash('chatHost') || ox.serverConfig.chatHost,
        DEFAULT_LIMIT = 40;

    var data = {
        API_ROOT: 'https://' + chatHost + '/api',
        SOCKET: 'https://' + chatHost
    };

    //
    // User
    //

    var UserModel = Backbone.Model.extend({

        isSystem: function () {
            return this.get('id') === 0;
        },

        isMyself: function () {
            var user = data.users.getByMail(data.user.email);
            return this === user;
        },

        getName: function () {
            var first = $.trim(this.get('first_name')), last = $.trim(this.get('last_name'));
            if (first && last) return first + ' ' + last;
            return first || last || this.get('email') || this.getEmail() || '\u00a0';
        },

        getEmail: function () {
            return this.get('email1') || this.get('email2') || this.get('email3');
        },

        getState: function () {
            return this.get('state') || 'offline';
        },

        setState: function (state) {
            $.ajax({
                method: 'POST',
                url: data.API_ROOT + '/users/state/' + state,
                xhrFields: { withCredentials: true }
            }).then(function () {
                this.set('state', state);
            }.bind(this));
        },

        fetchState: function () {
            if (this.has('state')) return;
            $.ajax({
                url: data.API_ROOT + '/users/' + this.getEmail() + '/state',
                xhrFields: { withCredentials: true }
            }).done(function (state) { this.set('state', state); }.bind(this));
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
                if (!cache[email]) {
                    cache[email] = this.find(function (model) {
                        return model.get('email1') === email || model.get('email2') === email || model.get('email3') === email;
                    });
                }
                return cache[email];
            };
        }())

    });
    data.users = new UserCollection([]);

    data.fetchUsers = function () {
        return api.getAll({ folder: 6, columns: '1,20,501,502,524,555,556,557,606' }, false).then(function (result) {
            result = _(result).map(function (item) {
                return _.extend({
                    cid: _.cid(item),
                    id: item.internal_userid,
                    first_name: item.first_name,
                    last_name: item.last_name,
                    image: !!item.image1_url
                }, _(item).pick('email1', 'email2', 'email3'));
            });
            return data.users.reset(result);
        });
    };

    var MemberCollection = Backbone.Collection.extend({

        model: UserModel,

        initialize: function (models, options) {
            this.roomId = options.roomId;
        },

        url: function () {
            return data.API_ROOT + '/rooms/' + this.roomId + '/members';
        },

        parse: function (array) {
            return _(array).map(function (item) {
                var user = data.users.getByMail(item.email);
                if (user) user = user.toJSON();
                return _.extend({ email1: item.email }, item, user);
            });
        },

        toArray: function () {
            return this.pluck('id').sort();
        },

        sync: function (method, model, options) {
            options.xhrFields = _.extend({}, options.xhrFields, { withCredentials: true });
            return Backbone.Collection.prototype.sync.call(this, method, model, options);
        }

    });

    //
    // Message
    //

    var MessageModel = Backbone.Model.extend({

        defaults: function () {
            return { content: '', sender: data.user.email, date: +moment(), type: 'text' };
        },

        idAttribute: 'messageId',

        getBody: function () {
            if (this.isSystem()) return this.getSystemMessage();
            else if (this.hasPreview()) return this.getFilesPreview();
            else if (this.isFile()) return this.getFileText();
            return this.getFormattedBody();
        },

        getFormattedBody: function () {
            return _.escape(this.get('content')).replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
        },

        getSystemMessage: function () {
            var event = JSON.parse(this.get('content'));
            var originator = this.get('sender'),
                members = event.members;

            if (data.chats.getCurrent() && data.chats.getCurrent().get('type') === 'channel' && event.type === 'members:added') event.type = 'channel:joined';
            if (data.chats.getCurrent() && data.chats.getCurrent().get('type') === 'channel' && event.type === 'members:removed') event.type = 'room:left';

            switch (event.type) {
                case 'room:created':
                    return _.printf('%1$s created this conversation', getName(originator));
                case 'channel:joined':
                    return _.printf('%1$s joined the conversation', getNames(members));
                case 'members:added':
                    return _.printf('%1$s added %2$s to the conversation', getName(originator), getNames(_.difference(members, [originator])));
                case 'members:removed':
                    return _.printf('%1$s removed %2$s from the conversation', getName(originator), getNames(_.difference(members, [originator])));
                case 'image:changed':
                    return _.printf('%1$s changed the group image', getName(originator), event.fileId);
                case 'title:changed':
                    return _.printf('%1$s changed the group title to "%2$s"', getName(originator), event.title);
                case 'changeDescription':
                    return _.printf('%1$s changed the group description to "%2$s"', getName(originator), event.description);
                case 'room:left':
                    return _.printf('%1$s left the conversation', getName(originator));
                case 'me':
                    return _.printf('%1$s %2$s', getName(originator), event.message);
                case 'text':
                    return event.message;
                default:
                    return _.printf('Unknown system message %1$s', event.type);
            }
        },

        getFilesPreview: function () {
            // TODO no placeholder needed anymore. Width and height come from the preview
            var fileId = this.get('files')[0].fileId,
                // TODO: Adjust for channels
                url = data.API_ROOT + '/files/' + fileId + '/thumbnail',
                placeholder = $('<div class="placeholder">').busy();

            if (_.isUndefined(fileId)) return placeholder;

            $('<img>').on('load', function () {
                var $img = $(this),
                    oldHeight = placeholder.height();
                placeholder.replaceWith($img);
                $img.trigger('changeheight', { prev: oldHeight, value: $img.height() });
            }).attr('src', url)
            .attr({ 'data-cmd': 'show-message-file', 'data-room-id': this.collection.roomId, 'data-file-id': fileId, 'data-message-id': this.get('messageId') });
            return placeholder;
        },

        getFileText: function (opt) {
            opt = _.extend({
                icon: true,
                download: true,
                text: true
            }, opt);

            var $elem = $('<div class="placeholder">').busy(),
                file = this.get('files')[0],
                fileId = file.fileId;

            if (_.isUndefined(fileId)) return $elem;

            // TODO: Adjust for channels
            $.ajax({
                url: data.API_ROOT + '/files/' + fileId,
                xhrFields: { withCredentials: true }
            }).then(function () {
                $elem.replaceWith(
                    opt.icon ? $('<i class="fa icon">').addClass(util.getClassFromMimetype(file.mimetype)) : '',
                    opt.text ? $.txt(file.name) : '',
                    opt.download ? $('<a class="download">').attr({
                        href: data.API_ROOT + '/files/' + fileId + '/thumbnail',
                        download: file.name
                    }).append(
                        $('<i class="fa fa-download">')
                    ) : ''
                );
            });
            return $elem;
        },

        getTime: function () {
            return moment(this.get('sent')).format('LT');
        },

        getTextBody: function () {
            if (this.isSystem()) return this.getSystemMessage();
            if (this.isFile()) return this.getFileText();
            return sanitizer.simpleSanitize(this.get('content'));
        },

        isSystem: function () {
            return this.get('type') === 'system';
        },

        isMyself: function () {
            return this.get('sender') === data.user.email;
        },

        getType: function () {
            if (this.get('files') && this.get('files')[0].preview) return 'preview';
            if (this.get('files')) return 'file';
            if (this.get('type') === 'system') return 'system';
            return 'text';
        },

        hasPreview: function () {
            if (this.get('files') && this.get('files')[0].preview) return true;
            return false;
        },

        isFile: function () {
            return this.get('type') === 'file';
        },

        hasSameSender: function (limit) {
            limit = limit ? this.collection.length - limit : 0;
            var index = this.collection.indexOf(this);
            if (index <= limit) return false;
            var prev = this.collection.at(index - 1);
            if (prev.isSystem()) return false;
            return prev.get('sender') === this.get('sender');
        },

        getDeliveryState: function () {
            if (this.isMyself()) return util.getDeliveryStateClass(this.get('deliveryState'));
            return this.get('deliveryState') || '';
        },

        updateDelivery: function (state) {
            var url = data.API_ROOT + '/rooms/' + this.get('roomId') + '/delivery/' + this.get('messageId');
            this.set('deliveryState', state);
            $.ajax({
                method: 'POST',
                url: url,
                data: { state: state },
                xhrFields: { withCredentials: true }
            }).catch(function () {
                this.set('deliveryState', this.previous('deliveryState'));
            }.bind(this));
        },

        setInitialDeliveryState: function () {
            var room = data.chats.get(this.get('roomId'));
            if (!room) return;
            if (this.get('sender') !== data.user.email) return;
            if (this.get('deliveryState')) return;

            if (room.get('type') === 'private') {
                this.set('deliveryState', {
                    state: 'server',
                    modified: +moment()
                });
            } else if (room.get('type') === 'group') {
                var deliveryState = {};
                room.members.forEach(function (member) {
                    if (member.get('email') === data.user.email) return;
                    deliveryState[member.get('email')] = {
                        state: 'server',
                        modified: +moment()
                    };
                });
                this.set('deliveryState', deliveryState);
            }
        }
    });

    var messageCache = (function () {
        var cache = {};
        return {
            get: function (attrs, options) {
                var messageId = attrs.messageId, message = cache[messageId];
                if (message) {
                    message.set(attrs);
                } else {
                    message = new MessageModel(attrs, options);
                    if (messageId) cache[messageId] = message;
                    else {
                        message.once('change:messageId', function () {
                            cache[message.get('messageId')] = message;
                        });
                    }
                }
                return message;
            },
            has: function (messageId) {
                return !!cache[messageId];
            }
        };
    })();

    function getMessageModel(attrs, options) {
        var model = messageCache.get(attrs, options);
        model.collection = options.collection;
        return model;
    }
    getMessageModel.prototype.idAttribute = 'messageId';

    var MessageCollection = Backbone.Collection.extend({
        model: getMessageModel,
        comparator: function (a, b) {
            if (!a.get('messageId')) return 1;
            if (!b.get('messageId')) return -1;
            return util.strings.compare(a.get('messageId'), b.get('messageId'));
        },
        initialize: function (models, options) {
            this.roomId = options.roomId;
        },
        paginate: function (direction) {
            var id;
            if (direction === 'prev') id = this.first().get('messageId');
            else if (direction === 'next') id = this.last().get('messageId');

            return this.load({ messageId: id, direction: direction, limit: DEFAULT_LIMIT }, 'paginate');
        },
        load: function (params, type) {
            if (!this.roomId) return;

            type = type || 'load';
            this.trigger('before:' + type);

            // special handling for search
            if (type === 'load' && this.messageId) {
                params = { direction: 'siblings', messageId: this.messageId, limit: DEFAULT_LIMIT };
                delete this.messageId;
            }

            if (!params.messageId) {
                if (!this.nextComplete) params.limit = DEFAULT_LIMIT;
                this.nextComplete = true;
                this.trigger('complete:next');
            }

            var endpoint = data.chats.get(this.roomId).isChannel() ? '/channels/' : '/rooms/';
            return $.ajax({
                url: data.API_ROOT + endpoint + this.roomId + '/messages' + '?' + $.param(params),
                xhrFields: { withCredentials: true }
            })
            .then(function (list) {
                this.trigger(type);
                this.add(list, { parse: true });
                params.direction = params.direction || 'prev';
                if (params.direction === 'siblings') {
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
                    this[params.direction + 'Complete'] = list.length < params.limit;
                    if (this[params.direction + 'Complete']) this.trigger('complete:' + params.direction);
                }
                this.trigger('after:all after:' + type);
            }.bind(this));
        },
        getLast: function () {
            return this.models[this.models.length - 1];
        },
        sync: function (method, collection, options) {
            if (method === 'read') {
                var limit = Math.max(collection.length, DEFAULT_LIMIT);
                return this.load({ limit: limit });
            }
            options.xhrFields = _.extend({}, options.xhrFields, { withCredentials: true });
            return Backbone.Collection.prototype.sync.call(this, method, collection, options);
        },
        url: function () {
            return data.API_ROOT + '/rooms/' + this.roomId + '/messages';
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

        defaults: { active: false, type: 'group', unreadCount: 0 },

        idAttribute: 'roomId',

        initialize: function (attr) {
            var self = this;
            this.unset('messages', { silent: true });
            this.members = new MemberCollection(this.mapMembers(attr.members), { parse: true, roomId: attr.roomId });
            this.messages = new MessageCollection([], { roomId: attr.roomId });
            this.onChangeLastMessage();

            // forward specific events
            this.listenTo(this.members, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('member:' + name);
            });
            this.on('change:members', function () {
                this.members.set(this.mapMembers(this.get('members')), { parse: true, merge: true });
            });
            this.on('change:lastMessage', this.onChangeLastMessage);
            this.listenTo(this.messages, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('message:' + name);
            });
            this.listenTo(this.messages, 'add', _.debounce(function () {
                function updateLastMessage() {
                    if (!this.messages.nextComplete) return;
                    var lastMessage = this.messages.last();
                    this.set('lastMessage', lastMessage.toJSON());
                }

                var lastMessage = this.messages.last();
                if (!lastMessage) return;

                if (!this.get('lastMessage') || this.get('lastMessage').messageId !== lastMessage.get('messageId') || !lastMessage.has('messageId')) {
                    if (!lastMessage.has('messageId')) self.listenToOnce(lastMessage, 'change:messageId', updateLastMessage.bind(this));
                    else updateLastMessage.call(this);
                }
            }, 10));
            this.listenTo(this.messages, 'change:deliveryState', _.debounce(function () {
                var message = this.messages.last();
                if (!message) return;
                if (message.getDeliveryState() === 'seen') this.set('unreadCount', 0);
            }.bind(this), 0));
        },

        mapMembers: function (members) {
            return _(members).map(function (role, member) {
                return { role: role, email: member };
            });
        },

        getTitle: function () {
            var members = _(this.members.reject(function (m) { return m.get('email1') === data.user.email; }));
            return this.get('title') || members.invoke('getName').sort().join('; ');
        },

        onChangeLastMessage: function () {
            if (this.lastMessage && this.lastMessage.get('messageId') === this.get('lastMessage').messageId) return;
            if (this.lastMessage) this.stopListening(this.lastMessage);
            this.lastMessage = messageCache.get(this.get('lastMessage'));
            this.listenTo(this.lastMessage, 'change', function () {
                this.set('lastMessage', this.lastMessage.toJSON());
            });
        },

        getLastMessage: function () {
            var last = this.get('lastMessage');
            if (!last) return '\u00a0';
            var message = new MessageModel(last);
            if (message.isFile()) return message.getFileText({ download: false });
            return message.getTextBody();
        },

        getLastMessageDate: function () {
            var last = this.get('lastMessage');
            if (!last || !last.date) return '\u00a0';
            var date = moment(last.date);
            return date.calendar(null, {
                sameDay: 'LT',
                lastDay: '[Yesterday]',
                lastWeek: 'L',
                sameElse: 'L'
            });
        },

        getFirstMember: function () {
            // return first member that is not current user
            var user = data.users.getByMail(data.user.email);
            return this.members.reject(user)[0];
        },

        isMember: function (email) {
            email = email || data.user.email;
            return this.get('members') ? !!this.get('members')[email] : false;
        },

        parseSystemMessage: function (message, roomId) {
            var update = JSON.parse(message.content),
                chat = data.chats.get(roomId),
                members;

            if (update.type === 'members:removed') {
                members = _.clone(chat.get('members')) || {};
                update.members.forEach(function (member) {
                    delete members[member];
                });
                chat.set('members', members);
            }
            if (update.type === 'members:added') {
                members = _.clone(chat.get('members')) || {};
                update.members.forEach(function (member) {
                    members[member] = 'member';
                });
                chat.set('members', members);
            }

            if (update.type === 'title:changed') chat.set('title', update.title);
            if (update.type === 'image:changed') chat.trigger('change:icon');
        },

        getLastSenderName: function () {
            var lastMessage = this.get('lastMessage');
            if (!lastMessage) return '';
            var sender = lastMessage.sender,
                member = data.users.getByMail(sender);
            if (!member) return;
            return member.getName();
        },

        isActive: function () {
            return this.get('active');
        },

        isPrivate: function () {
            return this.get('type') === 'private';
        },

        isGroup: function () {
            return this.get('type') === 'group';
        },

        isChannel: function () {
            return this.get('type') === 'channel';
        },

        postMessage: function (attr, files) {
            var formData = new FormData();
            _.each(attr, function (value, key) {
                formData.append(key, value);
            });

            _.toArray(files).map(function (file) {
                formData.append('files', file, file.name);
                return file;
            });

            var model = this.messages.add(attr, { merge: true, parse: true });
            model.save(attr, {
                data: formData,
                processData: false,
                contentType: false,
                xhrFields: { withCredentials: true },
                success: function (model) {
                    model.setInitialDeliveryState();
                }
            });
            this.set('active', true);
        },

        postFirstMessage: function (attr, files) {
            var members = [];
            _(this.get('members')).allKeys().forEach(function (member) { members.push(member); });

            this.members = members;
            this.message = attr && attr.content;
            this.type = this.get('type');

            if (files) this.files = files;

            data.chats.addAsync(this).done(function (result) {
                events.trigger('cmd', { cmd: 'show-chat', id: result.get('roomId') });
            });
        },

        toggle: function (state) {
            this.set('active', !!state).save({ active: !!state }, { patch: true });
        },

        sync: function (method, model, options) {
            options.xhrFields = _.extend({}, options.xhrFields, { withCredentials: true });
            return Backbone.Model.prototype.sync.call(this, method, model, options);
        }
    });

    data.ChatModel = ChatModel;

    var ChatCollection = Backbone.Collection.extend({

        model: ChatModel,
        comparator: function (a, b) {
            return -util.strings.compare(a.get('lastMessage').messageId, b.get('lastMessage').messageId);
        },
        currentChatId: undefined,

        url: function () {
            return data.API_ROOT + '/rooms';
        },

        initialize: function () {
            this.on('change:unreadCount', this.onChangeUnreadCount);
            this.initialized = new $.Deferred();
            this.once('sync', this.initialized.resolve);
        },

        addAsync: function (attr) {
            var url = attr.roomId ? this.url() + '/' + attr.roomId : this.url();

            var collection = this,
                data = _.extend({
                    active: true, type: 'group'
                }, _(attr).pick('title', 'type', 'members', 'description', 'icon', 'reference', 'message')),
                formData = new FormData();

            _.each(data, function (value, key) {
                if (_.isUndefined(value)) return;

                if (_.isArray(value)) {
                    value.forEach(function (val, index) {
                        formData.append(key + '[' + index + ']', val);
                    });
                    return;
                }

                formData.append(key, value);
            });

            return $.ajax({
                type: attr.roomId ? 'PATCH' : 'POST',
                url: url,
                data: formData,
                processData: false,
                contentType: false,
                xhrFields: { withCredentials: true }
            }).then(function (data) {
                return collection.add(data, { merge: true, parse: true })[0];
            });
        },

        toggleRecent: function (roomId) {
            var room = this.get(roomId);
            return $.ajax({
                type: 'PUT',
                url: this.url() + '/' + roomId + '/active/' + !room.get('active'),
                processData: false,
                contentType: false,
                xhrFields: { withCredentials: true }
            }).then(function () {
                room.set('active', !room.get('active'));
            });
        },

        onChangeUnreadCount: function () {
            this.trigger('unseen', this.reduce(function (sum, model) {
                if (!model.isActive()) return sum;
                return sum + model.get('unreadCount');
            }, 0));
        },

        setCurrent: function (current) {
            this.currentChatId = current ? current.toString() : undefined;
        },

        getCurrent: function () {
            return data.chats.get(this.currentChatId);
        },

        getActive: function () {
            return this.filter({ active: true });
        },

        getHistory: function () {
            var list = [];
            this.filter({ active: false }).forEach(function (chat) {
                if (chat.isMember() || chat.isPrivate() || chat.get('joined')) {
                    list.push(chat);
                }
            });

            return list.slice(0, 100);
        },

        getChannels: function () {
            return this.filter({ type: 'channel' });
        },

        getChannelsUnjoined: function () {
            return this.filter({ type: 'channel', joined: false });
        },

        fetchUnlessExists: function (roomId) {
            var model = this.get(roomId);
            if (model) return $.when(model);
            return $.ajax({
                method: 'GET',
                url: this.url() + '/' + roomId,
                xhrFields: { withCredentials: true }
            }).then(function (data) {
                this.add([data]);
            }.bind(this));
        },

        joinChannel: function (roomId) {
            var model = this.get(roomId);
            if (!model || !model.isChannel()) return;

            var url = this.url() + '/' + roomId + '/members';
            var members = _.clone(model.get('members')) || {};
            members[data.user.email] = 'member';
            model.set({ joined: true, active: true, members: members });

            return $.ajax({
                method: 'POST',
                url: url,
                xhrFields: { withCredentials: true }
            });
        },

        leaveChannel: function (roomId) {
            var room = this.get(roomId);
            var url = this.url() + '/' + roomId + '/members';
            return $.ajax({
                type: 'DELETE',
                url: url,
                processData: false,
                contentType: false,
                xhrFields: { withCredentials: true }
            }).then(function () {
                room.set('active', false);
                room.set('joined', false);
            }).fail(function (err) {
                console.log(err);
            });
        },

        leaveGroup: function (roomId) {
            var url = this.url() + '/' + roomId + '/members';
            this.get(roomId).destroy({ url: url });
        },

        sync: function (method, model, options) {
            options.xhrFields = _.extend({}, options.xhrFields, { withCredentials: true });
            return Backbone.Collection.prototype.sync.call(this, method, model, options);
        }
    });

    data.chats = new ChatCollection();

    //
    // Files
    //

    var FileModel = Backbone.Model.extend({

        idAttribute: 'fileId',

        getThumbnailUrl: function () {
            return data.API_ROOT + '/files/' + this.get('fileId') + '/thumbnail';
        },

        getPreviewUrl: function () {
            return data.API_ROOT + '/files/' + this.get('fileId');
        },

        isImage: function () {
            return this.get('files') ? /(jpg|jpeg|gif|bmp|png)/i.test(this.get('files')[0].mimetype) : /(jpg|jpeg|gif|bmp|png)/i.test(this.get('mimetype'));
        }
    });


    var FilesCollection = Backbone.Collection.extend({

        model: FileModel,

        url: function () {
            return data.API_ROOT + '/files';
        },

        sync: function (method, model, options) {
            options.xhrFields = _.extend({}, options.xhrFields, { withCredentials: true });
            return Backbone.Collection.prototype.sync.call(this, method, model, options);
        }
    });

    data.files = new FilesCollection();

    var RoomFilesCollection = FilesCollection.extend({

        initialize: function (models, opt) {
            this.roomId = opt.roomId;
            this.initialized = new $.Deferred();
            this.once('sync', this.initialized.resolve);
        },

        url: function () {
            return data.API_ROOT + '/rooms/' + this.roomId + '/files';
        }

    });

    data.RoomFilesCollection = RoomFilesCollection;

    //
    // Session Model
    //

    var SessionModel = Backbone.Model.extend({

        initialize: function () {
            this.initialized = new $.Deferred();
        },

        connectSocket: function () {
            var socket = data.socket = io.connect(data.SOCKET, { transports: ['websocket'] });

            socket.on('alive', function () {
                console.log('Connected socket to server');
            });

            socket.on('delivery:update', function (obj) {
                var roomId = obj.roomId,
                    messageId = obj.messageId,
                    email = obj.email,
                    modified = obj.modified,
                    state = obj.state,
                    room = data.chats.get(roomId);

                function process(message) {
                    if (util.strings.greaterThan(message.get('messageId'), messageId)) return;
                    if (message.isMyself() !== (email !== data.user.email)) return;

                    var deliveryState = message.get('deliveryState') || {},
                        prevState = (deliveryState[email] || {}).state || deliveryState.state || message.get('deliveryState');

                    if (prevState === 'seen') return;
                    if (prevState === 'received' && state === 'server') return;
                    if (prevState === state) return;

                    var changes;
                    if (!message.isMyself()) changes = state;
                    else if (room.get('type') === 'private') changes = { state: state, modified: modified };
                    else {
                        changes = _.clone(deliveryState);
                        changes[email] = { state: state, modified: modified };
                    }
                    message.set('deliveryState', changes);
                }

                // update specific message, usually the lastMessage in a room
                if (messageCache.has(messageId)) process(messageCache.get({ messageId: messageId }));
                if (room) room.messages.forEach(process);
            });

            socket.on('message:new', function (attr) {
                var roomId = attr.roomId,
                    message = attr.message;

                // stop typing
                events.trigger('typing:' + roomId, message.sender, false);
                // fetch room unless it's already known
                data.chats.fetchUnlessExists(roomId).done(function (model) {
                    // add new message to room
                    message.roomId = roomId;
                    var newMessage = messageCache.get(message);

                    // either add message to chatroom or update last message manually
                    if (model.messages.nextComplete) {
                        // anticipate, whether this client was sending the last message and received a push notification before the message creation resolved
                        var lastIndex = model.messages.findLastIndex(function (message) {
                                return message.get('sender') === data.user.email;
                            }), lastMessage;
                        if (lastIndex >= 0) lastMessage = model.messages.at(lastIndex);
                        if (!lastMessage || lastMessage.get('messageId') && newMessage.get('messageId') !== lastMessage.get('messageId')) {
                            model.messages
                                .add(message, { merge: true, parse: true })
                                .setInitialDeliveryState();
                        }
                    } else model.set('lastMessage', _.extend({}, model.get('lastMessage'), newMessage.toJSON()));

                    if (model.get('type') !== 'channel' && message.sender !== data.user.email) {
                        model.set({ unreadCount: model.get('unreadCount') + 1 });
                        newMessage.updateDelivery('received');
                    }

                    if (newMessage.get('type') === 'system') model.parseSystemMessage(message, roomId);
                });
            });

            socket.on('user.state:changed', function (event) {
                if (!data.users.length) return;
                var model = data.users.getByMail(event.user);
                if (model) model.set('state', event.state);
            });

            socket.on('typing', function (event) {
                events.trigger('typing:' + event.roomId, event.email, event.state);
            });

            // send heartbeat every minute
            setInterval(function () { socket.emit('heartbeat'); }, 60000);
        },

        waitForMessage: function () {
            var def = new $.Deferred();
            function listener(event) {
                if (event.origin !== data.SOCKET) return;
                def.resolve(event.data);
                window.removeEventListener('message', listener);
            }
            window.addEventListener('message', listener, false);
            return def;
        },

        getAuthURL: function () {
            return $.ajax({
                url: data.SOCKET + '/auth/url',
                xhrFields: { withCredentials: true }
            });
        },

        getUserId: function () {
            return $.ajax({
                url: data.SOCKET + '/auth/user',
                xhrFields: { withCredentials: true }
            }).then(function (chatUser) {
                return require(['io.ox/core/api/user']).then(function (userAPI) {
                    return userAPI.get({ id: ox.user_id });
                }).then(function (oxUser) {
                    if (oxUser.email1 !== chatUser.email) {
                        throw new Error('Chat email address and appsuite email address do not coincide');
                    }

                    data.user_id = chatUser.id;
                    data.user = chatUser;
                    this.initialized.resolve();
                    return chatUser;
                }.bind(this));
            }.bind(this));
        },

        checkIdPSession: function (url) {
            url = url += '&prompt=none';
            var frame = $('<iframe>').attr('src', url).hide(),
                def = this.waitForMessage();
            $('body').append(frame);
            def.done(function () {
                frame.remove();
            });
            return def;
        },

        authenticateSilent: function () {
            return this.getAuthURL().then(function (url) {
                return this.checkIdPSession(url);
            }.bind(this)).then(function (status) {
                if (!status) throw new Error('No active session');
                return this.getUserId();
            }.bind(this));
        },

        getIdPSession: function (url) {
            var def = this.waitForMessage(),
                popup = window.open(url, '_blank', 'width=972,height=660,modal=yes,alwaysRaised=yes');
            def.done(function () {
                if (popup) popup.close();
            });
            return def;
        },

        authenticate: function () {
            return this.getAuthURL().then(function (url) {
                return this.getIdPSession(url);
            }.bind(this)).then(function () {
                return this.getUserId();
            }.bind(this));
        },

        login: function () {
            return this.authenticate();
        },

        getConfig: function () {
            if (this.config) return this.config;
            return $.ajax({
                url: data.SOCKET + '/auth/config'
            }).then(function (config) {
                this.config = config;
                return config;
            });
        },

        authenticateAppsuite: function () {
            return http.GET({ module: 'token', params: { action: 'acquireToken' } }).then(function (res) {
                if (!res.token) throw new Error('Missing token in response');
                return $.ajax({
                    method: 'post',
                    url: data.SOCKET + '/auth/login',
                    data: { token: res.token },
                    xhrFields: { withCredentials: true }
                });
            }).then(function () {
                return this.getUserId();
            }.bind(this));
        },

        autologin: function () {
            return this.getUserId().catch(function () {
                return this.getConfig().then(function (config) {
                    if (config.appsuite) return this.authenticateAppsuite();
                    if (config.oidc) return this.authenticateSilent();
                    throw new Error('No suitable authentication method');
                }.bind(this));
            }.bind(this)).then(function (user) {
                this.set('userId', user.id);
                return user.id;
            }.bind(this));
        },

        logout: function () {
            return $.ajax({
                url: data.SOCKET + '/auth/logout',
                xhrFields: { withCredentials: true }
            });
        }

    });

    data.session = new SessionModel();

    //
    // Helpers
    //

    function getName(email) {
        if (email === data.user.email) return '<span class="name">You</span>';
        return getNames([email]);
    }

    function getNames(list) {
        return join(
            _(list)
            .map(function (email) {
                var model = data.users.getByMail(email);
                var name = (model ? model.getName() : 'Unknown user');
                if (email === data.user.email) name = 'You';

                return '<span class="name">' + name + '</span>';
            })
            .sort()
        );
    }

    function join(list) {
        if (list.length <= 2) return list.join(' and ');
        return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
    }

    return data;
});
