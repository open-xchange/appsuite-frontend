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
 */

define('io.ox/switchboard/main', [
    'static/3rd.party/socket.io.slim.js',
    'io.ox/core/api/user',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/sounds-util'
], function (socket, userAPI) {

    'use strict';

    var io, HOST = 'http://localhost:2337',
        call = new Backbone.Model();
    // introduce call model

    function init() {
        if (io && io.connected) return $.then();
        return userAPI.get().then(function (userData) {
            return userData.email1 || userData.email2 || userData.email3;
        }).then(connectSocket);
    }

    function connectSocket(user) {
        var def = $.Deferred();
        io = socket.connect(HOST + '/?user=' + encodeURIComponent(user));
        io.once('connect', function () {
            console.log('Connected to switchboard service');

            io.on('propagate', function (event, from, payload) {
                api.trigger('propagate', event, from, payload);
                console.log('got event from server', event, from, payload);
            });
            def.resolve(io.id);

        });
        io.on('disconnect', function () {
            console.log('Disconnected from switchboard service');
        });
        io.on('reconnect', function () {
            console.log('Reconnecting to switchboard service');
        });
        return def;
    }

    var api = {

        getPresence: function (user) {
            return $.ajax({
                url: HOST + '/presence/' + encodeURIComponent(user)
            });
        },
        call: function (user, data) {
            if (call) return api.cancel();
            var def = $.Deferred();
            io.emit('propagate', {
                event: 'call',
                to: user,
                payload: data
            }, function (state) {
                call = { user: user, payload: data };
                def.resolve(state, call);
            });
            return def;
        },
        cancel: function () {
            if (!call) return $.then();
            var def = $.Deferred();
            // cancel current active call
            io.emit('propagate', {
                event: 'cancel',
                to: call.user,
                payload: call.data
            }, function (state) {
                call = null;
                return def.resolve(state);
            });
        },
        answer: function () {
            // anwer an incoming call
        },
        decline: function () {
            // decline incoming call
        }
    };

    init();

    _.extend(api, Backbone.Events);
    return api;
});
