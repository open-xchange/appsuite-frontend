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
     'io.ox/core/extensions',
     'gettext!plugins/notifications'
    ], function (api, ext, gt) {

    'use strict';

    var numMessages = 10;

    ext.point('io.ox/core/notifications/mail/header').extend({
        draw: function (baton) {
            this.append(
                $('<h1 class="section-title">').text(gt('New Mails'))
                    //special attribute to restore focus on redraw
                    .attr('focusId', 'mail-notification-'),
                $('<button type="button" class="btn btn-link clear-button fa fa-times refocus">')
                    .attr({ tabindex: 1,
                        'aria-label': gt('Hide all notifications for new mails.'),
                        'data-action': 'clear',
                        'focus-id': 'mail-notification-clear'
                }),
                $('<ul class="items list-unstyled">'),
                $('<div class="open-app">').append(
                    $('<button data-action="open-app" tabindex="1" class="btn btn-primary btn-sm refocus" focus-id="mail-notification-open-app">').text(
                        baton.more ? gt('Show all %1$d messages in inbox', baton.size) : gt('Show inbox')
                    )
                )
            );
        }
    });

    function drawItem(node, data) {
        if (data) {
            require(['io.ox/mail/util'], function (util) {
                var f = data.from || [['', '']],
                    descriptionId = _.uniqueId('notification-description-');
                node.append(
                    $('<li class="item refocus" tabindex="1" role="listitem">')
                        //special attribute to restore focus on redraw
                        .attr({'focus-id': 'mail-notification-' + _.cid(data),
                               'data-cid': _.cid(data),
                               'aria-describedby': descriptionId,
                                //#. %1$s mail sender
                                //#. %2$s mail subject
                                //#, c-format
                                'aria-label': gt('Mail from %1$s %2$s', _.noI18n(util.getDisplayName(f[0])), _.noI18n(data.subject) || gt('No subject'))
                              }).append(
                        $('<span class="sr-only" aria-hiden="true">').text(gt('Press [enter] to open')).attr('id', descriptionId),
                        $('<span class="span-to-div title">').text(_.noI18n(util.getDisplayName(f[0]))),
                        $('<span class="span-to-div subject">').text(_.noI18n(data.subject) || gt('No subject')).addClass(data.subject ? '' : 'empty')
                        // TODO: re-add teaser once we get this via getList(...)
                    )
                );
            });
        }
    }

    ext.point('io.ox/core/notifications/mail/item').extend({
        draw: function (baton) {
            drawItem(this, baton.data);
        }
    });

    var NotificationsView = Backbone.View.extend({

        tagName: 'div',
        className: 'notifications',
        id: 'io-ox-notifications-mail',
        events: {
            'click [data-action="open-app"]': 'openApp',
            'keydown [data-action="clear"]': 'clearItems',
            'click [data-action="clear"]': 'clearItems',
            'click .item': 'openMail',
            'keydown .item': 'openMail'
        },

        render: function () {

            this.$el.empty();
            if (this.collection.length) {
                var i = 0, size = this.collection.size(),
                    $i = Math.min(size, numMessages),
                    baton,
                    mails = new Array($i),
                    view = this;

                baton = ext.Baton({ view: view, size: size, more: size > $i });
                ext.point('io.ox/core/notifications/mail/header').invoke('draw', this.$el, baton);

                for (i = 0; i < $i; i++) {
                    mails[i] = api.reduce(this.collection.at(i).toJSON());
                }

                //no need to request mails where we have all the information already
                mails = _(mails).filter(function (item) {
                    return view.collection._byId[item.id].get('subject') === undefined;
                });

                if (mails.length > 0) {
                    api.getList(mails, true, {unseen: true}).done(function (response) {
                        //remove mails that may be drawn already. ugly race condition fix
                        view.$el.find('.item').remove();
                        //save data to model so we don't need to ask again everytime
                        for (i = 0; i < mails.length; i++) {
                            view.collection._byId[response[i].id].attributes = response[i];
                        }
                        // draw mails
                        for (i = 0; i < $i; i++) {
                            baton = ext.Baton({ data: view.collection.models[i].attributes, view: view });
                            ext.point('io.ox/core/notifications/mail/item').invoke('draw', view.$el.find('.items'), baton);
                        }

                    });
                } else {
                    //remove mails that may be drawn already. ugly race condition fix
                    view.$el.find('.item').remove();
                    // draw mails
                    for (i = 0; i < $i; i++) {
                        baton = ext.Baton({ data: view.collection.models[i].attributes, view: view });
                        ext.point('io.ox/core/notifications/mail/item').invoke('draw', view.$el.find('.items'), baton);
                    }
                }
            }
            return this;
        },

        openMail: function (e) {
            if ((e.type !== 'click') && (e.which !== 13)) { return; }
            var cid = $(e.currentTarget).data('cid'),
                overlay = $('#io-ox-notifications-overlay'),
                sidepopup = overlay.prop('sidepopup'),
                cleanUp = function (e, mails) {
                    _(mails).each(function (obj) {
                        if (cid === _.cid(obj)) e.data.popup.close();
                    });
                };
            // toggle?
            if (sidepopup && cid === overlay.find('[data-cid]').data('cid')) {
                sidepopup.close();
            } else {
                // open dialog first to be visually responsive
                require(['io.ox/core/tk/dialogs', 'io.ox/mail/detail/view'], function (dialogs, detail) {
                    // open SidePopup without array
                    var detailPopup = new dialogs.SidePopup({ arrow: false, side: 'right' })
                        .setTarget(overlay.empty())
                        .on('close', function () {
                            api.off('deleted-mails', cleanUp);
                            if (_.device('smartphone') && overlay.children().length > 0) {
                                overlay.addClass('active');
                            } else if (_.device('smartphone')) {
                                overlay.removeClass('active');
                                $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
                            }
                            //focus first for now
                            $('#io-ox-notifications .item').first().focus();
                        })
                        .show(e, function (popup) {
                            // fetch proper mail now
                            popup.busy();
                            //detail view sets unseen so get the unseen mail here to prevent errors
                            api.get(_.extend(_.cid(cid), {unseen: true})).done(function (data) {

                                var view = new detail.View({ data: data });
                                popup.idle().append(view.render().expand().$el.addClass('no-padding'));

                                if (_.device('smartphone')) {
                                    $('#io-ox-notifications').removeClass('active');
                                }

                                // if mail gets deleted we must close the sidepopup or it will show a blank page
                                api.on('deleted-mails', { popup: detailPopup }, cleanUp);
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

        clearItems: function (e) {
            if ((e.type === 'keydown') && (e.which !== 13)) { return; }
            //hide all items from view
            this.collection.each(function (item) {
                seenMails[_.ecid(item.attributes)] = true;
            });
            this.collection.reset();
        }
    });

    //minicache to store mails that are seen already
    //if mails are added to the notification collection after seen is triggered they are never set to seen correctly otherwise
    var seenMails = {};

    ext.point('io.ox/core/notifications/register').extend({
        id: 'mail',
        index: 600,
        register: function (controller) {
            var notifications = controller.get('io.ox/mail', NotificationsView);

            //adds mails to notificationview and remove elsewhere read ones
            function addMails(e, mails, unseenMails) {
                var mailsToAdd = [];
                //add new ones
                for (var i = 0; i < mails.length; i++) {
                    //check if models for this mail are already present and not seen
                    if (!(notifications.collection._byId[mails[i].id]) && !(seenMails[_.ecid(mails[i])])) {
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
                //mails in the collection that are not unseen need to be removed
                mailsToRemove = _.difference(found, unseenArray);

                _(mailsToRemove).each(function (id) {
                    //make sure this mail is not added again because it's seen already
                    seenMails[_.ecid(notifications.collection._byId[id].attributes)] = true;
                    notifications.collection.remove(notifications.collection._byId[id]);
                });
                _(mailsToAdd.reverse()).each(function (mail) {
                    notifications.collection.unshift(new Backbone.Model(mail), { silent: true });
                });
            }
            function removeMails(e, mails) {
                _(mails).each(function (mail) {
                    notifications.collection.remove(notifications.collection._byId[mail.id]);
                    // make sure this mail is not added again because it's seen already
                    seenMails[_.ecid(mail)] = true;
                });
            }

            // removes mails of a whole folder from notificationview
            function removeFolder(e, folder) {
                // create a copy / each & remove doesn't work
                var list = notifications.collection.filter(function (model) {
                    return model.get('folder_id') === folder;
                });
                _(list).each(function (model) {
                    notifications.collection.remove(model);
                    // make sure this mail is not added again because it's seen already
                    seenMails[_.ecid(model.toJSON())] = true;
                });
            }

            api.on('new-mail', function (e, mails, unseenMails) {

                if (!_.isArray(mails)) mails = [].concat(mails);

                // diabolic testers might run this with some 10K of unread mails
                // this is irrelevant for practise, so we just consider the first 100 messages
                // that's still a lot to read / the number if not correct but we should get rid of it anyway
                addMails(e, mails.slice(0, 100), unseenMails);

                // all mails read. remove new Mail title
                if (notifications.collection.length === 0) {
                    api.newMailTitle(false);
                }
                notifications.collection.trigger('reset');
            });

            api.on('move', function (e, mails, newFolder) {
                if (!_.isArray(mails)) {
                    mails = [].concat(mails);
                }
                //moved out of Inbox
                if (newFolder !== 'default0/INBOX') {
                    removeMails(e, mails);
                }
            });

            //mail has a special delete event
            api.on('deleted-mails update:set-seen', function (e, param) {
                if (_.isArray(param)) removeMails(e, param); else removeFolder(e, param);
                if (notifications.collection.length === 0) api.newMailTitle(false);
            });

            api.checkInbox();
        }
    });

    return true;
});
