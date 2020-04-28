/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define.async('io.ox/switchboard/api', [
    'static/3rd.party/socket.io.slim.js',
    'io.ox/core/api/user',
    'io.ox/core/yell'
], function (io, userAPI, yell) {

    'use strict';

    var HOST = 'http://localhost:2337';

    var api = {

        // will both be set below
        socket: undefined,
        userId: undefined,
        domain: '',

        // just to make sure we always use the same string
        trim: function (userId) {
            return String(userId || '').toLowerCase().trim();
        },

        isMyself: function (id) {
            return this.trim(id) === this.userId;
        },

        isInternal: _.constant(false),

        propagate: function (type, to, payload) {
            var def = $.Deferred();
            this.socket.emit('propagate', { type: type, to: to, payload: payload }, function (result) {
                def.resolve(result);
            });
            return def;
        }
    };

    return userAPI.get().then(function (data) {
        api.userId = api.trim(data.email1 || data.email2 || data.email3);
        // create a simple heuristic based on domain
        // to check whether people are internal users
        var domain = api.userId.replace(/^.*?@/, ''),
            regexp = new RegExp('@' + _.escapeRegExp(domain) + '$', 'i');
        api.isInternal = function (id) {
            return regexp.test(id);
        };
        api.socket = io.connect(HOST + '/?userId=' + encodeURIComponent(api.userId))
            .once('connect', function () {
                console.log('%cConnected to switchboard service', 'background-color: green; color: white; padding: 8px;');
            })
            .on('disconnect', function () {
                console.log('Disconnected from switchboard service');
            })
            .on('reconnect', function () {
                console.log('Reconnecting to switchboard service');
            });
        // respond to wall messages
        api.socket.on('wall', function (from, to, payload) {
            yell({
                type: 'success',
                message: $('<div>').append(
                    $('<span>').text('New message'),
                    $('<br>'),
                    $('<b>').text(from),
                    $('<br>'),
                    $.txt(payload.message)
                ),
                duration: 60000
            });
        });
        return api;
    });
});
