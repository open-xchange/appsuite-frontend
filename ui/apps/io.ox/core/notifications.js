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
define('io.ox/core/notifications',
      ['io.ox/core/extensions'], function (ext) {

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
            this.$el.addClass('badge-important');
            this.$el.text(this.model.get('count'));
        },
        setNotifier: function (b) {
            if (b) {
                this.$el.addClass('badge-important');
            } else {
                this.$el.removeClass('badge-important');
            }
        },
        setCount: function (count) {
            this.model.set('count', count);
        }
    });

    var FaviconBadge = Backbone.Model.extend({
        initialize: function (options) {
            this.on('change', _.bind(this.onChange, this));
        },
        onChange: function () {
            window.Tinycon.setBubble(this.get('count'));
        },
        setNotifier: function (b) {
            if (b && this.get('count')) {
                window.Tinycon.setBubble(this.get('count'));
            } else {
                window.Tinycon.setBubble(0);
            }
        },
        setCount: function (count) {
            this.set('count', count);
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
                if (category.collection.size() > 0) {
                    var v = new category.ListView({ collection: category.collection});
                    self.$el.append(v.render().el);
                }
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
        this.badges = [];
    };

    NotificationController.prototype = {
        attach: function (desktop, pos) {
            //view
            var self = this;
            var badgeView = new BadgeView({model: new Backbone.Model({ count: 0})});
            this.notificationsView = new NotificationsView();
            desktop.addLauncher(pos, badgeView.render().$el, $.proxy(this.toggleList, this));
            $('#io-ox-core').prepend(
                $('<div id="io-ox-notifications" class="scrollable">'),
                $('<div id="io-ox-notifications-overlay" class="abs notifications-overlay">').click(function (e) {
                    if (e.target === this) {
                        self.hideList();
                    }
                })
            );
            this.badges.push(badgeView);

            // invoke plugins
            var plugins = ext.getPlugins({name: 'notifications', prefix: 'plugins/notifications/'});
            require(plugins).done(function () {
                ext.point('io.ox/core/notifications/register').invoke('register', self, self);
            });
            // now register default notification handler
            /*require(['io.ox/mail/notifications',
                     'io.ox/calendar/notifications'], function (mailNotifications, calNotifications) {
                mailNotifications.register();
                calNotifications.register();
            });*/



        },
        addFaviconNotification: function () {
            if (window.Tinycon) {
                this.badges.push(new FaviconBadge());
            }
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
            _.each(this.badges, function (badgeView) {
                badgeView.setNotifier(true);
            });
            this.update();
        },
        onRemoveNotification: function () {
            this.update();
        },
        onResetNotifications: function () {
            _.each(this.badges, function (badgeView) {
                badgeView.setNotifier(true);
            });
            this.update();
        },
        update: function () {

            var count = _.reduce(this.notifications, function (memo, module) {
                if (module.collection.size() > 0) {
                    return memo + module.collection.size();
                }
                return memo;
            }, 0);

            _.each(this.badges, function (badgeView) {
                badgeView.setCount(count || 0);
            });
            $('#io-ox-notifications').empty().append(this.notificationsView.render(this.notifications).el);
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
            _.each(this.badges, function (badgeView) {
                badgeView.setNotifier(false);
            });
            $('#io-ox-notifications').removeClass('active');
            $('#io-ox-notifications-overlay').empty().removeClass('active');
        }

    };

    return new NotificationController();

});
