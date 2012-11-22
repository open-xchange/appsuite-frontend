/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/week/perspective',
    ['io.ox/calendar/week/view',
     'io.ox/calendar/api',
     'io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'io.ox/calendar/view-detail',
     'io.ox/calendar/conflicts/conflictList',
     'gettext!io.ox/calendar'], function (View, api, ext, dialogs, detailView, conflictView, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('week');

    _.extend(perspective, {

        collection:     {},     // collection of all appointments
        dialog:         null,   // sidepopup
        app:            null,   // the app
        view:           null,   // the current view obj
        modes:          { 'week:day': 1, 'week:workweek': 2, 'week:week': 3 }, // all available modes

        showAppointment: function (e, obj) {
            // open appointment details
            var self = this;
            api.get(obj).done(function (data) {
                self.dialog
                    .show(e, function (popup) {
                        popup.append(detailView.draw(data));
                    });
            });
        },

        updateAppointment: function (obj) {
            var self = this;
            _.each(obj, function (el, i) {
                if (el === null) {
                    delete obj[i];
                }
            });

            var apiUpdate = function (obj) {
                api.update(obj).fail(function (con) {
                    if (con.conflicts) {
                        new dialogs.ModalDialog()
                            .append(conflictView.drawList(con.conflicts))
                            .addDangerButton('ignore', gt('Ignore conflicts'))
                            .addButton('cancel', gt('Cancel'))
                            .show()
                            .done(function (action) {
                                if (action === 'cancel') {
                                    self.refresh();
                                    return;
                                }
                                if (action === 'ignore') {
                                    obj.ignore_conflicts = true;
                                    apiUpdate(obj);
                                }
                            });
                    }
                });
            };

            if (obj.recurrence_type > 0) {
                new dialogs.ModalDialog()
                    .text(gt('Do you want to edit the whole series or just one appointment within the series?'))
                    .addPrimaryButton('series', gt('Series'))
                    .addButton('appointment', gt('Appointment'))
                    .addButton('cancel', gt('Cancel'))
                    .show()
                    .done(function (action) {
                        switch (action) {
                        case 'series':
                            // get recurrence master object
                            if (obj.old_start_date || obj.old_end_date) {
                                api.get({id: obj.id, folder_id: obj.folder_id}).done(function (data) {
                                    // calculate new dates if old dates are available
                                    data.start_date += (obj.start_date - obj.old_start_date);
                                    data.end_date += (obj.end_date - obj.old_end_date);
                                    apiUpdate(data);
                                });
                            }
                            break;
                        case 'appointment':
                            apiUpdate(api.removeRecurrenceInformation(obj));
                            break;
                        default:
                            self.refresh();
                            return;
                        }
                    });
            } else {
                apiUpdate(obj);
            }
        },

        openCreateAppointment: function (e, obj) {
            ext.point('io.ox/calendar/detail/actions/create')
                .invoke('action', this, {app: this.app}, obj);
        },

        openEditAppointment: function (e, obj) {
            ext.point('io.ox/calendar/detail/actions/edit')
                .invoke('action', this, obj);
        },

        getAppointments: function (obj) {
            // fetch appointments
            var collection = this.collection;
            if (collection) {
                api.getAll(obj).done(function (list) {
                    collection
                        .reset(_(list).map(function (obj) {
                            var m = new Backbone.Model(obj);
                            m.id = _.cid(obj);
                            return m;
                        }));
                    collection = null;
                });
            }
        },

        refresh: function () {
            var self = this;
            this.app.folder.getData().done(function (data) {
                // set folder data to view and update
                self.getAppointments(self.view.folder(data));
            });
        },

        save: function () {
            // save scrollposition
            if (this.view) {
                this.view.save();
            }
        },

        restore: function () {
            // restore scrollposition
            if (this.view) {
                this.view.restore();
            }
        },

        render: function (app, opt) {
            // init perspective
            this.app = app;
            this.collection = new Backbone.Collection([]);
            this.main.addClass('week-view').empty();

            delete this.view;

            this.view = new View({
                collection: this.collection,
                mode: this.modes[opt.perspective]
            });

            var self = this,
                refresh = $.proxy(function (e) {
                    self.refresh();
                }, this);

            // bind listener for view events
            this.view
                .on('showAppointment', this.showAppointment, this)
                .on('openCreateAppointment', this.openCreateAppointment, this)
                .on('openEditAppointment', this.openEditAppointment, this)
                .on('updateAppointment', this.updateAppointment, this)
                .on('onRefresh', this.refresh, this);

            this.main.append(this.view.render().el);

            if (!opt.rendered) {
                // create sidepopup object with eventlistener
                this.dialog = new dialogs.SidePopup()
                    .on('close', function () {
                        $('.appointment', this.main).removeClass('opac current');
                    });

                // watch for api refresh
                api.on('refresh.all', refresh, this);

                // watch for folder change
                app.on('folder:change', refresh, this)
                    .getWindow()
                    .on('show', refresh, this)
                    .on('show', $.proxy(this.restore, this))
                    .on('beforehide', $.proxy(this.save, this))
                    .on('change:perspective', this.view.unbindKeys);
            }

            this.view.setScrollPos();

            this.refresh();
        }
    });

    return perspective;
});
