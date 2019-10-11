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
    'io.ox/chat/util'
], function (events, api, io, sanitizer, util) {

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
            return first || last || this.get('email') || '\u00a0';
        },

        getState: function () {
            return this.get('state') || 'offline';
        },

        setState: function (state) {
            $.ajax({
                method: 'POST',
                url: data.API_ROOT + '/users/' + state,
                xhrFields: { withCredentials: true }
            }).then(function () {
                this.set('state', state);
            }.bind(this));
        },

        fetchState: function () {
            if (this.has('state')) return;
            $.ajax({
                url: data.API_ROOT + '/users/' + this.get('id') + '/state',
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
                return data.users.getByMail(item.email) || { email1: item.email };
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
            return { body: '', senderId: data.user_id, sent: +moment(), type: 'text', state: undefined };
        },

        getBody: function () {
            if (this.isSystem()) return this.getSystemMessage();
            if (this.isImage()) return this.getImage();
            if (this.isFile()) return this.getFile();
            return this.getFormattedBody();
        },

        getFormattedBody: function () {
            return _.escape(this.get('body')).replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
        },

        getSystemMessage: function () {
            var data = JSON.parse(this.get('body'));
            switch (data.type) {
                case 'createRoom':
                    return _.printf('%1$s created this conversation', getName(data.originator));
                case 'joinMember':
                    return _.printf('%1$s joined the conversation', getNames(data.members));
                case 'addMember':
                    return _.printf('%1$s added %2$s to the conversation', getName(data.originator), getNames(data.addedMembers));
                case 'removeMember':
                    return _.printf('%1$s removed %2$s from the conversation', getName(data.originator), getNames(data.removedMembers));
                case 'changeGroupImage':
                    return _.printf('%1$s changed the group image', getName(data.originator));
                case 'changeTitle':
                    return _.printf('%1$s changed the group title to "%2$s"', getName(data.originator), data.title);
                case 'changeDescription':
                    return _.printf('%1$s changed the group description to "%2$s"', getName(data.originator), data.description);
                case 'leftRoom':
                    return _.printf('%1$s left the conversation', getName(data.originator));
                case 'me':
                    return _.printf('%1$s %2$s', getName(data.originator), data.message);
                case 'text':
                    return data.message;
                default:
                    return _.printf('Unknown system message %1$s', data.type);
            }
        },

        getImage: function () {
            var url = data.API_ROOT + '/files/' + this.get('fileId') + '/thumbnail',
                placeholder = $('<div class="placeholder">').busy();

            if (_.isUndefined(this.get('fileId'))) return placeholder;

            $('<img>').on('load', function () {
                var $img = $(this),
                    oldHeight = placeholder.height();
                placeholder.replaceWith($img);
                $img.trigger('changeheight', { prev: oldHeight, value: $img.height() });
            }).attr('src', url)
            .attr({ 'data-cmd': 'show-message-file', 'data-id': this.get('roomId'), 'data-file-id': this.get('fileId') });
            return placeholder;
        },

        getFile: function (opt) {
            opt = _.extend({
                icon: true,
                download: true,
                text: true
            }, opt);

            var $elem = $('<div>').busy();
            $.ajax({
                url: data.API_ROOT + '/files/' + this.get('fileId'),
                xhrFields: { withCredentials: true }
            }).then(function (file) {
                $elem.replaceWith(
                    opt.icon ? $('<i class="fa icon">').addClass(util.getClassFromMimetype(file.mimetype)) : '',
                    opt.text ? $.txt(file.name) : '',
                    opt.download ? $('<a class="download">').attr({
                        href: data.API_ROOT + '/files/' + file.id + '/download/' + file.name,
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
            if (this.isImage() || this.isFile()) return this.getFile();
            return sanitizer.simpleSanitize(this.get('body'));
        },

        isSystem: function () {
            return this.get('type') === 'system';
        },

        isMyself: function () {
            return this.get('senderId') === data.user_id;
        },

        isImage: function () {
            return this.get('type') === 'image';
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
            return prev.get('senderId') === this.get('senderId');
        },

        updateDelivery: function (state) {
            var url = data.API_ROOT + '/delivery/' + this.get('id');
            $.ajax({
                method: 'POST',
                url: url,
                data: { state: state },
                xhrFields: { withCredentials: true }
            }).done(function () {
                this.set('state', state);
            }.bind(this));
        }
    });

    var MessageCollection = Backbone.Collection.extend({
        model: MessageModel,
        comparator: 'id',
        initialize: function (models, options) {
            this.roomId = options.roomId;
        },
        paginate: function (direction) {
            var id;
            if (direction === 'prev') id = this.first().get('id');
            else if (direction === 'next') id = this.last().get('id');

            return this.load({ id: id, direction: direction, limit: DEFAULT_LIMIT }, 'paginate');
        },
        load: function (params, type) {
            type = type || 'load';
            this.trigger('before:' + type);

            // special handling for search
            if (type === 'load' && this.messageId) {
                params = { direction: 'siblings', id: this.messageId, limit: DEFAULT_LIMIT };
                delete this.messageId;
            }

            if (!params.id) {
                if (!this.nextComplete) params.limit = DEFAULT_LIMIT;
                this.nextComplete = true;
                this.trigger('complete:next');
            }

            return $.ajax({
                url: this.url() + '?' + $.param(params),
                xhrFields: { withCredentials: true }
            })
            .then(function (list) {
                this.trigger(type);
                this.add(list);
                params.direction = params.direction || 'prev';
                if (params.direction === 'siblings') {
                    var index = _(list).findIndex({ id: params.id });
                    if (index < params.limit / 2 - 1) {
                        this.prevComplete = true;
                        this.trigger('complete:prev');
                    }
                    if (index < list.length - params.limit / 2 - 1) {
                        this.nextComplete = true;
                        this.tigger('complete:next');
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
        }
    });

    //
    // Chat
    //

    var ChatModel = Backbone.Model.extend({

        defaults: { open: true, type: 'group', unreadCount: 0 },

        initialize: function (attr) {
            var self = this;
            this.unset('messages', { silent: true });
            this.members = new MemberCollection(attr.members, { parse: true, roomId: attr.id });
            this.messages = new MessageCollection([], { roomId: attr.id });
            // forward specific events
            this.listenTo(this.members, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('member:' + name);
            });
            this.on('change:members', function () {
                this.members.set(this.get('members'), { parse: true, merge: true });
            });
            this.listenTo(this.messages, 'all', function (name) {
                if (/^(add|change|remove)$/.test(name)) this.trigger('message:' + name);
            });
            this.listenTo(this.messages, 'add', _.debounce(function () {
                function updateLastMessage() {
                    if (!this.messages.nextComplete) return;
                    this.set('lastMessage', _.extend({}, this.get('lastMessage'), lastMessage.toJSON()));
                }

                var lastMessage = this.messages.last();
                if (!lastMessage) return;

                if (!this.get('lastMessage') || this.get('lastMessage').id !== lastMessage.get('id') || !lastMessage.has('id')) {
                    if (!lastMessage.has('id')) self.listenToOnce(lastMessage, 'change:id', updateLastMessage.bind(this));
                    else updateLastMessage.call(this);
                }
            }, 10));
        },

        getTitle: function () {
            var user = data.users.getByMail(data.user.email);
            return this.get('title') || _(this.members.reject(user)).invoke('getName').sort().join('; ');
        },

        getLastMessage: function () {
            var last = this.get('lastMessage');
            if (!last) return '\u00a0';
            var message = new MessageModel(last);
            if (message.isFile() || message.isImage()) return message.getFile({ download: false });
            return message.getTextBody();
        },

        getLastMessageDate: function () {
            var last = this.get('lastMessage');
            if (!last || !last.sent) return '\u00a0';
            var date = moment(last.sent);
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
            return !!_(this.get('members')).findWhere({ email: email });
        },

        getLastSenderName: function () {
            var lastMessage = this.get('lastMessage');
            if (!lastMessage) return '';
            var sender = lastMessage.sender,
                member = data.users.getByMail(sender);
            if (!member) return;
            return member.getName();
        },

        isOpen: function () {
            return this.get('open');
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

        postMessage: function (attr, file) {
            var formData = new FormData();
            _.each(attr, function (value, key) {
                formData.append(key, value);
            });

            // add file
            if (file) formData.append('file', file);

            var model = this.messages.add(attr);
            model.save(attr, {
                data: formData,
                processData: false,
                contentType: false,
                xhrFields: { withCredentials: true }
            });
            model.set('sent', moment().toISOString());
            this.set('modified', +moment());
        },

        addMembers: function (emails) {
            var members = emails.map(function (email) { return { email: email }; });
            this.set('members', [].concat(this.get('members').concat(members)));

            return $.ajax({
                method: 'POST',
                url: this.members.url(),
                data: { members: emails },
                xhrFields: { withCredentials: true }
            });
        },

        toggle: function (state) {
            this.set('open', !!state).save({ open: !!state }, { patch: true });
        },

        sync: function (method, model, options) {
            options.xhrFields = _.extend({}, options.xhrFields, { withCredentials: true });
            return Backbone.Model.prototype.sync.call(this, method, model, options);
        }
    });

    var ChatCollection = Backbone.Collection.extend({

        model: ChatModel,
        comparator: function (model) { return -model.get('modified'); },
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
            var url = attr.id ? this.url() + '/' + attr.id : this.url();

            var collection = this,
                data = _.extend({
                    open: true, type: 'group'
                }, _(attr).pick('title', 'type', 'members', 'description', 'file', 'reference')),
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
                type: attr.id ? 'PATCH' : 'POST',
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
                type: 'POST',
                url: this.url() + '/state/' + roomId,
                processData: false,
                contentType: false,
                xhrFields: { withCredentials: true }
            }).then(function () {
                room.set('open', !room.get('open'));
            });
        },

        onChangeUnreadCount: function () {
            this.trigger('unseen', this.reduce(function (sum, model) {
                return sum + model.get('unreadCount');
            }, 0));
        },

        setCurrent: function (current) {
            this.currentChatId = current;
        },

        getCurrent: function () {
            return data.chats.get(this.currentChatId);
        },

        getOpen: function () {
            return this.filter({ open: true });
        },

        getHistory: function () {
            var list = [];
            this.filter({ open: false }).forEach(function (chat) {
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
                this.add([data], { parse: true });
            }.bind(this));
        },

        joinChannel: function (roomId) {
            var model = this.get(roomId);
            if (!model || !model.isChannel()) return;
            model.addMembers([data.user.email]);
            model.set({ joined: true, open: true });
        },

        leaveChannel: function (roomId) {
            var room = this.get(roomId);
            room.destroy();
        },

        parse: function (array) {
            array = [].concat(array);
            array.forEach(function (data) {
                data.modified = +moment(data.modified);
            });
            return array;
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

        getThumbnailUrl: function () {
            return data.API_ROOT + '/files/' + this.get('id') + '/thumbnail';
        },

        getPreviewUrl: function () {
            return data.API_ROOT + '/files/' + this.get('id') + '/preview';
        },

        isImage: function () {
            return /(jpg|jpeg|gif|bmp|png)/i.test(this.get('mimetype'));
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
            return data.API_ROOT + '/files/room/' + this.roomId;
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
            var socket = data.socket = io.connect(data.SOCKET);

            socket.on('alive', function () {
                console.log('Connected socket to server');
            });

            socket.on('message:change', function (roomId, messageId, state) {
                var room = data.chats.get(roomId);
                if (!room) return;

                var lastMessage = room.get('lastMessage') || {};
                // update state if necessary
                if (messageId === lastMessage.id && lastMessage.state !== state) {
                    lastMessage = _.extend({}, lastMessage, { state: state });
                    room.set('lastMessage', lastMessage);
                }

                room.messages.forEach(function (message) {
                    if (message.id > messageId) return;
                    if (message.get('state') === 'seen') return;
                    if (message.get('state') === 'client' && state === 'server') return;
                    message.set('state', state);
                });

            });

            socket.on('message:new', function (roomId, message) {
                // stop typing
                events.trigger('typing:' + roomId, message.sender, false);
                // fetch room unless it's already known
                data.chats.fetchUnlessExists(roomId).done(function (model) {
                    // add new message to room
                    var newMessage = new model.messages.model(message);

                    // either add message to chatroom or update last message manually
                    if (model.messages.nextComplete) model.messages.add(message);
                    else model.set('lastMessage', _.extend({}, model.get('lastMessage'), newMessage.toJSON()));

                    if (message.senderId.toString() !== data.user_id.toString()) {
                        model.set({ modified: +moment(), unreadCount: model.get('unreadCount') + 1 });
                    }

                    newMessage.updateDelivery('client');
                });
            });

            socket.on('user:change:state', function (email, state) {
                if (!data.users.length) return;
                var model = data.users.getByMail(email);
                if (model) model.set('state', state);
            });

            socket.on('typing', function (roomId, userId, state) {
                events.trigger('typing:' + roomId, userId, state);
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

        autologin: function () {
            return this.getUserId().catch(function () {
                return this.authenticateSilent();
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
