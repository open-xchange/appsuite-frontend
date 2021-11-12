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

define.async('io.ox/switchboard/api', [
    'static/3rd.party/socket.io.slim.js',
    'io.ox/core/http',
    'io.ox/switchboard/standalone/api',
    'settings!io.ox/switchboard'
], function (io, http, standalone, settings) {

    'use strict';

    var api = _.extend(standalone, {

        online: false,
        host: settings.get('host'),

        // will both be set below
        socket: undefined,
        token: undefined,

        isOnline: function () {
            return this.online;
        },

        propagate: function (type, to, payload) {
            var def = $.Deferred();
            this.socket.emit('propagate', { type: type, to: to, payload: payload }, function (result) {
                def.resolve(result);
            });
            return def;
        }
    });

    if (api.host && settings.get('zoom/enabled')) api.addSolution('zoom');

    // Allow querying for 'history' support, which is not a conference solution
    if (settings.get('callHistory/enabled', !!api.host)) {
        var standaloneSupports = api.supports;
        api.supports = function (type) {
            return type === 'history' || standaloneSupports(type);
        };
    }

    function reconnect() {

        return http.GET({
            module: 'token',
            params: { action: 'acquireToken' }
        })
        .catch(_.constant({}))
        .done(function (data) {

            if (data.token) {
                api.token = data.token;
            } else {
                console.error('Switchboard: Error during acquireToken!');
            }

            if (api.socket) {
                console.log('Switchboard: Reconnecting with new token', api.token);
                api.socket.io.opts.query.token = api.token;
                api.socket.connect();
                return;
            }

            var appsuiteApiBaseUrl = settings.get('appsuiteApiBaseUrl', '');
            var appsuiteUrl = 'https://' + api.host.replace(/^https?:\/\//, '').replace(/\/$/, '');
            var query = { userId: api.userId, token: api.token };
            // Only send redirect uri if not default "/appsuite/api"
            if (ox.apiRoot !== '/appsuite/api') query.appsuiteApiPath = ox.apiRoot;
            if (appsuiteApiBaseUrl) query.appsuiteApiBaseUrl = appsuiteApiBaseUrl;

            api.socket = io(appsuiteUrl, {
                query: query,
                // reconnect with a max delay of 5 minutes; no attempt limit
                reconnectionDelayMax: 5 * 60 * 1000,
                transports: ['websocket']
            })
            .once('connect', function () {
                console.log('%cConnected to switchboard service', 'background-color: green; color: white; padding: 4px 8px;');
            })
            .on('connect', function () {
                resetRetryDelay();
                api.online = true;
            })
            .on('disconnect', function () {
                console.log('Switchboard: Disconnected from switchboard service');
                api.online = false;
            })
            .on('reconnect', function (attemptNumber) {
                console.log('Switchboard: Reconnected to switchboard service on attempt #' + attemptNumber + '.');
            })
            .on('reconnect_attempt', function (attemptNumber) {
                console.log('Switchboard: Reconnect attempt #' + attemptNumber);
            })
            .on('reconnect_failed', function () {
                console.log('Switchboard: Reconnect failed. Giving up.');
            })
            .on('error', function (err) {
                if (ox.debug) console.error('Socket error:', err);
                // disconnect socket
                api.socket.disconnect();
                // continue unless acquireToken call fails (see OXUIB-525)
                if (api.token) retry();
            });
        });
    }

    // retry (and avoid duplicate calls)
    var retrying = false;
    // we start with 4 seconds and double the delay every attempt
    // 4s, 8s, 16s, 32s, 64s, 128s, 256s, 300s
    var retryDelay = 4;
    // maximum is 5 minutes
    var retryDelayMax = 300;

    function retry() {
        if (retrying) return;
        retrying = true;
        setTimeout(function () {
            retrying = false;
            retryDelay = Math.min(retryDelay * 2, retryDelayMax);
            reconnect();
        }, retryDelay * 1000);
    }

    function resetRetryDelay() {
        retryDelay = 4;
    }

    return reconnect().then(_.constant(api));

});
