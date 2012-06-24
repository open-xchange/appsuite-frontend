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
            'content': ''
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
            var self = this;
            this.badgeView = new BadgeView({model: new Backbone.Model({ count: 0})});
            this.notificationsView = new NotificationsView();
            desktop.addLauncher("right", this.badgeView.render().$el, $.proxy(this.toggleList, this));
            $('#io-ox-core').prepend(
                $('<div id="io-ox-notifications" class="scrollable">'),
                $('<div id="io-ox-notifications-overlay" class="abs notifications-overlay">').click(function (e) {
                    if (e.target === this) {
                        self.hideList();
                    }
                })
            );
        },
        get: function (key, listview) {
            if (_.isUndefined(this.notifications[key])) {
                var module = {};
                module.collection = new NotificationCollection([]);
                module.ListView = listview;
                module.collection.on('add', _.bind(this.onAddNotification, this));
                module.collection.on('remove', _.bind(this.onRemoveNotification, this));
                module.collection.on('reset', _.bind(this.onResetNotifications, this));
                this.notifications[key] = module;
                $('#io-ox-notifications').empty().append(this.notificationsView.render(this.notifications).el);
            }

            return this.notifications[key];
        },
        onAddNotification: function () {
            this.badgeView.$el.addClass('badge-error');
            this.update();
        },
        onRemoveNotification: function () {
            this.update();
        },
        onResetNotifications: function () {
            this.badgeView.$el.addClass('badge-error');
            this.update();
        },
        update: function () {

            var count = _.reduce(this.notifications, function (memo, module) {
                if (module.collection.size() > 0) {
                    return memo + 1;
                }
            }, 0);

            window.badge = this.badgeView.model;

            this.badgeView.model.set('count', (count || 0));
        },
        toggleList: function () {
            //create nice listing view of all notifications grouped by
            //their app
            if ($('#io-ox-screens').hasClass('beside')) {
                this.hideList();
            } else {
                this.showList();
            }
        },
        showList: function () {
            $('#io-ox-screens').addClass('beside');
            $('#io-ox-notifications').addClass('active');
            $('#io-ox-notifications-overlay').addClass('active');
            $(document).on('keydown.notification', $.proxy(function (e) {
                if (e.which === 27) {
                    $(document).off('keydown.notification');
                    this.hideList();
                }
            }, this));
        },
        hideList: function () {
            $('#io-ox-screens').removeClass('beside');
            this.badgeView.$el.removeClass('badge-error');
            $('#io-ox-notifications').removeClass('active');
            $('#io-ox-notifications-overlay').empty().removeClass('active');
        }

    };

    return new NotificationController();

});
