/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/socket', ['io.ox/chat/data'], function (data) {

    'use strict';

    if (2 > 1) return;

    // some random activity
    setTimeout(function () {

        var added = 0;

        function getChatTitle() {
            return ['Boring', 'Stupid', 'Useless', 'Awesome', 'Good', 'Hilarious'][_.random(5)] + ' ' +
                ['chat', 'conversation', 'talk', 'discussion', 'flame war', 'debating club'][_.random(5)];
        }

        function getTime() {
            return moment().format('LT');
        }

        function getMessage() {
            return ['Hi', 'Hello', 'Lorem ipsum', 'Just a test', 'Anyone here?', 'Yay 👍'][_.random(5)];
        }

        function getSystemMessage() {
            return ['This is a system message', 'Dave, this conversation can serve no purpose anymore.', 'Someone joines, someone leaves', 'You will get a cake', 'A useless system mesage'][_.random(4)];
        }

        function getImage() {
            return data.files[_.random(8)].url;
        }

        function getState() {
            return ['online', 'absent', 'busy', 'offline'][_.random(3)];
        }

        setInterval(function () {

            var chat;

            if (!data.chats.active.length) return;

            switch (_.random(9)) {

                case 0:
                    if (added++ > 2) return;
                    // add group chat
                    data.chats.active.add({
                        id: data.chats.active.length + 1,
                        type: 'group',
                        title: getChatTitle(),
                        members: [1, 2, 3].map(function (id) {
                            return data.users.get(id);
                        }),
                        messages: [
                            { id: 1, body: 'Hi', sender: 1, time: getTime(), delivery: 'seen' }
                        ],
                        unreadCount: 1
                    });
                    break;

                case 1:
                case 2:
                case 3:
                    // change status
                    var user = data.users.at(_.random(data.users.length - 1));
                    user.set('state', getState());
                    break;

                case 4:
                case 5:
                case 6:
                    // add message
                    chat = data.chats.active.at(_.random(data.chats.active.length - 1));
                    chat.messages.add({ id: chat.messages.length + 1, body: getMessage(), sender: _.random(1, 5), time: getTime() });
                    chat.set('unreadCount', chat.get('unreadCount') + 1);
                    break;

                case 7:
                    // add system message
                    chat = data.chats.active.at(_.random(data.chats.active.length - 1));
                    chat.messages.add({ id: chat.messages.length + 1, body: getSystemMessage(), type: 'system', sender: 0, time: getTime() });
                    chat.set('unreadCount', chat.get('unreadCount') + 1);
                    break;

                case 8:
                case 9:
                    // add image
                    chat = data.chats.active.at(_.random(data.chats.active.length - 1));
                    chat.messages.add({ id: chat.messages.length + 1, body: getImage(), type: 'image', sender: _.random(1, 5), time: getTime() });
                    chat.set('unreadCount', chat.get('unreadCount') + 1);
                    break;

                // no default
            }
        }, 5000);

    }, 5000);

});
