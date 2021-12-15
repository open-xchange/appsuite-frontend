/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('plugins/notifications/mail/register', [
    'io.ox/mail/api',
    'io.ox/core/extensions',
    'gettext!plugins/notifications',
    'io.ox/mail/util',
    'io.ox/core/settings/util',
    'io.ox/core/folder/api',
    'io.ox/core/api/account',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views',
    'io.ox/core/desktopNotifications',
    'io.ox/contacts/api',
    'settings!io.ox/mail',
    'io.ox/core/tk/sounds-util'
], function (api, ext, gt, util, formUtil, folderApi, account, cap, miniViews, desktopNotifications, contactsApi, settings, soundUtil) {

    'use strict';

    var lastCount = -1,
        DURATION = 5 * 1000, // miliseconds to show the notification
        iconPath = ox.base + '/apps/themes/default/fallback-image-contact.png'; // fallbackicon shown in desktop notification

    function filter(model) {
        // ignore virtual/all (used by search, for example) and unsubscribed folders
        if (!model.get('subscribed') || (/^default0\/virtual/.test(model.id))) return false;
        return /^default0\D/.test(model.id) && !account.is('spam|confirmed_spam|trash|unseen', model.id) && (folderApi.getSection(model.get('type')) === 'private');
    }

    // show desktopNotification (if enabled) for a new mail
    function newMailDesktopNotification(message) {

        // some mailservers do not send extra data like sender and subject, check this here
        var text = message.subject || gt('No subject');

        // Dovecot has extra field "teaser"
        if (message.teaser) text += '\n\n' + message.teaser;
        // get email for picture halo
        var imageURL = message.email ? contactsApi.pictureHalo(null, {
            email: message.email }, { urlOnly: true, width: 120, height: 120, scaleType: 'containforcedimension' }) : iconPath;
        // check if user has an image, otherwise use fallback image
        $(new Image()).one('load error', function (e) {
            if (this.width === 1 || e.type === 'error') {
                // use fallback image
                imageURL = iconPath;
            }
            desktopNotifications.show({
                title: message.displayname || message.email || gt('New mail'),
                body: text,
                icon: imageURL,
                duration: DURATION,
                onclick: function () {
                    window.focus();
                    ox.launch('io.ox/mail/main', { folder: message.folder });
                }
            });
        }).attr('src', imageURL);
    }

    var update = _.debounce(function () {

        var app = ox.ui.apps.get('io.ox/mail') || ox.ui.apps.get('io.ox/mail/placeholder');
        if (!app) return;

        // get relevant folder models and sum up unread messages
        var count = _(folderApi.pool.models)
            .chain()
            .filter(filter)
            .reduce(function (sum, model) {
                return sum + (model && model.get('unread')) || 0;
            }, 0)
            .value();

        if (count !== lastCount) {
            api.trigger('all-unseen', count);
            lastCount = count;
        }

        app.set('hasBadge', count > 0);

        if (count > 0) {
            //#. %1$d number of unread mails
            app.set('tooltip', gt('%1$d unread', count));
        } else {
            app.unset('tooltip');
        }

    }, 100);

    // add a badge to mailapp in the topbar
    ext.point('io.ox/core/notifications/badge').extend({
        id: 'mail',
        index: 100,
        register: function () {
            folderApi.on('change:unread', update);
            folderApi.on('pool:add', update);
            update();
        }
    });

    var ids = new Backbone.Collection();

    // new mail title and desktop notifications
    // removes mails of a whole folder from notificationview
    function removeFolder(folder) {
        var mails = _.compact(_(ids.models).map(function (item) {
            if (item.attributes.folder_id === folder) {
                return item.attributes.id;
            }
        }));
        if (mails.length > 0) {
            ids.remove(mails);
        }
    }
    function checkNew(items) {
        var newItems = diff(items, ids.models);

        if (!newItems.length) return;
        // only show these if there is not already the websocket push listening
        // note if external accounts are checked, those don't use websockets, so ignore the capability in this case
        if (!settings.get('notificationsForExternalInboxes', false) && cap.has('websocket') && false) return;

        // if theres multiple items or no specific notification given, use the generic
        if (newItems.length > 1) {
            return desktopNotifications.show({
                title: gt('New mails'),
                body: gt('You have new mail'),
                icon: iconPath
            });
        }

        api.get(_.extend({}, newItems[0], { unseen: true })).then(function (data) {
            var from = data.from || [['', '']];
            var message = {
                email: from[0][1],
                displayname: util.getDisplayName(from[0]),
                subject: data.subject || gt('No subject')
            };
            newMailDesktopNotification(message);
        });

        function diff(items, models) {
            var hash = {};
            _(models).each(function (model) {
                hash[_.cid(model.pick('folder_id', 'id'))] = true;
            });
            return _(items).filter(function (item) {
                return !hash[_.cid(item)];
            });
        }
    }

    // special add function to consider mails that might have been read elsewhere (didn't throw update:set-seen in appsuite)
    api.on('new-mail', function (e, recent, unseen) {
        var whitelist = _(unseen).map(function (item) { return item.id; }),
            collectionIds = _(ids.models).map(function (item) { return item.attributes.id; }),
            idsToRemove = _.difference(collectionIds, whitelist);

        if (idsToRemove.length > 0) {
            ids.remove(idsToRemove);
        }

        checkNew(recent);
        ids.add(recent);

        if (ids.models.length === 0) {
            api.newMailTitle(false);
        }
    });

    api.on('deleted-mails update:set-seen', function (e, param) {
        if (_.isArray(param)) {
            ids.remove(param);
        } else {
            removeFolder(param);
        }

        if (ids.length === 0) {
            api.newMailTitle(false);
        }
    });

    api.checkInbox();

    // play sound and/or show notification on new mail
    ox.on('socket:mail:new', function (message) {
        // update counters
        update();
        // play sound
        if (settings.get('playSound')) soundUtil.playSound();
        // show notification
        newMailDesktopNotification(message);
    });

    return true;
});
