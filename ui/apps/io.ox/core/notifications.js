/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/notifications', [
    'io.ox/core/extensions',
    'io.ox/core/notifications/badgeview',
    'io.ox/core/yell',
    'gettext!io.ox/core'
], function (ext, badgeview, yell, gt) {

    'use strict';

    var NotificationsModel = Backbone.Model.extend({
        defaults: {
            subviews: {},
            status: 'closed', //possible states 'closed', 'open', 'sidepopup'
            sidepopup: null,
            markedForRedraw: {}
        }
    });
    var NotificationsView = Backbone.View.extend({
        tagName: 'div',
        id: 'io-ox-notifications-display',
        initialize: function () {
            var self = this;
            self.bannerHeight = 0;
            this.badgeview = new badgeview.view({ model: new badgeview.model() });
            //close when clicked outside, since we don't have the overlay anymore
            //does not work with some dropdowns though (they prevent event bubbling), but the notification popup is in the background then
            $(document.body).on('click', function (e) {
                var isInside = $( e.target )
                    .closest('#io-ox-notifications, #io-ox-notifications-sidepopup, #io-ox-notifications-icon, .io-ox-dialog-popup, .modal-footer, .custom-dropdown').length > 0;

                if (!isInside ) {
                    if (self.getStatus() !== 'closed') {
                        self.hide();
                    }
                }
            });
        },
        registerSubview: function (subview) {
            var subviews = this.model.get('subviews'),
                self = this;
            //prevent overwriting of existing subviews
            if (!subviews[subview.model.get('id')]) {
                subviews[subview.model.get('id')] = subview;
                //always draw at least one time (to keep the order )
                self.model.get('markedForRedraw')[subview.model.get('id')] = true;
                subview.collection.on('add reset remove', function (collection) {
                    if (!collection.subviewId) {
                        //sometimes the first parameter is a model and not a collection (add event)
                        collection = collection.collection;
                    }
                    self.model.get('markedForRedraw')[collection.subviewId] = true;
                    self.delayedUpdate.call(self);
                });
                subview.on('autoopen', _.bind(self.show, self));
                this.badgeview.registerView(subview);
            }
            return subview;
        },
        render: function () {
            var self = this,
                subviews = this.model.get('subviews'),
                markedForRedraw = this.model.get('markedForRedraw');

            this.model.set('markedForRedraw', {});

            //remove old empty message to avoid duplicates
            self.$el.find('.no-news-message').remove();
            _(markedForRedraw).each(function (value, id) {
                if (value) {
                    subviews[id].render(self.$el);
                }
            });

            if (self.$el.children(':not(.notification-placeholder)').length === 0) {
                self.$el.prepend($('<h1 class="section-title no-news-message">').text(gt('No notifications')));
            }

            return self;
        },

        //opens a Sidepopup using the given renderer using the provided data
        //a renderer can be an object with a draw function or an object that contains a View constructor
        //data may be an object or a deferred object returning valid data (for example our api.get() functions)
        openSidepopup: function (cid, renderer, data) {
            var self = this,
                cont = function () {
                    // open dialog first to be visually responsive
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        self.nodes.sidepopup.attr('data-cid', cid).appendTo(document.body);
                        // open SidePopup without arrow
                        var popup = new dialogs.SidePopup({ arrow: false, side: 'left' })
                            .setTarget(self.nodes.sidepopup.empty())
                            .show({ target: self.nodes.sidepopup.empty() }, function (popup) {
                                var node = popup.closest('.io-ox-sidepopup');
                                if (!_.device('smartphone')) {
                                    var top = self.bannerHeight + 50;
                                    node.css({
                                        right: '400px',
                                        top: top + 'px'
                                    });
                                }
                                node.addClass('io-ox-notifications-sidepopup first');
                                var cont = function (data) {
                                        //work with real model view or just draw method with baton
                                        if (renderer.View) {
                                            var view = new renderer.View({ data: data });
                                            popup.idle().append(view.render().expand().$el.addClass('no-padding'));
                                        } else {
                                            popup.idle().append(renderer.draw({ data: data }).addClass('no-padding'));
                                        }

                                        if (_.device('smartphone')) {
                                            self.nodes.main.removeClass('active');
                                        }
                                        return data;
                                    };
                                //check if data is deferred
                                if (data.then) {
                                    // fetch proper item now
                                    popup.busy();
                                    data.then(cont);
                                } else {
                                    cont(data);
                                }
                            });
                        self.model.set('status', 'sidepopup');
                        self.model.set('sidepopup', popup);
                        popup.on('close', $.proxy(self.onCloseSidepopup, self));
                    });
                };
            //if there is a sidepopup that is about to close we wait for this to avoid sideeffects
            if (self.model.get('sidepopup') && self.sidepopupIsClosing) {
                self.model.get('sidepopup').one('close', cont);
            } else {
                cont();
            }

        },

        onCloseSidepopup: function () {
            this.sidepopupIsClosing = false;
            this.model.set('status', 'open');
            if (_.device('smartphone')) {
                this.nodes.main.addClass('active');
            }

            //focus first for now
            this.nodes.main.find('.item').first().focus();
            var self = this,
                popup = this.model.get('sidepopup');
            if (popup) {
                popup.off('close');
                self.nodes.sidepopup.attr('data-cid', null).detach();
            }
            this.model.set('sidepopup', null);
        },

        closeSidepopup: function () {
            if (this.model.get('sidepopup')) {
                //popups close with a delay of 100ms, causes strange behavior if we open a new one during that time
                this.sidepopupIsClosing = true;
                this.model.get('sidepopup').close();
            }
        },

        getSidepopup: function () {
            return this.model.get('sidepopup');
        },

        getStatus: function () {
            return this.model.get('status');
        },

        isOpen: function () {
            return this.model.get('status') !== 'closed';
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
            this.badgeview.onToggle(true);

            $(document).on('keydown.notification', $.proxy(function (e) {
                if (e.which === 27 && !(this.model.get('sidepopup'))) {
                    // escapekey and no open sidepopup (escapekey closes the sidepopup then)
                    this.hide();
                }
            }, this));

            // try to focus first item; focus badge otherwise
            var firstItem = this.nodes.main.find('[tabindex="1"]').first();
            if (firstItem.length > 0) firstItem.focus(); else this.badgeview.$el.focus();

            this.model.set('status', 'open');
            this.trigger('show');
        },

        hide: function () {
            $(document).off('keydown.notification');
            var badgeview = this.badgeview;
            // if it's closed already we're done
            if (!this.isOpen()) return;

            badgeview.setNotifier(false);

            this.closeSidepopup();
            this.nodes.main.removeClass('active');
            badgeview.onToggle(false);

            if (_.device('smartphone')) {
                $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
            }

            badgeview.$el.focus();
            this.model.set('status', 'closed');
            this.trigger('hide');
        },

        nodes: {
            main: $('<div>').attr({
                tabindex: -1,
                id: 'io-ox-notifications'
            }),
            sidepopup: $('<div>').attr({
                id: 'io-ox-notifications-sidepopup'
            })
        },

        //delay only affects requests, not the drawing of the badge
        attach: function (addLauncher, delay) {

            //view
            var self = this,
                badgeview = this.badgeview;

            $('#io-ox-core').prepend(
                self.nodes.main.append(this.el)
            );

            //adjust top if theres a banner (cannot be done before because its not attached when the banner is drawn)
            var bannerHeight = $('#io-ox-banner:visible').css('height'),
                nodeHeight = parseInt(self.nodes.main.css('top').replace('px',''), 10);

            if (bannerHeight) {

                bannerHeight = parseInt(bannerHeight.replace('px',''), 10);
                self.bannerHeight = bannerHeight;
                var newHeight = nodeHeight + bannerHeight;
                self.nodes.main.css('top', newHeight + 'px');
            }

            //close if count set to 0
            badgeview.on('auto-close', function () {
                //if there is an open popup, wait till this is closed
                if (self.getStatus() === 'sidepopup') {
                    self.model.get('sidepopup').one('close', _.bind(self.hide, self));
                } else {
                    self.hide();
                }
            });

            // load and invoke plugins with delay
            setTimeout(function () {
                ox.manifests.loadPluginsFor('io.ox/core/notifications').done(function () {
                    ext.point('io.ox/core/notifications/register').invoke('register', self, self);
                });
            }, delay || 2000);

            return addLauncher(
                'right',
                badgeview.render().$el,
                $.proxy(this.toggle, this)
            ).attr('id', 'io-ox-notifications-icon');
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
            this.badgeview.setNotifier(true);
            this.delayedUpdate();
        },
        update: function () {

            this.render();
        },

        yell: yell
    });

    var view = new NotificationsView({ model: new NotificationsModel() });

    // auto-close if other apps are started or app is changed see bug #32768
    // users might open mails from notification area, open a contact halo, clicking edit
    ox.on('app:start app:resume', function () {
        if (view.badgeview) {
            //don't trigger to early
            view.hide();
        }
    });

    return view;
});
