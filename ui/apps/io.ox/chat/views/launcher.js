/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/views/launcher', ['io.ox/chat/data', 'less!io.ox/chat/style'], function (data) {

    return Backbone.View.extend({

        tagName: 'a',
        className: 'apptitle',
        id: 'io-ox-chat-icon',

        initialize: function () {
            this.$badge = $('<span class="badge">');

            this.listenTo(data.chats, 'add remove change:unreadCount', this.updateCounter);
        },

        render: function () {
            this.$el.attr('tabindex', -1).empty().append(
                $('<i class="fa fa-comment launcher-icon" aria-hidden="true">').attr('title', 'Chat'),
                this.$badge
            );
            return this;
        },

        updateCounter: function () {
            var count = data.chats.reduce(function (memo, model) {
                return memo + (model.get('unreadCount') || 0);
            }, 0);
            this.$badge.text(count || '');
        }

    });
});
