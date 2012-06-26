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

define('plugins/notifications/calendar/register',
    ['io.ox/core/notifications',
     'io.ox/calendar/api',
     'io.ox/calendar/util',
     'io.ox/core/extensions',
     'io.ox/core/api/user',
     'dot!plugins/notifications/calendar/template.html',
     'gettext!plugins/notifications/calendar'
    ], function (notificationController, calApi, util, ext, userApi, tpl, gt) {

    'use strict';

    var NotificationView = Backbone.View.extend({
        events: {
            'click .item': 'onClickItem',
            'click [data-action="accept_decline"]': 'onClickChangeStatus'
        },
        _modelBinder: undefined,
        initialize: function () {
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            this.$el.empty().append(tpl.render('plugins/notifications/calendar/inviteitem', {}));
            var bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property');
            bindings.cid = { selector: "[data-cid]", elAttribute: 'data-cid' };
            console.log('Sooo', bindings);
            this._modelBinder.bind(this.model, this.el, bindings);
            return this;
        },
        onClickItem: function (e) {
            var obj = this.model.get('data'),
                overlay = $('#io-ox-notifications-overlay'),
                sidepopup = overlay.prop('sidepopup'),
                cid = String(overlay.find('[data-cid]').data('cid'));

            // toggle?
            if (sidepopup && cid === _.cid(obj)) {
                sidepopup.close();
            } else {
                // fetch proper appointment first
                calApi.get(obj).done(function (data) {
                    require(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-detail'], function (dialogs, view) {
                        // open SidePopup without array
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay.empty())
                            .show(e, function (popup) {
                                popup.append(view.draw(data));
                                   // .parent().removeClass('default-content-padding');
                            });
                    });
                });
            }
        },
        onClickChangeStatus: function (e) {
            // stopPropagation could be prevented by another markup structure
            e.stopPropagation();
            var self = this;
            require(['io.ox/calendar/acceptdeny']).done(function (acceptdeny) {
                acceptdeny(self.model.get('data'));
            });
        }
    });

    var NotificationsView = Backbone.View.extend({
        className: 'notifications',
        id: 'io-ox-notifications-calendar',
        _collectionBinder: undefined,
        initialize: function () {
            var viewCreator = function (model) {
                return new NotificationView({model: model});
            };
            var elManagerFactory = new Backbone.CollectionBinder.ViewManagerFactory(viewCreator);
            this._collectionBinder = new Backbone.CollectionBinder(elManagerFactory);
        },
        render: function () {
            this.$el.empty().append(tpl.render('plugins/notifications/calendar/invites', {
                strings: {
                    NEW_INVITES: gt('Invitations')
                }
            }));
            this._collectionBinder.bind(this.collection, this.$('.notifications'));
            return this;
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'appointments',
        index: 100,
        register: function (controller) {

            var notifications = controller.get('io.ox/calendar', NotificationsView);

            calApi.on('new-invites', function (e, invites) {
                notifications.collection.reset([]);
                _(invites).each(function (invite) {
                    var inObj = {
                        cid: _.cid(invite),
                        title: invite.title,
                        subject: invite.location,
                        date: util.getDateInterval(invite),
                        time: util.getTimeInterval(invite),
                        data: invite
                    };
                    // TODO: ignore organizerId until we know better
                    var userId = invite.organizerId || invite.created_by;
                    userApi.get({ id: userId })
                        .done(function (user) {
                            inObj.organizer = user.display_name;
                            notifications.collection.push(inObj);
                        })
                        .fail(function () {
                            // no organizer
                            inObj.organizer = invite.organizer || false;
                            notifications.collection.push(inObj);
                        });
                });
            });

            calApi.getInvites();
        }
    });
    return true;
});

