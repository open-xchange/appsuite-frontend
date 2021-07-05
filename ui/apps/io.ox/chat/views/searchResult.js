/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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

        tagName: 'li',
        className: 'search-result chat-list',

        initialize: function () {
            this.collection = new Backbone.Collection();
            this.listenTo(events, 'cmd:search', function (query) {
                this.query = query;
                this.search(query);
            });
            this.listenTo(this.collection, 'add remove reset', _.debounce(this.renderItems.bind(this), 10));
        },

        render: function () {
            this.$el.append(
                $('<div class="sr-only">').text(gt('Chat search results')),
                this.$ul = $('<ul role="group">')
            );
            this.renderItems();
            return this;
        },

        renderItems: function () {
            this.$el.parent().toggleClass('show-search', !!this.query);
            var nodes = this.collection.map(function (model) {
                return new ChatListEntryView({ model: model, density: 'detailed', showTyping: false }).$el;
            });
            this.$ul.empty().append(nodes);
            if (this.collection.length === 0) {
                this.$ul.append(
                    $('<li class="no-results" role="presentation">').text(gt('No search results'))
                );
            } else {
                nodes[0].attr('tabindex', 0);
                this.$('.last-message').mark(this.query);
            }
        },

        searchAddresses: function (query) {
            return require(['io.ox/contacts/addressbook/popup']).then(function (picker) {
                return picker.getAllMailAddresses({ useGABOnly: false, lists: false }).then(function (res) {
                    return picker
                        .search(query, res.index, res.hash, true)
                        .filter(function (user) {
                            // filter own user
                            if (api.isMyself(user.email)) return false;
                            // internal users are only identified by email1
                            return user.field === 'email1' || user.user_id === 0;
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
            )
            .then(function (messages, addresses, rooms) {
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
                        ids[room.id] = true;
                        return room;
                    });
                    models = models.concat(chatsByMessage);
                }

                var duplicates = {};
                var chatsByAddress = addresses.map(function (address) {
                    // duplicate?
                    if (duplicates[address.email]) return;
                    duplicates[address.email] = true;
                    // find existing room
                    var room = data.chats.find(function (model) {
                        return model.isPrivate() && _(model.get('members')).any(function (value, email) {
                            return email === address.email;
                        });
                    });
                    if (room) return room;
                    // create dummy room
                    var members = {};
                    members[api.userId] = 'admin';
                    members[address.email] = 'member';
                    return new data.ChatModel({
                        lastMessage: { id: '1337', sender: '', content: gt('Start new chat'), type: 'text' },
                        members: members,
                        type: 'private',
                        unreadCount: 0,
                        searchDummy: true
                    });
                })
                .filter(function (room) {
                    return room && !ids[room.id];
                });

                models = models.concat(chatsByAddress).concat(rooms);
                models = _(models).compact();
                this.collection.reset(models);
            }.bind(this));
        }
    });

    return SearchResultView;
});
