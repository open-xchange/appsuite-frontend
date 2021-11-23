/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/calendar/freetime/timeView', [
    'io.ox/backbone/views/disposable',
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
            'OPAQUE': 'reserved',
            'TRANSPARENT': 'free'
        },
        zIndexbase = {
            free: 0,
            reserved: 1000
        },
        // width of a tablecell at 100% in week range
        BASEWIDTH = 60,
        ZOOM_LEVELS = [10, 25, 50, 100, 200, 400, 1000];

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
                            baton.model.get('dateRange') === 'week' ? baton.model.get('startDate').formatInterval(moment(baton.model.get('startDate')).add(6, 'days')) :
                                baton.model.get('startDate').format('MMMM YYYY')
                        ),
                        $.txt(' '),
                        $('<span class="cw">').text(
                            //#. %1$d = Calendar week
                            gt('CW %1$d', moment(baton.model.get('startDate')).isoWeek())
                            // only makes sense when date range is week
                        ).toggle(baton.model.get('dateRange') === 'week'),
                        $('<i class="fa fa-caret-down fa-fw" aria-hidden="true">')
                    );
                };

            fillInfo();
            baton.model.on('change:startDate change:dateRange', fillInfo);

            // append datepicker
            new DatePicker({ parent: this.closest('.modal,#io-ox-core') })
                .attachTo(info)
                .on('select', function (date) {
                    baton.view.setDate(date.valueOf());
                })
                .on('before:open', function () {
                    this.setDate(baton.model.get('startDate'));
                });

            this.append(
                $('<span class="controls-container">').append(
                    $('<a href="#" role="button" class="control prev">').attr({
                        title:  baton.model.get('dateRange') === 'week' ? gt('Previous week') : gt('Previous month'),
                        'aria-label': baton.model.get('dateRange') === 'week' ? gt('Previous week') : gt('Previous month')
                    })
                    .append($('<i class="fa fa-chevron-left" aria-hidden="true">')),
                    $('<a href="#" role="button" class="control next">').attr({
                        title: baton.model.get('dateRange') === 'week' ? gt('Next week') : gt('Next month'),
                        'aria-label': baton.model.get('dateRange') === 'week' ? gt('Next week') : gt('Next month')
                    })
                    .append($('<i class="fa fa-chevron-right" aria-hidden="true">'))
                ),
                info
            );
        }
    });

    pointHeader.extend({
        id: 'zoomlevels',
        index: 200,
        draw: function (baton) {
            var inputField = $('<input type="text" readonly="readonly" aria-live="polite" class="form-control">').val(baton.model.get('zoom') + '%'),
                plus = $('<span class="input-group-btn">').append($('<button class="btn btn-default" type="button">').attr('aria-label', gt('Zoom in'))
                    .append($('<i aria-hidden="true" class="fa fa-plus">').attr('title', gt('Zoom in')))),
                minus = $('<span class="input-group-btn">').append($('<button class="btn btn-default" type="button">').attr('aria-label', gt('Zoom out'))
                    .append($('<i aria-hidden="true" class="fa fa-minus">').attr('title', gt('Zoom out')))),
                changefunction = function (e) {
                    var index = _(ZOOM_LEVELS).indexOf(parseInt(baton.model.get('zoom'), 10));
                    if (e.data.direction === 'plus' && index + 1 < ZOOM_LEVELS.length) {
                        baton.model.set('zoom', ZOOM_LEVELS[index + 1]);
                    } else if (e.data.direction === 'minus' && index > 0) {
                        baton.model.set('zoom', ZOOM_LEVELS[index - 1]);
                    }
                    inputField.val(baton.model.get('zoom') + '%');
                };

            plus.on('click', { direction: 'plus' }, changefunction);
            minus.on('click', { direction: 'minus' }, changefunction);

            baton.view.headerNodeRow1.append($('<div class="right-controls pull-right">').append($('<span class="zoomlevel-selector">').append($('<div class="input-group">').append(minus, inputField, plus))));
        }
    });

    pointHeader.extend({
        id: 'options',
        index: 300,
        draw: function (baton) {
            var dropdown = new Dropdown({ keep: true, caret: true, model: baton.model, label: gt('Options'), tagName: 'span' })
                .header(gt('Rows'))
                .option('compact', true, gt('Compact'))
                .option('showFineGrid', true, gt('Show fine grid'))
                .divider()
                .header(gt('Appointment types'))
                .option('showFree', true, gt('Free'))
                .divider()
                .header(gt('Date range'))
                .option('dateRange', 'week', gt('Week'), { radio: true })
                .option('dateRange', 'month', gt('Month'), { radio: true })
                .divider()
                .option('onlyWorkingHours', true, gt('Hide non-working time'));

            baton.view.headerNodeRow1.find('.right-controls').append(
                // pull right class needed for correct dropdown placement
                dropdown.render().$el.addClass('options pull-right').attr('data-dropdown', 'options')
            );
        }
    });

    // timeline
    pointHeader.extend({
        id: 'timeline',
        index: 400,
        draw: function (baton) {
            var day = moment(baton.model.get('startDate')).startOf('day'),
                today = moment().startOf('day'),
                numberOfDays = baton.model.get('dateRange') === 'week' ? 7 : moment(baton.model.get('startDate')).daysInMonth(),
                node;

            baton.view.headerNodeRow2.append(node = $('<div class="freetime-timeline">'));
            for (var counter = 0; counter < numberOfDays; counter++) {
                var time = moment().startOf('hour'),
                    worktimeStart = parseInt(settings.get('startTime', 8), 10),
                    worktimeEnd = parseInt(settings.get('endTime', 18), 10),
                    start = baton.model.get('onlyWorkingHours') ? baton.model.get('startHour') : 0,
                    end = baton.model.get('onlyWorkingHours') ? baton.model.get('endHour') : 23,
                    sections = [],
                    dayLabel = $('<div class="day-label-wrapper">').append($('<div class="day-label">').addClass(day.day() === 0 || day.day() === 6 ? 'weekend' : '')
                            .text(day.format('ddd')).append($('<span class="number">').text(day.format('D')))),
                    dayNode;

                node.append($('<div class=timeline-day>').addClass(today.valueOf() === day.valueOf() ? 'today' : '').append(
                    $('<div class="daylabel-container">').addClass(counter === 0 ? 'first' : '').append(
                        dayLabel,
                        dayLabel.clone().addClass('level-2'),
                        dayLabel.clone().addClass('level-1'),
                        dayLabel.clone().addClass('level-2')
                    ),
                    dayNode = $('<div class="day-hours">')));

                for (var i = start; i <= end; i++) {
                    time.hours(i);
                    var timeformat = time.format('LT').replace('AM', 'a').replace('PM', 'p'),
                        calculatedWidth = BASEWIDTH * (parseInt(baton.model.get('zoom'), 10) / 100) + 'px';
                    // edge needs the min-width and max width or the cells are crushed together or much to wide... WHY U NEVER WORK EDGE!
                    sections.push($('<span class="freetime-hour">').css({ 'width': calculatedWidth, 'min-width': calculatedWidth, 'max-width': calculatedWidth })
                        .text(timeformat).val(counter * (end - start + 1) + (baton.model.get('onlyWorkingHours') ? i - baton.model.get('startHour') : i))
                        .addClass(i === start ? 'day-start' : '')
                        .addClass(i === start && counter === 0 ? 'first' : '')
                        .addClass(i === worktimeEnd || i === worktimeStart ? 'working-hour-start-end' : ''));
                }
                dayNode.append(sections);
                day.add(1, 'days');
            }
            baton.model.on('change:startDate', function () {
                var labels = node.find('.timeline-day'),
                    day = moment(baton.model.get('startDate')).startOf('day'),
                    today = moment().startOf('day');

                for (var i = 0; i <= labels.length; i++) {
                    $(labels[i]).toggleClass('today', day.valueOf() === today.valueOf()).find('.day-label').text(day.format('ddd')).append($('<span class="number">').text(day.format('D')));
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
            var node, table,
                numberOfDays = baton.model.get('dateRange') === 'week' ? 7 : moment(baton.model.get('startDate')).daysInMonth(),
                width = BASEWIDTH * (parseInt(baton.model.get('zoom'), 10) / 100),
                worktimeStart = parseInt(settings.get('startTime', 8), 10),
                worktimeEnd = parseInt(settings.get('endTime', 18), 10),
                start = baton.model.get('onlyWorkingHours') ? baton.model.get('startHour') : 0,
                end = baton.model.get('onlyWorkingHours') ? baton.model.get('endHour') : 23,
                time = moment(baton.model.get('startDate')).startOf('day'),
                today = moment().startOf('day');

            today.hours(start);

            this.append(table = $('<div class="freetime-table" draggable="false">').append(node = $('<div class="freetime-time-table">')));

            for (var counter = 0; counter < numberOfDays; counter++) {
                var cells = [];

                for (var i = start; i <= end; i++) {
                    time.hours(i);
                    cells.push($('<span class="freetime-table-cell">').css('width', width + 'px').val(counter * (end - start + 1) + (baton.model.get('onlyWorkingHours') ? i - baton.model.get('startHour') : i))
                               .addClass(i === worktimeEnd || i === worktimeStart ? 'working-hour-start-end' : '')
                               .addClass(i === start ? 'day-start' : '')
                               .addClass(time.valueOf() === today.valueOf() ? 'today' : '')
                               .addClass(i === start && counter === 0 ? 'first' : '')
                               .addClass(i <= baton.model.get('startHour') || i >= baton.model.get('endHour') ? 'non-working-hour' : ''));
                }
                node.append(cells);
                time.add(1, 'days');
            }
            width = node.children().length * width;
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
                    if (!baton.view.popupClosed) delete baton.view.center;
                }
                if (!baton.view.popupClosed) delete baton.view.keepScrollpos;
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
                baton.view.lassoNode = $('<div class="freetime-lasso" draggable="false">').hide();
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

            _(baton.model.get('attendees').models).each(function (attendee) {
                var attendeeTable = $('<div class="appointment-table">').attr('data-value', attendee.get('uri')).appendTo(table);

                _(baton.model.get('timeSlots')[attendee.get('uri')]).each(function (timeSlot, index) {
                    var event;
                    // analyze the timeslot to see if there is an event, and if so check the start dates
                    if (timeSlot.event) {
                        // we have an event that we can use
                        event = timeSlot.event;
                        if (util.isAllday(event)) {
                            event.startDate = { value: new moment.utc(timeSlot.startTime).format(util.ZULU_FORMAT) };
                            event.endDate = { value: new moment.utc(timeSlot.endTime).format(util.ZULU_FORMAT) };
                        }
                    } else {
                        // we only have a timeslot. Fake some event data, so code can be reused
                        event = {
                            //#. used to describe a time frame that is blocked in the scheduling view, when no further information is available (appointment title etc.)
                            summary: gt('Blocked time frame'),
                            startDate: { value: new moment.utc(timeSlot.startTime).format(util.ZULU_FORMAT) },
                            endDate: { value: new moment.utc(timeSlot.endTime).format(util.ZULU_FORMAT) },
                            transp: timeSlot.fbType === 'BUSY' ? 'OPAQUE' : 'TRANSPARENT',
                            isTimeslot: true
                        };
                    }

                    var start = moment.tz(event.startDate.value, event.startDate.tzid).valueOf(),
                        end = moment.tz(event.endDate.value, event.endDate.tzid).valueOf();

                    var left = baton.view.timeToPosition(start),
                        right = 100 - baton.view.timeToPosition(end),
                        eventNode = $('<div class="appointment" draggable="false">')
                            .addClass(availabilityClasses[event.transp])
                            .css({ left: left + '%', right: right + '%' });

                    // appointment has a width of 0 it doesn't need to be drawn (happens if appointment is in non-working-times and the option to display them is deactivated)
                    if (100 - left - right === 0) {
                        return;
                    }
                    eventNode.css('z-index', 1 + zIndexbase[availabilityClasses[event.transp]] + index + (util.isAllday(event) ? 0 : 2000));

                    if (event.summary) {
                        if (!event.isTimeslot) {
                            eventNode.addClass(100 - right - left < baton.view.grid * 4 ? 'under-one-hour' : '').append(
                                $('<div class="title">').text(event.summary).append(
                                    $('<span class="appointment-time">').text(util.isAllday(event) ? util.getDateInterval(event) : util.getTimeInterval(event))
                                )
                            );
                        }
                        eventNode.attr('aria-label', event.summary);
                    }

                    if (event.summary || event.location || (event.createdBy && settings.get('freeBusyStrict', true) === false)) {
                        eventNode.attr({
                            //#. %1$s = apppointment creator name
                            title: ((event.summary || '') + (event.location ? ' ' + event.location : '') + (event.createdBy && settings.get('freeBusyStrict', true) === false ? ' ' + gt('Created by: %1$s', event.createdBy.cn) : '')).trim(),
                            'data-toggle': 'tooltip'
                        }).tooltip({ container: tooltipContainer });
                    }

                    if (event.location && event.location !== '') {
                        eventNode.addClass('has-location').append($('<div class="location">').text(event.location));
                    }

                    if (!event.isTimeslot && baton.view.parentView.options.isApp && (event.folder || settings.get('freeBusyStrict', true) === false)) {
                        eventNode.addClass('has-detailview').on('click', function (e) {
                            //don't open if this was a lasso drag
                            if (baton.view.lassoEnd === baton.view.lassoStart) {
                                require(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-detail'], function (dialogs, detailView) {
                                    new dialogs.SidePopup({ tabTrap: true }).show(e, function (popup) {
                                        if (event.folder_id === undefined) {
                                            popup.append(detailView.draw(event));
                                            return;
                                        }
                                        popup.busy();
                                        var dialog = this;
                                        api.get(event).then(
                                            function (data) {
                                                popup.idle().append(detailView.draw(data));
                                            },
                                            function (error) {
                                                dialog.close();
                                                require(['io.ox/core/yell'], function (yell) {
                                                    yell(error);
                                                });
                                            }
                                        );
                                    });
                                });
                            }
                        });
                    }
                    attendeeTable.append(eventNode);
                });
            });
            baton.view.onResize();
        }
    });

    // current time indicator
    pointBody.extend({
        id: 'currentime',
        index: 400,
        draw: function (baton) {
            var table = this.find('.freetime-table'),
                setTime = function () {
                    var pos = baton.view.timeToPosition(_.now());
                    // hide if pos is 0 or 100 -> current time is in week before or after the displayed week
                    baton.view.currentTimeNode.css('left', pos + '%').toggle(pos !== 0 && pos !== 100);
                };

            if (!baton.view.currentTimeNode) {
                baton.view.currentTimeNode = $('<div class="current-time" draggable="false">');
                var timer = setInterval(setTime, 30000);
                baton.view.on('dispose', function () {
                    clearInterval(timer);
                });
            }

            setTime();
            table.append(baton.view.currentTimeNode);
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
                .on('click', '.control.next,.control.prev,.control.today', self.onControlView.bind(this));
            this.headerNodeRow2 = $('<div class="freetime-time-view-header row2">')
                .on('click', '.freetime-hour', self.onSelectHour.bind(this));
            this.bodyNode = $('<div class="freetime-time-view-body">')
                .on('mousedown', '.freetime-table', self.onMouseDown.bind(this))
                .on('mouseup', '.freetime-table', self.onMouseUp.bind(this))
                .on('mousemove', '.freetime-table', self.onMouseMove.bind(this))
                .on('dblclick', '.freetime-table-cell', self.onSelectHour.bind(this))
                .on('scroll', self.onScroll.bind(this));

            // add some listeners
            this.model.get('attendees').on('add reset', self.getAppointments.bind(this));
            // no need to fire a server request when removing a participant
            this.model.get('attendees').on('remove', self.removeParticipant.bind(this));
            this.model.on('change:onlyWorkingHours', self.onChangeWorkingHours.bind(this));
            this.model.on('change:startDate', function () {
                // we need to redraw the header in month mode because the number of days varies
                if (self.model.get('dateRange') === 'month') {
                    self.renderHeader(true);
                }
                self.getAppointmentsInstant();
            });
            this.model.on('change:dateRange', self.onChangeDateRange.bind(this));
            this.model.on('change:timeSlots', self.renderBody.bind(this));
            this.model.on('change:zoom', self.updateZoom.bind(this));
            this.model.on('change:showFree', self.updateVisibility.bind(this));
            this.onResize = this.onResize.bind(this);

            this.parentView = options.parentView;

            if (this.parentView.options.popup) {
                this.popupClosed = true;
                this.parentView.options.popup.on('open', function () {
                    self.popupClosed = false;
                    self.renderBody();
                });
            }
            var numberOfDays = this.model.get('dateRange') === 'week' ? 7 : this.model.get('startDate').daysInMonth();
            // calculate 15min grid for lasso
            this.grid = 100 / ((this.model.get('onlyWorkingHours') ? (this.model.get('endHour') - this.model.get('startHour') + 1) : 24) * 4 * numberOfDays);

            // preselect lasso
            if (options.parentModel && options.parentModel.get('startDate') !== undefined && options.parentModel.get('endDate') !== undefined) {
                var start = util.isAllday(options.parentModel) ? moment(options.parentModel.get('startDate').value).startOf('day').valueOf() :
                        moment.tz(options.parentModel.get('startDate').value, options.parentModel.get('startDate').tzid).valueOf(),
                    end = util.isAllday(options.parentModel) ? moment(options.parentModel.get('endDate').value).add(1, 'days').startOf('day').valueOf() :
                        moment.tz(options.parentModel.get('endDate').value, options.parentModel.get('endDate').tzid).valueOf();

                this.lassoStart = this.timeToPosition(start);
                this.lassoEnd = this.timeToPosition(end);
                this.keepScrollpos = start;
                this.center = true;
            }

            // must use start of week. Otherwise we get the wrong iso week in countries where the first day of the week is a sunday
            if (!options.parentModel && moment().startOf(this.model.get('dateRange')).isoWeek() === this.model.get('startDate').isoWeek()) {
                // special scrollposition on start
                this.keepScrollpos = 'today';
            }
            this.updateVisibility();

            this.listenToDOM(window, 'resize', this.onResize);
        },

        updateZoom: function () {
            var table = this.bodyNode.find('.freetime-table');
            if (table.length) {
                var nodes = table.find('.freetime-time-table').children().length,
                    oldWidth = table.width(),
                    oldScrollPos = table.parent().scrollLeft(),
                    newWidth = BASEWIDTH * (parseInt(this.model.get('zoom'), 10) / 100);

                // edge needs the min-width and max width or the cells are crushed together or much to wide... WHY U NEVER WORK EDGE!
                this.headerNodeRow2.find('.freetime-hour').css({ 'min-width':  newWidth + 'px', width: newWidth + 'px', 'max-width':  newWidth + 'px' });
                table.find('.freetime-table-cell').css('width', newWidth + 'px');
                table.css('width', nodes * newWidth + 'px').parent().scrollLeft((oldScrollPos / oldWidth) * nodes * newWidth);
            }
        },
        updateVisibility: function () {
            this.bodyNode.addClass('showReserved').toggleClass('showFree', this.model.get('showFree'));
        },
        onScroll: function () {
            this.headerNodeRow2.scrollLeft(this.bodyNode.scrollLeft());
        },

        onChangeDateRange: function (model, val) {
            this.model.set('startDate', moment(this.model.get('viewStartedWith')).startOf(val), { silent: true });
            this.onChangeWorkingHours();
        },

        onChangeWorkingHours: function () {
            var numberOfDays = this.model.get('dateRange') === 'week' ? 7 : this.model.get('startDate').daysInMonth();
            this.grid = 100 / ((this.model.get('onlyWorkingHours') ? (this.model.get('endHour') - this.model.get('startHour') + 1) : 24) * 4 * numberOfDays);
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
            var missingAppointmentInfo = false,
                self = this;

            _(this.model.get('attendees').toJSON()).each(function (attendee) {
                if (!missingAppointmentInfo && !_(self.model.get('timeSlots')).has([attendee.uri])) missingAppointmentInfo = true;
            });

            if (missingAppointmentInfo) {
                this.getAppointmentsInstant();
            } else {
                var baton = new ext.Baton({ view: this, model: this.model });
                this.bodyNode.empty();
                this.pointBody.invoke('draw', this.bodyNode, baton);
            }
        },

        // use debounce because participants can change rapidly if groups or distributionlists are resolved
        getAppointments: _.debounce(function () {
            if (this.disposed) return;
            this.getAppointmentsInstant(true);
        }, 10),

        getAppointmentsInstant: function (addOnly) {
            // save scrollposition or it is lost when the busy animation is shown
            var oldWidth = this.bodyNode.find('.freetime-table').width(),
                oldScrollPos = this.bodyNode.scrollLeft();
            if (!this.keepScrollpos && oldWidth) {
                this.keepScrollpos = this.positionToTime(oldScrollPos / oldWidth * 100);
            }
            // render busy animation
            this.bodyNode.busy({ empty: true });
            // get fresh appointments
            var self = this,
                from,
                until,
                attendees = attendees = this.model.get('attendees').toJSON(),
                timeSlots = {};

            if (attendees.length === 0) return $.when();

            // no need to get appointments for every participant all the time
            if (addOnly === true) {
                var keys = _(self.model.get('timeSlots')).keys();
                attendees = _(attendees).filter(function (attendee) {
                    return _(keys).indexOf(String(attendee.uri)) === -1;
                });
            }

            if (this.model.get('onlyWorkingHours')) {
                from = moment(this.model.get('startDate')).add(this.model.get('startHour'), 'hours').utc();
                until = moment(from).add((this.model.get('dateRange') === 'week' ? 7 : this.model.get('startDate').daysInMonth() - 1), 'days').add(this.model.get('endHour') - this.model.get('startHour'), 'hours').utc();
            } else {
                from = moment(this.model.get('startDate')).startOf('day').utc();
                until = moment(from).add((this.model.get('dateRange') === 'week' ? 7 : this.model.get('startDate').daysInMonth()), 'days').utc();
            }
            return api.freebusy(attendees, { from: from.format(util.ZULU_FORMAT), until: until.format(util.ZULU_FORMAT) }).done(function (items) {

                if (items.length === 0 && attendees.length !== 0) {
                    // remove busy animation again
                    self.bodyNode.idle();
                    require(['io.ox/core/yell'], function (yell) {
                        yell('error', gt('Could not get appointment information'));
                    });
                    return;
                }
                if (addOnly === true) {
                    timeSlots = self.model.get('timeSlots');
                }

                for (var i = 0; i < attendees.length; i++) {
                    // only events for now
                    timeSlots[attendees[i].uri] = _.compact(items[i].freeBusyTime);
                }
                // remove busy animation again
                self.bodyNode.idle();
                // set appointments silent, force trigger to redraw correctly. (normal setting does not trigger correctly when just switching times)
                self.model.set('timeSlots', timeSlots, { silent: true }).trigger('change:timeSlots');
            }).fail(function (error) {
                self.bodyNode.idle();
                require(['io.ox/core/yell'], function (yell) {
                    yell(error);
                });
            });
        },

        removeParticipant: function (model) {
            var node = this.bodyNode.find('.appointment-table[data-value="' + (model.get('uri')) + '"]'),
                timeSlots = this.model.get('timeSlots');
            if (node.length) {
                node.remove();
                this.onResize();
                // trigger scroll for lazyload
                this.parentView.participantsSubview.bodyNode.trigger('scroll');
            }
            delete timeSlots[model.get('uri')];
            // silent or we would trigger a redraw
            this.model.set('timeSlots', timeSlots, { silent: true });
        },

        onResize: function () {
            // timeviewbody and header must be the same width or they scroll out off sync (happens when timeviewbody has scrollbars)
            this.headerNodeRow2.css('margin-right', Math.max(0, this.bodyNode[0].offsetWidth - this.bodyNode[0].clientWidth - 1) + 'px');
        },

        onSelectHour: function (e) {
            var index = parseInt($(e.target).val(), 10),
                numberOfDays = this.model.get('dateRange') === 'week' ? 7 : this.model.get('startDate').daysInMonth(),
                width = 100 / (numberOfDays * (this.model.get('onlyWorkingHours') ? this.model.get('endHour') - this.model.get('startHour') + 1 : 24));

            this.lassoStart = index * width;
            this.lassoEnd = (index + 1) * width;
            this.updateLasso(true);
            if (e.altKey && this.lassoEnd && this.lassoStart && this.lassoStart !== this.lassoEnd) {
                this.parentView.save();
            }
        },

        // utility function to get the position in percent for a given time
        timeToPosition: function (timestamp) {
            var start = moment(this.model.get('startDate')).startOf('day'),
                end = moment(start).add(1, 'days'),
                day = 0,
                // if we have a daylight saving time change we need to compensate the loss/addition of an hour
                dstOffset = (moment(timestamp)._offset - (this.model.get('onlyWorkingHours') ? moment(timestamp).startOf('day').add(this.model.get('startHour'), 'hours')._offset : moment(timestamp).startOf('day')._offset)) / 60,
                numberOfDays = this.model.get('dateRange') === 'week' ? 7 : this.model.get('startDate').daysInMonth(),
                hours = this.model.get('onlyWorkingHours') ? this.model.get('endHour') - this.model.get('startHour') + 1 : 24,
                width = 100 / (numberOfDays * hours),
                percent = 100 / numberOfDays,
                notOnScale = false;

            if (this.model.get('onlyWorkingHours')) {
                var startDateOffset = (start._offset - moment(start).add(this.model.get('startHour'), 'hours')._offset) / 60;
                start = moment(this.model.get('startDate')).add(this.model.get('startHour') + startDateOffset, 'hours');
                end = moment(start).add(this.model.get('endHour') - this.model.get('startHour') + 1, 'hours');
            } else {
                start = moment(this.model.get('startDate')).startOf('day');
                end = moment(start).add(1, 'days');
            }

            for (; day < numberOfDays; day++) {
                if (timestamp < start.valueOf()) {
                    notOnScale = true;
                    break;
                }
                if (timestamp < end.valueOf()) {
                    break;
                }
                // exception for last day
                if (day === numberOfDays - 1 && timestamp > end.valueOf()) {
                    notOnScale = true;
                    day++;
                    break;
                }

                start.add(1, 'days');
                end.add(1, 'days');
            }

            return day * percent + (notOnScale ? 0 : ((timestamp - start.valueOf()) / (hours * 3600000) * percent) + dstOffset * width);
        },

        // utility function, position is given in %
        // inverse is used to keep scrollposition, needs to calculate before change
        positionToTime: function (position, inverse) {
            var dayWidth = 100 / (this.model.get('dateRange') === 'week' ? 7 : this.model.get('startDate').daysInMonth()),
                fullDays = Math.floor(position / dayWidth),
                partialDay = position - dayWidth * fullDays,
                dayInMilliseconds = ((inverse ? !this.model.get('onlyWorkingHours') : this.model.get('onlyWorkingHours')) ? this.model.get('endHour') - this.model.get('startHour') + 1 : 24) * 3600000,
                millisecondsFromDayStart = Math.round(partialDay / dayWidth * dayInMilliseconds),
                start = moment(this.model.get('startDate')).add(fullDays, 'days');
            if (inverse ? !this.model.get('onlyWorkingHours') : this.model.get('onlyWorkingHours')) {
                start.add(this.model.get('startHour'), 'hours');
            }

            // we may encounter a daylight saving time change here. We need to calculate the offset change correctly
            return start.add(millisecondsFromDayStart, 'milliseconds').add(moment(start).startOf('day')._offset - start._offset, 'minutes').valueOf();
        },

        setToGrid: function (coord) {
            var grid = this.model.get('showFineGrid') && (this.model.get('zoom') === '1000' || this.model.get('zoom') === 1000) ? this.grid / 3 : this.grid;
            return grid * (Math.round(coord / grid));
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

                    if (this.lassoEndTime < moment(this.model.get('startDate')).startOf('day').valueOf() || this.lassoStartTime > moment(this.model.get('startDate')).endOf(this.model.get('dateRange')).valueOf()) {
                        this.lassoNode.hide();
                    } else {
                        this.lassoNode.show();
                    }
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

                if (e.altKey && this.lassoEnd && this.lassoStart && this.lassoStart !== this.lassoEnd) {
                    this.parentView.save();
                }
            }
        },

        createAppointment: function () {
            if (this.lassoStart !== this.lassoEnd && this.lassoStart !== undefined && this.lassoEnd !== undefined) {
                // make sure times are set
                if (!this.lassoStartTime || !this.lassoEndTime) {
                    this.updateLasso(true);
                }
                var startTime = Math.min(this.lassoStartTime, this.lassoEndTime),
                    endTime = Math.max(this.lassoStartTime, this.lassoEndTime),
                    attendees = this.model.get('attendees').toJSON();

                // use correct timezone (view uses the timezone of the startdate, so this is also correct for the enddate)
                startTime = this.parentView.parentModel ? moment.tz(startTime, this.parentView.parentModel.get('startDate').tzid) : moment(startTime);
                endTime = this.parentView.parentModel ? moment.tz(endTime, this.parentView.parentModel.get('startDate').tzid) : moment(endTime);

                // round to full minutes
                startTime.startOf('minute');
                endTime.startOf('minute');

                // check if the lasso is a fullday appointment
                if (startTime.valueOf() !== endTime.valueOf() && startTime.valueOf() === moment(startTime).startOf('day').valueOf() && endTime.valueOf() === moment(endTime).startOf('day').valueOf()) {
                    return {
                        startDate: { value: startTime.format('YYYYMMDD') },
                        endDate: { value: endTime.subtract(1, 'days').format('YYYYMMDD') },
                        attendees: attendees
                    };
                }

                // Endtimezone might be different so correct this if needed
                if (this.parentView.parentModel) endTime.tz(this.parentView.parentModel.get('endDate').tzid);

                return {
                    startDate: { value: startTime.format('YYYYMMDD[T]HHmmss'), tzid: startTime.tz() },
                    endDate: { value: endTime.format('YYYYMMDD[T]HHmmss'), tzid: endTime.tz() },
                    attendees: attendees
                };
            }
        },

        setDate: function (option) {
            var startDate  = moment(this.model.get('startDate'));
            if (_.isString(option)) {
                switch (option) {
                    case 'prev':
                        startDate.subtract(1, this.model.get('dateRange') + 's');
                        break;
                    case 'next':
                        startDate.add(1, this.model.get('dateRange') + 's');
                        break;
                    case 'today':
                        startDate = moment().startOf(this.model.get('dateRange'));
                        break;
                    // no default
                }
            } else if (_.isNumber(option)) {
                // scroll to date
                var hours = (this.model.get('onlyWorkingHours') ? this.model.get('startHour') : 0);
                this.keepScrollpos = moment(option).hours(hours).valueOf();
                startDate = moment(option).startOf(this.model.get('dateRange'));
            }
            startDate.startOf('day');
            this.model.set('startDate', startDate);
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
