/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/sockets', ['static/3rd.party/socket.io.js', 'io.ox/core/capabilities'], function (io, cap) {
    'use strict';

    var socket,
        URI = _.url.hash('socket-uri') ? _.url.hash('socket-uri') : ox.abs,
        isConnected = false,
        supported = Modernizr.websockets && cap.has('websocket'),
        debug = _.url.hash('socket-debug') || ox.debug;

    function connectSocket() {
        var def = $.Deferred();
        // connect Websocket
        if (debug) console.log('Websocket trying to connect...');
        socket = io.connect(URI + '/?session=' + ox.session, { transports: ['websocket'] });

        socket.on('connect', function () {
            if (debug) console.log('Websocket connected!');
            isConnected = true;
            def.resolve(socket);
        });
        socket.on('disconnect', function () {
            if (debug) console.log('Websocket disconnected');
            isConnected = false;
        });
        socket.on('reconnect', function () {
            if (debug) console.log('Websocket was reconnected');
            isConnected = true;
        });
        socket.on('reconnecting', function () {
            if (debug) console.log('Websocket trying to reconnect');
        });
        socket.on('connect_error', function () {
            if (debug) console.log('Websocket connection error');
            def.reject();
        });
        socket.on('connect_timeout', function () {
            if (debug) console.log('Websocket connection timeout');
            def.reject();
        });

        // close socket on invalid session
        socket.on('session:invalid', function () {
            if (debug) console.log('Websocket disconnected due to invalid session');
            if (socket.connected) socket.close();
        });

        ox.on('relogin:required', function () {
            if (debug) console.log('Websocket disconnected due to invalid session');
            if (socket.connected) socket.close();
        });

        // reconnect socket on new session
        ox.on('relogin:success', function () {
            if (socket.disconnected) {
                if (debug) console.log('Websocket reconnecting with new session');
                if (socket.disconnected) {
                    // recreate URI to pass new session
                    socket.io.uri = URI + '/?session=' + ox.session;
                    socket.connect();
                }
            }
        });

        return def;
    }

    /**
     * returns a websocket which will be automatically connected if it's the first
     * call. All subsequent getSocket() calls will return the socket instance.
     * @return {[type]} Deferred object resolving with the socket.io object
     */
    function getSocket() {
        if (socket === undefined && supported) {
            return connectSocket();
        } else if (socket) {
            return $.Deferred().resolve(socket);
        }
        if (debug) console.log('No websocket support, connection not possible.');
        return $.Deferred().reject();
    }

    // getSocket will return a connected socket
    return {
        isConnected: isConnected,
        getSocket: getSocket
    };
});
