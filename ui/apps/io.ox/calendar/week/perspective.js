/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
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
    'io.ox/calendar/util',
    'io.ox/calendar/model',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/week/style'
], function (View, api, ext, dialogs, detailView, conflictView, notifications, folderAPI, util, chronosModel, gt) {

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
         * @param  {Object} obj appointment object (min. id, folder, recurrence_position)
         */
        showAppointment: function (e, obj) {
            // open appointment details
            var self = this;
            if (_.device('smartphone')) {
                self.app.pages.changePage('detailView');
                self.app.pages.getPage('detailView').busy();
            }

            function applyDate(model) {
                if (self.setNewStart) {
                    // view should change week to the start of this appointment(used by deeplinks)
                    // one time only
                    self.setNewStart = false;
                    if (self.view) {
                        //view is rendered already
                        self.view.setStartDate(util.getMoment(model.get('startDate')), false);
                    }
                }
            }

            function failHandler() {
                notifications.yell('error', gt('An error occurred. Please try again.'));
                $('.appointment', self.main).removeClass('opac current');
                if (_.device('smartphone')) {
                    self.app.pages.getPage('detailView').idle();
                    self.app.pages.goBack();
                }
            }

            if (_.device('smartphone')) {
                var p = self.app.pages.getPage('detailView');
                api.get(obj).then(function (model) {
                    var data = model.toJSON(),
                        b = new ext.Baton({ data: data, model: model });
                    p.idle().empty().append(detailView.draw(model));
                    self.app.pages.getToolbar('detailView').setBaton(b);
                    applyDate(model);
                }, failHandler);

            } else {
                self.dialog.show(e, function (popup) {
                    popup
                    .busy()
                    .attr({
                        'role': 'complementary',
                        'aria-label': gt('Appointment Details')
                    });

                    api.get(obj).then(function (model) {
                        popup.idle().append(detailView.draw(model));
                        applyDate(model);
                    }, failHandler);
                });
            }
        },

        /**
         * update appointment data
         * @param  {Object} model the appointment model
         */
        updateAppointment: function (model) {
            var self = this;

            /**
             * call api update function
             * @param  {Object} obj new appointment data
             */
            var apiUpdate = function (model, options) {
                clean(model);
                api.update(model, options).then(function success(data) {
                    if (!data || !data.conflicts) return;

                    ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                        conflictView.dialog(data.conflicts)
                            .on('cancel', function () {
                                self.view.renderAppointments();
                            })
                            .on('ignore', function () {
                                apiUpdate(model, _.extend(options || {}, { checkConflicts: false }));
                            });
                    });
                }, function fail(error) {
                    self.view.renderAppointments();
                    notifications.yell(error);
                });
            };

            /**
             * cleanup appointment data
             * @param  {Object} obj new appointment data
             * @return { Object}     clean appointment data
             */
            var clean = function (event) {
                event.unset('oldStartDate', { silent: true });
                event.unset('oldEndDate', { silent: true });
                return event;
            };

            util.showRecurrenceDialog(model)
                .done(function (action) {
                    switch (action) {
                        case 'series':
                        case 'thisandfuture':
                            var master;
                            if (action === 'series') master = api.get({ id: model.get('seriesId'), folder: model.get('folder') }, false);
                            else master = $.when(model.clone());
                            // get recurrence master object
                            master.done(function (masterModel) {
                                // calculate new dates if old dates are available
                                var oldStartDate = masterModel.getMoment('startDate'),
                                    startDate = masterModel.getMoment('startDate').add(model.getMoment('startDate').diff(model.get('oldStartDate'), 'ms'), 'ms'),
                                    endDate = masterModel.getMoment('endDate').add(model.getMoment('endDate').diff(model.get('oldEndDate'), 'ms'), 'ms'),
                                    format = util.isAllday(model) ? 'YYYYMMDD' : 'YYYYMMDD[T]HHmmss';
                                masterModel.set({
                                    startDate: { value: startDate.format(format), tzid: masterModel.get('startDate').tzid },
                                    endDate: { value: endDate.format(format), tzid: masterModel.get('endDate').tzid }
                                });
                                util.updateRecurrenceDate(masterModel, oldStartDate);
                                apiUpdate(masterModel, _.extend(util.getCurrentRangeOptions(), {
                                    checkConflicts: true,
                                    recurrenceRange: action === 'thisandfuture' ? 'THISANDFUTURE' : undefined
                                }));
                            });
                            break;
                        case 'appointment':
                            apiUpdate(model, _.extend(util.getCurrentRangeOptions(), { checkConflicts: true }));
                            break;
                        default:
                            self.view.renderAppointments();
                            return;
                    }
                });
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
            var obj = this.view.getRequestParam(),
                collection = api.getCollection(obj);

            // // set manually to expired to trigger reload on next opening
            if (useCache === false) {
                api.pool.grep('view=week').forEach(function (c) {
                    c.expired = true;
                });
            }

            this.view.setCollection(collection);
            collection.sync();
            this.prefetch(-1, collection);
        },

        prefetch: (function () {
            function getNewParams(params, index) {
                var range = moment(params.end).diff(moment(params.start), 'ms');
                return _.extend({}, params, {
                    start: index < 0 ? params.start - range : params.end,
                    end: index < 0 ? params.start : params.end + range
                });
            }
            return _.debounce(function (index, prevCollection) {
                var self = this,
                    params = this.view.getRequestParam(),
                    newParams = getNewParams(params, index),
                    collection = api.getCollection(newParams),
                    cont = function () {
                        collection.sync();
                        if (index < 0) self.prefetch(1, collection);
                    };
                prevCollection.once('load reload', cont);
            }, 0);
        }()),

        /**
         * call view print function
         */
        print: function () {
            if (this.view) this.view.print();
        },

        restore: function () {
            if (this.view) this.view.restore();
        },

        save: function () {
            if (this.view) this.view.save();
        },

        updateColor: function (model) {
            if (!model) return;
            var color = util.getFolderColor(model.attributes),
                container = $('[data-folder="' + model.get('id') + '"]', this.view.weekViewCon);
            $('[data-folder="' + model.get('id') + '"]', this.view.weekViewCon).css({
                'background-color': color,
                'color': util.getForegroundColor(color)
            }).data('background-color', color);

            container.removeClass('black white');
            container.addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');

            $('[data-folder="' + model.get('id') + '"]', this.view.dayLabel).css({
                'border-color': color
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
            $.when(this.app.folder.getData(), this.app.folders.getData()).done(function (data, folders) {
                // update view folder data
                self.view.setFolders(folders);
                self.view.folder(data);
                // save folder data to view and update
                self.getAppointments(useCache);
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

        // re-trigger event on app
        bubble: function (eventname, e, data) {
            this.app.trigger(eventname, e, data, this.view.mode);
        },

        /**
         * handle different views in this perspective
         * triggered by desktop.js
         * @param  {object} app the application
         * @param  {object} opt options from perspective
         */
        afterShow: function (app, opt) {
            var self = this;

            // hide current view
            if (this.view) {
                this.view.$el.hide();
            }

            // init views
            if (this.views[opt.perspective] === undefined) {

                this.view = window.weekview = new View({
                    app: app,
                    mode: opt.perspective.split(':')[1],
                    startDate: app.getDate(),
                    perspective: this,
                    appExtPoint: 'io.ox/calendar/week/view/appointment'
                });

                // populate date change from view to app
                this.view.on('change:date', function (date) {
                    app.setDate(date);
                });

                // respond to date change on app level
                this.view.listenTo(app.props, 'change:date', _.debounce(function (model, value) {
                    if (!this.$el.is(':visible')) return;
                    if (ox.debug) console.log('week: change date by app', value);
                    this.setStartDate(value);
                }, 100, true));

                this.main.attr('aria-label', {
                    'day': gt('Calendar Day View'),
                    'workweek': gt('Calendar Workweek View'),
                    'week': gt('Calendar Week View')
                }[this.view.mode]);

                // bind listener for view events
                this.view
                    .on('showAppointment', this.showAppointment, this)
                    .on('showAppointment', _.bind(this.bubble, this, 'showAppointment'))
                    .on('openCreateAppointment', this.openCreateAppointment, this)
                    .on('openCreateAppointment', _.bind(this.bubble, this, 'openCreateAppointment'))
                    .on('openEditAppointment', this.openEditAppointment, this)
                    .on('updateAppointment', this.updateAppointment, this)
                    .on('onRefresh', this.refresh, this)
                    .on('change:navbar:date', this.changeNavbarDate, this);

                this.view.listenTo(folderAPI, 'before:update', function (id, model) {
                    if (model.get('module') !== 'calendar') return;
                    if (!model.changed['com.openexchange.calendar.extendedProperties']) return;
                    self.updateColor(model);
                });

                this.views[opt.perspective] = this.view.render();
                this.main.append(this.view.$el.show());
                this.view.setScrollPos();
            } else {
                this.view = this.views[opt.perspective];
                this.view.setStartDate(app.getDate());
                this.view.$el.show();
            }
            app.trigger('aftershow:done', this);

            // renew data
            this.refresh();
        },

        // perspective week:week catches deep links
        // id must be set in URL
        followDeepLink: function () {
            var cid = _.url.hash('id'), e;
            if (cid) {
                cid = cid.split(',', 1)[0];

                // see if id is missing the folder
                if (cid.indexOf('.') === -1) {
                    // cid is missing folder appointment cannot be restored
                    if (!_.url.hash('folder')) return;
                    // url has folder attribute. Add this
                    cid = _.url.hash('folder') + '.' + cid;
                }

                if (_.device('smartphone')) {
                    ox.launch('io.ox/calendar/detail/main', { cid: cid });
                } else {
                    e = $.Event('click', { target: this.main });

                    //marker to make the view open in the correct week
                    this.setNewStart = true;
                    this.showAppointment(e, util.cid(cid), { arrow: false });
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
                .addClass('week-view secondary-time-label')
                .empty()
                .attr({
                    'role': 'main',
                    'aria-label': gt('Appointment list')
                });

            var refresh = function () { self.refresh(true); },
                reload = function () { self.refresh(false); };

            // create sidepopup object with eventlistener
            this.dialog = new dialogs.SidePopup({ tabTrap: true, preserveOnAppchange: true })
                .on('close', function () {
                    $('.appointment', this.main).removeClass('opac current');
                });

            // watch for api refresh
            api
                .on('refresh.all', reload)
                .on('process:create update delete', _.debounce(function () {
                    var collection = self.view.collection;
                    // set all other collections to expired to trigger a fresh load on the next opening
                    api.pool.grep('view=week').forEach(function (c) {
                        if (c !== collection) c.expired = true;
                    });
                    collection.sync();
                    self.prefetch(-1, collection);
                }))
                .on('delete', function () {
                    // Close dialog after delete
                    self.dialog.close();
                })
                .on('create update', function (obj) {
                    var current = ox.ui.App.getCurrentApp().getName();
                    if (!/^io.ox\/calendar/.test(current)) return;
                    if (!obj.seriesId || obj.seriesId !== obj.id) {
                        if (app.folder.get() !== String(obj.folder)) app.folder.set(obj.folder);
                        self.view.setStartDate(util.getMoment(obj.startDate).valueOf(), obj.allTime);
                    }
                });

            // watch for folder change
            this.app
                .on('folders:change', refresh)
                .on('folder:change', function () {
                    app.folder.getData().done(function (data) {
                        self.view.folder(data);
                    });
                });
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
        selectAppointment: function (model) {
            if (this.view) {
                this.view.setStartDate(model.getTimestamp('startDate'));
                this.view.trigger('onRefresh');
            }
        },

        getStartDate: function () {
            return this.view.startDate.valueOf();
        }
    });

    return perspective;
});
