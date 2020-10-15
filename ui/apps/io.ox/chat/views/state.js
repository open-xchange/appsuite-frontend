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

define('io.ox/chat/views/state', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/data',
    'io.ox/switchboard/presence',
    'io.ox/switchboard/api'
], function (DisposableView, data, presence, switchboardApi) {

    'use strict';

    var states = ['online', 'absent', 'busy', 'offline'];

    var StateView = DisposableView.extend({

        tagName: 'span',
        className: 'fa state',

        initialize: function () {
            switchboardApi.socket.on('presence-change', function (userId, presence) {
                if (this.model && this.model.get('email1') === userId) this.onChangeState(userId, presence.availability);
            }.bind(this));

            presence.on('change-own-availability', function () {
                if (this.model && this.model.get('email1') === data.user.email) this.onChangeState(data.user.email, presence.getMyAvailability());
            }.bind(this));
        },

        render: function () {
            if (this.model.get('email1') === data.user.email) this.$el = presence.getPresenceIcon(data.user.email);
            else this.$el = presence.getPresenceIcon(this.model.get('email1'));
            return this;
        },

        renderSimple: function () {
            if (this.model.get('email1') === data.user.email) this.$el.addClass(presence.getMyAvailability());
            else this.$el.addClass(presence.getPresence(this.model.get('email1')).availability);
            return this;
        },

        onChangeState: function (userId, state) {
            if (this.$el.hasClass('state')) this.$el.addClass(state).removeClass(_(states).without(state).join(' '));
            else this.$el = presence.getPresenceIcon(userId);
        }
    });

    return StateView;
});

