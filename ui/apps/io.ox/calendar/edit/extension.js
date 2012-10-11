define("io.ox/calendar/edit/extension", function () {
    "use strict";
    require(["io.ox/core/tk/keys"]);

    var Events = require("io.ox/core/event");
    var KeyListener = require("io.ox/core/tk/keys");
    var gt = require('gettext!io.ox/calendar/edit/main');
    var dateAPI = require("io.ox/core/date");

    var Widgets = {
        toggle: function ($anchor, attribute, options) {
            var self = this;

            self[attribute] = 0;
            $anchor.text(options.values[self.value]);

            $anchor.on("click", function () {
                var newValue = (self.value === 0) ? 1 : 0;
                self[attribute] = newValue;
                self.trigger("change", self);
                self.trigger("change:" + attribute, self);
            });

            function drawState() {
                $anchor.text(options.values[self[attribute]]);
                self.trigger("redraw", self);
            }

            drawState();
            this.on('change:' + attribute, drawState);
        },
        number: function ($anchor, attribute, options) {
            var self = this;

            var originalContent = $anchor.html();

            self[attribute] = options.initial;

            function drawState() {
                var value = self[attribute];
                $anchor.text(gt.format(gt.ngettext(options.singular, options.plural, value), gt.noI18n(value)));
                self.trigger("redraw", self);
            }

            $anchor.on('click', function () {
                var $numberInput = $('<input type="text">').css({
                    width: '1em',
                    marginBottom: 0
                }).val(self[attribute]);
                var keys = new KeyListener($numberInput);


                var $content = $("<span>" + originalContent + "</span>");
                $content.find('.number-control').empty().append(
                    $numberInput
                );
                $anchor.after($content);
                $anchor.hide();

                $numberInput.select();
                keys.include();

                // TODO: Allow only number entries

                // On change
                function updateValue() {
                    var value = parseInt($numberInput.val(), 10);
                    if (!isNaN(value)) {
                        self[attribute] = value;
                        self.trigger("change", self);
                        self.trigger("change:" + attribute, self);
                    }
                    keys.destroy();
                    try {
                        $content.remove();
                    } catch (e) { }
                    $anchor.show();

                }
                $numberInput.on("blur", function () {
                    updateValue();
                });

                // Enter
                $numberInput.on("enter", function () {
                    updateValue();
                });

                // Escape
                keys.on("esc", function () {
                    $numberInput.val(self[attribute]);
                    keys.destroy();
                    try {
                        $content.remove();
                    } catch (e) { }
                    $anchor.show();
                });
            });

            drawState();

            this.on("change:" + attribute, drawState);
        },
        options: function ($anchor, attribute, options) {
            // First we need to wrap the anchor
            var self = this;
            self[attribute] = options.initial;

            var $container = $('<span class="dropdown">');
            $anchor.after($container);
            $container.append($anchor);

            function drawState() {
                var label = options.options[self[attribute]];
                if (options.chooseLabel) {
                    label = options.chooseLabel(self[attribute]);
                }
                $anchor.text(label);
                self.trigger("redraw", self);
            }

            // Now build the menu
            var $menu = $('<ul class="dropdown-menu">');
            _(options.options).each(function (label, value) {
                $menu.append(
                    $('<li>').append(
                        $('<a href="#">').text(label).on("click", function () {
                            self[attribute] = value;
                            self.trigger("change", self);
                            self.trigger("change:" + attribute, self);
                        })
                    )
                );
            });
            $container.append($menu);

            // Tell the anchor that it triggers the dropdown
            $anchor.attr({
                'data-toggle': 'dropdown'
            });

            $anchor.dropdown();

            drawState();

            this.on("change:" + attribute, drawState);

        },
        custom: function ($anchor, attribute, options) {
            options.call(this, $anchor, attribute, options);
        }
    };

    function ConfigSentence(sentence, options) {
        options = options || {};
        var self = this;
        _.extend(this, Backbone.Events);
        this.$el = $('<span>').html(sentence);
        this.$el.find('a').each(function () {
            var $anchor = $(this);

            var attribute = $anchor.data("attribute") || 'value';
            var widget = $anchor.data("widget");
            var opts = options[attribute] || options;
            // TODO: Use ExtensionPoints here
            if (Widgets[widget]) {
                Widgets[widget].call(self, $anchor, attribute, opts);
            }
        });

        this.set = function (key, value) {
            this[key] = value;
            this.trigger("change", this);
            this.trigger("change:" + key, this);
        };

        this.id = options.id;

    }

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
        SATURDAY: 64
    };
    // Usage: DAYS.pack('monday', 'wednesday', 'friday') -> some bitmask
    DAYS.pack = function () {
        var result = 0;
        _(arguments).each(function (day) {
            var dayConst = DAYS[day.toUpperCase()];

            if (_.isUndefined(dayConst)) {
                throw "Invalid day: " + day;
            }
            result = result | dayConst;
        });
        return result;
    };

    // Usage: DAYS.unpack(bitmask) -> {'MONDAY': 1, 'WEDNESDAY': 1, 'FRIDAY': 1}
    DAYS.unpack = function (bitmask) {
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
    };

    DAYS.values = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

    var CalendarWidgets = {
        dayInMonth: function ($anchor, attribute, options) {
            var self = this;
            var $dayPicker = $('<table>');
            var $row;

            function clickHandler(i) {
                return function () {
                    self[attribute] = i;
                    $anchor.popover("hide");
                    self.trigger("change", self);
                    self.trigger("change:" + attribute, self);
                };
            }

            for (var i = 1; i < 32; i++) {
                if (!$row) {
                    $row = $('<tr>').appendTo($dayPicker);
                }

                $row.append(
                    $('<td>').append(
                        $('<a href="#">').text(i).on('click', clickHandler(i)).css({marginRight: "11px"})
                    )
                );

                if (i % 7 === 0) {
                    $row = null;
                }
            }

            function drawState() {
                $anchor.text(self[attribute]);
                self.trigger("redraw", self);
            }

            $anchor.popover({
                placement: 'top',
                content: function () {
                    return $dayPicker;
                }
            });

            drawState();

            this.on("change:" + attribute, drawState);
        },

        days: function ($anchor, attribute, options) {
            // TODO: Modal close. But how?!?
            var self = this;
            var $dayList = $('<ul class="io-ox-recurrence-day-picker">');
            var nodes = {};

            this[attribute] = 1;

            _(DAYS.values).each(function (day) {
                nodes[day] = $('<li>').append(
                    $('<b>').text(day.toLowerCase()).hide(),
                    $('<span>').text(day.toLowerCase()).hide()
                ).on("click", function () {
                    var bitmask = self[attribute];
                    bitmask = bitmask ^ DAYS[day];
                    if (bitmask) {
                        self[attribute] = bitmask;
                        self.trigger("change", self);
                        self.trigger("change:" + attribute, self);
                    }
                }).appendTo($dayList);
            });

            $dayList.append($('<li>').append(
                "close",
                $('<i class="icon-remove">')
            ).on("click", function () {
                $anchor.popover('hide');
            }).css({
                marginTop: "11px",
                fontStyle: 'italic'
            }));

            function drawState() {
                var value = DAYS.unpack(self[attribute]);
                _(nodes).each(function (node, day) {
                    if (value[day]) {
                        node.find('b').show();
                        node.find('span').hide();
                    } else {
                        node.find('b').hide();
                        node.find('span').show();
                    }
                });
                var selectedDays = [];
                _(DAYS.values).each(function (day) {
                    if (value[day]) {
                        selectedDays.push(day.toLowerCase());
                    }
                });
                $anchor.text(selectedDays.join(", "));
                self.trigger("redraw", self);
            }

            $anchor.popover({
                placement: 'top',
                content: function () {
                    return $dayList;
                }
            });

            drawState();

            this.on("change:" + attribute, drawState);
        },
        dateFormat: dateAPI.getFormat(dateAPI.DATE).replace(/\by\b/, 'yyyy').toLowerCase(),
        datePicker: function ($anchor, attribute, options) {
            var self = this;
            var originalContent = $anchor.html();
            self[attribute] = options.initial || _.now();

            function renderDate() {
                var value = self[attribute];
                if (value) {
                    var myTime = dateAPI.Local.localTime(parseInt(value, 10));
                    if (_.isNull(myTime)) {
                        value = '';
                    } else {
                        value = new dateAPI.Local(myTime).format(dateAPI.DATE);
                    }
                } else {
                    value = '';
                }
                return value;
            }

            function drawState() {
                var value = renderDate();
                $anchor.text(value);
                self.trigger("redraw", self);
            }

            $anchor.on('click', function () {
                var $dateInput = $('<input type="text" class="input-small">').css({
                    marginBottom: 0
                }).val(renderDate());
                var keys = new KeyListener($dateInput);

                $dateInput.datepicker({format: CalendarWidgets.dateFormat});

                $anchor.after($dateInput);
                $anchor.hide();

                $dateInput.select();
                keys.include();

                // On change
                function updateValue() {
                    var value = dateAPI.Local.parse($dateInput.val(), dateAPI.DATE);
                    if (!_.isNull(value) && value.getTime() !== 0) {
                        self[attribute] = dateAPI.Local.utc(value.getTime());
                        self.trigger("change", self);
                        self.trigger("change:" + attribute, self);
                    }
                    keys.destroy();
                    try {
                        $dateInput.datepicker("hide");
                        $dateInput.remove();
                    } catch (e) { }
                    $anchor.show();

                }
                $dateInput.on("change", function () {
                    updateValue();
                });

                // Enter
                $dateInput.on("enter", function () {
                    updateValue();
                });

                // Escape
                keys.on("esc", function () {
                    $dateInput.val(self[attribute]);
                    keys.destroy();
                    try {
                        $dateInput.remove();
                    } catch (e) { }
                    $anchor.show();
                });
            });

            drawState();

            this.on("change:" + attribute, drawState);
        }
    };

    return {
        init: function () {
            var self = this;
            window.$appointment = this.model;

            this.sentence = new ConfigSentence('This appointment <a  data-widget="toggle">is not repeated</a>', {
                values: ["is not repeated", "is repeated"]
            });

            this.sentences = {
                daily: new ConfigSentence(' <a href="#"  data-widget="number" data-attribute="interval">every <span class="number-control">2</span> days</a>', {
                    id: 'daily',
                    singular: "every day",
                    plural: "every %1$d days",
                    initial: 1
                }),
                weekly: new ConfigSentence(' <a href="#"  data-widget="number" data-attribute="interval">every <span class="number-control">2</span> weeks</a> on <a href="#"  data-widget="custom" data-attribute="days">monday</a>', {
                    id: 'weekly',
                    interval: {
                        singular: "every week",
                        plural: "every %1$d weeks",
                        initial: 1
                    },
                    days: CalendarWidgets.days
                }),
                monthlyDate: new ConfigSentence(' on day <a href="#"  data-widget="custom" data-attribute="dayInMonth">10</a> <a href="#"  data-widget="number" data-attribute="interval">every <span class="number-control">2</span> months</a>', {
                    id: 'monthlyDate',
                    interval: {
                        singular: "every month",
                        plural: "every %1$d months",
                        initial: 1
                    },
                    dayInMonth: CalendarWidgets.dayInMonth
                }),
                monthlyDay: new ConfigSentence(' the <a href="#" data-widget="options" data-attribute="ordinal">second</a> <a href="#" data-widget="options" data-attribute="day">wednesday</a> <a href="#" data-widget="number" data-attribute="interval">every <span class="number-control">2</span> months</a>', {
                    id: 'monthlyDay',
                    ordinal: {
                        options: {
                            1: "first",
                            2: "second",
                            3: "third",
                            4: "fourth",
                            5: "last"
                        }
                    },
                    day: {
                        options: {
                            1: "sunday",
                            2: "monday",
                            4: "tuesday",
                            8: "wednesday",
                            16: "thursday",
                            32: "friday",
                            64: "saturday",
                            62: "day of the week",
                            65: "day of the weekend"
                        },
                        initial: 2
                    },
                    interval: {
                        singular: "every month",
                        plural: "every %1$d months",
                        initial: 1
                    }
                }),
                yearlyDate: new ConfigSentence(' every year on day <a href="#"  data-widget="custom" data-attribute="dayInMonth">10</a> of <a href="#" data-widget="options" data-attribute="month">october</a>', {
                    id: 'yearlyDate',
                    dayInMonth: CalendarWidgets.dayInMonth,
                    month: {
                        options: {
                            0: "january",
                            1: "february",
                            2: "march",
                            3: "april",
                            4: "may",
                            5: "june",
                            6: "july",
                            7: "august",
                            8: "september",
                            9: "october",
                            10: "november",
                            11: "december"
                        },
                        initial: 2
                    }
                }),
                yearlyDay: new ConfigSentence(' every <a href="#" data-widget="options" data-attribute="ordinal">first</a> <a href="#" data-widget="options" data-attribute="day">wednesday</a> in <a href="#" data-widget="options" data-attribute="month">october</a>', {
                    id: 'yearlyDay',
                    ordinal: {
                        options: {
                            1: "first",
                            2: "second",
                            3: "third",
                            4: "fourth",
                            5: "last"
                        }
                    },
                    day: {
                        options: {
                            1: "sunday",
                            2: "monday",
                            4: "tuesday",
                            8: "wednesday",
                            16: "thursday",
                            32: "friday",
                            64: "saturday",
                            62: "day of the week",
                            65: "day of the weekend"
                        },
                        initial: 2
                    },
                    month: {
                        options: {
                            0: "january",
                            1: "february",
                            2: "march",
                            3: "april",
                            4: "may",
                            5: "june",
                            6: "july",
                            7: "august",
                            8: "september",
                            9: "october",
                            10: "november",
                            11: "december"
                        },
                        initial: 2
                    }
                })
            };

            var endingOptions = {
                options: {
                    1: 'never ends',
                    2: 'ends on a specific date',
                    3: 'ends after a certain number of appointments'
                },
                chooseLabel: function (value) {
                    return 'ends';
                }
            };

            this.ends = {
                never: new ConfigSentence('The series <a href="#" data-attribute="ending" data-widget="options">never ends</a>.', {
                    id: 'never',
                    ending: _.extend({}, endingOptions, {
                        chooseLabel: function (value) {
                            return 'never ends';
                        }
                    })
                }),
                date: new ConfigSentence('The series <a href="#" data-attribute="ending" data-widget="options">ends</a> on <a href="#" data-attribute="until" data-widget="custom">11/03/2013</a>.', {
                    id: 'date',
                    ending: endingOptions,
                    until: CalendarWidgets.datePicker
                }),
                after: new ConfigSentence('The series <a href="#" data-attribute="ending" data-widget="options">ends</a> <a href="#" data-attribute="occurrences" data-widget="number">after <span class="number-control">2</span> appointments</a>.', {
                    id: 'after',
                    ending: endingOptions,
                    occurrences: {
                        singular: 'after %1$d appointment',
                        plural: 'after %1$d appointments',
                        initial: 3
                    }
                })
            };

            _(this.ends).each(function (sentence) {
                sentence.on("change:ending", function () {
                    var choice = sentence.ending;
                    _(this.ends).each(function (otherSentence) {
                        if (otherSentence !== sentence) {
                            otherSentence.set('ending', choice);
                        }
                    });
                    switch (choice) {
                    case "1":
                        self.setEnding(self.ends.never);
                        break;
                    case "2":
                        self.setEnding(self.ends.date);
                        break;
                    case "3":
                        self.setEnding(self.ends.after);
                        break;
                    }

                    self.updateEndsSpan();
                });
            });

            this.endsChoice = null;

            this.nodes = {};

            this.nodes.optionList = $('<dl>');

            function prepareMenuEl(sentence) {
                var $el = sentence.$el.clone();
                $el.find('*').off();

                $el.on('mouseenter', function () {
                    var $ghost = sentence.$el.clone();
                    $ghost.css({
                        fontStyle: 'italic'
                    });
                    $el.css({
                        textDecoration: 'underline'
                    });
                    if (self.choice) {
                        self.choice.$el.detach();
                    }
                    self.nodes.recurrenceSpan.empty().append($ghost);
                });
                $el.on('mouseleave', function () {
                    self.nodes.recurrenceSpan.empty();
                    self.updateRecurrenceSpan();
                    self.updateOptionListState();

                    $el.css({
                        textDecoration: 'none'
                    });
                });
                $el.on('click', function () {
                    self.setChoice(sentence);
                    self.nodes.recurrenceSpan.empty().append(sentence.$el);
                    self.userWantsOptionList = false;
                    self.updateOptionListState();
                    self.updateEndsSpan();
                });

                return $el;
            }

            function options() {
                var $ul = $('<ul class="io-ox-recurrence-type-choice">');
                _(arguments).each(function (sentence) {
                    var $el = prepareMenuEl(sentence);
                    var $li = $("<li>").append(
                        $el
                    );

                    sentence.on('redraw', function () {
                        $li.empty().append(prepareMenuEl(sentence));
                    });

                    $ul.append(
                        $li
                    );
                });
                return $('<dd>').append($ul);
            }

            this.nodes.optionList.append(
                $('<dt>').text("Daily"),
                options(this.sentences.daily),
                $('<dt>').text("Weekly"),
                options(this.sentences.weekly),
                $('<dt>').text("Monthly"),
                options(
                    this.sentences.monthlyDate,
                    this.sentences.monthlyDay
                ),
                $('<dt>').text("Yearly"),
                options(
                    this.sentences.yearlyDate,
                    this.sentences.yearlyDay
                )
            );
            this.nodes.optionList.hide();
            this.nodes.showMore = $('<a href="#">').text("More");
            this.nodes.showMore.hide();
            this.optionListVisible = false;
            this.userWantsOptionList = false;

            this.nodes.showMore.on('click', function () {
                self.userWantsOptionList = !self.userWantsOptionList;
                self.updateOptionListState();
            });

            this.updateOptionListState();

            this.nodes.recurrenceSpan = $('<span>');

            this.sentence.on("change", function () {
                self.updateRecurrenceSpan();
                self.updateOptionListState();
                self.updateEndsSpan();
            });

            this.nodes.endsSpan = $('<span>');
            self.updateEndsSpan();

            _("recurrence_type days month day_in_month interval occurrences until".split(" ")).each(function (attr) {
                self.observeModel("change:" + attr, self.updateState, self);
            });

            self.observeModel("change:start_date", self.updateSuggestions, self);
            self.updateSuggestions();

        },
        updateSuggestions: function () {
            var startDate = new dateAPI.Local(dateAPI.Local.utc(this.model.get("start_date")));
            window.$startDate = startDate;

        },
        updateRecurrenceSpan: function () {
            if (this.sentence.value === 0) {
                this.oldChoice = this.choice;
                this.setChoice(null);
            } else {
                if (!this.choice) {
                    this.setChoice(this.oldChoice);
                }
            }
            if (this.choice) {
                this.nodes.recurrenceSpan.append(this.choice.$el);
            } else {
                this.nodes.recurrenceSpan.find("span:first").detach();
            }
        },
        updateOptionListState: function () {
            if (this.sentence.value === 1) {
                if (!this.choice) {
                    // List, No button
                    this.nodes.optionList.show();
                    this.optionListVisible = true;
                    this.nodes.showMore.hide();
                } else {
                    if (this.userWantsOptionList) {
                        if (!this.optionListVisible) {
                            this.nodes.optionList.show();
                            this.optionListVisible = true;
                        }
                        this.nodes.showMore.show();
                    } else {
                        if (this.optionListVisible) {
                            this.nodes.optionList.hide();
                            this.optionListVisible = false;
                        }
                        this.nodes.showMore.show();
                    }
                }
            } else {
                // No List, No Button
                this.nodes.optionList.hide();
                this.optionListVisible = false;
                this.nodes.showMore.hide();
            }
            if (this.optionListVisible) {
                this.nodes.showMore.text("Hide options");
            } else {
                this.nodes.showMore.text("More options");
            }
        },
        updateEndsSpan: function () {
            this.nodes.endsSpan.find("span:first").detach();
            if (this.choice) {
                if (!this.endsChoice) {
                    this.setEnding(this.ends.never);
                }
                this.nodes.endsSpan.append(this.endsChoice.$el);
            } else {
                if (this.endsChoice) {
                    this.setEnding(null);
                }
            }
        },
        updateState: function () {
            if (this.updatingModel) {
                return;
            }
            this.updatingState = true;
            var type = this.model.get('recurrence_type');
            if (type === RECURRENCE_TYPES.NO_RECURRENCE) {
                this.sentence.set('value', 0);
            } else {
                // Choose and configure the correct type of sentence to represent this recurrence
                switch (type) {
                case RECURRENCE_TYPES.DAILY:
                    this.setChoice(this.sentences.daily);
                    this.choice.set('interval', this.model.get('interval'));
                    break;
                case RECURRENCE_TYPES.WEEKLY:
                    this.setChoice(this.sentences.weekly);
                    this.choice.set('interval', this.model.get('interval'));
                    this.choice.set('days', this.model.get('days'));
                    break;
                case RECURRENCE_TYPES.MONTHLY:
                    if (this.model.get("days")) {
                        this.setChoice(this.sentences.monthlyDay);
                        this.choice.set("ordinal", this.model.get("day_in_month"));
                        this.choice.set("day", this.model.get("days"));
                        this.choice.set("interval", this.model.get("interval"));
                    } else {
                        this.setChoice(this.sentences.monthlyDate);
                        this.choice.set("dayInMonth", this.model.get("day_in_month"));
                        this.choice.set("interval", this.model.get("interval"));
                    }
                    break;
                case RECURRENCE_TYPES.YEARLY:
                    if (this.model.get("days")) {
                        this.choice = this.sentences.yearlyDay;
                        this.choice.set("ordinal", this.model.get("day_in_month"));
                        this.choice.set("day", this.model.get("days"));
                        this.choice.set("month", this.model.get("month"));
                    } else {
                        this.setChoice(this.sentences.yearlyDate);
                        this.choice.set("month", this.model.get("month"));
                        this.choice.set("dayInMonth", this.model.get("day_in_month"));
                    }
                    break;

                }

                if (this.model.get('occurrences')) {
                    this.setEnding(this.ends.after);
                    this.endsChoice.set('occurrences', this.model.get("occurrences"));
                } else if (this.model.get('until')) {
                    this.setEnding(this.ends.date);
                    this.endsChoice.set("until", this.model.get("until"));
                } else {
                    this.setEnding(this.ends.never);
                }

                this.sentence.set('value', 1);
            }

            this.updateOptionListState();
            this.updateRecurrenceSpan();
            this.updateEndsSpan();

            this.updatingState = false;
        },
        updateModel: function () {
            if (this.updatingState) {
                return;
            }
            this.updatingModel = true;
            var blankSlate = {
                recurrence_type: RECURRENCE_TYPES.NO_RECURRENCE,
                interval: null,
                days: null,
                day_in_month: null,
                month: null
            };

            if (this.choice) {
                switch (this.choice.id) {
                case "daily":
                    var daily = _.extend({}, blankSlate, {
                        recurrence_type: RECURRENCE_TYPES.DAILY,
                        interval: this.choice.interval
                    });
                    this.model.set(daily);
                    break;
                case "weekly":
                    var weekly = _.extend({}, blankSlate, {
                        recurrence_type: RECURRENCE_TYPES.WEEKLY,
                        interval: this.choice.interval,
                        days: this.choice.days
                    });
                    this.model.set(weekly);
                    break;
                case "monthlyDay":
                    var monthly = _.extend({}, blankSlate, {
                        recurrence_type: RECURRENCE_TYPES.MONTHLY,
                        day_in_month: this.choice.ordinal,
                        days: this.choice.day,
                        interval: this.choice.interval
                    });
                    this.model.set(monthly);
                    break;
                case "monthlyDate":
                    var monthly = _.extend({}, blankSlate, {
                        recurrence_type: RECURRENCE_TYPES.MONTHLY,
                        day_in_month: this.choice.dayInMonth,
                        interval: this.choice.interval
                    });
                    this.model.set(monthly);
                    break;
                case "yearlyDay":
                    var yearly = _.extend({}, blankSlate, {
                        recurrence_type: RECURRENCE_TYPES.YEARLY,
                        day_in_month: this.choice.ordinal,
                        days: this.choice.day,
                        month: this.choice.month,
                        interval: 1
                    });
                    this.model.set(yearly);
                    break;
                case "yearlyDate":
                    var yearly = _.extend({}, blankSlate, {
                        recurrence_type: RECURRENCE_TYPES.YEARLY,
                        day_in_month: this.choice.dayInMonth,
                        month: this.choice.month,
                        interval: 1
                    });
                    this.model.set(yearly);
                    break;
                }
                if (this.endsChoice) {
                    switch (this.endsChoice.id) {
                    case "never":
                        this.model.set({
                            occurrences: null,
                            until: null
                        });
                        break;
                    case "date":
                        this.model.set({
                            occurrences: null,
                            until: this.endsChoice.until
                        });
                        break;
                    case "after":
                        this.model.set({
                            occurrences: this.endsChoice.occurrences,
                            until: null
                        });
                        break;
                    }
                }
            } else {
                // No Recurrence
                this.model.set(blankSlate);
                this.model.set({
                    occurrences: null,
                    until: null
                });
            }

            this.updatingModel = false;
        },
        setChoice: function (sentence) {
            if (this.choice) {
                this.choice.off("change", this.updateModel, this);
            }
            this.choice = sentence;
            if (this.choice) {
                this.choice.on("change", this.updateModel, this);
            }
            this.updateModel();
        },
        setEnding: function (sentence) {
            if (this.endsChoice) {
                this.endsChoice.off("change", this.updateModel, this);
            }
            this.endsChoice = sentence;
            if (this.endsChoice) {
                this.endsChoice.on("change", this.updateModel, this);
            }
            this.updateModel();
        },
        render: function () {
            var self = this;
            this.$el.append(
                this.sentence.$el,
                this.nodes.recurrenceSpan,
                $.txt(". "),
                this.nodes.endsSpan,
                "<br>",
                $('<small class="muted">').append(
                    this.nodes.showMore
                )
            );

            this.$el.append($('<small>').append(this.nodes.optionList));

            this.updateState();
        }
    };
});
