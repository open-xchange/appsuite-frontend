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
            api.get(obj).then(
                function success(model) {

                    if (_.device('smartphone')) {
                        var data = model.toJSON(),
                            p = self.app.pages.getPage('detailView'),
                            b = new ext.Baton({ data: data, model: model });
                        // draw details to page
                        p.idle().empty().append(detailView.draw(model));
                        // update toolbar with new baton
                        self.app.pages.getToolbar('detailView').setBaton(b);

                    } else {
                        self.dialog.show(e, function (popup) {
                            popup
                            .append(detailView.draw(model))
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
                        self.app.refDate = moment(model.get('startDate'));
                        if (self.view) {
                            //view is rendered already
                            self.view.setStartDate(model.get('startDate'));
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
                                self.refresh();
                            })
                            .on('ignore', function () {
                                apiUpdate(model, _.extend(options || {}, { ignoreConflicts: true }));
                            });
                    });
                }, function fail(error) {
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
                event.unset('dragMove', { silent: true });
                return event;
            };

            if (model.get('recurrenceId') && model.get('id') === model.get('seriesId')) {
                var dialog;
                if (model.has('dragMove') && model.get('dragMove') !== 0) {
                    dialog = util.getRecurrenceChangeDialog();
                } else {
                    dialog = util.getRecurrenceEditDialog();
                }
                dialog
                    .show()
                    .done(function (action) {
                        var expanse = {
                            expand: true,
                            rangeStart: moment(self.view.startDate).utc().format('YYYYMMDD[T]HHmmss[Z]'),
                            rangeEnd: moment(self.view.startDate).utc().add(self.view.columns, 'days').format('YYYYMMDD[T]HHmmss[Z]')
                        };
                        switch (action) {
                            case 'series':
                                // get recurrence master object
                                // bypass cache to have a fresh last_modified timestamp (see bug 42376)
                                api.get({ id: model.get('seriesId'), folder: model.get('folder') }, false).done(function (masterModel) {
                                    // calculate new dates if old dates are available
                                    var startDate = masterModel.getMoment('startDate').add(model.getMoment('startDate').diff(model.get('oldStartDate'), 'ms'), 'ms'),
                                        endDate = masterModel.getMoment('endDate').add(model.getMoment('endDate').diff(model.get('oldEndDate'), 'ms'), 'ms'),
                                        format = util.isAllday(model) ? 'YYYYMMDD' : 'YYYYMMDD[T]HHmmss';
                                    masterModel.set({
                                        startDate: { value: startDate.format(format), tzid: masterModel.get('startDate').tzid },
                                        endDate: { value: endDate.format(format), tzid: masterModel.get('endDate').tzid }
                                    });
                                    util.updateRecurrenceDate(masterModel, model.get('oldStartDate'));
                                    apiUpdate(masterModel, expanse);
                                });
                                break;
                            case 'appointment':
                                apiUpdate(model, expanse);
                                break;
                            default:
                                self.refresh();
                                return;
                        }
                    });
            } else {
                apiUpdate(model);
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
            var obj = this.view.getRequestParam(),
                loader = api.collectionLoader,
                method = useCache === false ? 'reload' : 'load',
                collection = loader.getCollection(obj);

            this.prefetch(-1, collection);
            loader.collection = collection;
            loader[method](obj);
            this.view.setCollection(collection);

            // set manually to expired to trigger reload on next opening
            if (useCache === false) {
                api.pool.grep('view=week').forEach(function (c) {
                    if (c !== collection) c.expired = true;
                });
            }
        },

        prefetch: _.debounce(function (index, prevCollection) {
            var self = this,
                params = this.view.getRequestParam(),
                range = moment(params.end).diff(moment(params.start), 'ms'),
                newParams = _.extend(params, {
                    start: index < 0 ? params.start - range : params.end,
                    end: index < 0 ? params.start : params.end + range
                }),
                loader = api.collectionLoader,
                collection = loader.getCollection(newParams),
                cont = function (c) { if (index < 0) self.prefetch(1, c); };

            if (collection.length > 0 && !collection.expired) {
                cont(prevCollection);
            } else {
                prevCollection.once('load reload', _.debounce(function () {
                    loader.load(newParams);
                    cont(collection);
                }));
            }
        }, 200),

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
            var color = util.getFolderColor(model.attributes);
            $('[data-folder="' + model.get('id') + '"]', this.pane).css({
                'background-color': color,
                'color': util.getForegroundColor(color)
            }).data('background-color', color);
        },

        onChangeColorScheme: function () {
            if (this.app.props.get('colorScheme') !== 'custom') {
                $('.appointment', this.pane).css({ 'background-color': '', 'color':  '' });
            } else {
                $('.appointment', this.pane).each(function () {
                    var $elem = $(this),
                        cid = $elem.data('cid'),
                        folder = util.cid(cid).folder,
                        model = api.pool.get(folder).get(cid),
                        folderModel = folderAPI.pool.models[folder];
                    if (!model || !folderModel) return;
                    var color = util.getAppointmentColor(folderModel.attributes, model);
                    if (!color) return;
                    $elem.css({
                        'background-color': color,
                        'color': util.getForegroundColor(color)
                    }).data('background-color', color);
                    if (util.canAppointmentChangeColor(folderModel.attributes, model)) {
                        $elem.attr('data-folder', folder);
                    }
                });
            }
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
                self.getAppointments(useCache);

                // register event to listen to color changes on current folder
                if (self.folderModel) {
                    self.folderModel.off('change:cal.color', self.updateColor);
                }
                self.folderModel = folderAPI.pool.getModel(data.id);
                self.folderModel.on('change:cal.color', self.updateColor, self);
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
            // hide current view
            if (this.view) {
                this.view.$el.hide();
            }

            // init views
            if (this.views[opt.perspective] === undefined) {
                this.view = window.weekview = new View({
                    app: app,
                    mode: opt.perspective.split(':')[1],
                    refDate: this.app.refDate,
                    perspective: this,
                    appExtPoint: 'io.ox/calendar/week/view/appointment'
                });

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

                this.views[opt.perspective] = this.view.render();
                this.main.append(this.view.$el.show());
                this.view.setScrollPos();
            } else {
                this.view = this.views[opt.perspective];
                this.view.setStartDate(app.refDate);
                this.view.$el.show();
            }

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
                .on('create update delete', _.debounce(function () {
                    var collection = self.view.collection;
                    // set all other collections to expired to trigger a fresh load on the next opening
                    api.pool.grep('view=week').forEach(function (c) {
                        if (c === collection) return;
                        c.reset();
                        c.expired = true;
                    });
                    self.prefetch(-1, collection);
                    collection.trigger('load');
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
                        self.view.setStartDate(moment.tz(obj.startDate.value, obj.startDate.tzid || moment().tz()).valueOf(), obj.allTime);
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

            this.app.props.on('change:colorScheme', this.onChangeColorScheme.bind(this));

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
