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
define('io.ox/mail/view-notifications',
      ['io.ox/core/notifications/main',
       'io.ox/mail/api',
       'io.ox/mail/util',
       'dot!io.ox/mail/template.html',
       'less!io.ox/mail/style.css'], function (notficationsConroller, api, util, tpl) {

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
            self.$el.empty().append(tpl.render('io.ox/mail/notification', {}));
            self._modelBinder.bind(self.model, self.el, Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property'));

            // fetch plain text mail; don't use cache
            var obj = _.extend(api.reduce(self.model.toJSON()), { unseen: true, view: 'text' });
            api.get(obj, false)
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
            var obj = api.reduce(this.model.get('data')),
                overlay = $('#io-ox-notifications-overlay'),
                sidepopup = overlay.prop('sidepopup'),
                cid = overlay.find('[data-cid]').data('cid');

            // toggle?
            if (sidepopup && cid === _.cid(obj)) {
                sidepopup.close();
            } else {
                // fetch proper mail first
                api.get(obj).done(function (data) {
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
        _collectionBinder: undefined,
        initialize: function () {
            var self = this;

            this.notificationviews = [];
            this.model = new Backbone.Model({unread: 0});
            this.model.on('change:unread', _.bind(this.onChangeCount, this));
            this.collection.on('reset', _.bind(this.render, this));
            this.collection.on('add', _.bind(this.render, this));
            this.collection.on('remove', _.bind(this.render, this));

            api.on('unseen-mail', function (e, data) {
                self.model.set('unread', _(data).size());
            });
        },
        render: function () {
            this.$el.empty().append(tpl.render('io.ox/mail/notifications', {}));

            for (var i = 0; i < this.collection.size() && i < 3; i++) {
                this.notificationviews[i] = new NotificationView({ model: this.collection.at(i)});
                this.$('.notifications').append(this.notificationviews[i].render().el);
            }

            return this;
        },
        onChangeCount: function () {
            var unread = this.model.get('unread');
            var $badge = this.$el.find('[data-property="unread"]');

            $badge.text(unread);

            if (unread > 0) {
                $badge.addClass('badge-error');
            } else {
                $badge.removeClass('badge-error');
            }
        }
    });

    return NotificationsView;

});
