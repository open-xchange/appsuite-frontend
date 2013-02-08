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

define('io.ox/calendar/week/view',
    ['io.ox/calendar/util',
     'io.ox/core/date',
     'io.ox/core/extensions',
     'gettext!io.ox/calendar',
     'io.ox/core/api/folder',
     'settings!io.ox/calendar',
     'less!io.ox/calendar/week/style.css',
     'apps/io.ox/core/tk/jquery-ui.min.js'], function (util, date, ext, gt, folderAPI, settings) {

    'use strict';

    var myself = null;

    var View = Backbone.View.extend({

        className:      'week',

        columns:        7,      // default value for day columns
        fragmentation:  2,      // fragmentation of a hour
        gridSize:       2,      // grid fragmentation of a hour
        cellHeight:     24,     // height of one single fragment in px
        fulltimeHeight: 20,     // height of full-time appointments in px
        fulltimeMax:    5,      // threshold for visible full-time appointments in header
        appWidth:       98,     // max width of an appointment in %
        overlap:        0.35,   // visual overlap of appointments [0.0 - 1.0]
        slots:          24,     // amount of shown time-slots
        workStart:      8,      // full hour for start position of working time marker
        workEnd:        18,     // full hour for end position of working time marker
        mode:           0,      // view mode {1: day, 2: workweek, 3: week}
        workWeekStart:  1,      // workweek start (0=Sunday, 1=Monday, ..., 6=Saturday)
        showDeclined:   false,  // show declined appointments

        startDate:      null,   // start of day/week as local date (use as reference point)
        clickTimer:     null,   // timer to separate single and double click
        clicks:         0,      // click counter
        lasso:          false,  // lasso object
        folderData:     {},     // current folder object
        restoreCache:   {},     // object, which contains data for save and restore functions

        pane:           $('<div>').addClass('scrollpane'),          // main scroll pane
        fulltimePane:   $('<div>').addClass('fulltime'),            // full-time appointments pane
        fulltimeCon:    $('<div>').addClass('fulltime-container'),  // full-time container
        fulltimeNote:   $('<div>').addClass('note'),                // note in full-time appointment area
        timeline:       $('<div>').addClass('timeline'),            // timeline
        footer:         $('<div>').addClass('footer'),              // footer
        kwInfo:         $('<span>').addClass('info'),               // current KW
        showAllCheck:   $('<input/>').attr('type', 'checkbox'),     // show all folders check-box
        showAllCon:     $('<div>').addClass('showall'),             // container

        // init values from prespective
        initialize: function (opt) {
            myself = myself || ox.user_id;
            this.mode = opt.mode;
            this.setStartDate();
            this.collection
                .on('reset', this.renderAppointments, this)
                .on('change', this.redrawAppointment, this);
            this.bindKeys();
            this.initSettings();
        },

        /**
         * set week reference start date
         * @param {string|number} opt
         *        number: Timestamp of a date in the reference week. Now if empty
         *        string: {'next', 'prev'} set next or previous week
         */
        setStartDate: function (opt) {
            if (opt && typeof opt === 'string') {
                switch (opt) {
                case 'next':
                    this.startDate.add(this.columns === 1 ? date.DAY : date.WEEK);
                    break;
                case 'prev':
                    this.startDate.add((this.columns === 1 ? date.DAY : date.WEEK) * -1);
                    break;
                default:
                    break;
                }
            } else {
                // today button
                var jumptTo = (opt && typeof opt === 'number') ? new date.Local(opt) : new date.Local();
                switch (this.mode) {
                case 1: // day
                    this.columns = 1;
                    this.startDate = jumptTo.setHours(0, 0, 0, 0);
                    break;
                case 2: // workweek
                    this.columns = 5;
                    var weekStart = date.Local.utc((jumptTo.getDays() - jumptTo.getDay() + this.workWeekStart) * date.DAY);
                    this.startDate = new date.Local(weekStart);
                    break;
                default:
                case 3: // week
                    this.columns = 7;
                    this.startDate = jumptTo.setStartOfWeek();
                    break;
                }
            }
        },

        /**
         * setup setting params
         */
        initSettings: function () {
            // init settings
            this.gridSize = 60 / settings.get('interval', this.gridSize);
            this.workStart = settings.get('startTime', this.workStart);
            this.workEnd = settings.get('endTime', this.workEnd);
        },

        // define view events
        events: {
            'mouseenter .appointment': 'onHover',
            'mouseleave .appointment': 'onHover',
            'mousedown .week-container>.day' : 'onLasso',
            'mousemove .week-container>.day' : 'onLasso',
            'mouseup' : 'onLasso',
            'click .appointment': 'onClickAppointment',
            'dblclick .week-container>.day,.fulltime>.day' : 'onCreateAppointment',
            'swipeleft .timeslot' : 'onControlView',
            'swiperight .timeslot' : 'onControlView',
            'tap .control.next,.control.prev,.control.today': 'onControlView',
            'change .toolbar .showall input[type="checkbox"]' : 'onControlView'
        },

        /**
         * handler for hover effect
         * @param  {MouseEvent} e Hover event (mouseenter, mouseleave)
         */
        onHover: function (e) {
            if (!this.lasso) {
                var cid = _.cid($(e.currentTarget).data('cid') + ''),
                    el = $('[data-cid^="' + cid.folder_id + '.' + cid.id + '"]', this.$el);
                switch (e.type) {
                case 'mouseenter':
                    el.addClass('hover');
                    break;
                case 'mouseleave':
                    el.removeClass('hover');
                    break;
                default:
                    break;
                }
            }
        },

        /**
         * handler for clickevents in toolbar
         * @param  {MouseEvent} e Clickevent
         */
        onControlView: function (e) {
            e.preventDefault();
            var cT = $(e.currentTarget),
                t = $(e.target);
            if (cT.hasClass('next') || (t.hasClass('timeslot') && e.type === 'swipeleft' && !this.lasso)) {
                this.setStartDate('next');
            }
            if (cT.hasClass('prev') || (t.hasClass('timeslot') && e.type === 'swiperight' && !this.lasso)) {
                this.setStartDate('prev');
            }
            if (cT.hasClass('today')) {
                this.setStartDate();
            }
            if (cT.attr('type') === 'checkbox') {
                settings.set('showAllPrivateAppointments', cT.prop('checked')).save();
            }
            this.trigger('onRefresh');
        },

        /**
         * handler for key events in view
         * @param  {KeyEvent} e Keyboard event
         */
        onKey: function (e) {
            e.preventDefault();
            switch (e.which) {
            case 37:
                this.setStartDate('prev');
                this.trigger('onRefresh');
                break;
            case 39:
                this.setStartDate('next');
                this.trigger('onRefresh');
                break;
            default:
                break;
            }
        },

        /**
         * unbind onKey handler on keyup event from document
         */
        unbindKeys: function () {
            $(document).off('keyup', this.onKey);
        },

        /**
         * bin onKey handler on keyup event to document
         */
        bindKeys: function () {
            $(document).on('keyup', $.proxy(this.onKey, this));
        },

        /**
         * handler for single- and double-click events on appointments
         * @param  {KeyEvent} e Keyboard event
         */
        onClickAppointment: function (e) {
            var cT = $(e.currentTarget);
            if (cT.hasClass('appointment') && !this.lasso && !cT.hasClass('private')) {
                var self = this,
                    obj = _.cid($(e.currentTarget).data('cid') + '');
                if (!cT.hasClass('current')) {
                    self.trigger('showAppointment', e, obj);
                    $('.appointment', self.$el)
                        .removeClass('current opac')
                        .not($('[data-cid^="' + obj.folder_id + '.' + obj.id + '"]', self.$el))
                        .addClass('opac');
                    $('[data-cid^="' + obj.folder_id + '.' + obj.id + '"]', self.$el).addClass('current');
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

                if (self.clickTimer !== null && self.clicks === 2 && cT.hasClass('modify')) {
                    clearTimeout(self.clickTimer);
                    self.clicks = 0;
                    self.clickTimer = null;
                    self.trigger('openEditAppointment', e, obj);
                }
            }
        },

        /**
         * handler for double-click events on grid to create new appointments
         * @param  {MouseEvent} e double click event
         */
        onCreateAppointment: function (e) {
            if (!folderAPI.can('create', this.folder())) {
                return;
            }
            if ($(e.target).hasClass('timeslot')) {
                // calculate timestamp for current position
                var pos = this.getTimeFromPos(e.target.offsetTop),
                    startTS = this.getTimeFromDateTag($(e.currentTarget).attr('date')) + pos;
                this.trigger('openCreateAppointment', e, {start_date: startTS, end_date: startTS + date.HOUR});
            }
            if ($(e.target).hasClass('day')) {
                // calculate timestamp for current position
                var startTS = date.Local.localTime(this.getTimeFromDateTag($(e.currentTarget).attr('date')));
                this.trigger('openCreateAppointment', e, {start_date: startTS, end_date: startTS + date.DAY, full_time: true});
            }
        },

        /**
         * handler for appointment updates
         * @param  {Object} obj appointment object
         */
        onUpdateAppointment: function (obj) {
            if (obj.start_date && obj.end_date && obj.start_date < obj.end_date) {
                this.trigger('updateAppointment', obj);
            }
        },

        /**
         * handler for lasso function in grid
         * @param  {MouseEvent} e mouseevents on day container
         */
        onLasso: function (e) {
            if (!folderAPI.can('create', this.folder())) {
                return;
            }

            // switch mouse events
            switch (e.type) {
            case 'mousedown':
                if (this.lasso === false && $(e.target).hasClass('timeslot')) {
                    this.lasso = true;
                }
                break;

            case 'mousemove':

                var cT = $(e.currentTarget),
                    curDay = parseInt(cT.attr('date'), 10),
                    mouseY = e.pageY - (this.pane.offset().top - this.pane.scrollTop());

                // normal move
                if (_.isObject(this.lasso) && e.which === 1) {
                    var lData = this.lasso.data(),
                        down = mouseY > lData.start,
                        right = curDay > lData.startDay,
                        dayChange = curDay !== lData.lastDay,
                        dayDiff = Math.abs(curDay - lData.startDay),
                        lassoStart = this.roundToGrid(lData.start, (down && dayDiff === 0) || right ? 'n' : 's');
                    if (dayDiff > 0) {

                        if (dayChange) {
                            // move mouse to another day area

                            // update start lasso
                            this.lasso.css({
                                height: right ? 'auto' : lassoStart,
                                top: right ? lassoStart : 0,
                                bottom: right ? 0 : 'auto'
                            });

                            // create temp. helper lasso
                            var tmpLasso = $('<div>')
                                .addClass('appointment lasso')
                                .css({
                                    height: right ? this.roundToGrid(mouseY, 's') : 'auto',
                                    minHeight: this.cellHeight,
                                    top: right ? 0 : this.roundToGrid(mouseY, 'n'),
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
                                height: right ? this.roundToGrid(mouseY, 's') : 'auto',
                                minHeight: this.cellHeight,
                                top: right ? 0 : this.roundToGrid(mouseY, 'n'),
                                bottom: right ? 'auto' : 0
                            });

                        }
                    } else {
                        var newHeight = Math.abs(lassoStart - this.roundToGrid(mouseY, down ? 's' : 'n'));
                        if (dayChange) {
                            lData.last.remove();
                            delete lData.last;
                        }
                        this.lasso.css({
                            height: newHeight,
                            top: lassoStart - (down ? 0 : newHeight)
                        });
                        lData.start = lassoStart;
                    }
                    lData.stop = this.roundToGrid(mouseY, (down && dayDiff === 0) || right ? 's' : 'n');
                    lData.lastDay = curDay;
                }

                // first move
                if (this.lasso === true && $(e.target).hasClass('timeslot')) {
                    this.lasso = $('<div>')
                        .addClass('appointment lasso')
                        .css({
                            height: this.cellHeight,
                            minHeight: this.cellHeight,
                            top: this.roundToGrid(mouseY, 'n')
                        })
                        .data({
                            start: mouseY,
                            stop: 0,
                            startDay: curDay,
                            lastDay: curDay,
                            helper: {}
                        })
                        .appendTo(cT);
                } else {
                    this.trigger('mouseup');
                }
                break;

            case 'mouseup':
                if (_.isObject(this.lasso) && e.which === 1) {
                    var lData = this.lasso.data(),
                        start = this.getTimeFromDateTag(Math.min(lData.startDay, lData.lastDay)),
                        end = this.getTimeFromDateTag(Math.max(lData.startDay, lData.lastDay));

                    if (lData.startDay === lData.lastDay) {
                        start += this.getTimeFromPos(Math.min(lData.start, lData.stop));
                        end += this.getTimeFromPos(Math.max(lData.start, lData.stop));
                    } else {
                        start += this.getTimeFromPos(lData.startDay > lData.lastDay ? lData.stop : lData.start);
                        end += this.getTimeFromPos(lData.startDay > lData.lastDay ? lData.start : lData.stop);
                    }

                    // delete div and reset object
                    $.each(lData.helper, function (i, el) {
                        el.remove();
                    });
                    lData = null;
                    this.lasso.remove();

                    this.trigger('openCreateAppointment', e, {
                        start_date: start,
                        end_date: end,
                        lasso: true
                    });
                    e.stopImmediatePropagation();
                }
                this.lasso = false;
                break;

            default:
                this.lasso = false;
                break;
            }
            return;
        },

        /**
         * render the week view
         * @return {Backbone.View} this view
         */
        render: function () {

            // create timelabels
            var timeLabel = [];
            for (var i = 1; i < this.slots; i++) {
                timeLabel.push(
                    $('<div>')
                        .addClass('time')
                        .append($('<div>').addClass('number').text(new date.Local(0, 0, 0, i, 0, 0, 0).format(date.TIME)))
                        .height(this.cellHeight * this.fragmentation)
                );
            }
            timeLabel = $('<div>').addClass('week-container-label').append(timeLabel);

            // create and animate timeline
            this.renderTimeline(this.timeline);
            setInterval(this.renderTimeline, 60000, this.timeline);
            if (!Modernizr.touch) {
                this.fulltimePane.empty().append(this.fulltimeNote.text(gt('Doubleclick here for whole day appointment')).attr('unselectable', 'on'));
            }

            // create days
            var weekCon = $('<div>').addClass('week-container').append(this.timeline);
            for (var d = 0; d < this.columns; d++) {

                var day = $('<div>')
                    .addClass('day')
                    .width(100 / this.columns + '%')
                    .attr('date', d);

                // add days to fulltime panel
                this.fulltimePane
                    .append(day.clone());

                // create timeslots and add days to week container
                for (var i = 1; i <= this.slots * this.fragmentation; i++) {
                    day.append(
                        $('<div>')
                            .addClass('timeslot ' + (i > (this.workStart * this.fragmentation) && i <= (this.workEnd * this.fragmentation) ? 'in' : 'out'))
                            .height(this.cellHeight)
                    );
                }
                weekCon.append(day);
            }

            // create toolbar, view space and footer
            this.$el.empty().append(
                $('<div>')
                    .addClass('toolbar')
                    .append(
                        this.kwInfo,
                        this.showAllCon
                            .empty()
                            .append(
                                $('<label>')
                                    .addClass('checkbox')
                                    .text(gt('show all'))
                                    .prepend(
                                        this.showAllCheck
                                            .prop('checked', settings.get('showAllPrivateAppointments', false))
                                    )
                            ),
                        $('<div>')
                            .addClass('pagination')
                            .append(
                                $('<ul>')
                                    .append(
                                        $('<li>')
                                            .append(
                                                $('<a href="#">').addClass('control prev').append($('<i>').addClass('icon-chevron-left'))
                                            ),
                                        $('<li>').append(
                                            $('<a href="#">').addClass('control today').text(gt('Today'))
                                        ),
                                        $('<li>')
                                            .append(
                                                    $('<a href="#">').addClass('control next').append($('<i>').addClass('icon-chevron-right'))
                                            )
                                    )
                            )
                    ),
                $('<div>')
                    .addClass('footer-container')
                    .append(
                        $('<div>').addClass('footer-label'),
                        this.footer
                    ),
                $('<div>')
                    .addClass('week-view-container')
                    .append(
                        this.fulltimeCon.empty().append(this.fulltimePane),
                        this.pane.empty().append(timeLabel, weekCon)
                    )
            );
            return this;
        },

        /**
         * move the calendar window scrolling position, so that the working hours are centered
         */
        setScrollPos: function () {
            var slotHeight = this.cellHeight * this.fragmentation,
                workHeight = slotHeight * (this.workEnd - this.workStart),
                newPos = (this.pane.height() - workHeight) / 2;
            // adjust scoll position
            this.pane.scrollTop((slotHeight * this.workStart) - newPos);
        },

        /**
         * change the timeline css top value to the current time position
         * @param  {Object} tl Timeline as jQuery object
         */
        renderTimeline: function (tl) {
            var d = new date.Local();
            tl.css({ top: ((d.getHours() / 24 + d.getMinutes() / 1440) * 100) + '%'});
        },

        /**
         * clear all appointments from current week and render all appointments form collection
         */
        renderAppointments: function () {
            this.showDeclined = settings.get('showDeclinedAppointments', false);

            // clear all first
            $('.appointment', this.$el).remove();
            $('.day.today', this.$el).removeClass('today');

            var self = this,
                draw = {},
                fulltimeColPos = [0],
                days = [],
                hasToday = false,
                tmpDate = new date.Local(self.startDate),
                fulltimeCount = 0;

            // refresh footer, timeline and today-label
            for (var d = 0; d < this.columns; d++) {
                days.push(
                    $('<div>')
                        .addClass('weekday')
                        .text(gt.noI18n(tmpDate.format(date.DAYOFWEEK_DATE)))
                        .width(100 / this.columns + '%')
                );
                // mark today
                if (new date.Local().setHours(0, 0, 0, 0).getTime() === tmpDate.getTime()) {
                    $('.day[date="' + d + '"]', this.pane).addClass('today');
                    hasToday = true;
                }
                tmpDate.add(date.DAY);
            }
            this.footer.empty().append(days);
            this.kwInfo.text(
                gt.noI18n(
                    self.startDate
                        .formatInterval(new date.Local(self.startDate.getTime() + ((this.columns - 1) * date.DAY)), date.DATE)
                )
            );

            if (hasToday) {
                this.timeline.show();
            } else {
                this.timeline.hide();
            }

            // loop over all appointments to split and create divs
            this.collection.each(function (model) {
                if (model.get('start_date') < 0) {
                    console.error('FIXME: start_date should not be negative');
                    throw 'FIXME: start_date should not be negative';
                }

                var hash = util.getConfirmations(model.attributes),
                    conf = hash[myself] || { status: 1, comment: "" };

                // is declined?
                if (conf.status !== 2 || this.showDeclined) {

                    if (model.get('full_time')) {
                        fulltimeCount++;
                        var app = this.renderAppointment(model),
                            fulltimePos = (model.get('start_date') - this.startDate.getDays() * date.DAY) / date.DAY,
                            fulltimeWidth = (model.get('end_date') - model.get('start_date')) / date.DAY + Math.min(0, fulltimePos);
                        // loop over all column positions
                        for (var row = 0; row < fulltimeColPos.length; row++) {
                            if  (fulltimeColPos[row] <= model.get('start_date')) {
                                fulltimeColPos[row] = model.get('end_date');
                                break;
                            }
                        }

                        if (row === fulltimeColPos.length) {
                            fulltimeColPos.push(model.get('end_date'));
                        }
                        app.css({
                            height: this.fulltimeHeight,
                            width: (100 / this.columns) * fulltimeWidth + '%',
                            left: (100 / this.columns) * Math.max(0, fulltimePos) + '%',
                            top: row * (this.fulltimeHeight + 1) + 1
                        });
                        this.fulltimePane.append(app);
                    } else {
                        var startLocal = new date.Local(Math.max(model.get('start_date'), this.startDate)),
                            endLocal = new date.Local(model.get('end_date')),
                            start = new date.Local(startLocal.getYear(), startLocal.getMonth(), startLocal.getDate()).getTime(),
                            end = new date.Local(endLocal.getYear(), endLocal.getMonth(), endLocal.getDate()).getTime(),
                            maxCount = 0,
                            style = '';

                        // draw across multiple days
                        while (true && maxCount <= this.columns) {
                            var app = this.renderAppointment(model),
                                sel = '[date="' + Math.floor((startLocal.getTime() - this.startDate.getTime()) / date.DAY) + '"]';
                            maxCount++;

                            if (start !== end) {
                                endLocal = new date.Local(startLocal.getTime());
                                endLocal.setHours(23, 59, 59, 999);
                                if (model.get('end_date') - endLocal.getTime() > 1) {
                                    style += 'rmsouth';
                                }
                            } else {
                                endLocal = new date.Local(model.get('end_date'));
                            }

                            // kill overlap appointments with length null
                            if (startLocal.getTime() === endLocal.getTime() && maxCount > 1) {
                                break;
                            }

                            app.addClass(style).pos = {
                                    id: model.id,
                                    start: startLocal.getTime(),
                                    end: endLocal.getTime()
                                };
                            if (!draw[sel]) {
                                draw[sel] = [];
                            }
                            draw[sel].push(app);

                            style = '';
                            // inc date
                            if (start !== end) {
                                startLocal.setDate(startLocal.getDate() + 1);
                                startLocal.setHours(0, 0, 0, 0);
                                start = new date.Local(startLocal.getYear(), startLocal.getMonth(), startLocal.getDate()).getTime();
                                style = 'rmnorth ';
                            } else {
                                break;
                            }
                        }
                    }
                }
            }, this);

            // calculate full-time appointment container height
            var ftHeight = (fulltimeColPos.length <= this.fulltimeMax ? fulltimeColPos.length : (this.fulltimeMax + 0.5)) * (this.fulltimeHeight + 1) + 1;
            this.fulltimePane.css({ height: fulltimeColPos.length * (this.fulltimeHeight + 1) + 'px'});
            this.fulltimeCon.css({ height: ftHeight + 'px' });
            this.pane.css({ top: ftHeight + 'px' });

            // control note in full-time appointment area
            this.fulltimeNote[fulltimeCount === 0 ? 'show' : 'hide']();

            // fix for hidden scrollbars on small DIVs (esp. Firefox Win)
            if (this.fulltimeCon[0].clientWidth !== this.pane[0].clientWidth) {
                this.fulltimePane.css({ right: this.fulltimeCon[0].clientWidth - this.pane[0].clientWidth + 'px' });
            } else {
                this.fulltimePane.css({ right: '0px' });
            }

            // loop over all single days
            $.each(draw, function (day, apps) {
                // init position Array
                var positions = [0];
                // loop over all apps per day to calculate position
                for (var i = 0; i < apps.length; i++) {
                    var app = apps[i],
                        collisions = 0;
                    // loop over all column positions
                    for (var p = 0; p < positions.length; p++) {
                        // workaround for appointments with length 0
                        if (app.pos.start === app.pos.end) {
                            app.pos.end++;
                        }
                        if  (positions[p] <= app.pos.start) {
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
                    var app = apps[j],
                        pos = self.calcPos(app),
                        idx = Math.min(app.pos.max, positions.length),
                        width = Math.min((self.appWidth / idx) * (1 + (self.overlap * (idx - 1))), self.appWidth),
                        left = idx > 1 ? ((self.appWidth - width) / (idx - 1)) * app.pos.index : 0,
                        border = (left > 0 || (left === 0 && width < self.appWidth));

                    app.css({
                        top: pos.top,
                        left: left + '%',
                        height: Math.max(pos.height, self.cellHeight) - (border ? 0 : 1),
                        lineHeight: self.cellHeight + 'px',
                        width: width + '%',
                        minHeight: self.cellHeight + 'px',
                        maxWidth: self.appWidth + '%',
                        zIndex: j
                    })
                    .addClass(border ? 'border' : '');
                }
                self.$('.week-container ' + day).append(apps);
            });

            // init drag and resize widget on appointments
            var colWidth = $('.day:first', this.$el).outerWidth(),
                paneOffset = self.pane.children().first().width() + this.$el.offset().left,
                paneHeight = self.height();

            $('.week-container .day>.appointment.modify', this.$el)
                .resizable({
                    handles: "n, s",
                    grid: [0, self.gridHeight()],
                    minHeight: self.gridHeight(),
                    containment: "parent",
                    start: function (e, ui) {
                        var d = $(this).data('resizable');
                        // init custom resize object
                        d.my = {};
                        // set current day
                        $.extend(d.my, {
                            curHelper: $(this),
                            all: $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el),
                            day: Math.floor((e.pageX - paneOffset) / colWidth),
                            handle: ''
                        });
                        d.my.firstPos = parseInt(d.my.all.first().closest('.day').attr('date'), 10);
                        d.my.lastPos = parseInt(d.my.all.last().closest('.day').attr('date'), 10);
                        d.my.lastHeight = d.my.all.last().height();
                        d.my.startPos = d.my.day;
                    },
                    resize:  function (e, ui) {
                        var el = $(this),
                            d = el.data('resizable'),
                            day = Math.floor((e.pageX - paneOffset) / colWidth),
                            mouseY = e.pageY - (self.pane.offset().top - self.pane.scrollTop());
                        // detect direction
                        if (ui.position.top !== ui.originalPosition.top) {
                            d.my.handle = 'n';
                        } else if (ui.size.height !== ui.originalSize.height) {
                            d.my.handle = 's';
                        }

                        // add new style
                        d.my.all
                            .addClass('opac')
                            .css({
                                left : 0,
                                width: '100%',
                                maxWidth: '100%',
                                zIndex: 999
                            });

                        // resize actions
                        if (day >= d.my.firstPos && d.my.handle === 's') {
                            // right side
                            mouseY = self.roundToGrid(mouseY, 's');
                            // default move
                            if (day !== d.my.startPos) {
                                ui.position.top = ui.originalPosition.top;
                                ui.size.height = paneHeight - ui.position.top;
                            } else {
                                d.my.bottom = ui.size.height + ui.position.top;
                            }
                            if (d.my.day === day && day !== d.my.startPos) {
                                d.my.curHelper.height(function (i, h) {
                                    return mouseY - $(this).position().top;
                                });
                                d.my.bottom = mouseY;
                            } else if (day < d.my.day) {
                                // move left
                                if (day >= d.my.lastPos) {
                                    d.my.all.filter(':visible').last().remove();
                                } else {
                                    d.my.all.filter(':visible').last().hide();
                                }
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                                d.my.curHelper = d.my.all.filter(':visible').last();
                                d.my.curHelper.css({
                                    minHeight: 0,
                                    maxHeight: paneHeight
                                });
                            } else if (day > d.my.day) {
                                // move right
                                if (day > d.my.lastPos) {
                                    // set new helper
                                    $('.week-container .day[date="' + day + '"]')
                                        .append(d.my.curHelper = el.clone());
                                    d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                                } else {
                                    d.my.curHelper = d.my.all.filter(':hidden').first();
                                }
                                if (day > d.my.firstPos) {
                                    d.my.all.filter(':visible').slice(0, -1).css({
                                        height: 'auto',
                                        bottom: 0
                                    });
                                    d.my.curHelper.show().css({
                                        top: 0,
                                        height: mouseY,
                                        minHeight: 0
                                    });
                                }
                            }
                        } else if (day <= d.my.lastPos && d.my.handle === 'n') {
                            // left side
                            mouseY = self.roundToGrid(mouseY, 'n');
                            if (day !== d.my.startPos) {
                                ui.size.height = paneHeight;
                                ui.position.top = 0;
                            } else {
                                d.my.top = ui.position.top;
                            }
                            if (d.my.day === day && day !== d.my.startPos) {
                                // default move
                                d.my.curHelper.css({
                                    top: mouseY,
                                    height: (day === d.my.lastPos ? d.my.lastHeight : paneHeight) - mouseY
                                });
                                d.my.top = mouseY;
                            } else if (day > d.my.day) {
                                // move right
                                if (day < d.my.startPos) {
                                    d.my.all.filter(':visible').first().remove();
                                } else {
                                    // if original element - do not remove
                                    d.my.all.filter(':visible').first().hide();
                                }
                                // update dataset
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                                d.my.curHelper = d.my.all.filter(':visible').first();
                            } else if (day < d.my.day) {
                                // move left
                                if (day < d.my.firstPos) {
                                    // add new helper
                                    $('.week-container .day[date="' + day + '"]')
                                        .append(d.my.curHelper = el.clone().addClass('opac'));
                                    d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);

                                } else {
                                    d.my.curHelper = d.my.all.filter(':hidden').last();
                                }
                                if (day < d.my.lastPos) {
                                    d.my.all.filter(':visible').slice(0, -1).css({
                                        top: 0,
                                        height: paneHeight
                                    }).end().last().height(function (i, h) {
                                        return $(this).position().top + h;
                                    }).css({top: 0});
                                    d.my.curHelper.show().css({
                                        top: mouseY,
                                        height: paneHeight - mouseY
                                    });
                                }
                                // update dataset
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                            }
                        }
                        // update day
                        d.my.day = day;
                    },
                    stop: function (e, ui) {
                        var el = $(this),
                            d = el.data('resizable'),
                            app = self.collection.get(el.data('cid')).attributes,
                            tmpTS = self.getTimeFromDateTag(d.my.day);
                        d.my.all.removeClass('opac');
                        // save for update calculations
                        app.old_start_date = app.start_date;
                        app.old_end_date = app.end_date;
                        switch (d.my.handle) {
                        case 'n':
                            app.start_date = tmpTS + self.getTimeFromPos(d.my.top);
                            break;
                        case 's':
                            app.end_date = tmpTS + self.getTimeFromPos(d.my.bottom);
                            break;
                        default:
                            break;
                        }
                        // disable widget
                        el.resizable('disable').busy();
                        self.onUpdateAppointment(app);
                    }
                })
                .draggable({
                    grid: [colWidth, self.gridHeight()],
                    distance: 10,
                    scroll: true,
                    revertDuration: 0,
                    revert: function (drop) {
                        //if false then no socket object drop occurred.

                        if (drop === false) {
                            //revert the appointment by returning true
                            $(this).show();
                            return true;
                        } else {
                            //return false so that the appointment does not revert
                            return false;
                        }
                    },
                    start: function (e, ui) {
                        // write all appointment divs to draggable object
                        var d = $(this).data('draggable');
                        d.my = {};
                        d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el)
                            .addClass('opac')
                            .css({
                                left : 0,
                                width: '100%',
                                maxWidth: '100%',
                                zIndex: 999
                            });
                        d.my.firstPos = parseInt(d.my.all.first().closest('.day').attr('date'), 10);
                        d.my.lastPos = parseInt(d.my.all.last().closest('.day').attr('date'), 10);
                        d.my.initPos = parseInt($(this).closest('.day').attr('date'), 10);
                        d.my.firstTop = d.my.all.first().position().top;
                        d.my.lastHeight = d.my.all.last().outerHeight();
                        d.my.lastTop = ui.position.top;
                    },
                    drag: function (e, ui) {
                        var d = $(this).data('draggable'),
                            left = ui.position.left -= ui.originalPosition.left,
                            move = Math.floor(left / colWidth),
                            day = d.my.initPos + move,
                            top = ui.position.top;
                        // correct position
                        if (d.my.firstPos === d.my.lastPos) {
                            d.my.mode = 4;
                        } else if (day === d.my.firstPos + move) {
                            d.my.mode = 3;
                        } else if (day === d.my.lastPos + move) {
                            d.my.mode = 2;
                        } else {
                            d.my.mode = 1;
                        }

                        // sync left position
                        d.my.all
                            .css('left', left);

                        // elements do not move
                        if (ui.position.top < 0 || d.my.mode <= 2) {
                            ui.position.top = 0;
                        }

                        // last element
                        if (d.my.mode === 2) {
                            d.options.axis = 'x';
                        }

                        // handling on multi-drag
                        if (d.my.mode < 4) {
                            if (d.my.lastTop !== top) {
                                var diff = top - d.my.lastTop,
                                    firstTop = d.my.firstTop + diff,
                                    lastHeight = d.my.lastHeight + diff;

                                // calc first position
                                if (((d.my.firstTop >= 0 && firstTop < 0) || (d.my.firstTop >= paneHeight && firstTop < paneHeight)) && diff < 0) {
                                    $('.week-container .day[date="' + (--d.my.firstPos) + '"]')
                                        .append($(this).clone());
                                    d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                                }
                                if (((d.my.firstTop < 0 && firstTop >= 0) || (d.my.firstTop < paneHeight && firstTop >= paneHeight)) && diff > 0) {
                                    d.my.firstPos++;
                                    d.my.all.first().remove();
                                    d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                                }
                                if (firstTop < 0) {
                                    firstTop += paneHeight;
                                } else if (firstTop >= paneHeight) {
                                    firstTop -= paneHeight;
                                }
                                // update first element
                                d.my.all.first().css({
                                    top: firstTop,
                                    height: paneHeight - firstTop
                                });

                                // calc last position
                                if (((d.my.lastHeight <= 0 && lastHeight > 0) || (d.my.lastHeight <= paneHeight && lastHeight > paneHeight)) && diff > 0) {
                                    $('.week-container .day[date="' + (++d.my.lastPos) + '"]')
                                        .append($(this).clone());
                                    d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                                }
                                if (((d.my.lastHeight > 0 && lastHeight <= 0) || (d.my.lastHeight > paneHeight && lastHeight <= paneHeight)) && diff < 0) {
                                    d.my.lastPos--;
                                    d.my.all.last().remove();
                                    d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                                }
                                if (lastHeight <= 0) {
                                    lastHeight += paneHeight;
                                } else if (lastHeight > paneHeight) {
                                    lastHeight -= paneHeight;
                                }
                                d.my.all.last().css({
                                    top: 0,
                                    height: lastHeight
                                });

                                d.my.firstTop += diff;
                                d.my.lastHeight += diff;
                            }
                        }
                        d.my.lastTop = top;
                    },
                    stop: function (e, ui) {
                        var d = $(this).data('draggable'),
                            off = $('.week-container', this.$el).offset(),
                            move = Math.round((ui.position.left - ui.originalPosition.left) / colWidth),
                            app = self.collection.get($(this).data('cid')).attributes,
                            startTS = app.start_date + self.getTimeFromPos(d.my.lastTop - ui.originalPosition.top) + (move * date.DAY);
                        if (e.pageX < window.innerWidth && e.pageX > off.left && e.pageY < window.innerHeight) {
                            // save for update calculations
                            app.old_start_date = app.start_date;
                            app.old_end_date = app.end_date;
                            app.drag_move = move;
                            _.extend(app, {
                                start_date: startTS,
                                end_date: startTS + (app.end_date - app.start_date)
                            });
                            d.my.all.busy();
                            // disable widget
                            $(this).draggable('disable');
                            self.onUpdateAppointment(app);
                        } else {
                            self.trigger('onRefresh');
                        }
                        d.my = null;
                    }
                });

            $('.week-container .day').droppable();

            // remove unused resizable panes
            $('.day>.appointment.rmnorth .ui-resizable-n, .day>.appointment.rmsouth .ui-resizable-s', this.$el)
                .remove();

            // init drag and resize widget on full-time appointments
            $('.fulltime>.appointment.modify', this.$el)
                .draggable({
                    grid: [colWidth, 0],
                    axis: 'x',
                    scroll: true,
                    snap: '.day',
                    zIndex: 2,
                    stop: function (e, ui) {
                        if (e.pageX < window.innerWidth && e.pageY < window.innerHeight) {
                            $(this).draggable('disable').busy();
                            var newPos = Math.round($(this).position().left / (self.fulltimePane.width() / self.columns)),
                                startTS = self.startDate.getDays() * date.DAY + newPos * date.DAY,
                                cid = $(this).data('cid'),
                                app = self.collection.get(cid).attributes;
                            // save for update calculations
                            app.old_start_date = app.start_date;
                            app.old_end_date = app.end_date;
                            _.extend(app, {
                                start_date: startTS,
                                end_date: startTS + (app.end_date - app.start_date)
                            });
                            self.onUpdateAppointment(app);
                        } else {
                            self.trigger('onRefresh');
                        }
                    }
                })
                .resizable({
                    grid: [colWidth, 0],
                    minWidth: colWidth,
                    handles: "w, e",
                    containment: "parent",
                    start: function (e, ui) {
                        $(this).addClass('opac').css('zIndex', $(this).css('zIndex') + 2000);
                    },
                    stop: function (e, ui) {
                        var el = $(this),
                            cid = el.data('cid'),
                            app = self.collection.get(cid).attributes,
                            newDayCount = Math.round(el.outerWidth() / (self.fulltimePane.width() / self.columns));
                        // save for update calculations
                        app.old_start_date = app.start_date;
                        app.old_end_date = app.end_date;
                        el.removeClass('opac').css('zIndex', $(this).css('zIndex') - 2000);

                        if (el.position().left !== ui.originalPosition.left) {
                            _.extend(app, {
                                start_date: app.end_date - (newDayCount * date.DAY)
                            });
                        } else if (el.width() !== ui.originalSize.width) {
                            _.extend(app, {
                                end_date: app.start_date + (newDayCount * date.DAY)
                            });
                        }
                        el.resizable('disable').busy();
                        self.onUpdateAppointment(app);
                    }
                });
        },

        /**
         * render an single appointment
         * @param  {Backbone.Model} a Appointment Model
         * @return {Object}   a jQuery object of the appointment
         */
        renderAppointment: function (a) {
            var el = $('<div>')
                .addClass('appointment')
                .attr({
                    'data-cid': a.id,
                    'data-extension-point': 'io.ox/calendar/week/view/appointment',
                    'data-composite-id': a.id
                });

            ext.point('io.ox/calendar/week/view/appointment')
                .invoke('draw', el, ext.Baton(_.extend({}, this.options, {model: a, folder: this.folder()})));
            return el;
        },

        /**
         * redraw a rendered appointment
         * @param  {Backbone.Model} a Appointment Model
         */
        redrawAppointment: function (a) {
            var positionFieldChanged = _(['start_date', 'end_date', 'full_time'])
                .any(function (attr) { return !_.isUndefined(a.changed[attr]); });
            if (positionFieldChanged) {
                this.renderAppointments();
            } else {
                var el = $('[data-cid="' + a.id + '"]', this.$el);
                el.replaceWith(this.renderAppointment(a)
                    .attr('style', el.attr('style')));
            }
        },

        /**
         * round an integer to the next grid size
         * @param  {number} pos position as integer
         * @param  {String} typ specifies the used rounding algorithm {n=floor, s=ceil, else round}
         * @return {number}     rounded value
         */
        roundToGrid: function (pos, typ) {
            var h = this.gridHeight();
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
         * @param  {Object} ap jQuery object of the appointment
         * @return {Object}    object containin top and height values
         */
        calcPos: function (ap) {
            var start = new date.Local(ap.pos.start),
                end = new date.Local(ap.pos.end),
                self = this,
                calc = function (d) {
                    return Math.floor((d.getHours() / 24 + d.getMinutes() / 1440) * self.height());
                },
                s = calc(start);
            return {
                top: s,
                height: Math.max(calc(end) - s, self.gridHeight())
            };
        },

        /**
         * get timestamp from date marker
         * @param  {number} tag value of the day [0 - 6] for week view
         * @return {number}     timestamp
         */
        getTimeFromDateTag: function (tag)  {
            return this.startDate.getTime() + (tag * date.DAY);
        },

        /**
         * calc daily timestamp from mouse position
         * @param  {number} pos       mouse x position
         * @param  {String} roundType specifies the used rounding algorithm {n=floor, s=ceil, else round}
         * @return {number}           closest grid position
         */
        getTimeFromPos: function (pos, roundType) {
            roundType = roundType || '';
            return this.roundToGrid(pos, roundType) / this.height() * date.DAY;
        },

        /**
         * calculate complete height of the grid
         * @return {number} height of the grid
         */
        height: function () {
            return this.cellHeight * this.slots * this.fragmentation;
        },

        /**
         * calculate height of a single grid fragment
         * @return {number} height of a single grid fragment
         */
        gridHeight: function () {
            return this.cellHeight * this.fragmentation / this.gridSize;
        },

        /**
         * get and set property of showAll checkbox
         * @param  {Boolean} opt display option of the showAll checkbox
         * @return {Boolean}     value of the showAllPrivateAppointments setting (only when opt param === undefined)
         */
        showAll: function (opt) {
            if (typeof opt === 'boolean') {
                this.showAllCon[opt ? 'show': 'hide']();
            } else {
                var set = settings.get('showAllPrivateAppointments', false);
                this.showAllCheck.prop('checked', set);
                return set;
            }
        },

        /**
         * get or set current folder data
         * @param  {Object} data folder data
         * @return {Object}      current folder data
         */
        folder: function (data) {
            if (data) {
                this.folderData = data;
                this.showAll(data.type === 1);

                // return update data
                var obj = {
                    start: this.startDate.getTime(),
                    end: this.startDate.getTime() + (date.DAY * this.columns)
                };
                // do folder magic
                if (data.type > 1 || this.showAll() === false) {
                    obj.folder = data.id;
                }
                return obj;
            } else {
                return this.folderData;
            }
        },

        /**
         * save current scrollposition for the view instance
         */
        save: function () {
            // save scrollposition
            this.restoreCache.scrollPosition = this.pane.scrollTop();
        },

        /**
         * restore scrollposition for the view instance
         */
        restore: function () {
            // restore scrollposition
            if (this.restoreCache.scrollPosition) {
                this.pane.scrollTop(this.restoreCache.scrollPosition);
            }
        }
    });

    ext.point('io.ox/calendar/week/view/appointment').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {
            var a = baton.model,
                hash = util.getConfirmations(a.attributes),
                conf = hash[myself] || { status: 1, comment: "" },
                classes = '';

            if (a.get('private_flag') && myself !== a.get('created_by')) {
                classes = 'private';
            } else {
                classes = util.getShownAsClass(a.attributes) +
                    ' ' + util.getConfirmationClass(conf.status) +
                    (folderAPI.can('write', baton.folder, a.attributes) ? ' modify' : '');
            }

            this.addClass(classes)
                .append(
                    $('<div>')
                    .addClass('appointment-content')
                    .css('lineHeight', (a.get('full_time') ? this.fulltimeHeight : this.cellHeight) + 'px')
                    .append(
                        $('<i class="icon-lock private-flag">')[a.get('private_flag') ? 'show' : 'hide'](),
                        $('<div>').addClass('title').text(gt.noI18n(a.get('title'))),
                        $('<div>').addClass('location').text(gt.noI18n(a.get('location') || ''))
                    )
                )
                .attr({
                    'data-extension': 'default'
                });
        }
    });

    return View;
});


