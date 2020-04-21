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
], function (socket, userAPI, ModalDialog, sound) {

    'use strict';

    var io;

    function init() {
        userAPI.get().then(function (userData) {
            return userData.email1 || userData.email2 || userData.email3;
        }).then(connectSocket);
    }

    function connectSocket(user) {

        io = window.sock = socket.connect('http://localhost:2337');
        io.once('connect', function () {
            console.log('Connected to switchboard service');

            io.emit('user:online', user, io.id);

            io.on('call:incoming', function (data) {
                console.log('got data!', data);
                showDialog(data, 'Incoming call', 'Call from ' + data.caller);
                sound.playSound();
            });

            io.on('call:declined', function (data) {
                console.log('your call was declined by ', data.user);
                showDialog(data, 'Call declined', 'User ' + data.user + ' declined your call');

            });

            io.on('call:answered', function (data) {
                showDialog(data, 'Call started', 'User ' + data.user + ' answered your call! <jetzt videotelefonie machen>');
                console.log('your call is answered by', data.user);
            });
        });
        io.on('disconnect', function () {
            console.log('disconnect');
        });
    }

    function react(data) {
        io.emit(data.cancel ? 'call:decline' : 'call:answer', data);
    }

    function showDialog(data, title, text) {
        new ModalDialog({ title: title, description: text })
            .addCancelButton()
            .addButton({ label: 'OK', action: 'ok' })
            .on('ok', function () {
                react(data);
            })
            .on('cancel', function () {
                data.cancel = true;
                react(data);
            })
            .open();
    }

    init();

});
