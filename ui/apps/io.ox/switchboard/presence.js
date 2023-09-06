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

define('io.ox/switchboard/presence', [
    'io.ox/switchboard/api',
    'gettext!io.ox/switchboard',
    'settings!io.ox/switchboard'
], function (api, gt, settings) {

    'use strict';

    var users = {}, reconnect = false;

    var exports = {

        // returns jQuery node
        getPresenceString: function (userId) {
            var presence = this.getPresence(userId);
            return createPresenceNode(presence.availability, presence.id).append(
                $('<span class="availability">').text(this.getAvailabilityString(presence))
            );
        },

        // returns jQuery node
        getPresenceIcon: function (userId) {
            var presence = this.getPresence(userId);
            return createPresenceNode(presence.availability, presence.id);
        },

        getFixedPresenceIcon: function (availability) {
            return createPresenceIcon(availability);
        },

        // returns jQuery node
        getPresenceDot: function (userId) {
            var presence = this.getPresence(userId);
            return createPresenceNode(presence.availability, presence.id).addClass('dot');
        },

        getPresence: function (userId) {
            userId = api.trim(userId);
            if (!users[userId] && api.socket) {
                this.addUser(userId, 'offline');
                api.socket.emit('presence-get', userId, function (data) {
                    exports.changePresence(userId, data);
                });
            }
            return users[userId];
        },

        getAvailabilityString: function (presence) {
            switch (presence.availability) {
                case 'online':
                    return gt('Online now');
                case 'busy':
                    return gt('Busy');
                case 'absent':
                    return gt('Absent');
                case 'invisible':
                    return gt('Invisible');
                default:
                    if (!presence.lastSeen) return gt('Offline');
                    // get last seen in minutes from now
                    var duration = Math.ceil((_.now() - presence.lastSeen) / 60000);
                    // this minute
                    if (duration <= 1) return gt('Last seen a minute ago');
                    // less than 1 hour
                    //#. %1$d is number of minutes
                    if (duration < 60) return gt('Last seen %1$d minutes ago', duration);
                    // less than 24 hours -> time
                    //#. %1$s is a time (e.g. 11:29 am)
                    if (duration < 1440) return gt('Last seen at %1$s', moment(presence.lastSeen).format('LT'));
                    //#. %1$s is a date (eg. 09.07.2020)
                    return gt('Last seen on %1$s', moment(presence.lastSeen).format('L'));
            }
        },

        changePresence: function (userId, changes) {
            var presence = this.getPresence(userId);
            if (changes.availability === presence.availability) return;
            _.extend(presence, changes);
            var availability = presence.availability === 'invisible' ? 'offline' : presence.availability;
            // update all DOM nodes for this user
            var $el = $('.presence[data-id="' + $.escape(presence.id) + '"]')
                .removeClass('online absent busy offline')
                .addClass(availability);
            var title = this.getAvailabilityString(presence);
            $el.find('.icon').attr('title', title);
            $el.find('.availability').text(title);
            if (api.isMyself(userId)) exports.trigger('change-own-availability', presence.availability);
        },

        changeOwnAvailability: function (availability) {
            this.changePresence(api.userId, { availability: availability });
            settings.set('availability', availability).save();
            // share might (soon) be: all, context, domain, (white) list
            api.socket.emit('presence-change', { availability: availability, visibility: 'all' });
            // keep this line, even if it's double
            exports.trigger('change-own-availability', availability);
        },

        getMyAvailability: function () {
            return settings.get('availability', 'online');
        },

        addUser: function (userId, availability, lastSeen) {
            users[userId] = { id: userId, lastSeen: lastSeen || 0, availability: availability };
        },

        users: users
    };

    // i18n
    var names = {
        online: gt('Online'),
        absent: gt('Absent'),
        busy: gt('Busy'),
        offline: gt('Offline'),
        invisible: gt('Invisible')
    };

    // create svg-based template
    var tmpl = $(
        '<div class="presence">' +
        '<span class="icon" aria-hidden="true">' +
        '<svg viewbox="0 0 100 100" class="fa">' +
        '<text class="online" x="50" y="86" text-anchor="middle">\uf00c</text>' +
        '<text class="absent" x="50" y="86" text-anchor="middle">\uf017</text>' +
        '<text class="busy" x="50" y="86" text-anchor="middle">\uf068</text>' +
        '</svg></span></div>'
    );

    function createPresenceNode(availability, id) {
        return createPresenceIcon(availability).attr('data-id', id);
    }

    function createPresenceIcon(availability) {
        var className = availability === 'invisible' ? 'offline' : availability;
        return tmpl.clone()
            .addClass(className)
            .children('.icon').attr('title', names[availability]).end();
    }

    function updateUserPresences() {
        for (var userId in users) {
            if (ox.debug) console.log('Update presence for user:', userId);
            if (api.isMyself(userId)) continue;
            delete users[userId];
            exports.getPresence(userId);
        }
    }

    if (!api.socket) return exports;
    // respond to events

    api.socket.on('presence-change', function (userId, presence) {
        exports.changePresence(userId, presence);
    });


    api.socket.on('connect', function () {
        // emit own presence from user settings on connect
        exports.changeOwnAvailability(exports.getMyAvailability());
        // we will do all updates here and not in the reconnect handler (which fires too early)
        updateUserPresences();
        if (reconnect) {
            ox.trigger('refresh^');
            ox.trigger('switchboard:reconnect');
        }
    });

    api.socket.on('reconnect', function () {
        // all updates after a reconnect have to be done in the connect handler
        // as the reconnect event fires too early to update i.e. the user presence.
        // We only track the state of the reconnect here
        // Order of events is: disconnect, reconnect_attempt, reconnect, connect
        reconnect = true;
    });

    api.socket.on('disconnect', function () {
        for (var userId in users) {
            users[userId].availability = 'offline';
        }
        // update all DOM nodes for this user
        var $el = $('.presence:not(a[data-name="availability"] .presence)')
            .removeClass('online absent busy offline')
            .addClass('offline');
        var title = gt('Offline');
        $el.find('.icon').attr('title', title);
        $el.find('.availability').text(title);
        ox.trigger('switchboard:disconnect');
    });

    exports.addUser(api.userId, exports.getMyAvailability(), _.now());
    api.socket.emit('presence-get', api.userId, $.noop);
    // add an event hub. we need this to publish presence state changes
    _.extend(exports, Backbone.Events);

    return exports;
});
