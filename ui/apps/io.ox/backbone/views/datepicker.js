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
    // - date: the predefined date, either number, a native Date instance, or a momentjs instance
    // - target: the DOM element to attach to

    var DatePickerView = DisposableView.extend({

        className: 'date-picker',

        events: {
            'click .btn-prev, .btn-next': 'onNavigate',
            'click .btn-today': 'onToday',
            'click .switch-mode': 'onSwitchMode',
            'click .date': 'onSelectDate',
            'keydown': 'onKeydown'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            this.options = options || {};
            this.$target = $(this.options.target);
            this.date = moment(this.options.date);
            this.mode = 'month';
            this.closing = false;
            // the original constructor will call initialize()
            DisposableView.prototype.constructor.apply(this, arguments);
            this.renderScaffold();
            this.on({
                select: function (date) {
                    this.date = date.clone();
                    this.close();
                },
                dispose: function () {
                    this.$target
                        .off({
                            change: this.onTargetInput,
                            click: this.open,
                            dispose: this.remove,
                            focus: this.open,
                            focusout: this.focusOut,
                            input: this.onTargetInput,
                            keydown: this.onTargetKeydown
                        })
                        .closest('.scrollable').off('scroll', this.close);
                    $(window).off('resize', $.proxy(this.onWindowResize, this));
                }
            });
            this.focusOut = _.debounce(function () {
                var active = document.activeElement;
                if (this.disposed) return;
                if (this.el === active) return;
                if (this.$target[0] === active) return;
                if ($.contains(this.el, active)) return;
                this.close(false);
            }, 1);
            this.$el.on('focusout', $.proxy(this.focusOut, this));
            $(window).on('resize', $.proxy(this.onWindowResize, this));
        },

        //
        // Focus behavior
        //
        // <input> field:
        // - opens on focus and on click
        // - the focus is not changed
        // - closes if the focus moves along (neither on input or picker)
        //
        // non-input element:
        // - opens on click (i.e. mouse click and enter)
        // - focus is always moved to picker to allow keyboard usage
        // - closes if the focus moves along (neither on input or picker)
        //
        attachTo: function (target) {
            this.$target = $(target);
            if (this.$target.is(':input')) {
                // just open from input fields (no toggle)
                this.$target.on('focus click', $.proxy(this.open, this));
                this.on('select', function () {
                    this.$target.val(this.date.format('l')).trigger('change');
                });
            } else {
                // click (i.e. mouse click and enter) to toggle
                this.$target.on('click', $.proxy(this.toggle, this));
            }
            this.$target
                .attr({
                    'aria-haspopup': true,
                    'aria-expanded': false
                })
                .on('change input', $.proxy(this.onTargetInput, this))
                .on('keydown', $.proxy(this.onTargetKeydown, this))
                .on('focusout', $.proxy(this.focusOut, this))
                .on('dispose', $.proxy(this.remove, this))
                .closest('.scrollable').on('scroll', $.proxy(this.close, this));
            return this;
        },

        toggle: function () {
            if (this.isOpen()) this.close(); else this.open();
        },

        open: function () {
            if (this.isOpen() || this.closing) return;
            // render first to have dimensions
            this.render().$el.appendTo('body');
            // find proper placement
            var offset = this.$target.offset() || { top: 200, left: 600 },
                targetHeight = this.$target.outerHeight() || 0,
                maxHeight = $('body').height();
            // exceeds screen bottom?
            if ((offset.top + targetHeight + this.$el.outerHeight()) > maxHeight) {
                // above
                this.$el.css({ top: 'auto', bottom: maxHeight - offset.top });
            } else {
                // below
                this.$el.css({ top: offset.top + targetHeight, bottom: 'auto' });
            }
            this.$el.css({ left: offset.left }).addClass('open');
            this.$target.attr('aria-expanded', true);
            // only change for non-input fields
            if (!this.$target.is(':input')) this.$el.focus();
            this.trigger('open');
        },

        close: function (restoreFocus) {
            if (!this.isOpen()) return;
            this.closing = true;
            this.$el.removeClass('open');
            this.$target.attr('aria-expanded', false);
            if (restoreFocus !== false) this.$target.focus();
            this.closing = false;
            this.trigger('close');
        },

        isOpen: function () {
            return this.$el.hasClass('open');
        },

        onWindowResize: function () {
            if (this.isOpen()) this.close();
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
                                                    'data-date': m.valueOf()
                                                })
                                                .toggleClass('outside', m.month() !== month)
                                                .toggleClass('weekend', m.day() === 0 || m.day() === 6)
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
            if (this.mode !== 'month') {
                // switch to current date in month view
                this.mode = 'month';
                this.setDate(moment());
                this.$grid.focus();
            } else {
                // select current date and close picker
                this.trigger('select', moment());
            }
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
            var date = moment($(e.currentTarget).data('date'));
            this.trigger('select', date);
        },

        onKeydown: (function () {

            var movement = {
                horizontal: { month: { day: 1 }, year: { month: 1 }, decade: { year: 1 } },
                vertical: { month: { week: 1 }, year: { months: 3 }, decade: { years: 3 } }
            };

            return function (e) {

                switch (e.which) {
                    case 9:
                        handleTab.call(this, e);
                        return;
                    case 13:
                        handleEnter.call(this, e);
                        return;
                    case 27:
                        handleEscape.call(this, e);
                        return;
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

                // some keys interfere with outer UI so we stop bubbling
                e.stopPropagation();
            };

            function handleTab(e) {

                var tabbable = this.$(':input, :button'),
                    index = tabbable.index(e.target),
                    lowOut = e.shiftKey && index === 0,
                    highOut = !e.shiftKey && index === tabbable.length - 1;

                // apply focus trap
                if (lowOut || highOut) e.preventDefault();
                if (!this.$target.length) return;
                // set proper focus
                if (lowOut) this.$target.focus();
                else if (highOut) focusNext.call(this);
            }

            function focusNext() {
                var all = $('input, select, textarea, button, a[href], [tabindex]').filter(':visible'),
                    index = all.index(this.$target);
                all.eq(index + 1).focus();
            }

            function handleEscape() {
                this.close();
            }

            function handleEnter() {
                // handle enter only if focus is on grid
                if (this.$grid[0] !== document.activeElement) return;
                if (this.mode === 'month') {
                    this.trigger('select', this.date.clone());
                } else {
                    var selected = this.$('[aria-selected="true"]'),
                        mode = selected.attr('data-mode');
                    if (mode) this.switchMode(mode, selected.data('value'));
                }
            }

            function handlePageUpDown(e) {
                var interval = {}, up = e.which === 33, sign = up ? -1 : +1;
                switch (this.mode) {
                    case 'month': interval.month = sign * (e.shiftKey ? 12 : 1); break;
                    case 'year': interval.year = sign * (e.shiftKey ? 10 : 1); break;
                    case 'decade': interval.year = sign * (e.shiftKey ? 100 : 10); break;
                    // no default
                }
                this.setDate(this.date.clone().add(interval));
            }

            function handleHomeEnd(e) {
                var isEnd = e.which === 35, fn = isEnd ? 'endOf' : 'startOf';
                this.setDate(this.date.clone()[fn]('month'));
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
                this.$grid.focus();
            }

        }()),

        onTargetKeydown: function (e) {

            switch (e.which) {
                // capture tab (not shift-tab) if open
                case 9:
                    if (e.shiftKey || !this.isOpen()) return;
                    e.preventDefault();
                    this.$el.focus();
                    break;
                case 13:
                case 27:
                    this.toggle();
                    break;
                // no default
            }
        },

        onTargetInput: function () {
            var val = this.$target.val(), date = moment(val, 'l');
            this.setDate(date);
        },

        setDate: function (date) {

            date = moment(date || this.date);
            // valid?
            if (!date.isValid()) return;
            // avoid BC
            if (date.year() <= 0) return;

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
