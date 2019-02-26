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

define('io.ox/calendar/month/view', [
    'io.ox/core/extensions',
    'io.ox/calendar/api',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'less!io.ox/calendar/month/style',
    'static/3rd.party/jquery-ui.min.js'
], function (ext, api, folderAPI, util, gt, settings) {

    'use strict';

    var View = Backbone.View.extend({

        tagName:        'table',
        className:      'month',
        start:          null,   // moment of start of the month
        folders:        null,
        clickTimer:     null,   // timer to separate single and double click
        clicks:         0,      // click counter
        pane:           $(),
        type:           '',
        limit:          1000,

        events: (function () {
            var events = {
                'click .appointment':      'onClickAppointment',
                'dblclick .day':           'onCreateAppointment',
                'mouseenter .appointment': 'onEnterAppointment',
                'mouseleave .appointment': 'onLeaveAppointment'
            };

            if (_.device('touch')) {
                _.extend(events, {
                    'swipeleft': 'onSwipe',
                    'swiperight': 'onSwipe'
                });
            }

            return events;
        }()),

        initialize: function (options) {
            this.start = moment(options.start).startOf('month').startOf('week');
            this.end = moment(options.start).endOf('month').endOf('week');
            this.month = moment(options.start).startOf('month');
            this.folders = options.folders;
            this.app = options.app;
            this.perspective = options.perspective;
            this.weekType = options.weekType;
        },

        setCollection: function (collection) {
            if (this.collection === collection) return;

            if (this.collection) this.stopListening(this.collection);
            this.collection = collection;

            this.renderAppointments();

            this
                .listenTo(this.collection, 'change', this.renderAppointments, this)
                .listenTo(this.collection, 'add remove reset', _.debounce(this.renderAppointments), this);
        },

        getRequestParams: function () {
            return {
                start: this.start.valueOf(),
                end: this.end.valueOf(),
                folders: _(this.folders).pluck('id'),
                view: 'month'
            };
        },

        onClickAppointment: function (e) {
            var cid = $(e.currentTarget).data('cid'),
                cT = this.$('[data-cid="' + cid + '"]');
            if (cT.hasClass('appointment') && !cT.hasClass('disabled')) {
                var self = this,
                    obj = util.cid(String(cid));

                if (!cT.hasClass('current') || _.device('smartphone')) {
                    self.trigger('showAppointment', e, obj);
                    this.$('.appointment')
                        .removeClass('current opac')
                        .not(this.$('[data-master-id="' + obj.folder + '.' + obj.id + '"]'))
                        .addClass((this.collection.length > this.limit || _.device('smartphone')) ? '' : 'opac');
                    this.$('[data-master-id="' + obj.folder + '.' + obj.id + '"]').addClass('current');
                } else {
                    this.$('.appointment').removeClass('opac');
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
                    api.get(obj).done(function (model) {
                        self.trigger('openEditAppointment', e, model.attributes);
                    });
                }
            }
        },

        onCreateAppointment: function (e) {

            // fix for strange safari-specific bug
            // apparently, the double click changes the selection and then Safari runs into
            // EXC_BAD_ACCESS (SIGSEGV). See bug 42111
            if (_.device('safari')) document.getSelection().collapse(true);

            if (!$(e.target).hasClass('list')) return;

            this.trigger('createAppointment', e, $(e.currentTarget).data('date'));
        },

        // handler for onmouseenter event for hover effect
        onEnterAppointment: function (e) {
            var cid = util.cid(String($(e.currentTarget).data('cid'))),
                el = this.$('[data-master-id="' + cid.folder + '.' + cid.id + '"]:visible'),
                bg = el.data('background-color');
            el.addClass('hover');
            if (bg) el.css('background-color', util.lightenDarkenColor(bg, 0.9));
        },

        // handler for onmouseleave event for hover effect
        onLeaveAppointment: function (e) {
            var cid = util.cid(String($(e.currentTarget).data('cid'))),
                el = this.$('[data-master-id="' + cid.folder + '.' + cid.id + '"]:visible'),
                bg = el.data('background-color');
            el.removeClass('hover');
            if (bg) el.css('background-color', bg);
        },

        onMousewheel: _.throttle(function (e) {
            var target = $(e.target),
                scrollpane = target.closest('.list.abs');
            if (scrollpane.prop('scrollHeight') > scrollpane.prop('clientHeight')) return;
            var delta = e.originalEvent.wheelDelta || e.originalEvent.deltaY || e.originalEvent.detail;
            this.perspective.gotoMonth(delta < 0 ? 'next' : 'prev');
        }, 400, { trailing: false }),

        // handler for mobile month view day-change
        changeToSelectedDay: function (timestamp) {
            // set date for app to selected day and change
            // perspective afterwards
            this.app.setDate(timestamp);
            ox.ui.Perspective.show(this.app, 'week:day', { animation: 'slideleft' });
        },

        onSwipe: function (e) {
            e.preventDefault();
            if (e.type === 'swipeleft') this.perspective.gotoMonth('next');
            if (e.type === 'swiperight') this.perspective.gotoMonth('prev');
            return false;
        },

        render: function render() {
            var self = this,
                day = moment(this.start),
                row,
                tbody = $('<tbody>');

            // add days
            for (; day.isBefore(this.end); day.add(1, 'day')) {
                if (!row || day.isSame(day.clone().startOf('week'), 'day')) {
                    row = $('<tr class="week">').append(
                        $('<td class="day cw">').append(
                            $('<span class="number">').text(gt('CW %1$d', day.format('w')))
                        )
                    );
                    tbody.append(row);
                }

                var dayCell = $('<td>');
                row.append(
                    dayCell.addClass('day')
                        .attr({
                            id: day.format('YYYY-M-D'),
                            //#. %1$s is a date: october 12th 2017 for example
                            title: gt('Selected - %1$s', day.format('ddd LL'))
                        })
                        .data('date', day.valueOf())
                        .append(
                            $('<div class="number" aria-hidden="true">').append(
                                day.isSame(self.start, 'week') ? $('<span class="day-label">').text(day.format('ddd')) : '',
                                day.date()
                            ),
                            $('<div class="list abs">')
                        )
                );

                if (day.isSame(moment(), 'day')) dayCell.addClass('today');
                if (day.day() === 0 || day.day() === 6) dayCell.addClass('weekend');
                if (!day.isSame(this.month, 'month')) dayCell.addClass('out');
            }

            this.$el.append(
                $('<thead>').append(
                    $('<tr>').append(
                        function () {
                            var labels = [], current = day.clone().startOf('week');
                            for (var i = 0; i < 7; i++, current.add(1, 'day')) {
                                labels.push($('<th>').text(current.format('ddd')));
                            }
                            return labels;
                        }
                    )
                ),
                tbody
            );

            if (_.device('firefox') || _.device('ie && ie <= 11')) this.$('tbody tr').css('height', (100 / this.$('tbody tr').length + '%'));

            if (_.device('smartphone')) {
                this.$el.css('min-height', 100 / 7 * this.$el.children(':not(.month-name)').length + '%');
                // on mobile we switch to the day view after a tap
                // on a day-cell was performed
                this.$el.on('tap', '.day', function () {
                    self.changeToSelectedDay($(this).data('date'));
                });
            }

            return this;
        },

        renderAppointment: function (a) {
            var self = this,
                el = $('<div class="appointment" data-extension-point="io.ox/calendar/month/view/appointment">')
                    .data('event', a)
                    .attr({
                        'data-cid': a.cid,
                        'data-master-id': util.cid({ id: a.get('id'), folder: a.get('folder') }),
                        'data-composite-id': a.cid
                    });

            ext.point('io.ox/calendar/month/view/appointment')
                .invoke('draw', el, ext.Baton(_.extend({}, this.options, { model: a, folders: self.folders, app: self.app })));
            return el;
        },

        renderAppointmentIndicator: function (node) {
            ext.point('io.ox/calendar/month/view/appointment/mobile')
                .invoke('draw', node);
        },

        renderAppointments: function () {
            var self = this;
            $('.appointment, .fa-circle', this.$el).remove();

            // loop over all appointments
            this.collection.each(function (model) {

                // is declined?
                if (util.getConfirmationStatus(model) === 'DECLINED' && !settings.get('showDeclinedAppointments', false)) return;

                var startMoment = model.getMoment('startDate'),
                    endMoment = model.getMoment('endDate'),
                    maxCount = 31;

                // fix full-time values
                if (util.isAllday(model)) endMoment.subtract(1, 'millisecond');

                // reduce to dates inside the current week
                startMoment = moment.max(startMoment, this.start).clone();
                endMoment = moment.min(endMoment, this.end).clone();

                if (_.device('smartphone')) {
                    var cell = $('#' + startMoment.format('YYYY-M-D') + ' .list', this.$el);
                    this.renderAppointmentIndicator(cell.empty());
                } else {
                    // draw across multiple days
                    while (maxCount >= 0) {
                        maxCount--;
                        $('#' + startMoment.format('YYYY-M-D') + ' .list', this.$el).append(this.renderAppointment(model));
                        // inc date
                        if (!startMoment.isSame(endMoment, 'day')) {
                            startMoment.add(1, 'day').startOf('day');
                        } else {
                            break;
                        }
                    }
                }
            }, this);

            // exit here if we are on a phone
            if (_.device('smartphone')) return;

            $('.appointment.modify', this.$el).draggable({
                helper: function () {
                    return $(this)
                        .clone()
                        .width($(this).outerWidth());
                },
                appendTo: self.$el,
                scroll: true,
                scrollSpeed: 100,
                scrollSensitivity: 100,
                snap: '.day>.list',
                snapMode: 'inner',
                snapTolerance: 20,
                distance: 20,
                zIndex: 999,
                containment: self.$el.parent(),
                revertDuration: 0,
                revert: function (drop) {
                    //if false then no socket object drop occurred.
                    if (drop === false) {
                        //revert the peg by returning true
                        $(this).show();
                        return true;
                    }
                    //return false so that the peg does not revert
                    return false;
                },
                start: function () {
                    // close sidepopup so it doesn't interfere with dragging/resizing
                    if (self.perspective && self.perspective.dialog) self.perspective.dialog.close();
                    $(this).hide();
                }
            });

            $('.day', this.$el).droppable({
                accept: '.appointment',
                drop: function (e, ui) {
                    $('.list', this).append(
                        ui.draggable.show()
                    );
                    var cid = ui.draggable.data('cid'),
                        event = api.pool.getModel(cid).clone(),
                        s = event.getMoment('startDate'),
                        start = moment($(this).data('date')).set({ 'hour': s.hours(), 'minute': s.minutes(), 'second': s.seconds(), 'millisecond': s.milliseconds() }),
                        end = start.clone().add(event.getMoment('endDate').diff(event.getMoment('startDate'), 'ms'), 'ms');
                    if (event.getTimestamp('startDate') !== start.valueOf() || event.getTimestamp('endDate') !== end.valueOf()) {
                        // save for update calculations
                        if (event.has('rrule')) {
                            event.set({
                                oldStartDate: event.getMoment('startDate'),
                                oldEndDate: event.getMoment('endDate')
                            }, { silent: true });
                        }
                        var format = util.isAllday(event) ? 'YYYYMMDD' : 'YYYYMMDD[T]HHmmss';
                        event.set({
                            startDate: { value: start.format(format), tzid: event.get('startDate').tzid },
                            endDate: { value: end.format(format), tzid: event.get('endDate').tzid }
                        }, { silent: true });
                        ui.draggable.busy().draggable('disable');
                        self.trigger('updateAppointment', event);
                    }
                }
            });
        }
    });

    ext.point('io.ox/calendar/month/view/appointment').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {
            var self = this,
                a = baton.model,
                folder = folderAPI.pool.getModel(a.get('folder')).toJSON(),
                conf = 1,
                confString = '%1$s',
                classes = '';

            function addColors(f) {
                var color = util.getAppointmentColor(f, a);
                if (!color) return;
                self.css({
                    'background-color': color,
                    'color': util.getForegroundColor(color)
                }).data('background-color', color);

                self.addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');

                if (util.canAppointmentChangeColor(f, a)) {
                    self.attr('data-folder', f.id);
                }
            }

            var folderId = a.get('folder');
            if (String(folder.id) === String(folderId)) {
                addColors(folder);
            } else if (folderId !== undefined) {
                folderAPI.get(folderId).done(addColors);
            }

            if (util.isPrivate(a) && ox.user_id !== (a.get('createdBy') || {}).entity && !folderAPI.is('private', folder)) {
                classes = 'private';
            } else {
                var canModifiy = folderAPI.can('write', folder, a.attributes) && util.allowedToEdit(a, { synced: true, folderData: folder });
                conf = util.getConfirmationStatus(a);
                classes = (util.isPrivate(a) ? 'private ' : '') + util.getShownAsClass(a) +
                    ' ' + util.getConfirmationClass(conf) +
                    (canModifiy ? ' modify' : '');
                if (conf === 3) {
                    confString =
                        //#. add confirmation status behind appointment title
                        //#. %1$s = apppintment title
                        //#, c-format
                        gt('%1$s (Tentative)');
                }
            }

            this
                .attr({ tabindex: 0 })
                .addClass(classes)
                .append(
                    $('<div class="appointment-content">')
                    .css('lineHeight', (util.isAllday(a) ? this.fulltimeHeight : this.cellHeight) + 'px')
                    .append(
                        util.isAllday(a) ? $() : $('<span class="start">').text(a.getMoment('startDate').tz(moment().tz()).format('LT')),
                        util.isPrivate(a) ? $('<span class="private-flag">').append($('<i class="fa fa-lock" aria-hidden="true">'), $('<span class="sr-only">').text(gt('Private'))) : '',
                        a.get('summary') ? $('<span class="title">').text(gt.format(confString, a.get('summary') || '\u00A0')) : '',
                        a.get('location') ? $('<span class="location">').text(a.get('location') || '\u00A0') : ''
                    )
                )
                .attr({
                    'data-extension': 'default'
                });
        }
    });

    ext.point('io.ox/calendar/month/view/appointment/mobile').extend({
        id: 'default',
        index: 100,
        draw: function () {
            this.append('<i class="fa fa-circle" aria-hidden="true">');
        }
    });

    return View;
});
