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
            'click .switch-mode': 'onSwitchMode',
            'click .date': 'onSelectDate',
            'keydown': 'onKeydown',
            'keydown .grid': 'onGridKeydown'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            this.options = options || {};
            this.target = $(this.options.target);
            this.date = moment(this.options.date);
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
            this.trigger('open');
            return this;
        },

        close: function () {
            this.$el.hide();
            this.trigger('close');
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
                    $('<button role="button" class="btn-prev pull-left"><i class="fa fa-chevron-left" aria-hidden="true"></i></button>'),
                    $('<span role="header" aria-live="assertive" aria-atomic="true">').attr('id', headerId),
                    $('<button role="button" class="btn-next pull-right"><i class="fa fa-chevron-right" aria-hidden="true"></i></button>')
                ),
                this.$grid = $('<table class="grid" role="grid" tabindex="0">')
                    .attr('aria-label', gt('Use cursor keys to navigate, press enter to select a date')),
                $('<button role="button" class="btn-today">')
                    .attr('aria-label', 'Go to today')
                    .text(gt('Today'))
            );
        },

        renderHeader: function () {
            this.$('[role="header"]').empty().append(_(arguments).toArray());
        },

        renderGrid: function () {
            this.$grid.empty().append(_(arguments).toArray());
        },

        setActiveDescedant: function (id) {
            if (!id) {
                var selected = this.$grid.find('[aria-selected="true"]');
                id = (selected.length ? selected : this.$grid.find('td:first').attr('aria-selected', true)).attr('id');
            }
            this.$grid.attr('aria-activedescendant', id);
        },

        setNavigationLabels: function (prev, next) {
            this.$('.btn-prev').attr('aria-label', prev);
            this.$('.btn-next').attr('aria-label', next);
        },

        renderMonth: function () {

            var current = this.date.clone().startOf('day'),
                m = current.clone();

            this.renderHeader(
                $('<button role="button" class="switch-mode">')
                    .attr({
                        'data-mode': 'year',
                        'data-value': m.year()
                    })
                    .text(m.format('MMMM YYYY'))
            );

            this.setNavigationLabels(gt('Go to previous month'), gt('Go to next month'));

            this.renderGrid(
                $('<thead>').append(
                    $('<tr role="row">')
                        // add empty <th> due to calendar week column
                        .append($('<th class="cw weekday">').text(gt('CW')))
                        .append(function () {
                            var w = m.clone().day(0);
                            return _.range(0, 7).map(function () {
                                w.add(1, 'day');
                                return $('<th class="weekday">')
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
                            return $('<tr role="row">')
                                .append(
                                    $('<th class="cw date">').text(m.week())
                                )
                                .append(function () {
                                    return _.range(0, 7).map(function () {
                                        try {
                                            return $('<td role="gridcell" class="date">')
                                                .attr({
                                                    'id': 'date_' + m.format('l'),
                                                    'aria-label': m.format('l, dddd'),
                                                    'aria-selected': isSame(m, current),
                                                    'date-date': m.valueOf()
                                                })
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

            this.setActiveDescedant();
        },

        renderYear: function () {

            var current = this.date.month(),
                m = this.date.clone().month(0);

            this.renderHeader(
                $('<button role="button" class="switch-mode">')
                    .attr({
                        'data-mode': 'decade',
                        'data-value': m.year()
                    })
                    .text(m.format('YYYY'))
            );

            this.setNavigationLabels(gt('Go to previous year'), gt('Go to next year'));

            this.renderGrid(function () {
                return _.range(0, 4).map(function () {
                    return $('<tr role="row">').append(function () {
                        return _.range(0, 3).map(function () {
                            try {
                                return $('<td role="gridcell" class="month switch-mode">')
                                    .attr({
                                        'id': 'month_' + m.format('YYYY-MM'),
                                        'aria-label': m.format('MMMM YYYY'),
                                        'aria-selected': m.month() === current,
                                        'data-mode': 'month',
                                        'data-value': m.month()
                                    })
                                    .text(m.format('MMM'));
                            } finally {
                                m.add(1, 'month');
                            }
                        });
                    });
                });
            });

            this.setActiveDescedant();
        },

        renderDecade: function () {

            var current = this.date.year(),
                m = this.date.clone();

            m.year(Math.floor(m.year() / 10) * 10);

            this.renderHeader(
                $('<caption>').text(m.format('YYYY') + ' - ' + m.clone().add(12, 'years').format('YYYY'))
            );

            this.setNavigationLabels(gt('Go to previous decade'), gt('Go to next decade'));

            this.renderGrid(function () {
                return _.range(0, 4).map(function () {
                    return $('<tr role="row">').append(function () {
                        return _.range(0, 3).map(function () {
                            try {
                                return $('<td role="gridcell" class="year switch-mode">')
                                    .attr({
                                        'id': 'year_' + m.year(),
                                        'aria-selected': m.year() === current,
                                        'data-mode': 'year',
                                        'data-value': m.year()
                                    })
                                    .text(m.format('YYYY'));
                            } finally {
                                m.add(1, 'year');
                            }
                        });
                    });
                });
            });

            this.setActiveDescedant();
        },

        onNavigate: function (e) {
            var fn = $(e.currentTarget).hasClass('btn-prev') ? 'subtract' : 'add',
                date = this.date.clone();
            switch (this.mode) {
                case 'decade': date[fn](10, 'years'); break;
                case 'year': date[fn](1, 'year'); break;
                default: date[fn](1, 'month'); break;
            }
            this.setDate(date);
        },

        onToday: function () {
            this.mode = 'month';
            this.setDate(moment());
            this.$grid.focus();
        },

        switchMode: function (mode, value) {
            this.mode = mode;
            var date = this.date.clone();
            switch (this.mode) {
                case 'year': date.year(value); break;
                case 'month': date.month(value); break;
                // no default
            }
            this.setDate(date);
            this.$grid.focus();
        },

        onSwitchMode: function (e) {
            var node = $(e.currentTarget), value = node.data('value');
            this.switchMode(node.attr('data-mode'), value);
        },

        onSelectDate: function (e) {
            var date = moment($(e.currentTarget).attr('data-date'));
            this.close();
            this.trigger('select', date);
        },

        onKeydown: (function () {

            function handleFocusChange($el, e) {
                var tabbable = $el.find(':input, :button'),
                    index = tabbable.index(e.target);
                if ((e.shiftKey && index === 0) || (!e.shiftKey && index === tabbable.length - 1)) e.preventDefault();
            }

            return function (e) {
                // escape
                if (e.which === 27) return this.close();
                // focus trap
                if (e.which === 9) return handleFocusChange(this.$el, e);
            };
        }()),

        onGridKeydown: (function () {

            var movement = {
                horizontal: { month: { day: 1 }, year: { month: 1 }, decade: { year: 1 } },
                vertical: { month: { week: 1 }, year: { months: 3 }, decade: { years: 3 } }
            };

            return function (e) {

                switch (e.which) {
                    case 13:
                        handleEnter.call(this, e);
                        break;
                    case 33:
                    case 34:
                        handlePageUpDown.call(this, e);
                        break;
                    case 35:
                    case 36:
                        handleHomeEnd.call(this, e);
                        break;
                    case 37:
                    case 38:
                    case 39:
                    case 40:
                        handleCursor.call(this, e);
                        break;
                    // no default
                }
            };

            function handleEnter() {
                var selected = this.$('[aria-selected="true"]'),
                    mode = selected.attr('data-mode');
                if (mode) this.switchMode(mode, selected.data('value'));
            }

            function handlePageUpDown(e) {
                var up = e.which === 33, step = e.shiftKey ? 'year' : 'month';
                this.setDate(this.date.clone().add(up ? -1 : +1, step));
            }

            function handleHomeEnd(e) {
                var isEnd = e.which === 35, fn = isEnd ? 'endOf' : 'startOf';
                this.setDate(this.date.clone().current[fn]('month'));
            }

            function handleCursor(e) {

                var selected = this.$('[aria-selected="true"]'),
                    type = 'add', direction = 'horizontal';

                // take care of the unexpected
                if (!selected.length) return this.setDate();

                switch (e.which) {
                    // cursor left (nothing to do for cursor right)
                    case 37: type = 'subtract'; break;
                    // cursor up
                    case 38: type = 'subtract'; direction = 'vertical'; break;
                    // cursor down
                    case 40: direction = 'vertical'; break;
                    // no default
                }

                this.setDate(this.date.clone()[type](movement[direction][this.mode]));
            }

        }()),

        setDate: function (date) {

            date = (date || this.date).clone();

            // update internal date
            var isSame = date.isSame(this.date);
            this.date = date;

            var selector,
                select = function (node) {
                    if (!node.length) return;
                    this.$('[aria-selected="true"]').attr('aria-selected', false);
                    node.attr('aria-selected', true);
                    this.setActiveDescedant(node.attr('id'));
                }.bind(this);

            // currently visible?
            switch (this.mode) {
                case 'decade': selector = '#year_' + this.date.year(); break;
                case 'year': selector = '#month_' + this.date.format('YYYY-MM'); break;
                case 'month': selector = '#date_' + $.escape(this.date.format('l')); break;
                // no default
            }
            // found?
            var node = this.$grid.find(selector);
            if (node.length) select(node); else this.render();
            if (!isSame) this.trigger('change', this.date);
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
