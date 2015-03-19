/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/notifications/mail/register', [
    'io.ox/mail/api',
    'io.ox/core/extensions',
    'io.ox/core/notifications/subview',
    'io.ox/mail/util',
    'gettext!plugins/notifications'
], function (api, ext, Subview, util, gt) {

    'use strict';

    ext.point('io.ox/core/notifications/mail/item').extend({
        draw: function (baton) {
            var data = baton.model.attributes,
                node = this,
                f = data.from || [['', '']],
                descriptionId = _.uniqueId('notification-description-');
            node.attr({
                'aria-describedby': descriptionId,
                'data-cid': _.cid(data),
                //#. %1$s mail sender
                //#. %2$s mail subject
                //#, c-format
                'aria-label': gt('Mail from %1$s %2$s', _.noI18n(util.getDisplayName(f[0])), _.noI18n(data.subject) || gt('No subject'))
            }).append(
                $('<span class="sr-only" aria-hiden="true">').text(gt('Press [enter] to open')).attr('id', descriptionId),
                $('<span class="span-to-div title">').text(_.noI18n(util.getDisplayName(f[0]))),
                $('<span class="span-to-div subject">').text(_.noI18n(data.subject) || gt('No subject')).addClass(data.subject ? '' : 'empty')
            );
        }
    });

    ext.point('io.ox/core/notifications/mail/footer').extend({
        draw: function (baton) {

            var size = baton.view.collection.size,
                more = size > (baton.view.model.get('max') || size);

            this.append($('<div class="open-app">').append(
                $('<button href="#" data-action="open-app" tabindex="1" class="btn btn-primary btn-sm">').text(
                        more ? gt('Show all %1$d messages in inbox', size) : gt('Show inbox')
                    ).on('click', function (e) {
                        e.preventDefault();
                        require('io.ox/core/notifications').hide();
                        ox.launch('io.ox/mail/main').done(function () {
                            // go to inbox
                            this.folder.set(api.getDefaultFolder(), { validate: true });
                        });
                    })
                )
            );
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'mail',
        index: 600,
        register: function () {

            var options = {
                    id: 'io.ox/mail',
                    api: api,
                    useListRequest: true,
                    title: gt('New Mails'),
                    extensionPoints: {
                        item: 'io.ox/core/notifications/mail/item',
                        footer: 'io.ox/core/notifications/mail/footer'
                    },
                    detailview: 'io.ox/mail/detail/view',
                    genericDesktopNotification: {
                        title: gt('New mails'),
                        body: gt("You've got new mails"),
                        icon: ''
                    },
                    specificDesktopNotification: function (model) {
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
                    },
                    hideAllLabel: gt('Hide all notifications for new mails.')
                },
                subview = new Subview(options);

            //special add function to consider mails that might have been read elsewhere (didn't throw update:set-seen in appsuite)
            api.on('new-mail', function (e, recent, unseen) {
                var whitelist = _(unseen).map(function (item) { return item.id; }),
                    collectionIds = _(subview.collection.models).map(function (item) { return item.attributes.id; }),
                    idsToRemove = _.difference(collectionIds, whitelist);

                if (idsToRemove.length > 0) {
                    //silent if mail are added later(prevent double draw))
                    subview.removeNotifications(idsToRemove, recent.length > 0);
                }
                subview.addNotifications(recent);

                if (subview.collection.models.length === 0) {
                    api.newMailTitle(false);
                }
            });

            // removes mails of a whole folder from notificationview
            function removeFolder(folder) {
                var ids = _.compact(_(subview.collection.models).map(function (item) {
                        if (item.attributes.folder_id === folder) {
                            return item.attributes.id;
                        }
                    }));
                if (ids.length > 0) {
                    subview.removeNotifications(ids);
                }
            }

            //mail has a special delete event
            api.on('deleted-mails update:set-seen', function (e, param) {
                if (_.isArray(param)) {
                    subview.removeNotifications(param);
                } else {
                    removeFolder(param);
                }
                if (subview.collection.models.length === 0) {
                    api.newMailTitle(false);
                }
            });

            api.checkInbox();

            //see why there's no move event anymore
            /*api.on('move', function (e, mails, newFolder) {
                if (!_.isArray(mails)) {
                    mails = [].concat(mails);
                }
                //moved out of Inbox
                if (newFolder !== 'default0/INBOX') {
                    subview.removeNotifications(mails);
                }
            });*/
        }
    });

    return true;
});
