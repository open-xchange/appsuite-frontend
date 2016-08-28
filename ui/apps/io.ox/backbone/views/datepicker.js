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

define('io.ox/backbone/views/datepicker', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core',
    'less!io.ox/backbone/views/datepicker'
], function (DisposableView, gt) {

    'use strict';

    //
    // Date picker
    //
    // options:

    var DatePickerView = DisposableView.extend({

        className: 'date-picker',

        events: {
            'click .btn-prev, .btn-next': 'onNavigate',
            'click .btn-today': 'onToday',
            'click .date': 'onChangeDate',
            'click .switch-mode': 'onSwitchMode',
            'keydown': 'onKeydown',
            'keydown .grid': 'onCursor'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            this.options = options || {};
            this.target = $(this.options.target);
            this.dates = {
                current: moment(this.options.date),
                display: moment(this.options.date).date(1)
            };
            this.mode = 'month';
            // the original constructor will call initialize()
            DisposableView.prototype.constructor.apply(this, arguments);
            this.renderScaffold();
        },

        attachTo: function (target) {
            this.target = $(target);
            $(this.target).on('focus', $.proxy(this.open, this));
            return this;
        },

        open: function () {
            var offset = this.target.offset() || { top: '30%', left: '40%' };
            this.render().$el.appendTo('body').css({ top: offset.top, left: offset.left }).show();
        },

        close: function () {
            this.$el.hide();
        },

        render: function () {
            switch (this.mode) {
                case 'decade': this.renderDecade(); break;
                case 'year': this.renderYear(); break;
                default: this.renderMonth(); break;
            }
            return this;
        },

        renderScaffold: function () {
            var headerId = _.uniqueId('header');
            this.$el.attr({ 'aria-labelledby': headerId, 'role': 'region', 'tabindex': 0 }).append(
                $('<div class="navigation">').append(
                    $('<a href="#" role="button" class="control btn-prev pull-left"><i class="fa fa-chevron-left"></i></a>'),
                    $('<span role="header">').attr('id', headerId),
                    $('<a href="#" role="button" class="control btn-next pull-right"><i class="fa fa-chevron-right"></i></a>')
                ),
                $('<table class="grid" role="grid" tabindex="0">'),
                $('<a href="#" role="button" class="control btn-today">').text(gt('Today'))
            );
        },

        renderHeader: function () {
            this.$('[role="header"]').empty().append(_(arguments).toArray());
        },

        renderGrid: function () {
            this.$('.grid').empty().append(_(arguments).toArray());
        },

        renderMonth: function () {

            var current = this.dates.current.clone().startOf('day'),
                m = this.dates.display.clone();

            this.renderHeader(
                $('<a href="#" role="button" class="control switch-mode">')
                    .attr({ 'data-mode': 'year', 'data-value': m.year() })
                    .text(m.format('MMMM YYYY'))
            );

            this.renderGrid(
                $('<thead>').append(
                    $('<tr class="weekdays">').append(function () {
                        var w = m.clone().day(0);
                        return _.range(0, 7).map(function () {
                            w.add(1, 'day');
                            return $('<td class="weekday">')
                                .toggleClass('weekend', w.day() === 0 || w.day() === 6)
                                .text(w.format('dd'));
                        });
                    })
                ),
                $('<tbody>').append(
                    function () {
                        var month = m.date(1).month(), start = m.clone(), end = m.clone().endOf('month');
                        if (m.day(1).isAfter(start)) m.subtract(1, 'week');
                        return _.range(0, Math.ceil(end.diff(m, 'days') / 7)).map(function () {
                            return $('<tr class="week">').append(function () {
                                return _.range(0, 7).map(function () {
                                    try {
                                        return $('<td role="gridcell" class="control date">')
                                            .attr('aria-selected', isSame(m, current))
                                            .data('date', m.valueOf())
                                            .toggleClass('inside', m.month() === month)
                                            .toggleClass('today', isToday(m))
                                            .text(m.format('D'));
                                    } finally {
                                        m.add(1, 'day');
                                    }
                                });
                            });
                        });
                    }
                )
            );
        },

        renderYear: function () {

            var m = this.dates.display.clone().month(0);

            this.renderHeader(
                $('<a href="#" role="button" class="control switch-mode">')
                    .attr({ 'data-mode': 'decade', 'data-value': m.year() })
                    .text(m.format('YYYY'))
            );

            this.renderGrid(function () {
                return _.range(0, 4).map(function () {
                    return $('<tr>').append(function () {
                        return _.range(0, 3).map(function () {
                            try {
                                return $('<td role="gridcell" class="control month switch-mode">')
                                    .attr({ 'aria-selected': false, 'data-mode': 'month', 'data-value': m.month() })
                                    .text(m.format('MMM'));
                            } finally {
                                m.add(1, 'month');
                            }
                        });
                    });
                });
            });
        },

        renderDecade: function () {

            var m = this.dates.display.clone(), year = m.year();
            m.year(Math.floor(year / 10) * 10);

            this.renderHeader(
                $('<span class="control">').text(m.format('YYYY') + ' - ' + m.clone().add(12, 'years').format('YYYY'))
            );

            this.renderGrid(function () {
                return _.range(0, 4).map(function () {
                    return $('<tr>').append(function () {
                        return _.range(0, 3).map(function () {
                            try {
                                return $('<span href="#" role="button" class="control year switch-mode">')
                                    .attr({ 'aria-selected': false, 'data-mode': 'year', 'data-value': m.year() })
                                    .text(m.format('YYYY'));
                            } finally {
                                m.add(1, 'year');
                            }
                        });
                    });
                });
            });
        },

        onNavigate: function (e) {
            e.preventDefault();
            var fn = $(e.currentTarget).hasClass('btn-prev') ? 'subtract' : 'add',
                date = this.dates.display;
            switch (this.mode) {
                case 'decade': date[fn](10, 'years'); break;
                case 'year': date[fn](1, 'year'); break;
                default: date[fn](1, 'month'); break;
            }
            this.render();
        },

        onChangeDate: function (e) {
            e.preventDefault();
            this.setCurrentDate($(e.currentTarget).data('date'));
        },

        onToday: function (e) {
            e.preventDefault();
            this.setCurrentDate(moment());
            this.mode = 'month';
            this.render();
        },

        setCurrentDate: function (t) {
            var m = moment(t);
            this.dates.current = m.clone();
            this.dates.display = m.clone().date(1);
        },

        onSwitchMode: function (e) {
            e.preventDefault();
            var node = $(e.currentTarget),
                date = this.dates.display,
                value = node.data('value');
            this.mode = node.attr('data-mode');
            switch (this.mode) {
                case 'year': date.year(value); break;
                case 'month': date.month(value); break;
                // no default
            }
            this.render();
        },

        onKeydown: function (e) {
            // escape
            if (e.which === 27) this.close();
        },

        onCursor: function (e) {

            // consider cursor movement only
            if (e.which < 37 || e.which > 40) return;

            var selected = this.$('[aria-selected="true"]'),
                row = selected.parent(),
                index = row.children().index(selected),
                length = row.children().length;

            function select(node) {
                if (!node.length) return;
                selected.attr('aria-selected', false);
                node.attr('aria-selected', true);
            }

            switch (e.which) {
                // cursor left
                case 37:
                    select(index === 0 ? row.prev().children().last() : selected.prev());
                    break;
                // cursor right
                case 39:
                    select(index === length - 1 ? row.next().children().first() : selected.next());
                    break;
                // cursor up
                case 38:
                    select(row.prev().children().eq(index));
                    break;
                // cursor down
                case 40:
                    select(row.next().children().eq(index));
                    break;
                // no default
            }
        }
    });

    function isSame(a, b) {
        return a.clone().startOf('day').isSame(b.clone().startOf('day'));
    }

    function isToday(m) {
        return isSame(m, moment());
    }

    return DatePickerView;
});
