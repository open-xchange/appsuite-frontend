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

define('io.ox/chat/views/badge', [
    'io.ox/backbone/views/disposable',
    'io.ox/switchboard/presence'
], function (DisposableView, presence) {

    'use strict';

    var BadgeView = DisposableView.extend({

        tagName: 'span',
        className: 'user-badge',

        initialize: function () {
            this.listenTo(this.model, 'change:first_name change:last_name', this.onChangeName);
        },

        render: function () {
            var email = this.model.get('email');
            this.$el.append(
                presence.getPresenceDot(email),
                $('<a href="#" class="name">')
                    .attr({ 'data-cmd': 'open-private-chat', 'data-email': email })
                    .text(this.model.getShortName())
            );
            return this;
        },

        onChangeName: function () {
            this.$('.name').text(this.model.getShortName());
        }
    });

    return BadgeView;
});
