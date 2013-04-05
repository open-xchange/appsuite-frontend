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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/notifications', ['io.ox/core/extensions', 'settings!io.ox/core', 'gettext!io.ox/core'], function (ext, settings, gt) {

    'use strict';

    var BadgeView = Backbone.View.extend({
        tagName: 'span',
        className: 'badge',
        initialize: function (options) {
            this.model.on('change', _.bind(this.onChange, this));
        },
        render: function () {
            this.$el.text(_.noI18n(this.model.get('count')));
            return this;
        },
        onChange: function () {
            this.$el.addClass('badge-info');
            this.$el.text(_.noI18n(this.model.get('count')));
        },
        setNotifier: function (b) {
            if (b) {
                this.$el.addClass('badge-info');
            } else {
                this.$el.removeClass('badge-info');
            }
        },
        setCount: function (count, newMails) {
            var newOther = count - this.model.get('count') - newMails;//check if there are new notifications, that are not mail

            if (newOther > 0) {//new notifications not mail
                this.trigger('newNotifications');
            } else if (newMails > 0) {//new mail notifications
                this.trigger('newMailNotifications');
            } else //just trigger if count is set to 0, not if it was 0 already
                if (count === 0 && this.model.get('count') > count) {
                this.trigger('lastItemDeleted');
            }
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
            this.subviews = options.subviews || {};
        },
        render: function (notifications) {
            var self = this,
                empty = true;//check if notification area is empty
            self.$el.empty();

            if (_.size(self.subviews) < _.size(notifications)) { //make sure views are created one time only to avoid zombies
                _(notifications).each(function (category, type) {
                    if (self.subviews[type] === undefined) {
                        self.subviews[type] = new category.ListView({ collection: category.collection});
                    }
                });
            }

            _(self.subviews).each(function (category) {
                if (category.collection.length > 0) {
                    self.$el.append(category.render().el);
                    empty = false;
                }
            });

            if (empty) {
                self.$el.append($('<legend class="section-title">').text(gt('No notifications')));
            }

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
        this.oldMailCount = 0;//special variable needed to check for autoopen on new mail
        this.badges = [];
    };

    NotificationController.prototype = {

        attach: function (el, addLauncher) {
            //view
            var self = this;
            var badgeView = new BadgeView({ el: el, model: new Backbone.Model({ count: 0})});
            this.notificationsView = new NotificationsView();
            addLauncher('wrap right', badgeView.render().$el.show(), $.proxy(this.toggleList, this));
            $('#io-ox-core').prepend(
                $('<div id="io-ox-notifications" class="scrollable">'),
                $('<div id="io-ox-notifications-overlay" class="abs notifications-overlay">').click(function (e) {
                    if (e.target === this) {
                        self.hideList();
                    }
                })
            );

            //auto open on new notification
            this.badges.push(badgeView);
            var set = settings.get('autoOpenNotification', 'noEmail');

            function changeAutoOpen(value) {
                badgeView.off('newNotifications newMailNotifications');//prevent stacking of eventhandlers

                if (value === 'always') {
                    badgeView.on('newNotifications newMailNotifications', function () {
                        self.showList();
                    });
                } else if (value === 'noEmail') {
                    badgeView.on('newNotifications', function () {
                        self.showList();
                    });
                }
            }

            changeAutoOpen(set);
            settings.on('change:autoOpenNotification', function (e, value) {
                changeAutoOpen(value);
            });

            //close if count set to 0
            badgeView.on('lastItemDeleted', function () {
                var overlay = $('#io-ox-notifications-overlay');
                if (overlay.has('.mail-detail-decorator').length > 0) {
                    overlay.on("mail-detail-closed", _.bind(self.slowClose, self));
                } else {
                    self.hideList();
                }
            });

            // invoke plugins
            ox.manifests.loadPluginsFor('io.ox/core/notifications').done(function () {
                ext.point('io.ox/core/notifications/register').invoke('register', self, self);
            });

            // now register default notification handler
            /*require(['io.ox/mail/notifications',
                     'io.ox/calendar/notifications'], function (mailNotifications, calNotifications) {
                mailNotifications.register();
                calNotifications.register();
            });*/
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
                //$('#io-ox-notifications').empty().append(this.notificationsView.render(this.notifications).el);
            }
            return this.notifications[key];
        },
        slowClose: function () {
            $('#io-ox-notifications-overlay').off("mail-detail-closed");
            this.hideList();
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
            var newMails = 0,
                self = this;

            var count = _.reduce(this.notifications, function (memo, module, key) {
                if (key === 'io.ox/mail') { //mail is special when it comes to autoopen
                    newMails = module.collection.size() - self.oldMailCount;
                    self.oldMailCount = module.collection.size();
                }

                if (module.collection.size() > 0) {
                    return memo + module.collection.size();
                }
                return memo;
            }, 0);

            _.each(this.badges, function (badgeView) {
                badgeView.setCount(count || 0, newMails);
                if (count === 0) {
                    badgeView.setNotifier(false);
                }
            });

            $('#io-ox-notifications').empty().append(this.notificationsView.render(this.notifications).el);
        },
        toggleList: function () {
            //create nice listing view of all notifications grouped by
            //their app
            if ($('#io-ox-notifications').hasClass('active')) {
                this.hideList();
            } else {
                this.showList();
            }
        },
        showList: function () {
            $('#io-ox-notifications').addClass('active');
            $('#io-ox-notifications-overlay').addClass('active');
            $(document).on('keydown.notification', $.proxy(function (e) {
                if (e.which === 27) {
                    $(document).off('keydown.notification');
                    this.hideList();
                }
            }, this));
        },
        hideList: function (softmode) {
            _.each(this.badges, function (badgeView) {
                badgeView.setNotifier(false);
            });
            $('#io-ox-notifications').removeClass('active');
            $('#io-ox-notifications-overlay').empty().removeClass('active');
        },

        // type = info | warning | error | success
        yell: (function () {

            var validType = /^(info|warning|error|success)$/,
                active = false,
                container = null,
                timer = null,
                TIMEOUT = 10000,

                clear = function () {
                    if (timer !== null) {
                        clearTimeout(timer);
                        timer = null;
                    }
                },

                fader = function () {
                    clear();
                    $('body').off('click tap', fader);
                    active = false;
                    var node = container.children().first();
                    node.fadeOut(function () {
                        node.remove();
                        node = null;
                    });
                },

                documentClick = function (e) {
                    // click on notification?
                    if (e && $(e.target).closest('#io-ox-notifications-popups').length) return;
                    // otherwise: fade out
                    fader();
                };

            return function (type, message) {

                // we have a container?
                if (container === null) {
                    $('#io-ox-core').prepend(
                        container = $('<div id="io-ox-notifications-popups">')
                    );
                }

                var o = {};

                // catch server error?
                if (_.isObject(type)) {
                    if ('error' in type) {
                        o.type = 'error';
                        o.message = type.error;
                        o.headline = gt('Error');
                    } else {
                        o = type;
                    }
                } else {
                    o.type = type || 'info';
                    o.message = message;
                }

                // add message
                if (validType.test(o.type)) {
                    // put at end of stack not to run into opening click
                    setTimeout(function () {
                        container.empty().append(
                            $('<div class="alert alert-' + o.type + ' alert-block user-select-text">')
                            .append(
                                $('<a href="#" class="close">&times;</a>').click(fader),
                                o.headline ? $('<b>').text(o.headline) : $(),
                                $('<div>').html(_.escape(o.message).replace(/\n/g, '<br>'))
                            )
                        );
                        if (!active) {
                            $('body').on('click tap', documentClick);
                        }
                        active = true;
                        clear();
                        timer = setTimeout(fader, (o.type === 'error' ? 2 : 1) * TIMEOUT);
                    }, 0);
                }
            };
        }())
    };

    return new NotificationController();
});
