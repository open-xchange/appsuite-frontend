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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/month/perspective', [
    'io.ox/calendar/month/view',
    'io.ox/calendar/api',
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'io.ox/core/http',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'io.ox/calendar/view-detail',
    'io.ox/calendar/conflicts/conflictList',
    'io.ox/core/print',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'io.ox/calendar/model',
    'gettext!io.ox/calendar'
], function (View, api, capabilities, ext, http, dialogs, notifications, detailView, conflictView, print, folderAPI, util, chronosModel, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('month');

    _.extend(perspective, {

        scaffold:       $(),    // perspective
        container:      $('<div class="month-container f6-target scrollpane" tabindex="-1">'),    // container for table with month
        monthInfo:      $('<span class="month-info">'),
        currentView:    null,    // the view with the current month
        views:          {},     // all month views
        current:        moment().startOf('month'),   // moment of current month
        folder:         null,
        app:            null,   // the current application
        dialog:         $(),    // sidepopup

        /**
         * open sidepopup to show appointment
         * @param  {Event}  e   given click event
         * @param  {Object} obj appointment object (min. id, folder_id, recurrence_position)
         */
        showAppointment: function (e, obj) {
            // open appointment details
            var self = this;
            this.detailCID = api.cid(obj);
            this.dialog.show(e, function (popup) {
                popup
                .busy()
                .attr({
                    'role': 'complementary',
                    'aria-label': gt('Appointment Details')
                });

                api.get(obj).then(function success(model) {
                    if (model.cid !== self.detailCID) return;
                    popup.idle().append(detailView.draw(new ext.Baton({ model: model })));
                    self.gotoMonth(util.getMoment(model.get('startDate')));
                });
            });
        },

        /**
         * open create appointment dialog
         * @param  {Event}  e        given event
         * @param  {number} startTS  timestamp of the day
         */
        createAppointment: function (e, start) {
            if (capabilities.has('guest')) return;
            // add current time to start timestamp
            start = moment(start).add(Math.ceil((moment().hours() * 60 + moment().minutes()) / 30) * 30, 'minutes');

            ext.point('io.ox/calendar/detail/actions/create')
                .invoke('action', this, { app: this.app }, {
                    startDate: { value: start.format('YYYYMMDD[T]HHmmss'), tzid:  start.tz() },
                    endDate: { value: start.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid:  start.tz() }
                });
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
         * update appointment data
         * @param  {Object} obj new appointment data
         */
        updateAppointment: function (model) {
            function apiUpdate(model, options) {
                clean(model);
                api.update(model, options).then(function success(data) {
                    if (!data || !data.conflicts) return;

                    ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                        conflictView.dialog(data.conflicts)
                            .on('cancel', reset)
                            .on('ignore', function () {
                                apiUpdate(model, _.extend(options || {}, { checkConflicts: false }));
                            });
                    });
                }, function fail(error) {
                    notifications.yell(error);
                });
            }

            function clean(event) {
                event.unset('oldStartDate', { silent: true });
                event.unset('oldEndDate', { silent: true });
                event.unset('dragMove', { silent: true });
                return event;
            }

            function reset() {
                clean(model);
                api.pool.getCollectionsByModel(model).forEach(function (collection) {
                    collection.trigger('reset');
                });
            }

            util.showRecurrenceDialog(model)
                .done(function (action) {
                    switch (action) {
                        case 'series':
                        case 'thisandfuture':
                            var master;
                            if (action === 'series') master = api.get({ id: model.get('seriesId'), folder: model.get('folder') }, false);
                            else master = api.get({ id: model.get('seriesId'), folder: model.get('folder'), recurrenceId: model.get('recurrenceId') }, false);
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
                            self.refresh();
                            return;
                    }
                });
        },

        updateMonths: function (useCache) {
            var self = this,
                collection = api.getCollection(this.currentView.getRequestParams());
            this.currentView.setCollection(collection);
            if (useCache === false) {
                _(this.views).forEach(function (view, identifier) {
                    view.collection.expired = true;
                    if (view === self.currentView) return;
                    // remove view
                    view.$el.off().removeData();
                    view.off().stopListening();
                    for (var id in view) if (view.hasOwnProperty(id)) view[id] = null;
                    delete self.views[identifier];
                });
            }
            collection.sync();
        },

        // re-trigger event on app
        bubble: function (eventname, e, data) {
            this.app.trigger(eventname, e, data, this.name);
        },

        drawMonths: function () {
            var self = this;

            function createOrReuseView(options) {

                var identifier = options.start.valueOf(),
                    view = self.views[identifier],
                    collection;

                if (!view) {
                    view = self.views[identifier] = new View(options)
                        .on('showAppointment', self.showAppointment, self)
                        .on('showAppointment', _.bind(self.bubble, self, 'showAppointment'))
                        .on('createAppointment', self.createAppointment, self)
                        .on('createAppointment', _.bind(self.bubble, self, 'createAppointment'))
                        .on('openEditAppointment', self.openEditAppointment, self)
                        .on('updateAppointment', self.updateAppointment, self)
                        .render();
                }

                collection = api.getCollection(view.getRequestParams());
                view.setCollection(collection);
                view.$el.removeClass('hidden');

                return view;
            }

            var view = createOrReuseView({
                start: this.current,
                folders: this.folders,
                app: this.app,
                perspective: this
            });

            if (this.currentView) this.currentView.$el.detach();
            this.container.append(view.$el);

            this.currentView = view;

            if (_.device('ie && ie <= 11')) {
                this.calculateHeights();
            }

            this.updateMonths();
        },

        // IE 11 needs a fixed height or appointments are not displayed
        calculateHeights: _.debounce(function () {
            var height = Math.floor(this.container.height() / this.container.find('tr').length - 26) + 'px';
            this.container.find('.list').css('height', height);
        }, 100),

        updateColor: function (model) {
            if (!model) return;
            var color = util.getFolderColor(model.attributes),
                container =  $('[data-folder="' + model.get('id') + '"]', this.container);
            $('[data-folder="' + model.get('id') + '"]', this.container).css({
                'background-color': color,
                'color': util.getForegroundColor(color)
            }).data('background-color', color);
            container.removeClass('black white');
            container.addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');
        },

        update: function (useCache) {
            var day = $('#' + moment().format('YYYY-M-D'), this.container);

            if (!day.hasClass('today')) {
                $('.day.today', this.container).removeClass('today');
                day.addClass('today');
            }

            this.updateMonths(useCache);
        },

        /**
         * scroll to given month
         * @param  {object} opt
         *          string|LocalDate date: date target as LocalDate or string (next|prev|today)
         *          number           duration: duration of the scroll animation
         */
        gotoMonth: function (target) {

            var previous = this.current;

            target = target || moment();

            if (typeof target === 'string') {
                if (target === 'today') target = moment();
                else if (target === 'prev') target = this.current.clone().subtract(1, 'month');
                else if (target === 'next') target = this.current.clone().add(1, 'month');
                else throw Object({ message: 'Unknown target ' + target });
            }

            this.current = moment(target);
            this.monthInfo.text(this.current.format('MMMM YYYY'));

            if (this.current.isSame(previous, 'month') && this.currentView) return;

            this.drawMonths();
            this.app.setDate(moment([this.current.year(), this.current.month()]));
        },

        /**
         * get current folder data
         * @return { Deferred} Deferred with folder data on resolve
         */
        getFolder: function () {
            var self = this;

            return $.when(this.app.folder.getData(), this.app.folders.getData()).then(function (data, folders) {
                self.folder = data;
                self.folders = folders;

                _(self.views).each(function (view) {
                    view.folders = folders;
                });
            });
        },

        /**
         * perspective restore function. will be triggered on show
         */
        restore: function () {
            // goto current date position
            if (!this.folder) return;
            this.gotoMonth(moment(this.app.props.get('date')));
        },

        /**
         * print current month
         */
        print: function () {
            print.request('io.ox/calendar/month/print', {
                current: this.current,
                start: moment(this.current).startOf('week').valueOf(),
                end: moment(this.current).endOf('month').endOf('week').valueOf(),
                folders: this.folders,
                title: _(this.folders).keys().length === 1 ? this.folders[_(this.folders).keys()[0]].display_title || this.folders[_(this.folders).keys()[0]].title : gt('Appointments')
            });
        },

        refresh: function (useCache) {
            var self = this;
            this.getFolder().done(function () {
                self.update(useCache);
            });
        },

        render: function (app) {
            var self = this,
                toolbar = $('<div class="month-toolbar">');
            this.app = app;
            this.current = app.getDate().startOf('month');
            this.previous = moment(this.current).subtract(1, 'month');
            this.firstMonth = this.current.clone().subtract(this.updateLoad, 'months');
            this.lastMonth = this.current.clone().add(this.updateLoad, 'months');

            this.main
                .addClass('month-view')
                .empty()
                .attr({
                    'aria-label': gt('Calendar Month View')
                })
                .append(
                    toolbar,
                    this.container.addClass(_.device('smartphone') || this.app.props.get('showMonthviewWeekend') ? 'weekends' : '')
                );

            var refresh = function () {
                self.refresh();
            };

            var reload = function () {
                self.getFolder().done(function () {
                    self.update(false);
                });
            };

            if (_.device('!smartphone')) {
                toolbar.append(
                    $('<div class="controls-container">').append(
                        $('<a href="#" role="button" class="control prev">').attr('title', gt('Previous')).append(
                            $('<i class="fa fa-chevron-left" aria-hidden="true">')
                        )
                        .on('click', $.proxy(function (e) {
                            e.preventDefault();
                            this.gotoMonth('prev');
                        }, this)),
                        $('<a href="#" role="button" class="control next">').attr('title', gt('Next')).append(
                            $('<i class="fa fa-chevron-right" aria-hidden="true">')
                        )
                        .on('click', $.proxy(function (e) {
                            e.preventDefault();
                            this.gotoMonth('next');
                        }, this))
                    )
                );
            }

            toolbar.append(this.monthInfo);

            app.props.on('change:date', function (model, value) {
                if (!this.container.is(':visible')) return;
                if (ox.debug) console.log('month: change date by app', value);
                this.gotoMonth(app.getDate());
            }.bind(this));

            app.props.on('change:showMonthviewWeekend', function (model, value) {
                this.container.toggleClass('weekends', value);
            }.bind(this));

            app.props.on('change:showMonthviewCW', function (model, value) {
                this.container.toggleClass('cw', value);
            }.bind(this));

            if (_.device('ie && ie <= 11')) {
                $(window).on('resize', _(this.calculateHeights).bind(this));
            }

            self.getFolder().done(function () {
                self.drawMonths();
                self.gotoMonth();
            });

            this.main
                .on('keydown', function (e) {
                    switch (e.which) {
                        case 37: // left
                        case 38: // up
                            self.gotoMonth('prev');
                            break;
                        case 39: // right
                        case 40: // down
                            self.gotoMonth('next');
                            break;
                        case 13:
                            // enter
                            $(e.target).click();
                            break;
                        case 32:
                            // space
                            e.preventDefault();
                            $(e.target).click();
                            break;
                        // no default
                    }
                });

            // define default sidepopup dialog
            this.dialog = new dialogs.SidePopup({ tabTrap: true, preserveOnAppchange: true })
                .on('close', function () {
                    $('.appointment', this.main).removeClass('opac current');
                });

            // watch for api refresh
            api.on('refresh.all', reload)
                .on('delete', function () {
                    // Close dialog after delete
                    self.dialog.close();
                    refresh();
                });
            app.on('folders:change', refresh)
                .on('folder:change', function () {
                    app.folder.getData().done(function (data) {
                        self.folder = data;
                    });
                })
                .getWindow()
                .on('show', refresh)
                .on('show', $.proxy(this.restore, this))
                .on('beforehide', $.proxy(this.save, this))
                .on('change:perspective', function () {
                    self.dialog.close();
                });

            folderAPI.on('before:update', function (id, model) {
                if (model.get('module') !== 'calendar') return;
                if (!model.changed['com.openexchange.calendar.extendedProperties']) return;
                self.updateColor(model);
            });
        },

        // called when an appointment detail-view opens the according appointment
        selectAppointment: function (model) {
            this.gotoMonth(model.getMoment('startDate'));
        },

        getStartDate: function () {
            return this.current.valueOf();
        }
    });

    return perspective;
});
