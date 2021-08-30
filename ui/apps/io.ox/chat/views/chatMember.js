/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/chat/views/chatMember', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/badge'
], function (DisposableView, BadgeView) {

    'use strict';

    var ChatMemberView = DisposableView.extend({

        className: 'chat-members-container',

        initialize: function () {
            this.listenTo(this.collection, { add: this.onAdd, remove: this.onRemove });
        },

        render: function () {
            this.$el.append(
                $('<ul class="members">').append(this.collection.map(this.renderMember, this))
            );
            return this;
        },

        renderMember: function (model) {
            if (model.isMyself()) return $();
            return $('<li>').append(new BadgeView({ model: model }).render().$el);
        },

        onAdd: function (model) {
            this.$('.members').append(this.renderMember(model));
        },

        onRemove: function (model) {
            this.$('[data-email="' + model.get('email') + '"]').parent().remove();
        }
    });

    return ChatMemberView;
});
