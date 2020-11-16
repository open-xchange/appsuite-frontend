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

define('io.ox/chat/commands', [
    'io.ox/core/extensions',
    'io.ox/chat/events',
    'io.ox/switchboard/api',
    'io.ox/chat/data',
    'gettext!io.ox/chat'
], function (ext, events, api, data, gt) {

    'use strict';

    var regex = /^\s*\/(\w+)$/;

    events.on('message:post', function (e) {
        var match = regex.exec(e.attr.content);
        if (!match) return;
        events.trigger('message:command', { command: match[1], room: e.room, consume: e.consume });
    });

    events.on('message:command', function (e) {
        events.trigger('message:command:' + e.command, { room: e.room, consume: e.consume });
    });

    // built-in commands

    function startCall(type, e) {
        e.consume();
        var members = _(e.room.get('members')).chain().keys().without(api.userId).value();
        require(['io.ox/switchboard/call/api'], function (call) {
            call.start(type, members).then(function (dialog) {
                dialog.on('call', function () {
                    var url = this.getJoinURL();
                    if (!url) return;
                    var caller = data.users.getName(api.userId) || api.userId;
                    //#. %1$s is a user name
                    var content = gt('%1$s is calling.', caller)
                        // \uD83D\uDCDE is phone receiver
                        + ' \uD83D\uDCDE\n'
                        //#. %1$s is a link
                        + gt('Please click the following link to join: %1$s', url);
                    e.room.postMessage({ command: type, content: JSON.stringify({ link: url, text: content }) });
                });
            });
        });
    }

    function printVersion(e) {
        e.consume();
        e.room.messages.add({ type: 'system',
            content: JSON.stringify({
                type: 'text',
                message: gt('Server version: %1$s', data.serverConfig.version)
            })
        }, { merge: true, parse: true });
    }

    ext.point('io.ox/chat/commands/register').extend({
        id: 'zoom',
        register: function () {
            this.on('message:command:zoom', startCall.bind(null, 'zoom'));
        }
    }, {
        id: 'jitsy',
        register: function () {
            this.on('message:command:jitsi', startCall.bind(null, 'jitsi'));
        }
    }, {
        id: 'version',
        register: function () {
            this.on('message:command:version', printVersion);
        }
    });
    ext.point('io.ox/chat/commands/register').invoke('register', events);

    function renderCall(baton) {
        var model = baton.model,
            event = baton.event,
            link = $('<a target="_blank" rel="noopener">').attr('href', event.link).text(event.link).prop('outerHTML'),
            caller = data.users.getName(model.get('sender')) || model.get('sender');

        if (!event.link) return;

        this.append(
            gt('%1$s is calling.', caller)
                // \uD83D\uDCDE is phone receiver
                + ' \uD83D\uDCDE\n'
                //#. %1$s is a link
                + gt('Please click the following link to join: %1$s', link)
        );
    }

    ext.point('io.ox/chat/commands/render/zoom').extend({
        render: renderCall
    });

    ext.point('io.ox/chat/commands/render/jitsi').extend({
        render: renderCall
    });
});
