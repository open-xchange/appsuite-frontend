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
    'io.ox/chat/views/chatListEntry'
], function (DisposableView, events, data, ChatListEntryView) {

    'use strict';

    var SearchResultView = DisposableView.extend({

        tagName: 'ul',
        className: 'search-result',

        initialize: function () {
            this.collection = new Backbone.Collection();
            this.listenTo(events, 'cmd:search', function (query) {
                this.search(query);
            });
            this.listenTo(this.collection, 'add remove reset', _.debounce(this.render.bind(this), 10));
        },

        render: function () {
            this.$el.parent().toggleClass('show-search', this.collection.length > 0);
            this.$el.empty().append(
                this.collection.map(function (model) {
                    return new ChatListEntryView({ model: model }).render().$el;
                })
            );
            return this;
        },

        search: function (query) {
            var url = data.API_ROOT + '/messages?' + $.param({ q: query }),
                regexQuery = new RegExp('(\\b' + escape(query) + ')', 'ig');
            $.getJSON(url).then(function (result) {
                var models = result.map(function (obj) {
                    obj.body = obj.body.replace(regexQuery, '<b class="search-highlight">$1</b>');

                    // find according room
                    var room = data.chats.get(obj.roomId);
                    if (!room) return;
                    room = room.clone();
                    room.set('lastMessage', obj);

                    return room;
                });
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
