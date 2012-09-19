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
     'gettext!io.ox/calendar/actions'], function (ext, links, api, util, gt) {

    'use strict';

    var Action = links.Action, Link = links.XLink, Dropdown = links.Dropdown;

    // Actions
    new Action('io.ox/calendar/actions/switch-to-list-view', {
        requires: true,
        action: function (app) {
            require(['io.ox/calendar/list/perspective'], function (perspective) {
                perspective.show(app);
            });
        }
    });

    new Action('io.ox/calendar/actions/switch-to-month-view', {
        requires: true,
        action: function (app) {
            require(['io.ox/calendar/month/perspective'], function (perspective) {
                perspective.show(app);
            });
        }
    });

    new Action('io.ox/calendar/actions/switch-to-fullweek-view', {
        requires: true,
        action: function (app) {
            require(['io.ox/calendar/week/perspective'], function (perspective) {
                perspective.setRendered(false);
                perspective.columns = 7;
                perspective.show(app);
            });
        }
    });

    new Action('io.ox/calendar/actions/switch-to-week-view', {
        requires: true,
        action: function (app) {
            require(['io.ox/calendar/week/perspective'], function (perspective) {
                perspective.setRendered(false);
                perspective.columns = 5;
                perspective.show(app);
            });
        }
    });

    new Action('io.ox/calendar/actions/switch-to-day-view', {
        requires: true,
        action: function (app) {
            require(['io.ox/calendar/week/perspective'], function (perspective) {
                perspective.setRendered(false);
                perspective.columns = 1;
                perspective.show(app);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/sendmail', {
        action: function (params) {
            var def = $.Deferred();
            util.createArrayOfRecipients(params.participants, def);
            def.done(function (arrayOfRecipients) {
                require(['io.ox/mail/write/main'], function (m) {
                    m.getApp().launch().done(function () {
                        this.compose({to: arrayOfRecipients, subject: params.title});
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/save-as-distlist', {
        action: function (params) {
            var def = $.Deferred();
            util.createDistlistArrayFromPartisipantList(params.participants, def);
            def.done(function (initdata) {
                require(['io.ox/contacts/distrib/main'], function (m) {
                    m.getApp().launch().done(function () {
                        this.create(params.folder_id, initdata);
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/edit', {
        id: 'edit',
        requires: 'one modify',
        action: function (params) {
            var o = {
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
        id: 'edit',
        requires: 'one modify',
        action: function (params) {
            var o = {
                id: params.id,
                folder: params.folder_id
            };
            if (!_.isUndefined(params.recurrence_position)) {
                o.recurrence_position = params.recurrence_position;
            }
            api.get(o)
                .done(function (data) {
                    require(['io.ox/calendar/edit/model-appointment'], function (Model) {
                        // different warnings especially for events with
                        // external users should handled here
                        var myModel = new Model(data);
                        if (data.recurrence_type > 0) {
                            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                                new dialogs.ModalDialog()
                                    .text(gt('Do you want to delete the whole series or just one appointment within the series?'))
                                    .addButton('cancel', gt('Cancel'))
                                    .addDangerButton('appointment', gt('Delete appointment'))
                                    .addDangerButton('series', gt('Delete whole series'))
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
                                    .addButton('cancel', gt('Cancel'))
                                    .addDangerButton('ok', gt('Delete'))
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
        action: function (app, obj) {
            obj = obj || {};
            require(['io.ox/calendar/edit/main'], function (editmain) {
                // FIXME: what a hack > folder_id
                editmain.getApp().launch().done(function () {
                    _.extend(obj, {
                        folder_id: app.folder.get(),
                        participants: []
                    });
                    this.create(obj);
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/changestatus', {
        id: 'change_status',
        requires: 'one modify',
        action: function (params) {
            // load & call
            require(['io.ox/calendar/acceptdeny']).done(function (acceptdeny) {
                acceptdeny(params);
            });
        }
    });

    // Links - toolbar

    new Link('io.ox/calendar/links/toolbar', {
        index: 100,
        id: 'create',
        label: gt('Create'),
        ref: 'io.ox/calendar/detail/actions/create'
    });

    new Dropdown('io.ox/calendar/links/toolbar', {
        id: 'view',
        index: 200,
        label: gt('View')
    });

    new Link('io.ox/calendar/links/toolbar/view', {
        id: 'day',
        index: 100,
        label: gt('Day'),
        ref: 'io.ox/calendar/actions/switch-to-day-view'
    });

    new Link('io.ox/calendar/links/toolbar/view', {
        id: 'week',
        index: 200,
        label: gt('Work Week'),
        ref: 'io.ox/calendar/actions/switch-to-week-view'
    });

    new Link('io.ox/calendar/links/toolbar/view', {
        id: 'fullweek',
        index: 300,
        label: gt('Week'),
        ref: 'io.ox/calendar/actions/switch-to-fullweek-view'
    });

    new Link('io.ox/calendar/links/toolbar/view', {
        id: 'month',
        index: 400,
        label: gt('Month'),
        ref: 'io.ox/calendar/actions/switch-to-month-view'
    });

    new Link('io.ox/calendar/links/toolbar/view', {
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
        index: 100,
        prio: 'hi',
        id: 'delete',
        label: gt('Delete'),
        ref: 'io.ox/calendar/detail/actions/delete'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'changestatus',
        label: gt('Change status'),
        ref: 'io.ox/calendar/detail/actions/changestatus'
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
        label: gt('Send mail to all'),
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
