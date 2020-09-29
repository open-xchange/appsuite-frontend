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
    'io.ox/chat/api',
    'io.ox/chat/events',
    'io.ox/contacts/api',
    'io.ox/switchboard/api',
    'io.ox/mail/sanitizer',
    'io.ox/chat/util',
    'io.ox/core/http',
    'gettext!io.ox/chat',
    'io.ox/core/notifications'
], function (api, events, contactsApi, switchboardApi, sanitizer, util, http, gt, notifications) {

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
                var jqXHR = Backbone.Collection.prototype.sync.call(this, method, model, options);
                jqXHR.fail(util.handleSessionFail);
                return jqXHR;
            });
        }
    });

    var BaseCollection = Backbone.Collection.extend({
        sync: function () {
            return BaseModel.prototype.sync.apply(this, arguments);
        }
    });

    var UserModel = Backbone.Model.extend({

        isSystem: function () { return this.get('id') === 0; },

        isMyself: function () {
            var user = data.users.getByMail(data.user.email);
            return this === user;
        },

        getName: function () {
            var first = $.trim(this.get('first_name')), last = $.trim(this.get('last_name'));
            if (first && last) return first + ' ' + last;
            return first || last || this.get('email') || this.getEmail() || '\u00a0';
        },

        getEmail: function () { return this.get('email1') || this.get('email2') || this.get('email3'); }
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
                if (cache[email]) return cache[email];
                cache[email] = this.find(function (model) {
                    return model.get('email1') === email || model.get('email2') === email || model.get('email3') === email;
                });
                return cache[email];
            };
        }())

    });
    data.users = new UserCollection([]);

    data.fetchUsers = function () {
        return contactsApi.getAll({ folder: 6, columns: '1,20,501,502,524,555,556,557,606' }, false).then(function (result) {
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
                return _.extend({ email1: item.email }, item, user);
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

        defaults: function () {
            return { content: '', sender: data.user.email, date: +moment(), type: 'text' };
        },

        idAttribute: 'messageId',

        urlRoot: function () {
            return api.url + '/rooms/' + this.get('roomId') + '/messages';
        },

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
            // deleted flag means early return here
            if (this.get('deleted')) return gt('Message was deleted');

            var event = JSON.parse(this.get('content'));
            var originator = this.get('sender'),
                members = event.members || [],
                room = data.chats.get(this.get('roomId'));

            if (!_.isArray(members) && _.isObject(members)) members = Object.keys(members);

            if (room.get('type') === 'channel' && event.type === 'members:added') event.type = 'channel:joined';
            if (event.type === 'members:removed' && members.length === 1 && members[0] === originator) event.type = 'room:left';

            switch (event.type) {
                case 'room:created':
                    //#. %1$s: name of the creator
                    return gt('%1$s created this conversation', getName(originator));
                case 'channel:joined':
                    //#. %1$s: name of the new participant
                    return gt('%1$s joined the conversation', getNames(members));
                case 'members:added':
                    //#. %1$s: name of the participant that added the new participant
                    //#. %2$s: name of the added participant
                    return gt('%1$s added %2$s to the conversation', getName(originator), getNames(_.difference(members, [originator])));
                case 'members:removed':
                    //#. %1$s: name of the participant that removed the other participant
                    //#. %2$s: name of the removed participant
                    return gt('%1$s removed %2$s from the conversation', getName(originator), getNames(_.difference(members, [originator])));
                case 'image:changed':
                    //#. %1$s: name of a chat participant
                    return gt('%1$s changed the group image', getName(originator), event.fileId);
                case 'title:changed':
                    //#. %1$s: name of a chat participant
                    //#. %2$s: the new title
                    return gt('%1$s changed the group title to "%2$s"', getName(originator), event.title);
                case 'changeDescription':
                    //#. %1$s: name of a chat participant
                    //#. %2$s: the new description
                    return gt('%1$s changed the group description to "%2$s"', getName(originator), event.description);
                case 'room:left':
                    //#. %1$s: name of a chat participant
                    return gt('%1$s left the conversation', getName(originator));
                case 'me':
                    // no need to translate this
                    return _.printf('%1$s %2$s', getName(originator), event.message);
                case 'text':
                    return event.message;
                case 'decryption:failed':
                    //#. If it fails to load and decrypt a chat message a system message will be shown
                    return gt('Message could not be loaded');
                default:
                    //#. %1$s: messagetext
                    return gt('Unknown system message: %1$s', event.type);
            }
        },

        getFileUrl: function (file) {
            var room = data.chats.get(this.get('roomId'));
            if (room.isChannel()) return api.url + '/channels/' + this.get('roomId') + '/files/' + file.fileId;
            return api.url + '/files/' + file.fileId;
        },

        getFilesPreview: function () {
            var attachment = this.get('files')[0],
                fileId = attachment.fileId,
                url = this.getFileUrl(attachment) + '/thumbnail';

            if (!fileId) return;
            if (!attachment.preview) return;

            var width = attachment.preview.width,
                height = attachment.preview.height;

            if (height > 400) {
                var ratio = 400 / height;
                height *= ratio;
                width *= ratio;
            }

            var image = $('<div>').attr({
                src: url,
                'data-cmd': 'show-message-file',
                'data-room-id': this.collection.roomId,
                'data-file-id': fileId,
                'data-message-id': this.get('messageId')
            });

            api.requestDataUrl({ url: url }).then(function (base64encodedImage) {
                image.css('backgroundImage', 'url("' + base64encodedImage + '")');
            });

            var node = $('<div class="preview-wrapper">')
                .append(image)
                .css({
                    width: width + 'px',
                    'padding-top': (height / width * 100) + '%'
                });
            return node;
        },

        getFileText: function (opt) {
            opt = _.extend({ icon: true, download: true, text: true }, opt);

            var file = _(this.get('files')).last();
            if (!file) return;

            var node = [
                opt.icon ? $('<i class="fa icon" aria-hidden="true">').addClass(util.getClassFromMimetype(file.mimetype)) : '',
                opt.text ? $.txt(file.name) : '',
                opt.download ? $('<i class="fa fa-download" aria-hidden="true">').attr('title', gt('Download')) : ''
            ];

            return opt.download ? $('<button type="button" class="btn btn-link download">').attr('data-download', this.getFileUrl(file)).append(node) : node;
        },

        getTime: function () {
            // use time when this message was last changed or when it was created
            return moment(this.get('edited') || this.get('date')).format('LT');
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
            // always treat deleted messages as text
            if (this.get('deleted')) return 'text';
            if (this.hasPreview()) return 'preview';
            if (this.get('files')) return 'file';
            if (this.isSystem()) return 'system';
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
            // deleted message still have a sender
            if (prev.isSystem() && !prev.get('deleted')) return false;
            return prev.get('sender') === this.get('sender');
        },

        getDeliveryState: function () {
            if (this.isMyself()) return util.getDeliveryStateClass(this.get('deliveryState'));
            return this.get('deliveryState') || '';
        },

        updateDelivery: function (state) {
            var room = data.chats.active.get(this.get('roomId'));
            if (room.isChannel() && !room.isMember()) return;

            this.set('deliveryState', state);
            api.updateDelivery(this.get('roomId'), this.get('messageId'), state).catch(function () {
                this.set('deliveryState', this.previous('deliveryState'));
            }.bind(this));
        },

        setInitialDeliveryState: function () {
            var room = data.chats.get(this.get('roomId'));
            if (!room) return;
            if (this.get('sender') !== data.user.email) return;

            if (room.get('type') === 'private') {
                if (this.get('deliveryState')) return;
                this.set('deliveryState', { state: 'server', modified: +moment() });
            } else if (room.get('type') === 'group') {
                var deliveryState = _.clone(this.get('deliveryState')) || {};
                room.members.forEach(function (member) {
                    if (member.get('email') === data.user.email) return;
                    deliveryState[member.get('email')] = deliveryState[member.get('email')] || {
                        state: 'server',
                        modified: +moment()
                    };
                });
                this.set('deliveryState', deliveryState);
            }
        }
    });

    var messageCache = (function () {
        var cache = {},
            idlessCache = {};
        return {
            get: function (attrs, options) {
                var messageId = attrs.messageId, message = cache[messageId];
                // try to reuse the messages without ids
                if (!message) message = idlessCache[attrs.sender + '' + attrs.content];

                if (message) {
                    message.set(attrs);
                } else {
                    message = new MessageModel(attrs, options);
                    if (messageId) {
                        cache[messageId] = message;
                    } else {
                        var identifier = attrs.sender && attrs.content && attrs.sender + '' + attrs.content;
                        if (identifier) idlessCache[identifier] = message;
                        message.once('change:messageId', function () {
                            if (identifier) delete idlessCache[identifier];
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

    data.chats = (function () {
        var cache = {},
            idlessCache = {};
        return {
            get: function (attrs, options) {
                if (!attrs) return;
                if (_.isString(attrs)) attrs = { roomId: attrs };

                var roomId = attrs.roomId || attrs.id,
                    identifier = attrs.type && attrs.title && attrs.members && attrs.type + attrs.title + Object.keys(attrs.members).sort(),
                    room = cache[roomId] || idlessCache[identifier];

                if (room) room.set(attrs);
                else {
                    room = new ChatModel(attrs, options);
                    if (roomId) cache[roomId] = room;
                    else {
                        if (identifier) idlessCache[identifier] = room;
                        room.once('change:roomId', function () {
                            if (identifier) delete idlessCache[identifier];
                            cache[room.get('roomId')] = room;
                        });
                    }
                }

                return room;
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

            var endpoint = data.chats.get(this.roomId).isChannel() ? '/channels/' : '/rooms/';
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
            }.bind(this));
        },
        getLast: function () {
            return this.models[this.models.length - 1];
        },
        onChangeMessageId: function (model) {
            var index = this.indexOf(model),
                next = this.at(index + 1);

            if (next && util.strings.greaterThan(model.get('messageId'), next.get('messageId'))) {
                this.remove(model);
                this.add(model);
            }
        },
        sync: function (method, collection, options) {
            if (method === 'read') {
                var limit = Math.max(collection.length, DEFAULT_LIMIT);
                return this.load({ limit: limit }, 'load');
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

        defaults: { active: false, type: 'group', unreadCount: 0 },

        idAttribute: 'roomId',

        urlRoot: function () {
            return api.url + '/rooms';
        },

        initialize: function (attr) {
            var self = this;
            attr = attr || {};
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
            if (!this.get('lastMessage')) return;
            this.get('lastMessage').roomId = this.get('roomId');
            if (this.lastMessage && this.lastMessage.get('messageId') === this.get('lastMessage').messageId) return;

            if (this.lastMessage) this.stopListening(this.lastMessage);
            this.lastMessage = messageCache.get(this.get('lastMessage'));
            this.listenTo(this.lastMessage, 'change', function () {
                this.set('lastMessage', this.lastMessage.toJSON());
            });
            if (this.get('lastMessage').files) data.files.add(this.get('lastMessage').files);
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
                lastDay: '[' + gt('Yesterday') + ']',
                lastWeek: 'L',
                sameElse: 'L'
            });
        },

        getFirstMember: function () {
            // return first member that is not current user
            return this.members.find(function (member) {
                return member.get('email') !== data.user.email;
            });
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
                members = _.extend({}, chat.get('members'), update.members);
                if (update.members[data.user.email]) {
                    // edge case, when a user has been readded to the group
                    chat.fetch();
                    chat.trigger('change:icon', { silent: true });
                }
                chat.set('members', members);
            }

            if (update.type === 'title:changed') chat.set('title', update.title);
            if (update.type === 'image:changed') {
                this.set({ icon: update.icon }, { silent: true });
                chat.trigger('change:icon');
            }
        },

        getLastSenderName: function () {
            var lastMessage = this.get('lastMessage');
            if (!lastMessage) return '';
            var sender = lastMessage.sender,
                member = data.users.getByMail(sender);
            if (!member) return;
            return member.getName();
        },

        getIconUrl: function () {
            if (!this.get('icon')) return;
            var endpoint = this.get('type') !== 'channel' ? '/rooms/' : '/channels/';
            return api.url + endpoint + this.get('roomId') + '/icon';
        },

        isActive: function () { return this.get('active'); },
        isPrivate: function () { return this.get('type') === 'private'; },
        isGroup: function () { return this.get('type') === 'group'; },
        isChannel: function () { return this.get('type') === 'channel'; },

        handleError: function (response) {
            var errorCode = response.responseJSON ? response.responseJSON.errorCode : response.responseText;

            switch (errorCode) {
                case 'filesize:exceeded': return notifications.yell('error', gt('The uploaded file exceeds the size limit'));
                default: notifications.yell('error', gt('Something went wrong. Please try again.'));
            }
        },

        postMessage: function (attr, files) {
            if (this.isNew()) return this.postFirstMessage(attr, files);
            attr.roomId = this.get('roomId');

            var formData = util.makeFormData(_.extend({}, attr, { files: files })),
                model = files ? new MessageModel(attr) : this.messages.add(attr, { merge: true, parse: true });

            // model for files will be added to cache and this.messages via sockets messsage:new event. So no need to do it in the callback here. Temporary model is fine;
            model.save(attr, {
                data: formData,
                processData: false,
                contentType: false,
                success: function (model) {
                    model.setInitialDeliveryState();
                    if (files) {
                        // remove message, there is a good change it was added meanwhile by socket message:new, we don't want 2 copies of the same message
                        // todo don't send message:new to this session
                        this.messages.remove({ messageId: model.get('messageId') });
                        this.messages.add(model, { merge: true });
                    }
                }.bind(this)
            }).fail(this.handleError.bind(this));

            this.set('active', true);
        },

        editMessage: function (newContent, message) {
            var formData = util.makeFormData({ content: newContent });

            return util.ajax({
                type: 'PATCH',
                processData: false,
                contentType: false,
                url: this.url() + '/messages/' + message.get('messageId'),
                data: formData
            });
        },

        postFirstMessage: function (attr, files) {
            var hiddenAttr = { message: attr.content, files: files, members: this.get('members') };
            delete attr.content;
            delete attr.members;

            this.save(attr, { hiddenAttr: hiddenAttr }).then(function () {
                events.trigger('cmd', { cmd: 'show-chat', id: this.get('roomId') });
            }.bind(this), this.handleError.bind(this));
        },

        toggleRecent: function () {
            var self = this;
            return api.setRoomState(this.get('roomId'), !self.get('active')).then(function () {
                self.set('active', !self.get('active'));
                if (self.get('active')) {
                    data.chats.active.add(self);
                    data.chats.recent.remove(self);
                } else {
                    data.chats.active.remove(self);
                    data.chats.recent.add(self);
                }
            });
        },

        deleteMessage: function (message) {
            return util.ajax({
                type: 'DELETE',
                url: this.url() + '/messages/' + message.get('messageId')
            });
        },

        sync: function (method, model, options) {
            if (method === 'create' || method === 'update') {
                var data = _(method === 'create' ? model.attributes : model.changed).pick('title', 'type', 'members', 'description', 'reference');
                options.data = util.makeFormData(_.extend(data, options.hiddenAttr));
                options.processData = false;
                options.contentType = false;
                options.method = method === 'create' ? 'POST' : 'PATCH';
            }

            return BaseModel.prototype.sync.call(this, method, model, options).then(function (data) {
                if (method === 'create') this.messages.roomId = this.get('roomId');
                if (data.lastMessage) messageCache.get({ messageId: data.lastMessage.messageId }).setInitialDeliveryState();
                return data;
            }.bind(this));
        }
    });

    data.ChatModel = ChatModel;

    function getChatModel(attrs, options) {
        var model = data.chats.get(attrs, options);
        model.collection = options.collection;
        return model;
    }
    getChatModel.prototype.idAttribute = 'roomId';

    var ChatCollection = BaseCollection.extend({

        model: getChatModel,
        comparator: function (a, b) {
            if (!a.get('lastMessage')) return 0;
            if (!b.get('lastMessage')) return 0;
            return -util.strings.compare(a.get('lastMessage').messageId, b.get('lastMessage').messageId);
        },

        url: function () {
            return api.url + '/' + this.options.endpoint;
        },

        sync: function (method, collection, options) {
            options = _.extend({}, options, this.options);
            return BaseCollection.prototype.sync.call(this, method, collection, options);
        },

        initialize: function (models, options) {
            this.options = options;
            this.on('change:unreadCount', this.onChangeUnreadCount);
            this.initialized = new $.Deferred();
            this.once('sync', this.initialized.resolve);
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

        getChannels: function () {
            return this.filter({ type: 'channel' });
        },

        fetchUnlessExists: function (roomId) {
            var model = this.get(roomId);
            if (model) return $.when(model);
            return api.getChannelByType(this.options.endpoint, roomId)
                .then(function (data) { return this.add(data); }.bind(this));
        },

        joinChannel: function (roomId) {
            var model = this.get(roomId);
            if (!model || !model.isChannel()) return;

            var members = _.clone(model.get('members')) || {};
            members[data.user.email] = 'member';
            model.set({ active: true, members: members });
            data.chats.active.add(model);
            data.chats.channels.remove(model);

            return api.joinChannel(roomId);
        },

        leaveChannel: function (roomId) {
            var room = this.get(roomId);
            return api.leaveChannelByType(this.options.endpoint, roomId)
                .then(function () { room.set('active', false); })
                .fail(function (err) { console.log(err); });
        },

        leaveGroup: function (roomId) {
            return api.leaveChannelByType(this.options.endpoint, roomId)
                .fail(function (err) { console.log(err); });
        }
    });

    data.chats.active = new ChatCollection(undefined, { endpoint: 'rooms' });
    data.chats.channels = new ChatCollection(undefined, { endpoint: 'channels' });
    data.chats.recent = new ChatCollection(undefined, { endpoint: 'rooms', data: { active: false } });

    //
    // Files
    //

    var FileModel = Backbone.Model.extend({

        idAttribute: 'fileId',

        getThumbnailUrl: function () {
            var roomId = data.chats.active.currentChatId,
                isChannel = roomId && data.chats.active.get(roomId).isChannel();
            if (isChannel) return api.url + '/channels/' + roomId + '/files/' + this.get('fileId') + 'thumbnail';
            return api.url + '/files/' + this.get('fileId') + '/thumbnail';
        },

        getFileUrl: function () {
            var roomId = data.chats.active.currentChatId,
                isChannel = roomId && data.chats.active.get(roomId).isChannel();
            if (isChannel) return api.url + '/channels/' + roomId + '/files/' + this.get('fileId');
            return api.url + '/files/' + this.get('fileId');
        },

        isImage: function () {
            return this.get('files') ? /(jpg|jpeg|gif|bmp|png)/i.test(this.get('files')[0].mimetype) : /(jpg|jpeg|gif|bmp|png)/i.test(this.get('mimetype'));
        }
    });


    var FilesCollection = BaseCollection.extend({
        model: FileModel,
        url: function () { return api.url + '/files'; }
    });

    data.files = new FilesCollection();

    var RoomFilesCollection = FilesCollection.extend({

        initialize: function (models, opt) {
            this.roomId = opt.roomId;
            this.initialized = new $.Deferred();
            this.once('sync', this.initialized.resolve);
        },

        url: function () {
            var isChannel = data.chats.active.get(this.roomId).isChannel();
            if (isChannel) return api.url + '/channels/' + this.roomId + '/files';
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
        },

        refresh: function () {
            var newChats = data.chats.active.filter(function (model) { return model.isNew(); });
            $.when.apply($,
                _([data.chats.active, data.chats.channels, data.chats.recent])
                    .map(function (collection) {
                        collection.expired = true;
                        collection.trigger('expire');
                        if (collection.expired) return collection.reset();
                        return collection.fetch();
                    })
            ).then(function () {
                var chats = data.chats.active.chain().union(data.chats.channels, data.chats.recent).unique().value();
                chats.forEach(function (model) {
                    if (model.messages.length === 0) return;
                    var prevLast = model.previous('lastMessage') || {},
                        last = model.get('lastMessage') || {};
                    if (prevLast.messageId === last.messageId) return;

                    model.messages.expired = true;
                    // views which use the messages-collection can prevent the expiry by listening to the expire event
                    model.messages.trigger('expire');
                    if (model.messages.expired) model.messages.reset();
                });
            }).then(function () {
                data.chats.active.add(newChats, { at: 0 });
            });
        },

        connectSocket: function () {
            var socket = data.socket = switchboardApi.socket;

            socket.on('reconnect', this.refresh);

            socket.on('chat:delivery:update', function (obj) {
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

            socket.on('chat:message:new', function (attr) {
                console.log(attr);
                var roomId = attr.roomId,
                    message = attr.message;

                // stop typing
                events.trigger('typing:' + roomId, message.sender, false);
                // fetch room unless it's already known
                data.chats.active.fetchUnlessExists(roomId).done(function (model) {
                    // add new message to room
                    message.roomId = roomId;
                    var newMessage = messageCache.get(message);

                    if (model.messages.nextComplete) {
                        if (!model.messages.get(newMessage)) model.messages.add(newMessage);
                    } else model.set('lastMessage', _.extend({}, model.get('lastMessage'), newMessage.toJSON()));

                    if (model.get('type') !== 'channel' && message.sender !== data.user.email) {
                        model.set({ unreadCount: model.get('unreadCount') + 1 });
                        newMessage.updateDelivery('received');
                    }

                    if (newMessage.get('type') === 'system') model.parseSystemMessage(message, roomId);
                });
            });

            socket.on('chat:typing', function (event) {
                events.trigger('typing:' + event.roomId, event.email, event.state);
            });

            socket.on('message:changed', function (message) {
                var cachedMessage = messageCache.get({ messageId: message.messageId });
                if (cachedMessage) {
                    var typeChanged = message.type && cachedMessage.get('type') !== message.type;
                    // if this message changed type we do a silent change and trigger a messageChanged event.
                    // This way the message node is replaced fully instead of partial changes using multiple change listeners. We want avoid some strange half changed message nodes
                    cachedMessage.set(message, { silent: typeChanged });
                    if (typeChanged) events.trigger('message:changed', cachedMessage);
                }
            });

            // send heartbeat every minute
            setInterval(function () { socket.emit('heartbeat'); }, 60000);
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
            return api.getUserId().then(function (chatUser) {
                data.user = chatUser;
                this.set('userId', chatUser.id);
                this.initialized.resolve();
            }.bind(this));
        }
    });

    data.session = new SessionModel();

    ox.on('refresh^', function () {
        data.session.refresh();
    });

    //
    // Helpers
    //

    function getName(email) {
        //#. shown instead of your name for your own chat messages, stand-alone word / not concatenated
        if (email === data.user.email) return '<span class="name">' + gt('You') + '</span>';
        return getNames([email]);
    }

    function getNames(list) {
        return join(
            _(list)
            .map(function (email) {
                var model = data.users.getByMail(email);
                var name = (model ? model.getName() : gt('Unknown user'));
                //#. shown instead of your name for your own chat messages, stand-alone word / not concatenated
                if (email === data.user.email) name = gt('You');

                return '<span class="name">' + name + '</span>';
            })
            .sort()
        );
    }

    function join(list) {
        //#. used as a separator text between multiple participants of a chat example: Paul and Bob
        if (list.length <= 2) return list.join(gt(' and '));
        //#. used as a separator text between multiple participants of a chat example: Paul and Bob
        return list.slice(0, -1).join(', ') + gt(', and ') + list[list.length - 1];
    }

    return data;
});
