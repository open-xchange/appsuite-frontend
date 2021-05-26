/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
