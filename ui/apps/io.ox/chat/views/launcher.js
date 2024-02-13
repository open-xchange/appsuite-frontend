/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/chat/views/launcher', [
    'io.ox/chat/data',
    'gettext!io.ox/chat',
    'settings!io.ox/core',
    'less!io.ox/chat/style'
], function (data, gt, coreSettings) {

    return Backbone.View.extend({

        tagName: 'button',
        className: 'launcher-btn btn btn-link apptitle',
        id: 'io-ox-chat-icon',
        attributes: { 'aria-label': gt('Chat') },

        events: {
            'click': 'onClick'
        },

        initialize: function () {
            this.badge = this.$('.chat-notification');
            this.listenTo(data.chats, 'add remove change:unreadCount', this.updateCounter);
            this.listenTo(coreSettings, 'change:apps/quickLaunch', this.updateLauncherVisibility);
        },

        render: function () {
            this.$el.attr('tabindex', -1).empty().append(
                $.icon('fa-comment', gt('Chat')),
                this.badge = $('<svg height="8" width="8" class="indicator chat-notification hidden" focusable="false"><circle cx="4" cy="4" r="4"></svg>')
            );
            this.updateLauncherVisibility();
            return this;
        },

        updateLauncherVisibility: function () {
            var chatIsInQuicklaunchers = _(String(coreSettings.get('apps/quickLaunch', '')).trim().split(/,\s*/)).contains('io.ox/chat/main');
            this.$el.toggle(!chatIsInQuicklaunchers);
        },

        updateCounter: function () {
            var count = data.chats.reduce(function (memo, model) {
                if (!model.isActive()) return memo;
                return memo + model.get('unreadCount');
            }, 0);

            if (count > 0) this.badge.toggleClass('hidden', false);
            else this.badge.toggleClass('hidden', true);

            // adds a badge when added to quick launch menu
            var app = ox.ui.apps.get('io.ox/chat');
            if (app) app.set('hasBadge', count > 0);
        },

        // not only used by this view.This function is reused by the quick launcher view if chat is in quick launch menu
        onClick: function () {
            var model = ox.ui.floatingWindows.findWhere({ app: 'io.ox/chat' });
            if (model) {
                model.trigger(model.get('minimized') === true ? 'open' : 'quit');
            } else {
                require(['io.ox/chat/main'], function (chat) {
                    chat.getApp().launch().done(function () {
                        this.getWindow().showApp();
                    });
                });
            }
        }
    });
});
