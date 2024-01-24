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

define('io.ox/chat/notifications', [
    'io.ox/chat/events',
    'io.ox/core/active',
    'io.ox/switchboard/presence',
    'io.ox/chat/data',
    'io.ox/chat/client',
    'io.ox/contacts/api',
    'io.ox/chat/util',
    'io.ox/chat/util/url',
    'settings!io.ox/chat',
    'gettext!io.ox/chat'
], function (events, isActive, presence, data, client, contactsApi, util, url, settings, gt) {

    'use strict';

    // Look for new messages
    events.on('message:new', onMessageNew);

    function onMessageNew(e) {
        var model = e.message;
        // debug
        if (ox.debug) console.debug('new message', model);
        // don't notify on your own or system messages
        if (model.isMyself() || model.isSystem()) return;
        // don't notify if busy
        if (presence.getMyAvailability() === 'busy') return;
        // don't notify if the user is currently active and the UI is not hidden
        var win = ox.ui.floatingWindows.findWhere({ app: 'io.ox/chat' }),
            active = isActive() && win && !win.get('minimized'),
            alwaysPlay = settings.get('sounds/playWhen') === 'always';
        // treat sound and desktop notifications differently
        if (!active || alwaysPlay) playSound();
        if (!active) showNotification(e);
    }

    //
    // Sound
    //

    var playSound = (function () {

        var audio, current;

        function play(name) {
            if (name !== current) {
                current = name;
                audio = new Audio(ox.base + '/apps/io.ox/chat/sounds/' + name);
                audio.volume = 0.4;
            }
            try {
                if (!audio) return;
                // IE11 does not return a promise
                var promise = audio.play();
                if (promise && promise.catch) promise.catch(_.noop);
            } catch (e) {
                // play() might throw an exception if the browser is inactive for too long
                if (ox.debug) console.error(e);
            }
        }

        // audio preview when changing sounds in settings
        settings.on('change:sounds/file', function (file) {
            if (_.device('smartphone')) return;
            play(file);
        });

        return _.throttle(function () {
            if (!settings.get('sounds/enabled')) return;
            play(settings.get('sounds/file'));
        }, 600);

    }());

    //
    // Native Desktop Notifications
    //

    var showNotification = (function () {

        function getIcon(model, opt) {
            var def = new $.Deferred(),
                iconFallback = opt.isMultiple
                    ? ox.base + '/apps/themes/default/fallback-image-group.png'
                    : ox.base + '/apps/themes/default/fallback-image-contact.png';
            if (opt.isMultiple) {
                if (model.get('iconId')) {
                    url.request(model.getIconUrl()).then(function (icon) {
                        def.resolve(icon);
                    });
                } else {
                    def.reject(iconFallback);
                }
            } else {
                var icon = contactsApi.pictureHalo(null, { email: opt.message.get('sender') }, { urlOnly: true, width: 120, height: 120, scaleType: 'containforcedimension' });
                $(new Image()).one('load error', function (e) {
                    if (this.width === 1 || e.type === 'error') return def.reject(iconFallback);
                    def.resolve(icon);
                }).attr('src', icon);
            }
            return def;
        }

        function getBody(opt) {
            var previewLength = settings.get('notificationPreviewLength', 100),
                fileContent, body;

            // decide which file emoticon to use depending on mimetype
            if (opt.message.get('type') === 'file') {
                switch (util.getClassFromMimetype(opt.message.get('file').mimetype)) {
                    case 'image':
                        fileContent = '📷 ' + gt('Picture');
                        break;
                    default:
                        fileContent = '📄 ' + opt.message.get('file').name;
                        break;
                }
            }
            body = fileContent ? fileContent : opt.message.getContent();
            if (opt.isMultiple) body = opt.originator + ': ' + body; // prepend name to body if from group
            if (body.length > previewLength) body = body.slice(0, previewLength) + '...';

            return body;
        }

        return _.throttle(function (e) {
            if (!settings.get('showChatNotifications')) return;
            var model = e.room,
                opt = {
                    isMultiple: model.isGroup() || model.isChannel(),
                    message: e.message,
                    originator: data.users.getByMail(e.message.get('sender')).getName()
                };

            getIcon(model, opt).always(function (iconUrl) {
                var title = opt.isMultiple ? model.get('title') : opt.originator,
                    options = {
                        body: getBody(opt),
                        icon: iconUrl
                    };
                var notification = new Notification(title, options);
                notification.onclick = function () {
                    window.focus();
                    client.openChatById(model.get('roomId'));
                };
                return notification;
            });
        }, 600);
    }());
});
