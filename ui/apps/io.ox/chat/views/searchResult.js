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
    'io.ox/chat/util',
    'gettext!io.ox/chat'
], function (DisposableView, events, data, ChatListEntryView, util, gt) {

    'use strict';

    var SearchResultView = DisposableView.extend({

        tagName: 'ul',
        className: 'search-result',
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
                return new ChatListEntryView({ model: model }).render().$el;
            });
            this.$el.empty().append(nodes);
            if (this.collection.length === 0) {
                this.$el.append(
                    $('<li class="no-results" role="option" tabindex="0">').text(gt('No search results'))
                );
            } else {
                nodes[0].attr('tabindex', 0);

            }
            return this;
        },

        searchAddresses: function (query) {
            return require(['io.ox/contacts/addressbook/popup']).then(function (picker) {
                return picker.getAllMailAddresses().then(function (res) {
                    return picker
                        .search(query, res.index, res.hash, true)
                        .filter(function (user) { return user.email !== data.user.email; });
                });
            });
        },

        searchTitles: function (query) {
            var regexQuery = new RegExp('(\\b' + escape(query) + ')', 'i');
            var collection = data.chats
                .filter(function (model) { return regexQuery.test(model.get('title')); })
                .map(function (model) { return model.clone(); });
            return collection;
        },

        searchMessages: function (query) {
            var url = data.API_ROOT + '/search/messages?' + $.param({ query: query });
            return util.ajax({ url: url })
                .then(function (data) {
                    if (!data || !data.hits) return [];
                    var result = [];
                    data.hits.forEach(function (hit) {
                        var message = hit._source;
                        if (message.type === 'system') return;
                        message.content = hit.highlight.content[0];
                        result.push(message);
                    });
                    return result;
                })
                .catch(function () {
                    return [];
                });
        },

        search: function (query) {
            if (!query) return this.collection.reset();
            $.when(
                this.searchMessages(query),
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

    // escape words for regex
    function escape(str) {
        return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    return SearchResultView;
});
