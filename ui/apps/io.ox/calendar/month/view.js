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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
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
], function (ext, PerspectiveView, util, api, gt, settings, print) {

    'use strict';

    var BasicView = Backbone.View.extend({

        constructor: function (opt) {
            this.opt = _.extend({}, this.options || {}, opt);
            Backbone.View.prototype.constructor.call(this, opt);
        },

        mouseDragHelper: function (opt) {
            var self = this,
                e = opt.event,
                context = _.uniqueId('.drag-');
            if (e.which !== 1) return;
            opt.start.call(this, opt.event);

            this.delegate('mousemove' + context, opt.updateContext, _.throttle(function (e) {
                if (e.which !== 1) return;
                opt.update.call(self, e);
            }, 100));
            $(document).on('mouseup' + context, function (e) {
                self.undelegate('mousemove' + context);
                $(document).off('mouseup' + context);
                opt.end.call(self, e);
            });
        }

    });

    var ToolbarView = BasicView.extend({

        className: 'header',

        attributes: {
            role: 'toolbar'
        },

        events: {
            'click .control.next, .control.prev': 'onClickControl'
        },

        initialize: function () {
            this.listenTo(this.model, 'change:startOfMonth', this.update);
            if (!_.device('smartphone')) this.listenTo(this.opt.app.props, 'change:showMiniCalendar change:folderview', this.onToggleDatepicker);
        },

        update: function () {
            this.monthText.text(this.model.get('startOfMonth').format('MMMM YYYY'));
        },

        render: function () {
            var self = this;

            this.monthInfo = _.device('smartphone') ? $('<div class="info">') : $('<button class="info btn btn-link" tabindex="-1">');

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

            this.$el.append(this.monthInfo.append(this.monthText = $('<span>')));
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

    var MonthView = BasicView.extend({

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
                            title: gt('Selected - %1$s', day.format('ddd LL'))
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

            if (_.device('firefox') || _.device('ie && ie <= 11')) this.$('tbody tr').css('height', (100 / this.$('tbody tr').length + '%'));

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

        renderAppointment: function (model) {
            var node = $('<div class="appointment">')
                .attr({
                    'data-cid': model.cid,
                    'data-master-id': util.cid({ id: model.get('id'), folder: model.get('folder') }),
                    'data-extension-point': 'io.ox/calendar/appointment',
                    'data-composite-id': model.cid
                })
                .data('startDate', model.getTimestamp('startDate'));

            var baton = ext.Baton(_.extend({}, this.opt, { model: model, folders: this.opt.app.folders.list() }));
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
                    if (bg) el.css('background-color', util.lightenDarkenColor(bg, 0.9));
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
            var node, model, startDate, diff, first = true;
            this.mouseDragHelper({
                event: e,
                updateContext: '.day',
                start: function (e) {
                    node = $(e.target).closest('.appointment');
                    model = this.opt.view.collection.get(node.attr('data-cid'));
                    startDate = moment(node.closest('.day').data('date'));
                },
                update: function (e) {
                    if (first) {
                        this.$('[data-cid="' + model.cid + '"]').addClass('resizing').removeClass('current hover');
                        this.$el.addClass('no-select');
                        first = false;
                    }

                    var target = $(e.currentTarget), cell, targetDate;
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

            var startMoment = moment.max(model.getMoment('startDate'), this.model.get('startDate')).clone(),
                endMoment = moment.min(model.getMoment('endDate'), this.model.get('endDate')).clone();

            // fix full-time values
            if (util.isAllday(model)) endMoment.subtract(1, 'millisecond');

            if (_.device('smartphone')) return this.renderAppointmentIndicator($('#' + startMoment.format('YYYY-M-D') + ' .list', this.$el).empty());

            // draw across multiple days
            while (startMoment.isSameOrBefore(endMoment)) {
                var cell = this.$('#' + startMoment.format('YYYY-M-D') + ' .list');
                cell.append(this.renderAppointment(model));
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

    return PerspectiveView.extend({

        className: 'monthview-container',

        options: {
            limit: 1000
        },

        initialize: function (opt) {
            this.app = opt.app;

            this.model = new Backbone.Model({
                date: opt.startDate || moment(this.app.props.get('date'))
            });
            this.initializeSubviews();

            this.setStartDate(this.model.get('date'), { silent: true });

            PerspectiveView.prototype.initialize.call(this, opt);
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

        setStartDate: function (value, options) {
            var previous = moment(this.model.get('startDate')),
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

            this.setCollection(collection);
            $.when(this.app.folder.getData(), this.app.folders.getData()).done(function (folder, folders) {
                self.model.set('folders', folders);
                collection.sync();
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
            if (_(folders).keys().length === 1) title = folders[_(folders).keys()[0]].display_title || folders[_(folders).keys()[0]].title;

            print.request('io.ox/calendar/month/print', {
                current: this.model.get('startOfMonth').valueOf(),
                start: this.model.get('startDate').valueOf(),
                end: this.model.get('endDate').valueOf(),
                folders: folders,
                title: title
            });
        }

    });

});
