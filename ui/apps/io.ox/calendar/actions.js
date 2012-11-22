/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/calendar/api',
     'io.ox/calendar/util',
     'gettext!io.ox/calendar/actions',
     'io.ox/core/config',
     'io.ox/core/notifications'], function (ext, links, api, util, gt, config, notifications) {

    'use strict';

    var Action = links.Action,
        ActionGroup = links.ActionGroup,
        ActionLink = links.ActionLink,

        POINT = 'io.ox/calendar';

    // Actions
    new Action('io.ox/calendar/actions/switch-to-list-view', {
        requires: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'list');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-month-view', {
        requires: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'month');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-fullweek-view', {
        requires: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'week:week');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-week-view', {
        requires: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'week:workweek');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-day-view', {
        requires: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'week:day');
        }
    });

    new Action('io.ox/calendar/detail/actions/sendmail', {
        action: function (baton) {
            var def = $.Deferred();
            util.createArrayOfRecipients(baton.data.participants, def);
            def.done(function (arrayOfRecipients) {
                require(['io.ox/mail/write/main'], function (m) {
                    m.getApp().launch().done(function () {
                        this.compose({to: arrayOfRecipients, subject: baton.data.title});
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/save-as-distlist', {
        action: function (baton) {
            var contactsFolder = config.get('folder.contacts'),
                def = $.Deferred();
            util.createDistlistArrayFromPartisipantList(baton.data.participants, def);
            def.done(function (initdata) {
                require(['io.ox/contacts/distrib/main'], function (m) {
                    m.getApp().launch().done(function () {
                        this.create(contactsFolder, initdata);
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/edit', {
        id: 'edit',
        requires: 'one modify',
        action: function (baton) {
            var params = baton.data,
                o = {
                    id: params.id,
                    folder: params.folder_id
                };
            if (!_.isUndefined(params.recurrence_position)) {
                o.recurrence_position = params.recurrence_position;
            }
            api.get(o)
                .done(function (data) {
                    require(['io.ox/calendar/edit/main'], function (editmain) {
                        if (data.recurrence_type > 0) {
                            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                                new dialogs.ModalDialog()
                                    .text(gt('Do you want to edit the whole series or just one appointment within the series?'))
                                    .addPrimaryButton('series', gt('Series'))
                                    .addButton('appointment', gt('Appointment'))
                                    .addButton('cancel', gt('Cancel'))
                                    .show()
                                    .done(function (action) {
                                        if (action === 'cancel') {
                                            return;
                                        }
                                        if (action === 'series') {
                                            delete data.recurrence_position;
                                        }
                                        editmain.getApp().launch().done(function () {
                                            this.edit(data);
                                        });
                                    });
                            });
                        } else {
                            editmain.getApp().launch().done(function () {
                                this.edit(data);
                            });
                        }
                    });
                })
                .fail(function () {
                    console.log('NOT FOUND');
                });
        }
    });


    new Action('io.ox/calendar/detail/actions/delete', {
        id: 'delete',
        requires: 'one modify',
        action: function (baton) {
            var params = baton.data,
                o = {
                id: params.id,
                folder: params.folder_id
            };
            if (!_.isUndefined(params.recurrence_position)) {
                o.recurrence_position = params.recurrence_position;
            }
            api.get(o)
                .done(function (data) {
                    require(['io.ox/calendar/model'], function (Model) {
                        // different warnings especially for events with
                        // external users should handled here
                        var myModel = new Model.Appointment(data);
                        if (data.recurrence_type > 0) {
                            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                                new dialogs.ModalDialog()
                                    .text(gt('Do you want to delete the whole series or just one appointment within the series?'))
                                    .addPrimaryButton('appointment', gt('Delete appointment'))
                                    .addPrimaryButton('series', gt('Delete whole series'))
                                    .addButton('cancel', gt('Cancel'))
                                    .show()
                                    .done(function (action) {
                                        if (action === 'cancel') {
                                            return;
                                        }
                                        if (action === 'series') {
                                            delete data.recurrence_position;
                                        }
                                        myModel.destroy();
                                    });
                            });
                        } else {
                            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                                new dialogs.ModalDialog()
                                    .text(gt('Do you want to delete this appointment?'))
                                    .addPrimaryButton('ok', gt('Delete'))
                                    .addButton('cancel', gt('Cancel'))
                                    .show()
                                    .done(function (action) {
                                        if (action === 'cancel') {
                                            return;
                                        }
                                        myModel.destroy();
                                    });
                            });
                        }
                    });
                })
                .fail(function (err) {
                    console.log(err);
                });
        }
    });


    new Action('io.ox/calendar/detail/actions/create', {
        id: 'create',
        requires: 'one create',
        action: function (baton, obj) {
            // FIXME: if this action is invoked by the menu button, both
            // arguments are the same (the app)
            var params = {
                folder_id: baton.app.folder.get(),
                participants: []
            };
            if (obj && obj.start_date) {
                _.extend(params, obj);
            }
            require(['io.ox/calendar/edit/main'], function (editmain) {
                editmain.getApp().launch().done(function () {
                    this.create(params);
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/changestatus', {
        id: 'change_status',
        requires: 'one modify',
        action: function (baton) {
            // load & call
            require(['io.ox/calendar/acceptdeny']).done(function (acceptdeny) {
                acceptdeny(baton.data);
            });
        }
    });

    var copyMove = function (type, apiAction, title) {
        return function (list) {
            require(['io.ox/calendar/api', 'io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (api, dialogs, views) {
                var dialog = new dialogs.ModalDialog({ easyOut: true })
                    .header($('<h3>').text(title))
                    .addPrimaryButton('ok', gt('Move'))
                    .addButton('cancel', gt('Cancel'));
                dialog.getBody().css('height', '250px');
                var item = _(list).first(),
                    id = String(item.folder_id || item.folder),
                    tree = new views.FolderTree(dialog.getBody(), { type: type });
                dialog.show(function () {
                    tree.paint().done(function () {
                        tree.select(id);
                    });
                })
                .done(function (action) {
                    if (action === 'ok') {
                        var target = _(tree.selection.get()).first();
                        if (target && target !== id) {
                            // use proper action
                            api[apiAction](list, target)
                                .done(function () {
                                    var response = apiAction === 'move' ?
                                        gt.ngettext('Appointment has been moved', 'Appointments have been moved', list.length) :
                                        gt.ngettext('Appointment has been copied', 'Appointments have been copied', list.length);
                                    notifications.yell('success', response);
                                })
                                .fail(notifications.yell);
                        }
                    }
                    tree.destroy();
                    tree = dialog = null;
                });
            });
        };
    };

    new Action('io.ox/calendar/detail/actions/move', {
        id: 'move',
        requires: 'some delete',
        multiple: copyMove('calendar', 'move', gt('Move'))
    });

    // Links - toolbar

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'default',
        index: 100,
        icon: function () {
            return $('<i class="icon-pencil">');
        }
    });

    new ActionLink(POINT + '/links/toolbar/default', {
        index: 100,
        id: 'create',
        label: gt('New appointment'),
        ref: 'io.ox/calendar/detail/actions/create'
    });

    // VIEWS

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'view',
        index: 150,
        label: gt('View'),
        icon: function () {
            return $('<i class="icon-eye-open">');
        }
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'day',
        index: 100,
        label: gt('Day'),
        ref: 'io.ox/calendar/actions/switch-to-day-view'
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'week',
        index: 200,
        label: gt('Workweek'),
        ref: 'io.ox/calendar/actions/switch-to-week-view'
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'fullweek',
        index: 300,
        label: gt('Week'),
        ref: 'io.ox/calendar/actions/switch-to-fullweek-view'
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'month',
        index: 400,
        label: gt('Month'),
        ref: 'io.ox/calendar/actions/switch-to-month-view'
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'list',
        index: 500,
        label: gt('List'),
        ref: 'io.ox/calendar/actions/switch-to-list-view'
    });

    // FIXME: should only be visible if rights are ok
    ext.point('io.ox/calendar/detail/actions').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/calendar/links/inline'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'edit',
        label: gt('Edit'),
        ref: 'io.ox/calendar/detail/actions/edit'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 200,
        prio: 'hi',
        id: 'changestatus',
        label: gt('Change status'),
        ref: 'io.ox/calendar/detail/actions/changestatus'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 300,
        prio: 'hi',
        id: 'move',
        label: gt('Move'),
        ref: 'io.ox/calendar/detail/actions/move'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 400,
        prio: 'hi',
        id: 'delete',
        label: gt('Delete'),
        ref: 'io.ox/calendar/detail/actions/delete'
    }));

    ext.point('io.ox/calendar/detail/actions-participantrelated').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links-participant',
        ref: 'io.ox/calendar/links/inline-participants'
    }));

    ext.point('io.ox/calendar/links/inline-participants').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'send mail',
        label: gt('Send mail to all participants'),
        ref: 'io.ox/calendar/detail/actions/sendmail'
    }));


    ext.point('io.ox/calendar/links/inline-participants').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'save as distlist',
        label: gt('Save as distribution list'),
        ref: 'io.ox/calendar/detail/actions/save-as-distlist'
    }));





    /*ext.point('io.ox/calendar/links/inline').extend(new links.DropdownLinks({
        index: 200,
        prio: 'lo',
        id: 'changestatus',
        label: gt('Change Status'),
        ref: 'io.ox/calendar/actions/changestatus'
    }));

    new Link('io.ox/calendar/actions/changestatus', {
        id: 'list',
        index: 100,
        label: gt('List'),
        ref: 'io.ox/calendar/actions/switch-to-list-view'
    });*/

    window.ext = ext;
});
