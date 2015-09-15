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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/week/perspective', [
    'io.ox/calendar/week/view',
    'io.ox/calendar/api',
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/calendar/view-detail',
    'io.ox/calendar/conflicts/conflictList',
    'io.ox/core/notifications',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/week/style'
], function (View, api, ext, dialogs, detailView, conflictView, notifications, folderAPI, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('week');

    _.extend(perspective, {

        collection:     {},     // collection of all appointments
        dialog:         null,   // sidepopup
        app:            null,   // the appf
        view:           null,   // the current view obj
        views:          {},     // containing all views
        activeElement:  null,   // current focus in perspektive

        /**
         * open sidepopup to show appointment
         * @param  {Event}  e   given click event
         * @param  {Object} obj appointment object (min. id, folder_id, recurrence_position)
         */
        showAppointment: function (e, obj) {
            // open appointment details
            var self = this;
            if (_.device('smartphone')) {
                self.app.pages.changePage('detailView');
                self.app.pages.getPage('detailView').busy();
            }
            api.get(obj).then(
                function success(data) {

                    if (_.device('smartphone')) {
                        var p = self.app.pages.getPage('detailView'),
                            b = new ext.Baton({ data: data });
                        // draw details to page
                        p.idle().empty().append(detailView.draw(data));
                        // update toolbar with new baton
                        self.app.pages.getToolbar('detailView').setBaton(b);

                    } else {
                        self.dialog.show(e, function (popup) {
                            popup
                            .append(detailView.draw(data))
                            .attr({
                                'role': 'complementary',
                                'aria-label': gt('Appointment Details')
                            });
                        });
                    }
                    if (self.setNewStart) {
                        // view should change week to the start of this appointment(used by deeplinks)
                        // one time only
                        self.setNewStart = false;
                        self.app.refDate = moment(data.start_date);
                        if (self.view) {
                            //view is rendered already
                            self.view.setStartDate(data.start_date);
                        }
                    }

                },
                function fail() {
                    notifications.yell('error', gt('An error occurred. Please try again.'));
                    $('.appointment', self.main).removeClass('opac current');
                    if (_.device('smartphone')) {
                        self.app.pages.getPage('detailView').idle();
                        self.app.pages.goBack();
                    }
                }
            );
        },

        /**
         * update appointment data
         * @param  {Object} obj new appointment data
         */
        updateAppointment: function (obj) {
            var self = this;

            /**
             * call api update function
             * @param  {Object} obj new appointment data
             */
            var apiUpdate = function (obj) {
                obj = clean(obj);
                api.update(obj).fail(function (con) {
                    if (con.conflicts) {
                        var dialog = new dialogs.ModalDialog({
                            top: '20%',
                            center: false,
                            container: self.main
                        });
                        dialog
                            .append(conflictView.drawList(con.conflicts, dialog).addClass('additional-info'))
                            .addDangerButton('ignore', gt('Ignore conflicts'), 'ignore', { tabIndex: 1 })
                            .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
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

            /**
             * cleanup appointment data
             * @param  {Object} obj new appointment data
             * @return { Object}     clean appointment data
             */
            var clean = function (app) {
                _.each(app, function (el, i) {
                    if (el === null || _.indexOf(['old_start_date', 'old_end_date', 'drag_move'], i) >= 0) {
                        delete app[i];
                    }
                });
                return app;
            };

            if (obj.recurrence_type > 0) {
                var dialog = new dialogs.ModalDialog();
                if (obj.drag_move && obj.drag_move !== 0) {
                    dialog
                        .text(gt('By changing the date of this appointment you are creating an appointment exception to the series. Do you want to continue?'))
                        .addButton('appointment', gt('Yes'), 'appointment', { tabIndex: 1 })
                        .addButton('cancel', gt('No'), 'cancel', { tabIndex: 1 });
                } else {
                    dialog
                        .text(gt('Do you want to edit the whole series or just one appointment within the series?'))
                        //#. Use singular in this context
                        .addPrimaryButton('series', gt('Series'), 'series', { tabIndex: 1 })
                        .addButton('appointment', gt('Appointment'), 'appointment', { tabIndex: 1 })
                        .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 });
                }
                dialog
                    .show()
                    .done(function (action) {
                        switch (action) {
                        case 'series':
                            // get recurrence master object
                            if (obj.old_start_date || obj.old_end_date) {
                                api.get({ id: obj.id, folder_id: obj.folder_id }).done(function (data) {
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

        /**
         * open create dialog
         * @param  {Event}  e   given click event
         * @param  {Object} obj appointment object
         */
        openCreateAppointment: function (e, obj) {
            ext.point('io.ox/calendar/detail/actions/create')
                .invoke('action', this, { app: this.app }, obj);
        },

        /**
         * open edit dialog
         * @param  {Event}  e   given click event
         * @param  {Object} obj appointment object
         */
        openEditAppointment: function (e, obj) {
            ext.point('io.ox/calendar/detail/actions/edit')
                .invoke('action', this, { data: obj });
        },

        /**
         * get appointments and update collection
         * @param  {Object} obj object containing start and end timestamp
         */
        getAppointments: function (useCache) {
            // fetch appointments
            var self = this,
                obj = self.view.getRequestParam();
            return api.getAll(obj, useCache).done(function (list) {
                self.view.reset(obj.start, list);
            }).fail(function () {
                notifications.yell('error', gt('An error occurred. Please try again.'));
            });
        },

        /**
         * call view print function
         */
        print: function () {
            if (this.view) {
                this.view.print();
            }
        },

        restore: function () {
            if (this.view) {
                this.view.restore();
            }
        },

        save: function () {
            if (this.view) {
                this.view.save();
            }
        },

        updateColor: function (model) {
            $('[data-folder="' + model.get('id') + '"]', this.pane).each(function () {
                this.className = this.className.replace(/color-label-\d{1,2}/, 'color-label-' + model.get('meta').color_label);
            });
        },

        /**
         * refresh appointment data
         */
        refresh: function (useCache) {
            var self = this;
            if ($.contains(self.view.el, document.activeElement)) {
                self.activeElement = $(document.activeElement);
            }
            this.app.folder.getData().done(function (data) {
                // update view folder data
                self.view.folder(data);
                // save folder data to view and update
                self.getAppointments(useCache).done(function () {
                    // refocus pane on update
                    if (self.activeElement) {
                        self.activeElement.focus();
                        self.activeElement = null;
                    }
                });

                // register event to listen to color changes on current folder
                if (self.folderModel) {
                    self.folderModel.off('change:meta', self.updateColor);
                }
                self.folderModel = folderAPI.pool.getModel(data.id);
                self.folderModel.on('change:meta', self.updateColor, self);
            });
        },
        /**
         * receives an event from the nested Backbone view
         * and passes it up to the page controller for mobile use
         * @param  {Object} d some data
         */
        changeNavbarDate: function (d) {
            $(this.main).trigger('change:navbar:date', d);
        },

        /**
         * handle different views in this perspective
         * triggered by desktop.js
         * @param  {object} app the application
         * @param  {object} opt options from perspective
         */
        afterShow: function (app, opt) {
            // hide current view
            if (this.view) {
                this.view.$el.hide();
            }

            // init views
            if (this.views[opt.perspective] === undefined) {
                this.view = new View({
                    app: app,
                    collection: this.collection,
                    mode: opt.perspective.split(':')[1],
                    refDate: this.app.refDate,
                    appExtPoint: 'io.ox/calendar/week/view/appointment'
                });
                switch (this.view.mode) {
                case 'day':
                    this.main.attr({
                        'aria-label': gt('Day View')
                    });
                    break;
                case 'workweek':
                    this.main.attr({
                        'aria-label': gt('Workweek View')
                    });
                    break;
                default:
                case 'week':
                    this.main.attr({
                        'aria-label': gt('Week View')
                    });
                    break;
                }

                // bind listener for view events
                this.view
                    .on('showAppointment', this.showAppointment, this)
                    .on('openCreateAppointment', this.openCreateAppointment, this)
                    .on('openEditAppointment', this.openEditAppointment, this)
                    .on('updateAppointment', this.updateAppointment, this)
                    .on('onRefresh', this.refresh, this)
                    .on('change:navbar:date', this.changeNavbarDate, this);

                this.views[opt.perspective] = this.view.render();
                this.main.append(this.view.$el.show());
                this.view.setScrollPos();
            } else {
                this.view = this.views[opt.perspective];
                this.view.setStartDate(app.refDate);
                this.view.$el.show();
            }

            this.view.pane.focus();

            // renew data
            this.refresh();
        },

        // perspective week:week catches deep links
        // id must be set in URL
        followDeepLink: function () {
            var cid = _.url.hash('id'), e;
            if (cid) {
                cid = cid.split(',',1)[0];

                if (_.device('smartphone')) {
                    ox.launch('io.ox/calendar/detail/main', { cid: cid });
                } else {
                    e = $.Event('click', { target: this.main });

                    //marker to make the view open in the correct week
                    this.setNewStart = true;
                    this.showAppointment(e, _.cid(cid), { arrow: false });
                }
            }
        },

        /**
         * initial rendering of the view
         * @param  {Object} app current application
         */
        render: function (app) {

            var self = this;

            // init perspective
            this.app = app;
            this.main
                .addClass('week-view')
                .addClass('secondary-time-label')
                .empty()
                .attr({
                    'role': 'navigation',
                    'aria-label': gt('Appointment list')
                });

            this.collection = new Backbone.Collection([]);

            var refresh = function () { self.refresh(true); },
                reload = function () { self.refresh(false); };

            // create sidepopup object with eventlistener
            this.dialog = new dialogs.SidePopup({ tabTrap: true })
                .on('close', function () {
                    $('.appointment', this.main).removeClass('opac current');
                });

            // watch for api refresh
            api.on('create update delete refresh.all', refresh)
                .on('delete', function () {
                    // Close dialog after delete
                    self.dialog.close();
                })
                .on('create update', function (e, obj) {
                    if (obj.recurrence_type === 0) {
                        self.view.setStartDate(obj.start_date, obj.full_time);
                    }
                });

            // watch for folder change
            this.app
                .on('folder:change', refresh)
                .on('folder:delete', reload);
            this.app.getWindow()
                .on('beforehide', $.proxy(this.save, this))
                .on('show', $.proxy(this.restore, this))
                .on('show', refresh)
                .on('change:perspective', function () {
                    self.dialog.close();
                });
            this.main
                .on('keydown', function (e) {
                    self.view.fnKey(e);
                });

            this.followDeepLink();
        },

        // called when an appointment detail-view opens the according appointment
        selectAppointment: function (obj) {
            if (this.view) {
                this.view.setStartDate(obj.start_date);
                this.view.trigger('onRefresh');
            }
        },

        getStartDate: function () {
            return this.view.startDate.valueOf();
        }
    });

    return perspective;
});
