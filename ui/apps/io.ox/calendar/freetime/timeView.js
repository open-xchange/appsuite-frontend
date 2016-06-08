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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/calendar/freetime/timeView', [
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'gettext!io.ox/calendar',
    'io.ox/calendar/api',
    'settings!io.ox/calendar',
    'io.ox/core/tk/datepicker'
], function (DisposableView, ext, gt, api, settings) {

    'use strict';

    var pointHeader = ext.point('io.ox/calendar/freetime/time-view-header'),
        pointBody = ext.point('io.ox/calendar/freetime/time-view-body'),
        availabilityClasses = {
            1: 'reserved',
            2: 'temporary',
            3: 'absent',
            4: 'free'
        };

    // header
    pointHeader.extend({
        id: 'toolbar',
        index: 100,
        draw: function (baton) {
            var info  = $('<a href="#" tabindex="1" class="info">').on('click', $.preventDefault).attr({
                    'aria-label': gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.')
                }),
                fillInfo = function () {
                    info.empty().append(
                        $('<span>').text(
                            gt.noI18n(
                                baton.model.get('currentDay').format('ddd, l')
                            )
                        ),
                        $.txt(' '),
                        $('<span class="cw">').text(
                            //#. %1$d = Calendar week
                            gt('CW %1$d', moment(baton.model.get('currentDay')).day(1).isoWeek())
                        ),
                        $('<i>').addClass('fa fa-caret-down fa-fw').attr({ 'aria-hidden': true })
                    );
                };

            fillInfo();
            baton.model.on('change:currentDay', fillInfo);

            //append datepicker
            info.datepicker({ parentEl: this }).on('changeDate', function (e) {
                baton.view.setDate(e.date.getTime());
            })
            .on('show', function () {
                $(this).datepicker('update', new Date(baton.model.get('currentDay').valueOf()));
            });

            this.append($('<div class="toolbar">').append(
                $('<div class="controls-container">').append(
                    $('<a class="control prev" >').attr({
                        href: '#',
                        tabindex: 1,
                        role: 'button',
                        title: gt('Previous Day'),
                        'aria-label': gt('Previous Day')
                    })
                    .append($('<i class="fa fa-chevron-left" aria-hidden="true">')),
                    $('<a class="control today" >').attr({
                        href: '#',
                        tabindex: 1,
                        role: 'button',
                        title: gt('Today'),
                        'aria-label': gt('Today')
                    })
                    .append($('<i class="fa fa-circle" aria-hidden="true">')),
                    $('<a class="control next" >').attr({
                        href: '#',
                        tabindex: 1,
                        role: 'button',
                        title: gt('Next Day'),
                        'aria-label': gt('Next Day')
                    })
                    .append($('<i class="fa fa-chevron-right" aria-hidden="true">'))
                ),
                info
            ));
        }
    });

    // timeline
    pointHeader.extend({
        id: 'timeline',
        index: 200,
        draw: function (baton) {

            var time = moment().startOf('hour'),
                worktimeStart = parseInt(settings.get('startTime', 8), 10),
                worktimeEnd = parseInt(settings.get('endTime', 18), 10),
                sections = [];

            for (var i = baton.model.get('startHour'); i <= baton.model.get('endHour'); i++) {
                time.hours(i);
                sections.push($('<span class="freetime-hour">').text(time.format('LT')).val(i - baton.model.get('startHour'))
                    .addClass(i === worktimeEnd || i === worktimeStart ? 'working-hour' : ''));
            }
            baton.view.headerNodeRow2.append($('<div class="freetime-timeline">').append(sections));
        }
    });

    // timetable
    pointBody.extend({
        id: 'timetable',
        index: 100,
        draw: function (baton) {
            var time = moment().startOf('hour'),
                worktimeStart = parseInt(settings.get('startTime', 8), 10),
                worktimeEnd = parseInt(settings.get('endTime', 18), 10),
                cells = [];

            for (var i = baton.model.get('startHour'); i <= baton.model.get('endHour'); i++) {
                time.hours(i);
                cells.push($('<span class="freetime-table-cell">').val(i - baton.model.get('startHour'))
                           .addClass(i === worktimeEnd || i === worktimeStart ? 'working-hour' : ''));
            }
            // don't use jquerys outerwidth here (rounds to full pixels)
            this.append($('<div class="freetime-table">').css('width', window.getComputedStyle(baton.view.headerNodeRow2[0]).width)
                    .append($('<div class="freetime-time-table">').append(cells)
                ));
        }
    });

    // lasso
    pointBody.extend({
        id: 'lasso',
        index: 200,
        draw: function (baton) {
            var table = this.find('.freetime-table');
            if (!baton.view.lassoNode) {
                baton.view.lassoNode = $('<div class="freetime-lasso striped">').hide();
            }
            table.append(baton.view.lassoNode);
            // update lasso status
            baton.view.updateLasso();
        }
    });

    // appointments
    pointBody.extend({
        id: 'appointments',
        index: 300,
        draw: function (baton) {
            var table = $('<div class="appointments">').appendTo(this.find('.freetime-table')),
                start = moment(baton.model.get('currentDay')).add(baton.model.get('startHour'), 'hours').valueOf(),
                end = moment(start).add(baton.model.get('endHour') - baton.model.get('startHour') + 1, 'hours').valueOf(),
                tootltipContainer = baton.view.headerNodeRow1.parent().parent().parent(),
                difference = end - start;

            _(baton.model.get('participants').models).each(function (participant) {
                var participantTable = $('<div class="appointment-table">').appendTo(table);

                _(baton.model.get('appointments')[participant.get('id')]).each(function (appointment) {
                    var left = (Math.trunc((Math.max(0, (appointment.start_date - start) / difference)) * 10000) / 100),
                        right = (Math.trunc((Math.max(0, (end - appointment.end_date) / difference)) * 10000) / 100),
                        appointmentNode = $('<div class="appointment">')
                            .addClass(availabilityClasses[appointment.shown_as])
                            .css({ left: left + '%', right: right + '%' });

                    if (appointment.title) {
                        appointmentNode.append($('<div class="title">').text(gt.noI18n(appointment.title)))
                            .attr({
                                title: appointment.title,
                                'aria-label': appointment.title,
                                'data-toggle': 'tooltip'
                            })
                            .tooltip({ container: tootltipContainer });
                    }
                    if (appointment.full_time) {
                        appointmentNode.addClass('fulltime');
                    }

                    participantTable.append(appointmentNode);
                });
            });
        }
    });

    //
    // timeview. Subview of freetimeview to show the current day and the participants appointments
    //

    return DisposableView.extend({

        className: 'freetime-time-view',

        initialize: function (options) {
            var self = this,
                resize = function () {
                    self.bodyNode.find('.freetime-table').css('width', window.getComputedStyle(self.headerNodeRow2[0]).width);
                };

            this.pointHeader = pointHeader;
            this.pointBody = pointBody;
            this.headerNodeRow1 = $('<div class="freetime-time-view-header row1">')
                .delegate('.control.next,.control.prev,.control.today', 'click', self.onControlView.bind(this));
            this.headerNodeRow2 = $('<div class="freetime-time-view-header row2">')
                .delegate('.freetime-hour', 'click', self.onSelectHour.bind(this));
            this.bodyNode = $('<div class="freetime-time-view-body">')
                .delegate('.freetime-table', 'mousedown', self.onMouseDown.bind(this))
                .delegate('.freetime-table', 'mouseup', self.onMouseUp.bind(this))
                .delegate('.freetime-table', 'mousemove', self.onMouseMove.bind(this))
                .delegate('.freetime-table-cell', 'dblclick', self.onSelectHour.bind(this));

            // add some listeners
            $(window).on('resize', resize);
            this.on('dispose', function () {
                $(window).off('resize', resize);
            });

            this.model.get('participants').on('add reset remove', self.getAppointments.bind(this));
            this.model.on('change:currentDay', self.getAppointments.bind(this));
            this.model.on('change:appointments', self.renderBody.bind(this));

            // calculate 15min grid for lasso
            this.grid = 100 / ((this.model.get('endHour') - this.model.get('startHour') + 1) * 4);

            // preselect lasso
            if (options.parentModel && options.parentModel.get('start_date') !== undefined && options.parentModel.get('end_date') !== undefined) {
                this.lassoStart = this.timeToPosition(options.parentModel.get('start_date'));
                this.lassoEnd = this.timeToPosition(options.parentModel.get('end_date'));
            }
        },

        renderHeader: function () {
            var baton = new ext.Baton({ view: this, model: this.model });
            this.headerNodeRow1.empty();
            this.headerNodeRow2.empty();
            this.pointHeader.invoke('draw', this.headerNodeRow1, baton);
        },

        renderBody: function () {
            if (this.model.get('participants').length !== _(this.model.get('appointments')).keys().length) {
                this.getAppointments();
            } else {
                var baton = new ext.Baton({ view: this, model: this.model });
                this.bodyNode.empty();
                this.pointBody.invoke('draw', this.bodyNode, baton);
            }
        },

        // use throttle because participants can change rapidly if groups or distributionlists are resolved
        getAppointments: _.throttle(function () {
            // render busy animation
            this.bodyNode.busy(true);
            // get fresh appointments
            var self = this,
                start = moment(this.model.get('currentDay')).add(this.model.get('startHour'), 'hours'),
                end = moment(start).add(this.model.get('endHour') - this.model.get('startHour'), 'hours'),
                participants = this.model.get('participants').toJSON(),
                appointments = {};

            return api.freebusy(participants, { start: start.valueOf(), end: end.valueOf() }).done(function (items) {
                for (var i = 0; i < participants.length; i++) {
                    appointments[participants[i].id] = items[i] ? items[i].data : [];
                }
                // remove busy animation again
                self.bodyNode.idle();
                self.model.set('appointments', appointments);
            });
        }, 150),

        onSelectHour: function (e) {
            var index = parseInt($(e.target).val(), 10),
                width = 100 / (this.model.get('endHour') - this.model.get('startHour') + 1);
            this.lassoStart = index * width;
            this.lassoEnd = (index + 1) * width;
            this.updateLasso();
        },

        // utility function to get the position in percent for a given time
        timeToPosition: function (timestamp) {
            var start = moment(this.model.get('currentDay')).add(this.model.get('startHour'), 'hours'),
                end = moment(start).add(this.model.get('endHour') - this.model.get('startHour') + 1, 'hours'),
                relative = timestamp - start.valueOf();

            if (relative < 0) {
                return 0;
            }

            return Math.min(1, relative / (end.valueOf() - start.valueOf())) * 100;
        },

        setToGrid: function (coord) {
            return this.grid * (Math.round(coord / this.grid));
        },

        updateLasso: function () {
            if (this.lassoNode) {
                if (this.lassoStart !== undefined) {
                    var width, start;
                    if (this.lassoStart === this.lassoEnd || this.lassoEnd === undefined) {
                        if (this.lassoEnd === undefined || this.lassoStart < this.lassoEnd) {
                            start = this.lassoStart;
                        } else {
                            start = this.lassoEnd;
                        }
                        width = 2;
                        this.lassoNode.css({ left: start + '%', width: width + 'px' });
                    } else {
                        if (this.lassoStart < this.lassoEnd) {
                            start = this.lassoStart;
                            width = this.lassoEnd - start;
                        } else {
                            start = this.lassoEnd;
                            width = this.lassoStart - start;
                        }
                        this.lassoNode.css({ left: start + '%', width: width + '%' });
                    }

                    this.lassoNode.show();
                } else {
                    this.lassoNode.hide();
                }
            }
        },

        onMouseMove: function (e) {
            if (!this.lasso) {
                return;
            }

            if (!e.buttons) {
                this.onMouseUp(e);
                return;
            }
            //currentTarget is always .freetime-table
            var currentTarget = $(e.currentTarget);
            // don't use e.OffsetX because it uses the offset relative to child elements too (in this case appointments)
            this.lassoEnd = this.setToGrid(((e.pageX - currentTarget.offset().left) / currentTarget.outerWidth()) * 100);
            this.updateLasso();
        },

        onMouseDown: function (e) {
            this.lasso = true;
            //currentTarget is always .freetime-table
            var currentTarget = $(e.currentTarget);
            // don't use e.OffsetX because it uses the offset relative to child elements too (in this case appointments)
            this.lassoStart = this.setToGrid(((e.pageX - currentTarget.offset().left) / currentTarget.outerWidth()) * 100);
            this.lassoEnd = undefined;
            this.updateLasso();
        },

        onMouseUp: function (e) {
            if (this.lasso) {
                //currentTarget is always .freetime-table
                var currentTarget = $(e.currentTarget);
                // don't use e.OffsetX because it uses the offset relative to child elements too (in this case appointments)
                this.lassoEnd = this.setToGrid(((e.pageX - currentTarget.offset().left) / currentTarget.outerWidth()) * 100);
                // if lassoStart and lassoEnd are the same we remove the lasso on mouseUp
                if (this.lassoEnd === this.lassoStart) {
                    this.lassoEnd = this.lassoStart = undefined;
                }
                this.updateLasso();

                this.lasso = false;
            }
        },

        createAppointment: function () {
            if (this.lassoStart !== this.lassoEnd && this.lassoStart !== undefined && this.lassoEnd !== undefined) {
                var timelineStart = moment(this.model.get('currentDay')).add(this.model.get('startHour'), 'hours').valueOf(),
                    timelineEnd = moment(timelineStart).add(this.model.get('endHour') - this.model.get('startHour') + 1, 'hours').valueOf(),
                    difference = timelineEnd - timelineStart,
                    lassoStart = Math.min(this.lassoStart, this.lassoEnd),
                    lassoEnd = Math.max(this.lassoStart, this.lassoEnd),
                    startTime = timelineStart + (lassoStart / 100) * difference,
                    endTime = timelineStart + (lassoEnd / 100) * difference,
                    participants = this.model.get('participants').map(function (model) {
                        var tempParticipant = { id: model.get('id'), type: model.get('type') };
                        if (model.get('type') === 5) {
                            // External participants need more data for an appointment
                            tempParticipant.id = tempParticipant.mail = model.getTarget();
                            tempParticipant.display_name = model.getDisplayName();
                            tempParticipant.image1_url = model.get('image1_url');
                        }
                        return tempParticipant;
                    });

                //round to full minutes
                startTime = moment.utc(startTime).startOf('minute').valueOf();
                endTime = moment.utc(endTime).startOf('minute').valueOf();

                return {
                    start_date: startTime,
                    end_date: endTime,
                    full_time: false,
                    participants: participants
                };
            }
        },

        setDate: function (option) {
            var day  = moment(this.model.get('currentDay'));

            if (_.isString(option)) {
                switch (option) {
                    case 'prev':
                        day.subtract(1, 'days');
                        break;
                    case 'next':
                        day.add(1, 'days');
                        break;
                    case 'today':
                        day = moment();
                        break;
                    // no default
                }
            } else if (_.isNumber(option)) {
                day = moment(option);
            }
            day.startOf('day');
            this.model.set('currentDay', day);
        },

         /**
         * handler for clickevents in toolbar
         * @param  { MouseEvent } e Clickevent
         */
        onControlView: function (e) {
            e.preventDefault();
            var currentTarget = $(e.currentTarget);

            if (currentTarget.hasClass('next')) {
                this.setDate('next');
            }
            if (currentTarget.hasClass('prev')) {
                this.setDate('prev');
            }
            if (currentTarget.hasClass('today')) {
                this.setDate('today');
            }
            this.trigger('onRefresh');
        }
    });
});
