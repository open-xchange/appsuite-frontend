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

define('io.ox/switchboard/wall', [
    'io.ox/switchboard/presence',
    'io.ox/switchboard/api',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'gettext!io.ox/switchboard',
    'less!io.ox/switchboard/style'
], function (presence, api, contactsAPI, contactsUtil, ext, actionsUtil, gt) {

    'use strict';

    var Wall = Backbone.View.extend({
        className: 'wall',
        events: {
            'click .close': 'onClose',
            'click .reply': 'onReply'
        },
        initialize: function () {
            this.collection = new Backbone.Collection();
            this.listenTo(this.collection, 'add', this.addMessage);
            this.listenTo(this.collection, 'remove', this.removeMessage);
        },
        render: function () {
            $('body').append(this.$el);
            return this;
        },
        addMessage: function (model) {
            var from = model.get('from');
            this.$el.append(
                $('<div class="wall-message">').attr('data-cid', model.cid).append(
                    contactsAPI.pictureHalo($('<div class="contact-photo">'), { email: from }, { width: 40, height: 40 }),
                    presence.getPresenceIcon(from),
                    $('<div class="sender">').text(api.getUserName(from)),
                    $('<div class="content">').append(
                        $.txt(model.get('message')),
                        $('<a href="#" class="reply">').text(gt('Reply'))
                    ),
                    $('<div class="date">').text(moment(model.get('sent')).format('LT')),
                    $('<button type="button" class="close">').attr('aria-label', gt('Close')).append(
                        $('<span aria-hidden="true">&times;</span>')
                        .attr('title', gt('Close'))
                    )
                )
            );
        },
        removeMessage: function (model) {
            this.$('.wall-message[data-cid="' + model.cid + '"]').remove();
        },
        onClose: function (e) {
            var cid = $(e.currentTarget).closest('.wall-message').data('cid');
            var model = this.collection.get(cid);
            if (model) this.collection.remove(model);
        },
        onReply: function (e) {
            e.preventDefault();
            var cid = $(e.currentTarget).closest('.wall-message').data('cid');
            var model = this.collection.get(cid);
            var data = { email1: model.get('from'), folder_id: contactsUtil.getGabId() };
            var baton = new ext.Baton({ data: [data] });
            actionsUtil.invoke('io.ox/switchboard/wall-user', baton);
        }
    });

    var wall = new Wall().render(),
        cid = 3;

    // respond to wall messages
    api.socket.on('wall', function (from, to, payload) {
        wall.collection.add({ message: payload.message, from: from, to: to, sent: _.now(), cid: cid++ });
    });
});
