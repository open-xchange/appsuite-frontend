/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
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

    ext.point('io.ox/core/notifications/mail/header').extend({
        draw: function () {
            this.append(
                $('<legend class="section-title">').text(gt('New Mails')),
                $('<div class="notifications">'),
                $('<div class="open-app">').append(
                    $('<a href="#" data-action="open-app">').text(gt('Show Inbox'))
                )
            );
        }
    });

    function drawItem(node, data) {
        var f = data.from || [['', '']];
        node.append(
            $('<div class="item">').attr('data-cid', _.cid(data)).append(
                $('<div class="title">').text(_.noI18n(util.getDisplayName(f[0]))),
                $('<div class="subject">').text(_.noI18n(data.subject)),
                $('<div class="content">').html(_.noI18n(api.beautifyMailText(data.attachments[0].content)))
            )
        );
    }

    function showMail(obj, node, model) {

        // fetch plain text mail; don't use cache
        api.get(obj, false).done(function (data) {
            //update model
            model.set(data);
            //draw
            drawItem(node, data);
        }).fail(function () {
            node.append(
                $.fail(gt('Couldn\'t load that email.'), function () {
                    showMail(obj, node, model);
                })
            );
        });
    }

    ext.point('io.ox/core/notifications/mail/item').extend({
        draw: function (baton) {
            //to avoid unnecessary requests check if the model is already complete, if not get it and fill in the missing data
            if (baton.model.get('attachments')) {//attachments contains the actual text
                drawItem(this, baton.model.attributes);
            } else {//mail model not complete
                var obj = _.extend(api.reduce(baton.model.toJSON()), { unseen: true, view: 'text' });
                showMail(obj, this, baton.model);
            }
        }
    });

    var NotificationsView = Backbone.View.extend({

        className: 'notifications',
        id: 'io-ox-notifications-mail',
        events: {
            'click [data-action="open-app"]': 'openApp',
            'click .item': 'openMail',
            'dispose .item': 'removeNotification' //seems to be unused
        },

        render: function () {
            var i = 0, $i = Math.min(this.collection.size(), 3), baton;
            baton = ext.Baton({ view: this });
            ext.point('io.ox/core/notifications/mail/header').invoke('draw', this.$el.empty(), baton);

            for (; i < $i; i++) {
                baton = ext.Baton({ model: this.collection.at(i), view: this });
                ext.point('io.ox/core/notifications/mail/item').invoke('draw', this.$('.notifications'), baton);
            }

            return this;
        },

        openMail: function (e) {
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
                            .on("close", function () {
                                overlay.trigger("mail-detail-closed");
                                api.off('delete', cleanUp);
                            })
                            .show(e, function (popup) {
                                popup.append(view.draw(data));
                                api.on('delete', {popup: detailPopup}, cleanUp);//if mail gets deleted we must close the sidepopup or it will show a blank page
                            });
                    });
                });
            }
        },

        openApp: function (e) {
            e.preventDefault();
            require("io.ox/core/notifications").hideList();
            ox.launch('io.ox/mail/main').done(function () {
                // go to inbox
                this.folder.set(api.getDefaultFolder());
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
                if (!_.isArray(mails)) {
                    mails = [].concat(mails);
                }
                addMails(e, mails, unseenMails);
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
