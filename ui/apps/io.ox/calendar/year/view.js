/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/calendar/year/view', [
    'io.ox/backbone/views/datepicker',
    'io.ox/calendar/perspective',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/year/style'
], function (Datepicker, perspective, gt) {

    'use strict';

    var YearView = Backbone.View.extend({

        className: 'month-container',

        events: {
            'click': 'onClick'
        },

        initialize: function (opt) {
            this.date = moment(opt.date);
            this.app = opt.app;
            this.perspective = opt.perspective;

            this.listenTo(this.model, 'change:numPerRow', this.onChangeNumRow);
            this.onChangeNumRow();
        },

        renderCaption: function () {
            return $('<caption>').append(
                $('<h2>').append(
                    $('<button type="button" class="btn btn-link">').text(this.date.format('MMMM'))
                )
            );
        },

        renderHeader: function () {
            var firstDayOfWeek = moment.localeData().firstDayOfWeek();
            return $('<thead>').append(
                $('<th class="cw">').text(gt('CW')),
                _.range(firstDayOfWeek, firstDayOfWeek + 7).map(function (index) {
                    var day = moment().day(index % 7),
                        cell = $('<th>').text(day.format('dd'));
                    if (day.day() === 0 || day.day() === 6) cell.addClass('weekend');
                    return cell;
                })
            );
        },

        renderBody: function () {
            var body = $('<tbody>'),
                week = moment(this.date).startOf('week'),
                endOfMonth = moment(this.date).endOf('month').endOf('week'),
                today = moment();

            for (; week.isBefore(endOfMonth); week.add(1, 'week')) {
                var row = $('<tr>'),
                    day = moment(week),
                    endOfWeek = moment(week).endOf('week');

                row.append($('<td class=cw>').text(day.format('w')));
                for (; day.isBefore(endOfWeek); day.add(1, 'day')) {
                    var cell = $('<td>').text(day.date());
                    if (day.day() === 0 || day.day() === 6) cell.addClass('weekend');
                    if (!day.isSame(this.date, 'month')) {
                        cell.addClass('out');
                        cell.empty().append($('<span aria-hidden="true" role="presentation">').text(day.date()));
                    }
                    if (day.isSame(today, 'day')) cell.addClass('today');
                    row.append(cell);
                }

                body.append(row);
            }

            return body;
        },

        render: function () {
            this.$el.append(
                $('<table class="month">').append(
                    this.renderCaption(),
                    this.renderHeader(),
                    this.renderBody()
                )
            );
            return this;
        },

        onChangeNumRow: function () {
            this.$el.css('width', (100 / this.model.get('numPerRow')) + '%');
        },

        onClick: function () {
            this.app.props.set('date', this.date.valueOf());
            this.app.props.set('layout', 'month');
            this.$el.closest('.year-view').busy()
                .find('button').prop('disabled', true);
        }

    });

    var YearDatepicker = Datepicker.extend({
        switchMode: function (mode, value) {
            this.trigger('select:year', value);
            this.close();
        },
        onToday: function () {
            this.setDate(this.getToday());
            this.$grid.focus();
        }
    });

    var Header = Backbone.View.extend({

        className: 'header',

        attributes: {
            role: 'toolbar'
        },

        events: {
            'click .prev': 'onPrev',
            'click .next': 'onNext',
            'click .info': 'onInfo'
        },

        initialize: function (opt) {
            this.app = opt.app;

            this.listenTo(this.model, 'change:year', this.onChangeYear);
        },

        render: function () {
            var self = this;

            this.$el.append(
                $('<a href="#" role="button" class="control prev">').attr({
                    title: gt('Previous year'),
                    'aria-label': gt('Previous year')
                })
                .append($('<i class="fa fa-chevron-left" aria-hidden="true">')),
                $('<a href="#" role="button" class="control next">').attr({
                    title: gt('Next year'),
                    'aria-label': gt('Next year')
                })
                .append($('<i class="fa fa-chevron-right" aria-hidden="true">')),
                this.$yearInfo = $('<a href="#" class="info">').text(this.model.get('year'))
            );

            new YearDatepicker({ date: this.app.getDate().year(), todayButton: false })
                .attachTo(this.$yearInfo)
                .on('before:open', function () {
                    var year = self.app.getDate().year();
                    this.setDate(moment().year(year));
                    this.mode = 'decade';
                })
                .on('select:year', function (year) {
                    self.setYear({ year: year });
                });

            this.listenTo(this.app.props, 'change:date', function () {
                if (!this.$el.is(':visible')) return;
                var year = this.app.getDate().year();
                if (ox.debug) console.log('year: change:date', year);
                this.setYear({ year: year });
            });

            return this;
        },

        onChangeYear: function () {
            this.$yearInfo.text(this.model.get('year'));
        },

        onInfo: function (e) {
            e.preventDefault();
        },

        onPrev: function (e) {
            e.preventDefault();
            this.setYear({ inc: -1 });
        },

        onNext: function (e) {
            e.preventDefault();
            this.setYear({ inc: 1 });
        },

        setYear: function (opt) {
            var year = opt.year || (this.app.getDate().year() + (opt.inc || 0));
            this.app.setDate(moment([year]));
        }

    });

    var View = perspective.View.extend({

        className: 'year-view',

        initialize: function (opt) {
            this.app = opt.app;

            this.model = new Backbone.Model({
                year: this.app.getDate().year(),
                numPerRow: this.getNumPerRow()
            });

            this.listenTo(this.model, 'change:year', this.getCallback('onChangeYear'));
            this.listenTo(this.app, 'change:folderview', this.onWindowResize);
            this.listenToDOM(window, 'resize', this.onWindowResize);
            this.on('show', this.onShow);

            perspective.View.prototype.initialize.call(this, opt);
        },

        renderViews: function () {
            var start = moment().year(this.model.get('year')).startOf('year'),
                end = moment().year(this.model.get('year')).endOf('year'),
                container = this.$('.year-view-container').empty();
            if (container.length === 0) container = $('<div class="year-view-container">');
            for (; start.isBefore(end); start.add(1, 'month')) {
                container.append(
                    new YearView({
                        date: moment(start),
                        app: this.app,
                        model: this.model
                    }).render().$el
                );
            }
            return container;
        },

        render: function () {
            this.onWindowResize();

            this.$el.append(
                new Header({ app: this.app, model: this.model }).render().$el,
                this.renderViews()
            );

            return this;
        },

        onShow: function () {
            this.$('button').prop('disabled', false);
            this.$el.idle();
        },

        onWindowShow: function () {
            if (this.$el.is(':visible')) this.trigger('show');
        },

        onChangeDate: function (model, date) {
            date = moment(date);
            this.model.set('year', date.year());
        },

        onChangeYear: function () {
            this.renderViews();
        },

        getNumPerRow: function () {
            var minWidth = 250,
                width = this.$el.width(),
                numPerRow = ((width / minWidth) >> 0),
                allowed = [1, 2, 3, 4, 6];
            if (allowed.indexOf(numPerRow) < 0) {
                if (numPerRow <= 0) numPerRow = 1;
                else if (numPerRow > 6) numPerRow = 6;
                else if (numPerRow === 5) numPerRow = 4;
                else numPerRow = 1;
            }
            return numPerRow;
        },

        onWindowResize: function () {
            this.model.set('numPerRow', this.getNumPerRow());
        }

    });

    return View;

});
