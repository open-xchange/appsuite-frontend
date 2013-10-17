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

define('plugins/notifications/mail/register',
    ['io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/core/extensions',
     'gettext!plugins/notifications'
    ], function (api, util, ext, gt) {

    'use strict';

    var numMessages = 10;

    ext.point('io.ox/core/notifications/mail/header').extend({
        draw: function (baton) {
            this.append(
                $('<legend class="section-title">').text(gt('New Mails'))
                .attr('focusId', 'mail-notification-'),//special attribute to restore focus on redraw
                $('<div class="notifications">'),
                $('<div class="open-app">').append(
                    $('<a role="button" href="#" data-action="open-app" tabindex="1" class="refocus" focus-id="mail-notification-open-app">').text(
                        baton.more ? gt('Show all %1$d messages in inbox', baton.size) : gt('Show inbox')
                    )
                )
            );
        }
    });

    function drawItem(node, data) {
        if (data) {
            var f = data.from || [['', '']];
            node.append(
                $('<div class="item refocus" tabindex="1" role="listitem">')
                    .attr({'focus-id': 'mail-notification-' + _.cid(data),//special attribute to restore focus on redraw
                           'data-cid': _.cid(data),
                            //#. %1$s mail sender
                            //#. %2$s mail subject
                            //#, c-format
                            'aria-label': gt('New Mail from %1$s %2$s. Press [enter] to open', _.noI18n(util.getDisplayName(f[0])), _.noI18n(data.subject) || gt('No subject'))
                          }).append(
                    $('<div class="title">').text(_.noI18n(util.getDisplayName(f[0]))),
                    $('<div class="subject">').text(_.noI18n(data.subject) || gt('No subject')).addClass(data.subject ? '' : 'empty')
                    // TODO: re-add teaser once we get this via getList(...)
                )
            );
        }
    }

    ext.point('io.ox/core/notifications/mail/item').extend({
        draw: function (baton) {
            drawItem(this, baton.data);
        }
    });

    var NotificationsView = Backbone.View.extend({

        className: 'notifications',
        id: 'io-ox-notifications-mail',
        events: {
            'click [data-action="open-app"]': 'openApp',
            'click .item': 'openMail',
            'keydown .item': 'openMail',
            'dispose .item': 'removeNotification' //seems to be unused
        },

        render: function () {

            var i = 0, size = this.collection.size(),
                $i = Math.min(size, numMessages),
                baton,
                mails = new Array($i),
                view = this;

            baton = ext.Baton({ view: view, size: size, more: size > $i });
            ext.point('io.ox/core/notifications/mail/header').invoke('draw', this.$el.empty(), baton);

            // draw placeholders
            for (i = 0; i < $i; i++) {
                mails[i] = api.reduce(this.collection.at(i).toJSON());
            }

            api.getList(mails).done(function (response) {
                view.$el.find('.item').remove();//remove mails that may be drawn already. ugly race condition fix
                // draw mails
                for (i = 0; i < $i; i++) {
                    baton = ext.Baton({ data: response[i], view: view });
                    ext.point('io.ox/core/notifications/mail/item').invoke('draw', view.$('.notifications'), baton);
                }
            });

            return this;
        },

        openMail: function (e) {
            if ((e.type !== 'click') && (e.which !== 13)) { return; }
            var cid = $(e.currentTarget).data('cid'),
                overlay = $('#io-ox-notifications-overlay'),
                sidepopup = overlay.prop('sidepopup'),
                cleanUp = function (e, mails) {
                    _(mails).each(function (obj) {
                        if (cid === _.cid(obj)) {
                            e.data.popup.close();
                        }
                    });
                };
            // toggle?
            if (sidepopup && cid === overlay.find('[data-cid]').data('cid')) {
                sidepopup.close();
            } else {

                // fetch proper mail first
                api.get(_.cid(cid)).done(function (data) {
                    require(['io.ox/core/tk/dialogs', 'io.ox/mail/view-detail'], function (dialogs, view) {
                        // open SidePopup without array
                        var detailPopup = new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay.empty())
                            .on('close', function () {
                                api.off('delete', cleanUp);
                                if (_.device('smartphone') && overlay.children().length > 0) {
                                    overlay.addClass('active');
                                } else if (_.device('smartphone')) {
                                    overlay.removeClass('active');
                                    $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
                                }
                                $('#io-ox-notifications .item').first().focus();//focus first for now
                            })
                            .show(e, function (popup) {
                                popup.append(view.draw(data));
                                if (_.device('smartphone')) {
                                    $('#io-ox-notifications').removeClass('active');
                                }
                                api.on('delete', {popup: detailPopup}, cleanUp);//if mail gets deleted we must close the sidepopup or it will show a blank page
                            });
                    });
                });
            }
        },

        openApp: function (e) {
            e.preventDefault();
            require('io.ox/core/notifications').hideList();
            ox.launch('io.ox/mail/main').done(function () {
                // go to inbox
                this.folder.set(api.getDefaultFolder(), {validate: true});
            });
        },

        removeNotification: function (e) {
            e.preventDefault();
            var cid = $(e.target).attr('data-cid'),
                idArray = cid.split('.');
            for (var i = 0; i < this.collection.length; i++) {
                if (this.collection.models[i].get('folder_id') === idArray[0] && this.collection.models[i].get('id') === idArray[1]) {
                    this.collection.remove(this.collection.models[i]);
                }
            }
        }
    });

    //minicache to store mails that are seen already
    //if mails are added to the notification collection after seen is triggered they are never set to seen correctly otherwise
    var seenMails = {};

    ext.point('io.ox/core/notifications/register').extend({
        id: 'mail',
        index: 200,
        register: function (controller) {
            var notifications = controller.get('io.ox/mail', NotificationsView);

            function addMails(e, mails, unseenMails) {//adds mails to notificationview and remove elsewhere read ones
                var mailsToAdd = [];
                //add new ones
                for (var i = 0; i < mails.length; i++) { //check if models for this mail are already present and not seen
                    if (!(notifications.collection._byId[mails[i].id]) && !(seenMails[mails[i].id])) {
                        mailsToAdd.push(mails[i]);
                    }
                }
                //remove elsewhere read ones
                var found  = [],
                    unseenArray = [],
                    mailsToRemove;
                _(notifications.collection.models).each(function (mail) {
                    found.push(mail.get('id'));
                });
                _(unseenMails).each(function (mail) {
                    unseenArray.push(mail.id);
                });
                mailsToRemove = _.difference(found, unseenArray);//mails in the collection that are not unseen need to be removed

                _(mailsToRemove).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id]);
                    seenMails[id] = true;//make sure this mail is not added again because it's seen already
                });
                _(mailsToAdd.reverse()).each(function (mail) {
                    notifications.collection.unshift(new Backbone.Model(mail), { silent: true });
                });
            }
            function removeMails(e, mails) {//removes mails from notificationview
                _(mails).each(function (mail) {
                    notifications.collection.remove(notifications.collection._byId[mail.id]);
                    seenMails[mail.id] = true;//make sure this mail is not added again because it's seen already
                });
            }
            function removeFolder(e, folder) {//removes mails of a whole folder from notificationview
                _(notifications.collection.models).each(function (mail) {
                    if (mail.get('folder_id') === folder) {
                        notifications.collection.remove(notifications.collection._byId[mail.id]);
                        seenMails[mail.id] = true;//make sure this mail is not added again because it's seen already
                    }
                });
            }

            api.on('new-mail', function (e, mails, unseenMails) {

                if (!_.isArray(mails)) mails = [].concat(mails);

                // diabolic testers might run this with some 10K of unread mails
                // this is irrelevant for practise, so we just consider the first 100 messages
                // that's still a lot to read / the number if not correct but we should get rid of it anyway
                addMails(e, mails.slice(0, 100), unseenMails);

                if (notifications.collection.length === 0) { // all mails read. remove new Mail title
                    api.newMailTitle(false);
                }
                notifications.collection.trigger('reset');
            });

            api.on('move', function (e, mails, newFolder) {
                if (!_.isArray(mails)) {
                    mails = [].concat(mails);
                }
                if (newFolder !== 'default0/INBOX') {//moved out of Inbox
                    removeMails(e, mails);
                }
            });

            api.on('delete update:set-seen', function (e, mails) {
                if (!_.isArray(mails)) {
                    mails = [].concat(mails);
                }
                if (mails.length > 0 && !mails[0].id) {//check if we have a folder seen action
                    removeFolder(e, mails[0].folder);
                } else {
                    removeMails(e, mails);
                }
                if (notifications.collection.length === 0) {//all mails read. remove new Mail title
                    api.newMailTitle(false);
                }

            });

            api.checkInbox();
        }
    });

    return true;
});
