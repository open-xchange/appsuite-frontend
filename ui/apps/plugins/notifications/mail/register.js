/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('plugins/notifications/mail/register', [
    'io.ox/mail/api',
    'io.ox/core/extensions',
    'gettext!plugins/notifications'
], function (api, ext, gt) {

    'use strict';

    //add a badge to mailapp in the topbar
    ext.point('io.ox/core/notifications/badge').extend({
        id: 'mail',
        index: 100,
        register: function (baton) {
            var badge = baton.addBadge('io.ox/mail'),
                ids = new Backbone.Collection();/*,
                genericDesktopNotification= {
                    title: gt('New mails'),
                    body: gt("You've got new mails"),
                    icon: ''
                },
                specificDesktopNotification= function (model) {
                    var data = model.attributes,
                        from = data.from || [['', '']],
                                //#. %1$s mail sender
                                //#. %2$s mail subject
                                //#, c-format
                        message = gt('Mail from %1$s, %2$s', _.noI18n(util.getDisplayName(from[0])), _.noI18n(data.subject) || gt('No subject'));
                    return {
                        title: gt('New mail'),
                        body: message,
                        icon: ''
                    };
                };*/

            baton.setBadgeText('io.ox/mail', 12);
                                     //#. %1$d number of notifications
            badge.attr('aria-label', gt.format('%1$d unread mails', 0));

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

            //special add function to consider mails that might have been read elsewhere (didn't throw update:set-seen in appsuite)
            api.on('new-mail', function (e, recent, unseen) {
                ids.reset(unseen);
                baton.setBadgeText('io.ox/mail', ids.size());
                                         //#. %1$d number of notifications
                badge.attr('aria-label', gt.format('%1s unread mails', ids.size()));
            });

            api.on('refresh.unseen', function (e, list) {
                ids.add(list);
                baton.setBadgeText('io.ox/mail', ids.size());
                                         //#. %1$d number of notifications
                badge.attr('aria-label', gt.format('%1s unread mails', ids.size()));
            });

            api.on('deleted-mails update:set-seen', function (e, param) {
                if (_.isArray(param)) {
                    ids.remove(param);
                } else {
                    removeFolder(param);
                }

                baton.setBadgeText('io.ox/mail', ids.size());
                //#. %1$d number of notifications
                badge.attr('aria-label', gt.format('%1s unread mails', ids.size()));
                if (ids.length === 0) {
                    api.newMailTitle(false);
                }
            });

            api.checkInbox();
        }
    });

    return true;
});
