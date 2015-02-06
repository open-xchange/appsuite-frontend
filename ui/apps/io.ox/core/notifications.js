/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/notifications',
    ['io.ox/core/extensions',
     'io.ox/core/yell',
     'settings!io.ox/core',
     'gettext!io.ox/core'
    ], function (ext, yell, settings, gt) {

    'use strict';

    var BadgeView = Backbone.View.extend({
        tagName: 'a',
        className: 'notifications-icon f6-target',
        initialize: function () {
            this.model.set('a11y', '');
            this.model.on('change', _.bind(this.onChange, this));
            this.nodes = {};
        },
        onChange: function () {
            var count = this.model.get('count'),
                //#. %1$d number of notifications
                //#, c-format
                a11y = gt.format(gt.ngettext('%1$d notification.', '%1$d notifications.', count), count);
            //don't create a loop here
            this.model.set('a11y', a11y, {silent: true});
            this.nodes.badge.toggleClass('empty', count === 0);
            this.$el.attr('aria-label', a11y);
            this.nodes.number.text(_.noI18n(count >= 100 ? '99+' : count));
            yell('screenreader', a11y);
        },
        onToggle: function (open) {
            this.nodes.icon.attr('class', open ? 'fa fa-caret-down' : 'fa fa-caret-right');
            this.$el.attr({'aria-expanded': open ? true : false});
        },
        render: function () {
            this.$el.attr({
                    href: '#',
                    tabindex: '1',
                    role: 'button',
                    'aria-expanded': false
                })
                .append(
                    this.nodes.badge = $('<span class="badge">').append(
                        this.nodes.number = $('<span class="number">'),
                        $.txt(' '),
                        this.nodes.icon = $('<i class="fa fa-caret-right">')
                    )
                );

            this.onChange();
            return this;
        },
        setNotifier: function (b) {
            this.nodes.badge.toggleClass('active', !!b);
        },
        setCount: function (count, newMails) {
            //check if there are new notifications, that are not mail
            var newOther = count - this.model.get('count') - newMails;

            if (newOther > 0) {
                //new notifications not mail
                this.trigger('newNotifications');
            } else if (newMails > 0) {
                //new mail notifications
                this.trigger('newMailNotifications');
            } else
                //just trigger if count is set to 0, not if it was 0 already
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
                refocus = false,
                //save focus
                lastFocused = $(document.activeElement, self.$el),
                //focus in case lastFocus got lost (item not there anymore)
                nextFocus,
                //check if notification area is empty
                empty = true;

            //remove old empty message to avoid duplicates
            self.$el.find('.no-news-message').remove();

            // refocusable elements have this marker class
            if (lastFocused.hasClass('refocus')) {
                //find next possible focus
                var items = $('#io-ox-notifications .item'),
                    lastFocusItemId = lastFocused.closest('.item').attr('focus-id');
                if (lastFocusItemId !== undefined) {
                    //refocus only when inside of items (clear buttons or inbox link are outside)
                    for (var i = 0; i < items.length; i++) {
                        if (lastFocusItemId === $(items[i]).attr('focus-id')) {
                            if ((i + 1) < items.length) {
                                //prevent index out of bounds
                                nextFocus = $(items[i + 1]).attr('focus-id');
                            }
                            break;
                        } else {
                            nextFocus = $(items[i]).attr('focus-id');
                        }
                    }
                }
                lastFocused = lastFocused.attr('focus-id');
                refocus = true;
            }


            //make sure views are created one time only to avoid zombies
            if (_.size(self.subviews) < _.size(notifications)) {
                _(notifications).each(function (category, type) {
                    if (self.subviews[type] === undefined) {
                        self.subviews[type] = new category.ListView({ collection: category.collection});
                    }
                });
            }

            _(self.subviews).each(function (category) {
                category.$el.detach();
                //subviews must be rendered even if they have 0 items.
                //this is because the empty call had to be moved from the general render of the notification area to each subview.
                //if empty is called here the notificationviews loose their events on redraw and if we don't call render views with 0 items they might not clear old items properly
                category.render();
                if (category.collection.length > 0) {
                    empty = false;
                    //only attach views again if they contain items, to not confuse screenreaders
                    self.$el.append(category.el);
                }
            });

            if (empty) {
                self.$el.append($('<h1 class="section-title no-news-message">').text(gt('No notifications')));
            }

            //restore focus if possible
            if (refocus) {
                var found = self.$el.find('[focus-id="' + lastFocused + '"]');
                if (found.length > 0) {
                    found.focus();
                } else {
                    //item was deleted. try focusing the next item
                    found = self.$el.find('[focus-id="' + nextFocus + '"]');
                    //focus if its there
                    if (found.length > 0) {
                        found.focus();
                    //just focus first
                    } else {
                        $('#io-ox-notifications .refocus').first().focus();
                    }
                }
            }
            return self;
        }
    });

    var NotificationController = function () {

        this.notifications = {};
        // special variable needed to check for autoopen on new mail
        this.oldMailCount = 0;
        this.badges = [];

        // add event supports
        _.extend(this, Backbone.Events);
    };

    NotificationController.prototype = {

        isOpen: function () {
            return this.nodes.main.hasClass('active');
        },

        toggle: function () {
            if (this.isOpen()) this.hide(); else this.show();
        },

        show: function () {

            // if it's open already we're done
            if (this.isOpen()) return;

            if (_.device('smartphone')) {
                $('[data-app-name="io.ox/portal"]:visible').addClass('notifications-open');
            }

            this.nodes.main.addClass('active');
            this.nodes.overlay.addClass('active');
            this.badgeView.onToggle(true);

            $(document).on('keydown.notification', $.proxy(function (e) {
                if (e.which === 27 && !(this.nodes.overlay.prop('sidepopup'))) {
                    // escapekey and no open sidepopup (escapekey closes the sidepopup then)
                    $(document).off('keydown.notification');
                    this.hideList();
                    //focus badge when closing
                    this.badgeView.$el.focus();
                }
            }, this));

            // try to focus first item; focus badge otherwise
            var firstItem = $('#io-ox-notifications [tabindex="1"]').first();
            if (firstItem.length > 0) firstItem.focus(); else this.badgeView.$el.focus();

            this.trigger('show');
        },

        hide: function () {

            // if it's closed already we're done
            if (!this.isOpen()) return;

            _.each(this.badges, function (badgeView) {
                badgeView.setNotifier(false);
            });

            this.nodes.main.removeClass('active');
            this.nodes.overlay.empty().removeClass('active');
            this.badgeView.onToggle(false);

            if (_.device('smartphone')) {
                $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
                this.nodes.overlay.empty().removeClass('active');
            }

            this.badgeView.$el.focus();

            this.trigger('hide');
        },

        // deprecated
        toggleList : function () { this.toggle(); },
        showList   : function () { this.show(); },
        hideList   : function () { this.hide(); },

        nodes: {
            main: $('<div>').attr({
                tabindex: -1,
                id: 'io-ox-notifications'
            }),
            overlay: $('<div>').attr({
                id: 'io-ox-notifications-overlay'
            }).addClass('abs notifications-overlay')
        },

        //delay only affects requests, not the drawing of the badge
        attach: function (addLauncher, delay) {
            //view
            var self = this;

            this.badgeView = new BadgeView({ model: new Backbone.Model({ count: 0}) });

            this.notificationsView = new NotificationsView();

            $('#io-ox-core').prepend(
                self.nodes.main.append(this.notificationsView.el),
                self.nodes.overlay.click(function (e) {
                    if (e.target === this) {
                        self.hideList();
                    }
                })
            );

            //auto open on new notification
            this.badges.push(this.badgeView);

            function changeAutoOpen(value) {
                value = value || settings.get('autoOpenNotification', 'noEmail');

                //prevent stacking of eventhandlers
                self.badgeView.off('newNotifications newMailNotifications');

                if (value === 'always') {
                    self.badgeView.on('newNotifications newMailNotifications', function () {
                        self.showList();
                    });
                } else if (value === 'noEmail') {
                    self.badgeView.on('newNotifications', function () {
                        self.showList();
                    });
                }
            }

            if (_.device('!smartphone')) { changeAutoOpen(); }
            settings.on('change:autoOpenNotification', function (e, value) {
                changeAutoOpen(value);
            });

            //close if count set to 0
            self.badgeView.on('lastItemDeleted', function () {
                //if there is an open popup, wait till this is closed
                if (self.nodes.overlay.children().length > 0) {
                    self.nodes.overlay.prop('sidepopup').one('close', _.bind(self.slowClose, self));
                } else {
                    self.hideList();
                }
            });

            // load and invoke plugins with delay
            setTimeout(function () {
                ox.manifests.loadPluginsFor('io.ox/core/notifications').done(function () {
                    ext.point('io.ox/core/notifications/register').invoke('register', self, self);
                });
            }, delay || 2000);

            function focusNotifications(e) {
                switch (e.which) {
                    //enter
                    case 13:
                        if (self.isOpen()) {
                            //focus badge when closing
                            _.defer(function () {
                                self.badgeView.$el.focus();
                            });
                        } else {
                            //focus notifications when opening
                            _.defer(function () {
                                var firstItem = $('#io-ox-notifications [tabindex="1"]').first();
                                if (firstItem.length > 0) {
                                    firstItem.focus();
                                } else {
                                    self.badgeView.$el.focus();
                                }
                            });
                        }
                        break;
                    //tab
                    case 9:
                        if (self.isOpen()) {
                            if (!e.shiftKey) {
                                e.preventDefault();
                                var Item = $('#io-ox-notifications [tabindex="1"]').first();
                                if (Item.length > 0) {
                                    Item.focus();
                                }
                            }
                        }
                        break;
                }
            }

            return addLauncher(
                'right',
                self.badgeView.render().$el.on('keydown', focusNotifications),
                $.proxy(this.toggleList, this)
            ).attr({
                id: 'io-ox-notifications-icon',
                role: 'navigation',
                'aria-label': gt('Notifications')
            });
        },

        get: function (key, listview) {
            if (_.isUndefined(this.notifications[key])) {
                var module = {};
                module.ListView = listview;
                module.collection = new Backbone.Collection();
                module.collection
                    .on('add reset', _.bind(this.updateNotification, this))
                    .on('remove', _.bind(this.delayedUpdate, this));
                this.notifications[key] = module;
            }
            return this.notifications[key];
        },
        slowClose: function () {
            this.nodes.overlay.off('mail-detail-closed');
            this.hideList();
        },
        delayedUpdate: function () {
            //delays updating by 100ms (prevents updating the view multiple times in a row)
            var self = this;
            if (!this.updateTimer) {
                this.updateTimer = setTimeout(function () {
                    self.update();
                    self.updateTimer = undefined;
                }, 100);
            }
        },
        updateNotification: function () {
            _.each(this.badges, function (badgeView) {
                badgeView.setNotifier(true);
            });
            this.delayedUpdate();
        },
        update: function () {
            var newMails = 0,
                self = this;

            this.notificationsView.render(this.notifications);

            var count = _.reduce(this.notifications, function (memo, module, key) {
                if (key === 'io.ox/mail') {
                    //mail is special when it comes to autoopen
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

            var focusBadge =  function (e) {
                if (e.which === 9 && e.shiftKey) {
                    //tabkey
                    e.preventDefault();
                    $('#io-ox-notifications-icon .notifications-icon').focus();
                }
            };
            var focusReload =  function (e) {
                if (e.which === 9 && !e.shiftKey) {
                    //tabkey
                    e.preventDefault();
                    $('#io-ox-refresh-icon .apptitle').focus();
                }
            };

            //clear last item reference
            if (this.lastItem) {
                this.lastItem.off('keydown', focusBadge);
                this.lastItem = undefined;
            }
            //jump back to first item if tab is pressed on last item
            this.lastItem = this.notificationsView.$el.find('[tabindex="1"]').last();
            this.lastItem.on('keydown', focusReload);

            //clear first item reference
            if (this.firstItem) {
                this.firstItem.off('keydown', focusBadge);
                this.firstItem = undefined;
            }
            //jump back to badge if tab is pressed on first item
            this.firstItem = this.notificationsView.$el.find('[tabindex="1"]').first();
            this.firstItem.on('keydown', focusBadge);
        },

        yell: yell
    };

    var controller = new NotificationController();

    // auto-close if other apps are started or app is changed see bug #32768
    // users might open mails from notification area, open a contact halo, clicking edit
    ox.on('app:start app:resume', function () {
        if (controller.badgeView) {
            //don't trigger to early
            controller.hideList();
        }
    });

    return controller;
});
