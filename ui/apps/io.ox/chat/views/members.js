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
