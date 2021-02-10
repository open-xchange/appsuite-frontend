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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/client', [], function () {

    'use strict';

    function launchApp() {
        return require(['io.ox/chat/main']).then(function (chat) {
            return chat.getApp().launch().then(function () {
                return this.getWindow().showApp();
            });
        });
    }

    var api = {

        // options
        // - title <string>
        // - members <array of email addresses>
        openChat: function (options) {
            launchApp().done(function (win) {
                var members = options.members;
                if (members.length === 1) return api.openPrivateChat(members[0]);
                require(['io.ox/chat/data'], function (data) {
                    var pimReference = options.pimReference;
                    var room = pimReference && data.chats.findByReference(pimReference.type, pimReference.id);
                    if (room) win.showChat(room.get('roomId'));
                    api.openGroupChat(options);
                });
            });
        },

        openPrivateChat: function (email) {
            launchApp().done(function (win) {
                win.openPrivateChat({ email: email });
            });
        },

        openGroupChat: function (options) {
            launchApp().done(function (win) {
                require(['io.ox/chat/actions/openGroupDialog']).then(function (openGroupDialog) {
                    openGroupDialog(options).then(function (id) {
                        win.showChat(id);
                    });
                });
            });
        },

        openChatByReference: function (pimReference) {
            launchApp().done(function (win) {
                require(['io.ox/chat/data'], function (data) {
                    var room = pimReference && data.chats.findByReference(pimReference.type, pimReference.id);
                    if (!room) return;
                    win.showChopenChatat(room.get('roomId'));
                });
            });
        },

        openChatById: function (id) {
            launchApp().done(function (win) {
                win.showChat(id);
            });
        }
    };

    return api;
});
