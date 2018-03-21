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

define('io.ox/calendar/year/view', [
    'gettext!io.ox/calendar'
], function (gt) {

    'use strict';

    var View = Backbone.View.extend({

        tagName: 'table',

        className: 'month',

        events: {
            'click': 'onClick'
        },

        initialize: function (opt) {
            this.date = moment(opt.date);
            this.app = opt.app;
            this.perspective = opt.perspective;
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
                    if (index === 0 || index === 6) cell.addClass('weekend');
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
                this.renderCaption(),
                this.renderHeader(),
                this.renderBody()
            );
            return this;
        },

        onClick: function () {
            this.app.refDate = moment(this.date);
            this.app.props.set('layout', 'month');
            this.$el.closest('.year-view').busy()
                .find('button').prop('disabled', true);
        }

    });

    return View;

});
