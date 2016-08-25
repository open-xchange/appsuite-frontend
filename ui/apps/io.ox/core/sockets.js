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

    var socket, URI = ox.abs + '/socket.io', isConnected = false;

    function connectSocket() {
        var def = $.Deferred();
        if (Modernizr.websockets && cap.has('websocket')) {
            // connect Websocket
            console.info('Connecting websocket');
            socket = io.connect(URI + '/?session=' + ox.session, { transports: ['websocket'] });
            socket.on('connect', function () {
                console.info('Websocket connected');
                isConnected = true;
                def.resolve(socket);
            });
            socket.on('disconnect', function () {
                console.info('Websocket disconnected');
                isConnected = false;
            });
        } else {
            console.info('No websocket support, connection not possible.');
            def.reject();
        }
        return def;
    }

    function getSocket() {
        if (socket === undefined) {
            return connectSocket();
        }
        return $.Deferred().resolve(socket);
    }

    // getSocket will return a connected socket
    return {
        connect: connectSocket,
        isConnected: isConnected,
        getSocket: getSocket
    };
});
