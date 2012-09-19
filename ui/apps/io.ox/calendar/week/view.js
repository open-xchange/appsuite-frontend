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
     'io.ox/core/config',
     'gettext!io.ox/calendar/view',
     'io.ox/core/api/folder',
     'less!io.ox/calendar/week/style.css',
     'apps/io.ox/core/tk/jquery-ui.min.js'], function (util, date, config, gt, folder) {

    'use strict';

    var myself = null;

    var View = Backbone.View.extend({

        className:      'week',

        columns:        7,      // default value for day columns
        fragmentation:  2,      // fragmentation of a hour
        gridSize:       2,      // grid fragmentation of a hour
        cellHeight:     24,     // height of one single fragment in px
        fulltimeHeight: 19,     // height of full-time appointments in px
        fulltimeMax:    5,      // threshold for visible full-time appointments in header
        appWidth:       98,     // max width of an appointment in %
        overlap:        0.4,    // visual overlap of appointments [0.0 - 1.0]
        slots:          24,     // amount of shown time-slots
        workStart:      8,      // full hour for start position of working time marker
        workEnd:        18,     // full hour for end position of working time marker

        curTimeUTC:     0,      // current timestamp
        pane:           $(),    // main scroll pane
        fulltimePane:   $(),    // full-time appointments pane
        fulltimeCon:    $(),    // full-time container
        timeline:       $(),    // timeline
        footer:         $(),    // footer
        kwInfo:         $(),    // current KW
        showAll:        $(),    // show all folders check-box
        showAllCon:     $(),    // container
        tlInterval:     {},     // timeline interval
        clickTimer:     null,   // timer to separate single and double click
        clicks:         0,      // click counter
        lasso:          false,  // lasso object
        lassoMode:      true,   // is lasso active
        folder:         {},     // current folder

        // define view events
        events: {
            'mousemove .week-container>.day' : 'onLasso',
            'mouseup' : 'onLasso',
            'click .appointment': 'onClickAppointment',
            'dblclick .week-container>.day' : 'onCreateAppointment',
            'dblclick .fulltime>.day': 'onCreateAppointment',
            'mouseenter .appointment': 'onEnterAppointment',
            'mouseleave .appointment': 'onLeaveAppointment',
            'click .toolbar .control.next': 'onControlView',
            'click .toolbar .control.prev': 'onControlView',
            'click .toolbar .link.today': 'onControlView',
            'change .toolbar .showall input[type="checkbox"]' : 'onControlView'
        },

        // handler for onmouseenter event for hover effect
        onEnterAppointment: function (e) {
            if (this.lassoMode) {
                $('[data-cid="' + $(e.currentTarget).data('cid') + '"]').addClass('hover');
            }
        },

        // handler for onmouseleave event for hover effect
        onLeaveAppointment: function (e) {
            if (this.lassoMode) {
                $('[data-cid="' + $(e.currentTarget).data('cid') + '"]').removeClass('hover');
            }
        },

        onControlView: function (e) {
            if ($(e.currentTarget).is('.next')) {
                this.curTimeUTC += (this.columns === 1 ? date.DAY : date.WEEK);
            }
            if ($(e.currentTarget).is('.prev')) {
                this.curTimeUTC -= (this.columns === 1 ? date.DAY : date.WEEK);
            }
            if ($(e.currentTarget).is('.today')) {
                this.curTimeUTC = this.columns === 1 ? util.getTodayStart() : util.getWeekStart();
            }
            this.trigger('onRefreshView', this.curTimeUTC);
        },

        // handler for single- and double-click events on appointments
        onClickAppointment: function (e) {
            if ($(e.currentTarget).is('.appointment') && this.lasso === false) {
                var cid = $(e.currentTarget).data('cid'),
                    obj = _.cid(cid),
                    self = this;
                self.trigger('showAppointment', e, obj);
                if (this.clickTimer === null) {
                    this.clickTimer = setTimeout(function () {
                        self.clicks = 0;
                        self.clickTimer = null;

                        self.$el.find('.appointment')
                            .removeClass('current opac')
                            .not($('[data-cid="' + cid + '"]'))
                            .addClass('opac');
                        $('[data-cid="' + cid + '"]').addClass('current');

                    }, 250);
                }

                if (this.clicks === 1) {
                    clearTimeout(this.clickTimer);
                    this.clickTimer = null;
                    this.clicks = -1;
                    self.trigger('openEditAppointment', e, obj);
                }
                this.clicks++;
            }
        },

        // handler for double-click events on grid
        onCreateAppointment: function (e) {
            if (!folder.can('create', this.folder)) {
                return;
            }
            if ($(e.target).is('.timeslot')) {
                // calculate timestamp for current position
                var pos = this.getTimeFromPos(e.target.offsetTop + e.offsetY),
                    startTS = this.getTimeFromDateTag($(e.currentTarget).attr('date')) + pos;
                this.trigger('openCreateAppointment', e, {start_date: startTS, end_date: startTS + date.HOUR});
            }
            if ($(e.target).is('.day')) {
                // calculate timestamp for current position
                var startTS = this.getTimeFromDateTag($(e.currentTarget).attr('date'));
                this.trigger('openCreateAppointment', e, {start_date: startTS, end_date: startTS + date.DAY, full_time: true});
            }
        },

        onUpdateAppointment: function (obj) {
            _.each(obj, function (el, i) {
                if (el === null) {
                    delete obj[i];
                }
            });
            this.trigger('updateAppointment', obj);
        },

        onLasso: function (e) {
            if (!this.lassoMode || !folder.can('create', this.folder)) {
                return;
            }

            // switch mouse events
            switch (e.type) {
            case 'mousemove':
                var curTar = $(e.currentTarget),
                    curDay = parseInt(curTar.attr('date'), 10),
                    mouseY = e.pageY - (this.pane.offset().top - this.pane.scrollTop());

                // normal move
                if (this.lasso && e.which === 1) {
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
                            curTar
                                .append(tmpLasso);
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
                    lData.stop = down ? this.roundToGrid(mouseY, 's') : this.roundToGrid(mouseY, 'n');
                    lData.lastDay = curDay;
                }

                // first move
                if (this.lasso === false && e.which === 1 && $(e.target).is('.timeslot')) {
                    this.lasso = $('<div>')
                        .addClass('appointment lasso')
                        .css({
                            height: this.cellHeight,
                            minHeight: this.cellHeight,
                            top: this.roundToGrid(mouseY, 'n')
                        });
                    this.lasso.data({
                        start: mouseY,
                        stop: 0,
                        startDay: curDay,
                        lastDay: curDay,
                        helper: {}
                    });
                    curTar
                        .append(this.lasso);
                } else {
                    this.trigger('mouseup');
                }
                break;

            case 'mouseup':
                if (this.lasso && e.which === 1) {
                    var lData = this.lasso.data(),
                        start = this.getTimeFromDateTag(Math.min(lData.startDay, lData.lastDay)) + this.getTimeFromPos(lData.start),
                        end = this.getTimeFromDateTag(Math.max(lData.startDay, lData.lastDay)) + this.getTimeFromPos(lData.stop);

                    // delete div and reset object
                    $.each(lData.helper, function (i, el) {
                        el.remove();
                    });
                    lData = null;
                    this.lasso.remove();
                    this.lasso = false;
                    this.trigger('openCreateAppointment', e, {
                        start_date: start,
                        end_date: end
                    });
                }
                break;

            default:
                break;
            }
            return;
        },

        // init values from prespective
        initialize: function (options) {
            this.columns = options.columns;
            this.curTimeUTC = options.startTimeUTC;
            this.collection.on('reset', this.renderAppointments, this);
        },

        render: function () {
            // create scaffold

            // create timelabels
            var timeLabel = [];
            for (var i = 1; i <= this.slots; i++) {
                timeLabel.push(
                    $('<div>')
                        .addClass('time')
                        .append($('<div>').addClass('number').text((i < 10 ? '0' + i : i) + '.00'))
                        .height(this.cellHeight * this.fragmentation)
                );
            }

            // create panes
            this.pane = $('<div>')
                .addClass('scrollpane')
                .append($('<div>').addClass('lable').append(timeLabel));
            this.fulltimePane = $('<div>')
                .addClass('fulltime');
            this.fulltimeCon = $('<div>')
                .addClass('fulltime-container')
                .append(
                    $('<div>').addClass('fulltime-lable'),
                    this.fulltimePane
                );

            // create toolbar
            this.$el.append(
                $('<div>')
                    .addClass('toolbar')
                    .append(
                        this.kwInfo = $('<span>').addClass('info'),
                        this.showAllCon = $('<div>')
                            .addClass('showall')
                            .append(
                                $('<label>')
                                    .addClass('checkbox')
                                    .text(gt('show all'))
                                    .prepend(
                                        this.showAll = $('<input/>')
                                            .attr('type', 'checkbox')
                                            .prop('checked', true)
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
                                            $('<a>').addClass('link today').text(gt('Today'))
                                        ),
                                        $('<li>')
                                            .append(
                                                    $('<a href="#">').addClass('control next').append($('<i>').addClass('icon-chevron-right'))
                                            )
                                    )
                            )
                    ),
                $('<div>')
                    .addClass('week-view-container')
                    .append(
                        this.fulltimeCon,
                        this.pane,
                        $('<div>')
                            .addClass('footer-container')
                            .append(
                                $('<div>').addClass('footer-lable'),
                                this.footer = $('<div>').addClass('footer')
                            )
                    )
            );

            // create days container
            var container = $('<div>').addClass('week-container');

            // create and animate timeline
            this.timeline = $('<div>').addClass('timeline');
            this.renderTimeline(this.timeline);
            this.tlInterval = setInterval(this.renderTimeline, 60000, this.timeline);
            container.append(this.timeline);

            // create days
            for (var d = 0; d < this.columns; d++) {

                var day = $('<div>')
                        .addClass('day').width(100 / this.columns + '%')
                        .attr('date', d);

                // add days to fulltime panel
                this.fulltimePane.append(day.clone());

                // create timeslots
                for (var i = 1; i <= this.slots * this.fragmentation; i++) {
                    day.append(
                        $('<div>')
                            .addClass('timeslot ' + (i > (this.workStart * this.fragmentation) && i <= (this.workEnd * this.fragmentation) ? 'in' : 'out'))
                            .height(this.cellHeight)
                    );
                }

                container.append(day);
            }

            this.pane.append(container);

            return this;
        },

        getScrollPos: function () {
            var slotHeight = this.cellHeight * this.fragmentation,
                workStartPos = slotHeight * this.workStart,
                workHeight = slotHeight * this.workEnd - workStartPos,
                newPos = (this.pane.height() - workHeight) / 2;
            return workStartPos - newPos;
        },

        renderTimeline: function (tl) {
            var d = new date.Local();
            tl.css({ top: ((d.getHours() / 24 + d.getMinutes() / 1440) * 100) + '%'});
        },

        renderAppointments: function () {
            // clear all first
            this.$el.find('.appointment').remove();
            $('.day.today').removeClass('today');

            var self = this,
                draw = {},
                fulltimeColPos = [0],
                days = [],
                hasToday = false,
                tmpDate = new date.Local(this.curTimeUTC);

            // refresh footer, timeline and today-label
            for (var d = 0; d < this.columns; d++) {
                days.push(
                        $('<div>')
                        .addClass('weekday')
                        .text(tmpDate.format(date.DAYOFWEEK_DATE))
                        .width(100 / this.columns + '%')
                );
                // mark today
                if (util.isToday(tmpDate.getTime())) {
                    this.pane.find('.day[date="' + d + '"]').addClass('today');
                    hasToday = true;
                }
                tmpDate.add(date.DAY);
            }
            this.footer.empty().append(days);
            this.kwInfo.text(new date.Local(this.curTimeUTC).formatInterval(new date.Local(this.curTimeUTC + ((this.columns - 1) * date.DAY)), date.DATE));

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

                if (model.get('full_time')) {
                    var app = this.renderAppointment(model.attributes),
                        fulltimePos = (model.get('start_date') - this.curTimeUTC) / date.DAY,
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
                    var startDate = new date.Local(model.get('start_date')),
                        endDate = new date.Local(model.get('end_date') - 1),
                        start = startDate.format(date.DAYOFWEEK_DATE),
                        end = endDate.format(date.DAYOFWEEK_DATE),
                        maxCount = this.columns,
                        style = '';

                    // draw across multiple days
                    // FIXE ME: just to make it work and safe
                    while (true && maxCount) {
                        var app = this.renderAppointment(model.attributes),
                            sel = '[date="' + Math.floor((startDate.getTime() - date.Local.utc(this.curTimeUTC)) / date.DAY) + '"]';
                        maxCount--;

                        // if
                        if (start !== end) {
                            endDate = new date.Local(startDate.getTime());
                            endDate.setHours(23, 59, 59, 999);
                            style += 'rmsouth';
                        } else {
                            endDate = new date.Local(model.get('end_date') - 1);
                        }

                        app.pos = {
                                id: model.id,
                                start: startDate.getTime(),
                                end: endDate.getTime(),
                                col: 0
                            };
                        app.addClass(style);
                        if (!draw[sel]) {
                            draw[sel] = [];
                        }
                        draw[sel].push(app);

                        style = '';
                        // inc date
                        if (start !== end) {
                            startDate.setDate(startDate.getDate() + 1);
                            startDate.setHours(0, 0, 0, 0);
                            start = startDate.format(date.DAYOFWEEK_DATE);
                            style = 'rmnorth ';
                        } else {
                            break;
                        }
                    }

                }

            }, this);

            // calculate full-time appointment container height
            var ftHeight = (fulltimeColPos.length <= this.fulltimeMax ? fulltimeColPos.length : (this.fulltimeMax + 0.5)) * (this.fulltimeHeight + 1) + 1;
            this.fulltimePane.css({ height: fulltimeColPos.length * (this.fulltimeHeight + 1) + 'px'});
            this.fulltimeCon.add().css({ height: ftHeight + 'px' });
            this.pane.css({ top: ftHeight + 'px' });

            // adjust scoll position
            this.pane.scrollTop(this.getScrollPos());

            // loop over all single days
            $.each(draw, function (day, apps) {
                // init position Array
                var colPos = [0];

                // loop over all apps per day to calculate position
                for (var i = 0; i < apps.length; i++) {
                    // loop over all column positions
                    for (var pos = 0; pos < colPos.length; pos++) {
                        if  (colPos[pos] < apps[i].pos.start - 1) {
                            colPos[pos] = apps[i].pos.end;
                            apps[i].pos.index = pos;
                            break;
                        }
                    }

                    if (pos === colPos.length) {
                        apps[i].pos.index = colPos.length;
                        colPos.push(apps[i].pos.end);
                    }
                }

                var elWidth = Math.min((self.appWidth / colPos.length) * (1 + (self.overlap * (colPos.length - 1))), self.appWidth);

                // loop over all appss to draw them
                for (var j = 0; j < apps.length; j++) {
                    var pos = self.calcPos(apps[j]),
                        leftWidth = colPos.length > 1 ? ((self.appWidth - elWidth) / (colPos.length - 1)) * apps[j].pos.index : 0;
                    apps[j].css({
                        top: pos.start,
                        minHeight: self.cellHeight + 'px',
                        maxWidth: self.appWidth + '%',
                        left: leftWidth + '%',
                        zIndex: j
                    })
                    .addClass((leftWidth > 0 || (leftWidth === 0 && elWidth < self.appWidth)) ? 'border' : '')
                    .outerHeight(pos.lenght)
                    .width(elWidth + '%');
                }
                self.$('.week-container ' + day).append(apps);
            });

            // init drag and resize widget on appointments
            var colWidth = $('.day:first').outerWidth(),
                lastDiff = 0;
            $('.week-container .day>.appointment.modify')
                .resizable({
                    handles: "n, s",
                    grid: [0, self.gridHeight()],
                    minHeight: self.gridHeight(),
                    containment: "parent",
                    start: function (e, ui) {
                        self.lassoMode = false;
                        $(this).addClass('opac');
                    },
                    resize:  function (e, ui) {
//                        var data = $(this).data('resizable');
                    },
                    stop: function (e, ui) {
                        var el = $(this),
                            app = self.collection.get(el.data('cid')).attributes,
                            tmpTS = self.getTimeFromDateTag($(this).parent().attr('date'), true) + self.getTimeFromPos(el.position().top);
                        self.lassoMode = true;
                        el.removeClass('opac');

                        if (el.position().top !== ui.originalPosition.top) {
                            _.extend(app, {
                                start_date: tmpTS,
                                ignore_conflicts: true
                            });
                        } else if (el.height() !== ui.originalSize.height) {
                            _.extend(app, {
                                end_date: tmpTS + self.getTimeFromPos(el.outerHeight()),
                                ignore_conflicts: true
                            });
                        }
                        el.busy();
                        self.onUpdateAppointment(app);
                    }
                })
                .draggable({
                    grid: [colWidth, self.gridHeight()],
                    scroll: true,
//                    containment: '.week-container',
                    start: function (e, ui) {
                        self.lassoMode = false;
                        self.onEnterAppointment(e);
                        // write all appointment divs to draggable object
                        var data = $(this).data('draggable');
                        data.all = $('[data-cid="' + ui.helper.data('cid') + '"]')
                            .addClass('opac')
                            .css({
                                width: '100%',
                                maxWidth: '100%',
                                zIndex: 999
                            });
                        data.firstPos = data.all.first().position().top;
                        // last element
                        if (data.all.length > 1 && this === data.all.last()[0]) {
                            data.options.axis = 'x';
                        }
                    },
                    drag: function (e, ui) {
                        var data = $(this).data('draggable');
                        // correct position
                        data.all
                            .css('left', data.position.left -= data.originalPosition.left);
                        // handling on multi-drag
                        if (data.all.length > 1) {
                            var diff = data.position.top - data.originalPosition.top;
                            if (lastDiff !== diff) {
                                // first or last element
                                if (this === data.all.last()[0] || this === data.all.first()[0]) {
                                    var dir = lastDiff - diff;
                                    data.all.last().height(function (i, h) { return Math.min(h - dir, self.height()); });
                                    data.all.first().height(function (i, h) { return Math.min(h + dir, self.height()); });
                                    // last element
                                    if (this === data.all.last()[0]) {
                                        data.all.first().css({top: data.all.first().position().top - dir});
                                    }
                                    lastDiff = diff;
                                } else {
                                    data.position.top = data.originalPosition.top;
                                }
                            }
                        }
                    },
                    stop: function (e, ui) {
                        self.lassoMode = true;
                        $(this).busy();
                        var move = Math.round((ui.position.left - ui.originalPosition.left) / colWidth),
                            data = $(this).data('draggable'),
                            app = self.collection.get($(this).data('cid')).attributes,
                            startTS = app.start_date + self.getTimeFromPos(data.all.first().position().top - data.firstPos) + (move * date.DAY);
                        _.extend(app, {
                            start_date: startTS,
                            end_date: startTS + (app.end_date - app.start_date),
                            ignore_conflicts: true
                        });
                        self.onUpdateAppointment(app);
                    }
                });

            // remove unused resizable panes
            $('.day>.appointment.rmnorth .ui-resizable-n, .day>.appointment.rmsouth .ui-resizable-s')
                .remove();

            // init drag and resize widget on appointments
            $('.fulltime>.appointment.modify')
                .draggable({
                    grid: [colWidth, 0],
                    axis: 'x',
                    scroll: true,
                    snap: '.day',
                    zIndex: 2,
                    start: function (e, ui) {
                        self.lassoMode = false;
                    },
                    stop: function (e, ui) {
                        console.log('drag stop fulltime', e, ui);
                        self.lassoMode = true;
                        $(this).busy();
                        var newPos = Math.round($(this).position().left / (self.fulltimePane.width() / self.columns)),
                            startTS = self.curTimeUTC + (newPos * date.DAY),
                            cid = $(this).data('cid'),
                            app = self.collection.get(cid).attributes;
                        _.extend(app, {
                            start_date: startTS,
                            end_date: startTS + (app.end_date - app.start_date),
                            ignore_conflicts: true
                        });
                        self.onUpdateAppointment(app);
                    }
                })
                .resizable({
                    grid: [colWidth, 0],
                    minWidth: colWidth,
                    handles: "w, e",
                    containment: "parent",
                    start: function (e, ui) {
                        self.lassoMode = false;
                        $(this).addClass('opac').css('zIndex', $(this).css('zIndex') + 2000);
                    },
                    stop: function (e, ui) {
                        self.lassoMode = true;
                        var el = $(this),
                            cid = el.data('cid'),
                            app = self.collection.get(cid).attributes,
                            newDayCount = Math.round(el.outerWidth() / (self.fulltimePane.width() / self.columns));
                        el.removeClass('opac').css('zIndex', $(this).css('zIndex') - 2000);

                        if (el.position().left !== ui.originalPosition.left) {
                            _.extend(app, {
                                start_date: app.end_date - (newDayCount * date.DAY),
                                ignore_conflicts: true
                            });
                        } else if (el.width() !== ui.originalSize.width) {
                            _.extend(app, {
                                end_date: app.start_date + (newDayCount * date.DAY),
                                ignore_conflicts: true
                            });
                        }
                        el.busy();
                        self.onUpdateAppointment(app);
                    }
                });
        },

        renderAppointment: function (a) {

            myself = myself || config.get('identifier');

            // check confirmations
            var state = (_(a.participants).find(function (o) {
                    return o.id === myself;
                }) || { type: 0 }).type;

            return $('<div>')
                .addClass(
                    'appointment ' +
                    util.getShownAsClass(a) +
                    (a.private_flag ? ' private' : '') +
                    (state === 0 ? ' unconfirmed' : '') +
                    (folder.can('write', this.folder, a) ? ' modify' : '')
                )
                .attr('data-cid', _.cid(a))
                .append(
                    $('<div>')
                        .addClass('appointment-content')
                        .css('lineHeight', (a.full_time ? this.fulltimeHeight : this.cellHeight) + 'px')
                        .append($('<div>').addClass('title').text(a.title))
                        .append($('<div>').addClass('location').text(a.location || ''))
                );
        },

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

        calcPos: function (ap) {
            var start = new date.Local(ap.pos.start),
                end = new date.Local(ap.pos.end),
                self = this,
                calc = function (d) {
                    return Math.floor((d.getHours() / 24 + d.getMinutes() / 1440) * self.height());
                },
                s = calc(start);
            return {
                start: s,
                lenght: Math.max(calc(end) - s, self.gridHeight())
            };
        },

        getTimeFromDateTag: function (days, utc)  {
            if (utc) {
                return date.Local.utc(this.curTimeUTC + (days * date.DAY));
            }
            return this.curTimeUTC + (days * date.DAY);
        },

        getTimeFromPos: function (pos) {
            return this.roundToGrid(pos) / this.height() * date.DAY;
        },

        // calculate complete height of the grid
        height: function () {
            return this.cellHeight * this.slots * this.fragmentation;
        },

        // calculate height of a single grid fragment
        gridHeight: function () {
            return this.cellHeight * this.fragmentation / this.gridSize;
        },

        getShowAllStatus: function () {
            return this.showAll.prop('checked');
        },

        setShowAllVisibility: function (display) {
            this.showAllCon[display ? 'show': 'hide']();
        },

        getFolder: function () {
            return this.folder;
        },

        setFolder: function (folder) {
            this.folder =  folder;
        }

    });

    return View;
});
