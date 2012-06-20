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
       'dot!io.ox/mail/template.html',
       'less!io.ox/mail/style.css'], function (notficationsConroller, api, tpl) {

    'use strict';

    var NotificationView = Backbone.View.extend({
        events: {
            'click .item': 'onClickItem'
        },
        _modelBinder: undefined,
        initialize: function () {
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            this.$el.empty().append(tpl.render('io.ox/mail/notification', {}));
            this._modelBinder.bind(this.model, this.el, Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property'));

            this.$('.content').html(this.model.get('content'));
            return this;

        },
        onClickItem: function (e) {
            console.log('click item', arguments);
            // #!&app=io.ox/mail&folder=default0/INBOX&id=default0/INBOX.3098
            notficationsConroller.hideList();
            var self = this;
            var getObj = {
                folder: this.model.get('data').folder_id,
                id: this.model.get('data').folder_id + '.' + this.model.get('data').id
            };
            console.log('clicking launching', getObj, this.model);
            ox.launch('io.ox/mail/main', getObj).done(function () {
                console.log('launched', this);

                self.model.destroy(); // destroy the model
                this.setState(getObj);
            }).fail(function () {
                console.log('failed launching app', arguments);
            });
        }
    });

    var NotificationsView = Backbone.View.extend({
        className: 'notifications',
        id: 'io-ox-notifications-mail',
        _collectionBinder: undefined,
        initialize: function () {
            var self = this;

            this.model = new Backbone.Model({unread: 0});
            this.model.on('change:unread', _.bind(this.onChangeCount, this));
            var viewCreator = function (model) {
                return new NotificationView({model: model});
            };
            var elManagerFactory = new Backbone.CollectionBinder.ViewManagerFactory(viewCreator);
            this._collectionBinder = new Backbone.CollectionBinder(elManagerFactory);

            api.on('unseen-mail', function (e, data) {
                self.model.set('unread', _(data).size());
                console.log('unseen mails:', data);
            });
        },
        render: function () {
            console.log('render mail notifications');
            this.$el.empty().append(tpl.render('io.ox/mail/notifications', {}));
            this._collectionBinder.bind(this.collection, this.$('.notifications'));
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
