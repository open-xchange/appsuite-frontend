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
    'io.ox/backbone/mini-views/dropdown',
    'settings!io.ox/calendar',
    'io.ox/calendar/util',
    'io.ox/backbone/views/datepicker'
], function (DisposableView, ext, gt, api, Dropdown, settings, util, DatePicker) {

    'use strict';

    var pointHeader = ext.point('io.ox/calendar/freetime/time-view-header'),
        pointBody = ext.point('io.ox/calendar/freetime/time-view-body'),
        availabilityClasses = {
            1: 'reserved',
            2: 'temporary',
            3: 'absent',
            4: 'free'
        },
        zIndexbase = {
            free: 0,
            temporary: 1000,
            reserved: 2000,
            absent: 3000
        };

    // header
    pointHeader.extend({
        id: 'toolbar',
        index: 100,
        draw: function (baton) {
            var info  = $('<a href="#" class="info">').on('click', $.preventDefault).attr({
                    'aria-label': gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.')
                }),
                fillInfo = function () {
                    info.empty().append(
                        $('<span>').text(
                            gt.noI18n(
                                baton.model.get('currentWeek').formatInterval(moment(baton.model.get('currentWeek')).add(6, 'days'))
                            )
                        ),
                        $.txt(' '),
                        $('<span class="cw">').text(
                            //#. %1$d = Calendar week
                            gt('CW %1$d', moment(baton.model.get('currentWeek')).isoWeek())
                        ),
                        $('<i>').addClass('fa fa-caret-down fa-fw').attr({ 'aria-hidden': true })
                    );
                };

            fillInfo();
            baton.model.on('change:currentWeek', fillInfo);

            // append datepicker
            new DatePicker({ parent: this.closest('.modal,#io-ox-core') })
                .attachTo(info)
                .on('select', function (date) {
                    baton.view.setDate(date.valueOf());
                })
                .on('before:open', function () {
                    this.setDate(baton.model.get('currentWeek'));
                });

            this.append(
                $('<span class="controls-container">').append(
                    $('<a class="control prev" >').attr({
                        href: '#',
                        role: 'button',
                        title: gt('Previous Day'),
                        'aria-label': gt('Previous Day')
                    })
                    .append($('<i class="fa fa-chevron-left" aria-hidden="true">')),
                    // let's try a first round without today button
                    // don't know how important that is; date picker offers today anyway
                    // $('<a class="control today" >').attr({
                    //     href: '#',
                    //     role: 'button',
                    //     title: gt('Today'),
                    //     'aria-label': gt('Today')
                    // })
                    // .append($('<i class="fa fa-circle" aria-hidden="true">')),
                    $('<a class="control next" >').attr({
                        href: '#',
                        role: 'button',
                        title: gt('Next Day'),
                        'aria-label': gt('Next Day')
                    })
                    .append($('<i class="fa fa-chevron-right" aria-hidden="true">'))
                ),
                info
            );
        }
    });

    pointHeader.extend({
        id: 'options',
        index: 200,
        draw: function (baton) {
            var dropdown = new Dropdown({ keep: true, caret: true, model: baton.model, label: gt('Options'), tagName: 'span' })
                .header(gt('Zoom'))
                .option('zoom', '100', gt.noI18n('100%'), { radio: true })
                .option('zoom', '200', gt.noI18n('200%'), { radio: true })
                .option('zoom', '400', gt.noI18n('400%'), { radio: true })
                .option('zoom', '1000', gt.noI18n('1000%'), { radio: true })
                .divider()
                .header(gt('Rows'))
                .option('compact', true, gt('Compact'))
                .divider()
                .header(gt('Appointment types'))
                .option('showFree', true, gt('Free'))
                .option('showTemporary', true, gt('Temporary'))
                .option('showReserved', true, gt('Reserved'))
                .option('showAbsent', true, gt('Absent'))
                .divider()
                .option('onlyWorkingHours', true, gt('Hide non-working time'));

            baton.view.headerNodeRow1.append(
                // pull right class needed for correct dropdown placement
                dropdown.render().$el.addClass('options pull-right').attr('data-dropdown', 'options')
            );
        }
    });

    // timeline
    pointHeader.extend({
        id: 'timeline',
        index: 300,
        draw: function (baton) {
            var day = moment(baton.model.get('currentWeek')).startOf('day'),
                today = moment().startOf('day'),
                node;
            baton.view.headerNodeRow2.append(node = $('<div class="freetime-timeline">'));
            for (var counter = 0; counter < 7; counter++) {
                var time = moment().startOf('hour'),
                    worktimeStart = parseInt(settings.get('startTime', 8), 10),
                    worktimeEnd = parseInt(settings.get('endTime', 18), 10),
                    start = baton.model.get('onlyWorkingHours') ? baton.model.get('startHour') : 0,
                    end = baton.model.get('onlyWorkingHours') ? baton.model.get('endHour') : 23,
                    sections = [],
                    dayLabel = $('<div class="day-label-wrapper">').append($('<div class="day-label">').addClass(day.day() === 0 || day.day() === 6 ? 'weekend' : '').text(day.format('ddd, ll'))),
                    dayNode;

                node.append($('<div class=timeline-day>').addClass(today.valueOf() === day.valueOf() ? 'today' : '').append($('<div class="daylabel-container">')
                    .addClass(counter === 0 ? 'first' : '').append(
                    dayLabel,
                    dayLabel.clone().addClass('level-2'),
                    dayLabel.clone().addClass('level-1'),
                    dayLabel.clone().addClass('level-2')),
                dayNode = $('<div class="day-hours">')));

                for (var i = start; i <= end; i++) {
                    time.hours(i);
                    var timeformat = time.format('LT').replace('AM', 'a').replace('PM', 'p');
                    sections.push($('<span class="freetime-hour">').text(timeformat).val(counter * (end - start + 1) + (baton.model.get('onlyWorkingHours') ? i - baton.model.get('startHour') : i))
                        .addClass(i === start ? 'day-start' : '')
                        .addClass(i === start && counter === 0 ? 'first' : '')
                        .addClass(i === worktimeEnd || i === worktimeStart ? 'working-hour-start-end' : ''));
                }
                dayNode.append(sections);
                day.add(1, 'days');
            }
            baton.model.on('change:currentWeek', function () {
                var labels = node.find('.timeline-day'),
                    day = moment(baton.model.get('currentWeek')).startOf('day'),
                    today = moment().startOf('day');

                for (var i = 0; i <= labels.length; i++) {
                    $(labels[i]).toggleClass('today', day.valueOf() === today.valueOf()).find('.day-label').text(day.format('ddd, ll'));
                    day.add(1, 'days');
                }
            });
        }
    });

    // timetable
    pointBody.extend({
        id: 'timetable',
        index: 100,
        draw: function (baton) {
            var node, table, width,
                worktimeStart = parseInt(settings.get('startTime', 8), 10),
                worktimeEnd = parseInt(settings.get('endTime', 18), 10),
                start = baton.model.get('onlyWorkingHours') ? baton.model.get('startHour') : 0,
                end = baton.model.get('onlyWorkingHours') ? baton.model.get('endHour') : 23,
                time = moment(baton.model.get('currentWeek')).startOf('day'),
                today = moment().startOf('day');

            today.hours(start);

            this.append(table = $('<div class="freetime-table">').append(node = $('<div class="freetime-time-table">')));

            for (var counter = 0; counter < 7; counter++) {
                var cells = [];

                for (var i = start; i <= end; i++) {
                    time.hours(i);
                    cells.push($('<span class="freetime-table-cell">').val(counter * (end - start + 1) + (baton.model.get('onlyWorkingHours') ? i - baton.model.get('startHour') : i))
                               .addClass(i === worktimeEnd || i === worktimeStart ? 'working-hour-start-end' : '')
                               .addClass(i === start ? 'day-start' : '')
                               .addClass(time.valueOf() === today.valueOf() ? 'today' : '')
                               .addClass(i === start && counter === 0 ? 'first' : '')
                               .addClass(i <= baton.model.get('startHour') || i >= baton.model.get('endHour') ? 'non-working-hour' : ''));
                }
                node.append(cells);
                time.add(1, 'days');
            }
            width = node.children().length * 60 * (parseInt(baton.model.get('zoom'), 10) / 100);
            table.css('width', width + 'px');
            if (baton.view.keepScrollpos === 'today') {
                if (baton.view.headerNodeRow2.find('.today').length) {
                    var hours = (baton.model.get('onlyWorkingHours') ? baton.model.get('startHour') : 0);
                    baton.view.keepScrollpos = moment().hours(hours).startOf('hour').valueOf();
                } else {
                    delete baton.view.keepScrollpos;
                }
            }
            if (baton.view.keepScrollpos) {
                var scrollpos = baton.view.timeToPosition(baton.view.keepScrollpos) / 100 * width;
                table.parent().scrollLeft(scrollpos);
                if (baton.view.center) {
                    table.parent().scrollLeft(scrollpos - this.width() / 2);
                    delete baton.view.center;
                }
                delete baton.view.keepScrollpos;
            }
            // participantsview and timeview must be the same height or they scroll out off sync (happens when timeview has scrollbars)
            // use margin so resize event does not change things
            baton.view.parentView.participantsSubview.bodyNode.css('margin-bottom', baton.view.bodyNode[0].offsetHeight - baton.view.bodyNode[0].clientHeight + 'px');
        }
    });

    // lasso
    pointBody.extend({
        id: 'lasso',
        index: 200,
        draw: function (baton) {
            var table = this.find('.freetime-table');
            if (!baton.view.lassoNode) {
                baton.view.lassoNode = $('<div class="freetime-lasso">').hide();
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
                tooltipContainer = baton.view.headerNodeRow1.parent().parent().parent();

            _(baton.model.get('participants').models).each(function (participant) {
                var participantTable = $('<div class="appointment-table">').attr('data-value', participant.get('id')).appendTo(table);

                _(baton.model.get('appointments')[participant.get('id')]).each(function (appointment, index) {
                    var start = appointment.start_date,
                        end = appointment.end_date;
                    // fulltime appointments are timezone independent (birthday/holiday feature)
                    if (appointment.full_time) {
                        start = moment.utc(start).local(true).valueOf();
                        end = moment.utc(end).local(true).valueOf();
                    }
                    var left = baton.view.timeToPosition(start),
                        right = 100 - baton.view.timeToPosition(end),
                        appointmentNode = $('<div class="appointment">')
                            .addClass(availabilityClasses[appointment.shown_as])
                            .css({ left: left + '%', right: right + '%' });
                    appointmentNode.css('z-index', 1 + zIndexbase[availabilityClasses[appointment.shown_as]] + index + (appointment.full_time ? 0 : 4000));

                    if (appointment.title) {
                        appointmentNode.addClass(100 - right - left < baton.view.grid * 4 ? 'under-one-hour' : '').append($('<div class="title">').text(gt.noI18n(appointment.title)).append($('<span class="appointment-time">').text(util.getTimeInterval(appointment))))
                        .attr({
                            title: appointment.title,
                            'aria-label': appointment.title,
                            'data-toggle': 'tooltip'
                        }).tooltip({ container: tooltipContainer });
                    }
                    if (appointment.location && appointment.location !== '') {
                        appointmentNode.append($('<div class="location">').text(appointment.location)).addClass('has-location');
                    }

                    participantTable.append(appointmentNode);
                });
            });
            // timeviewbody and header must be the same width or they scroll out off sync (happens when timeviewbody has scrollbars)
            // use margin so resize event does not change things
            baton.view.headerNodeRow2.css('margin-right', baton.view.bodyNode[0].offsetWidth - baton.view.bodyNode[0].clientWidth - 1 + 'px');
        }
    });

    //
    // timeview. Subview of freetimeview to show the current day and the participants appointments
    //

    return DisposableView.extend({

        className: 'freetime-time-view',

        initialize: function (options) {
            var self = this;

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
                .delegate('.freetime-table-cell', 'dblclick', self.onSelectHour.bind(this))
                .on('scroll', self.onScroll.bind(this));

            // add some listeners
            this.model.get('participants').on('add reset', self.getAppointments.bind(this));
            // no need to fire a server request when removing a participant
            this.model.get('participants').on('remove', self.removeParticipant.bind(this));
            this.model.on('change:onlyWorkingHours', self.onChangeWorkingHours.bind(this));
            this.model.on('change:currentWeek', self.getAppointmentsInstant.bind(this));
            this.model.on('change:appointments', self.renderBody.bind(this));
            this.model.on('change:zoom', self.updateZoom.bind(this));
            this.model.on('change:showFree change:showTemporary change:showReserved change:showAbsent', self.updateVisibility.bind(this));

            this.parentView = options.parentView;

            // calculate 15min grid for lasso
            this.grid = 100 / ((this.model.get('onlyWorkingHours') ? (this.model.get('endHour') - this.model.get('startHour') + 1) : 24) * 28);

            // preselect lasso
            if (options.parentModel && options.parentModel.get('start_date') !== undefined && options.parentModel.get('end_date') !== undefined) {
                var start = options.parentModel.get('start_date'),
                    end = options.parentModel.get('end_date');
                // fulltime appointments are timezone independent (birthday/holiday feature)
                if (options.parentModel.get('full_time')) {
                    start = moment.utc(start).local(true).valueOf();
                    end = moment.utc(end).local(true).valueOf();
                }
                this.lassoStart = this.timeToPosition(start);
                this.lassoEnd = this.timeToPosition(end);
                this.keepScrollpos = start;
                this.center = true;
            }

            // must use start of week. Otherwise we get the wrong iso week in countries where the first day of the week is a sunday
            if (!options.parentModel && moment().startOf('week').isoWeek() === this.model.get('currentWeek').isoWeek()) {
                // special scrollposition on start
                this.keepScrollpos = 'today';
            }
            this.updateVisibility();
        },

        updateZoom: function () {
            var table = this.bodyNode.find('.freetime-table');
            if (table.length) {
                var nodes = table.find('.freetime-time-table').children().length,
                    oldWidth = table.width(),
                    oldScrollPos = table.parent().scrollLeft(),
                    newWidth = nodes * 60 * (parseInt(this.model.get('zoom'), 10) / 100);

                table.css('width', newWidth + 'px').parent().scrollLeft((oldScrollPos / oldWidth) * newWidth);
            }
        },
        updateVisibility: function () {
            this.bodyNode.toggleClass('showFree', this.model.get('showFree'))
                .toggleClass('showTemporary', this.model.get('showTemporary'))
                .toggleClass('showReserved', this.model.get('showReserved'))
                .toggleClass('showAbsent', this.model.get('showAbsent'));
        },
        onScroll: function () {
            this.headerNodeRow2.scrollLeft(this.bodyNode.scrollLeft());
        },

        onChangeWorkingHours: function () {
            this.grid = 100 / ((this.model.get('onlyWorkingHours') ? (this.model.get('endHour') - this.model.get('startHour') + 1) : 24) * 28);
            // correct lasso positions
            // use time based lasso positions to calculate because they is unaffected by display changes
            if (this.lassoNode && this.lassoStart) {
                this.lassoStart = this.timeToPosition(this.lassoStartTime);
                this.lassoEnd = this.timeToPosition(this.lassoEndTime);
                this.updateLasso();
            }

            var table = this.bodyNode.find('.freetime-table');
            if (table.length) {
                var oldWidth = table.width(),
                    oldScrollPos = table.parent().scrollLeft();
                this.keepScrollpos = this.positionToTime(oldScrollPos / oldWidth * 100, true);
            }

            this.renderHeader(true);
            this.getAppointmentsInstant();
        },

        renderHeader: function (onlyTimeline) {
            var baton = new ext.Baton({ view: this, model: this.model });
            this.headerNodeRow2.empty();
            if (onlyTimeline) {
                _(this.pointHeader.list()).findWhere({ id: 'timeline' }).invoke('draw', this.headerNodeRow1, baton);
            } else {
                this.headerNodeRow1.empty();
                this.pointHeader.invoke('draw', this.headerNodeRow1, baton);
            }
        },

        renderBody: function () {
            if (this.model.get('participants').length !== _(this.model.get('appointments')).keys().length) {
                this.getAppointmentsInstant();
            } else {
                var baton = new ext.Baton({ view: this, model: this.model });
                this.bodyNode.empty();
                this.pointBody.invoke('draw', this.bodyNode, baton);
            }
        },

        // use debounce because participants can change rapidly if groups or distributionlists are resolved
        getAppointments: _.debounce(function () { this.getAppointmentsInstant(true); }, 10),

        getAppointmentsInstant: function (addOnly) {
            // save scrollposition or it is lost when the busy animation is shown
            var oldWidth = this.bodyNode.find('.freetime-table').width(),
                oldScrollPos = this.bodyNode.scrollLeft();
            if (!this.keepScrollpos && oldWidth) {
                this.keepScrollpos = this.positionToTime(oldScrollPos / oldWidth * 100);
            }
            // render busy animation
            this.bodyNode.busy(true);
            // get fresh appointments
            var self = this,
                start,
                end,
                participants = this.model.get('participants').toJSON(),
                appointments = {};

            // no need to get appointments for every participant all the time
            if (addOnly === true) {
                var keys = _(self.model.get('appointments')).keys();
                participants = _(participants).filter(function (participant) {
                    return _(keys).indexOf(String(participant.id)) === -1;
                });
            }

            if (this.model.get('onlyWorkingHours')) {
                start = moment(this.model.get('currentWeek')).add(this.model.get('startHour'), 'hours');
                end = moment(start).add(6, 'days').add(this.model.get('endHour') - this.model.get('startHour'), 'hours');
            } else {
                start = moment(this.model.get('currentWeek')).startOf('day');
                end = moment(start).add(1, 'weeks');
            }

            return api.freebusy(participants, { start: start.valueOf(), end: end.valueOf() }).done(function (items) {
                if (addOnly === true) {
                    appointments = self.model.get('appointments');
                }
                var sorted;
                for (var i = 0; i < participants.length; i++) {
                    if (items [i]) {
                        // sort by start_date
                        sorted = _(items[i].data).sortBy('start_date');
                        appointments[participants[i].id] = sorted;
                    } else {
                        appointments[participants[i].id] = [];
                    }
                }
                // remove busy animation again
                self.bodyNode.idle();
                // set appointments silent, force trigger to redraw correctly. (normal setting does not trigger correctly when just switching times)
                self.model.set('appointments', appointments, { silent: true }).trigger('change:appointments');
            });
        },

        removeParticipant: function (model) {
            var node = this.bodyNode.find('.appointment-table[data-value="' + model.get('id') + '"]'),
                appointments = this.model.get('appointments');
            if (node.length) {
                node.remove();
                // timeviewbody and header must be the same width or they scroll out off sync (happens when timeviewbody has scrollbars)
                // use margin so resize event does not change things
                this.headerNodeRow2.css('margin-right', this.bodyNode[0].offsetWidth - this.bodyNode[0].clientWidth - 1 + 'px');
                // trigger scroll for lazyload
                this.parentView.participantsSubview.bodyNode.trigger('scroll');
            }
            delete appointments[model.get('id')];
            // silent or we would trigger a redraw
            this.model.set('appointments', appointments, { silent: true });
        },

        onSelectHour: function (e) {
            var index = parseInt($(e.target).val(), 10),
                width = 100 / (7 * (this.model.get('onlyWorkingHours') ? this.model.get('endHour') - this.model.get('startHour') + 1 : 24));
            this.lassoStart = index * width;
            this.lassoEnd = (index + 1) * width;
            this.updateLasso(true);
        },

        // utility function to get the position in percent for a given time
        timeToPosition: function (timestamp) {
            var start,
                end,
                day = 0,
                percent = 100 / 7,
                notOnScale = false;

            if (this.model.get('onlyWorkingHours')) {
                start = moment(this.model.get('currentWeek')).add(this.model.get('startHour'), 'hours');
                end = moment(start).add(this.model.get('endHour') - this.model.get('startHour') + 1, 'hours');
            } else {
                start = moment(this.model.get('currentWeek')).startOf('day');
                end = moment(start).add(1, 'days');
            }

            for (; day < 7; day++) {
                if (timestamp < start.valueOf()) {
                    notOnScale = true;
                    break;
                }
                if (timestamp < end.valueOf()) {
                    break;
                }
                // exception for last day
                if (day === 6 && timestamp > end.valueOf()) {
                    notOnScale = true;
                    day++;
                    break;
                }
                start.add(1, 'days');
                end.add(1, 'days');
            }

            return day * percent + (notOnScale ? 0 : ((timestamp - start.valueOf()) / (end.valueOf() - start.valueOf()) * percent));
        },

        // utility function, position is given in %
        // inverse is used to keep scrollposition, needs to calculate before change
        positionToTime: function (position, inverse) {
            var dayWidth = 100 / 7,
                fullDays = Math.floor(position / dayWidth),
                partialDay = position - dayWidth * fullDays,
                dayInMilliseconds = ((inverse ? !this.model.get('onlyWorkingHours') : this.model.get('onlyWorkingHours')) ? this.model.get('endHour') - this.model.get('startHour') + 1 : 24) * 3600000,
                millisecondsFromDayStart = Math.round(partialDay / dayWidth * dayInMilliseconds),
                start = moment(this.model.get('currentWeek')).add(fullDays, 'days');
            if (inverse ? !this.model.get('onlyWorkingHours') : this.model.get('onlyWorkingHours')) {
                start.add(this.model.get('startHour'), 'hours');
            }
            return start.valueOf() + millisecondsFromDayStart;
        },

        setToGrid: function (coord) {
            return this.grid * (Math.round(coord / this.grid));
        },

        updateLasso: function (Timeupdate) {
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
                    // carefull when saving the time. You might loose data (for example, time is 3am but only working hours are shown. time would change to 7am because lassoPosition points to this)
                    if (Timeupdate) {
                        this.lassoStartTime = this.positionToTime(this.lassoStart);
                        this.lassoEndTime = this.positionToTime(this.lassoEnd);
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
            // safari doesn't know the buttons attribute
            if (_.device('safari')) {
                if (e.which === 0) {
                    this.onMouseUp(e);
                    return;
                }
            } else if (!e.buttons) {
                this.onMouseUp(e);
                return;
            }

            //currentTarget is always .freetime-table
            var currentTarget = $(e.currentTarget);
            // don't use e.OffsetX because it uses the offset relative to child elements too (in this case appointments)
            this.lassoEnd = this.setToGrid(((e.pageX - currentTarget.offset().left) / currentTarget.outerWidth()) * 100);
            this.updateLasso(true);
        },

        onMouseDown: function (e) {
            this.lasso = true;
            //currentTarget is always .freetime-table
            var currentTarget = $(e.currentTarget);
            // don't use e.OffsetX because it uses the offset relative to child elements too (in this case appointments)
            this.lassoStart = this.setToGrid(((e.pageX - currentTarget.offset().left) / currentTarget.outerWidth()) * 100);
            this.lassoEnd = undefined;
            this.updateLasso(true);
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
                this.updateLasso(true);

                this.lasso = false;
            }
        },

        createAppointment: function () {
            if (this.lassoStart !== this.lassoEnd && this.lassoStart !== undefined && this.lassoEnd !== undefined) {
                var startTime = Math.min(this.lassoStartTime, this.lassoEndTime),
                    endTime = Math.max(this.lassoStartTime, this.lassoEndTime),
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
            var week  = moment(this.model.get('currentWeek'));
            if (_.isString(option)) {
                switch (option) {
                    case 'prev':
                        week.subtract(1, 'weeks');
                        break;
                    case 'next':
                        week.add(1, 'weeks');
                        break;
                    case 'today':
                        week = moment().startOf('week');
                        break;
                    // no default
                }
            } else if (_.isNumber(option)) {
                // scroll to date
                var hours = (this.model.get('onlyWorkingHours') ? this.model.get('startHour') : 0);
                this.keepScrollpos = moment(option).hours(hours).valueOf();
                week = moment(option).startOf('week');
            }
            week.startOf('day');
            this.model.set('currentWeek', week);
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
