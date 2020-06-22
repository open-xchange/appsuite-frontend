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
    'io.ox/core/http',
    'settings!io.ox/core'
], function (io, userAPI, http, settings) {

    'use strict';

    var api = {

        host: settings.get('switchboard/host'),

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
        },

        getUserName: function (id) {
            // simple solution to get names
            return id.replace(/^([^.]+)\.([^.]+)@.+$/, '$1 $2');
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
        return http.GET({
            module: 'token',
            params: { action: 'acquireToken' }
        })
        .then(function (data) {

            api.socket = io(api.host + '/?userId=' + encodeURIComponent(api.userId) + '&token=' + data.token, { transports: ['websocket'] }) //io.connect(api.host + '/?userId=' + encodeURIComponent(api.userId) + '&token=' + data.token, { transports: ['websocket'] })
                .once('connect', function () {
                    console.log('%cConnected to switchboard service', 'background-color: green; color: white; padding: 8px;');
                })
                .on('disconnect', function () {
                    console.log('Disconnected from switchboard service');
                })
                .on('reconnect', function () {
                    console.log('Reconnecting to switchboard service');
                });
            return api;
        });
    });
});
