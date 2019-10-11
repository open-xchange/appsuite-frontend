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

        events: {
            'click': 'onClick'
        },

        initialize: function () {
            this.badge = this.$el.find('.chat-notification');

            this.listenTo(data.chats, 'add remove change:unreadCount', this.updateCounter);
        },

        render: function () {
            this.$el.attr('tabindex', -1).empty().append(
                $('<i class="fa fa-comment launcher-icon" aria-hidden="true">').attr('title', 'Chat'),
                this.badge = $('<svg height="8" width="8" class="indicator chat-notification hidden" focusable="false"><circle cx="4" cy="4" r="4"></svg>')
            );
            return this;
        },

        updateCounter: function () {
            var count = data.chats.reduce(function (memo, model) {
                if (!model.get('open')) return memo + (model.get('unreadCount') || 0);
            }, 0);

            if (count > 0) this.badge.toggleClass('hidden', false);
            else this.badge.toggleClass('hidden', true);
        },

        onClick: function () {
            var floatingWindow = $('.floating-window').has('.ox-chat');

            if ($('.ox-chat.columns').is(':visible')) {
                $('div.ox-chat').hide();
            } else if (floatingWindow.is(':visible')) {
                floatingWindow.hide();
            } else {
                require(['io.ox/chat/main'], function (win) {
                    win.showApp();
                });
            }
        }

    });
});
