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
            this.model.on('change', _.bind(this.onChange, this));
        },
        onChange: function () {
            var count = this.model.get('count');
            this.$el.find('.badge').toggleClass('empty', count === 0);
            this.$el.find('.number').text(_.noI18n(count >= 100 ? '99+' : count));

            this.$el.attr(
                    //#. %1$d number of notifications
                    //#, c-format
                    'aria-label', gt.ngettext('You have %1$d notifications. Press [enter] to jump to the notification area and [escape] to close it again.',
                            'You have %1$d notifications. Press [enter] to jump to the notification area and [escape] to close it again.', this.model.get('count')));

        },
        onToggle: function (open) {
            this.$el.find('.badge i').attr('class', open ? 'icon-caret-down' : 'icon-caret-right');
        },
        render: function () {
            var numberNode;
            this.$el.attr({ href: '#',
                            tabindex: '1',
                            role: 'button',
                            //#. %1$d number of notifications
                            //#, c-format
                            'aria-label': gt.ngettext('You have %1$d notifications. Press [enter] to jump to the notification area and [escape] to close it again.',
                                    'You have %1$d notifications. Press [enter] to jump to the notification area and [escape] to close it again.', this.model.get('count'))})
                .append(
                $('<span class="badge">').append(
                    numberNode = $('<span class="number">'),
                    $.txt(' '),
                    $('<i class="icon-caret-right">')
                )
             );

            var autoOpenSetting = settings.get('autoOpenNotification', 'noEmail');
            if (autoOpenSetting === 'never') {
                numberNode.attr({role: 'alert',
                    'aria-atomic': false,
                    'aria-live': 'polite',
                    'aria-relevant': 'all',
                    //#. %1$d number of notifications
                    //#, c-format
                    'aria-label': gt.ngettext('You have %1$d notification', 'You have %1$d notifications', this.model.get('count'))
                });
            } else {
                numberNode.attr({role: 'alert',
                    'aria-atomic': false,
                    'aria-live': 'polite',
                    'aria-relevant': 'all',
                    //#. %1$d number of notifications
                    //#, c-format
                    'aria-label': gt.ngettext('You have %1$d notification', 'You have %1$d notifications', this.model.get('count'))
                });
            }
            this.onChange();
            return this;
        },
        setNotifier: function (b) {
            this.$el.find('.badge').toggleClass('active', !!b);
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
            this.$el.attr('role', 'list');
        },
        render: function (notifications) {
            var self = this,
                refocus = false,
                lastFocused = $(document.activeElement),//save focus
                nextFocus, //focus in case lastFocus got lost (item not there anymore)
                empty = true; //check if notification area is empty

            if (lastFocused.hasClass('refocus')) {//refocusable elements have this marker class
                //find next possible focus
                var items = $('#io-ox-notifications .item'),
                    lastFocusItemId = lastFocused.closest('.item').attr('focus-id');
                for (var i = 0; i < items.length; i++) {
                    if (lastFocusItemId === $(items[i]).attr('focus-id')) {
                        if ((i + 1) < items.length) { //prevent index out fo bounds
                            nextFocus = $(items[i + 1]).attr('focus-id');
                        }
                        break;
                    } else {
                        nextFocus = $(items[i]).attr('focus-id');
                    }
                }
                lastFocused = lastFocused.attr('focus-id');
                refocus = true;
            }
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

            if (refocus) {//restore focus if possible
                var found = self.$el.find('[focus-id="' + lastFocused + '"]');
                if (found.length > 0) {
                    found.focus();
                } else {//item was deleted. try focusing the next item
                    found = self.$el.find('[focus-id="' + nextFocus + '"]');
                    if (found.length > 0) {//focus if its there
                        found.focus();
                    } else {//just focus first
                        $('#io-ox-notifications .item').first().focus();
                    }
                }
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
            var self = this;

            this.badgeView = new BadgeView({ model: new Backbone.Model({ count: 0})});

            this.notificationsView = new NotificationsView();

            $('#io-ox-core').prepend(
                $('<div id="io-ox-notifications" tabindex="-1">').append(this.notificationsView.el),
                $('<div id="io-ox-notifications-overlay" class="abs notifications-overlay">').click(function (e) {
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
                var overlay = $('#io-ox-notifications-overlay');
                if (overlay.children().length > 0) {//if there is an open popup, wait till this is closed
                    overlay.prop('sidepopup').one('close', _.bind(self.slowClose, self));
                } else {
                    self.hideList();
                }
            });

            // invoke plugins
            ox.manifests.loadPluginsFor('io.ox/core/notifications').done(function () {
                ext.point('io.ox/core/notifications/register').invoke('register', self, self);
            });

            function focusNotifications(e) {
                if (e.which === 13) { //enter
                    if (self.opened()) {//focus badge when closing
                        _.defer(function () { self.badgeView.$el.focus(); });
                    } else {//focus notifications when opening
                        _.defer(function () { $('#io-ox-notifications .item').first().focus(); });
                    }
                }
            }

            return addLauncher(
                'right',
                self.badgeView.render().$el.on('keydown', focusNotifications),
                $.proxy(this.toggleList, this)
            ).attr('id', 'io-ox-notifications-icon');
        },
        opened: function () {
            return $('#io-ox-notifications').hasClass('active');
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
            $('#io-ox-notifications-overlay').off('mail-detail-closed');
            this.hideList();
        },
        delayedUpdate: function () {//delays updating by 100ms (prevents updating the view multiple times in a row)
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
                e.preventDefault();//prevent default to not jump to reload button
                if (e.which === 9) { //tabkey
                    $('#io-ox-notifications .item').first().focus();
                }
            };

            this.notificationsView.render(this.notifications);
            //clear last item reference
            if (this.lastItem) {
                this.lastItem.off('keydown', focusBadge);
                this.lastItem = undefined;
            }
            //jump back to first item if tab is pressed on last item
            this.lastItem = this.notificationsView.$el.find('[tabindex="1"]').last();
            this.lastItem.on('keydown', focusBadge);
        },
        toggleList: function () {
            //create nice listing view of all notifications grouped by
            //their app
            if ($('#io-ox-notifications').hasClass('active')) {
                this.hideList();
                if (_.device('smartphone')) {
                    $('#io-ox-notifications-overlay').empty().removeClass('active');
                }
            } else {
                this.showList();
            }
        },
        showList: function () {
            if (_.device('smartphone')) {
                $('[data-app-name="io.ox/portal"]:visible').addClass('notifications-open');
            }
            //$('#io-ox-notifications').find('[tabindex="1"]').focus();
            $('#io-ox-notifications').addClass('active');
            $('#io-ox-notifications-overlay').addClass('active');
            this.badgeView.onToggle(true);
            $(document).on('keydown.notification', $.proxy(function (e) {
                if (e.which === 27 && !($('#io-ox-notifications-overlay').prop('sidepopup'))) { // escapekey and no open sidepopup (escapekey closes the sidepopup then)
                    $(document).off('keydown.notification');
                    //focus badge when closing
                    this.badgeView.$el.focus();
                    this.hideList();
                }
            }, this));
        },
        hideList: function () {

            _.each(this.badges, function (badgeView) {
                badgeView.setNotifier(false);
            });
            this.badgeView.onToggle(false);
            $('#io-ox-notifications').removeClass('active');
            $('#io-ox-notifications-overlay').empty().removeClass('active');
            if (_.device('smartphone')) {
                $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
            }

        },

        // type = info | warning | error | success
        yell: (function () {


            //$('#io-ox-core').prepend($('<div id="io-ox-notifications-popups">'));

            var validType = /^(busy|error|info|success|warning)$/,
                active = false,
                timer = null,
                isSmartphone = _.device('smartphone'),

                durations = {
                    busy: 10000,
                    error: 30000,
                    info: 10000,
                    success: 4000,
                    warning: 10000
                },

                icons = {
                    busy: 'icon-refresh icon-spin',
                    error: 'icon-exclamation',
                    info: 'icon-exclamation',
                    success: 'icon-ok',
                    warning: 'icon-exclamation'
                },

                remove = function () {

                    active = false;
                    clearTimeout(timer);

                    $('.io-ox-alert')
                        .on('transitionend webkitTransitionEnd', function () {
                            $(this).remove();
                        })
                        .removeClass('slide-in');
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

            $(document).on('click tap', click);

            return function (type, message) {

                if (type === 'close') return remove();

                var o = {
                    duration: 0,
                    html: false,
                    type: 'info'
                };

                // catch server error?
                if (_.isObject(type)) {
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
                }

                // add message
                if (validType.test(o.type)) {

                    active = false;
                    clearTimeout(timer);

                    timer = o.duration === -1 ? null : setTimeout(remove, o.duration || durations[o.type] || 5000);

                    var html = o.html ? o.message : _.escape(o.message).replace(/\n/g, '<br>'),
                        reuse = false,
                        className = 'io-ox-alert io-ox-alert-' + o.type,
                        wordbreak = html.indexOf('http') >= 0 ? 'break-all' : 'normal';

                    // reuse existing alert?
                    var node = $('.io-ox-alert.slide-in');

                    if (node.length) {
                        node.empty();
                        reuse = true;
                        className += ' slide-in';
                    } else {
                        node = $('<div role="alert" tabindex="-1">');
                    }

                    node.attr('class', className).append(
                        $('<div class="icon">').append(
                            $('<i>').addClass(icons[o.type] || 'icon-none')
                        ),
                        $('<div class="message user-select-text">').append(
                            o.headline ? $('<h2 class="headline">').text(o.headline) : [],
                            $('<div>').css('word-break', wordbreak).html(html)
                        ),
                        $('<a href="#" class="close" tabindex="1">').html('&times')
                    );

                    if (!reuse) $('body').append(node);

                    // put at end of stack not to run into opening click
                    setTimeout(function () {
                        active = true;
                        if (!reuse) node.addClass('slide-in');
                    }, 300);
                }
            };
        }())
    };
    return new NotificationController();
});
