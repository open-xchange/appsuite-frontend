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

            api.get(self.model.toJSON(), {unseen: true, view: 'text'})
                .done(function (data) {
                    console.log('model loaded', data);
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

            // fetch proper mail first
            api.get(api.reduce(this.model.get('data'))).done(function (data) {
                require(['io.ox/core/tk/dialogs', 'io.ox/mail/view-detail'], function (dialogs, view) {
                    // open SidePopup without array
                    new dialogs.SidePopup({ arrow: false }).show(e, function (popup) {
                        popup.append(view.draw(data));
                    });
                });
            });

//            console.log('click item', arguments);
//            // #!&app=io.ox/mail&folder=default0/INBOX&id=default0/INBOX.3098
//            notficationsConroller.hideList();
//
//            var self = this;
//            var getObj = {
//                folder: .folder_id,
//                id: this.model.get('data').folder_id + '.' + this.model.get('data').id
//            };
//            console.log('clicking launching', getObj, this.model);
//
//            require(['io.ox/core/tk/dialogs', 'io.ox/mail/view-detail'], function (dialogs, view) {
//                var msg = self.model.toJSON();
//                var popup = new dialogs.SidePopup();
//                window.sidepop = popup;
//                console.log('popup', popup);
//            });
//
//
//            /*ox.launch('io.ox/mail/main', getObj).done(function () {
//                console.log('launched', this);
//
//                if (self.model.collection) {
//                    self.model.collection.remove(self.model);
//                }
//                //self.model.destroy(); // destroy the model
//                this.setState(getObj);
//            }).fail(function () {
//                console.log('failed launching app', arguments);
//            });*/
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
                console.log('unseen mails:', data);
            });
        },
        render: function () {
            console.log('render mail notifications');
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
