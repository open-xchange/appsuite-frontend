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
         'io.ox/core/date',
         'gettext!io.ox/calendar'
         ], function (View, api, ext, dialogs, detailView, date, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('week');

    _.extend(perspective, {

        collection:     {},
        columns:        7,
        startDate:      null,
        dialog:         $(),
        app:            null,
        view:           null,
        folder:         null,
        mode:           { 'week:day': 1, 'week:workweek': 5, 'week:week': 7 },
        days: function (d) {
            if (d) {
                this.columns = d;
                return this;
            } else {
                return d;
            }
        },

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
            if (obj.recurrence_type > 0) {
                new dialogs.ModalDialog()
                    .text(gt('Do you want to edit the whole series or just one appointment within the series?'))
                    .addPrimaryButton('series', gt('Series'))
                    .addButton('appointment', gt('Appointment'))
                    .addButton('cancel', gt('Cancel'))
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') {
                            self.refresh();
                            return;
                        }
                        if (action === 'series') {
                            delete obj.recurrence_position;
                        }
                        api.update(obj);
                    });
            } else {
                api.update(obj);
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
            var obj = {
                    start: this.startDate.getTime(),
                    end: this.startDate.getTime() + (date.DAY * this.columns)
                },
                self = this;
            this.app.folder.getData().done(function (data) {
                // switch only visible on private folders
                self.view.setShowAllVisibility(data.type === 1);
                // set folder data to view
                self.view.setFolder(data);
                // do folder magic
                if (data.type > 1 || self.view.getShowAllStatus() === false) {
                    obj.folder = data.id;
                }
                self.getAppointments(obj);
            });
        },

        changeFolder: function (e, data) {
            this.folder = data;
            this.refresh();
        },

        render: function (app, options) {

            this.app = app;
            this.collection = new Backbone.Collection([]);
            this.main.addClass('week-view').empty();

            this.days(this.mode[options.perspective]);

            if (this.columns === 1) {
                this.startDate = new date.Local().setHours(0, 0, 0, 0);
            } else {
                this.startDate = new date.Local().setStartOfWeek();
            }
            this.view = new View({
                collection: this.collection,
                columns: this.columns,
                startDate: this.startDate
            });

            this.view
                .on('showAppointment', this.showAppointment, this)
                .on('openCreateAppointment', this.openCreateAppointment, this)
                .on('openEditAppointment', this.openEditAppointment, this)
                .on('updateAppointment', this.updateAppointment, this)
                .on('onRefreshView', function (startDate) {
                    this.startDate = startDate;
                    this.refresh();
                }, this);

            this.main.append(this.view.render().el);

            this.dialog = new dialogs.SidePopup()
                .on('close', function () {
                    $('.appointment', this.main).removeClass('opac current');
                });

            var refresh = $.proxy(this.refresh, this);

            // watch for api refresh
            api.on('refresh.all', refresh);
            // watch for folder change
            app.on('folder:change', refresh)
                .getWindow()
                .on('show', refresh);

            this.view.setScrollPos();

            refresh();
        }
    });

    return perspective;
});
