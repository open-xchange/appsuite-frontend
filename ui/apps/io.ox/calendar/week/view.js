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

define('io.ox/calendar/week/view', [
    'io.ox/core/extensions',
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'settings!io.ox/core',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/print',
    'static/3rd.party/jquery-ui.min.js',
    'io.ox/calendar/week/extensions'
], function (ext, api, util, folderAPI, gt, settings, coreSettings, Dropdown, print) {

    'use strict';

    // helper

    function getTimezoneLabels() {

        var list = _.intersection(
            settings.get('favoriteTimezones', []),
            settings.get('renderTimezones', [])
        );

        // avoid double appearance of default timezone
        return _(list).without(coreSettings.get('timezone'));
    }

    var View = Backbone.View.extend({

        className:      'week',

        columns:        7,      // default value for day columns
        gridSize:       2,      // grid fragmentation of a hour
        cellHeight:     24,     // height of one single fragment in px
        minCellHeight:  24,     // min height of one single fragment in px
        paneHeight:     0,      // the height of the pane. is stored if the pane is not visible
        fulltimeHeight: 20,     // height of full-time appointments in px
        fulltimeMax:    5,      // threshold for visible full-time appointments in scrollpane header
        appWidth:       98,     // max width of an appointment in %
        overlap:        0.35,   // visual overlap of appointments [0.0 - 1.0]
        slots:          24,     // amount of shown time-slots
        workStart:      8,      // full hour for start position of working time marker
        workEnd:        18,     // full hour for end position of working time marker
        mode:           0,      // view mode {1: day, 2: workweek, 3: week }
        showDeclined:   false,  // show declined appointments
        limit:          1000,   // limit for number of appointments. If there are more appointments resize drag and opacity functions are disabled for performace resons

        startDate:      null,   // start of day/week as local date (use as reference point)
        apiRefTime:     null,   // current reference time for api calls
        clickTimer:     null,   // timer to separate single and double click
        clicks:         0,      // click counter
        lasso:          false,  // lasso object
        folderData:     {},     // current folder object
        restoreCache:   null,   // object, which contains data for save and restore functions
        extPoint:       null,   // appointment extension
        dayLabelRef:    null,   // used to manage redraw on daychange
        startLabelRef:  null,   // used to manage redraw on weekchange

        // startup options
        options:        {
            todayClass: 'today',
            showFulltime: true,
            keyboard: true,
            allowLasso: true
        },

        events: (function () {
            // define view events
            var events = {
                'click .control.next,.control.prev': 'onControlView',
                'click .appointment': 'onClickAppointment',
                'mousedown .appointment': 'onMousdownAppointment',
                'click .weekday': 'onCreateAppointment',
                'click .merge-split': 'onMergeSplit'
            };

            if (_.device('touch')) {
                _.extend(events, {
                    'taphold .week-container>.day,.fulltime>.day': 'onCreateAppointment',
                    'swipeleft': 'onControlView',
                    'swiperight': 'onControlView'
                });
            } else {
                _.extend(events, {
                    'dblclick .week-container>.day,.fulltime>.day': 'onCreateAppointment'
                });
                if (_.device('desktop')) {
                    _.extend(events, {
                        'mouseenter .appointment': 'onHover',
                        'mouseleave .appointment': 'onHover',
                        'mousedown .week-container>.day': 'onLasso',
                        'mousemove .week-container>.day': 'onLasso',
                        'mouseup': 'onLasso'
                    });
                }
            }
            return events;
        }()),

        // init values from perspective
        initialize: function (opt) {
            var self = this;

            // init options
            this.options = _.extend({}, this.options, opt);

            // initialize main objects
            _.extend(this, {
                pane:         $('<div class="scrollpane f6-target" tabindex="-1">').on('scroll', this.updateHiddenIndicators.bind(this)),
                fulltimePane: $('<div class="fulltime">'),
                fulltimeCon:  $('<div class="fulltime-container">'),
                timeline:     $('<div class="timeline">'),
                dayLabel:     $('<div class="footer">'),
                kwInfo:       _.device('smartphone') ? $('<div class="info">') : $('<button class="info btn btn-link">'),
                weekViewCon:  $('<div class="week-view-container">'),
                weekCon:      $('<div class="week-container">'),
                moreAppointmentsIndicators: $('<div class="more-appointments-container">')
            });

            this.kwInfo.attr({
                'aria-label': gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.')
            });

            this.app = opt.app;
            this.perspective = opt.perspective;
            this.mode = opt.mode || 'day';
            this.extPoint = opt.appExtPoint;
            this.isMergeView = _.device('!smartphone') && this.mode === 'day' && this.app.folders.list().length > 1 && settings.get('mergeview');

            switch (this.mode) {
                case 'day':
                    this.$el.addClass('dayview');
                    if (this.isMergeView) this.$el.addClass('merge-view');
                    this.columns = 1;
                    break;
                case 'workweek':
                    this.$el.addClass('workweekview');
                    this.columns = settings.get('numDaysWorkweek');
                    break;
                default:
                case 'week':
                    this.$el.addClass('weekview');
                    this.columns = 7;
                    break;
            }

            this.setStartDate(opt.startDate || moment());
            this.initSettings();

            if (!_.device('smartphone')) {
                require(['io.ox/backbone/views/datepicker'], function (Picker) {
                    new Picker({ date: self.startDate })
                        .attachTo(self.kwInfo)
                        .on('select', function (date) {
                            self.setStartDate(date);
                        })
                        .on('before:open', function () {
                            this.setDate(self.startDate);
                        });
                    var props = self.app.props.on('change:showMiniCalendar change:folderview', togglePicker);
                    togglePicker();
                    function togglePicker() {
                        self.kwInfo.prop('disabled', props.get('folderview') && props.get('showMiniCalendar'));
                    }
                });
            }

            if (this.mode === 'workweek') this.listenTo(settings, 'change:numDaysWorkweek change:workweekStart', this.rerender);
            if (this.mode === 'day') {
                this.listenTo(settings, 'change:mergeview', this.rerender);
                this.listenTo(this.app, 'folders:change', function () {
                    if (!settings.get('mergeview')) return;
                    _.delay(function () { self.rerender(); }, 20);
                });
            }
        },

        rerender: function () {

            function cont() {
                var scrollTop = this.pane.scrollTop();
                // clean up
                // detach first so that the date picker link still works
                this.kwInfo.detach();
                this.pane.empty();
                this.fulltimePane.empty();
                this.fulltimeCon.empty();
                this.timeline.empty();
                this.weekCon.empty();
                this.moreAppointmentsIndicators.empty();
                // render again
                this.isMergeView = _.device('!smartphone') && this.mode === 'day' && this.app.folders.list().length > 0 && settings.get('mergeview');
                if (this.mode === 'workweek') this.columns = settings.get('numDaysWorkweek');
                if (this.mode === 'day') this.$el.toggleClass('merge-view', this.isMergeView);
                this.setStartDate(this.startDate);
                this.render();
                this.renderAppointments();
                this.perspective.refresh();
                // reset pane
                this.pane.scrollTop(scrollTop);
                this.pane.on('scroll', this.updateHiddenIndicators.bind(this));
            }

            if ($('.time:visible', this.pane).length === 0) this.app.getWindow().one('show', cont.bind(this)); else cont.call(this);
        },

        /**
         * reset appointment collection
         * avoids processing concurrent requests in wrong order
         * @param  { number } startDate starttime from inital request
         * @param  { array }  data      all appointments returend by API
         */
        reset: function (startDate, models) {
            if (startDate === this.apiRefTime.valueOf()) {
                var ws = this.startDate.valueOf(),
                    we = moment(this.startDate).add(this.columns, 'days').valueOf();
                models = _(models).filter(util.rangeFilter(ws, we));
                // reset collection; transform raw dato to proper models
                this.collection.reset(models);
                if (this.collection.length > this.limit) {
                    var self = this;
                    console.warn('Too many appointments. There are ' + this.collection.length + ' appointments. The limit is ' + this.limit + '. Resize, drag and opacity are disabled due to performance reasons.');
                    require(['io.ox/core/yell'], function (yell) {
                        //#. %1$n is the maximum number of appointments
                        yell('warning', gt('There are more than %n appointments in the current calendar. Some features are disabled due to performance reasons.', self.limit));
                    });
                }
                this.renderAppointments();
            }
        },

        setCollection: function (collection) {
            if (this.collection === collection) return;

            if (this.collection) this.stopListening(this.collection);
            this.collection = collection;

            this.$('.merge-split').toggleClass('hidden', this.mode !== 'day' || this.app.folders.list().length <= 1);
            this.renderAppointments();

            this
                .listenTo(this.collection, 'change', this.redrawAppointment, this)
                .listenTo(this.collection, 'add remove reset', _.debounce(this.renderAppointments), this);
        },

        /**
         * set week reference start date
         * @param { string|number|LocalDate } value
         *        number: Timestamp of a date in the reference week. Now if empty
         *        string: { 'next', 'prev' } set next or previous week
         *        moment: moment date object in the reference week
         * @param { object } options
         *        utc (boolean): full-time appointment
         *        propagate (boolean): propagate change
         */

        setStartDate: function (value, options) {

            var previous = moment(this.startDate),
                opt = _.extend({ utc: false, propagate: true }, options);

            if (value) {
                // number | LocalDate
                if (typeof value === 'number' || moment.isMoment(value)) {
                    if (opt.utc) value = moment.utc(value).local(true).valueOf();
                    this.startDate = moment(value);
                }
                // string
                if (typeof value === 'string') this.startDate[value === 'prev' ? 'subtract' : 'add'](1, this.columns === 1 ? 'day' : 'week');
            } else {
                // today button
                this.startDate = moment();
            }
            // normalize startDate to beginning of the week or day
            switch (this.mode) {
                case 'day':
                    this.startDate.startOf('day');
                    break;
                case 'workweek':
                    // settings independent, set startDate to Monday of the current week
                    this.startDate.startOf('week').day(settings.get('workweekStart'));
                    break;
                default:
                case 'week':
                    this.startDate.startOf('week');
                    break;
            }

            // set api reference date to the beginning of the month
            var month = this.startDate.month();
            if (month % 2 === 1) month--;
            this.apiRefTime = moment(this.startDate).month(month).date(1);

            // only trigger change event if start date has changed
            if (this.startDate.isSame(previous)) return;
            if (opt.propagate) this.trigger('change:date', this.startDate);
            if (ox.debug) console.log('refresh calendar data');
            this.trigger('onRefresh');
        },

        /**
         * setup setting params
         */
        initSettings: function () {
            // init settings
            var self = this;
            this.gridSize = 60 / settings.get('interval', 30);
            this.workStart = settings.get('startTime', this.workStart) * 1;
            this.workEnd = settings.get('endTime', this.workEnd) * 1;
            settings.on('change', function (key) {
                switch (key) {
                    case 'favoriteTimezones':
                    case 'renderTimezones':
                        self.app.getWindow().one('show', function () {
                            self.adjustCellHeight(true);
                        });
                        break;
                    case 'interval':
                        var calculateTimescale = function () {
                            // save scroll ratio
                            var scrollRatio = (self.pane.scrollTop() + self.pane.height() / 2) / self.height();
                            // reset height of .time fields, since the initial height comes from css
                            $('.time', self.pane).css('height', '');
                            self.adjustCellHeight(false);
                            self.renderAppointments();
                            // restore scroll position from ratio
                            self.pane.scrollTop(scrollRatio * self.height() - self.pane.height() / 2);
                        };

                        self.gridSize = 60 / settings.get('interval', 30);
                        var timelineContainer = self.timeline.parent();
                        self.renderTimeslots();
                        self.applyTimeScale();
                        timelineContainer.append(self.timeline);

                        // if this function is called while the calendar app is not visible we get wrong height measurements
                        // so wait until the next show event, to calculate correctly
                        if ($('.time:visible', self.pane).length === 0) {
                            self.app.getWindow().one('show', calculateTimescale);
                        } else {
                            calculateTimescale();
                        }
                        break;
                    case 'startTime':
                    case 'endTime':
                        self.workStart = settings.get('startTime', self.workStart);
                        self.workEnd = settings.get('endTime', self.workEnd);
                        self.rerenderWorktime();
                        break;
                    default:
                        break;
                }
            });
        },

        /**
         * handler for hover effect
         * @param  { MouseEvent } e Hover event (mouseenter, mouseleave)
         */
        onHover: function (e) {
            if (!this.lasso) {
                var cid = util.cid(String($(e.currentTarget).data('cid'))),
                    el = $('[data-master-id="' + cid.folder + '.' + cid.id + '"]', this.$el),
                    bg = el.data('background-color');
                switch (e.type) {
                    case 'mouseenter':
                        if (e.relatedTarget && e.relatedTarget.tagName !== 'TD') {
                            el.addClass('hover');
                            if (bg) el.css('background-color', util.lightenDarkenColor(bg, 0.9));
                        }
                        break;
                    case 'mouseleave':
                        el.removeClass('hover');
                        if (bg) el.css('background-color', bg);
                        break;
                    default:
                        break;
                }
            }
        },

        /**
         * handler for clickevents in toolbar
         * @param  { MouseEvent } e Clickevent
         */
        onControlView: function (e) {
            e.preventDefault();
            var cT = $(e.currentTarget);
            if (cT.hasClass('next') || (e.type === 'swipeleft' && !this.lasso)) {
                this.setStartDate('next');
            }
            if (cT.hasClass('prev') || (e.type === 'swiperight' && !this.lasso)) {
                this.setStartDate('prev');
            }
            return false;
        },

        /**
         * Get visible edges in time format
         */
        getTimeOfVisibleEdges: function () {
            return {
                min: this.getTimeFromPos(this.pane.scrollTop()),
                max: this.getTimeFromPos(this.pane.scrollTop() + this.pane.height())
            };
        },

        /**
         * handler to update indicators for hidden appointments
         *
         * this handler is throttled to only run once every 100ms
         *
         */
        updateHiddenIndicators: (function () {
            function indicatorButton(column, width) {
                return $('<span>')
                        .addClass('more-appointments fa')
                        .css({
                            left: (column * width) + '%',
                            width: width + '%'
                        });
            }

            return _.throttle(function () {
                var self = this,
                    min = this.pane.scrollTop(),
                    max = this.pane.scrollTop() + this.pane.height(),
                    threshold = 3,
                    columns = this.isMergeView ? this.app.folders.list() : _.range(this.columns),
                    columnWidth = 100 / columns.length;

                this.moreAppointmentsIndicators.empty();
                columns.forEach(function (c, i) {
                    var appointments = self.weekCon.find('.day:nth-child(' + (i + 1) + ') > .appointment');
                    var earlier = appointments.filter(function (index, el) {
                        el = $(el);
                        return el.position().top + el.height() - threshold < min;
                    }).length;
                    var later = appointments.filter(function (index, el) {
                        el = $(el);
                        return el.position().top + threshold > max;
                    }).length;
                    if (earlier > 0) {
                        self.moreAppointmentsIndicators.append(
                            indicatorButton(i, columnWidth)
                                .addClass('earlier fa-caret-up')
                        );
                    }
                    if (later > 0) {
                        self.moreAppointmentsIndicators.append(
                            indicatorButton(i, columnWidth)
                                .addClass('later fa-caret-down')
                        );
                    }
                });
            }, 100);
        }()),

        /**
         * handler for key events in view
         * @param  { KeyEvent } e Keyboard event
         */
        fnKey: function (e) {
            if (!this.options.keyboard) {
                return false;
            }
            switch (e.which) {
                case 27:
                    // ESC
                    this.cleanUpLasso();
                    $('.week-container .day>.appointment.modify', this.$el)
                    .draggable({ 'revert': true })
                    .trigger('mouseup');
                    break;
                case 37:
                    // left
                    this.setStartDate('prev');
                    break;
                case 39:
                    // right
                    this.setStartDate('next');
                    break;
                case 13:
                    // enter
                    this.onClickAppointment(e);
                    break;
                case 32:
                    // space
                    e.preventDefault();
                    this.onClickAppointment(e);
                    break;
                default:
                    break;
            }
        },

        onMousdownAppointment: function (e) {
            if ($(e.target).hasClass('ui-resizable-handle')) {
                delete this.clicktarget;
                return;
            }
            this.clicktarget = $(e.currentTarget).attr('data-cid');
        },

        /**
         * handler for single- and double-click events on appointments
         * @param  { MouseEvent } e Mouse event
         */
        onClickAppointment: function (e) {
            var cT = $(e[(e.type === 'keydown') ? 'target' : 'currentTarget']);
            if (cT.attr('data-cid') !== this.clicktarget) return;
            if (cT.hasClass('appointment') && !this.lasso && !cT.hasClass('disabled')) {
                var self = this,
                    obj = util.cid(String(cT.data('cid')));
                if (!cT.hasClass('current') || _.device('smartphone')) {
                    // ignore the "current" check on smartphones
                    $('.appointment', self.$el)
                        .removeClass('current opac')
                        .not($('[data-master-id="' + obj.folder + '.' + obj.id + '"]', self.$el))
                        .addClass((this.collection.length > this.limit || _.device('smartphone')) ? '' : 'opac'); // do not add opac class on phones or if collection is too large
                    $('[data-master-id="' + obj.folder + '.' + obj.id + '"]', self.$el).addClass('current');
                    self.trigger('showAppointment', e, obj);

                } else {
                    $('.appointment', self.$el).removeClass('opac');
                }

                if (self.clickTimer === null && self.clicks === 0) {
                    self.clickTimer = setTimeout(function () {
                        clearTimeout(self.clickTimer);
                        self.clicks = 0;
                        self.clickTimer = null;
                    }, 300);
                }
                self.clicks++;

                if (self.clickTimer !== null && self.clicks === 2 && cT.hasClass('modify') && e.type === 'click') {
                    clearTimeout(self.clickTimer);
                    self.clicks = 0;
                    self.clickTimer = null;
                    api.get(obj).done(function (model) {
                        self.trigger('openEditAppointment', e, model.attributes);
                    });
                }
            }
        },

        /**
         * handler for double-click events on grid to create new appointments
         * @param  { MouseEvent } e double click event
         */
        onCreateAppointment: function (e) {

            e.preventDefault();

            var self = this,
                getFolder = this.mode === 'day' && settings.get('mergeview') ? folderAPI.get($(e.currentTarget).attr('data-folder-cid') || this.folder().id) : $.when(this.folder());

            getFolder.done(function (folder) {
                if (!folderAPI.can('create', folder)) return;

                var start = self.getTimeFromDateTag($(e.currentTarget).attr('date'));

                if ($(e.target).hasClass('timeslot')) {
                    // calculate timestamp for current position
                    start.add(self.getTimeFromPos(e.target.offsetTop), 'milliseconds');
                    self.trigger('openCreateAppointment', e, {
                        startDate: { value: start.format('YYYYMMDD[T]HHmmss'), tzid:  start.tz() },
                        endDate: { value: start.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid:  start.tz() },
                        folder: folder.id
                    });
                }
                if ($(e.target).hasClass('day') || $(e.target).closest('.weekday').length > 0) {
                    // calculate timestamp for current position
                    self.trigger('openCreateAppointment', e, {
                        startDate: { value: start.utc(true).format('YYYYMMDD') },
                        endDate: { value: start.utc(true).format('YYYYMMDD') },
                        folder: folder.id
                    });
                }
            });
        },

        /**
         * handler for appointment updates
         * @param  { Object } event event model
         */
        onUpdateAppointment: function (event) {
            if (event.get('startDate') && event.get('endDate') && event.getTimestamp('startDate') <= event.getTimestamp('endDate')) {
                this.trigger('updateAppointment', event);
            }
        },

        /**
         * handler for lasso function in grid
         * @param  { MouseEvent } e mouseevents on day container
         */
        onLasso: function (e) {
            var self = this,
                getFolder = this.mode === 'day' && settings.get('mergeview') ? folderAPI.get($(e.target).closest('.day').attr('data-folder-cid') || this.folder().id) : $.when(this.folder());

            getFolder.done(function (folder) {
                if (!folderAPI.can('create', folder)) return;

                // switch mouse events
                switch (e.type) {
                    case 'mousedown':
                        if (e.which === 1 && self.lasso === false && $(e.target).hasClass('timeslot')) {
                            self.lasso = true;
                            self.mousedownAt = e.pageY + self.pane.scrollTop();
                        }
                        break;

                    case 'mousemove':
                        e.preventDefault();
                        var cT = $(e.currentTarget),
                            curDay = parseInt(cT.attr('date'), 10),
                            mouseY = e.pageY - (self.pane.offset().top - self.pane.scrollTop()),
                            thresholdExceeded = Math.abs(self.mousedownAt - (e.pageY + self.pane.scrollTop())) > 4;

                        // normal move
                        if (_.isObject(self.lasso) && e.which === 1) {
                            var lData = self.lasso.data(),
                                down = mouseY > lData.start,
                                right = curDay > lData.startDay,
                                dayChange = curDay !== lData.lastDay,
                                dayDiff = Math.abs(curDay - lData.startDay),
                                lassoStart = self.roundToGrid(lData.start, (down && dayDiff === 0) || right ? 'n' : 's');

                            if (dayDiff > 0) {
                                if (dayChange) {
                                    // move mouse to another day area

                                    // update start lasso
                                    self.lasso.css({
                                        height: right ? 'auto' : lassoStart,
                                        top: right ? lassoStart : 0,
                                        bottom: right ? 0 : 'auto'
                                    });

                                    // create temp. helper lasso
                                    var tmpLasso = $('<div>')
                                        .addClass('appointment lasso')
                                        .css({
                                            height: right ? self.roundToGrid(mouseY, 's') : 'auto',
                                            minHeight: self.minCellHeight,
                                            top: right ? 0 : self.roundToGrid(mouseY, 'n'),
                                            bottom: right ? 'auto' : 0
                                        });

                                    // remove or resize helper
                                    $.each(lData.helper, function (i, el) {
                                        if (i >= dayDiff) {
                                            el.remove();
                                            delete lData.helper[i];
                                        } else {
                                            el.css({
                                                height: 'auto',
                                                top: 0,
                                                bottom: 0
                                            });
                                        }
                                    });
                                    lData.helper[dayDiff] = tmpLasso;
                                    lData.last = tmpLasso;

                                    // add last helper to pane
                                    cT.append(tmpLasso);
                                } else {
                                    // change only last helper height
                                    lData.last.css({
                                        height: right ? self.roundToGrid(mouseY, 's') : 'auto',
                                        minHeight: self.minCellHeight,
                                        top: right ? 0 : self.roundToGrid(mouseY, 'n'),
                                        bottom: right ? 'auto' : 0
                                    });

                                }
                            } else {
                                var newHeight = 0;
                                if (Math.abs(lData.start - mouseY) > 5) {
                                    newHeight = Math.abs(lassoStart - self.roundToGrid(mouseY, down ? 's' : 'n'));
                                } else {
                                    mouseY = lData.start;
                                }
                                if (dayChange) {
                                    lData.last.remove();
                                    delete lData.last;
                                }
                                self.lasso.css({
                                    height: newHeight,
                                    top: lassoStart - (down ? 0 : newHeight)
                                });
                                lData.start = lassoStart;
                            }
                            lData.stop = self.roundToGrid(mouseY, (down && dayDiff === 0) || right ? 's' : 'n');
                            lData.lastDay = curDay;
                        }

                        // first move
                        if (self.lasso === true && $(e.target).hasClass('timeslot')) {
                            if (!thresholdExceeded) return;
                            self.lasso = $('<div>')
                                .addClass('appointment lasso')
                                .css({
                                    height: self.cellHeight,
                                    minHeight: 0,
                                    top: self.roundToGrid(mouseY, 'n')
                                })
                                .data({
                                    start: self.roundToGrid(mouseY, 'n'),
                                    stop: self.roundToGrid(mouseY, 's'),
                                    startDay: curDay,
                                    lastDay: curDay,
                                    helper: {}
                                })
                                .appendTo(cT);
                        } else {
                            self.trigger('mouseup');
                        }
                        break;

                    case 'mouseup':
                        e.preventDefault();
                        if (_.isObject(self.lasso) && e.which === 1) {
                            var l = self.lasso.data();

                            // no action on 0px move
                            if (l.start === l.stop && l.lastDay === l.startDay) {
                                self.cleanUpLasso();
                                break;
                            }

                            var start = self.getTimeFromDateTag(Math.min(l.startDay, l.lastDay)),
                                end = self.getTimeFromDateTag(Math.max(l.startDay, l.lastDay));

                            if (l.startDay === l.lastDay) {
                                start.add(self.getTimeFromPos(Math.min(l.start, l.stop)), 'milliseconds');
                                end.add(self.getTimeFromPos(Math.max(l.start, l.stop)), 'milliseconds');
                            } else {
                                start.add(self.getTimeFromPos(l.startDay > l.lastDay ? l.stop : l.start), 'milliseconds');
                                end.add(self.getTimeFromPos(l.startDay > l.lastDay ? l.start : l.stop), 'milliseconds');
                            }

                            self.cleanUpLasso();

                            self.trigger('openCreateAppointment', e, {
                                startDate: { value: start.format('YYYYMMDD[T]HHmmss'), tzid: start.tz() },
                                endDate: { value: end.format('YYYYMMDD[T]HHmmss'), tzid: end.tz() },
                                folder: folder.id
                            });
                            e.stopImmediatePropagation();
                        }
                        self.lasso = false;
                        break;

                    default:
                        self.lasso = false;
                        break;
                }
            });
        },

        /**
         * cleanUp all lasso data
         */
        cleanUpLasso: function () {
            // more robost variant (see bug 47277)
            var lasso = this.lasso instanceof $ ? this.lasso : $(),
                data = lasso.data() || {};
            $.each(data.helper || [], function (i, el) {
                el.remove();
            });
            lasso.remove();
            this.lasso = false;
        },

        onMergeSplit: function (e) {
            e.preventDefault();
            settings.set('mergeview', !settings.get('mergeview')).save();
        },

        renderTimeLabel: function (timezone, className) {
            var timeLabel = $('<div class="week-container-label" aria-hidden="true">').addClass(className),
                self = this;

            timeLabel.append(
                _(_.range(this.slots)).map(function (i) {
                    var number = moment().startOf('day').hours(i).tz(timezone).format('LT');

                    return $('<div class="time">')
                        .addClass((i >= self.workStart && i < self.workEnd) ? 'in' : '')
                        .addClass((i + 1 === self.workStart || i + 1 === self.workEnd) ? 'working-time-border' : '')
                        .append($('<div class="number">').text(number.replace(/^(\d\d?):00 ([AP]M)$/, '$1 $2')));
                })
            );

            return timeLabel;
        },

        renderTimeLabelBar: function () {
            var self = this;

            if (_.device('!large')) return;

            function drawOption() {
                // this = timezone name (string)
                var timezone = moment.tz(this);
                return [
                    $('<span class="offset">').text(timezone.format('Z')),
                    $('<span class="timezone-abbr">').text(timezone.zoneAbbr()),
                    _.escape(this)
                ];
            }

            function drawDropdown() {
                var list = _.intersection(
                        settings.get('favoriteTimezones', []),
                        settings.get('renderTimezones', [])
                    ),
                    favorites = _(settings.get('favoriteTimezones', [])).chain().map(function (fav) {
                        return [fav, list.indexOf(fav) >= 0];
                    }).object().value(),
                    TimezoneModel = Backbone.Model.extend({
                        defaults: {
                            'default': true
                        },
                        initialize: function (obj) {
                            var self = this;

                            _(obj).each(function (value, key) {
                                self[key] = value;
                            });
                        }
                    }),
                    model = new TimezoneModel(favorites),
                    dropdown = new Dropdown({
                        className: 'dropdown timezone-label-dropdown',
                        model: model,
                        label: moment().tz(coreSettings.get('timezone')).zoneAbbr(),
                        tagName: 'div'
                    })
                        .header(gt('Standard timezone'))
                        .option('default', true, drawOption.bind(coreSettings.get('timezone')));

                if (settings.get('favoriteTimezones', []).length > 0) {
                    dropdown.header(gt('Favorites'));
                }
                $('li[role="presentation"]', dropdown.$ul).first().addClass('disabled');
                $('a', dropdown.$ul).first().removeAttr('data-value').removeData('value');

                _(settings.get('favoriteTimezones', [])).each(function (fav) {
                    if (fav !== coreSettings.get('timezone')) {
                        dropdown.option(fav, true, drawOption.bind(fav));
                    }
                });
                // add keep open for all timezone options, *not* the link to settings (Bug 53471)
                $('a', dropdown.$ul).attr('data-keep-open', 'true');

                dropdown.divider();
                dropdown.link('settings', gt('Manage favorites'), function () {
                    var options = { id: 'io.ox/timezones' };
                    ox.launch('io.ox/settings/main', options).done(function () {
                        this.setSettingsPane(options);
                    });
                });

                $('.dropdown', self.timeLabelBar).remove();
                self.timeLabelBar.append(dropdown.render().$el);
                $('.dropdown-label', dropdown.$el).append($('<i class="fa fa-caret-down" aria-hidden="true">'));

                model.on('change', function (model) {
                    var list = [];

                    _(model.attributes).each(function (value, key) {
                        if (value && key !== 'default') {
                            list.push(key);
                        }
                    });

                    settings.set('renderTimezones', list);
                    settings.save();
                });
            }

            function drawTimezoneLabels() {

                var list = getTimezoneLabels();

                $('.timezone', self.timeLabelBar).remove();

                self.timeLabelBar.prepend(
                    _(list).map(function (tz) {
                        return $('<div class="timezone">').text(moment().tz(tz).zoneAbbr());
                    })
                );

                if (list.length > 0) {
                    self.timeLabelBar.css('width', ((list.length + 1) * 80) + 'px');
                    self.fulltimeCon.css('margin-left', ((list.length + 1) * 80) + 'px');
                    self.dayLabel.css('left', ((list.length + 1) * 80) + 'px');
                    self.moreAppointmentsIndicators.css('left', ((list.length + 1) * 80) + 'px');
                } else {
                    self.timeLabelBar.css('width', '');
                    self.fulltimeCon.css('margin-left', '');
                    self.dayLabel.css('left', '');
                }
            }

            var update = _.throttle(function () {
                drawTimezoneLabels();
            }, 100, { trailing: false });

            var updateAndDrawDropdown = _.throttle(function () {
                drawDropdown();
                drawTimezoneLabels();
            }, 100, { trailing: false });

            settings.on('change:renderTimezones', update);
            settings.on('change:favoriteTimezones', updateAndDrawDropdown);

            this.timeLabelBar = this.weekViewCon.find('.time-label-bar');
            if (this.timeLabelBar.length === 0) this.timeLabelBar = $('<div class="time-label-bar">');
            drawDropdown();
            drawTimezoneLabels();
        },

        /**
         * render the week view
         * @return { Backbone.View } this view
         */
        render: function () {

            // create timelabels
            var primaryTimeLabel = this.renderTimeLabel(coreSettings.get('timezone')),
                self = this;

            this.renderTimeLabelBar();

            /**
             * change the timeline css top value to the current time position
             * @param  { Object } tl Timeline as jQuery object
             */
            var renderTimeline = function () {
                var d = moment();
                self.timeline.css({ top: ((d.hours() / 24 + d.minutes() / 1440) * 100) + '%' });
                // check, if the day changed
                var now = _.now(),
                    lastRendered = parseInt(self.timeline.attr('data-last') || now, 10);
                self.timeline.attr('data-last', now);
                if (moment(lastRendered).startOf('day').valueOf() !== moment(now).startOf('day').valueOf()) self.rerender();
            };
            // create and animate timeline
            renderTimeline();
            if (this.intervalId) clearInterval(this.intervalId);
            this.intervalId = setInterval(renderTimeline, 60000);

            this.fulltimePane.css({ height: (this.options.showFulltime ? 21 : 1) + 'px' });

            // visual indicators for hidden appointmeints
            this.moreAppointmentsIndicators.css({
                top: (this.options.showFulltime ? 21 : 1) + 'px'
            });

            // create days
            var columns = this.isMergeView ? this.app.folders.list() : _.range(this.columns);
            columns.forEach(function (c, index) {
                var day = $('<div>')
                    .addClass('day')
                    .attr('date', self.isMergeView ? 0 : index)
                    .width(100 / columns.length + '%');

                if (_(c).isString()) day.attr('data-folder-cid', c);

                // add days to fulltime panel
                self.fulltimePane
                    .append(day.clone());

                self.weekCon.append(day);
            });

            this.renderTimeslots();

            var nextStr = this.columns === 1 ? gt('Next Day') : gt('Next Week'),
                prevStr = this.columns === 1 ? gt('Previous Day') : gt('Previous Week');

            // create toolbar, view space and dayLabel
            this.$el.empty().append(
                $('<div class="toolbar">').append(
                    $('<div class="controls-container">').append(
                        $('<a href="#" role="button" class="control prev">').attr({
                            title: prevStr, // TODO: Aria title vs. aria-label
                            'aria-label': prevStr
                        })
                        .append($('<i class="fa fa-chevron-left" aria-hidden="true">')),
                        $('<a href="#" role="button" class="control next">').attr({
                            title: nextStr, // TODO: Aria title vs. aria-label
                            'aria-label': nextStr
                        })
                        .append($('<i class="fa fa-chevron-right" aria-hidden="true">'))
                    ),
                    this.kwInfo,
                    $('<a href="#" class="merge-split">')
                        .toggleClass('hidden', this.mode !== 'day' || this.app.folders.list().length <= 1)
                        //#. Should appointments of different folders/calendars be shown in the same column (merge) or in seperate ones (split)
                        .text(settings.get('mergeview') ? gt('Merge') : gt('Split'))
                        .tooltip({
                            placement: 'bottom',
                            title: settings.get('mergeview') ? gt('Click to merge all folders into one column') : gt('Click to split all folders into separate columns')
                        })
                ),
                $('<div class="footer-container">').append(
                    this.dayLabel
                ),
                this.weekViewCon.append(
                    this.timeLabelBar,
                    this.fulltimeCon.empty().append(this.fulltimePane),
                    this.pane.empty().append(
                        primaryTimeLabel,
                        self.weekCon
                    ),
                    this.moreAppointmentsIndicators
                ).addClass('time-scale-' + this.gridSize)
            );

            var renderSecondaryTimeLabels = _.throttle(function () {
                var list = getTimezoneLabels();

                $('.secondary-timezone', self.pane).remove();
                $('.week-container-label', self.pane).before(
                    _(list).map(function (tz) {
                        return self.renderTimeLabel(tz).addClass('secondary-timezone');
                    })
                );

                self.adjustCellHeight(true);

                if (list.length > 0) {
                    self.weekCon.css('margin-left', ((list.length + 1) * 80) + 'px');
                    self.pane.addClass('secondary');
                } else {
                    self.weekCon.css('margin-left', '');
                    self.pane.removeClass('secondary');
                }
            }, 100, { trailing: false });

            if (_.device('large')) {
                renderSecondaryTimeLabels();
                settings.on('change:favoriteTimezones', renderSecondaryTimeLabels);
                settings.on('change:renderTimezones', renderSecondaryTimeLabels);
            }

            return this;
        },

        applyTimeScale: function () {
            var weekViewContainer = $('.week-view-container', this.$el);
            // remove all classes like time-scale-*
            weekViewContainer.removeClass(function (index, css) {
                return (css.match(/(^|\s)time-scale-\S+/g) || []).join(' ');
            });
            weekViewContainer.addClass('time-scale-' + this.gridSize);
        },

        renderTimeslots: function () {
            var self = this;
            this.weekCon.children('.day').each(function () {
                var day = $(this);

                day.empty();

                // create timeslots and add days to week container
                for (var i = 1; i <= self.slots * self.gridSize; i++) {
                    day.append(
                        $('<div>')
                        .addClass('timeslot')
                        .addClass((i <= (self.workStart * self.gridSize) || i > (self.workEnd * self.gridSize)) ? 'out' : '')
                        .addClass((i === (self.workStart * self.gridSize) || i === (self.workEnd * self.gridSize)) ? 'working-time-border' : '')
                    );
                }
            });
        },

        rerenderWorktime: function () {
            this.weekCon.find('.day').each(function () {
                $(this).find('.timeslot').each(function (i, el) {
                    i++;
                    $(el).addClass('timeslot');
                });
            });
            return this;
        },

        /**
         * move the calendar window scrolling position, so that the working hours are centered
         */
        setScrollPos: function () {
            this.adjustCellHeight();
            var slotHeight = this.cellHeight * this.gridSize,
                // see bug 40297
                timelineTop = parseFloat(this.timeline[0].style.top) * slotHeight * 0.24;

            // adjust scoll position to center current time
            this.pane.scrollTop(timelineTop - this.pane.height() / 2);
            return this;
        },

        /**
         * adjust cell height to fit into scrollpane
         * @return { View } thie view
         */
        adjustCellHeight: function (redraw) {

            var cells = Math.min(Math.max(4, (this.workEnd - this.workStart + 1)), 18);
            this.paneHeight = this.pane.height() || this.paneHeight;
            this.cellHeight = Math.floor(
                Math.max(this.paneHeight / (cells * this.gridSize), this.minCellHeight)
            );

            // app window is not visible we need to postpone height calculation to avoid side effects (happens when scheduling view is restored)
            if (!this.pane.is(':visible') && !this.app.getWindow().state.visible) {
                this.app.getWindow().one('show', _(this.adjustCellHeight).bind(this));
                return;
            }

            // only update if height differs from CSS default
            if (this.cellHeight !== this.minCellHeight) {
                var timeslots = $('.timeslot', this.pane),
                    timeLabel = $('.time', this.pane);
                timeslots.height(this.cellHeight - 1);
                // compute the label height according to the actual height of the timeslot
                // this can be different to 1 when dealing with scaled screen resolutions (see Bug 50195)
                var timeslotHeight = timeslots.get(0).getBoundingClientRect().height,
                    borderWidth = parseFloat(timeLabel.css('border-bottom-width'), 10);
                timeLabel.height(timeslotHeight * this.gridSize - borderWidth);
                // get actual cellHeight from timeslot. This can be different to the computed size due to scaling inside the browser (see Bug 50976)
                // it is important to use getBoundingClientRect as this contains the decimal places of the actual height ($.fn.height does not)
                this.cellHeight = timeslots.get(0).getBoundingClientRect().height;
                // if the cell height changes we also need to redraw all appointments
                if (redraw) this.renderAppointments();
            }
            return this;
        },

        /**
         * render dayLabel with current date information
         * show and hide timeline
         */
        renderDayLabel: function () {
            var self = this,
                days = [],
                today = moment().startOf('day'),
                tmpDate = moment(this.startDate),
                columns = this.isMergeView ? this.app.folders.list() : _.range(this.columns);
            // something new?
            if (this.mode !== 'day' && this.startDate.valueOf() === this.startLabelRef && today.valueOf() === this.dayLabelRef && this.columnsRef === this.columns) {
                if (this.options.todayClass && this.columns > 1) {
                    var weekViewContainer = $('.week-view-container', this.$el);
                    weekViewContainer.find('.' + this.options.todayClass, this.$el).removeClass(this.options.todayClass);
                    weekViewContainer.find('.day[date="' + today.diff(this.startDate, 'day') + '"]', this.$el).addClass(this.options.todayClass);
                }
                return;
            }

            if (this.options.todayClass) {
                $('.week-view-container .day.' + this.options.todayClass, this.$el).removeClass(this.options.todayClass);
            }

            this.dayLabelRef = today.valueOf();
            this.startLabelRef = this.startDate.valueOf();
            this.columnsRef = this.columns;

            // refresh dayLabel, timeline and today-label
            this.timeline.hide();

            columns.forEach(function (c, index) {
                var day = $('<a href="#" class="weekday" role="button">')
                    .attr({
                        date: self.isMergeView ? 0 : index,
                        title: gt('Create all-day appointment')
                    })
                    .append(
                        $.txt(tmpDate.format('ddd ')),
                        $('<span class="number">').text(tmpDate.format('D'))
                    )
                    .width(100 / columns.length + '%');

                if (_(c).isString()) {
                    day
                        .addClass('merge-view-label')
                        .attr({
                            'data-folder-cid': c, // need this when inserting events in this column
                            'data-folder': c // this is used when folder color changes
                        })
                        .css('width', 'calc(' + day.css('width') + ' - 2px)');
                    folderAPI.get(c).done(function (folder) {
                        day
                            .css({
                                'border-color': util.getFolderColor(folder)
                            })
                            .text(folder.display_title || folder.title);
                    });
                }

                // mark today
                if (util.isToday(tmpDate)) {
                    var todayContainer;
                    if (self.isMergeView) {
                        todayContainer = $('.week-container .day', self.pane).first();
                        self.timeline.css('width', (columns.length * 105) + '%');
                    } else {
                        todayContainer = $('.week-container .day[date="' + index + '"]', self.pane);
                        if (self.columns > 1) todayContainer.addClass(self.options.todayClass);
                        day
                            .prepend($('<span class="sr-only">').text(gt('Today')))
                            .addClass(self.options.todayClass);
                    }
                    todayContainer.append(self.timeline);
                    self.timeline.show();
                }
                days.push(day);
                if (!self.isMergeView) tmpDate.add(1, 'day');
            });

            this.dayLabel.empty().append(days);

            this.kwInfo.empty().append(
                $('<span>').text(
                    this.columns > 1
                        ? this.startDate.format('MMMM YYYY')
                        : this.startDate.format('ddd, l')
                ),
                $.txt(' '),
                $('<span class="cw">').text(
                    //#. %1$d = Calendar week
                    gt('CW %1$d', moment(this.startDate).format('w'))
                ),
                $('<i class="fa fa-caret-down fa-fw" aria-hidden="true">')
            );

            if (_.device('smartphone')) {
                // pass some dates around
                this.navbarDates = {
                    cw: gt('CW %1$d', this.startDate.format('w')),
                    date: this.columns > 1
                        ? this.startDate.formatInterval(moment(this.startDate).add(this.columns - 1, 'days'))
                        : this.startDate.format('ddd, l')
                };
                // bubbling event to get it in page controller
                this.trigger('change:navbar:date', this.navbarDates);
            }
        },

        /**
         * clear all appointments from current week and render all appointments from collection
         */
        renderAppointments: function () {

            this.showDeclined = settings.get('showDeclinedAppointments', false);

            var self = this,
                draw = {},
                appointmentStartDate,
                numColumns = this.isMergeView ? this.app.folders.list().length : this.columns,
                fulltimeTable = _.range(numColumns).map(function () { return []; }),
                maxRow = 0;

            /*
             * Simple algorithm to find free space for appointment. Works as follows:
             * 1) Has a table with slots which are empty by default
             * 2) Requests a certain column and width
             * 3) Search for first row, where all these fields are empty
             * 4) Mark these cells in the table as reserved
             * 5) Calculate maximum number of rows as a side-effect
             */
            function reserveRow(table, start, width) {
                var row, column, empty;
                start = Math.max(0, start);
                width = Math.min(table.length, start + width) - start;
                // check for free space
                for (row = 0; row <= maxRow && !empty; row++) {
                    empty = true;
                    for (column = start; column < start + width; column++) {
                        if (table[column][row]) {
                            empty = false;
                            break;
                        }
                    }
                }
                // reserve free space
                for (column = start; column < start + width; column++) table[column][row - 1] = true;
                maxRow = Math.max(row, maxRow);
                return row - 1;
            }

            // clear all first
            $('.appointment', this.$el).remove();

            this.renderDayLabel();

            // loop over all appointments to split and create divs
            this.collection.each(function (model) {

                appointmentStartDate = model.getMoment('startDate');

                // is declined?
                if (util.getConfirmationStatus(model) !== 'DECLINED' || this.showDeclined) {
                    // is fulltime?
                    if (util.isAllday(model) && this.options.showFulltime) {
                        // make sure we have full days when calculating the difference or we might get wrong results
                        appointmentStartDate.startOf('day');

                        var node = this.renderAppointment(model),
                            fulltimePos = this.isMergeView ? this.app.folders.list().indexOf(model.get('folder')) : appointmentStartDate.diff(this.startDate, 'days'),
                            // calculate difference in utc, otherwhise we get wrong results if the appointment starts before a daylight saving change and ends after
                            fulltimeWidth = this.isMergeView ? 1 : Math.max(model.getMoment('endDate').diff(appointmentStartDate, 'days') + Math.min(0, fulltimePos), 1),
                            row = reserveRow(fulltimeTable, fulltimePos, fulltimeWidth);

                        node.css({
                            height: this.fulltimeHeight,
                            lineHeight: this.fulltimeHeight + 'px',
                            width: (100 / numColumns) * fulltimeWidth + '%',
                            left: (100 / numColumns) * Math.max(0, fulltimePos) + '%',
                            top: row * (this.fulltimeHeight + 1)
                        });
                        this.fulltimePane.append(node);
                    } else {
                        // fix fulltime appointments to local time when this.showFulltime === false
                        /*if (!model.get('startDate').tzid) {
                            model.set({ startDate: moment.utc(model.get('startDate')).local(true).valueOf() }, { silent: true });
                            model.set({ endDate: moment.utc(model.get('endDate')).local(true).valueOf() }, { silent: true });
                        }*/

                        var startLocal = moment(Math.max(appointmentStartDate.valueOf(), this.startDate.valueOf())),
                            endLocal = model.getMoment('endDate').local(),
                            start = moment(startLocal).startOf('day').valueOf(),
                            end = moment(endLocal).startOf('day').valueOf(),
                            maxCount = 0,
                            style = '';

                        // draw across multiple days
                        while (maxCount <= this.columns) {
                            var app = this.renderAppointment(model),
                                sel = this.isMergeView ? '[data-folder-cid="' + model.get('folder') + '"]' : '[date="' + startLocal.diff(this.startDate, 'day') + '"]';
                            maxCount++;

                            if (start !== end) {
                                endLocal = moment(startLocal).endOf('day');
                                if (model.get('endDate').valueOf() - endLocal.valueOf() > 1) {
                                    style += 'rmsouth';
                                }
                            } else {
                                endLocal = model.getMoment('endDate').local();
                            }

                            // kill overlap appointments with length null
                            if (startLocal.valueOf() === endLocal.valueOf() && maxCount > 1) {
                                break;
                            }

                            app.addClass(style).pos = {
                                id: model.id,
                                start: startLocal.valueOf(),
                                end: endLocal.valueOf()
                            };
                            if (!draw[sel]) {
                                draw[sel] = [];
                            }
                            draw[sel].push(app);
                            style = '';
                            // inc date
                            if (start !== end) {
                                start = startLocal.add(1, 'day').startOf('day').valueOf();
                                style = 'rmnorth ';
                            } else {
                                break;
                            }
                        }
                    }
                }
            }, this);

            // calculate full-time appointment container height
            var ftHeight = 1;
            if (this.options.showFulltime) {
                ftHeight = (maxRow <= this.fulltimeMax ? maxRow : (this.fulltimeMax + 0.5)) * (this.fulltimeHeight + 1);
                this.fulltimePane.css({ height: maxRow * (this.fulltimeHeight + 1) + 'px' });
                this.fulltimeCon.resizable({
                    handles: 's',
                    minHeight: this.fulltimeHeight,
                    maxHeight: maxRow * (this.fulltimeHeight + 1),
                    resize: function () {
                        self.pane.css({ top: self.fulltimeCon.outerHeight() });
                    }
                });
            }
            this.fulltimeCon.css({ height: ftHeight + 'px' });
            this.pane.css({ top: (ftHeight + (_.device('smartphone') ? 0 : 16)) + 'px' });
            this.moreAppointmentsIndicators.css({ top: (ftHeight + (_.device('smartphone') ? 0 : 16)) + 'px' });
            if (this.timeLabelBar) this.timeLabelBar.css({ top: (ftHeight - 22) + 'px' });

            // fix for hidden scrollbars on small DIVs (esp. Firefox Win)
            var fullConWitdth = this.fulltimeCon[0].clientWidth + this.fulltimeCon[0].offsetLeft;
            if (fullConWitdth !== this.pane[0].clientWidth) {
                this.fulltimePane.css({ marginRight: fullConWitdth - this.pane[0].clientWidth + 'px' });
            } else {
                this.fulltimePane.css({ marginRight: 0 });
            }

            // loop over all single days
            $.each(draw, function (day, apps) {

                // sort appointments by start time
                apps = _.sortBy(apps, function (app) {
                    return app.pos.start;
                });

                // init position Array
                var positions = [0];
                // loop over all appointments per day to calculate position
                for (var i = 0; i < apps.length; i++) {
                    var app = apps[i],
                        collisions = 0, p;
                    // loop over all column positions
                    for (p = 0; p < positions.length; p++) {
                        // workaround for appointments with length 0
                        if (app.pos.start === app.pos.end) {
                            app.pos.end++;
                        }
                        if (positions[p] <= app.pos.start) {
                            positions[p] = app.pos.end;
                            app.pos.index = p;
                            break;
                        }
                    }

                    if (p === positions.length) {
                        app.pos.index = positions.length;
                        positions.push(app.pos.end);
                    }

                    // cals amount of collisions
                    for (var k = 0; k < apps.length; k++) {
                        if (i === k) continue;
                        var as = app.pos.start,
                            ae = app.pos.end,
                            ms = apps[k].pos.start,
                            me = apps[k].pos.end;
                        if ((as >= ms && as < me) || (as <= ms && ae >= me) || (ae > ms && ae <= me)) {
                            collisions++;
                        }
                    }
                    app.pos.max = ++collisions;
                }

                // loop over all appointments to draw them
                for (var j = 0; j < apps.length; j++) {
                    var node = apps[j],
                        pos = self.calcPos(node.pos),
                        idx = Math.min(node.pos.max, positions.length),
                        width = Math.min((self.appWidth / idx) * (1 + (self.overlap * (idx - 1))), self.appWidth),
                        left = idx > 1 ? ((self.appWidth - width) / (idx - 1)) * node.pos.index : 0,
                        border = (left > 0 || (left === 0 && width < self.appWidth)),
                        height = Math.max(pos.height, self.minCellHeight - 1) - (border ? 1 : 0);

                    node.css({
                        top: pos.top,
                        left: 'calc(' + left + '% - 1px)',
                        height: height + 'px',
                        lineHeight: self.minCellHeight + 'px',
                        width: 'calc(' + width + '% - 10px)',
                        minHeight: (self.minCellHeight - (border ? 2 : 1)) + 'px',
                        maxWidth: self.appWidth + '%'
                        // zIndex: j
                    })
                    .addClass(border ? 'border' : '')
                    .addClass(height < 2 * (self.minCellHeight - (border ? 2 : 1)) ? 'no-wrap' : '');
                }
                self.$('.week-container ' + day, self.$el).append(apps);
            });

            $('.week-container .day', this.$el).droppable();

            ext.point('io.ox/calendar/week/view').invoke('draw', this, {
                folders: this.getFolders()
            });

            this.updateHiddenIndicators();
            $('.appointment').trigger('calendar:weekview:rendered');

            // global event for tracking purposes
            ox.trigger('calendar:items:render', this);
        },

        /**
         * render an single appointment
         * @param  { Backbone.Model }   a Appointment Model
         * @return { Object }           a jQuery object of the appointment
         */
        renderAppointment: function (a) {
            var el = $('<div class="appointment">')
                .attr({
                    'data-cid': a.cid,
                    'data-master-id': util.cid({ id: a.get('id'), folder: a.get('folder') }),
                    'data-extension-point': this.extPoint,
                    'data-composite-id': a.cid
                });

            ext.point(this.extPoint)
                .invoke('draw', el, ext.Baton(_.extend({}, this.options, { model: a, folders: this.getFolders() })));
            return el;
        },

        /**
         * redraw a rendered appointment
         * @param  { Backbone.Model } a Appointment Model
         */
        redrawAppointment: function (a) {
            var positionFieldChanged = _(['startDate', 'endDate', 'allDay'])
                .any(function (attr) { return !_.isUndefined(a.changed[attr]); });
            if (positionFieldChanged) {
                this.renderAppointments();
            } else {
                var el = $('[data-cid="' + a.id + '"]', this.$el),
                    newAppointment = this.renderAppointment(a),
                    color = newAppointment.css('color'),
                    backgroundColor = newAppointment.data('background-color') || '';
                el
                    .attr({ class: newAppointment.attr('class') })
                    .css({ color: color, 'background-color': backgroundColor })
                    .data('background-color', backgroundColor)
                    .empty()
                    .append(newAppointment.children());
                $('.appointment').trigger('calendar:weekview:rendered');
            }
        },

        /**
         * round an integer to the next grid size
         * @param  { number } pos position as integer
         * @param  { String } typ specifies the used rounding algorithm {n=floor, s=ceil, else round }
         * @return { number }     rounded value
         */
        roundToGrid: function (pos, typ) {
            var h = this.cellHeight;
            switch (typ) {
                case 'n':
                    typ = 'floor';
                    break;
                case 's':
                    typ = 'ceil';
                    break;
                default:
                    typ = 'round';
                    break;
            }
            return Math[typ](pos / h) * h;
        },

        /**
         * calculate css position paramter (top and left) of an appointment
         * @param  { Object } ap meta object of the appointment
         * @return { Object }    object containin top and height values
         */
        calcPos: function (ap) {
            var start = moment(ap.start),
                end = moment(ap.end),
                self = this,
                calc = function (d) {
                    return (d.hours() / 24 + d.minutes() / 1440) * self.height();
                },
                s = calc(start),
                e = calc(end);
            return {
                top: s,
                height: Math.max(Math.floor(e - s), self.minCellHeight) - 1
            };
        },

        /**
         * get moment object from date marker
         * @param  { number } tag value of the day [0 - 6] for week view
         * @return { moment } moment object
         */
        getTimeFromDateTag: function (tag) {
            return moment(this.startDate).add(tag, 'days');
        },

        /**
         * calc daily timestamp from mouse position
         * @param  { number } pos       mouse x position
         * @param  { String } roundType specifies the used rounding algorithm {n=floor, s=ceil, else round }
         * @return { number }           closest grid position
         */
        getTimeFromPos: function (pos, roundType) {
            // multiplay with day milliseconds
            return this.roundToGrid(pos, roundType || '') / this.height() * 864e5;
        },

        /**
         * calculate complete height of the grid
         * @return { number } height of the grid
         */
        height: function () {
            return this.cellHeight * this.slots * this.gridSize;
        },

        /**
         * get or set current folder data
         * @param  { Object } data folder data
         * @return { Object } if (data === undefined) current folder data
         *                    else object containing start and end timestamp of the current week
         */
        folder: function (data) {
            if (data) {
                // set view data
                this.folderData = data;
            }
            return this.folderData;
        },

        setFolders: function (folders) {
            this.folders = folders;
        },

        getFolders: function () {
            return this.folders;
        },

        /**
         * collect request parameter to realize monthly chunks
         * @return { Object } object with startdate, enddate and folderID
         */
        getRequestParam: function () {
            var params = {
                start: this.startDate.valueOf(),
                end: moment(this.startDate).add(this.columns, 'days').valueOf(),
                view: 'week',
                folders: _(this.getFolders()).pluck('id')
            };
            return params;
        },

        /**
         * save current scrollposition for the view instance
         */
        save: function () {
            // save scrollposition
            this.restoreCache = this.pane.scrollTop();
        },

        /**
         * restore scrollposition for the view instance
         */
        restore: function () {
            // restore scrollposition
            if (this.restoreCache) {
                this.pane.scrollTop(this.restoreCache);
            }
        },

        print: function () {
            print.request('io.ox/calendar/week/print', {
                start: moment(this.startDate).valueOf(),
                end: moment(this.startDate).add(this.columns, 'days').valueOf(),
                folders: this.folders,
                title: _(this.folders).keys().length === 1 ? this.folders[_(this.folders).keys()[0]].display_title || this.folders[_(this.folders).keys()[0]].title : gt('Appointments')
            });
        }
    });

    return View;
});
