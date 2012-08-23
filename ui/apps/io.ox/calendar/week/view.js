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
     'less!io.ox/calendar/week/style.css'], function (util, tmpl, date, config, gt) {

    'use strict';

    var myself = null;

    var View = Backbone.View.extend({

        className:      'week',
        
        columns:        7,      // default value for day columns
        fragmentation:  2,      // fragmentation of a hour
        cellHeight:     25,     // height of one single fragment in px
        appWith:        97,     // max width of an appointment in %
        overlap:        0.4,    // visual overlap of appointments [0.0 - 1.0]
        workStart:      8,      // full hour for start position of worktime marker
        workEnd:        18,     // full hour for end position of worktime marker
        startDay:       1,      // weekday starting with 0 sunday
        slots:          24,     // amount of shown timeslots
        
        pane:           $(),    // main scroll pane
        fulltimePane:   $(),    // fulltime appointments pane
        week:           [],     // week scaffold
        timeline:       $(),    // timeline
        tlInterval:     {},     // timeline interval
        
        events: {
            'click .appointment': 'onClickAppointment'
        },

        initialize: function (options) {
            this.columns = options.columns;
            this.week = util.getWeekScaffold(options.startDate);
            this.collection.on('reset', this.renderAppointments, this);
            
//            require(["io.ox/core/tk/dialogs", "io.ox/calendar/view-detail"])
//                .done(function (dialogs, view) {
//                    new dialogs.SidePopup({ modal: true })
//                        .delegate(this.$el, ".appointment", function (popup) {
//                            var data = $(this).data("appointment");
//                            popup.append(view.draw(data));
//                            data = null;
//                        });
//                });
        },

        onClickAppointment: function (e) {
            var target = $(e.currentTarget),
                cid = target.attr('data-cid'),
                obj = _.cid(target.attr('data-cid'));
            this.$el.find('.appointment').addClass('opac');
            this.$el.find('.appointment.current').removeClass('current');
            $('[data-cid="' + cid + '"]').removeClass('opac').addClass('current');
            this.trigger('showAppoinment', e, obj);
        },

        render: function () {
            // create scaffold
            var days = date.locale.days;
            days = days.slice(this.startDay).concat(days.slice(0, this.startDay)).slice(0, this.columns);

            var scaffold = tmpl.render('scaffold', {days: days, width: 100 / this.columns + '%'});
            this.pane = scaffold.find('.scrollpane');
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
            this.timeline = $('<div>').addClass('timeline').append($('<div>').addClass('glow'));
            this.renderTimeline(this.timeline);
            this.tlInterval = setInterval(this.renderTimeline, 60000, this.timeline);
            container.append(this.timeline);
            
            // create days
            for (var d = 0; d < this.columns; d++) {
                
                var dayInfo = this.week[d],
                    day = $('<div>').addClass('day').width(100 / this.columns + '%').attr('date', dayInfo.year + '-' + (dayInfo.month + 1) + '-' + dayInfo.date);
                
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
            tl.css({ top: ((d.getHours() * 60 + d.getMinutes()) / (24 * 60) * 100) + '%'});
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
            
            var draw = {};
            
            // loop over all appointments to split and create divs
            this.collection.each(function (model) {

                var startDate = new date.Local(date.Local.utc(model.get('start_date'))),
                    endDate = new date.Local(date.Local.utc(model.get('end_date') - 1)),
                    start = startDate.format('y-M-d'),
                    end = endDate.format('y-M-d'),
                    maxCount = 7;

                if (model.get('start_date') < 0) {
                    console.error('FIXME: start_date should not be negative');
                    throw 'FIXME: start_date should not be negative';
                }

                if (model.get('full_time')) {
                    var app = this.renderAppointment(model.attributes);
                    app.css({
                        width: (100 / this.columns * 3) + '%'
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
                            endDate = new date.Local(date.Local.utc(model.get('end_date') - 1));
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
                        }
                    }
                    
                    if (!found) {
                        colPos.push(e[j].pos.end);
                        e[j].pos.index = colPos.length - 1;
                    }
                }
                
                var width = (that.appWith / colPos.length),
                    elWidth = Math.min(width * (1 + (that.overlap * (colPos.length - 1))), that.appWith);

                // loop over all appointments to draw them
                for (var j = 0; j < e.length; j++) {
                    var pos = that.calcPos(e[j]),
                        leftWidth = ((that.appWith - elWidth) / (colPos.length - 1)) * e[j].pos.index;
                    
                    e[j].css({
                        top: pos.start + '%',
                        minHeight: that.cellHeight + 'px',
                        maxWidth: that.appWith + '%',
                        left: leftWidth + '%'
                    })
                    .height(pos.lenght + '%')
                    .width(elWidth + '%');
                }
                that.$(i).append(e);
                
            });
            
        },
        
        calcPos: function (ap) {
            var start = new date.Local(ap.pos.start),
                end = new date.Local(ap.pos.end),
                calc = function (d) {
                    return (d.getHours() * 60 + d.getMinutes()) / (24 * 60) * 100;
                },
                s = calc(start);
            
            return {
                start: s,
                lenght: calc(end) - s
            };
        }
        
    });

    return View;
});
