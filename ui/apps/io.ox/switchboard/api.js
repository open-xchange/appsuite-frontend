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

define.async('io.ox/switchboard/api', [
    'static/3rd.party/socket.io.slim.js',
    'io.ox/core/api/user',
    'io.ox/contacts/util',
    'io.ox/core/http',
    'io.ox/core/uuids',
    'settings!io.ox/switchboard'
], function (io, userAPI, contactsUtil, http, uuids, settings) {

    'use strict';

    var api = {

        online: false,
        host: settings.get('host'),

        // will both be set below
        socket: undefined,
        userId: undefined,
        domain: '',
        token: undefined,

        // just to make sure we always use the same string
        trim: function (userId) {
            return String(userId || '').toLowerCase().trim();
        },

        isOnline: function () {
            return this.online;
        },

        isMyself: function (id) {
            return this.trim(id) === this.userId;
        },

        isGAB: function (baton) {
            // call/chat only works for users, so
            // make sure we are in global address book
            return baton.array().every(function (data) {
                return String(data.folder_id) === contactsUtil.getGabId() && data.email1;
            });
        },

        isInternal: _.constant(false),

        propagate: function (type, to, payload) {
            var def = $.Deferred();
            this.socket.emit('propagate', { type: type, to: to, payload: payload }, function (result) {
                def.resolve(result);
            });
            return def;
        },

        supports: function (type) {
            var host = api.host;
            switch (type) {
                case 'zoom':
                    if (!host) return false;
                    return host && !!settings.get('zoom/enabled');
                case 'jitsi':
                    if (!host) return false;
                    if (!settings.get('jitsi/enabled')) return false;
                    return !!settings.get('jitsi/host');
                case 'history':
                    return settings.get('callHistory/enabled', !!host);
                default:
                    return false;
            }
        },

        // no better place so far
        createJitsiMeeting: function () {
            var id = ['ox'].concat(uuids.asArray(5)).join('-');
            return { id: id, joinURL: settings.get('jitsi/host') + '/' + id };
        },

        getConference: function (conferences) {
            if (!_.isArray(conferences) || !conferences.length) return;
            // we just consider the first one
            var conference = conferences[0];
            var params = conference.extendedParameters;
            if (!params || !params['X-OX-TYPE']) return;
            return {
                id: params['X-OX-ID'],
                joinURL: conference.uri,
                owner: params['X-OX-OWNER'],
                params: params,
                type: params['X-OX-TYPE']
            };
        }
    };

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

    return userAPI.get().then(function (data) {
        api.userId = api.trim(data.email1 || data.email2 || data.email3);
        // create a simple heuristic based on domain
        // to check whether people are internal users
        var domain = api.userId.replace(/^.*?@/, ''),
            regexp = new RegExp('@' + _.escapeRegExp(domain) + '$', 'i');
        api.isInternal = function (id) {
            return regexp.test(id);
        };
        return reconnect().then(function () {
            return api;
        });
    });

});
