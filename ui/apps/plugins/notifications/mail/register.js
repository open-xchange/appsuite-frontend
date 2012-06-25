/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('plugins/notifications/mail/register',
    ['io.ox/core/notifications',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/core/extensions',
     'io.ox/core/config',
     'dot!plugins/notifications/mail/template.html',
     'gettext!plugins/notifications/mail'
    ], function (notificationsController, mailApi, util, ext, config, tpl, gt) {

    'use strict';

    function beatifyMailText(str) {
        str = String(str)
            .substr(0, 500) // limit overall length
            .replace(/-{3,}/g, '---') // reduce dashes
            .replace(/<br\s?\/?>(&gt;)+/ig, ' ') // remove quotes after line breaks
            .replace(/<br\s?\/?>/ig, ' ') // remove line breaks
            .replace(/<[^>]+(>|$)/g, '') // strip tags
            .replace(/(http(s?):\/\/\S+)/i, '<a href="$1" target="_blank">http$2://...</a>') // links
            .replace(/&#160;/g, ' ') // convert to simple white space
            .replace(/\s{2,}/g, ' '); // reduce consecutive white space
        // trim
        return $.trim(str);
    }

    var NotificationView = Backbone.View.extend({
        events: {
            'click .item': 'onClickItem'
        },
        _modelBinder: undefined,
        initialize: function () {
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            var self = this;
            self.$el.empty().append(tpl.render('plugins/notifications/mail/mailitem', {}));
            self._modelBinder.bind(self.model, self.el, Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property'));

            // fetch plain text mail; don't use cache
            var obj = _.extend(mailApi.reduce(self.model.toJSON()), { unseen: true, view: 'text' });
            mailApi.get(obj, false)
                .done(function (data) {
                    var f = data.from || [['', '']];
                    self.model.set({
                        title: util.getDisplayName(f[0]),
                        subject: data.subject,
                        content: beatifyMailText(data.attachments[0].content),
                        data: data
                    });
                    self.$('.content').html(self.model.get('content'));
                });

            return this;

        },
        onClickItem: function (e) {
            var obj = mailApi.reduce(this.model.get('data')),
                overlay = $('#io-ox-notifications-overlay'),
                sidepopup = overlay.prop('sidepopup'),
                cid = overlay.find('[data-cid]').data('cid');

            console.log('click', obj, overlay, sidepopup, cid);

            // toggle?
            if (sidepopup && cid === _.cid(obj)) {
                sidepopup.close();
            } else {
                // fetch proper mail first
                mailApi.get(obj).done(function (data) {
                    require(['io.ox/core/tk/dialogs', 'io.ox/mail/view-detail'], function (dialogs, view) {
                        // open SidePopup without array
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay.empty())
                            .show(e, function (popup) {
                                popup.append(view.draw(data))
                                    .parent().removeClass('default-content-padding');
                            });
                    });
                });
            }
        }
    });

    var NotificationsView = Backbone.View.extend({
        className: 'notifications',
        id: 'io-ox-notifications-mail',
        events: {
            'click [data-action="openApp"]': 'onOpenApp'
        },
        _collectionBinder: undefined,
        initialize: function () {
            var self = this;

            this.notificationviews = [];
            this.model = new Backbone.Model({unread: 0});
            //this.model.on('change:unread', _.bind(this.onChangeCount, this));
            this.collection.on('reset', _.bind(this.render, this));
            this.collection.on('add', _.bind(this.render, this));
            this.collection.on('remove', _.bind(this.render, this));

            mailApi.on('unseen-mail', function (e, data) {
                self.model.set('unread', _(data).size());
            });
        },
        render: function () {

            this.$el.empty().append(tpl.render('plugins/notifications/mail/new-mails', { strings: {
                NEW_MAILS: gt('New Mails'),
                OPEN_APP: gt('Show Inbox')
            }}));

            for (var i = 0; i < this.collection.size() && i < 3; i++) {
                this.notificationviews[i] = new NotificationView({ model: this.collection.at(i)});
                this.$('.notifications').append(this.notificationviews[i].render().el);
            }

            return this;
        },
       /* onChangeCount: function () {
            var unread = this.model.get('unread');
            var $badge = this.$el.find('[data-property="unread"]');

            $badge.text(unread);

            if (unread > 0) {
                $badge.addClass('badge-error');
            } else {
                $badge.removeClass('badge-error');
            }
        },*/
        onOpenApp: function () {
            var defaultInboxFolderId = config.get('modules.mail.defaultFolder.inbox');
            console.log('open app now');
            notificationsController.hideList();
            ox.launch('io.ox/mail/main').done(function () {
                this.folder.set(defaultInboxFolderId); // go to inbox
            })
            .fail(function () {
                console.log('failed launching app', arguments);
            });

        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'mail',
        index: 200,
        register: function (controller) {
            console.log('register mail notifications');
            var notifications = controller.get('io.ox/mail', NotificationsView);

            mailApi.refresh();
            mailApi.on('new-mail', function (e, mails) {
                _(mails.reverse()).each(function (mail) {
                    notifications.collection.unshift(new Backbone.Model(mail), {silent: true}); ///_(mails).clone());
                });
                notifications.collection.trigger('reset');
            });
        }
    });

    return true;
});
