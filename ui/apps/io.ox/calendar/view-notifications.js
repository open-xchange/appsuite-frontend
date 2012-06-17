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
define('io.ox/calendar/view-notifications',
      ['io.ox/core/notifications/main',
       'dot!io.ox/calendar/template.html',
       'less!io.ox/calendar/style.css'], function (notficationsConroller, tpl) {

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
            this.$el.empty().append(tpl.render('io.ox/calendar/notification', {}));
            this._modelBinder.bind(this.model, this.el, Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property'));
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
            /*ox.launch('io.ox/mail/main', getObj).done(function () {
                console.log('launched', this);

                self.model.destroy(); // destroy the model
                this.setState(getObj);
            }).fail(function () {
                console.log('failed launching app', arguments);
            });*/
        }
    });

    var NotificationsView = Backbone.View.extend({
        className: 'notifications',
        id: 'io-ox-notifications-calendar',
        _collectionBinder: undefined,
        initialize: function () {
            var viewCreator = function (model) {
                return new NotificationView({model: model});
            };
            var elManagerFactory = new Backbone.CollectionBinder.ViewManagerFactory(viewCreator);
            this._collectionBinder = new Backbone.CollectionBinder(elManagerFactory);
        },
        render: function () {
            console.log('render calendar notifications');
            this.$el.empty().append(tpl.render('io.ox/calendar/notifications', {}));
            this._collectionBinder.bind(this.collection, this.$('.notifications'));
            return this;
        }
    });

    return NotificationsView;

});
