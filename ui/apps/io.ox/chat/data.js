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
    'io.ox/core/extensions',
    'io.ox/chat/api',
    'io.ox/chat/events',
    'io.ox/chat/formatting',
    'io.ox/contacts/api',
    'io.ox/switchboard/api',
    'io.ox/switchboard/presence',
    'io.ox/mail/sanitizer',
    'io.ox/chat/util',
    'io.ox/core/http',
    'io.ox/core/notifications',
    'settings!io.ox/chat',
    'gettext!io.ox/chat'
], function (ext, api, events, formatting, contactsApi, switchboardApi, presence, sanitizer, util, http, notifications, settings, gt) {

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
            var userModel = data.users.getByMail(data.user.email);
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

        isSystem: function () {
            return this.get('id') === 0;
        },

        isMyself: function () {
            var user = data.users.getByMail(data.user.email);
            return this === user;
        },

        getShortName: function () {
            return this.get('first_name') || this.getName();
        },

        getName: function () {
            var first = this.get('first_name'), last = this.get('last_name');
            if (first && last) return first + ' ' + last;
            return first || last || this.get('email') || '\u00a0';
        },

        getEmail: function () {
            return this.get('email1') || this.get('email2') || this.get('email3');
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
                if (cache[email]) return cache[email];
                cache[email] = this.find(function (model) {
                    return model.get('email1') === email || model.get('email2') === email || model.get('email3') === email;
                });
                return cache[email];
            };
        }()),

        getName: function (email) {
            var model = this.getByMail(email);
            return model ? model.getName() : '';
        },

        getShortName: function (email) {
            var model = this.getByMail(email);
            return model ? model.getShortName() : '';
        }
    });

    data.users = new UserCollection([]);

    data.fetchUsers = function () {
        return contactsApi.getAll({ folder: 6, columns: '1,20,501,502,524,555,556,557,606' }, false).then(function (result) {
            result = _(result).map(function (item) {
                return _.extend({
                    cid: _.cid(item),
                    id: item.internal_userid,
                    first_name: String(item.first_name || '').trim(),
                    last_name: String(item.last_name || '').trim(),
                    email: String(item.email1 || item.email2 || item.email3 || '').trim().toLowerCase(),
                    image: !!item.image1_url
                }, _(item).pick('email1', 'email2', 'email3'));
            });
            return data.users.reset(result);
        }).fail(function () {
            require(['io.ox/core/yell'], function (yell) {
                yell('error', gt('There was an error during authentication.'));
            });
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
            if (this.hasPreview()) return this.getFilesPreview();
            if (this.isFile()) return util.getFileText({ model: this });
            if (this.isDeleted()) return gt('This message was deleted');
            return this.getFormattedBody();
        },

        getFormattedBody: function () {
            return formatting.apply(this.get('content'));
        },

        getSystemMessage: function () {
            var event = JSON.parse(this.get('content') || '{}');
            var originator = this.get('sender'),
                members = event.members || [],
                // also support unjoined channels
                room = data.chats.get(this.get('roomId')) || data.channels.get(this.get('roomId'));

            if (!_.isArray(members) && _.isObject(members)) members = Object.keys(members);

            if (room.get('type') === 'channel' && event.type === 'members:added') event.type = 'channel:joined';
            if (event.type === 'members:removed' && members.length === 1 && members[0] === originator) event.type = 'room:left';

            var me = originator === data.user.email,
                originatorName = getName(originator),
                names = getNames(_.difference(members, [originator])),
                participantCount = _.difference(members, [originator]).length,
                outerElem = $('<div>'),
                baton = new ext.Baton({ model: this, event: event });

            ext.point('io.ox/chat/commands/render/' + event.type).invoke('render', outerElem, baton);

            var content = outerElem.prop('innerHTML');
            if (content) return content;

            switch (event.type) {
                case 'room:created':
                    if (me) return gt('You created this conversation');
                    //#. %1$s: name of the creator
                    return gt('%1$s created this conversation', originatorName);
                case 'channel:joined':
                    if (me) return gt('You joined the conversation');
                    //#. %1$s: name of the new participant
                    return gt('%1$s joined the conversation', getNames(members));
                case 'members:added':
                    //#. %1$s: name of the added participant or participants and can be a single name or a comma separated list of names
                    if (me) return gt.ngettext('You added %1$s to the conversation', 'You added %1$s to the conversation', participantCount, names);
                    //#. %1$s: name of the participant that added the new participant
                    //#. %2$s: name of the added participant or participants and can be a single name or a comma separated list of names
                    return gt.ngettext('%1$s added %2$s to the conversation', '%1$s added %2$s to the conversation', participantCount, originatorName, names);
                case 'members:removed':
                    //#. %1$s: name of the removed participant or participants and can be a single name or a comma separated list of names
                    if (me) return gt.ngettext('You removed %1$s from the conversation', 'You removed %1$s from the conversation', participantCount, names);
                    //#. %1$s: name of the participant that removed the other participant
                    //#. %2$s: name of the removed participant or participants and can be a single name or a comma separated list of names
                    return gt.ngettext('%1$s removed %2$s from the conversation', '%1$s removed %2$s from the conversation', participantCount, originatorName, names);
                case 'image:changed':
                    if (me) return gt('You changed the group image');
                    //#. %1$s: name of a chat participant
                    return gt('%1$s changed the group image', originatorName);
                case 'title:changed':
                    if (me) return gt('You changed the group title to "%1$s"', event.title);
                    //#. %1$s: name of a chat participant
                    //#. %2$s: the new title
                    return gt('%1$s changed the group title to "%2$s"', originatorName, event.title);
                case 'changeDescription':
                    if (me) return gt('You changed the group description to "%1$s"', event.description);
                    //#. %1$s: name of a chat participant
                    //#. %2$s: the new description
                    return gt('%1$s changed the group description to "%2$s"', originatorName, event.description);
                case 'room:left':
                    if (me) return gt('You left the conversation');
                    //#. %1$s: name of a chat participant
                    return gt('%1$s left the conversation', originatorName);
                case 'me':
                    // no need to translate this
                    return _.printf('%1$s %2$s', originatorName, event.message);
                case 'text':
                    return event.message;
                case 'decryption:failed':
                    //#. If it fails to load and decrypt a chat message a system message will be shown
                    return gt('Message could not be loaded');
                default:
                    if (event.text) return event.text;
                    //#. %1$s: messagetext
                    return gt('Unknown system message: %1$s', event.type);
            }
        },

        getFileUrl: function (file) {
            var room = data.chats.get(this.get('roomId'));
            if (room && room.isChannel()) return api.url + '/channels/' + this.get('roomId') + '/files/' + file.fileId;
            return api.url + '/files/' + file.fileId;
        },

        getTime: function () {
            // use time when this message was last changed or when it was created
            return moment(this.get('edited') || this.get('date')).format('LT');
        },

        getTextBody: function () {
            if (this.isSystem()) return this.getSystemMessage();
            if (this.isFile()) return util.getFileText({ model: this });
            return $.txt(sanitizer.simpleSanitize(this.get('content')));
        },

        isSystem: function () {
            return this.get('type') === 'system';
        },

        isMyself: function () {
            return this.get('sender') === data.user.email;
        },

        isDeleted: function () {
            return !!this.get('deleted');
        },

        isEdited: function () {
            return !!this.get('edited');
        },

        isEditable: function () {
            return !this.isSystem() && !this.isDeleted() && !this.isUploading();
        },

        isUploading: function () {
            return !!this.get('uploading');
        },

        isFailed: function () {
            return this.get('deliveryState') === 'failed';
        },

        isUser: function () {
            return !this.isSystem();
        },

        getType: function () {
            // always treat deleted messages as text
            if (this.get('deleted')) return 'text';
            if (this.isSystem()) return 'system';
            return 'text';
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
                    type: blob.type
                };
            }

            var file, url;
            if (this.get('files') && (file = this.get('files')[0])) {
                url = api.url + '/files/' + file.fileId;
                return {
                    id: file.fileId,
                    isBlob: false,
                    isImage: /^image\//.test(file.mimetype),
                    preview: file.preview,
                    name: file.name,
                    size: file.size || 0,
                    thumbnail: url + '/thumbnail',
                    type: file.mimetype,
                    url: url
                };
            }
        },

        isFile: function () {
            return !!(this.get('files') && this.get('files')[0]);
        },

        isEmoji: function () {
            return util.isOnlyEmoji(this.get('content'));
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
            return moment(this.get('date')).startOf('day').isSame(moment(prev.get('date')).startOf('day'));
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
            var endpoint = (data.chats.get(this.roomId) || data.channels.get(this.roomId)).isChannel() ? '/channels/' : '/rooms/';
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
            var model = this.get(obj.roomId);
            if (model) return model;
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

        defaults: {
            active: false,
            favorite: false,
            type: 'group',
            unreadCount: 0
        },

        idAttribute: 'roomId',

        urlRoot: function () {
            return api.url + '/rooms';
        },

        initialize: function (attr) {
            attr = attr || {};
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
            var members = _(this.members.reject(function (m) { return m.get('email1') === data.user.email; }));
            return this.get('title') || members.invoke('getName').sort().join('; ');
        },

        getLastMessage: function () {
            var last = this.get('lastMessage');
            if (!last) return '\u00a0';
            var message = new MessageModel(last);
            if (message.isFile()) return util.getFileText({ model: message, download: false });
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
            var sender = lastMessage.sender || lastMessage.get('sender'),
                member = data.users.getByMail(sender);
            if (!member) return;
            return member.getName();
        },

        getIconUrl: function () {
            if (!this.get('icon')) return;
            var endpoint = this.get('type') !== 'channel' ? '/rooms/' : '/channels/';
            return api.url + endpoint + this.get('roomId') + '/icon';
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
                default:
                    notifications.yell('error', gt('Something went wrong. Please try again.'));
                    break;
            }
        },

        postMessage: (function () {
            var lastDeferred = $.when();
            return function postMessage(attr, file) {
                var consumed = false, consume = function () { consumed = true; };
                // set this here such that message previews can identify the sender, but this will be ignored by the server
                attr.sender = data.user.email;
                events.trigger('message:post', { attr: attr, room: this, consume: consume });
                if (!consumed) {
                    lastDeferred = lastDeferred.then(function () {
                        return this.storeMessage(attr, file).catch(_.constant($.when()));
                    }.bind(this));
                }
                return lastDeferred;
            };
        }()),

        storeMessage: function (attr, file) {

            if (this.isNew()) return this.storeFirstMessage(attr, file);
            attr.roomId = this.get('roomId');

            var formData = util.makeFormData(_.extend({}, attr, { files: file }));
            if (file) attr = _.extend({ uploading: true, blob: file }, attr);
            var model = this.messages.add(attr, { merge: true, parse: true });

            // for debugging; you need this very often when working on pre-post message appearance
            if (ox.debug) {
                if (window.upload === false) return $.when();
                if (window.fail) {
                    model.set('deliveryState', 'failed').trigger('progress', 0);
                    return $.Deferred().reject();
                }
            }

            // model for files will be added to cache and this.messages via sockets message:new event. So no need to do it in the callback here. Temporary model is fine;
            return model.save(attr, {
                data: formData,
                processData: false,
                contentType: false
            })
            .then(
                function success() {
                    model.setInitialDeliveryState();
                    this.set('active', true);
                }.bind(this),
                function fail(response) {
                    // ignore "abort" by the user
                    if (response.statusText === 'abort') return;
                    this.handleError(response);
                    model.set('deliveryState', 'failed').trigger('progress', 0);
                }.bind(this)
            );
        },

        storeFirstMessage: function (attr, files) {
            var hiddenAttr = { message: attr.content, files: files, members: this.get('members') };
            delete attr.content;
            delete attr.members;
            return this.save(attr, { hiddenAttr: hiddenAttr }).then(function () {
                events.trigger('cmd', { cmd: 'show-chat', id: this.get('roomId') });
            }.bind(this), this.handleError.bind(this))
            .fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', gt('The message could not be sent.'));
                });
            });
        },

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
            this.set('favorite', !this.isFavorite());
            // TBD: update server-side
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
                return data;
            }.bind(this))
            .fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    if (method === 'create') yell('error', gt('The chat could not be started.'));
                    else if (method === 'update') yell('error', gt('The chat could not be updated.'));
                });
            });
        }
    });

    data.ChatModel = ChatModel;

    var ChatCollection = BaseCollection.extend({

        model: ChatModel,

        comparator: function (a, b) {
            if (!a.get('lastMessage')) return 0;
            if (!b.get('lastMessage')) return 0;
            return -util.strings.compare(a.get('lastMessage').messageId, b.get('lastMessage').messageId);
        },

        url: function () {
            return api.url + '/rooms';
        },

        initialize: function () {
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

        fetchUnlessExists: function (roomId) {
            var model = this.get(roomId);
            if (model) return $.when(model);
            return api.getChannelByType('rooms', roomId)
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
            members[data.user.email] = 'member';
            model.set({ active: true, members: members });
            data.chats.add(model);

            return api.joinChannel(roomId);
        },

        leaveChannel: function (roomId) {
            var room = this.get(roomId);
            return api.leaveRoom(roomId)
                .then(function () { room.set('active', false); })
                .fail(function () {
                    require(['io.ox/core/yell'], function (yell) {
                        yell('error', gt('The channel could not be left.'));
                    });
                });
        },

        leaveGroup: function (roomId) {
            return api.leaveRoom(roomId)
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
                var reference = room.get('reference');
                if (!reference) return;
                if (reference.type !== type) return;
                if (reference.id !== id) return;
                return false;
            });
        }
    });

    var ChannelCollection = ChatCollection.extend({
        url: function () {
            return api.url + '/channels';
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
            return this.get('files') ? /(jpg|jpeg|gif|bmp|png)/i.test(this.get('files')[0].mimetype) : /(jpg|jpeg|gif|bmp|png)/i.test(this.get('mimetype'));
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
                isChannel = roomId && data.chats.get(roomId).isChannel();
            if (isChannel) return api.url + '/channels/' + roomId + '/files/' + this.get('fileId') + 'thumbnail';
            return api.url + '/files/' + this.get('fileId') + '/thumbnail';
        },

        getFileUrl: function () {
            var roomId = this.collection.roomId,
                isChannel = roomId && data.chats.get(roomId).isChannel();
            if (isChannel) return api.url + '/channels/' + roomId + '/files/' + this.get('fileId');
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
            var isChannel = data.chats.get(this.roomId).isChannel();
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
            var newChats = data.chats.filter(function (model) { return model.isNew(); });
            $.when.apply($,
                _([data.chats, data.channels])
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
                });
            }).then(function () {
                data.chats.add(newChats, { at: 0 });
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

                if (room) room.messages.forEach(process);
            });

            socket.on('chat:message:new', function (attr) {
                var roomId = attr.roomId,
                    message = attr.message,
                    mySelf = message.sender === data.user.email;

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
                events.trigger('typing:' + event.roomId, event.email, event.state);
            });

            socket.on('chat:message:changed', function (message) {
                data.chats.fetchUnlessExists(message.roomId).done(function (room) {
                    var messageModel = room.messages.get(message.messageId);
                    if (messageModel) {
                        var typeChanged = message.type && messageModel.get('type') !== message.type;
                        // if this message changed type we do a silent change and trigger a messageChanged event.
                        // This way the message node is replaced fully instead of partial changes using multiple change listeners. We want avoid some strange half changed message nodes
                        messageModel.set(message, { silent: typeChanged });
                        if (typeChanged) events.trigger('message:changed', messageModel);
                    } else if (room.get('lastMessage').messageId === message.messageId) {
                        room.set('lastMessage', _.extend({}, room.get('lastMessage'), message));
                    }
                });
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
            return api.getUserId().then(function (chatUser) {
                data.user = chatUser;
                data.userSettings = new UserSettings(chatUser.settings);
                data.serverConfig = chatUser.config || {};
                this.set('userId', chatUser.id);
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

    ox.on('refresh^', function () {
        data.session.refresh();
    });

    //
    // Helpers
    //

    function getName(email) {
        return getNames([email]);
    }

    function getNames(list) {
        list = list.map(function (email) {
            var model = data.users.getByMail(email);
            var name = (model ? model.getName() : gt('Unknown user'));
            //#. shown instead of your name for your own chat messages when you're mentioned in a group of names
            if (email === data.user.email) name = gt('You');

            return name;
        });

        var and =
            //#. used to concatenate two participant names
            //#. make sure that the leading and trailing spaces are also in the translation
            gt(' and '),
            delimiter =
            //#. This delimiter is used to concatenate a list of participant names
            //#. make sure, that the trailing space is also in the translation
            gt(', ');

        list = list.length === 2 ? list.join(and) : list.join(delimiter);

        return $('<span class="name">').text(list).prop('outerHTML');
    }

    return data;
});
