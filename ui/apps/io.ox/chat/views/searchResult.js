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

define('io.ox/chat/views/searchResult', ['io.ox/backbone/views/disposable', 'io.ox/chat/events', 'io.ox/chat/data'], function (DisposableView, events, data) {

    'use strict';

    var SearchResultView = DisposableView.extend({

        tagName: 'ul',
        className: 'search-result',

        initialize: function () {
            this.listenTo(events, 'cmd:search', function (query) {
                this.search(query);
            });
        },

        render: function () {
            this.$el.hide();
            return this;
        },

        search: function (query) {
            var url = data.API_ROOT + '/messages?' + $.param({ q: query });
            $.getJSON(url).done(this.renderResult.bind(this, query));
        },

        renderResult: function (query, result) {
            this.regexQuery = new RegExp('(\\b' + escape(query) + ')', 'ig');
            this.$el.empty().append(
                _(result).map(this.renderItem, this)
            );
            this.$el.show();
        },

        renderItem: function (data) {
            var body = _.escape(_.ellipsis(data.body, { max: 200 })).replace(this.regexQuery, '<b>$1</b>');
            return $('<li>').html(body);
        }
    });

    // escape words for regex
    function escape(str) {
        return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    return SearchResultView;
});
