/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/calendar/month/view', [
    'io.ox/core/extensions',
    'io.ox/calendar/perspective',
    'io.ox/calendar/util',
    'io.ox/calendar/api',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'io.ox/core/print',
    'less!io.ox/calendar/month/style',
    'io.ox/calendar/extensions',
    'io.ox/calendar/month/extensions'
], function (ext, perspective, util, api, gt, settings, print) {

    'use strict';

    var ToolbarView = perspective.DragHelper.extend({

        className: 'header',

        attributes: {
            role: 'toolbar'
        },

        events: {
            'click .control.next, .control.prev': 'onClickControl'
        },

        initialize: function () {
            this.monthText = $('<span>');
            this.monthInfo = _.device('smartphone') ? $('<div class="info">') : $('<button class="info btn btn-link" tabindex="-1">');

            this.listenTo(this.model, 'change:startOfMonth', this.update);
            if (!_.device('smartphone')) this.listenTo(this.opt.app.props, 'change:showMiniCalendar change:folderview', this.onToggleDatepicker);
        },

        update: function () {
            this.monthText.text(this.model.get('startOfMonth').formatCLDR('yMMMM'));
        },

        render: function () {
            var self = this;

            this.$el.empty();
            if (!_.device('smartphone')) {
                this.$el.append(
                    $('<button href="#" class="control prev">').attr({
                        title: gt('Previous Month'), // TODO: Aria title vs. aria-label
                        'aria-label': gt('Previous Month')
                    })
                    .append($('<i class="fa fa-chevron-left" aria-hidden="true">')),
                    $('<button href="#" class="control next" tabindex="-1">').attr({
                        title: gt('Next Month'), // TODO: Aria title vs. aria-label
                        'aria-label': gt('Next Month')
                    })
                    .append($('<i class="fa fa-chevron-right" aria-hidden="true">'))
                );
            }

            this.$el.append(this.monthInfo.append(this.monthText));
            this.update();

            if (!_.device('smartphone')) {
                this.monthInfo.attr({
                    'aria-label': gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.')
                }).append(
                    $('<i class="fa fa-caret-down fa-fw" aria-hidden="true">')
                );
                require(['io.ox/backbone/views/datepicker'], function (Picker) {
                    new Picker({ date: self.model.get('date').clone() })
                        .attachTo(self.monthInfo)
                        .on('select', function (date) {
                            self.model.set('date', date);
                        })
                        .on('before:open', function () {
                            this.setDate(self.model.get('date'));
                        });
                    self.onToggleDatepicker();
                });
            }

            return this;
        },

        onToggleDatepicker: function () {
            var props = this.opt.app.props;
            this.monthInfo.prop('disabled', props.get('folderview') && props.get('showMiniCalendar'));
        },

        onClickControl: function (e) {
            var target = $(e.currentTarget),
                date = this.model.get('date').clone();
            date[target.hasClass('next') ? 'add' : 'subtract'](1, 'month');
            this.model.set('date', date);
        }

    });

    var MonthView = perspective.DragHelper.extend({

        tagName: 'table',

        className: 'month',

        events: function () {
            var events = {};
            _.extend(events, {
                'dblclick .day': 'onCreateAppointment'
            });
            if (_.device('smartphone')) {
                _.extend(events, {
                    'tap .day': 'onTapAppointment'
                });
            }
            if (_.device('touch')) {
                _.extend(events, {
                    'taphold .day': 'onCreateAppointment'
                });
            }
            if (_.device('desktop')) {
                _.extend(events, {
                    'mouseenter .appointment': 'onHover',
                    'mouseleave .appointment': 'onHover',
                    'mousedown .appointment.modify': 'onDrag'
                });
            }
            return events;
        },

        initialize: function () {
            this.on('collection:add', this.onAddAppointment);
            this.on('collection:change', this.onChangeAppointment);
            this.on('collection:remove', this.onRemoveAppointment);
            this.on('collection:before:reset', this.onBeforeReset);
            this.on('collection:after:reset', this.onAfterReset);

            this.listenTo(this.model, 'change:startDate', this.render);
            this.listenTo(this.opt.app.props, 'change:showMonthviewWeekend', this.updateWeekends);
            this.updateWeekends();
        },

        updateWeekends: function () {
            this.$el.toggleClass('weekends', _.device('smartphone') || this.opt.app.props.get('showMonthviewWeekend'));
        },

        render: function () {
            var self = this,
                day = this.model.get('startDate').clone(),
                end = this.model.get('endDate').clone(),
                row,
                tbody = $('<tbody>');

            // add days
            for (; day.isBefore(end); day.add(1, 'day')) {
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
                            title: gt('%1$s', day.format('ddd LL'))
                        })
                        .data('date', day.valueOf())
                        .append(
                            $('<div class="number" aria-hidden="true">').append(
                                day.isSame(self.model.get('startOfMonth'), 'week') ? $('<span class="day-label">').text(day.format('ddd')) : '',
                                day.date()
                            ),
                            $('<div class="list abs">')
                        )
                );

                if (day.isSame(moment(), 'day')) dayCell.addClass('today');
                if (day.day() === 0 || day.day() === 6) dayCell.addClass('weekend');
                if (!day.isSame(this.model.get('startOfMonth'), 'month')) dayCell.addClass('out');
            }

            this.$el.empty().append(
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

            this.$('tbody tr').css('height', (Math.floor(100 / this.$('tbody tr').length) + '%'));

            if (_.device('smartphone')) {
                this.$el.css('min-height', 100 / 7 * this.$el.children(':not(.month-name)').length + '%');
            }

            if (_.device('ie && ie <= 11')) this.calculateHeights();

            return this;
        },

        onTapAppointment: function (e) {
            var app = this.opt.app;
            app.setDate($(e.currentTarget).data('date'));
            app.pages.changePage('week:day', { animation: 'slideleft' });
        },

        // IE 11 needs a fixed height or appointments are not displayed
        calculateHeights: _.debounce(function () {
            var height = Math.floor(this.$el.height() / this.$el.find('tr').length - 26) + 'px';
            this.$('.list').css('height', height);
        }, 100),

        renderAppointment: function (model, startDate) {
            var node = $('<button class="appointment" type="button">')
                .attr({
                    'data-cid': model.cid,
                    'data-master-id': util.cid({ id: model.get('id'), folder: model.get('folder') }),
                    'data-extension-point': 'io.ox/calendar/appointment',
                    'data-composite-id': model.cid
                })
                .data('startDate', model.getTimestamp('startDate'));

            var baton = ext.Baton(_.extend({}, this.opt, { model: model, folders: this.opt.app.folders.list(), startDate: startDate }));
            ext.point('io.ox/calendar/appointment').invoke('draw', node, baton);
            ext.point('io.ox/calendar/month/view/appointment').invoke('draw', node, baton);

            return node;
        },

        onFoldersChange: function () {
            if (this.model.get('mergeView')) this.render();
        },

        onCreateAppointment: function (e) {
            if ($(e.target).closest('.appointment').length > 0) return;

            // fix for strange safari-specific bug
            // apparently, the double click changes the selection and then Safari runs into
            // EXC_BAD_ACCESS (SIGSEGV). See bug 42111
            // if (_.device('safari')) document.getSelection().collapse(true);
            // Commented out (20.09.2018) today, this code causes a runtime error due to invalid parameter of collapse

            if (!$(e.target).hasClass('list')) return;

            var start = moment($(e.currentTarget).data('date')),
                folder = this.opt.app.folder.get();
            // add current time to start timestamp
            start.add(Math.ceil((moment().hours() * 60 + moment().minutes()) / 30) * 30, 'minutes');

            this.opt.view.createAppointment({
                startDate: { value: start.format('YYYYMMDD[T]HHmmss'), tzid:  start.tz() },
                endDate: { value: start.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid:  start.tz() },
                folder: folder
            });
        },

        onHover: function (e) {
            var cid = util.cid(String($(e.currentTarget).data('cid'))),
                el = this.$('[data-master-id="' + cid.folder + '.' + cid.id + '"]:visible'),
                bg = el.data('background-color');
            switch (e.type) {
                case 'mouseenter':
                    el.addClass('hover');
                    if (bg) el.css('background-color', util.lightenDarkenColor(bg, 0.93));
                    break;
                case 'mouseleave':
                    el.removeClass('hover');
                    if (bg) el.css('background-color', bg);
                    break;
                default:
                    break;
            }
        },

        onDrag: function (e) {
            var node, model, startDate, diff,
                first = true,
                // area where nothing happens. Mouse must move at least this far from starting position for drag to trigger (prevents accidental dragging, when appointment detail view should be opened instead)
                // note: set this to at least 1. disabling this causes issues on windows, somehow the first mousemove is triggered directly after mousedown, without movement involved.
                //       This causes issues as it prevents appointments from opening the detail view
                // deadzone is just a square for now, no pythagoras to determine the distance
                deadzone  = 5,
                startCoords = { x: 0, y: 0 },
                inDeadzone = true;

            this.mouseDragHelper({
                event: e,
                updateContext: '.day',
                delay: 300,
                start: function (e) {
                    inDeadzone = true;
                    node = $(e.target).closest('.appointment');
                    model = this.opt.view.collection.get(node.attr('data-cid'));
                    startDate = moment(node.closest('.day').data('date'));
                    startCoords.x = e.pageX;
                    startCoords.y = e.pageY;
                },
                update: function (e) {
                    if (inDeadzone && (Math.abs(startCoords.x - e.pageX) > deadzone || Math.abs(startCoords.y - e.pageY) > deadzone)) {
                        inDeadzone = false;
                    }
                    if (inDeadzone) return;
                    if (first) {
                        this.$('[data-cid="' + model.cid + '"]').addClass('resizing').removeClass('current hover');
                        this.$el.addClass('no-select');
                        first = false;
                    }

                    var target = $(e.target).closest('.day'), cell, targetDate;
                    if (target.length === 0) return;
                    diff = moment(target.data('date')).diff(startDate, 'days');
                    targetDate = model.getMoment('startDate').add(diff, 'days');
                    cell = this.$('#' + targetDate.format('YYYY-M-D') + ' .list');
                    if (node.parent().is(cell)) return;
                    node.data('startDate', targetDate.valueOf());
                    cell.append(node);
                    cell.append(cell.children().sort(this.nodeComparator));
                    node.get(0).scrollIntoView();
                },
                end: function () {
                    node.removeClass('resizing');
                    this.$el.removeClass('no-select');
                    var newStartDate = model.getMoment('startDate').add(diff, 'days'),
                        newEndDate = model.getMoment('endDate').add(diff, 'days');
                    if (newStartDate.isSame(model.getMoment('startDate'))) return;
                    var newStart = { value: newStartDate.format('YYYYMMDD[T]HHmmss'), tzid: newStartDate.tz() },
                        newEnd = { value: newEndDate.format('YYYYMMDD[T]HHmmss'), tzid: newEndDate.tz() };
                    if (util.isAllday(model)) {
                        newStart = { value: newStartDate.format('YYYYMMDD') };
                        newEnd = { value: newEndDate.format('YYYYMMDD') };
                    }
                    this.opt.view.updateAppointment(model, { startDate: newStart, endDate: newEnd });
                }
            });
        },

        nodeComparator: function comparator(a, b) {
            return $(a).data('startDate') - $(b).data('startDate');
        },

        onAddAppointment: function (model) {
            if (settings.get('showDeclinedAppointments', false) === false && util.getConfirmationStatus(model) === 'DECLINED') return;

            // we need to convert start and end time to the local timezone of this calendar or we will display appointments from other timezones on the wrong day
            var startMoment = moment.max(util.getMomentInLocalTimezone(model.get('startDate')), this.model.get('startDate')).clone(),
                endMoment = moment.min(util.getMomentInLocalTimezone(model.get('endDate')), this.model.get('endDate')).clone();

            // subtract 1ms. This will not be visible and will fix appointments till 12am to not be drawn on the next day (e.g. allday appointments)
            if (!startMoment.isSame(endMoment)) endMoment.subtract(1, 'millisecond');

            if (_.device('smartphone')) {
                do {
                    var node = $('#' + startMoment.format('YYYY-M-D') + ' .list', this.$el).empty();
                    this.renderAppointmentIndicator(node);
                    startMoment.add(1, 'day').startOf('day');
                } while (startMoment.isSameOrBefore(endMoment));
                return;
            }

            // draw across multiple days
            while (startMoment.isSameOrBefore(endMoment)) {
                var cell = this.$('#' + startMoment.format('YYYY-M-D') + ' .list');
                cell.append(this.renderAppointment(model, startMoment));
                if (!this.onReset) cell.append(cell.children().sort(this.nodeComparator));
                startMoment.add(1, 'day').startOf('day');
            }
        },

        renderAppointmentIndicator: function (node) {
            ext.point('io.ox/calendar/month/view/appointment/mobile')
                .invoke('draw', node);
        },

        onChangeAppointment: function (model) {
            this.onRemoveAppointment(model);
            this.onAddAppointment(model);
        },

        onRemoveAppointment: function (model) {
            this.$('[data-cid="' + model.cid + '"]').remove();
        },

        onBeforeReset: function () {
            this.$('.appointment').remove();
            this.onReset = true;
        },

        onAfterReset: function () {
            this.onReset = false;
        }

    });

    ext.point('io.ox/calendar/month/view/appointment/mobile').extend({
        id: 'default',
        index: 100,
        draw: function () {
            this.append('<i class="fa fa-circle" aria-hidden="true">');
        }
    });

    return perspective.View.extend({

        className: 'monthview-container',

        options: {
            limit: 1000
        },

        initialize: function (opt) {
            this.app = opt.app;

            this.model = new Backbone.Model({
                date: opt.startDate || this.app.getDate(),
                currentDate: moment() // stores the current date to detect day changes and update the today label
            });
            this.initializeSubviews();

            this.listenTo(api, 'process:create update delete', this.onUpdateCache);

            this.setStartDate(this.model.get('date'), { silent: true });

            perspective.View.prototype.initialize.call(this, opt);
        },

        initializeSubviews: function () {
            var opt = _.extend({
                app: this.app,
                view: this,
                model: this.model
            }, this.options);
            this.toolbarView = new ToolbarView(opt);
            this.monthView = new MonthView(opt);
            this.$el.append(
                this.toolbarView.$el,
                $('<div class="month-container" role="presentation">').append(
                    this.monthView.$el
                )
            );
        },

        onChangeDate: function (model, date) {
            date = moment(date);
            this.model.set('date', date);
            this.setStartDate(date);
        },

        onWindowShow: function () {
            if (this.$el.is(':visible')) this.trigger('show');
        },

        onUpdateCache: function () {
            var collection = this.collection;
            // set all other collections to expired to trigger a fresh load on the next opening
            api.pool.grep('view=month').forEach(function (c) {
                if (c !== collection) c.expired = true;
            });
            collection.sync();
        },

        setStartDate: function (value, options) {
            if (_.isString(value)) {
                var mode = value === 'next' ? 'add' : 'subtract';
                value = this.model.get('startOfMonth').clone()[mode](1, 'month');
            }

            var previous = moment(this.model.get('startOfMonth')),
                opt = _.extend({ propagate: true, silent: false }, options),
                date = moment(value);

            date.startOf('month');

            // only trigger change event if start date has changed
            if (date.isSame(previous)) return;
            this.model.set({
                startDate: date.clone().startOf('week'),
                endDate: date.clone().endOf('month').endOf('week'),
                startOfMonth: date
            }, { silent: opt.silent });
            if (opt.propagate) this.app.setDate(moment(value));
            if (ox.debug) console.log('refresh calendar data');
            this.refresh();
        },

        render: function () {
            this.toolbarView.render();
            this.monthView.render();
            return this;
        },

        rerender: function () {
            this.toolbarView.update();
            this.monthView.render();
            return this;
        },

        getRequestParam: function () {
            var params = {
                start: this.model.get('startDate').valueOf(),
                end: this.model.get('endDate').valueOf(),
                view: 'month',
                folders: this.app.folders.list()
            };
            return params;
        },

        refresh: function (useCache) {
            var self = this,
                obj = this.getRequestParam(),
                collection = api.getCollection(obj);

            // // set manually to expired to trigger reload on next opening
            if (useCache === false) {
                api.pool.grep('view=month').forEach(function (c) {
                    c.expired = true;
                });
            }

            // Rerender the view when the date changes (e.g. keep appsuite open overnight)
            if (!this.model.get('currentDate').isSame(moment(), 'day')) {
                this.model.set('currentDate', moment());
                this.rerender();
            }

            this.setCollection(collection);

            // no need to wait for folder data we already have the ids
            // TODO check errorhandling if folders cannot be read etc
            collection.folders = this.app.folders.folders;
            collection.sync();

            $.when(this.app.folder.getData(), this.app.folders.getData()).done(function (folder, folders) {
                self.model.set('folders', folders);
            });
        },

        onAddAppointment: function (model) {
            this.monthView.trigger('collection:add', model);
        },

        onChangeAppointment: function (model) {
            this.monthView.trigger('collection:change', model);
        },

        onRemoveAppointment: function (model) {
            this.monthView.trigger('collection:remove', model);
        },

        onResetAppointments: function () {
            this.monthView.trigger('collection:before:reset');
            this.collection.forEach(this.monthView.trigger.bind(this.monthView, 'collection:add'));
            this.monthView.trigger('collection:after:reset');
        },

        onPrevious: function () {
            this.toolbarView.$('.prev').trigger('click');
        },

        onNext: function () {
            this.toolbarView.$('.next').trigger('click');
        },

        getName: function () {
            return 'month';
        },

        print: function () {
            var folders = this.model.get('folders'),
                title = gt('Appointments');
            if (folders.length === 1) title = folders[0].display_title || folders[0].title;

            print.request('io.ox/calendar/month/print', {
                current: this.model.get('startOfMonth').valueOf(),
                start: this.model.get('startDate').valueOf(),
                end: this.model.get('endDate').valueOf(),
                folders: _(folders).pluck('id'),
                title: title
            });
        },

        // called when an appointment detail-view opens the according appointment
        selectAppointment: function (model) {
            this.setStartDate(model.getMoment('startDate'));
        }

    });

});
