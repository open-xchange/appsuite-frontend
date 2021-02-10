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

define('io.ox/chat/views/search', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/events',
    'io.ox/chat/util',
    'gettext!io.ox/chat'
], function (DisposableView, events, util, gt) {

    'use strict';

    var SearchView = DisposableView.extend({

        className: 'search',

        events: {
            'keyup input': 'onKeyup',
            'change input': 'onChangeInput',
            'click button': 'onClear'
        },

        initialize: function () {
            this.model = new Backbone.Model({ query: '' });
            this.listenTo(this.model, 'change:query', this.onChangeQuery);
        },

        render: function () {
            this.$el.append(
                //#. search (e.g. by name) for an already existing chat or start a new chat
                $('<input type="text" spellcheck="false" autocomplete="off" placeholder="' + gt('Search or start new chat') + '">').attr('aria-label', gt('Search or start new chat')),
                $('<button type="button" class="btn btn-link">').append(
                    util.svg({ icon: 'fa-times-circle' })
                )
            );
            return this;
        },

        onKeyup: function (e) {
            var query = $(e.currentTarget).val();
            if (e.which !== 13) return this.delayedSearch(query);
            e.preventDefault();
            this.model.set('query', query);
            var searchResult = $(e.currentTarget).closest('.chat-leftside').find('.search-result li');
            if (searchResult.length) searchResult.first().trigger('focus');
        },

        onChangeInput: function (e) {
            var query = $(e.currentTarget).val();
            this.delayedSearch(query);
        },

        delayedSearch: _.debounce(function (query) {
            this.model.set('query', query);
        }, 500),

        onChangeQuery: function () {
            this.delayedSearch.cancel();
            this.$el.toggleClass('closable', !!this.model.get('query'));
            events.trigger('cmd:search', this.model.get('query'));
        },

        onClear: function () {
            this.delayedSearch.cancel();
            this.$('input').val('');
            this.model.set('query', '');
        }

    });

    return SearchView;
});
