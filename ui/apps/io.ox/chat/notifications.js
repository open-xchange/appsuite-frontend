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
 */

define('io.ox/chat/notifications', [
    'io.ox/chat/api',
    'io.ox/chat/events',
    'io.ox/core/active',
    'io.ox/switchboard/presence',
    'io.ox/chat/data',
    'io.ox/contacts/api',
    'io.ox/chat/util',
    'io.ox/core/desktopNotifications',
    'io.ox/chat/emoji',
    'settings!io.ox/chat',
    'gettext!io.ox/chat'
], function (api, events, isActive, presence, data, contactsApi, util, desktopNotifications, emojis, settings, gt) {

    'use strict';
    var sound, current;
    function onMessageNew(e) {
        var model = e.message;
        // debug
        if (ox.debug) console.log('new message', model);
        // don't notify on your own messages
        if (model.isMyself()) return;
        // don't notify if the user is currently active and the UI is not hidden
        if (settings.get('sounds/playWhen') !== 'always' && (isActive() && !settings.get('hidden'))) return;
        // don't notify if busy
        if (presence.getMyAvailability() === 'busy') return;
        // play notification sound
        playSound();
        showNotification(e);
    }
    // load and return audio file
    var getAudio = function (fileName) {
        if (fileName !== current) {
            current = fileName;
            sound = new Audio(ox.base + '/apps/io.ox/chat/sounds/' + fileName);
        }
        return sound;
    };
    // Sound
    var playSound = _.throttle(function () {
        if (!settings.get('sounds/enabled')) return;
        try {
            getAudio(settings.get('sounds/file')).play();
        } catch (e) {
            console.error('Could not play notification sound');
        }
    }, 600);

    function getIcon(model, opt) {
        var def = new $.Deferred(),
            iconFallback = opt.isMultiple
                ? ox.base + '/apps/themes/default/fallback-image-group.png'
                : ox.base + '/apps/themes/default/fallback-image-contact.png';
        if (opt.isMultiple) {
            if (model.get('icon')) {
                api.requestBlobUrl({ url: model.getIconUrl() }).then(function (icon) {
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
            switch (util.getClassFromMimetype(opt.message.get('files')[0].mimetype)) {
                case 'image':
                    fileContent = emojis(':camera:') + ' ' + gt('Picture');
                    break;
                default:
                    fileContent = emojis(':page_facing_up:') + ' ' + opt.message.get('files')[0].name;
                    break;
            }
        }
        body = fileContent ? fileContent : opt.message.get('content');
        if (opt.isMultiple) body = opt.originator + ': ' + body; // prepend name to body if from group
        if (body.length > previewLength) body = body.slice(0, previewLength) + '...';

        return body;
    }

    // Native notification
    var showNotification = _.throttle(function (e) {
        if (!settings.get('showChatNotifications')) return;
        var notification = {},
            model = e.room,
            opt = {
                isMultiple: model.isGroup() || model.isChannel(),
                message: e.message,
                originator: data.users.getByMail(e.message.get('sender')).getName()
            };

        notification.body = getBody(opt);
        notification.title = opt.isMultiple ? model.get('title') : opt.originator;

        getIcon(model, opt).always(function (icon) {
            notification.icon = icon;
            desktopNotifications.show(notification);
        });
    }, 600);

    // Look for new messages
    events.on('message:new', onMessageNew);

    // audio preview when changing sounds in settings
    settings.on('change:sounds/file', function () {
        if (_.device('smartphone')) return;
        playSound();
    });
});
