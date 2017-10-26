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
], function (View, api, ext, http, dialogs, notifications, detailView, conflictView, print, folderAPI, util, chronosModel, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('month');

    _.extend(perspective, {

        scaffold:       $(),    // perspective
        pane:           $(),    // scrollpane
        monthInfo:      $(),    //
        tops:           {},     // scrollTop positions of the shown weeks
        firstMonth:     null,   // moment of the first month
        lastMonth:      null,   // moment of the last month
        updateLoad:     2,      // amount of months to be loaded on scroll events
        initLoad:       2,      // amount of initial called updates
        scrollOffset:   _.device('smartphone') ? 130 : 250,  // offset space to trigger update event on scroll stop
        currentView:    $(),    // the view with the current month
        views:          {},     // all month views
        current:        null,   // moment of current month
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
            api.get(obj).done(function (model) {
                self.dialog
                    .show(e, function (popup) {
                        popup
                        .append(detailView.draw(model))
                        .attr({
                            'role': 'complementary',
                            'aria-label': gt('Appointment Details')
                        });
                    });
            });
        },

        /**
         * open create appointment dialog
         * @param  {Event}  e        given event
         * @param  {number} startTS  timestamp of the day
         */
        createAppointment: function (e, start) {
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
            var self = this;

            var apiUpdate = function (model, options) {
                clean(model);
                api.update(model, options).then(function success(data) {
                    if (!data.conflicts) return;

                    ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                        conflictView.dialog(data.conflicts)
                            .on('cancel', function () { self.update(); })
                            .on('ignore', function () {
                                apiUpdate(model, { ignoreConflicts: true });
                            });
                    });
                }, function fail(error) {
                    notifications.yell(error);
                });
            };

            var clean = function (event) {
                event.unset('oldStartDate', { silent: true });
                event.unset('oldEndDate', { silent: true });
                event.unset('dragMove', { silent: true });
                return event;
            };

            if (model.get('recurrenceId') && model.get('id') === model.get('seriesId')) {
                util.getRecurrenceEditDialog()
                    .show()
                    .done(function (action) {
                        switch (action) {
                            case 'series':
                                // get recurrence master object
                                api.get({ id: model.get('seriesId'), folder: model.get('folder') }, false).done(function (masterModel) {
                                    // calculate new dates if old dates are available
                                    var startDate = masterModel.getMoment('startDate').add(model.getMoment('startDate').diff(model.get('oldStartDate'), 'ms'), 'ms'),
                                        endDate = masterModel.getMoment('endDate').add(model.getMoment('endDate').diff(model.get('oldEndDate'), 'ms'), 'ms'),
                                        format = util.isAllday(model) ? 'YYYYMMDD' : 'YYYYMMDD[T]HHmmss';
                                    masterModel.set({
                                        startDate: { value: startDate.format(format), tzid: masterModel.get('startDate').tzid },
                                        endDate: { value: endDate.format(format), tzid: masterModel.get('endDate').tzid }
                                    });
                                    util.updateRecurrenceDate(model, model.get('oldStartDate'));
                                    apiUpdate(masterModel);
                                });
                                break;
                            case 'appointment':
                                apiUpdate(model);
                                break;
                            default:
                                self.update();
                                return;
                        }
                    });
            } else {
                apiUpdate(model);
            }
        },

        updateWeeks: function (useCache) {
            var method = useCache === false ? 'reset' : 'set',
                loader = api.getCollectionLoader('month');

            // fetch appointments in a single call before loading collections
            http.pause();
            _(this.views).each(function (view) {
                var collection = loader.getCollection(view.getRequestParams());
                view.setCollection(collection);
                if (collection.length > 0 && !collection.expired && collection.sorted && !collection.preserve) return;
                loader.collection = collection;
                collection.expired = false;
                loader.httpGet('chronos', view.getRequestParams()).then(function (data) {
                    collection[method](data, { parse: true });
                }, loader.fail);
            });
            http.resume();
        },

        // re-trigger event on app
        bubble: function (eventname, e, data) {
            this.app.trigger(eventname, e, data, this.name);
        },

        drawMonths: function (opt) {
            var self = this;

            opt = _.extend({
                up: false,
                down: false
            }, opt);

            if (opt.up) {
                this.firstMonth.subtract(1, 'month');
                this.lastMonth.subtract(1, 'month');
            } else if (opt.down) {
                this.firstMonth.add(1, 'month');
                this.lastMonth.add(1, 'month');
            } else if (opt.date) {
                this.firstMonth = moment(opt.date).startOf('month').subtract(this.updateLoad, 'months');
                this.lastMonth = moment(opt.date).startOf('month').add(this.updateLoad, 'months');
            }

            this.current = this.firstMonth.clone().add(this.updateLoad, 'months');

            // mark old views as expired
            _(this.views).each(function (view) {
                view.$el.addClass('hidden');
            });

            function createOrReuseView(options) {
                var identifier = options.start.valueOf(), collection, view;

                if (!self.views[identifier]) {
                    self.views[identifier] = new View(options)
                        .on('showAppointment', self.showAppointment, self)
                        .on('showAppointment', _.bind(self.bubble, self, 'showAppointment'))
                        .on('createAppointment', self.createAppointment, self)
                        .on('createAppointment', _.bind(self.bubble, self, 'createAppointment'))
                        .on('openEditAppointment', self.openEditAppointment, self)
                        .on('updateAppointment', self.updateAppointment, self)
                        .render();
                }

                view = self.views[identifier];
                collection = api.getCollectionLoader('month').getCollection(view.getRequestParams());
                view.setCollection(collection);
                view.$el.removeClass('hidden');

                return view;
            }

            for (var curMonth = this.firstMonth.clone(); curMonth.isSameOrBefore(this.lastMonth); curMonth.add(1, 'month')) {

                var view = createOrReuseView({
                    start: curMonth.clone(),
                    folders: this.folders,
                    pane: this.pane,
                    app: this.app,
                    perspective: this
                });

                this.pane.append(view.$el);

                if (this.current.isSame(curMonth, 'month')) this.currentView = view;

            }

            this.updateWeeks();
        },

        /**
         * wrapper for scrollTop funciton
         * @param  {number} top scrollposition
         * @return { number}     new scroll position
         */
        scrollTop: function (top) {
            // scrollTop checks arity, so just passing an undefined top does not work here
            return top === undefined ? this.pane.scrollTop() : this.pane.scrollTop(top);
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

        update: function (useCache) {
            var day = $('#' + moment().format('YYYY-M-D'), this.pane);

            if (!day.hasClass('today')) {
                $('.day.today', this.pane).removeClass('today');
                day.addClass('today');
            }

            this.updateWeeks(useCache);
        },

        /**
         * scroll to given month
         * @param  {object} opt
         *          string|LocalDate date: date target as LocalDate or string (next|prev|today)
         *          number           duration: duration of the scroll animation
         */
        gotoMonth: function (target) {
            var self = this;

            target = target || self.app.refDate || moment();

            if (typeof target === 'string') {
                if (target === 'today') target = moment();
                else if (target === 'prev') target = this.current.clone().subtract(1, 'month');
                else if (target === 'next') target = this.current.clone().add(1, 'month');
                else throw Object({ message: 'Unknown target ' + target });
            }

            var firstDay = $('#' + target.format('YYYY-MM'), self.pane),
                scrollToDate = function () {
                    if (firstDay.length === 0) return;
                    firstDay.get(0).scrollIntoView();
                };

            this.drawMonths({ date: target });
            firstDay = $('#' + target.format('YYYY-MM'), self.pane);
            scrollToDate();
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

                if (self.folderModels) {
                    self.folderModels.forEach(function (model) {
                        model.off('change:com.openexchange.calendar.extendedProperties', self.updateColor);
                    });
                }
                self.folderModels = _(self.folders).map(function (folder) {
                    var model = folderAPI.pool.getModel(folder.id);
                    model.on('change:com.openexchange.calendar.extendedProperties', self.updateColor, self);
                    return model;
                });
            });
        },

        /**
         * perspective restore function. will be triggered on show
         */
        restore: function () {
            // goto current date position
            if (this.folder) {
                this.gotoMonth();
            }
        },

        /**
         * print current month
         */
        print: function () {
            // TODO update print view
            print.request('io.ox/calendar/month/print', {
                current: this.current,
                start: moment(this.current).startOf('week').valueOf(),
                end: moment(this.current).endOf('month').endOf('week').valueOf(),
                folder: this.folder.id || this.folder.folder,
                title: this.folder.title
            });
        },

        refresh: function () {
            var self = this;
            this.getFolder().done(function () {
                self.update();
            });
        },

        render: function (app) {

            var self = this;
            this.app = app;
            this.current = moment(app.refDate || moment()).startOf('month');
            this.previous = moment(this.current).subtract(1, 'month');
            this.firstMonth = this.current.clone().subtract(this.updateLoad, 'months');
            this.lastMonth = this.current.clone().add(this.updateLoad, 'months');

            this.main
                .addClass('month-view')
                .empty()
                .attr({
                    'role': 'main',
                    'aria-label': gt('Calendar Month View')
                })
                .append(this.scaffold = View.drawScaffold());

            var refresh = function () {
                self.refresh();
            };

            var reload = function () {
                self.getFolder().done(function () {
                    self.update(false);
                });
            };

            this.pane = $('.scrollpane', this.scaffold);

            if (_.device('!smartphone')) {
                var toolbarNode = $('<div>')
                    .addClass('controls-container')
                    .append(
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
                    );

                // prepend toolbar to month view
                this.scaffold.prepend(toolbarNode);
            }

            this.pane
                .css('right', -util.getScrollBarWidth() + 'px')
                .on('scroll', $.proxy(function (e) {
                    // debugger;
                    var $current = this.currentView.$el,
                        current = $current.get(0),
                        top = current.offsetTop,
                        height = current.offsetHeight;
                    if (top + height < e.target.scrollTop) {
                        this.drawMonths({ down: true });
                        e.target.scrollTop += $current.get(0).offsetTop - top;
                    } else if (top > e.target.scrollTop + e.target.offsetHeight) {
                        this.drawMonths({ up: true });
                        e.target.scrollTop += $current.get(0).offsetTop - top;
                    }
                }, this))
                .on('scrollend', $.proxy(function () {
                    this.app.refDate.year(this.current.year()).month(this.current.month());
                }, this));

            $(window).on('resize', this.getFirsts);

            self.getFolder().done(function () {
                self.drawMonths();
                self.gotoMonth();
            });

            if (_.keys(this.tops).length <= 1) {
                // when this page is shown for the first time and has no tops (means it is invisible) we have to wait until it is show and afterwards select the month
                // this requires special handling since gotoMonth uses scrollIntoView() which needs the page to be visible.
                self.app.pages.getPageObject(self.name).$el.one('animationstart', function () {
                    self.gotoMonth();
                });
            }

            this.main
                .on('keydown', function (e) {
                    switch (e.which) {
                        case 37:
                            // left
                            self.gotoMonth('prev');
                            break;
                        case 39:
                            // right
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

            this.app.props.on('change:colorScheme', this.onChangeColorScheme.bind(this));
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
