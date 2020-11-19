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

define('io.ox/chat/views/searchResult', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/events',
    'io.ox/chat/data',
    'io.ox/chat/views/chatListEntry',
    'io.ox/chat/api',
    'gettext!io.ox/chat',
    'static/3rd.party/jquery.mark.min.js'
], function (DisposableView, events, data, ChatListEntryView, api, gt) {

    'use strict';

    var SearchResultView = DisposableView.extend({

        tagName: 'ul',
        className: 'search-result chat-list',
        attributes: {
            role: 'listbox',
            'aria-label': gt('Chat search results')
        },

        initialize: function () {
            this.collection = new Backbone.Collection();
            this.listenTo(events, 'cmd:search', function (query) {
                this.query = query;
                this.search(query);
            });
            this.listenTo(this.collection, 'add remove reset', _.debounce(this.render.bind(this), 10));
        },

        render: function () {
            this.$el.parent().toggleClass('show-search', !!this.query);
            var nodes = this.collection.map(function (model) {
                return new ChatListEntryView({ model: model, density: 'detailed', showTyping: false }).$el;
            });
            this.$el.empty().append(nodes);
            if (this.collection.length === 0) {
                this.$el.append(
                    $('<li class="no-results" role="option" tabindex="0">').text(gt('No search results'))
                );
            } else {
                nodes[0].attr('tabindex', 0);
                $('.search-result .last-message').mark(this.query);
            }
            return this;
        },

        searchAddresses: function (query) {
            return require(['io.ox/contacts/addressbook/popup']).then(function (picker) {
                return picker.getAllMailAddresses({ useGABOnly: false, lists: false }).then(function (res) {
                    return picker
                        .search(query, res.index, res.hash, true)
                        .filter(function (user) {
                            // filter own user
                            return user.email !== data.user.email &&
                            // internal users are only identified by email1
                            user.field === 'email1' || user.user_id === 0;
                        });
                });
            });
        },

        searchTitles: function (query) {
            var regexQuery = new RegExp('(\\b' + _.escapeRegExp(query) + ')', 'i');
            var collection = data.chats
                .filter(function (model) { return regexQuery.test(model.get('title')); })
                .map(function (model) { return model.clone(); });
            return collection;
        },

        search: function (query) {
            if (!query) return this.collection.reset();
            query = query.trim();
            $.when(
                api.elasticSearch(query),
                this.searchAddresses(query),
                this.searchTitles(query)
            ).then(function (messages, addresses, rooms) {
                var ids = {};
                var chatsByMessage;
                var models = [];
                if (messages.length > 0) {
                    chatsByMessage = messages.map(function (message) {
                        // find appropriate room
                        var room = data.chats.get(message.roomId);
                        if (!room) return;
                        room = room.clone();
                        room.set('lastMessage', message, { silent: true });
                        room.set('searchResult', true);
                        ids[room.get('id')] = true;
                        return room;
                    });
                    models = models.concat(chatsByMessage);
                }

                var chatsByAddress = addresses.map(function (address) {
                    // find according room
                    var room = data.chats.find(function (model) {
                        if (model.get('type') !== 'private') return;
                        return _(model.get('members')).findWhere({ email: address.email });
                    });
                    if (room) return room;
                    var members = {};
                    members[data.user.email] = 'admin';
                    members[address.email] = 'member';
                    return new data.ChatModel({
                        lastMessage: { id: '1337', sender: '', content: gt('Create new chat'), type: 'text' },
                        members: members,
                        type: 'private',
                        unreadCount: 0
                    });
                }).filter(function (room) {
                    return !ids[room.get('id')];
                });

                models = models.concat(chatsByAddress).concat(rooms);
                models = _(models).compact();
                this.collection.reset(models);
            }.bind(this));
        }
    });

    return SearchResultView;
});
