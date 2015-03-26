/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/calendar/edit/recurrence-view', [
    'io.ox/core/tk/keys',
    'gettext!io.ox/calendar/edit/main',
    'less!io.ox/calendar/edit/recurrence-view-style'
], function (KeyListener, gt) {

    'use strict';

    // First, some constants
    // A series is of a certain recurrence type
    // daily, weekly, monhtly, yearly, no_recurrence
    var RECURRENCE_TYPES = {
        NO_RECURRENCE: 0,
        DAILY: 1,
        WEEKLY: 2,
        MONTHLY: 3,
        YEARLY: 4
    };

    // Sometimes we need to reference a certain day, so
    // here are the weekdays, bitmap-style
    var DAYS = {
        SUNDAY: 1,
        MONDAY: 2,
        TUESDAY: 4,
        WEDNESDAY: 8,
        THURSDAY: 16,
        FRIDAY: 32,
        SATURDAY: 64,
        i18n: {
            SUNDAY: moment.weekdays(0),
            MONDAY: moment.weekdays(1),
            TUESDAY: moment.weekdays(2),
            WEDNESDAY: moment.weekdays(3),
            THURSDAY: moment.weekdays(4),
            FRIDAY: moment.weekdays(5),
            SATURDAY: moment.weekdays(6)
        },
        values: [
            'SUNDAY',
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY'
        ],
        // Usage: DAYS.pack('monday', 'wednesday', 'friday') -> some bitmask
        pack: function () {
            var result = 0;
            _(arguments).each(function (day) {
                var dayConst = DAYS[day.toUpperCase()];

                if (_.isUndefined(dayConst)) {
                    throw 'Invalid day: ' + day;
                }
                result = result | dayConst;
            });
            return result;
        },
        // Usage: DAYS.unpack(bitmask) -> {'MONDAY': 1, 'WEDNESDAY': 1, 'FRIDAY': 1 }
        unpack: function (bitmask) {
            var days = {};
            _(DAYS.values).each(function (day) {
                var dayConst = DAYS[day];
                if (bitmask & dayConst) {
                    days[day] = 1;
                } else {
                    days[day] = 0;
                }
            });

            return days;
        }
    };

    // rotate DAYS once to have a localized order
    for (var i = 0; i < moment.localeData().firstDayOfWeek(); i++) {
        DAYS.values.push(DAYS.values.shift());
    }

    // helper to get days bitmask
    function getDays(additionalBits) {
        var bits = {};
        _(DAYS.values).each(function (bit) {
            // need to use prefixed strings to keep order
            bits['bit_' + DAYS[bit]] = DAYS.i18n[bit];
        });
        _(additionalBits).each(function (label, bit) {
            bits['bit_' + bit] = label;
        });
        return bits;
    }

    var Widgets = {

        number: function ($anchor, attribute, options) {
            var self = this,
                originalContent = $anchor.html();

            // check options
            if (!options || !options.initial || !options.phrase) {
                return false;
            }

            self[attribute] = options.initial;

            function drawState() {
                var value = self[attribute];
                $anchor.text(options.phrase(value)).focus();
                self.trigger('redraw', self);
                $anchor.attr('aria-label', self.ghost());
            }

            $anchor.on('click', function (e) {
                e.preventDefault();
                var type = (Modernizr.inputtypes.number && _.device('smartphone')) ? 'number' : 'text',
                    $numberInput = $('<input type="' + type + '" size="4" tabindex="1">').css({
                        width: (Modernizr.inputtypes.number && _.device('smartphone')) ? '2em' : '1em',
                        marginBottom: 0,
                        padding: 0
                    }).val(self[attribute]);
                var keys = new KeyListener($numberInput);

                var $content = $('<span>' + originalContent + '</span>');
                $content.find('.number-control').empty().append(
                    $numberInput
                );
                $anchor.after($content);
                $anchor.hide();

                $numberInput.select();
                keys.include();

                // TODO: Allow only number entries
                function updateValue() {
                    var value = parseInt($numberInput.val(), 10);
                    if (isNaN(value)) {
                        value = options.initial || 1;
                    }
                    try {
                        $content.remove();
                    } catch (e) {}
                    $anchor.show();
                    self[attribute] = value;
                    self.trigger('change', self);
                    self.trigger('change:' + attribute, self);
                    drawState();
                    keys.destroy();
                }
                $numberInput.on('blur', function () {
                    updateValue();
                });

                // Enter
                keys.on('enter', function () {
                    updateValue();
                });

                // Escape
                keys.on('esc', function () {
                    $numberInput.val(self[attribute]);
                    keys.destroy();
                    try {
                        $content.remove();
                    } catch (e) {}
                    $anchor.show();
                });
            });

            $anchor.attr('aria-label', self.ghost());
            this.on('change:' + attribute, drawState);
        },

        options: function ($anchor, attribute, options) {

            // First we need to wrap the anchor
            var self = this;

            // check options
            if (!options || !options.options) return false;

            self[attribute] = options.initial;

            var $container = $('<span class="dropdown">');
            $anchor.after($container);
            $container.append($anchor);

            function drawState() {
                var label = options.options[self[attribute]];
                if (options.chooseLabel) {
                    label = options.chooseLabel(self[attribute]);
                }
                $anchor.text(label).focus();
                self.trigger('redraw', self);
                $anchor.attr('aria-label', self.ghost());
            }

            // Now build the menu
            var $menu = $('<ul class="dropdown-menu no-clone" role="menu">');
            _(options.options).each(function (label, value) {
                value = parseInt(String(value).replace(/^bit_/, ''), 10);
                if (label === '') {
                    $menu.append('<li class="divider" role="presentation">');
                } else {
                    $menu.append(
                        $('<li role="presentation">').append(
                            $('<a href="#" role="menuitem">').attr('tabindex', $anchor.attr('tabindex')).text(label)
                                .on('click', function (e) {
                                    // todo: DON'T DEFINE FUNCTIONS IN A LOOP!
                                    e.preventDefault();
                                    self[attribute] = value;
                                    self.trigger('change', self);
                                    self.trigger('change:' + attribute, self);
                                    drawState();
                                })
                        )
                    );
                }
            });
            $container.append($menu);

            // Tell the anchor that it triggers the dropdown
            $anchor.attr({
                'data-toggle': 'dropdown',
                'aria-haspopup': true,
                'aria-label': self.ghost()
            }).dropdown();

            this.on('change:' + attribute, drawState);
        },

        days: function ($anchor, attribute) {

            var self = this,
                nodes = {},
                $container = $('<span class="dropdown">');

            self[attribute] = Math.pow(2, moment().day());
            $anchor.after($container);
            $container.append($anchor);

            function drawState() {
                var value = DAYS.unpack(self[attribute]),
                    selectedDays = [];

                _(nodes).each(function (node, day) {
                    if (value[day]) {
                        selectedDays.push(DAYS.i18n[day]);
                        node.find('i').attr('class', 'fa fa-check');
                    } else {
                        node.find('i').attr('class', 'fa fa-fw');
                    }
                });

                $anchor.text(selectedDays.join(', ')).focus();
                self.trigger('redraw', self);
            }

            // Now build the menu
            $container.append(
                $('<ul class="dropdown-menu no-clone" role="menu">').append(
                    _(DAYS.values).map(function (day) {
                        return (nodes[day] = $('<li>').attr({
                            role: 'presentation'
                        }).append(
                            $('<a>').attr({
                                href: '#',
                                role: 'menuitem',
                                tabindex: $anchor.attr('tabindex')
                            }).append(
                                $('<i class="fa fa-check">'),
                                $.txt(DAYS.i18n[day])
                            ).on('click', function (e) {
                                e.preventDefault();
                                var bitmask = self[attribute];
                                bitmask = bitmask ^ DAYS[day];
                                if (bitmask) {
                                    self[attribute] = bitmask;
                                    self.trigger('change', self);
                                    self.trigger('change:' + attribute, self);
                                    drawState();
                                }
                                return false;
                            })
                        ));
                    })
                )
            );

            // Tell the anchor that it triggers the dropdown
            $anchor.attr({
                'data-toggle': 'dropdown',
                'aria-haspopup': true,
                'aria-label': self.ghost(),
                role: 'menuitem'
            }).dropdown();

            this.on('change:' + attribute, drawState);
        },

        datePicker: function ($anchor, attribute, options) {
            var self = this;

            // check options
            if (!options || !options.model) {
                return false;
            }

            if (options.initial) {
                self[attribute] = _.isFunction(options.initial) ? options.initial() : options.initial;
            } else {
                self[attribute] = _.now();
            }

            function renderDate() {
                var value = self[attribute];
                if (value) {
                    var myTime = moment.utc(parseInt(value, 10)).local(true);
                    if (myTime.isValid()) {
                        value = myTime.format('l');
                    } else {
                        value = '';
                    }
                } else {
                    value = '';
                }
                return value;
            }

            function drawState() {
                if (_.isFunction(options.initial) && self[attribute] <= options.model.get('start_date')) {
                    self[attribute] = options.initial();
                }
                var value = renderDate();
                $anchor.text(value).focus();
                self.trigger('redraw', self);
                $anchor.attr('aria-label', self.ghost());
                $anchor.parent().find('.dropdown a[data-toggle="dropdown"]').attr('aria-label', self.ghost());
            }

            $anchor.on('click', function (e) {
                e.preventDefault();
                var minDate = moment().startOf('day').toDate(),
                    $dateInput = $('<input type="text" class="form-control dateinput no-clone">').val(renderDate);

                if (_.device('smartphone')) {
                    require(['io.ox/core/tk/mobiscroll'], function () {
                        $dateInput.mobiscroll().date({
                            onChange: updateValue,
                            minDate: minDate
                        }).mobiscroll('show');
                    });
                } else {
                    require(['io.ox/core/tk/datepicker'], function () {
                        $dateInput.datepicker({
                            parentEl: self.$el,
                            startDate: minDate
                        });
                        $anchor.after($dateInput).hide();
                        $dateInput.select().on({
                            'hide': updateValue,
                            'keydown': function (e) {
                                if (e.which === 13) {
                                    updateValue();
                                }
                            }
                        });
                    });
                }

                // On change
                function updateValue() {
                    var value = moment($dateInput.val(), 'l');
                    if (!_.isNull(value) && value.valueOf() !== 0 && value.isValid()) {
                        self[attribute] = value.utc(true).valueOf();
                        self.trigger('change', self);
                        self.trigger('change:' + attribute, self);
                        drawState();
                    }
                    try {
                        if (_.device('smartphone')) {
                            $dateInput.mobiscroll('destroy');
                        } else {
                            $dateInput.datepicker('remove');
                        }
                        $dateInput.remove();
                    } catch (e) {}
                    $anchor.show().focus();
                }
            });

            $anchor.attr('aria-label', self.ghost());
            $anchor.parent().find('.dropdown a[data-toggle="dropdown"]').attr('aria-label', self.ghost());

            this.on('change:' + attribute, drawState);
        }

    };

    function ConfigSentence(sentence, options) {
        options = options || {};
        var self = this;

        this.set = function (key, value) {
            this[key] = value;
            this.trigger('change', this);
            this.trigger('change:' + key, this);
        };

        this.ghost = function () {
            var $ghost = this.$el.clone(false);
            $ghost.find('.no-clone, .datepicker')
                .remove();
            $ghost
                .find('*')
                .each(function () {
                    $(this).replaceWith($.txt($(this).text()));
                });
            return $ghost.text();
        };

        _.extend(this, Backbone.Events);
        this.$el = $('<span>').html(sentence);
        this.$el.find('a').each(function () {
            var $anchor = $(this),
                attribute = $anchor.data('attribute') || 'value',
                widget = $anchor.data('widget'),
                opts = options[attribute] || options;
            if (options.tabindex) {
                $anchor.attr({ tabindex: options.tabindex });
            }
            // TODO: Use ExtensionPoints here
            if (Widgets[widget]) {
                Widgets[widget].call(self, $anchor, attribute, opts, options);
            }
        });

        this.id = options.id;

    }

    // Mark a few translations, so the buildsystem picks up on them
    gt.ngettext('every %1$d day', 'every %1$d days', 2);
    gt.ngettext('every %1$d week', 'every %1$d weeks', 2);
    gt.ngettext('every %1$d month', 'every %1$d months', 2);
    gt.ngettext('after %1$d appointment', 'after %1$d appointments', 2);

    var RecurrenceView = function (options) {
        _.extend(this, {
            tabindex: 1,
            init: function () {
                var self = this;
                // Construct the UI
                this.controls = {
                    checkbox: $('<input tabindex="1" type="checkbox">'),
                    checkboxLabel: $('<label class="control-label">'),
                    detailToggle: $('<a href="#" class="recurrence-detail-toggle">').attr({
                        'role': 'button',
                        'aria-label': gt('Click to close the recurrence view')
                    }).css({ 'float': 'right' }).append($('<i class="fa fa-times">'))
                };

                // add tabindex to all control elements
                _.each(this.controls, function (value) {
                    if (!value.hasClass('control-label')) {
                        value.attr({ tabindex: self.tabindex });
                    }
                });

                this.nodes = {
                    wrapper: $('<div>').addClass('checkbox'),
                    recView: $('<form class="io-ox-recurrence-view form-inline">').hide(),
                    summary: $('<span>'),
                    typeChoice: $('<div class="inset">'),
                    hint: $('<div class="text-muted inset">'),
                    alternative1: $('<div class="inset">'),
                    alternative2: $('<div class="inset">'),
                    endsChoice: $('<div class="inset">')
                };

                // UI state
                this.more = false;

                // Config Sentences
                this.sentences = {
                    useLinksHint: gt('Click on the links to change the values.'),
                    chooseSentenceHint: gt('Click on a sentence to choose when to repeat the appointment.'),
                    rectype: new ConfigSentence(gt('The appointment is repeated <a href="#" data-attribute="recurrenceType" data-widget="options">weekly</a>.'), {
                        id: 'recurrenceType',
                        tabindex: self.tabindex,
                        recurrenceType: {
                            options: {
                                1: gt('daily'),
                                2: gt('weekly'),
                                3: gt('monthly'),
                                4: gt('yearly')
                            },
                            initial: 2
                        },
                        gt: gt
                    }).on('change', self.updateModel, self),
                    daily: new ConfigSentence(gt('The appointment is repeated <a href="#"  data-widget="number" data-attribute="interval">every <span class="number-control">2</span> days</a>.'), {
                        id: 'daily',
                        tabindex: self.tabindex,
                        phrase: function (n) {
                            if (n === 1) {
                                //#. as in: The appointment is repeated every day
                                //#. This is inserted into an HTML construct and is the form without the number
                                return gt('every day');
                            }

                            //#. as in: The appointment is repeated every day, or The appointment is repeated every %1$d days.
                            //#. This is inserted into an HTML construct.
                            gt.format(gt.ngettext('every %1$d day',
                                'every %1$d days', n), n);

                            return gt.format(gt.ngettext('every %1$d day',
                                'every %1$d days', n), n);
                        },
                        initial: 1,
                        gt: gt
                    }),
                    weekly: new ConfigSentence(gt('The appointment is repeated <a href="#"  data-widget="number" data-attribute="interval">every <span class="number-control">2</span> weeks</a> on <a href="#"  data-widget="days" data-attribute="days">monday</a>.'), {
                        id: 'weekly',
                        tabindex: self.tabindex,
                        interval: {
                            phrase: function (n) {
                                if (n === 1) {
                                    //#. as in: The appointment is repeated every week
                                    //#. This is inserted into an HTML construct and is the form without the number
                                    return gt('every week');
                                }
                                //#. as in: The appointment is repeated every week, or The appointment is repeated every %1$d weeks.
                                //#. This is inserted into an HTML construct.
                                gt.format(gt.ngettext('every %1$d week',
                                    'every %1$d weeks', n), n);

                                return gt.format(gt.ngettext('every %1$d week',
                                    'every %1$d weeks', n), n);
                            },
                            initial: 1,
                            gt: gt
                        }
                    }),
                    monthlyDate: new ConfigSentence(gt('The appointment is repeated on day <a href="#" data-widget="number" data-attribute="dayInMonth"><span class="number-control">10</span></a> <a href="#" data-widget="number" data-attribute="interval">every <span class="number-control">2</span> months</a>.'), {
                        id: 'monthlyDate',
                        tabindex: self.tabindex,
                        interval: {
                            phrase: function (n) {
                                n = Math.max(1, n);
                                if (n === 1) {
                                    //#. as in: The appointment is repeated every month
                                    //#. This is inserted into an HTML construct and is the form without the number
                                    return gt('every month');
                                }
                                //#. as in: The appointment is repeated on day 12 every month, or The appointment is repeated on day 12 every %1$d months.
                                //#. This is inserted into an HTML construct.
                                gt.format(gt.ngettext('every %1$d month',
                                    'every %1$d months', n), n);
                                return gt.format(gt.ngettext('every %1$d month',
                                    'every %1$d months', n), n);
                            },
                            initial: 1,
                            gt: gt
                        },
                        dayInMonth: {
                            phrase: function (n) {
                                return Math.max(Math.min(n, 31), 1);
                            },
                            initial: 1,
                            gt: gt
                        }
                    }),
                    monthlyDay: new ConfigSentence(gt('The appointment is repeated the <a href="#" data-widget="options" data-attribute="ordinal">second</a> <a href="#" data-widget="options" data-attribute="day">Wednesday</a> <a href="#" data-widget="number" data-attribute="interval">every <span class="number-control">2</span> months</a>.'), {
                        id: 'monthlyDay',
                        tabindex: self.tabindex,
                        ordinal: {
                            options: {
                                '-1': //#. As in last monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt('last'),

                                1:  //#. As in first monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt('first'),

                                2:  //#. As in second monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt('second'),

                                3:  //#. As in third monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt('third'),

                                4:  //#. As in fourth monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt('fourth')

                                // 5:  //#. As in last monday, tuesday, wednesday ... , day of the week, day of the weekend
                                //     gt('last')
                            }
                        },
                        day: {
                            options: getDays({
                                0: '',
                                62: gt('day of the week'),
                                65: gt('day of the weekend')
                            }),
                            chooseLabel: function (val) {
                                return this.options['bit_' + val];
                            },
                            initial: 2
                        },
                        interval: {
                            phrase: function (n) {
                                n = Math.max(1, n);
                                if (n === 1) {
                                    return gt('every month');
                                }
                                return gt.format(gt.ngettext('every %1$d month', 'every %1$d months', n), n);
                            },
                            initial: 1,
                            gt: gt
                        }
                    }),
                    yearlyDate: new ConfigSentence(gt('The appointment is repeated every year on day <a href="#" data-widget="number" data-attribute="dayInMonth"><span class="number-control">10</span></a> of <a href="#" data-widget="options" data-attribute="month">October</a>.'), {
                        id: 'yearlyDate',
                        tabindex: self.tabindex,
                        dayInMonth: {
                            phrase: function (n) {
                                return Math.max(Math.min(n, 31), 1);
                            },
                            initial: 1,
                            gt: gt
                        },
                        month: {
                            options: {
                                0: gt('January'),
                                1: gt('February'),
                                2: gt('March'),
                                3: gt('April'),
                                4: gt('May'),
                                5: gt('June'),
                                6: gt('July'),
                                7: gt('August'),
                                8: gt('September'),
                                9: gt('October'),
                                10: gt('November'),
                                11: gt('December')
                            },
                            initial: 2
                        }
                    }),
                    yearlyDay: new ConfigSentence(gt('The appointment is repeated every <a href="#" data-widget="options" data-attribute="ordinal">first</a> <a href="#" data-widget="options" data-attribute="day">Wednesday</a> in <a href="#" data-widget="options" data-attribute="month">October</a>.'), {
                        id: 'yearlyDay',
                        tabindex: self.tabindex,
                        ordinal: {
                            options: {
                                1:  //#. as in: first week or first Monday
                                    gt('first'),
                                2:  //#. as in: second week or second Monday
                                    gt('second'),
                                3:  //#. as in: third week or third Monday
                                    gt('third'),
                                4:  //#. as in: fourth week or fourth Monday
                                    gt('fourth'),
                                5:  //#. as in: last week or last Monday
                                    gt('last')
                            }
                        },
                        day: {
                            options: getDays({
                                0: '',
                                62: gt('day of the week'),
                                65: gt('day of the weekend')
                            }),
                            chooseLabel: function (val) {
                                return this.options['bit_' + val];
                            },
                            initial: 2
                        },
                        month: {
                            options: {
                                0: gt('January'),
                                1: gt('February'),
                                2: gt('March'),
                                3: gt('April'),
                                4: gt('May'),
                                5: gt('June'),
                                6: gt('July'),
                                7: gt('August'),
                                8: gt('September'),
                                9: gt('October'),
                                10: gt('November'),
                                11: gt('December')
                            },
                            initial: 2
                        }
                    })
                };

                this.nodes.typeChoice.append(this.sentences.rectype.$el);

                var endingOptions = {
                    options: {
                        1: gt('never ends'),
                        2: gt('ends on a specific date'),
                        3: gt('ends after a certain number of appointments')
                    },
                    chooseLabel: function () {
                        return gt('ends');
                    }
                };
                this.ends = {
                    never: new ConfigSentence(gt('The series <a href="#" data-attribute="ending" data-widget="options">never ends</a>.'), {
                        id: 'never',
                        tabindex: self.tabindex,
                        ending: _.extend({}, endingOptions, {
                            chooseLabel: function () {
                                return gt('never ends');
                            }
                        })
                    }).on('change:ending', this.endingChanged, this).on('change', this.updateModel, this),
                    date: new ConfigSentence(gt('The series <a href="#" data-attribute="ending" data-widget="options">ends</a> on <a href="#" data-attribute="until" data-widget="datePicker">11/03/2013</a>.'), {
                        id: 'date',
                        tabindex: self.tabindex,
                        ending: endingOptions,
                        model: self.model,
                        initial: function () {
                            //tasks may not have a start date at this point
                            return moment(self.model.get('start_date') || _.now()).add(4, 'weeks').valueOf();
                        }
                    }).on('change:ending', this.endingChanged, this).on('change', this.updateModel, this),
                    after: new ConfigSentence(gt('The series <a href="#" data-attribute="ending" data-widget="options">ends</a> <a href="#" data-attribute="occurrences" data-widget="number">after <span class="number-control">2</span> appointments</a>.'), {
                        id: 'after',
                        tabindex: self.tabindex,
                        ending: endingOptions,
                        occurrences: {
                            phrase: function (n) {
                                n = Math.max(1, n);
                                return gt.format(gt.ngettext(
                                    'after %1$d appointment',
                                    'after %1$d appointments', n), n);
                            },
                            initial: 3,
                            gt: gt
                        }
                    }).on('change:ending', this.endingChanged, this).on('change', this.updateModel, this)
                };

                // Events
                this.controls.checkbox.on('change', function (e) {
                    e.preventDefault();
                    if (self.controls.checkbox.is(':checked')) {
                        if (self.lastConfiguration) {
                            self.model.set(self.lastConfiguration, { validate: true });
                        } else {
                            self.model.set({
                                recurrence_type: RECURRENCE_TYPES.WEEKLY,
                                interval: self.sentences.weekly.interval,
                                days: self.sentences.weekly.days
                            }, { validate: true });
                        }
                        self.showMore();
                    } else {
                        self.updateModel();
                        self.showLess();
                    }
                });

                this.controls.detailToggle.on('click', function (e) {
                    e.preventDefault();
                    self.showLess();
                });

                this.nodes.summary.on('click', function (e) {
                    if (self.controls.checkbox.is(':checked')) {
                        e.preventDefault();
                    }
                    self.toggle();
                });

                _('recurrence_type days month day_in_month interval occurrences until'.split(' ')).each(function (attr) {
                    self.listenTo(self.model, 'change:' + attr, self.updateView);
                });

                this.listenTo(this.model, 'change:start_date', self.updateSuggestions);

                this.updateView();
                this.updateSuggestions();

            },
            setHint: function (string) {
                this.nodes.hint.empty().append($('<small>').text(string));
            },
            updateView: function () {
                if (this.updatingModel) {
                    return;
                }
                this.updatingView = true;

                var self = this,
                    type = this.model.get('recurrence_type');

                if (type === RECURRENCE_TYPES.NO_RECURRENCE) {
                    this.controls.checkbox.prop('checked', false);
                } else {
                    this.controls.checkbox.prop('checked', true);
                    this.lastConfiguration = {};

                    _(['recurrence_type', 'days', 'day_in_month', 'interval', 'occurrences', 'until']).each(function (attr) {
                        if (self.model.isSet(attr)) {
                            self.lastConfiguration[attr] = self.model.get(attr);
                        }
                    });

                    this.nodes.alternative1.children().detach();
                    this.nodes.alternative2.hide().children().detach();

                    this.sentences.rectype.set('recurrenceType', type);

                    switch (type) {
                    case RECURRENCE_TYPES.DAILY:
                        this.nodes.alternative1.append(this.sentences.daily.$el);
                        this.setChoice(this.sentences.daily);
                        this.choice.set('interval', this.model.get('interval') || 1);
                        this.setHint(this.sentences.useLinksHint);
                        break;
                    case RECURRENCE_TYPES.WEEKLY:
                        this.nodes.alternative1.append(this.sentences.weekly.$el);
                        this.setChoice(this.sentences.weekly);
                        if (this.model.isSet('interval')) {
                            this.choice.set('interval', this.model.get('interval'));
                        }
                        if (this.model.isSet('days')) {
                            this.choice.set('days', this.model.get('days'));
                        }
                        this.setHint(this.sentences.useLinksHint);
                        break;
                    case RECURRENCE_TYPES.MONTHLY:
                        this.nodes.alternative1.append(
                            this.createGhost(this.sentences.monthlyDay)
                        );
                        this.nodes.alternative2.show().append(
                            this.createGhost(this.sentences.monthlyDate)
                        );
                        this.setHint(this.sentences.useLinksHint);
                        if (this.model.isSet('days')) {
                            this.setChoice(this.sentences.monthlyDay);
                            this.choice.set('ordinal', this.model.get('day_in_month'));
                            this.choice.set('day', this.model.get('days'));
                            this.choice.set('interval', this.model.get('interval'));
                            this.nodes.alternative1.children().detach();
                            this.nodes.alternative1.append(this.sentences.monthlyDay.$el);
                        } else if (this.model.isSet('day_in_month')) {
                            this.setChoice(this.sentences.monthlyDate);
                            this.choice.set('dayInMonth', this.model.get('day_in_month'));
                            this.choice.set('interval', this.model.get('interval'));
                            this.nodes.alternative2.children().detach();
                            this.nodes.alternative2.show().append(this.sentences.monthlyDate.$el);
                        } else {
                            this.setHint(this.sentences.chooseSentenceHint);
                            this.nodes.alternative1.find('.text-muted').removeClass('text-muted');
                            this.nodes.alternative2.find('.text-muted').removeClass('text-muted');
                            this.setChoice(null);
                        }
                        break;
                    case RECURRENCE_TYPES.YEARLY:
                        this.nodes.alternative1.append(
                            this.createGhost(this.sentences.yearlyDay)
                        );
                        this.nodes.alternative2.show().append(
                            this.createGhost(this.sentences.yearlyDate)
                        );
                        this.setHint(this.sentences.useLinksHint);
                        if (this.model.isSet('days')) {
                            this.setChoice(this.sentences.yearlyDay);
                            this.choice.set('ordinal', this.model.get('day_in_month'));
                            this.choice.set('day', this.model.get('days'));
                            this.choice.set('month', this.model.get('month'));
                            this.nodes.alternative1.children().detach();
                            this.nodes.alternative1.append(this.sentences.yearlyDay.$el);
                        } else if (this.model.isSet('day_in_month')) {
                            this.setChoice(this.sentences.yearlyDate);
                            this.choice.set('month', this.model.get('month'));
                            this.choice.set('dayInMonth', this.model.get('day_in_month'));
                            this.nodes.alternative2.children().detach();
                            this.nodes.alternative2.show().append(this.sentences.yearlyDate.$el);
                        } else {
                            this.setHint(this.sentences.chooseSentenceHint);
                            this.nodes.alternative1.find('.text-muted').removeClass('text-muted');
                            this.nodes.alternative2.find('.text-muted').removeClass('text-muted');
                            this.setChoice(null);
                        }
                        break;
                    }

                    this.nodes.endsChoice.children().detach();
                    if (this.model.get('occurrences')) {
                        this.nodes.endsChoice.append(this.ends.after.$el);
                        this.ends.after.set('occurrences', this.model.get('occurrences'));
                        this.endsChoice = this.ends.after;
                    } else if (this.model.get('until')) {
                        this.nodes.endsChoice.append(this.ends.date.$el);
                        this.ends.date.set('until', this.model.get('until'));
                        this.endsChoice = this.ends.date;
                    } else {
                        this.nodes.endsChoice.append(this.ends.never.$el);
                        this.endsChoice = this.ends.never;
                    }
                    this.updateSummary();
                }

                this.updatingView = false;
            },
            updateSummary: function () {
                var sum;
                this.nodes.summary
                    .empty()
                    .append(
                        $('<span>&nbsp;</span>'),
                        sum = $('<a href="#" tabindex="' + this.tabindex + '">')
                            .css('fontSize', 'small')
                    );
                if (this.model.get('recurrence_type') !== RECURRENCE_TYPES.NO_RECURRENCE) {
                    this.nodes.wrapper.css({ 'display': 'inline-block' });
                    this.nodes.summary.show();
                    sum.append(
                        this.choice.ghost(),
                        (this.choice && this.choice.id === 'no-choice') ? $() : this.endsChoice.ghost(),
                        $('<span>&nbsp;</span>')
                    );
                } else {
                    this.nodes.wrapper.removeAttr('style');
                    this.nodes.summary.hide();
                }
            },
            updateModel: function () {
                if (this.updatingView) {
                    return;
                }
                this.updatingModel = true;

                this.model.unset('recurrence_type');
                this.model.unset('interval');
                this.model.unset('days');
                this.model.unset('day_in_month');
                this.model.unset('month');
                this.model.unset('occurrences');
                this.model.unset('until');

                if (this.controls.checkbox.is(':checked')) {
                    var recType = parseInt(this.sentences.rectype.recurrenceType, 10);

                    switch (recType) {
                    case 1:
                        var daily =  {
                            recurrence_type: recType,
                            interval: this.sentences.daily.interval
                        };
                        this.model.set(daily, { validate: true });
                        break;
                    case 2:
                        var weekly =  {
                            recurrence_type: recType,
                            interval: this.sentences.weekly.interval,
                            days: this.sentences.weekly.days
                        };
                        this.model.set(weekly, { validate: true });
                        break;
                    case 3:
                        var monthly =  {
                            recurrence_type: recType
                        };
                        if (this.choice.id === 'monthlyDate') {
                            _.extend(monthly, {
                                recurrence_type: recType,
                                day_in_month: this.choice.dayInMonth,
                                interval: this.choice.interval
                            });
                        } else {
                            this.setChoice(this.sentences.monthlyDay);
                            _.extend(monthly, {
                                day_in_month: this.choice.ordinal,
                                days: this.choice.day,
                                interval: this.choice.interval
                            });
                        }
                        this.model.set(monthly, { validate: true });
                        break;
                    case 4:
                        var yearly =  {
                            recurrence_type: recType
                        };
                        if (this.choice.id === 'yearlyDate') {
                            _.extend(yearly, {
                                day_in_month: this.choice.dayInMonth,
                                month: this.choice.month,
                                interval: 1
                            });
                        } else {
                            this.setChoice(this.sentences.yearlyDay);
                            _.extend(yearly, {
                                day_in_month: this.choice.ordinal,
                                days: this.choice.day,
                                month: this.choice.month,
                                interval: 1
                            });
                        }

                        this.model.set(yearly, { validate: true });
                        break;
                    default:
                        break;
                    }

                    if (this.endsChoice) {
                        switch (this.endsChoice.id) {
                        case 'never':
                            // remove this when backend bug 24870 is fixed
                            this.model.set({
                                until: null
                            }, { validate: true });
                            // ----
                            break;
                        case 'date':
                            this.model.set({
                                until: this.endsChoice.until
                            }, { validate: true });
                            break;
                        case 'after':
                            if (this.endsChoice.occurrences <= 0) {
                                this.endsChoice.occurrences = 1;
                            }
                            this.model.set({
                                occurrences: this.endsChoice.occurrences
                            }, { validate: true });
                            break;
                        }
                    }
                } else {
                    // No Recurrence
                    this.model.set({ recurrence_type: RECURRENCE_TYPES.NO_RECURRENCE }, { validate: true });
                }
                this.updatingModel = false;
                this.updateView();
            },
            createGhost: function (sentence) {
                var self = this;
                return $('<span class="text-muted" tabindex="' + self.tabindex + '">')
                    .append(sentence.ghost())
                    .on('click keydown', function (e) {
                        // hit space or enter
                        if (e.type === 'click' || (e.type === 'keydown' && (e.which === 13 || e.which === 32))) {
                            e.preventDefault();
                            self.setChoice(sentence);
                            self.updateModel();
                            $('a:first', sentence.$el).focus();
                        }
                    })
                    .css({ cursor: 'pointer' });
            },
            endingChanged: function (sentence) {
                switch (String(sentence.ending)) {
                case '1':
                    this.endsChoice = this.ends.never;
                    break;
                case '2':
                    this.endsChoice = this.ends.date;
                    break;
                case '3':
                    this.endsChoice = this.ends.after;
                    break;
                }
                this.updateModel();
            },
            setChoice: function (sentence) {
                if (this.choice) {
                    this.choice.off('change');
                }
                if (sentence === null) {
                    this.choice = {
                        id: 'no-choice',
                        ghost: function () {
                            return $('<span>').text(gt('Please choose a sentence below.'));
                        },
                        on: $.noop,
                        off: $.noop
                    };
                    return;
                }
                this.choice = sentence;
                this.choice.on('change', this.updateModel, this);
            },
            showMore: function () {
                this.more = true;
                this.nodes.recView.show();
                $('a:first', this.nodes.recView).focus();
                this.updateSummary();
            },
            showLess: function () {
                this.more = false;
                this.nodes.recView.hide();
                this.updateSummary();
                $('a:first', this.nodes.summary).focus();
            },
            toggle: function () {
                if (this.controls.checkbox.is(':checked')) {
                    if (this.more) {
                        this.showLess();
                    } else {
                        this.showMore();
                    }
                }
            },
            updateSuggestions: function () {
                if (!this.model.get('start_date')) {
                    return;
                }
                var self = this,

                    startDate = moment.utc(this.model.get('start_date')).local(true),
                    dayBits = 1 << startDate.day(),
                    dayInMonth = startDate.date(),
                    month = startDate.month(),
                    ordinal = Math.ceil(startDate.date() / 7),

                    canUpdate = function (sentence) {
                        // Don't update the chosen sentence carelessly
                        return sentence !== self.choice;
                    };

                if (this.previousStartDate) {
                    var previousAttributes = {
                        dayBits: 1 << this.previousStartDate.day(),
                        dayInMonth: this.previousStartDate.date(),
                        month: this.previousStartDate.month(),
                        ordinal: Math.ceil(this.previousStartDate.date() / 7)
                    };
                    canUpdate = function (sentence) {
                        if (sentence !== self.choice) {
                            // Not the chosen sentence, so update the suggestion
                            return true;
                        }

                        // Update the current choice only if it was similar to the previously chosen date
                        if (!_.isUndefined(sentence.days) && !(sentence.days & previousAttributes.dayBits)) {
                            return false;
                        }
                        if (!_.isUndefined(sentence.day) &&  (sentence.day !== previousAttributes.dayBits)) {
                            return false;
                        }
                        if (!_.isUndefined(sentence.dayInMonth) && (sentence.dayInMonth !== previousAttributes.dayInMonth)) {
                            return false;
                        }
                        if (!_.isUndefined(sentence.month) && (sentence.month !== previousAttributes.month)) {
                            return false;
                        }
                        if (!_.isUndefined(sentence.ordinal) &&  (sentence.ordinal !== previousAttributes.ordinal)) {
                            return false;
                        }
                        return true;
                    };
                }

                // Weekly
                if (canUpdate(this.sentences.weekly)) {
                    if (!(this.sentences.weekly.days & dayBits)) {
                        this.sentences.weekly.set('days', dayBits);
                    }
                }

                // Monthly
                if (canUpdate(this.sentences.monthlyDay)) {
                    this.sentences.monthlyDay.set('day', dayBits);
                    this.sentences.monthlyDay.set('ordinal', ordinal);
                }

                if (canUpdate(this.sentences.monthlyDate)) {
                    this.sentences.monthlyDate.set('dayInMonth', dayInMonth);
                }

                // Yearly
                if (canUpdate(this.sentences.yearlyDay)) {
                    this.sentences.yearlyDay.set('day', dayBits);
                    this.sentences.yearlyDay.set('ordinal', ordinal);
                    this.sentences.yearlyDay.set('month', month);
                }

                if (canUpdate(this.sentences.yearlyDate)) {
                    this.sentences.yearlyDate.set('dayInMonth', dayInMonth);
                    this.sentences.yearlyDate.set('month', month);
                }

                this.previousStartDate = startDate.clone();

            },
            render: function () {
                // only allow editing recurrence if either master or single appointment.
                // hide it for recurring appointments and exceptions, i.e.
                // if rec_pos is unset or zero
                if (!this.model.get('recurrence_position')) {
                    this.$el.append(
                        this.nodes.wrapper.append(
                            this.controls.checkboxLabel.append(
                                this.controls.checkbox,
                                $.txt(gt('Repeat'))
                            )
                        ),
                        this.nodes.summary,
                        this.nodes.recView.append(
                            this.controls.detailToggle,
                            this.nodes.hint,
                            this.nodes.typeChoice,
                            $('<div>&nbsp;</div>'),
                            this.nodes.alternative1,
                            this.nodes.alternative2,
                            $('<div>&nbsp;</div>'),
                            this.nodes.endsChoice
                        )
                    );
                }
            }
        }, options);
    };

    return RecurrenceView;
});
