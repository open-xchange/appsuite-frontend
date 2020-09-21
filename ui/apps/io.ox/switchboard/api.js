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
    'io.ox/core/uuids',
    'settings!io.ox/switchboard'
], function (io, userAPI, http, uuids, settings) {

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
                return data.folder_id === 6 && data.email1;
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
        },

        reconnect: function () {
            var self = this;
            return http.GET({
                module: 'token',
                params: { action: 'acquireToken' }
            })
            .then(function (data) {
                self.token = data.token;

                var appsuiteApiBaseUrl = settings.get('appsuiteApiBaseUrl', '');

                // Only send redirect uri if not default "/appsuite/api"
                var appsuiteUrl = new URL('https://' + api.host.replace(/^https?:\/\//, ''));
                var searchParams = appsuiteUrl.searchParams;
                searchParams.set('userId', api.userId);
                searchParams.set('token', data.token);
                if (ox.apiRoot !== '/appsuite/api') searchParams.set('appsuiteApiPath', ox.apiRoot);
                if (appsuiteApiBaseUrl) searchParams.set('appsuiteApiBaseUrl', appsuiteApiBaseUrl);

                api.socket = io(appsuiteUrl.href, {
                    transports: ['websocket'],
                    reconnectionAttempts: 20,
                    reconnectionDelayMax: 10000 // 10 min. max delay between a reconnect (reached after approx. 10 retries)
                })
                .once('connect', function () {
                    console.log('%cConnected to switchboard service', 'background-color: green; color: white; padding: 8px;');
                    api.online = true;
                })
                .on('disconnect', function () {
                    console.log('Switchboard: Disconnected from switchboard service');
                    api.online = false;
                })
                .on('reconnect', function (attemptNumber) {
                    console.log('Switchboard: Reconnected to switchboard service on attempt #' + attemptNumber + '.');
                    api.online = true;
                })
                .on('reconnect_attempt', function (attemptNumber) {
                    console.log('Switchboard: Reconnect attempt #' + attemptNumber);
                })
                .on('reconnect_failed', function () {
                    console.log('Switchboard: Reconnect failed. Giving up.');
                })
                .on('error', function () {
                    api.socket.close();
                    // 10 sec. + Random (0-9 sec)
                    setTimeout(function () {
                        api.reconnect();
                    }, 1000 * (10 + Math.floor(Math.random() * 10)));
                });
                return api.socket;
            });
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
        return api.reconnect().then(function () {
            return api;
        });
    });
});
