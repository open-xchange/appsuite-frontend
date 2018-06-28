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

define('io.ox/chat/views/search', ['io.ox/backbone/views/disposable', 'io.ox/chat/events'], function (DisposableView, events) {

    'use strict';

    var SearchView = DisposableView.extend({

        className: 'search',

        events: {
            'keydown input': 'onKeydown'
        },

        render: function () {
            this.$el.append(
                $('<input type="text" spellcheck="false" autocomplete="false" placeholder="Search chat or contact">')
            );
            return this;
        },

        onKeydown: function (e) {
            if (e.which !== 13) return;
            e.preventDefault();
            var query = $(e.currentTarget).val();
            events.trigger('cmd:search', query);
        }
    });

    return SearchView;
});
