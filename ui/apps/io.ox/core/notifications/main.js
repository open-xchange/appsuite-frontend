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
define('io.ox/core/notifications/main',
      [], function () {

    'use strict';

    var BadgeView = Backbone.View.extend({
        tagName: 'span',
        className: 'badge',
        initialize: function (options) {
            this.model.on('change', _.bind(this.onChange, this));
        },
        render: function () {
            this.$el.text(this.model.get('count'));
            return this;
        },
        onChange: function () {
            this.$el.addClass('badge-error');
            this.$el.text(this.model.get('count'));
        }
    });

    var NotificationsView = Backbone.View.extend({
        tagName: 'div',
        id: 'io-ox-notifications-display',
        initialize: function (options) {
            options = options || {};
            this.subviews = options.subviews || [];
        },
        render: function (notifications) {
            var self = this;
            console.log('render notifications', self, notifications);

            self.$el.empty();


            _(notifications).each(function (category) {
                var v = new category.ListView({ collection: category.collection});
                self.$el.append(v.render().el);
            });
            return self;
        }
    });


    var NotificationModel = Backbone.Model.extend({
        defaults: {
            'thumbnail': '',
            'title': '',
            'description': '',
            render: $.noop()
        }
    });
    var NotificationCollection = Backbone.Collection.extend({
        model: NotificationModel,
        initialize: function (options) {
        }
    });





    var NotificationController = function () {
        this.notifications = {};
    };

    NotificationController.prototype = {
        attach: function (desktop, pos) {
            //view
            this.badgeView = new BadgeView({model: new Backbone.Model({ count: 0})});
            this.notificationsView = new NotificationsView();
            desktop.addLauncher("right", this.badgeView.render().$el, _.bind(this.toggleList, this));
            $('#io-ox-core').prepend($('<div id="io-ox-notifications">').addClass('scrollable'));
        },
        get: function (key, listview) {
            if (_.isUndefined(this.notifications[key])) {
                console.log('created notfication collection', this.notifications);
                var module = {};
                module.collection = new NotificationCollection([]);
                module.ListView = listview;
                module.collection.on('add', _.bind(this.onAddNotification, this));
                module.collection.on('remove', _.bind(this.onRemoveNotification, this));
                module.collection.on('reset', _.bind(this.onResetNotifications, this));
                this.notifications[key] = module;
            }

            return this.notifications[key];
        },
        onAddNotification: function () {
            console.log('add notification', arguments);
            this.badgeView.$el.addClass('badge-error');
            this.update();
        },
        onRemoveNotification: function () {
            console.log('remove notification', arguments);
            this.update();
        },
        onResetNotifications: function () {
            console.log('reset notifications', arguments);
            this.badgeView.$el.addClass('badge-error');
            this.update();
        },
        update: function () {
            console.log('update', this.notifications);

            var count = _.reduce(this.notifications, function (memo, module) {
                if (module.collection.size() > 0) {
                    return memo + 1;
                }
            }, 0);

            window.badge = this.badgeView.model;

            this.badgeView.model.set('count', count);
        },
        toggleList: function () {
            //create nice listing view of all notifications grouped by
            //their app
            console.log('toggle list now');
            if ($('#io-ox-screens').hasClass('beside')) {
                this.hideList();
            } else {
                this.showList();
            }
        },
        showList: function () {
            $('#io-ox-screens').addClass('beside');
            $('#io-ox-notifications').addClass('active');
            $('#io-ox-notifications').empty().append(this.notificationsView.render(this.notifications).el);
        },
        hideList: function () {
            console.log('hide list');
            $('#io-ox-screens').removeClass('beside');
            this.badgeView.$el.removeClass('badge-error');
            $('#io-ox-notifications').removeClass('active');
        }

    };

    return new NotificationController();

});
