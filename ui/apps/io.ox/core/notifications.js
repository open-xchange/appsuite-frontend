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
     'settings!io.ox/core',
     'gettext!io.ox/core'
    ], function (ext, settings, gt) {

    'use strict';

    var BadgeView = Backbone.View.extend({
        tagName: 'a',
        className: 'notifications-icon',
        initialize: function () {
            this.model.set('a11y', '');
            this.model.on('change', _.bind(this.onChange, this));
            this.nodes = {};
        },
        onChange: function () {
            var count = this.model.get('count'),
                //#. %1$d number of notifications
                //#, c-format
                a11y = gt.format(gt.ngettext('You have %1$d notification.', 'You have %1$d notifications.', count), count),
                a11yState = this.$el.attr('aria-pressed') ? gt('The notification area is open') : gt('The notification area is closed');
            this.model.set('a11y', a11y, {silent: true});//don't create a loop here
            this.nodes.badge.toggleClass('empty', count === 0);
            this.$el.attr('aria-label', a11y + ' ' + a11yState);
            this.nodes.number.text(_.noI18n(count >= 100 ? '99+' : count));
            new NotificationController().yell('screenreader', a11y);
        },
        onToggle: function (open) {
            var a11yState = open ? gt('The notification area is open') : gt('The notification area is closed');
            this.nodes.icon.attr('class', open ? 'fa fa-caret-down' : 'fa fa-caret-right');
            this.$el.attr({'aria-pressed': open ? true : false,
                           'aria-label': this.model.get('a11y') + ' ' + a11yState});
        },
        render: function () {
            this.$el.attr({
                    href: '#',
                    tabindex: '1',
                    role: 'button',
                    'aria-pressed': false
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
            var newOther = count - this.model.get('count') - newMails;//check if there are new notifications, that are not mail

            if (newOther > 0) { //new notifications not mail
                this.trigger('newNotifications');
            } else if (newMails > 0) { //new mail notifications
                this.trigger('newMailNotifications');
            } else //just trigger if count is set to 0, not if it was 0 already
                if (count === 0 && this.model.get('count') > count) {
                this.trigger('lastItemDeleted');
            }
            this.model.set('count', count);
        }
    });

    var NotificationsView = Backbone.View.extend({
        tagName: 'ul',
        id: 'io-ox-notifications-display',
        className: 'list-unstyled',
        initialize: function (options) {
            options = options || {};
            this.subviews = options.subviews || {};
        },
        render: function (notifications) {
            var self = this,
                refocus = false,
                lastFocused = $(document.activeElement, self.$el), //save focus
                nextFocus, //focus in case lastFocus got lost (item not there anymore)
                empty = true; //check if notification area is empty

            //remove old empty message to avoid duplicates
            self.$el.find('.no-news-message').remove();

            if (lastFocused.hasClass('refocus')) { //refocusable elements have this marker class
                //find next possible focus
                var items = $('#io-ox-notifications .item'),
                    lastFocusItemId = lastFocused.closest('.item').attr('focus-id');
                if (lastFocusItemId !== undefined) { //refocus only when inside of items (clear buttons or inbox link are outside)
                    for (var i = 0; i < items.length; i++) {
                        if (lastFocusItemId === $(items[i]).attr('focus-id')) {
                            if ((i + 1) < items.length) { //prevent index out of bounds
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


            if (_.size(self.subviews) < _.size(notifications)) { //make sure views are created one time only to avoid zombies
                _(notifications).each(function (category, type) {
                    if (self.subviews[type] === undefined) {
                        self.subviews[type] = new category.ListView({ collection: category.collection});
                    }
                });
            }

            _(self.subviews).each(function (category) {
                //subviews must be rendered even if they have 0 items.
                //this is because the empty call had to be moved from the general render of the notification area to each subview.
                //if empty is called here the notificationviews loose their events on redraw and if we don't call render views with 0 items they might not clear old items properly
                self.$el.append(category.render().el);
                if (category.collection.length > 0) {
                    empty = false;
                }
            });

            if (empty) {
                self.$el.append($('<legend class="section-title no-news-message">').text(gt('No notifications')));
            }

            if (refocus) { //restore focus if possible
                var found = self.$el.find('[focus-id="' + lastFocused + '"]');
                if (found.length > 0) {
                    found.focus();
                } else { //item was deleted. try focusing the next item
                    found = self.$el.find('[focus-id="' + nextFocus + '"]');
                    if (found.length > 0) { //focus if its there
                        found.focus();
                    } else { //just focus first
                        $('#io-ox-notifications .refocus').first().focus();
                    }
                }
            }
            return self;
        }
    });

    var NotificationController = function () {

        this.notifications = {};
        this.oldMailCount = 0; // special variable needed to check for autoopen on new mail
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

            if (this.isOpen()) return; // if it's open already we're done

            if (_.device('smartphone')) {
                $('[data-app-name="io.ox/portal"]:visible').addClass('notifications-open');
            }

            this.nodes.main.addClass('active');
            this.nodes.overlay.addClass('active');
            this.badgeView.onToggle(true);

            $(document).on('keydown.notification', $.proxy(function (e) {
                if (e.which === 27 && !(this.nodes.overlay.prop('sidepopup'))) { // escapekey and no open sidepopup (escapekey closes the sidepopup then)
                    $(document).off('keydown.notification');
                    this.hideList();
                    //focus badge when closing
                    this.badgeView.$el.focus();
                }
            }, this));

            // try to focus first item; focus badge otherwise
            var firstItem = $('#io-ox-notifications .item').first();
            if (firstItem.length > 0) firstItem.focus(); else this.badgeView.$el.focus();

            this.trigger('show');
        },

        hide: function () {

            if (!this.isOpen()) return; // if it's closed already we're done

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

        attach: function (addLauncher, delay) { //delay only affects requests, not the drawing of the badge
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

                self.badgeView.off('newNotifications newMailNotifications');//prevent stacking of eventhandlers

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
                if (self.nodes.overlay.children().length > 0) { //if there is an open popup, wait till this is closed
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
                if (e.which === 13) { //enter
                    if (self.isOpen()) { //focus badge when closing
                        _.defer(function () {
                            self.badgeView.$el.focus();
                        });
                    } else { //focus notifications when opening
                        _.defer(function () {
                            var firstItem = $('#io-ox-notifications .item').first();
                            if (firstItem.length > 0) {
                                firstItem.focus();
                            } else {
                                self.badgeView.$el.focus();
                            }
                        });
                    }
                }
            }

            return addLauncher(
                'right',
                self.badgeView.render().$el.on('keydown', focusNotifications),
                $.proxy(this.toggleList, this)
            ).attr('id', 'io-ox-notifications-icon');
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
        delayedUpdate: function () { //delays updating by 100ms (prevents updating the view multiple times in a row)
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

            var focusBadge =  function (e) {
                if (e.which === 9) { //tabkey
                    e.preventDefault(); //prevent default to not jump to reload button
                    $('#io-ox-notifications .refocus').first().focus();
                }
            };

            //clear last item reference
            if (this.lastItem) {
                this.lastItem.off('keydown', focusBadge);
                this.lastItem = undefined;
            }
            //jump back to first item if tab is pressed on last item
            this.lastItem = this.notificationsView.$el.find('[tabindex="1"]').last();
            this.lastItem.on('keydown', focusBadge);
        },

        // type = info | warning | error | success | screenreader
        yell: (function () {

            //$('#io-ox-core').prepend($('<div id="io-ox-notifications-popups">'));

            var validType = /^(busy|error|info|success|warning|screenreader)$/,
                active = false,
                timer = null,
                isSmartphone = _.device('smartphone'),

                durations = {
                    busy: 10000,
                    error: 30000,
                    info: 10000,
                    success: 4000,
                    warning: 10000,
                    screenreader: 100,
                },

                icons = {
                    busy: 'fa fa-refresh fa-spin',
                    error: 'fa fa-exclamation',
                    info: 'fa fa-exclamation',
                    success: 'fa fa-check',
                    warning: 'fa fa-exclamation'
                },

                remove = function (immediately) {

                    var nodes = $('.io-ox-alert');

                    active = false;
                    clearTimeout(timer);

                    nodes.trigger('notification:removed');
                    if (immediately) {
                        nodes.remove();
                        return;
                    }

                    nodes.removeClass('appear');

                    // has been event-based (transitionend webkitTransitionEnd) but sometimes
                    // such events are not triggered causing invisible but blocking overlays
                    setTimeout(function () {
                        nodes.remove(); nodes = null;
                    }, 300);
                },

                click = function (e) {

                    if (!active) return;

                    if (isSmartphone) return remove();

                    var target = $(e.target), alert = target.closest('.io-ox-alert');

                    // click on notification?
                    if (alert.length) {
                        // don't close on plain links
                        if (target.is('a') && !target.hasClass('close')) return;
                        // close if clicked on close icon or if clicked on success notifications
                        if (target.hasClass('close') || alert.hasClass('io-ox-alert-success')) {
                            e.preventDefault();
                            remove();
                        }
                    } else {
                        remove();
                    }
                };

            $(document).on(_.device('touch') ? 'tap' : 'click', click);

            return function (type, message, focus) {

                if (type === 'destroy') return remove(true);
                if (type === 'close') return remove();

                var o = {
                    duration: 0,
                    html: false,
                    type: 'info',
                    focus: false
                };

                if (_.isObject(type)) {
                    // catch server error?
                    if ('error' in type) {
                        o.type = 'error';
                        o.message = type.message || type.error;
                        o.headline = gt('Error');
                    } else {
                        o = _.extend(o, type);
                    }
                } else {
                    o.type = type || 'info';
                    o.message = message;
                    o.focus = focus;
                }

                // add message
                if (validType.test(o.type)) {

                    active = false;

                    if (o.type !== 'screenreader') { //screenreader notifications should not remove standard ones, so special remove here
                        clearTimeout(timer);
                        timer = o.duration === -1 ? null : setTimeout(remove, o.duration || durations[o.type] || 5000);
                    } else {
                        setTimeout(function () {
                            $('.io-ox-alert-screenreader').remove();
                        }, o.duration || durations[o.type] || 100);
                    }

                    var html = o.html ? o.message : _.escape(o.message).replace(/\n/g, '<br>'),
                        reuse = false,
                        className = 'io-ox-alert io-ox-alert-' + o.type + (o.type === 'screenreader' ? ' sr-only' : ''),
                        wordbreak = html.indexOf('http') >= 0 ? 'break-all' : 'normal';

                    // reuse existing alert?
                    var node = $('.io-ox-alert');

                    if (node.length && o.type !== 'screenreader') { //screenreader should not reuse existing notifications, this would only remove them for other users
                        node.empty();
                        reuse = true;
                        className += ' appear';
                    } else {
                        node = $('<div role="alert" tabindex="-1">');
                    }

                    node.attr('class', className).append(
                        $('<div class="icon">').append(
                            $('<i>').addClass(icons[o.type] || 'fa fa-fw')
                        )
                    );

                    if (o.type !== 'screenreader') {
                        node.append(
                            $('<div class="message user-select-text">').append(
                                o.headline ? $('<h2 class="headline">').text(o.headline) : [],
                                $('<div>').css('word-break', wordbreak).html(html)
                            ),
                            $('<a href="#" role="button" class="close fa fa-times" tabindex="1">').attr('aria-label', gt('Click to close this notification'))
                        );
                    } else {
                        node.append(
                            $('<div class="message user-select-text">').append(
                                o.headline ? $('<h2 class="headline">').text(o.headline) : []
                            ),
                            $('<div>').css('word-break', wordbreak).html(html)
                        );
                    }

                    if (!reuse) $('#io-ox-core').append(node);

                    // put at end of stack not to run into opening click
                    setTimeout(function () {
                        active = true;
                        if (!reuse) {
                            node.addClass('appear');
                        }

                        if (o.focus) {
                            node.attr('tabindex', 1);
                            node.focus();
                        } else {
                            node.attr('tabindex', -1);
                        }

                    }, _.device('touch') ? 300 : 0);

                    return node;
                }
            };
        }())
    };

    var controller = new NotificationController();

    // auto-close if other apps are started; see bug #32768
    // users might open mails from notification area, open a contact halo, clicking edit
    ox.on('app:start', function () {
        if (controller.badgeView) {//don't trigger to early
            controller.hideList();
        }
    });

    return controller;
});
