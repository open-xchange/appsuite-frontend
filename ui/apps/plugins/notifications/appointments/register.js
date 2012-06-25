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
define('plugins/notifications/appointments/register',
      ['io.ox/core/notifications',
       'io.ox/calendar/api',
       'io.ox/calendar/util',
       'io.ox/core/extensions',
       'dot!plugins/notifications/appointments/template.html',
       'gettext!plugins/notifications/appointments',
       'less!plugins/notifications/appointments/style.css'], function (notificationController, calApi, util, ext, tpl, gt) {

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
            this.$el.empty().append(tpl.render('plugins/notifications/appointments/inviteitem', {}));
            this._modelBinder.bind(this.model, this.el, Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property'));
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


            // this is plain copy of the one in the actions.js - may be add it to something like dialogs.js in the calendar view
            var o = {
                id: this.model.get('data').id,
                folder: this.model.get('data').folder_id
            };

            var inputid = _.cid('dialog');

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.ModalDialog()
                    .header($('<h3>').text('Change confirmation status'))
                    .append($('<p>').text(gt('You are about the change your confirmation status. Please leave a comment for other participants.')))
                    .append(
                        $('<div>').addClass('row-fluid').css({'margin-top': '20px'}).append(
                            $('<div>').addClass('control-group span12').css({'margin-bottom': '0px'}).append(
                                $('<label>').addClass('control-label').attr('for', inputid).text(gt('Comment:')),
                                $('<div>').addClass('controls').css({'margin-right': '10px'}).append(
                                    $('<input>')
                                    .css({'width': '100%'})
                                    .attr('data-property', 'comment')
                                    .attr('id', inputid))
                                )
                            )
                        )
                    .addAlternativeButton('cancel', gt('Cancel'))
                    .addDangerButton('declined', gt('Decline'))
                    .addWarningButton('tentative', gt('Tentative'))
                    .addSuccessButton('accepted', gt('Accept'))
                    .show(function () {
                        $(this).find('[data-property="comment"]').focus();
                    })
                    .done(function (action, data, node) {
                        var val = $.trim($(node).find('[data-property="comment"]').val());
                        if (action === 'cancel') {
                            return;
                        }
                        o.data = {};
                        o.data.confirmmessage = val;

                        switch (action) {
                        case 'cancel':
                            return;
                        case 'accepted':
                            o.data.confirmation = 1;
                            self.model.collection.remove(self.model); //just remove it from collection
                            break;
                        case 'declined':
                            o.data.confirmation = 2;
                            self.model.collection.remove(self.model); //just remove it from collection
                            break;
                        case 'tentative':
                            // should be viewable next time only
                            o.data.confirmation = 3;
                            self.model.collection.remove(self.model); //just remove it from collection
                            break;
                        }

                        calApi.confirm(o)
                            .fail(function (err) {
                                console.log('ERROR', err);
                            });
                    });
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
            this.$el.empty().append(tpl.render('plugins/notifications/appointments/invites', {
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
            console.log('registering calendar notifications');
            var notifications = controller.get('io.ox/calendar', NotificationsView);

            calApi.refresh();
            calApi.on('invites', function (e, invites) {
                notifications.collection.reset([]);
                _(invites).each(function (invite) {
                    notifications.collection.unshift({
                        title: invite.title,
                        subject: invite.location,
                        date: util.getDateInterval(invite),
                        time: util.getTimeInterval(invite),
                        data: invite
                    });
                });
            });
        }
    });


    return true;
});

