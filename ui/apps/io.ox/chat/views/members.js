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

define('io.ox/chat/views/members', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/avatar',
    'io.ox/chat/data',
    'io.ox/chat/api',
    'io.ox/chat/util',
    'io.ox/switchboard/presence',
    'gettext!io.ox/chat'
], function (Disposable, AvatarView, data, api, util, presence, gt) {

    'use strict';

    return Disposable.extend({

        className: 'members',

        events: {
            'click .remove': 'onRemove'
        },

        initialize: function () {
            this.listenTo(this.collection, 'add remove reset', this.render);
        },

        renderEntry: function (model) {
            if (!model) return;
            return $('<li>').attr('data-id', model.id).append(
                $('<div class="picture">').append(
                    new AvatarView({ model: model }).render().$el,
                    presence.getPresenceIcon(model.id)
                ),
                $('<div class="center">').append(
                    $('<strong>').text(model.getName()),
                    $('<span>').text(model.id)
                ),
                !api.isMyself(model.id) && $('<div class="member-controls">').append(
                    $('<button class="remove">')
                        .attr('title', gt('Remove member'))
                        .append(util.svg({ icon: 'fa-times' }))
                )
            );
        },

        render: function () {
            this.$el.empty().append(
                $('<ul class="list-unstyled">').append(
                    this.renderEntry(
                        this.collection.find(function (entry) {
                            return api.isMyself(entry.id);
                        })
                    ),
                    this.collection.map(function (entry) {
                        if (api.isMyself(entry.id)) return;
                        return this.renderEntry(entry);
                    }.bind(this))
                )
            );
            return this;
        },

        onRemove: function (e) {
            var target = $(e.currentTarget),
                id = target.closest('li').attr('data-id'),
                model = this.collection.get(id);
            this.collection.remove(model);
        }
    });
});
