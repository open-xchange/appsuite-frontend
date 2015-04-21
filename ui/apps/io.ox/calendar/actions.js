/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/calendar/api',
     'io.ox/calendar/util',
     'io.ox/core/notifications',
     'io.ox/core/print',
     'settings!io.ox/calendar',
     'settings!io.ox/core',
     'io.ox/core/extPatterns/actions',
     'gettext!io.ox/calendar'
    ], function (ext, links, api, util, notifications, print, settings, coreSettings, actions, gt) {

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
            return true;
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
            util.resolveParticipants(baton.data).done(function (recipients) {
                recipients = _(recipients)
                    .chain()
                    .filter(function (rec) {
                        // don't add myself
                        // don't add if mail address is missing (yep, edge-case)
                        return rec.id !== ox.user_id && !!rec.mail;
                    })
                    .map(function (rec) {
                        return [rec.display_name, rec.mail];
                    })
                    .value();
                ox.registry.call('mail-compose', 'compose', { to: recipients, subject: baton.data.title });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/invite', {
        capabilities: 'calendar',
        action: function (baton) {
            require(['io.ox/calendar/edit/main'], function (m) {
                m.getApp().launch().done(function () {
                    // include external organizer
                    var data = baton.data,
                        participants = data.participants.slice();
                    if (!data.organizerId && _.isString(data.organizer)) {
                        participants.unshift({
                            display_name: data.organizer,
                            email1: data.organizer,
                            mail: data.organizer,
                            type: 5
                        });
                    }
                    // open create dialog with same participants
                    data = {
                        folder_id: coreSettings.get('folder/calendar'),
                        participants: participants
                    };
                    this.create(data);
                    this.model.toSync = data;
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/save-as-distlist', {
        capabilities: 'contacts',
        action: function (baton) {
            util.resolveParticipants(baton.data).done(function (distlist) {
                ox.load(['io.ox/contacts/distrib/main', 'settings!io.ox/core']).done(function (m, coreSettings) {
                    m.getApp().launch().done(function () {
                        this.create(coreSettings.get('folder/contacts'), { distribution_list: distlist });
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/edit', {
        id: 'edit',
        requires: function (e) {
            var exists = e.baton && e.baton.data ? e.baton.data.id !== undefined : true,
                allowed = e.collection.has('one', 'create');
            if (allowed) {
                // if you have no permission to edit you don't have a folder id (see calendar/freebusy response)
                if (!e.baton.data.folder_id) {
                    // you need to have a folder id to edit
                    allowed = false;
                }
            }
            return util.isBossyAppointmentHandling({ app: e.baton.data }).then(function (isBossy) {
                return allowed && exists && isBossy;
            });
        },
        action: function (baton) {
            var params = baton.data,
                o = {
                    id: params.id,
                    folder: params.folder_id
                };

            if (!!params.recurrence_position) {
                o.recurrence_position = params.recurrence_position;
            }

            ox.load(['io.ox/calendar/edit/main']).done(function (m) {
                if (params.recurrence_type > 0 || params.recurrence_position) {
                    ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt('Do you want to edit the whole series or just one appointment within the series?'))
                            .addPrimaryButton('series',
                                //#. Use singular in this context
                                gt('Series'), 'series', {tabIndex: '1'})
                            .addButton('appointment', gt('Appointment'), 'appointment', {tabIndex: '1'})
                            .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
                            .show()
                            .done(function (action) {

                                if (action === 'cancel') {
                                    return;
                                }
                                if (action === 'series') {
                                    // edit the series, discard recurrence position
                                    if (params.recurrence_id) {
                                        o.id = params.recurrence_id;
                                    }
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
        requires: function (e) {
            return util.isBossyAppointmentHandling({ app: e.baton.data }).then(function (isBossy) {
                return e.collection.has('delete') && isBossy;
            });
        },
        multiple: function (list) {

            var apiCalls = [];

            // build array with full identifier for an appointment and collect API get calls
            _(list).each(function (obj) {
                var o = {
                    id: obj.id,
                    folder: obj.folder_id
                };
                if (!!obj.recurrence_position) {
                    o.recurrence_position = obj.recurrence_position;
                }

                apiCalls.push(api.get(o));
            });

            $.when.apply($, apiCalls)
                .pipe(function () {
                    return _.chain(arguments)
                        .flatten(true)
                        .filter(function (app) {
                            return _.isObject(app);
                        }).value();
                })
                .then(function (appList) {

                    // check if appointment list contains recurring appointments
                    var hasRec = _(appList).some(function (app) {
                        return app.recurrence_type > 0;
                    });

                    ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {

                        var cont = function (series) {
                            var data = _(appList).chain().map(function (obj) {
                                var options = {
                                    id: obj.id,
                                    folder: obj.folder_id || obj.folder
                                };
                                if (!series && obj.recurrence_position) {
                                    _.extend(options, {recurrence_position: obj.recurrence_position});
                                }
                                return options;
                            }).uniq(function (obj) {
                                return JSON.stringify(obj);
                            }).value();
                            api.remove(data).fail(notifications.yell);
                        };

                        // different warnings especially for events with
                        // recurrence_type > 0 should handled here
                        if (hasRec) {
                            new dialogs.ModalDialog()
                                .text(gt('Do you want to delete the whole series or just one appointment within the series?'))
                                .addPrimaryButton('series', gt('Delete whole series'), 'series', {tabIndex: '1'})
                                .addButton('appointment', gt('Delete appointment'), 'appointment', {tabIndex: '1'})
                                .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
                                .show()
                                .done(function (action) {
                                    if (action === 'cancel') {
                                        return;
                                    }
                                    cont(action === 'series');
                                });
                        } else {
                            new dialogs.ModalDialog()
                                .text(gt('Do you want to delete this appointment?'))
                                .addPrimaryButton('ok', gt('Delete'), 'ok', {tabIndex: '1'})
                                .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
                                .show()
                                .done(function (action) {
                                    if (action === 'cancel') {
                                        return;
                                    }
                                    cont();
                                });
                        }
                    });
                });
        }
    });

    new Action('io.ox/calendar/detail/actions/create', {
        id: 'create',
        requires: function (e) {
            return e.baton.app.folder.can('create');
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
        requires: function (e) {

            function cont(app) {
                return util.isBossyAppointmentHandling({ app: e.baton.data, invert: true }).then(function (isBossy) {
                    var iamUser = false;
                    if (app.users) {
                        for (var i = 0; i < app.users.length; i++) {
                            if (app.users[i].id === ox.user_id) {
                                iamUser = true;
                            }
                        }
                    }
                    return e.collection.has('one') && iamUser && isBossy;
                });
            }

            var app = e.baton.data;
            // incomplete
            if (app.id && !app.users) {
                return api.get(app).then(cont);
            } else {
                return cont(app);
            }
        },
        action: function (baton) {
            // load & call
            ox.load(['io.ox/calendar/acceptdeny']).done(function (acceptdeny) {
                acceptdeny(baton.data);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/print-appointment', {
        capabilities: 'printing',
        requires: function (e) {
            return e.collection.has('some', 'read') && _.device('!small');
        },
        multiple: function (list) {
            print.request('io.ox/calendar/print', list);
        }
    });

    new Action('io.ox/calendar/detail/actions/print', {
        capabilities: 'printing',
        id: 'print',
        requires: function (e) {
            var win = e.baton.window;
            if (_.device('!small') && win && win.getPerspective) {
                var pers = win.getPerspective();
                return pers && pers.print;
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

    new Action('io.ox/calendar/detail/actions/move', {
        id: 'move',
        requires: function (e) {
            return util.isBossyAppointmentHandling({ app: e.baton.data }).then(function (isBossy) {
                var isSeries = e.baton.data.recurrence_type > 0;
                return e.collection.has('some', 'delete') && isBossy && !isSeries;
            });
        },
        multiple: function (list, baton) {

            var vgrid = baton.grid || (baton.app && baton.app.getGrid());

            require(['io.ox/core/folder/actions/move'], function (move) {
                move.item({
                    api: api,
                    button: gt('Move'),
                    flat: true,
                    indent: false,
                    list: list,
                    module: 'calendar',
                    root: '1',
                    settings: settings,
                    success: {
                        single: 'Appointment has been moved',
                        multiple: 'Appointments have been moved'
                    },
                    target: baton.target,
                    title: gt('Move'),
                    type: 'move',
                    vgrid: vgrid
                });
            });
        }
    });

    new Action('io.ox/calendar/actions/freebusy', {
        capabilities: 'freebusy !alone',
        requires: function () {
            return _.device('!small');
        },
        action: function (baton) {
            ox.launch('io.ox/calendar/freebusy/main', {
                baton: baton,
                folder: baton.app.folder.get(),
                participants: [{ id: ox.user_id, type: 1 }]
            });
        }
    });


    /* new actions for mobile */

    // Actions
    new Action('io.ox/calendar/actions/dayview/showNext', {
        requires: true,
        action: function (baton) {
            var p = baton.app.getWindow().getPerspective();
            if (!p) return;
            p.view.setStartDate('next');
            p.view.trigger('onRefresh');
        }
    });

     // Actions
    new Action('io.ox/calendar/actions/dayview/showPrevious', {
        requires: true,
        action: function (baton) {
            var p = baton.app.getWindow().getPerspective();
            if (!p) return;
            p.view.setStartDate('prev');
            p.view.trigger('onRefresh');
        }
    });

     // Actions
    new Action('io.ox/calendar/actions/dayview/showToday', {
        requires: true,
        action: function (baton) {
            var p = baton.app.getWindow().getPerspective();
            if (!p) return;
            p.view.setStartDate();
            p.view.trigger('onRefresh');
        }
    });

   // Actions
    new Action('io.ox/calendar/actions/month/showToday', {
        requires: true,
        action: function (baton) {
            var p = baton.app.getWindow().getPerspective();
            if (!p) return;
            p.gotoMonth({
                duration: 0,
                date: 'today'
            });
        }
    });


    // Mobile multi select extension points
    // delete appointment(s)
    ext.point('io.ox/calendar/mobileMultiSelect/toolbar').extend({
        id: 'delete',
        index: 10,
        draw: function (data) {
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-trash-o">')
                            .on('click', {grid: data.grid}, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/calendar/detail/actions/delete', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // move appointment(s)
    ext.point('io.ox/calendar/mobileMultiSelect/toolbar').extend({
        id: 'move',
        index: 20,
        draw: function (data) {
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-sign-in">')
                            .on('click', {grid: data.grid}, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/calendar/detail/actions/move', null, baton);
                                // need to clear the selection after aciton is invoked
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // Links - toolbar
    new ActionGroup(POINT + '/links/toolbar', {
        id: 'default',
        index: 100,
        icon: function () {
            return $('<i class="fa fa-plus accent-color">');
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
            return $('<i class="fa fa-eye">');
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
            return $('<i class="fa fa-group">');
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
            return $('<i class="fa fa-print">');
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
        mobile: 'lo',
        id: 'edit',
        label: gt('Edit'),
        ref: 'io.ox/calendar/detail/actions/edit'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 200,
        prio: 'hi',
        mobile: 'hi',
        id: 'changestatus',
        label: gt('Change status'),
        ref: 'io.ox/calendar/detail/actions/changestatus'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 300,
        prio: 'hi',
        mobile: 'lo',
        id: 'delete',
        label: gt('Delete'),
        ref: 'io.ox/calendar/detail/actions/delete'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 400,
        prio: 'lo',
        mobile: 'lo',
        id: 'move',
        label: gt('Move'),
        drawDisabled: true,
        ref: 'io.ox/calendar/detail/actions/move'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 500,
        prio: 'lo',
        id: 'print',
        label: gt('Print'),
        ref: 'io.ox/calendar/detail/actions/print-appointment'
    }));

    ext.point('io.ox/calendar/detail/actions-participantrelated').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links-participant',
        ref: 'io.ox/calendar/links/inline-participants',
        classes: 'io-ox-inline-links embedded'
    }));

    ext.point('io.ox/calendar/links/inline-participants').extend(new links.Link({
        index: 100,
        prio: 'hi',
        mobile: 'lo',
        id: 'send mail',
        label: gt('Send mail to all participants'),
        ref: 'io.ox/calendar/detail/actions/sendmail'
    }));

    ext.point('io.ox/calendar/links/inline-participants').extend(new links.Link({
        index: 200,
        prio: 'hi',
        mobile: 'lo',
        id: 'invite',
        label: gt('Invite to new appointment'),
        ref: 'io.ox/calendar/detail/actions/invite'
    }));

    ext.point('io.ox/calendar/links/inline-participants').extend(new links.Link({
        index: 300,
        prio: 'hi',
        mobile: 'lo',
        id: 'save as distlist',
        label: gt('Save as distribution list'),
        ref: 'io.ox/calendar/detail/actions/save-as-distlist'
    }));
});
