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
     'io.ox/core/notifications',
     'io.ox/core/print'
    ], function (ext, links, api, util, gt, config, notifications, print) {

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
        requires: function () {
            return _.device('!small');
        },
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'month');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-fullweek-view', {
        requires: function () {
            return _.device('!small');
        },
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'week:week');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-week-view', {
        requires: function () {
            return _.device('!small');
        },
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
        capabilities: 'webmail',
        action: function (baton) {
            var def = $.Deferred();
            util.createArrayOfRecipients(baton.data.participants, def);
            def.done(function (arrayOfRecipients) {
                ox.load(['io.ox/mail/write/main']).done(function (m) {
                    m.getApp().launch().done(function () {
                        this.compose({to: arrayOfRecipients, subject: baton.data.title});
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/save-as-distlist', {
        capabilities: 'contacts',
        action: function (baton) {
            var contactsFolder = config.get('folder.contacts'),
                def = $.Deferred();
            util.createDistlistArrayFromPartisipantList(baton.data.participants, def);
            def.done(function (initdata) {
                ox.load(['io.ox/contacts/distrib/main']).done(function (m) {
                    m.getApp().launch().done(function () {
                        this.create(contactsFolder, initdata);
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/edit', {
        id: 'edit',
        requires: function (e) {
            return e.collection.has('one') && e.collection.has('create') && _.device('!small');
        },
        action: function (baton) {
            var params = baton.data,
                o = {
                    id: params.id,
                    folder: params.folder_id
                };
            if (!_.isUndefined(params.recurrence_position)) {
                o.recurrence_position = params.recurrence_position;
            }

            ox.load(['io.ox/calendar/edit/main']).done(function (m) {
                if (params.recurrence_type > 0 || params.recurrence_position) {
                    ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt('Do you want to edit the whole series or just one appointment within the series?'))
                            .addPrimaryButton('series',
                                //#. Use singular in this context
                                gt('Series'))
                            .addButton('appointment', gt('Appointment'))
                            .addButton('cancel', gt('Cancel'))
                            .show()
                            .done(function (action) {

                                if (action === 'cancel') {
                                    return;
                                }
                                if (action === 'series') {
                                    // edit the series, discard recurrence position
                                    delete o.recurrence_position;
                                }

                                // disable cache with second param
                                api.get(o, false).then(
                                    function (data) {
                                        if (m.reuse('edit', data, {action: action})) return;
                                        m.getApp().launch().done(function () {
                                            if (action === 'appointment') {
                                                data = api.removeRecurrenceInformation(data);
                                            }
                                            this.edit(data, {action: action});
                                        });
                                    },
                                    notifications.yell
                                );
                            });
                    });
                } else {
                    api.get(o, false).then(
                        function (data) {
                            if (m.reuse('edit', data)) return;
                            m.getApp().launch().done(function () {
                                this.edit(data);
                            });
                        },
                        notifications.yell
                    );
                }
            });
        }
    });


    new Action('io.ox/calendar/detail/actions/delete', {
        id: 'delete',
        requires: 'one delete',
        action: function (baton) {
            var params = baton.data,
                o = {
                id: params.id,
                folder: params.folder_id
            };
            if (!_.isUndefined(params.recurrence_position)) {
                o.recurrence_position = params.recurrence_position;
            }

            api.get(o).done(function (data) {
                ox.load(['io.ox/calendar/model']).done(function (Model) {
                    // different warnings especially for events with
                    // external users should handled here
                    var myModel = new Model.Appointment(data);
                    if (data.recurrence_type > 0) {
                        ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {
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
                                        delete myModel.attributes.recurrence_position;
                                    }
                                    myModel.destroy();
                                });
                        });
                    } else {
                        ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {
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
            });
        }
    });


    new Action('io.ox/calendar/detail/actions/create', {
        id: 'create',
        requires: function (e) {
            return e.collection.has('one') && e.collection.has('create') && _.device('!small');
        },
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
            ox.load(['io.ox/calendar/edit/main']).done(function (editmain) {
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
            ox.load(['io.ox/calendar/acceptdeny']).done(function (acceptdeny) {
                acceptdeny(baton.data);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/print-appointment', {
        requires: function (e) {
            return e.collection.has('some', 'read') && _.device('!small');
        },
        multiple: function (list, baton) {
            print.request('io.ox/calendar/print', list);
        }
    });

    new Action('io.ox/calendar/detail/actions/print-appointment-disabled', {
        requires: 'one',
        action: function (baton) {
            var options = { template: 'print.appointment.tmpl' }, POS = 'recurrence_position';
            if (baton.data[POS]) options[POS] = baton.data[POS];
            print.open('calendar', baton.data, options);
        }
    });

    new Action('io.ox/calendar/detail/actions/print', {
        id: 'print',
        requires: function (e) {
            var win = e.baton.window;
            if (win && win.getPerspective) {
                var pers = win.getPerspective();
                return pers && pers.name !== 'list';
            } else {
                return false;
            }
        },
        action: function (baton) {
            var win = baton.app.getWindow(),
                pers = win.getPerspective();
            if (pers.print) {
                pers.print();
            }
        }
    });

    var copyMove = function (type, apiAction, title) {
        return function (list) {
            ox.load(['io.ox/calendar/api', 'io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews']).done(function (api, dialogs, views) {
                var dialog = new dialogs.ModalDialog({ easyOut: true })
                    .header($('<h4>').text(title))
                    .addPrimaryButton('ok', gt('Move'))
                    .addButton('cancel', gt('Cancel'));
                dialog.getBody().css('height', '250px');
                var item = _(list).first(),
                    id = String(item.folder_id || item.folder),
                    tree = new views.FolderList(dialog.getBody(), { type: type });
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
                    tree.destroy().done(function () {
                        tree = dialog = null;
                    });
                });
            });
        };
    };

    new Action('io.ox/calendar/detail/actions/move', {
        id: 'move',
        requires: 'some delete',
        multiple: copyMove('calendar', 'move', gt('Move'))
    });

    new Action('io.ox/calendar/actions/freebusy', {
        capabilities: 'freebusy !alone',
        requires: function (e) {
            return _.device('!small');
        },
        action: function (baton, obj) {
            ox.launch('io.ox/calendar/freebusy/main', {
                folder: baton.app.folder.get(),
                participants: [{ id: ox.user_id, type: 1 }]
            });
        }
    });

    // Links - toolbar

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'default',
        index: 100,
        icon: function () {
            return $('<i class="icon-plus accent-color">');
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
        index: 400,
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

    // scheduling

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'freebusy',
        index: 500,
        icon: function () {
            return $('<i class="icon-group">');
        }
    });

    new ActionLink(POINT + '/links/toolbar/freebusy', {
        label: gt('Scheduling'),
        ref: 'io.ox/calendar/actions/freebusy'
    });

    // print

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'print',
        index: 600,
        icon: function () {
            return $('<i class="icon-print">');
        }
    });

    new ActionLink(POINT + '/links/toolbar/print', {
        label: gt('Print'),
        ref: 'io.ox/calendar/detail/actions/print'
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
        prio: 'lo',
        id: 'move',
        label: gt('Move'),
        ref: 'io.ox/calendar/detail/actions/move'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 400,
        prio: 'lo',
        id: 'print',
        label: gt('Print'),
        ref: 'io.ox/calendar/detail/actions/print-appointment'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 500,
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
});
