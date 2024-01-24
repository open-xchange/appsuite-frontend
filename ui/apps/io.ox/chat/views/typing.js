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

define('io.ox/chat/views/typing', [
    'io.ox/chat/events',
    'io.ox/chat/data',
    'io.ox/chat/api',
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/chat'
], function (events, data, api, DisposableView, gt) {

    'use strict';

    var instances = {};
    var THROTTLE = 5000;
    var TIMEOUT = THROTTLE * 2;

    function TypingTracker(roomId) {
        this.roomId = roomId;
        this.hash = {};
    }

    TypingTracker.prototype.show = function (email) {
        var model = data.users.getByMail(email);
        if (!model || model.isMyself()) return;
        this.reset(email);
        var name = model.getName();
        this.hash[email] = {
            nameText: name,
            nameHTML: '<span class="name">' + _.escape(name) + '</span>',
            timeout: setTimeout(function () {
                if (this.disposed) return;
                this.hide(email);
            }.bind(this), TIMEOUT)
        };
        this.render();
    };

    TypingTracker.prototype.hide = function (email) {
        this.reset(email);
        this.render();
    };

    TypingTracker.prototype.toggle = function (email, state) {
        if (state) this.show(email); else this.hide(email);
    };

    TypingTracker.prototype.reset = function (email) {
        if (!this.hash[email]) return;
        window.clearTimeout(this.hash[email].timeout);
        delete this.hash[email];
    };

    TypingTracker.prototype.render = function () {
        var namesText = _(this.hash).pluck('nameText').sort();
        var namesHTML = _(this.hash).pluck('nameHTML').sort();
        events.trigger('typing:' + this.roomId + ':summary', {
            text: this.getSummary(namesText),
            html: this.getSummary(namesHTML)
        });
    };

    TypingTracker.prototype.getSummary = function (names) {
        if (!names.length) return '';
        //#. %1$s is a member name
        if (names.length === 1) return gt('%1$s is typing ...', names[0]);
        //#. %1$s and %2$s are member names
        if (names.length === 2) return gt('%1$s and %2$s are typing ...', names[0], names[1]);
        //#. %1$s, %2$s, and %3$s are member names
        if (names.length === 3) return gt('%1$s, %2$s, and %3$s are typing ...', names[0], names[1], names[2]);
        //#. %1$s and %2$s are member names, %3$d is the number of further members
        return gt('%1$s, %2$s and %3$d others are typing ...', names[0], names[1], names.length - 2);
    };

    function getTracker(roomId) {
        if (!instances[roomId]) instances[roomId] = new TypingTracker(roomId);
        return instances[roomId];
    }

    events.on('typing', function (event) {
        var tracker = getTracker(event.roomId);
        tracker.toggle(event.userId, event.state);
    });

    var propagate = (function () {
        var throttles = {};
        return function (roomId) {
            // prevent typings for new private chats which have no roomId yet
            if (!roomId) return;
            var fn = throttles[roomId];
            if (!fn) fn = throttles[roomId] = _.throttle(api.typing.bind(api, roomId, true), THROTTLE, { trailing: false });
            fn(roomId);
        };
    }());

    var View = DisposableView.extend({
        className: 'typing',
        initialize: function (options) {
            this.roomId = options.roomId;
            this.listenTo(events, 'typing:' + this.roomId + ':summary', function (summary) {
                if (this.disposed) return;
                var visible = summary.html !== '';
                this.$el.toggle(visible).html(summary.html);
                if (visible) this.scrollIntoView();
            });
        },
        scrollIntoView: function () {
            var scrollpane = this.$el.closest('.scrollpane')[0];
            if (!scrollpane) return;
            if ((scrollpane.scrollTop + scrollpane.clientHeight) < (scrollpane.scrollHeight - 30)) return;
            this.$el[0].scrollIntoView(true);
        }
    });

    return {
        getTracker: getTracker,
        propagate: propagate,
        View: View
    };
});
