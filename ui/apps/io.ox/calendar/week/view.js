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
                var cid = $(e.currentTarget).attr('data-cid'),
                    obj = _.cid(cid),
                    that = this;
                that.trigger('showAppointment', e, obj);
                if (this.clickTimer === null) {
                    this.clickTimer = setTimeout(function () {
                        that.clicks = 0;
                        that.clickTimer = null;
                        
                        that.$el.find('.appointment')
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
                    that.trigger('openEditAppointment', e, obj);
                }
                this.clicks++;
            }
        },
        
        // handler for onmouseenter event for hover effect
        onEnterAppointment: function (e) {
            if (this.lassoMode) {
                $('[data-cid="' + $(e.currentTarget).attr('data-cid') + '"]').addClass('hover');
            }
        },
        
        // handler for onmouseleave event for hover effect
        onLeaveAppointment: function (e) {
            if (this.lassoMode) {
                $('[data-cid="' + $(e.currentTarget).attr('data-cid') + '"]').removeClass('hover');
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
        
        onLasso: function (e) {
            if (!this.lassoMode || !folder.can('create', this.folder)) {
                return;
            }
            var MousePosY = e.target.offsetTop + e.offsetY;
            // switch mouse events
            switch (e.type) {
            case 'mousemove':
                // normal move
                if (this.lasso && e.which === 1) {
                    var newHeight = this.roundToGrid(MousePosY) - this.lasso.data('start'),
                        newHeightNorm = Math.abs(newHeight);
                    this.lasso.css({
                        height: newHeightNorm,
                        top: this.lasso.data('start') - (newHeight <= 0 ? newHeightNorm : 0)
                    });
                }
                // first move
                if (this.lasso === false && e.which === 1 && $(e.target).is('.timeslot')) {
                    this.lasso = $('<div>')
                        .addClass('appointment lasso')
                        .css({
                            height: this.cellHeight,
                            minHeight: this.cellHeight,
                            top: this.roundToGrid(MousePosY, 'top')
                        });
                    this.lasso.data('start', this.roundToGrid(MousePosY, 'top'));
                    $(e.currentTarget)
                        .append(this.lasso);
                } else {
                    this.trigger('mouseup');
                }
                break;
                
            case 'mouseup':
                if (this.lasso && e.which === 1) {
                    var start = this.getTimeFromDateTag(this.lasso.parent().attr('date')) + (this.getTimeFromPos(this.lasso.position().top)),
                        end = new date.Local(start).add(this.getTimeFromPos(this.lasso.outerHeight())).getTime(),
                        newApp = {
                            start_date: start,
                            end_date: end
                        };
                    // delete div and reset object
                    this.lasso.remove();
                    this.lasso = false;
                    this.trigger('openCreateAppointment', e, newApp);
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
            
            var draw = {},
                fulltimeColPos = [0],
                days = [],
                hasToday = false;
            
            // refresh footer, timeline and today-label
            var tmpDate = new date.Local(this.curTimeUTC);
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
                var startDate = new date.Local(model.get('start_date')),
                    endDate = new date.Local(model.get('end_date'));
                if (model.get('start_date') < 0) {
                    console.error('FIXME: start_date should not be negative');
                    throw 'FIXME: start_date should not be negative';
                }
                
                if (model.get('full_time')) {
                    var app = this.renderAppointment(model.attributes),
                        found = false,
                        row = 0,
                        fulltimePos = (model.get('start_date') - this.curTimeUTC) / date.DAY,
                        fulltimeWidth = (model.get('end_date') - model.get('start_date')) / date.DAY + Math.min(0, fulltimePos);
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
                        height: this.fulltimeHeight,
                        width: (100 / this.columns) * fulltimeWidth + '%',
                        left: (100 / this.columns) * Math.max(0, fulltimePos) + '%',
                        top: row * (this.fulltimeHeight + 1) + 1
                    });
                    this.fulltimePane.append(app);
                } else {
                    var start = startDate.format(date.DAYOFWEEK_DATE),
                        end = endDate.format(date.DAYOFWEEK_DATE),
                        maxCount = 7;
                    
                    // draw across multiple days
                    // FIXE ME: just to make it work and safe
                    while (true && maxCount) {
                        
                        maxCount--;
                        
                        // if
                        if (start !== end) {
                            endDate = new date.Local(startDate.getTime());
                            endDate.setHours(23, 59, 59, 999);
                        } else {
                            endDate = new date.Local(model.get('end_date'));
                        }
                        
                        var app = this.renderAppointment(model.attributes),
                            sel = '[date="' + Math.floor((startDate.getTime() - date.Local.utc(this.curTimeUTC)) / date.DAY) + '"]';
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
                            start = startDate.format(date.DAYOFWEEK_DATE);
                        } else {
                            break;
                        }
                    }
                    
                }
                
            }, this);
            
            // calculate full-time appointment container height
            var ftHeight = (fulltimeColPos.length <= this.fulltimeMax ? fulltimeColPos.length : (this.fulltimeMax + 0.5)) * this.fulltimeHeight + 3;
            this.pane.css({ top: ftHeight + 'px' });
            this.fulltimePane.css({ height: fulltimeColPos.length * this.fulltimeHeight + 2 + 'px'});
            this.fulltimeCon.css({ height: ftHeight + 'px' });
            
            // adjust scoll position
            this.pane.scrollTop(this.getScrollPos());
            
            var that = this;
            // loop over all single days
            $.each(draw, function (selector, appointment) {
                // init position Array
                var colPos = [0];

                // loop over all appointments per day to calculate position
                for (var j = 0; j < appointment.length; j++) {
                    
                    var found = false;
                    
                    // loop over all column positions
                    for (var k = 0; k < colPos.length; k++) {
                        if  (colPos[k] <= appointment[j].pos.start) {
                            colPos[k] = appointment[j].pos.end;
                            appointment[j].pos.index = k;
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        appointment[j].pos.index = colPos.length;
                        colPos.push(appointment[j].pos.end);
                    }
                }
                
                var width = (that.appWidth / colPos.length),
                    elWidth = Math.min(width * (1 + (that.overlap * (colPos.length - 1))), that.appWidth);

                // loop over all appointments to draw them
                for (var j = 0; j < appointment.length; j++) {
                    var pos = that.calcPos(appointment[j]),
                        leftWidth = colPos.length > 1 ? ((that.appWidth - elWidth) / (colPos.length - 1)) * appointment[j].pos.index : 0;
                    appointment[j].css({
                        top: pos.start,
                        minHeight: that.cellHeight + 'px',
                        maxWidth: that.appWidth + '%',
                        left: leftWidth + '%',
                        zIndex: Math.ceil(pos.start)
                    })
                    .addClass((leftWidth > 0 || (leftWidth === 0 && elWidth < that.appWidth)) ? 'border' : '')
                    .height(pos.lenght)
                    .width(elWidth + '%');
                }
                that.$('.week-container ' + selector).append(appointment);
            });
            
            // init drag and resize widget on appointments
            var colWidth = $('.day:first').outerWidth();
            $('.day>.appointment:modify')
                .draggable({
                    grid: [colWidth, that.gridHeight()],
                    scroll: true,
                    snap: '.day',
                    opacity: 0.4,
                    start: function (e, ui) {
                        that.lassoMode = false;
                        $(this)
                            .css({width: '100%'});
                        that.onEnterAppointment(e);
                    },
                    stop: function (e, ui) {
                        that.lassoMode = true;
                        $(this).busy();
                    },
                    drag: function (e, ui) {
                        // correct position
                        $(this).data('draggable').position.left = 0;
                    }
                })
                .resizable({
                    handles: "n, s",
                    grid: [0, that.gridHeight()],
                    minHeight: that.gridHeight(),
                    containment: "parent",
                    start: function (e, ui) {
                        that.lassoMode = false;
                        $(this).addClass('opac');
                    },
                    resize:  function (e, ui) {
                        // correct size
                        $(this).width(ui.originalSize.width);
                    },
                    stop: function (e, ui) {
                        var el = $(this),
                            obj = _.cid(el.attr('data-cid')),
                            tmpTS = that.getTimeFromDateTag($(this).parent().attr('date'), true) + that.getTimeFromPos(el.position().top);
                        that.lassoMode = true;
                        el.removeClass('opac');
                        
                        if (el.position().top !== ui.originalPosition.top) {
                            _.extend(obj, {
                                start_date: tmpTS,
                                ignore_conflicts: true
                            });
                        } else if (el.height() !== ui.originalSize.height) {
                            _.extend(obj, {
                                end_date: tmpTS + that.getTimeFromPos(el.outerHeight()),
                                ignore_conflicts: true
                            });
                        }
                        el.busy();
                        that.trigger('updateAppointment', obj);
                    }
                });
            // define drop areas for normal appointments
            $('.day').droppable({
                drop: function (e, ui) {
                    var cid = ui.draggable.attr('data-cid'),
                        app = that.collection.get(cid).attributes;
                    if (!app.full_time) {
                        var obj = _.cid(cid),
                            startTS = that.getTimeFromDateTag($(e.target).attr('date'), true) + that.getTimeFromPos(ui.position.top);
                        $(this).append(ui.draggable.css({left: 0}));
                        _.extend(obj, {
                            start_date: startTS,
                            end_date: startTS + (app.end_date - app.start_date),
                            ignore_conflicts: true
                        });
                        that.trigger('updateAppointment', obj);
                    }
                }
            });
            
            // init drag and resize widget on appointments
            $('.fulltime>.appointment.modify')
                .draggable({
                    grid: [colWidth, 0],
                    axis: 'x',
                    scroll: true,
                    snap: '.day',
                    opacity: 0.4,
                    zIndex: 2,
                    start: function (e, ui) {
                        that.lassoMode = false;
                        that.onEnterAppointment(e);
                    },
                    stop: function (e, ui) {
                        that.lassoMode = true;
                        $(this).busy();
                        var newPos = Math.round($(this).position().left / (that.fulltimePane.width() / that.columns)),
                            startTS = that.curTimeUTC + (newPos * date.DAY),
                            cid = $(this).attr('data-cid'),
                            app = that.collection.get(cid).attributes,
                            obj = _.cid(cid);
                        _.extend(obj, {
                            start_date: startTS,
                            end_date: startTS + (app.end_date - app.start_date),
                            ignore_conflicts: true
                        });
                        that.trigger('updateAppointment', obj);
                    }
                })
                .resizable({
                    grid: [colWidth, 0],
                    minWidth: colWidth,
                    handles: "w, e",
                    containment: "parent",
                    start: function (e, ui) {
                        that.lassoMode = false;
                        $(this).addClass('opac').css('zIndex', $(this).css('zIndex') + 2000);
                    },
                    resize:  function (e, ui) {
                    },
                    stop: function (e, ui) {
                        that.lassoMode = true;
                        var el = $(this),
                            cid = el.attr('data-cid'),
                            app = that.collection.get(cid).attributes,
                            obj = _.cid(cid),
                            newDayCount = Math.round(el.outerWidth() / (that.fulltimePane.width() / that.columns));
                        el.removeClass('opac').css('zIndex', $(this).css('zIndex') - 2000);
                        
                        if (el.position().left !== ui.originalPosition.left) {
                            _.extend(obj, {
                                start_date: app.end_date - (newDayCount * date.DAY),
                                ignore_conflicts: true
                            });
                        } else if (el.width() !== ui.originalSize.width) {
                            _.extend(obj, {
                                end_date: app.start_date + (newDayCount * date.DAY),
                                ignore_conflicts: true
                            });
                        }
                        el.busy();
                        that.trigger('updateAppointment', obj);
                    }
                });
 
        },

        renderAppointment: function (a) {

            myself = myself || config.get('identifier');
            console.log(
                'myself',
                folder.can('write', this.folder, a),
                folder.can('delete', this.folder, a)
            );
            
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
                        .append($('<div>').addClass('title').text(a.title))
                        .append($('<div>').addClass('location').text(a.location || ''))
                );
        },

        roundToGrid: function (pos, typ) {
            switch (typ) {
            case 'top':
                return pos - pos % this.gridHeight();

            case 'bottom':
                return pos + pos % this.gridHeight();

            default:
                return Math.round(pos / this.gridHeight()) * this.gridHeight();
            }
        },
        
        calcPos: function (ap) {
            var start = new date.Local(ap.pos.start),
                end = new date.Local(ap.pos.end),
                that = this,
                calc = function (d) {
                    return (d.getHours() / 24 + d.getMinutes() / 1440) * that.height();
                },
                s = calc(start);
            return {
                start: s,
                lenght: Math.max(calc(end) - s, that.gridHeight()) - 1
            };
        },
        
        getTimeFromDateTag: function (days, utc)  {
            if (utc) {
                return date.Local.utc(this.curTimeUTC + (days * date.DAY));
            }
            return this.curTimeUTC + (days * date.DAY);
        },
        
        getTimeFromPos: function (pos) {
            return Math.max(0, this.roundToGrid(pos) / this.height() * date.DAY);
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
