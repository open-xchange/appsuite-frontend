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
      ['dot!io.ox/mail/template.html'], function (tpl) {

    'use strict';

    var NotificationView = Backbone.View.extend({
        _modelBinder: undefined,
        initialize: function () {
            this._modelBinder = new Backbone.ModelBinder();

        },
        render: function () {
            this.$el.empty().append(tpl.render('io.ox/mail/notification', {}));
            this._modelBinder.bind(this.model, this.el, Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property'));
            return this;

        }
    });

    var NotificationsView = Backbone.View.extend({
        _collectionBinder: undefined,
        initialize: function () {
            var viewCreator = function (model) {
                return new NotificationView({model: model});
            };
            var elManagerFactory = new Backbone.CollectionBinder.ViewManagerFactory(viewCreator);
            this._collectionBinder = new Backbone.CollectionBinder(elManagerFactory);
        },
        render: function () {
            console.log('render mail notifications');
            this.$el.empty().append(tpl.render('io.ox/mail/notifications', {}));
            this._collectionBinder.bind(this.collection, this.$('.notifications'));
            return this;
        }
    });

    return NotificationsView;

});
