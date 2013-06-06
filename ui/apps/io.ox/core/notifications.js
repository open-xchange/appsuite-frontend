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
            this.$el.text(_.noI18n(this.model.get('count')));
        },
        setNotifier: function (b) {
            if (b) {
                this.$el.addClass('badge-info').attr('aria-disabled', false);
            } else {
                this.$el.removeClass('badge-info').attr('aria-disabled', true);
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

    var NotificationsView = Backbone.View.extend({
        tagName: 'div',
        id: 'io-ox-notifications-display',
        initialize: function (options) {
            options = options || {};
            this.subviews = options.subviews || {};
        },
        render: function (notifications) {
            var self = this,
                empty = true; //check if notification area is empty
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

    var NotificationController = function () {
        this.notifications = {};
        this.oldMailCount = 0;//special variable needed to check for autoopen on new mail
        this.badges = [];
    };

    NotificationController.prototype = {

        attach: function (addLauncher) {
            //view
            var self = this,
                badgeView = new BadgeView({ model: new Backbone.Model({ count: 0})});
            this.notificationsView = new NotificationsView();

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

            function changeAutoOpen(value) {
                value = value || settings.get('autoOpenNotification', 'noEmail');

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

            changeAutoOpen();
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

            return addLauncher('right', $('<a>').append(badgeView.render().$el.show()), $.proxy(this.toggleList, this)).attr('id', 'io-ox-notifications-icon');

        },
        get: function (key, listview) {
            if (_.isUndefined(this.notifications[key])) {
                var module = {};
                module.ListView = listview;
                module.collection = new Backbone.Collection();
                module.collection
                    .on('add reset', _.bind(this.updateNotification, this))
                    .on('remove', _.bind(this.update, this));
                this.notifications[key] = module;
            }
            return this.notifications[key];
        },
        slowClose: function () {
            $('#io-ox-notifications-overlay').off("mail-detail-closed");
            this.hideList();
        },
        updateNotification: function () {
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
            // just for the moment as reminder view blocks whole screen
            // will reenable the view later with new design
            if (_.device('small')) return;

            $('#io-ox-notifications').addClass('active');
            $('#io-ox-notifications-overlay').addClass('active');
            $(document).on('keydown.notification', $.proxy(function (e) {
                if (e.which === 27) { // escapekey
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


            //$('#io-ox-core').prepend($('<div id="io-ox-notifications-popups">'));

            var validType = /^(info|warning|error|success)$/,
                active = false,
                container = null,
                timer = null,
                TIMEOUT = _.device('smartphone') ? 1000 : 10000,

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
                    if (_.device('smartphone')) {
                        node.addClass('slideup').removeClass('slidedown');
                        node.on('transitionEnd webkitTransitionEnd', function () {
                            container.removeClass('slideup slidedown');
                            console.log('cleanup');
                            node.remove();
                            node = null;
                        });
                    } else {
                        node.fadeOut(function () {
                            node.remove();
                            node = null;
                        });
                    }

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

                if (type === 'close') return fader();

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
                        if (_.device('smartphone')) container.addClass('slidedown');
                        timer = setTimeout(fader, (o.type === 'error' ? 2 : 1) * TIMEOUT);
                    }, 100);


                }
            };
        }())
    };
    return new NotificationController();
});
