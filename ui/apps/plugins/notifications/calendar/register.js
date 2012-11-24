/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/notifications/calendar/register',
    ['io.ox/core/notifications',
     'io.ox/calendar/api',
     'io.ox/calendar/util',
     'io.ox/core/extensions',
     'io.ox/core/api/user',
     'gettext!plugins/notifications'
    ], function (notificationController, calApi, util, ext, userApi, gt) {

    'use strict';

    ext.point('io.ox/core/notifications/invites/header').extend({
        draw: function () {
            this.append(
                $('<legend class="section-title">').text(gt('Invitations')),
                $('<div class="notifications">')
            );
        }
    });

    ext.point('io.ox/core/notifications/invites/item').extend({
        draw: function (baton) {
            var model = baton.model;
            this.attr('data-cid', model.get('cid')).append(
                $('<div class="time">').text(model.get('time')),
                $('<div class="date">').text(model.get('date')),
                $('<div class="title">').text(model.get('title')),
                $('<div class="location">').text(model.get('location')),
                $('<div class="organizer">').text(model.get('blue')),
                $('<div class="actions">').append(
                    $('<button class="btn btn-inverse" data-action="accept_decline">').text(gt('Accept / Decline'))
                )
            );
        }
    });

    var ItemView = Backbone.View.extend({

        className: 'item',

        events: {
            'click': 'onClickItem',
            'click [data-action="accept_decline"]': 'onClickChangeStatus'
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/notifications/invites/item').invoke('draw', this.$el, baton);
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

        initialize: function () {
            this.collection.on('reset add remove', this.render, this);
        },

        render: function () {

            var baton = ext.Baton({ view: this });
            ext.point('io.ox/core/notifications/invites/header').invoke('draw', this.$el.empty(), baton);

            this.collection.each(function (model) {
                this.$el.append(
                    new ItemView({ model: model }).render().$el
                );
            }, this);

            return this;
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'appointments',
        index: 100,
        register: function (controller) {

            var notifications = controller.get('io.ox/calendar', NotificationsView);

            calApi.on('new-invites', function (e, invites) {

                var tmp = [];

                $.when.apply($,
                    _(invites).map(function (invite) {
                        var inObj = {
                            cid: _.cid(invite),
                            title: invite.title,
                            location: invite.location || '',
                            date: util.getDateInterval(invite),
                            time: util.getTimeInterval(invite),
                            data: invite
                        };
                        // TODO: ignore organizerId until we know better
                        var def = $.Deferred();
                        userApi.get({ id: invite.organizerId || invite.created_by })
                            .done(function (user) {
                                inObj.organizer = user.display_name;
                                tmp.push(inObj);
                                def.resolve();
                            })
                            .fail(function () {
                                // no organizer
                                inObj.organizer = invite.organizer || false;
                                tmp.push(inObj);
                                def.resolve();
                            });
                        return def;
                    })
                )
                .done(function () {
                    notifications.collection.reset(tmp);
                });
            });

            calApi.getInvites();
        }
    });
    return true;
});

