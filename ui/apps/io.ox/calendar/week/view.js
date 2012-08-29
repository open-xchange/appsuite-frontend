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
     'dot!io.ox/calendar/week/template.html',
     'io.ox/core/date',
     'io.ox/core/config',
     'gettext!io.ox/calendar/view',
     'less!io.ox/calendar/week/style.css',
     'apps/io.ox/core/jqueryui/jquery-ui-1.8.23.interactions.min.js'], function (util, tmpl, date, config, gt) {

    'use strict';

    var myself = null;

    var View = Backbone.View.extend({

        className:      'week',
        
        columns:        7,      // default value for day columns
        fragmentation:  2,      // fragmentation of a hour
        gridSize:       4,      // grid fragmentation of a hour
        cellHeight:     24,     // height of one single fragment in px
        fulltimeHeight: 20,     // height of fulltime appointments in px
        fulltimeMax:    5,      // threshold for visible full-time appointments in header
        appWidth:       98,     // max width of an appointment in %
        overlap:        0.4,    // visual overlap of appointments [0.0 - 1.0]
        workStart:      8,      // full hour for start position of worktime marker
        workEnd:        18,     // full hour for end position of worktime marker
        slots:          24,     // amount of shown timeslots
        
        pane:           $(),    // main scroll pane
        fulltimePane:   $(),    // fulltime appointments pane
        fulltimeCon:    $(),    // fulltime container
        timeline:       $(),    // timeline
        week:           [],     // week scaffold
        tlInterval:     {},     // timeline interval
        clickTimer:     null,   // timer to separate single and double click
        clicks:         0,      // click counter
        lasso:          false,  // lasso object
        lassoMode:      true,   // is lasso active
        lassoStart:     0,      // initial lasso Position
        
        events: {
            'mousemove .weekcontainer>.day' : 'onLasso',
            'mouseup' : 'onLasso',
            'click .appointment': 'onClickAppointment',
            'dblclick .weekcontainer>.day' : 'onCreateAppointment',
            'mouseenter .appointment': 'onEnterAppointment',
            'mouseleave .appointment': 'onLeaveAppointment'
        },

        initialize: function (options) {
            this.columns = options.columns;
            this.week = util.getWeekScaffold(options.startDate);
            this.collection.on('reset', this.renderAppointments, this);
        },

        onClickAppointment: function (e) {
            if ($(e.target).is('.appointment') && this.lasso === false) {
                var target = $(e.currentTarget),
                    cid = target.attr('data-cid'),
                    obj = _.cid(target.attr('data-cid')),
                    that = this;
                
                if (this.clickTimer === null) {
                    this.clickTimer = setTimeout(function () {
                        that.clicks = 0;
                        that.clickTimer = null;
                        
                        that.$el.find('.appointment')
                            .removeClass('current opac')
                            .not($('[data-cid="' + cid + '"]'))
                            .addClass('opac');
                        $('[data-cid="' + cid + '"]').addClass('current');
                        that.trigger('showAppointment', e, obj);
                    }, 250);
                }
    
                if (this.clicks === 1) {
                    clearTimeout(this.clickTimer);
                    this.clickTimer = null;
                    this.clicks = -1;
                    that.trigger('editAppointment', e, obj);
                }
                this.clicks++;
            }
        },
        
        onEnterAppointment: function (e) {
            $('[data-cid="' + $(e.currentTarget).attr('data-cid') + '"]').addClass('hover');
        },
        
        onLeaveAppointment: function (e) {
            $('[data-cid="' + $(e.currentTarget).attr('data-cid') + '"]').removeClass('hover');
        },
        
        onCreateAppointment: function (e) {
            if ($(e.target).is('.timeslot')) {
                // calculate timestamp for current position
                var pos = this.calcTime(e.target.offsetTop + e.offsetY),
                    start = date.Local.parse($(e.currentTarget).attr('date'), 'y-M-d').getTime() + (pos - pos % (date.HOUR / this.gridSize)),
                    end = start + date.HOUR;
                this.trigger('createAppointment', e, start, end);
            }
        },
        
        onLasso: function (e) {
            if (!this.lassoMode) {
                return;
            }
            var MousePosY = e.target.offsetTop + e.offsetY,
                gridHeight = this.cellHeight * this.fragmentation / this.gridSize;
            // normalize to gird size
            MousePosY -= MousePosY % gridHeight;
            // switch mouse events
            switch (e.type) {
            case 'mousemove':
                // normal move
                if (this.lasso && e.which === 1) {
                    var newHeight = MousePosY - this.lassoStart,
                        newHeightNorm = Math.abs(newHeight);
                    this.lasso.css({
                        height: newHeightNorm,
                        top: newHeight <= 0 ? this.lassoStart - newHeightNorm : this.lassoStart
                    });
                }
                // first move
                if (this.lasso === false && e.which === 1 && $(e.target).is('.timeslot')) {
                    this.lasso = $('<div>')
                        .addClass('appointment lasso')
                        .css({
                            height: this.cellHeight,
                            minHeight: this.cellHeight,
                            width: this.appWidth + '%',
                            top: MousePosY
                        });
                    this.lassoStart = MousePosY;
                    $(e.currentTarget)
                        .append(this.lasso);
                } else {
                    this.trigger('mouseup');
                }
                break;
                
            case 'mouseup':
                if (this.lasso !== false && e.which === 1) {
                    var start = date.Local.parse(this.lasso.parent().attr('date'), 'y-M-d').getTime() + this.calcTime(this.lasso.position().top),
                        end = start + this.calcTime(this.lasso.outerHeight());
                    this.lasso.remove();
                    this.lasso = false;
                    this.trigger('createAppointment', e, start, end);
                }
                break;

            default:
                break;
            }
            return;
        },

        render: function () {
            // create scaffold
            var days = [];
            _.each(this.week, function (e) {
                var tmpDate = new date.Local(e.timestamp);
                days.push(tmpDate.format(date.DAYOFWEEK_DATE));
            });

            var scaffold = tmpl.render('scaffold', {days: days, width: 100 / this.columns + '%'});
            this.pane = scaffold.find('.scrollpane');
            this.fulltimeCon = scaffold.find('.fulltime-container');
            this.fulltimePane = scaffold.find('.fulltime');
            
            // create timelabels
            var timeLabel = $('<div>').addClass('lable');
            for (var i = 1; i <= this.slots; i++) {
                timeLabel.append(tmpl.render('time', {lable: (i < 10 ? '0' + i : i) + '.00'}).height(this.cellHeight * this.fragmentation));
            }
            this.pane.append(timeLabel);
            
            // create days container
            var container = $('<div>').addClass('weekcontainer');
            
            // create and animate timeline
            this.timeline = $('<div>').addClass('timeline');
            this.renderTimeline(this.timeline);
            this.tlInterval = setInterval(this.renderTimeline, 60000, this.timeline);
            container.append(this.timeline);
            
            // create days
            for (var d = 0; d < this.columns; d++) {
                
                var dayInfo = this.week[d],
                    day = $('<div>')
                        .addClass('day').width(100 / this.columns + '%')
                        .attr('date', dayInfo.year + '-' + (dayInfo.month + 1) + '-' + dayInfo.date);
                
                if (dayInfo.isToday) {
                    day.addClass('today');
                }
                
                // create timeslots
                for (var i = 1; i <= this.slots * this.fragmentation; i++) {
                    var workClass = i > (this.workStart * this.fragmentation) && i <= (this.workEnd * this.fragmentation) ? 'in' : 'out';
                    
                    day.append(tmpl.render('timeslot').addClass(workClass).height(this.cellHeight));
                }

                container.append(day);
            }
            
            this.pane.append(container);

            this.$el.append(scaffold);
            
            return this;
        },
        
        getScrollPos: function () {
            var slotHeight = this.cellHeight * this.fragmentation,
                workStartPos = slotHeight * this.workStart,
                workEndPos = slotHeight * this.workEnd,
                workHeight = workEndPos - workStartPos,
                newPos = (this.pane.height() - workHeight) / 2;
            return workStartPos - newPos;
        },

        renderTimeline: function (tl) {
            var d = new date.Local();
            tl.css({ top: ((d.getHours() / 24 + d.getMinutes() / 1440) * 100) + '%'});
        },
        
        renderAppointment: function (a) {

            myself = myself || config.get('identifier');

            // check confirmations
            var state = (_(a.participants).find(function (o) {
                    return o.id === myself;
                }) || { type: 0 }).type;

            return tmpl.render('appointment', {
                cid: _.cid(a),
                full_time: a.full_time,
                location: a.location,
                private_flag: a.private_flag,
                shownAs: util.getShownAsClass(a),
                start: util.getTime(a.start_date),
                title: a.title,
                unconfirmed: state === 0
            });
        },

        renderAppointments: function () {
            // clear all first
            this.$el.find('.appointment').remove();
            
            var draw = {},
                fulltimeColPos = [0];
            
            // loop over all appointments to split and create divs
            this.collection.each(function (model) {

                var startDate = new date.Local(model.get('start_date')),
                    endDate = new date.Local(model.get('end_date') - 1),
                    start = startDate.format('y-M-d'),
                    end = endDate.format('y-M-d'),
                    maxCount = 7;

                if (model.get('start_date') < 0) {
                    console.error('FIXME: start_date should not be negative');
                    throw 'FIXME: start_date should not be negative';
                }

                if (model.get('full_time')) {
                    var app = this.renderAppointment(model.attributes),
                        found = false,
                        row = 0,
                        fulltimePos = startDate.getDay() - 1,
                        fulltimeWidth = (model.get('end_date') - model.get('start_date')) / date.DAY;
                    
                    // loop over all column positions
                    for (var k = 0; k < fulltimeColPos.length; k++) {
                        if  (fulltimeColPos[k] <= model.get('start_date')) {
                            fulltimeColPos[k] = model.get('end_date');
                            row = k;
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        row = fulltimeColPos.length;
                        fulltimeColPos.push(model.get('end_date'));
                    }
                    
                    app.css({
                        height: 20,
                        width: (100 / this.columns * Math.min(fulltimeWidth, this.columns - fulltimePos)) + '%',
                        left: (100 / this.columns) * fulltimePos + '%',
                        top: row * (this.fulltimeHeight - 1) + 1
                    });
                    
                    this.fulltimePane.append(app);
                } else {

                    // draw across multiple days
                    // FIXE ME: just to make it work and safe
                    while (true && maxCount) {
                        
                        maxCount--;
                        
                        // if
                        if (start !== end) {
                            endDate = new date.Local(startDate.getTime());
                            endDate.setHours(23, 59, 59, 999);
                        } else {
                            endDate = new date.Local(model.get('end_date') - 1);
                        }
                        
                        var app = this.renderAppointment(model.attributes),
                            sel = '[date="' + start + '"]';
                        
                        app.pos = {
                                id: model.id,
                                start: startDate.getTime(),
                                end: endDate.getTime(),
                                col: 0
                            };
                        
                        if (!draw[sel]) {
                            draw[sel] = [];
                        }
                        draw[sel].push(app);
                        
                        // inc date
                        if (start !== end) {
                            startDate.setDate(startDate.getDate() + 1);
                            startDate.setHours(0, 0, 0, 0);
                            start = startDate.format('y-M-d');
                        } else {
                            break;
                        }
                    }
                    
                }
                
                // calculate full-time appointment container height
                var ftHeight = (fulltimeColPos.length <= this.fulltimeMax ? fulltimeColPos.length : (this.fulltimeMax + 0.5)) * (this.fulltimeHeight - 1) + 1;
                this.pane.css({ top: ftHeight + 1 + 'px' });
                this.fulltimeCon.height(ftHeight);
                
            }, this);
            
            var that = this;
            // loop over all single days
            $.each(draw, function (i, e) {
                // init position Array
                var colPos = [0];

                // loop over all appointments to calculate position
                for (var j = 0; j < e.length; j++) {
                    
                    var found = false;
                    
                    // loop over all column positions
                    for (var k = 0; k < colPos.length; k++) {
                        if  (colPos[k] <= e[j].pos.start) {
                            colPos[k] = e[j].pos.end;
                            e[j].pos.index = k;
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        e[j].pos.index = colPos.length;
                        colPos.push(e[j].pos.end);
                    }
                }
                
                var width = (that.appWidth / colPos.length),
                    elWidth = Math.min(width * (1 + (that.overlap * (colPos.length - 1))), that.appWidth);

                // loop over all appointments to draw them
                for (var j = 0; j < e.length; j++) {
                    var pos = that.calcPos(e[j]),
                        leftWidth = ((that.appWidth - elWidth) / (colPos.length - 1)) * e[j].pos.index;
                    
                    e[j].css({
                        top: pos.start,
                        minHeight: that.cellHeight + 'px',
                        maxWidth: that.appWidth + '%',
                        left: leftWidth + '%'
                    })
                    .height(pos.lenght)
                    .width(elWidth + '%');
                }
                that.$(i).append(e);
                
            });
            
            $(function () {
                var gridHeight = that.cellHeight * that.fragmentation / that.gridSize;
                $('.appointment')
                    .draggable({
                        grid: [$('.day:first').outerWidth(), gridHeight],
                        scroll: true,
                        snap: '.day',
                        zIndex: 5,
                        start: function (e, ui) {
                            that.onEnterAppointment(e);
                        },
                        stop: function (e, ui) {
                            console.log('drag stop', e, ui, that.calcTime(ui.position.top));
                        },
                        drag: function () {
                            
                        }
                    })
                    .resizable({
                        grid: [1, gridHeight],
                        handles: "n, s",
                        distance: 1
                    });
                $('.day').droppable({
                    drop: function (e, ui) {
                        console.log('drop', e, ui);
                        $(this).append(ui.draggable.css({left: 0}));
                    }
                });
            }, this);
            
        },
        
        calcPos: function (ap) {
            var start = new date.Local(ap.pos.start),
                end = new date.Local(ap.pos.end),
                height = this.cellHeight * this.slots * this.fragmentation,
                calc = function (d) {
                    return (d.getHours() / 24 + d.getMinutes() / 1440) * height;
                },
                s = calc(start);
            
            return {
                start: s,
                lenght: calc(end) - s
            };
        },
        
        calcTime: function (pos) {
            return Math.max(0, pos / (this.cellHeight * this.slots * this.fragmentation) * date.DAY);
        }
        
    });

    return View;
});
