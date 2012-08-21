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

    function formatDate(d) {
        return d.getUTCFullYear() + '-' + d.getUTCMonth() + '-' + d.getUTCDate();
    }

    var myself = null;

    var View = Backbone.View.extend({

        className:      'week',
        
        columns:        7,      // day columns
        fragmentation:  2,      // fragmentation of a hour
        cellHeight:     25,     // height of one single fragment in px
        appWith:        97,     // max width of an appointment in %
        overlap:        0.3,    // visual overlap of appointments
        workStart:      8,      // full hour for start position of worktime marker
        workEnd:        18,     // full hour for end position of worktime marker
        startDay:       1,      // weekday starting with 0 sunday
        slots:          24,     // amount of shown timeslots
        
        pane:           $(),    // main scroll pane
        week:           [],     // week scaffold
        
        events: {
            'click .appointment': 'onClickAppointment'
        },

        initialize: function (options) {
            this.columns = options.columns;
            this.week = util.getWeekScaffold(options.startDate);
            this.collection.on('reset', this.renderAppointments, this);
        },

        onClickAppointment: function (e) {
            var obj = _.cid($(e.currentTarget).attr('data-cid'));
            this.trigger('showAppoinment', e, obj);
        },

        render: function () {
//            console.log('v.render', this);
                
            // create scaffold
//            console.log(date);
            var days = date.locale.days;
            days = days.slice(this.startDay).concat(days.slice(0, this.startDay)).slice(0, this.columns);

            var scaffold = tmpl.render('scaffold', {days: days, width: 100 / this.columns + '%'});
            this.pane = scaffold.find('.scrollpane');
            
            // create timelabels
            var timeLabel = $('<div>').addClass('lable');
            for (var i = 1; i <= this.slots; i++) {
                timeLabel.append(tmpl.render('time', {lable: (i < 10 ? '0' + i : i) + '.00'}).height(this.cellHeight * this.fragmentation));
            }
            this.pane.append(timeLabel);
            
            // create days
            var container = $('<div>').addClass('container');
            
            for (var d = 0; d < this.columns; d++) {
                
                var dayInfo = this.week[d];
                
                var day = $('<div>').addClass('day').width(100 / this.columns + '%').attr('date', dayInfo.year + '-' + dayInfo.month + '-' + dayInfo.date);
                
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
            
            // loop over all appointments
            this.collection.each(function (model) {
                console.log('Termin', model);
                
                var startDate = new Date(model.get('start_date')),
                    endDate = new Date(model.get('end_date') - 1),
                    start = formatDate(startDate),
                    end = formatDate(endDate),
                    copy = _.copy(model.attributes, true);

                if (model.get('start_date') < 0) {
                    console.error('FIXME: start_date should not be negative');
                    throw 'FIXME: start_date should not be negative';
                }

                // FIXE ME: just to make it work and safe
                var maxCount = 7;
                // draw across multiple days
                while (true && maxCount) {
                    maxCount--;
                    if (start !== end) {
                        endDate = new Date(copy.start_date);
                        endDate.setUTCHours(23, 59, 59, 999);
                    } else {
                        endDate = new Date(copy.end_date);
                    }
                    
                    var vPos = this.calcVPos(startDate, endDate),
                        hPos = this.calcHPos(model.id, copy.start_date, endDate.getTime()),
                        width = (this.appWith / hPos.fragmentation),
                        appointment = this
                            .renderAppointment(copy)
                            .css({
                                top: vPos.start + '%',
                                minHeight: this.cellHeight + 'px',
                                maxWidth: this.appWith + '%',
                                left: ((width - (width * this.overlap)) * (hPos.index)) + '%'
                            })
                            .height(vPos.lenght + '%')
                            .width((width + (width * this.overlap)) + '%');
                    
                    console.log('frag / index / start / lenght', hPos.fragmentation, hPos.index, vPos.start, vPos.lenght, width);
                    
                    this
                        .$('[date="' + start + '"]')
                        .append(appointment);
                    
                    // inc date
                    if (start !== end) {
                        copy.start_date += date.DAY;
                        var d = new Date(copy.start_date);
                        d.setUTCHours(0, 0, 0, 0);
                        copy.start_date = d.getTime();
                        startDate = d;
                        start = formatDate(d);
                    } else {
                        break;
                    }
                }
            }, this);
        },
        
        calcVPos: function (d1, d2) {
            var calc = function (d) {
                    return (d.getUTCHours() * 60 + d.getUTCMinutes()) / (24 * 60) * 100;
                },
                s = calc(d1);
            return {
                start: s,
                lenght: calc(d2) - s
            };
        },
        
        calcHPos: function (id, as, ae) {
            var frag = 1,
                index = 0;
            this.collection.each(function (m, i) {
                if (id !== m.id) {
                    var ms = m.get('start_date'),
                        me = m.get('end_date');
                    //console.log(m, i, id, new Date(as), new Date(ae), (as >= ms && as <= me), (ae >= ms && ae <= me), (as <= ms && ae >= me), (as >= ms && as <= me) || (ae >= ms && ae <= me) || (as <= ms && ae >= me));
                    if ((as >= ms && as <= me) || (ae >= ms && ae <= me) || (as <= ms && ae >= me)) {
                        frag++;
                    }
                } else {
                    index = frag - 1;
                }
            }, this);
            return {
                fragmentation: frag,
                index: index
            };
        }
        
    });

    return View;
});
